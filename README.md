# Land of Eem — Discord Character Sheet Bot

A Discord bot for play-by-post *Land of Eem* games. Stores character sheets and displays each as a card (embed + buttons) in chat. Players tap buttons to roll; results post publicly so the GM adjudicates. Only the GM can edit stats.

## The Game Land of Eem

Land of Eem is a whimsical fantasy tabletop roleplaying game about adventurers exploring the strange ruins and stories of a forgotten age.

It was created by Ben Costa and James Parks, the team behind Rickety Stitch and the Gelatinous Goo and Dungeoneer Adventures.

The game blends wonder, humor, and classic adventure in a setting often described as “Lord of the Rings meets The Muppets.”

To learn more, visit the official site at landofeem.com.

## Features

- Character sheets stored in SQLite, displayed as gold Discord embeds
- One-tap d12 rolls for all attributes — result band posted publicly in channel
- Dread rolls using each character's stored die size
- GM-only stat editing via select menu → prefilled modal
- Ephemeral permission denials; all rolls are public
- Guild-scoped slash commands for instant updates in dev

---

## Commands

### Player commands

| Command | Description |
|---|---|
| `/character create` | Opens a modal to create your character (name, pronouns, folk, class, homeland). One character per player per server. |
| `/sheet` | Posts your character card publicly in the channel. |

### GM commands

| Command | Description |
|---|---|
| `/gm show user:@player` | Posts a player's character card publicly. |
| `/gm edit [user:@player]` | Opens a field group selector to edit a player's stats. Omit the user to edit your own character. |

### Card buttons

| Button | Who can use it | What it does |
|---|---|---|
| Roll Vim / Vigor / Knack / Knowhow | Owner or GM | Rolls d12 + stat modifier, posts result band publicly |
| Attack | Owner or GM | Rolls d12 + attack modifier |
| Defend | Owner or GM | Rolls d12 + defense modifier *(see CONFIRM note in code)* |
| Roll Dread | Owner or GM | Rolls the character's stored dread die, posts damage publicly |
| Edit · GM | GM only | Opens the stat edit flow |

### Result bands (d12 + modifier total)

| Total | Band |
|---|---|
| 1–2 | Complete Failure |
| 3–5 | Failure with a Plus |
| 6–8 | Success with a Twist |
| 9–11 | Success |
| 12+ | Complete Success |

---

## Quick Start

### Prerequisites

- Node 20+
- A Discord application with a bot token ([discord.com/developers](https://discord.com/developers/applications))

### 1. Clone and install

```bash
git clone https://github.com/nsuurmey/land-of-eem-character-sheets.git
cd land-of-eem-character-sheets
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
DISCORD_TOKEN=        # Bot token from Discord Developer Portal → Bot tab
DISCORD_CLIENT_ID=    # Application ID from General Information tab
DISCORD_GUILD_ID=     # Right-click your server → Copy Server ID (needs Developer Mode)
GM_USER_ID=           # Right-click yourself in Discord → Copy User ID
DATABASE_PATH=./eem.db
```

### 3. Invite the bot to your server

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=18432
```

### 4. Register slash commands

```bash
npm run register
```

Only needs to be run once (or again after adding new commands).

### 5. Start the bot

```bash
npm run dev
```

You should see `Ready! Logged in as YourBot#1234`.

---

## Deploying to Railway

1. Push the repo to GitHub and connect it to a new Railway project
2. In the service **Variables** tab, add all five env vars from `.env`
3. Add a **Volume** mounted at `/data` and set `DATABASE_PATH=/data/eem.db` — this keeps the database across redeploys
4. Set the **Start Command** to `npm run dev`
5. Deploy — look for `Ready!` in the logs
6. Run `npm run register` once from your local machine to register slash commands

---

## Development

```bash
npm run dev        # Start the bot with tsx (no compile step)
npm run register   # Register guild-scoped slash commands
npm run typecheck  # TypeScript typecheck
npm run test       # Run roll engine unit tests
```

### Project layout

```
src/
  index.ts              # Client bootstrap + interaction router
  config.ts             # Env loading, isGM() check
  db.ts                 # SQLite schema + CRUD helpers
  roll.ts               # Pure roll engine (no Discord imports)
  embeds.ts             # Character card builder
  ids.ts                # customId encode/decode
  roll.test.ts          # Band boundary + dread range tests
  handlers/
    character.ts        # /character create, /sheet
    rolls.ts            # Roll button handlers
    gmedit.ts           # /gm edit flow
scripts/
  register-commands.ts  # Guild-scoped command registration
build-docs/
  BUILD_SPEC.md         # Full authoritative spec for Phase 1
```

### GM edit field groups

The `/gm edit` flow presents a select menu of groups, each opening a prefilled modal:

| Group | Fields |
|---|---|
| Vitals | Courage current/max, Defense, Quest Points, Conditions |
| Attributes | Vim, Vigor, Knack, Knowhow, Attack |
| Combat | Dread die, Attack, Defense, Courage current/max |
| Progress | Level, XP, Tier (lite/full) |
| Inventory | Worn, Carried, Slots used/max |
| Bio | Folk, Class, Homeland, Portrait URL, Perks |

---

## Stack

- **Runtime:** Node 20, TypeScript
- **Discord:** discord.js v14
- **Database:** better-sqlite3 (SQLite, single file)
- **Config:** dotenv

Gateway intents: `Guilds` only. No privileged intents required.
