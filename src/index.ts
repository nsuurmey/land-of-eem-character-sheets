import 'dotenv/config';
import { Client, GatewayIntentBits, Events, MessageFlags, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { DISCORD_TOKEN, isGM } from './config.js';
import { getCharsByOwner, getAllChars, getCharById, updateChar } from './db.js';
import { buildCharacterCard } from './embeds.js';
import {
  handleCharacterCreate,
  handleCharCreateModalSubmit,
  handleSheet,
  handlePickSelectMenu,
} from './handlers/character.js';
import { handleRollButton, handleDreadButton } from './handlers/rolls.js';
import {
  handleGmEditButton,
  handleGmEditCommand,
  handleGmSelectMenu,
  handleGmModalSubmit,
  showEditMenu,
} from './handlers/gmedit.js';
import { encode, decode } from './ids.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Autocomplete
    if (interaction.isAutocomplete()) {
      const { commandName } = interaction;
      const focused = interaction.options.getFocused(true);

      if (focused.name === 'character') {
        const guildId = interaction.guildId!;
        const query = focused.value.toLowerCase();

        if (commandName === 'sheet') {
          const chars = getCharsByOwner(guildId, interaction.user.id);
          await interaction.respond(
            chars.filter(c => c.name.toLowerCase().includes(query)).slice(0, 25)
              .map(c => ({ name: c.name, value: String(c.id) })),
          );
        } else if (commandName === 'gm') {
          const sub = interaction.options.getSubcommand();
          if (sub === 'assign') {
            // All guild chars, NPCs flagged
            const chars = getAllChars(guildId);
            await interaction.respond(
              chars.filter(c => c.name.toLowerCase().includes(query)).slice(0, 25)
                .map(c => ({ name: c.kind === 'npc' ? `${c.name} · NPC` : c.name, value: String(c.id) })),
            );
          } else {
            // show / edit — target user's chars
            const userOpt = interaction.options.get('user');
            const targetId = (userOpt?.value as string | undefined) ?? interaction.user.id;
            const chars = getCharsByOwner(guildId, targetId);
            await interaction.respond(
              chars.filter(c => c.name.toLowerCase().includes(query)).slice(0, 25)
                .map(c => ({ name: c.name, value: String(c.id) })),
            );
          }
        } else if (commandName === 'courage') {
          const chars = getAllChars(guildId);
          await interaction.respond(
            chars.filter(c => c.name.toLowerCase().includes(query)).slice(0, 25)
              .map(c => ({ name: c.kind === 'npc' ? `${c.name} · NPC` : c.name, value: String(c.id) })),
          );
        } else {
          await interaction.respond([]);
        }
      } else {
        await interaction.respond([]);
      }
      return;
    }

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
          const charIdOpt = interaction.options.getString('character');
          const chars = getCharsByOwner(interaction.guildId!, user.id);

          if (chars.length === 0) {
            await interaction.reply({ content: `<@${user.id}> has no characters.`, flags: MessageFlags.Ephemeral });
            return;
          }

          if (charIdOpt) {
            const id = parseInt(charIdOpt, 10);
            const char = chars.find(c => c.id === id);
            if (!char) {
              await interaction.reply({ content: 'Character not found.', flags: MessageFlags.Ephemeral });
              return;
            }
            const { embed, components } = buildCharacterCard(char);
            await interaction.reply({ embeds: [embed], components });
            return;
          }

          if (chars.length === 1) {
            const { embed, components } = buildCharacterCard(chars[0]);
            await interaction.reply({ embeds: [embed], components });
            return;
          }

          const select = new StringSelectMenuBuilder()
            .setCustomId(encode(['pick', 'gmshow', user.id]))
            .setPlaceholder('Pick a character to post')
            .addOptions(chars.map(c => ({ label: c.name, value: String(c.id) })));
          await interaction.reply({
            content: 'Which character?',
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
            flags: MessageFlags.Ephemeral,
          });

        } else if (sub === 'edit') {
          const user = interaction.options.getUser('user', false);
          const targetId = user?.id ?? interaction.user.id;
          const charIdOpt = interaction.options.getString('character');
          const chars = getCharsByOwner(interaction.guildId!, targetId);

          if (chars.length === 0) {
            await interaction.reply({ content: 'No characters found for that user.', flags: MessageFlags.Ephemeral });
            return;
          }

          if (charIdOpt) {
            const id = parseInt(charIdOpt, 10);
            const char = chars.find(c => c.id === id);
            if (!char) {
              await interaction.reply({ content: 'Character not found.', flags: MessageFlags.Ephemeral });
              return;
            }
            await handleGmEditCommand(interaction, char.id);
            return;
          }

          if (chars.length === 1) {
            await handleGmEditCommand(interaction, chars[0].id);
            return;
          }

          const select = new StringSelectMenuBuilder()
            .setCustomId(encode(['pick', 'gmedit']))
            .setPlaceholder('Pick a character to edit')
            .addOptions(chars.map(c => ({ label: c.name, value: String(c.id) })));
          await interaction.reply({
            content: 'Which character?',
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
            flags: MessageFlags.Ephemeral,
          });

        } else if (sub === 'assign') {
          const charIdStr = interaction.options.getString('character', true);
          const user = interaction.options.getUser('user', true);
          const charId = parseInt(charIdStr, 10);
          const char = getCharById(charId);
          if (!char || char.guild_id !== interaction.guildId) {
            await interaction.reply({ content: 'Character not found.', flags: MessageFlags.Ephemeral });
            return;
          }
          updateChar(charId, { owner_user_id: user.id });
          await interaction.reply({
            content: `Ownership of **${char.name}** → <@${user.id}>.`,
            flags: MessageFlags.Ephemeral,
          });
        }

      } else if (commandName === 'courage') {
        if (!isGM(interaction)) {
          await interaction.reply({ content: 'Only the GM can use this command.', flags: MessageFlags.Ephemeral });
          return;
        }
        const charIdStr = interaction.options.getString('character', true);
        const amount = interaction.options.getInteger('amount', true);
        const charId = parseInt(charIdStr, 10);
        const char = getCharById(charId);
        if (!char || char.guild_id !== interaction.guildId) {
          await interaction.reply({ content: 'Character not found.', flags: MessageFlags.Ephemeral });
          return;
        }
        if (amount === 0) {
          await interaction.reply({ content: 'No change.', flags: MessageFlags.Ephemeral });
          return;
        }
        const old = char.courage_current;
        const next = Math.max(0, Math.min(char.courage_max, old + amount));
        updateChar(charId, { courage_current: next });
        const sign = amount > 0 ? `+${amount}` : `${amount}`;
        let msg = `**${char.name}** — Courage ${old} → ${next} / ${char.courage_max} (${sign})`;
        if (next === 0) msg += ' — down!';
        await interaction.reply(msg);
      }

    // Modal submits
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('char_create:')) {
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
      const prefix = interaction.customId.split(':')[0];
      if (interaction.customId.startsWith('gmsel:')) {
        await handleGmSelectMenu(interaction);
      } else if (prefix === 'pick') {
        const [, context] = decode(interaction.customId);
        if (context === 'sheet') {
          await handlePickSelectMenu(interaction);
        } else if (context === 'gmshow') {
          if (!isGM(interaction)) {
            await interaction.reply({ content: 'Only the GM can use this.', flags: MessageFlags.Ephemeral });
            return;
          }
          const charId = parseInt(interaction.values[0], 10);
          const [,, ownerId] = decode(interaction.customId);
          const chars = getCharsByOwner(interaction.guildId!, ownerId);
          const char = chars.find(c => c.id === charId);
          if (!char) {
            await interaction.reply({ content: 'Character not found.', flags: MessageFlags.Ephemeral });
            return;
          }
          const { embed, components } = buildCharacterCard(char);
          await interaction.deferUpdate();
          await interaction.followUp({ embeds: [embed], components });
        } else if (context === 'gmedit') {
          if (!isGM(interaction)) {
            await interaction.reply({ content: 'Only the GM can use this.', flags: MessageFlags.Ephemeral });
            return;
          }
          const charId = parseInt(interaction.values[0], 10);
          await showEditMenu(interaction, charId);
        }
      }
    }
  } catch (err) {
    console.error('Unhandled interaction error:', err);
    // Try to surface the error to the user so Discord doesn't just show "interaction failed"
    try {
      const rep = interaction as { reply?: Function; followUp?: Function; deferred?: boolean; replied?: boolean };
      const msg = { content: `Bot error: ${(err as Error).message ?? err}`, flags: MessageFlags.Ephemeral };
      if (rep.replied || rep.deferred) {
        await rep.followUp?.(msg);
      } else {
        await rep.reply?.(msg);
      }
    } catch {
      // ignore secondary failure
    }
  }
});

client.login(DISCORD_TOKEN);
