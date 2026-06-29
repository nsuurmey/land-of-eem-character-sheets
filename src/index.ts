import 'dotenv/config';
import { Client, GatewayIntentBits, Events, MessageFlags } from 'discord.js';
import { DISCORD_TOKEN, isGM } from './config.js';
import { getCharByOwner } from './db.js';
import { buildCharacterCard } from './embeds.js';
import { handleCharacterCreate, handleCharCreateModalSubmit, handleSheet } from './handlers/character.js';
import { handleRollButton, handleDreadButton } from './handlers/rolls.js';
import {
  handleGmEditButton,
  handleGmEditCommand,
  handleGmSelectMenu,
  handleGmModalSubmit,
} from './handlers/gmedit.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      if (commandName === 'character') {
        const sub = interaction.options.getSubcommand();
        if (sub === 'create') await handleCharacterCreate(interaction);

      } else if (commandName === 'sheet') {
        await handleSheet(interaction);

      } else if (commandName === 'gm') {
        if (!isGM(interaction)) {
          await interaction.reply({ content: 'Only the GM can use this command.', flags: MessageFlags.Ephemeral });
          return;
        }
        const sub = interaction.options.getSubcommand();

        if (sub === 'show') {
          const user = interaction.options.getUser('user', true);
          const char = getCharByOwner(interaction.guildId!, user.id);
          if (!char) {
            await interaction.reply({ content: `<@${user.id}> has no character.`, flags: MessageFlags.Ephemeral });
            return;
          }
          const { embed, components } = buildCharacterCard(char);
          await interaction.reply({ embeds: [embed], components });

        } else if (sub === 'edit') {
          const user = interaction.options.getUser('user', false);
          const targetId = user?.id ?? interaction.user.id;
          const char = getCharByOwner(interaction.guildId!, targetId);
          if (!char) {
            await interaction.reply({ content: 'No character found for that user.', flags: MessageFlags.Ephemeral });
            return;
          }
          await handleGmEditCommand(interaction, char.id);
        }
      }

    // Modal submits
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === 'char_create') {
        await handleCharCreateModalSubmit(interaction);
      } else if (interaction.customId.startsWith('gmmodal:')) {
        await handleGmModalSubmit(interaction);
      }

    // Buttons
    } else if (interaction.isButton()) {
      const prefix = interaction.customId.split(':')[0];
      if (prefix === 'roll') {
        await handleRollButton(interaction);
      } else if (prefix === 'dread') {
        await handleDreadButton(interaction);
      } else if (prefix === 'gmedit') {
        await handleGmEditButton(interaction);
      }

    // Select menus
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('gmsel:')) {
        await handleGmSelectMenu(interaction);
      }
    }
  } catch (err) {
    console.error('Unhandled interaction error:', err);
  }
});

client.login(DISCORD_TOKEN);
