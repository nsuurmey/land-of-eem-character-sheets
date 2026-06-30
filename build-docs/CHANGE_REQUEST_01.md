# Change Request 01 — Multiple characters per user + PC/NPC kinds

> The bot is live. Apply these edits to the existing codebase from `BUILD_SPEC.md`. Don't redesign anything else. Run the migration on startup so existing data is preserved.

## Goal

Each Discord user can own **multiple** characters. Support two kinds: `pc` and `npc`. Target layout:
- GM (you): 2 NPCs + 1 kid's PC = 3 characters, all owned by the GM's user id.
- Other adult: 1 kid's PC.

## 1. Migration (run on startup, idempotent)

In `db.ts`, after schema init, run a `migrate()`:
- Drop the uniqueness constraint that blocked multiple characters:
  `DROP INDEX IF EXISTS idx_char_owner;`
  then recreate it **non-unique**:
  `CREATE INDEX IF NOT EXISTS idx_char_owner ON characters(guild_id, owner_user_id);`
- Add the kind column only if missing (check `PRAGMA table_info(characters)` first to avoid an error on re-run):
  `ALTER TABLE characters ADD COLUMN kind TEXT DEFAULT 'pc';`  -- 'pc' | 'npc'

No table rebuild is needed; both operations are safe on a populated SQLite DB.

## 2. Data helpers (`db.ts`)

- Replace any "one character per user" assumption.
- Add `getCharsByOwner(guildId, userId)` → array.
- Add `getAllChars(guildId)` → array (GM scope).
- Keep `getCharById(id)`.
- `createChar` now accepts `kind` (default `'pc'`).

## 3. `/character create`

- Remove the "you already have a character" block — allow multiple.
- Add an option `kind` with choices `pc` / `npc` (default `pc`). Only the GM may pass `npc`; if a non-GM passes `npc`, coerce to `pc`.
- Owner stays the creator's user id. (You create both NPCs and the kid's PC under your own account; the other adult creates their kid's PC under theirs.)

## 4. Character resolution + autocomplete

Add a string option `character` to `/sheet` (and `/gm show`) with `.setAutocomplete(true)`.

Autocomplete handler:
- Source list = invoker's own characters; if invoker is GM, source = **all** characters in the guild (prefix NPC names with `NPC: ` in the shown label so they're easy to spot).
- Filter by the typed substring (case-insensitive), return up to 25 `{ name: label, value: String(charId) }`.

`/sheet` execute:
- If `character` is provided, load by id (from the autocomplete value) and verify the invoker may view it (own character, or GM). 
- If not provided: fetch invoker's characters. If exactly one → post its card. If more than one → reply ephemerally with a String Select menu (`customId = pick:<n/a>`, options carry each `charId`); on select, post that card publicly.
- If none → ephemeral prompt to run `/character create`.

`/gm show user:@member [character]` (GM only): same pattern over that member's characters.

## 5. New customId

| Action | customId |
| --- | --- |
| pick a character from the select menu | `pick:<charId>` → renders that card publicly |

Add a handler that decodes `pick:<charId>`, loads the character, and replies with `buildCharacterCard`.

## 6. Card rendering (`embeds.ts`)

- When `c.kind === 'npc'`, append a small ` · NPC` tag to the description line so NPC cards are visually distinct from PCs.
- No other layout change.

## 7. Permissions (unchanged, confirm still correct)

Roll buttons: allowed if `interaction.user.id === char.owner_user_id` OR `isGM`. Since NPCs are owned by the GM, only the GM can roll them — no extra code needed. A non-owner pressing a roll on someone else's PC still gets the ephemeral refusal.

## 8. Acceptance

- [ ] Migration runs cleanly against the existing DB; no data lost; re-running startup doesn't error.
- [ ] One user can create and keep 3 characters.
- [ ] `/sheet` with a single character shows it directly; with multiple, shows a picker.
- [ ] `/sheet` autocomplete lists the invoker's characters (GM: all, NPCs flagged).
- [ ] GM can create an NPC; its card shows the NPC tag; only the GM can roll it.
- [ ] A non-owner still cannot roll someone else's PC.
