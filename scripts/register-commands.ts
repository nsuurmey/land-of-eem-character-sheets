import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } from '../src/config.js';

const commands = [
  new SlashCommandBuilder()
    .setName('character')
    .setDescription('Character management')
    .addSubcommand(sub =>
      sub.setName('create').setDescription('Create your character sheet'),
    ),

  new SlashCommandBuilder()
    .setName('sheet')
    .setDescription('View your character sheet publicly'),

  new SlashCommandBuilder()
    .setName('gm')
    .setDescription('GM-only commands')
    .addSubcommand(sub =>
      sub
        .setName('show')
        .setDescription("Post a player's character card publicly")
        .addUserOption(opt =>
          opt.setName('user').setDescription('The player').setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('edit')
        .setDescription("Edit a player's character stats")
        .addUserOption(opt =>
          opt.setName('user').setDescription('The player (omit to edit your own)').setRequired(false),
        ),
    ),
];

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  console.log('Registering guild-scoped slash commands...');
  await rest.put(
    Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
    { body: commands.map(c => c.toJSON()) },
  );
  console.log('Done! Commands registered to guild', DISCORD_GUILD_ID);
})().catch(console.error);
