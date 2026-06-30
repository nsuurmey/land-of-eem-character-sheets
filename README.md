# Land of Eem — Discord Character Sheet Bot

![Land of Eem Compatible](assets/land-of-eem-compatible.png)

A Discord bot for play-by-post *Land of Eem* games. Stores character sheets and displays each as a card (embed + buttons) in chat. Players tap buttons to roll; results post publicly so the GM adjudicates. Only the GM can edit stats.

## The Game Land of Eem

*Land of Eem* is a whimsical fantasy tabletop roleplaying game created by **Ben Costa and James Parks**.

To learn more, visit [landofeem.com](https://landofeem.com).

> **Compatibility notice:** This bot is not official, not endorsed by, and not affiliated with the creators or publishers of *Land of Eem*.

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

---

## Licensing & Compliance

**Compatible with Land of Eem.**

> This work was created using the Land Of Eem TTRPG Open License.
> Land Of Eem TTRPG Open License, v.1.0 Copyright 2025, Ben Costa and James Parks.

This project uses **two licenses** that apply to different parts of the codebase.

### Original source code — Apache License 2.0

All original TypeScript source code, configuration files, scripts, and build
documentation are copyright 2026 nsuurmey and licensed under the
**Apache License, Version 2.0**. See [`LICENSE`](LICENSE).

### Land of Eem SRD-derived content — Land of Eem Open License

Game terminology, result band definitions (Complete Failure, Failure with a Plus,
Success with a Twist, Success, Complete Success), and attribute names (Vim, Vigor,
Knack, Knowhow, Courage, Dread, Quest Points) are derived from the *Land of Eem*
System Reference Document (SRD). This content is governed by the
**Land of Eem Open License (LOEL) v1.0** and is **not** licensed under Apache 2.0.

The full LOEL text and an index of which files contain SRD-derived content are in
[`LICENSES/LAND-OF-EEM-OPEN-LICENSE.md`](LICENSES/LAND-OF-EEM-OPEN-LICENSE.md).

### Disclaimer

This bot is not official, not endorsed by, and not affiliated with the creators or
publishers of *Land of Eem*. "Land of Eem" is a trademark of Ben Costa and James Parks.

Use `/about` or `/license` in Discord to surface these notices to server members.

### Logo (LOEL §3 requirement)

The official **Land of Eem Compatible Logo** is displayed at the top of this README,
satisfying the LOEL §3 affixation requirement. The logo is the property of Ben Costa
and James Parks and is used here solely to indicate compatibility as permitted by the
LOEL. It is not licensed under Apache 2.0.

### Note on monetization

The LOEL permits selling compatible works. However, it prohibits AI-generated content
in commercial products and requires a separate enterprise agreement if your operation
exceeds $10M annual revenue or 500 employees. Review the full LOEL before charging for
access to or distribution of this bot.
