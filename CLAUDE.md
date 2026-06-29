# CLAUDE.md — Eem Discord Bot

You are building a Discord bot for a play-by-post *Land of Eem* game. The full, authoritative plan is in `build-docs/BUILD_SPEC.md`. Read it first and implement its sections **in order**. Follow it literally; do not redesign the schema, command surface, or roll logic.

## What this bot is
Stores Land of Eem character sheets and shows each as a Discord card (embed + buttons). Players tap buttons to roll; results post **publicly** so the human GM adjudicates. Only the GM edits cards. The bot is **mechanics only** — it never calls an LLM and never narrates outcomes beyond stating the result band.

## Non-negotiables
- Stack: Node 20, TypeScript, discord.js v14, better-sqlite3, dotenv. (Phase 1 has no scheduler.)
- Request **only** `GatewayIntentBits.Guilds`. Never request MessageContent or other privileged intents.
- The d12 result bands must match `build-docs/BUILD_SPEC.md` §5 exactly: 1–2 Complete Failure, 3–5 Failure with a Plus, 6–8 Success with a Twist, 9–11 Success, 12+ Complete Success. Bands read off the die+modifier total (see the CONFIRM note).
- Dread is the only non-d12 roll: it rolls the character's stored die size and reports damage, no band.
- Roll replies are public; permission denials and GM edit forms are ephemeral via `flags: MessageFlags.Ephemeral` (not `ephemeral: true`).
- Respect Discord limits: ≤5 buttons per action row, ≤5 text inputs per modal, customId <100 chars.

## Working style
- Keep `roll.ts` pure (no discord.js imports) and unit-tested via `npm run test`.
- Register commands guild-scoped in dev for instant updates.
- Don't build any Phase 2 feature (clocks, state, nudges, votes). Just leave the router easy to extend.
- When something in the spec is marked CONFIRM, keep the default and leave a `// CONFIRM` comment rather than guessing.

## Done means
All boxes in `build-docs/BUILD_SPEC.md` §11 pass.
