# Land of Eem Discord Bot — Build Spec (Phase 1)

> Hand this file to Claude Code in an empty repo. Implement sections in the order given. This spec is meant to be followed literally; do not redesign. Where a value is marked CONFIRM, leave the default and add a `// CONFIRM` comment.

## 0. Scope

**Phase 1 (build this now):** a Discord bot that stores *Land of Eem* character sheets and exposes each as a card (embed + buttons) in chat. Players tap buttons to roll; rolls post **publicly** to the channel with a pre-resolved result band so the GM adjudicates the fiction. Only the GM can edit cards.

**Phase 2 (do NOT build yet — see §11):** clocks, game-state tracking, recap, stall nudges, vote tallies. Same codebase. Leave clean extension points; don't stub UI for these.

This bot owns **mechanics only**. Narrative/NPC generation stays in a separate Claude Project. The bot never calls an LLM.

## 1. Stack (pinned)

- Runtime: **Node 20 LTS**, TypeScript.
- Discord: **discord.js v14** (`discord.js`). Use `EmbedBuilder`, `ActionRowBuilder`, `ButtonBuilder`, `StringSelectMenuBuilder`, `ModalBuilder`, `TextInputBuilder`, `REST`, `Routes`.
- DB: **better-sqlite3** (synchronous, single-file, zero-config).
- Config: **dotenv**.
- Dev: `tsx` for running TS directly; `typescript` for typecheck.

Gateway intents: **`GatewayIntentBits.Guilds` only.** Do NOT request `MessageContent` or any privileged intent — everything runs through slash commands and message components, so it isn't needed.

A Discord bot holds a persistent gateway websocket, so it **cannot** run on serverless/Lambda. Host on an always-on process (Railway, Fly.io, Render background worker, a small VPS, or a Raspberry Pi). See §10.

## 2. Repo layout

```
eem-bot/
  src/
    index.ts              # client bootstrap + interaction router
    config.ts             # env loading, GM lookup
    db.ts                 # better-sqlite3 connection + schema init + CRUD
    roll.ts               # pure roll engine (unit-testable, no Discord imports)
    embeds.ts             # character row -> EmbedBuilder + button rows
    handlers/
      character.ts        # /character create, /sheet
      rolls.ts            # roll button handlers (d12 + dread)
      gmedit.ts           # /gm edit, select menu, modal submit
    ids.ts                # customId encode/decode helpers
  scripts/
    register-commands.ts  # registers slash commands (guild-scoped in dev)
  .env.example
  .gitignore
  tsconfig.json
  package.json
  CLAUDE.md
```

## 3. Environment variables

`.env.example`:
```
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=          # dev guild for instant command registration
GM_USER_ID=                # Discord user id of the GM (Nate)
DATABASE_PATH=./eem.db
```
`.gitignore` must include `.env`, `node_modules`, `*.db`.

## 4. Database schema

Create on startup if absent (`db.ts`). One character per `(guild_id, owner_user_id)` in Phase 1 — enforce with a UNIQUE index.

```sql
CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  pronouns TEXT DEFAULT '',
  folk TEXT DEFAULT '',
  class TEXT DEFAULT '',
  homeland TEXT DEFAULT '',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'lite',          -- 'lite' | 'full'
  vim INTEGER DEFAULT 0,
  vigor INTEGER DEFAULT 0,
  knack INTEGER DEFAULT 0,
  knowhow INTEGER DEFAULT 0,
  attack INTEGER DEFAULT 0,
  defense INTEGER DEFAULT 10,
  dread_die TEXT DEFAULT 'd6',       -- 'd6'|'d8'|'d10'|'d12'
  courage_current INTEGER DEFAULT 6,
  courage_max INTEGER DEFAULT 6,
  quest_pts INTEGER DEFAULT 0,
  slots_used INTEGER DEFAULT 0,
  slots_max INTEGER DEFAULT 6,
  inv_worn TEXT DEFAULT '',
  inv_carried TEXT DEFAULT '',
  perks TEXT DEFAULT '',             -- freeform, one ability per line
  skills TEXT DEFAULT '{}',          -- JSON of 16 skill mods, used by Full tier later
  portrait_url TEXT DEFAULT '',
  conditions TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_char_owner
  ON characters(guild_id, owner_user_id);
```

`db.ts` exports typed helpers: `getCharByOwner(guildId, userId)`, `getCharById(id)`, `createChar(partial)`, `updateChar(id, patch)` (always set `updated_at = datetime('now')`).

## 5. Roll engine — `roll.ts` (implement exactly)

The d12 result band is read off the **total (die + modifier)**. CONFIRM with rulebook: if bands should apply to the raw d12 *before* adding skill, change `bandFor(total)` to `bandFor(die)` — that is the only change required.

```ts
export type Band =
  | 'Complete Failure'
  | 'Failure with a Plus'
  | 'Success with a Twist'
  | 'Success'
  | 'Complete Success';

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function bandFor(total: number): Band {
  if (total <= 2) return 'Complete Failure';
  if (total <= 5) return 'Failure with a Plus';
  if (total <= 8) return 'Success with a Twist';
  if (total <= 11) return 'Success';
  return 'Complete Success'; // 12+
}

export function resolveD12(mod: number) {
  const die = rollDie(12);
  const total = die + mod;
  return { die, mod, total, band: bandFor(total) };
}

export function resolveDread(dieSpec: string) {
  const sides = parseInt(dieSpec.replace(/^d/i, ''), 10); // 'd8' -> 8
  const die = rollDie(sides);
  return { sides, die, damage: die };
}
```

Add a tiny test file (`roll.test.ts` or assertions in a `npm run test` script) covering: band boundaries at totals 2,3,5,6,8,9,11,12,13; `resolveDread('d8')` returns 1–8.

## 6. customId scheme — `ids.ts`

Format: colon-delimited, always `< 100` chars. Helpers `encode(parts: string[])` and `decode(customId)`.

| Action | customId |
| --- | --- |
| d12 attribute/combat roll | `roll:<charId>:<key>` where key ∈ `vim,vigor,knack,knowhow,attack,defend` |
| dread roll | `dread:<charId>` |
| GM edit entry | `gmedit:<charId>` |
| GM edit field-group select | `gmsel:<charId>` (select menu); chosen value = group name |
| GM edit modal submit | `gmmodal:<charId>:<group>` |

`defend` rolls d12 + `defense` is NOT how defense works if Defense is a static value — CONFIRM. Default behavior: treat `attack` and `defend` as d12 + the respective stat modifier (same engine). If Defense is a static target number rather than a roll, drop the Defend button; leave a `// CONFIRM` note.

## 7. Card rendering — `embeds.ts`

`buildCharacterCard(c: CharRow): { embed, components }`.

Embed (color `0xBA7517`, gold):
- Author/title: `c.name` + ` (c.pronouns)`.
- Description line: `` `${c.folk} ${c.class} · Level ${c.level} · ${c.xp} XP` ``.
- Thumbnail: `c.portrait_url` if non-empty.
- Inline fields, Lite tier:
  - Attributes (one field, inline): `Vim +N · Vigor +N · Knack +N · Knowhow +N` (format mod with explicit sign).
  - Vitals (one field, inline): `❤ Courage cur/max · Attack +N · Dread dX · Defense N · Quest N` — use plain text labels, no emoji; render hearts as the word "Courage".
  - Inventory (one field): `Worn: … | Carried: … | Slots used/max`.
  - Perks & abilities (one field): `c.perks` (already newline-separated).

Helper `fmtMod(n)` => `n>=0 ? '+'+n : ''+n`.

Components — two button rows (max 5 buttons per row):
- Row 1: Roll vim, Roll vigor, Roll knack, Roll knowhow, Attack — `customId` `roll:<id>:<key>`, style `Secondary`.
- Row 2: Defend (`roll:<id>:defend`, Secondary), Roll dread (`dread:<id>`, style `Danger`), Edit · GM (`gmedit:<id>`, style `Primary`).

The Edit button is rendered for everyone but **gated on click** (§9). (Optional nicety: when the card is produced for the GM, you may omit it for non-GM viewers — not required for Phase 1.)

Full tier (`c.tier === 'full'`): same builder, but expand Attributes into the 16 skills from `c.skills` and add fields for Conditions, Proficiencies/Deficiencies, and the full inventory economy. **Phase 1: implement the Lite branch only; leave a clearly-marked `if (c.tier==='full') { /* TODO Phase 1.5 */ }` returning the Lite layout for now.**

## 8. Commands & handlers

Register guild-scoped in dev (`scripts/register-commands.ts`, using `Routes.applicationGuildCommands`) for instant updates.

**`/character create`** — opens a modal (max 5 text inputs): `name` (required), `pronouns`, `folk`, `class`, `homeland`. On submit: insert a row with schema defaults for all stats; reply ephemerally "Character created. Ask the GM to set your stats," then post the card publicly. Enforce one-per-user: if a row exists, reply ephemerally telling them to use their existing sheet.

**`/sheet`** — fetch the invoker's character; reply **publicly** with `buildCharacterCard`. If none, ephemeral prompt to run `/character create`.

**`/gm show user:@member`** — GM only; posts that member's card publicly.

**`/gm edit [user:@member]`** — GM only; opens a String Select menu (`gmsel:<charId>`) of field groups (see below). On selection, open the matching modal prefilled with current values; on modal submit, validate, `updateChar`, reply ephemerally "Updated," and re-post/refresh the card.

Field groups (each modal ≤ 5 inputs — this is a hard Discord limit):
- `vitals`: courage_current, courage_max, defense, quest_pts, conditions
- `attributes`: vim, vigor, knack, knowhow, attack
- `combat`: dread_die, attack, defense, courage_max, courage_current
- `progress`: level, xp, tier (`lite`/`full`)
- `inventory`: inv_worn, inv_carried, slots_used, slots_max
- `bio`: folk, class, homeland, portrait_url, perks

Numeric inputs come back as strings — parse with `parseInt`, reject NaN with an ephemeral error. `tier` must be `lite` or `full`. `dread_die` must match `/^d(6|8|10|12)$/`.

**Roll buttons** (`roll:*`, `dread:*`): see §9.

## 9. Permissions & roll output

On every button click:
1. Decode `customId` → `charId`. Load the character.
2. **Roll buttons:** allow if `interaction.user.id === char.owner_user_id` OR user is GM. Otherwise `reply({ content: "That's not your character.", flags: MessageFlags.Ephemeral })`.
3. **Edit button / `/gm *`:** allow only if user is GM (`interaction.user.id === GM_USER_ID`; also accept a configured GM role if present). Otherwise ephemeral denial.

GM check lives in `config.ts` as `isGM(interaction)`.

Roll output is **public** (no ephemeral flag) so it lands in the channel for the GM:

- d12: call `resolveD12(char[key])`. Reply with one line, e.g.
  `**${name}** rolls ${Key} — d12 [${die}] ${fmtMod(mod)} = **${total}** → **${band}**`
- dread: call `resolveDread(char.dread_die)`. Reply:
  `**${name}** rolls Dread — ${dieSpec} [${die}] = **${die} damage**`

The bot states the band only. It must NOT narrate consequences — the GM does. Keep replies as plain content or a tiny embed; do not re-attach the action buttons to roll-result messages.

Use `flags: MessageFlags.Ephemeral` (not the deprecated `ephemeral: true`) for all private replies. better-sqlite3 is synchronous so handlers are fast — no `deferReply` needed.

## 10. Run & deploy

`package.json` scripts:
```
"register": "tsx scripts/register-commands.ts",
"dev": "tsx src/index.ts",
"typecheck": "tsc --noEmit",
"test": "tsx src/roll.test.ts"
```
Local: set `.env`, `npm i`, `npm run register`, `npm run dev`. Invite URL needs scopes `bot applications.commands` and permissions: Send Messages, Embed Links, Use Application Commands.

Deploy: any always-on host. Railway is simplest — push repo, set the env vars in the dashboard, start command `npm run dev` (or compile and `node dist`). Persist the SQLite file on a volume so characters survive redeploys; or set `DATABASE_PATH` to a mounted volume path.

## 11. Acceptance checklist (definition of done for Phase 1)

- [ ] `npm run register` then `npm run dev` connects with only the Guilds intent.
- [ ] `/character create` modal creates a row; second attempt by same user is blocked.
- [ ] `/sheet` posts the gold card with two button rows matching §7.
- [ ] Each d12 button posts a public result with die, mod, total, and the correct band (verify all five bands via known mods).
- [ ] Roll buttons pressed by a non-owner non-GM get an ephemeral refusal.
- [ ] Roll dread posts a public damage line using the stored die size.
- [ ] Edit button / `/gm edit` works only for `GM_USER_ID`; select → modal → values persist and the card reflects them (incl. level-up and changing `dread_die`).
- [ ] `roll.test.ts` passes all band-boundary cases.

## 12. Phase 2 — extension points (DO NOT build now)

Same bot, added later. Note where these will hook so Phase 1 stays clean:
- `clocks` table (`id, guild_id, name, current, max`); `/clock create|advance|show`; a `node-cron` daily tick that advances flagged clocks and posts an alert.
- `game_state` table; `/state` prints a code-block; `/recap` summarizes the last beat.
- Stall nudge: scheduled check that pings the player who is "on the clock" after a configurable window.
- Vote tally: post options, add reactions, tally after a deadline.

Keep `index.ts`'s interaction router switch easy to extend (route by `customId` prefix and command name). Do not add `node-cron` or any scheduler in Phase 1.
