import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } from '../src/config.js';

const commands = [
  new SlashCommandBuilder()
    .setName('character')
    .setDescription('Character management')
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a character sheet')
        .addStringOption(opt =>
          opt
            .setName('kind')
            .setDescription('PC or NPC (GM only for NPC)')
            .setRequired(false)
            .addChoices({ name: 'PC', value: 'pc' }, { name: 'NPC', value: 'npc' }),
        ),
    ),

  new SlashCommandBuilder()
    .setName('sheet')
    .setDescription('View your character sheet publicly')
    .addStringOption(opt =>
      opt
        .setName('character')
        .setDescription('Which character (if you have more than one)')
        .setRequired(false)
        .setAutocomplete(true),
    ),

  new SlashCommandBuilder()
    .setName('gm')
    .setDescription('GM-only commands')
    .addSubcommand(sub =>
      sub
        .setName('show')
        .setDescription("Post a player's character card publicly")
        .addUserOption(opt =>
          opt.setName('user').setDescription('The player').setRequired(true),
        )
        .addStringOption(opt =>
          opt
            .setName('character')
            .setDescription('Which character (if the player has more than one)')
            .setRequired(false)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('edit')
        .setDescription("Edit a player's character stats")
        .addUserOption(opt =>
          opt.setName('user').setDescription('The player (omit to edit your own)').setRequired(false),
        )
        .addStringOption(opt =>
          opt
            .setName('character')
            .setDescription('Which character (if the player has more than one)')
            .setRequired(false)
            .setAutocomplete(true),
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
