# Land of Eem Character Sheets Bot

A Discord bot for play-by-post *Land of Eem* campaigns. Players create character sheets that appear in Discord as cards with roll buttons. Rolls post publicly so the GM can adjudicate; only the GM can edit stats.

---

## Commands

### Player commands

| Command | Description |
|---|---|
| `/character create` | Open a form to create a new character sheet. Optionally choose `kind: NPC` (GM only). |
| `/sheet` | Post your character card publicly. If you have multiple characters, pick one from the list. |

### GM commands

| Command | Description |
|---|---|
| `/gm show [user]` | Post a player's character card publicly. Prompts for which character if they have more than one. |
| `/gm edit [user]` | Edit a player's character stats via a series of forms (vitals, attributes, combat, progress, inventory, bio). Prompts for which character if they have more than one. |

### Roll buttons (on each character card)

| Button | What it rolls |
|---|---|
| Roll Vim / Vigor / Knack / Knowhow | d12 + that attribute modifier |
| Attack | d12 + attack modifier |
| Defend | d12 + defense modifier |
| Roll Dread | The character's stored dread die (d6/d8/d10/d12) — reports raw damage, no band |

**Result bands (d12 total):**

| Total | Result |
|---|---|
| 1–2 | Complete Failure |
| 3–5 | Failure with a Plus |
| 6–8 | Success with a Twist |
| 9–11 | Success |
| 12+ | Complete Success |

---

## Quick start (local)

### Prerequisites

- Node 20 LTS
- A Discord application with a bot token ([Discord Developer Portal](https://discord.com/developers/applications))

### 1. Clone and install

```bash
git clone https://github.com/nsuurmey/land-of-eem-character-sheets.git
cd land-of-eem-character-sheets
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
DISCORD_TOKEN=        # Bot token from the Developer Portal
DISCORD_CLIENT_ID=    # Application ID from the Developer Portal
DISCORD_GUILD_ID=     # Right-click your server → Copy Server ID (Developer Mode must be on)
GM_USER_ID=           # Right-click your own username → Copy User ID
DATABASE_PATH=./eem.db
```

> **Developer Mode:** Settings → Advanced → Developer Mode, then right-click to copy IDs.

### 3. Register slash commands

```bash
npm run register
```

Commands register to your guild instantly (guild-scoped). Run this again any time the command list changes.

### 4. Start the bot

```bash
npm run dev
```

---

## Deploying to Railway

Railway keeps the bot running 24/7 without a server to manage.

1. Push this repo to GitHub.
2. Create a new Railway project → **Deploy from GitHub repo** → select this repo.
3. Add a **Volume** mounted at `/data` for SQLite persistence.
4. In the service **Variables** tab (not Shared Variables), add all five env vars from `.env`, with `DATABASE_PATH=/data/eem.db`.
5. Set the **Start command** to `npm run dev`.
6. Deploy — Railway builds and starts the bot automatically.
7. Run `npm run register` locally once to register slash commands with Discord.

---

## Project structure

```
src/
  index.ts           # Discord client + interaction router
  config.ts          # Env loading, GM check
  db.ts              # SQLite schema, migrations, CRUD
  roll.ts            # Pure roll engine (no Discord imports)
  embeds.ts          # Character row → embed + buttons
  ids.ts             # customId encode/decode helpers
  handlers/
    character.ts     # /character create, /sheet, character picker
    rolls.ts         # Roll button handlers
    gmedit.ts        # /gm edit flow — select menu + modals
scripts/
  register-commands.ts  # Guild-scoped slash command registration
```

---

## Development

```bash
npm run dev        # Run bot with tsx (no compile step)
npm run typecheck  # TypeScript type check
npm run test       # Unit tests for the roll engine
npm run register   # Register slash commands to DISCORD_GUILD_ID
```
