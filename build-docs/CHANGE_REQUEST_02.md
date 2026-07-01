# Change Request 02 — Persistence fix + card corrections

> The bot is live but a redeploy wiped every character. Fix that first (P0) — it's a data-loss bug. Then apply the three card fixes (P1). Run migrations on startup so nothing else breaks.

---

## P0 — Characters disappear on redeploy (CRITICAL)

**Root cause:** Railway's container filesystem is ephemeral. The SQLite file is being written into the app directory (likely `./eem.db` under `/app`), which is rebuilt on every deploy, so the DB is destroyed each time. The fix is a persistent **volume**. Two known traps make a naive volume setup keep failing — investigate for both.

### Investigate (confirm before changing code)
1. **Log the real DB path.** At startup, print `path.resolve(DATABASE_PATH)`. Confirm today's value resolves under `/app` (ephemeral), which explains the wipe.
2. **Is a volume attached?** Check the Railway service — most likely there is no volume yet, or it isn't mounted at the DB path.
3. **Trap A — write timing.** Volumes mount at container **start**, not during build or pre-deploy. Make sure the DB file is opened/created at runtime startup, not at build time. A DB created during build won't land on the volume.
4. **Trap B — write permissions.** Railway mounts volumes as **root**. If the container runs as a non-root user, it can't write to the volume and silently falls back / fails. Check the run user.

### Fix
1. **Railway dashboard:** add a Volume to the bot service, mount path **`/data`** (Command Palette ⌘K → create volume, or right-click the canvas; or `railway volume` via CLI).
2. **Set a service variable:** `DATABASE_PATH=/data/eem.db`.
3. **If the container runs as non-root**, set service variable `RAILWAY_RUN_UID=0` so it can write to the volume.
4. **Code — `db.ts`:** resolve the path from env, make the directory, open at runtime, and log it:
   ```ts
   import fs from 'node:fs';
   import path from 'node:path';
   import Database from 'better-sqlite3';

   const dbPath = process.env.DATABASE_PATH ?? './eem.db'; // local dev default
   const abs = path.resolve(dbPath);
   fs.mkdirSync(path.dirname(abs), { recursive: true });    // ensure /data exists
   console.log(`[db] opening SQLite at ${abs}`);
   export const db = new Database(dbPath);
   ```
   Confirm schema init + `migrate()` run against this connection on startup so a fresh volume DB gets its tables.

### Verify
1. Deploy; confirm the startup log shows `/data/eem.db`.
2. Create a character → redeploy → it persists → redeploy again → still there.
3. Optional: `railway volume browse` and confirm `eem.db` sits on the volume.

### Data note
The characters lost in the wipe are gone — the ephemeral DB that held them no longer exists. **Recreate them only after persistence is verified**, so it's a one-time redo, not twice.

### Optional hardening (recommended, low effort)
Add a GM-only `/gm export` command that dumps all characters as JSON to the channel (or a file). That gives you an off-volume backup you can paste back if a volume ever misbehaves again. (Heavier alternative: Litestream streaming the SQLite WAL to S3 for continuous backup — not needed for a family game.)

---

## P1 — Card fixes (bundle, low risk)

### 1. Stray "()" after the name
When `pronouns` is empty (the default), the title renders `Name ()`. In `embeds.ts`, only append pronouns when present:
```ts
const displayName = c.pronouns?.trim()
  ? `${c.name} (${c.pronouns.trim()})`
  : c.name;
```
**Pass:** a character with no pronouns shows just the name; one with pronouns still shows `Name (they/them)`.

### 2. Remove the Defend button (keep the Defense stat)
Defense is a passive value that modifies the *attacker's* roll, so it shouldn't be a button. Remove the **Defend** button from the component rows in `embeds.ts`, and remove `defend` from the valid roll keys / the `roll:*` handler. **Keep** the `defense` column and its display in the vitals field, and keep the **Attack** button.
**Pass:** no Defend button on the card; Attack still works; Defense still shows as a number.

### 3. Add a "Block" combat stat (integer)
A simple integer referenced in combat — not a roll (no button for now).
- **Schema:** add `block INTEGER DEFAULT 0` to the `CREATE TABLE` (fresh DBs) **and** add an idempotent migration in `migrate()` (check `PRAGMA table_info(characters)`, then `ALTER TABLE characters ADD COLUMN block INTEGER DEFAULT 0`).
- **Card:** display `Block` in the vitals row, next to Defense (mirrors the sheet, where Block sits under Defense).
- **GM edit:** add Block to the edit form. The `combat` field group is currently full at the 5-input modal cap, and it duplicates `courage_max`/`courage_current` (which also live in the `vitals` group). **Redefine the `combat` group as `{ dread_die, attack, defense, block }`** (4 inputs) — the two courage fields stay editable via the `vitals` group. This adds Block without exceeding Discord's 5-inputs-per-modal limit.
**Pass:** Block shows on the card, defaults to 0, and is editable via `/gm edit` → combat; existing characters get the column via migration without data loss.

---

## Suggested order
1. P0 investigate → fix → **verify persistence**.
2. Recreate the lost characters.
3. P1 fixes 1–3 (bundle), deploy, re-run the relevant items from the test plan (esp. test 8 redeploy survival, test 7 GM edits, test 1 stale card).
