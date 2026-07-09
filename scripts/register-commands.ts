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
        )
        .addUserOption(opt =>
          opt
            .setName('owner')
            .setDescription('Player who owns this character (GM only — defaults to you)')
            .setRequired(false),
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
    )
    .addSubcommand(sub =>
      sub
        .setName('assign')
        .setDescription('Transfer ownership of a character to a player')
        .addStringOption(opt =>
          opt
            .setName('character')
            .setDescription('The character to reassign')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addUserOption(opt =>
          opt.setName('user').setDescription('The player to assign it to').setRequired(true),
        ),
    ),

  new SlashCommandBuilder()
    .setName('courage')
    .setDescription('Adjust a character\'s current Courage (positive heals, negative damages)')
    .addStringOption(opt =>
      opt
        .setName('character')
        .setDescription('The character')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addIntegerOption(opt =>
      opt
        .setName('amount')
        .setDescription('Amount to add (positive) or subtract (negative)')
        .setRequired(true),
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
