import 'dotenv/config';

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
export const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!;
export const DATABASE_PATH = process.env.DATABASE_PATH ?? './eem.db';

const GM_USER_ID = process.env.GM_USER_ID?.trim() ?? '';
if (!GM_USER_ID) {
  console.error('[config] GM_USER_ID is not set — GM commands will not work.');
}

export function isGM(interaction: { user: { id: string } }): boolean {
  return !!GM_USER_ID && interaction.user.id === GM_USER_ID;
}
