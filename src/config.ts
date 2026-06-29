import 'dotenv/config';
import type { Interaction } from 'discord.js';

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
export const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!;
export const GM_USER_ID = process.env.GM_USER_ID!;
export const DATABASE_PATH = process.env.DATABASE_PATH ?? './eem.db';

export function isGM(interaction: Interaction): boolean {
  return interaction.user.id === GM_USER_ID;
}
