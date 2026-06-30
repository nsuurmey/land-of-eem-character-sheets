// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 nsuurmey. See LICENSE.
//
// SRD-DERIVED CONTENT: The "Folk", "Class", and "Homeland" field labels are Land of
// Eem character creation terminology from the SRD, governed by the Land of Eem Open
// License. See LICENSES/LAND-OF-EEM-OPEN-LICENSE.md. They are NOT licensed under Apache 2.0.

import {
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  AutocompleteInteraction,
  type GuildTextBasedChannel,
} from 'discord.js';
import { getCharsByOwner, createChar } from '../db.js';
import { buildCharacterCard } from '../embeds.js';
import { encode, decode } from '../ids.js';
import { isGM } from '../config.js';

export async function handleCharacterCreate(interaction: ChatInputCommandInteraction) {
  const kindOpt = interaction.options.getString('kind') ?? 'pc';
  const kind = (isGM(interaction) && kindOpt === 'npc') ? 'npc' : 'pc';

  const modal = new ModalBuilder()
    .setCustomId(encode(['char_create', kind]))
    .setTitle('Create Character')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('name').setLabel('Character Name').setStyle(TextInputStyle.Short).setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('pronouns').setLabel('Pronouns').setStyle(TextInputStyle.Short).setRequired(false),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('folk').setLabel('Folk (your character\'s folk)').setStyle(TextInputStyle.Short).setRequired(false),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('class').setLabel('Class (e.g. Ruffian, Rogue, etc.)').setStyle(TextInputStyle.Short).setRequired(false),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('homeland').setLabel('Homeland').setStyle(TextInputStyle.Short).setRequired(false),
      ),
    );

  await interaction.showModal(modal);
}

export async function handleCharCreateModalSubmit(interaction: ModalSubmitInteraction) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;

  const [, kind] = decode(interaction.customId);
  const charKind = kind === 'npc' ? 'npc' : 'pc';

  const name = interaction.fields.getTextInputValue('name');
  const pronouns = interaction.fields.getTextInputValue('pronouns') ?? '';
  const folk = interaction.fields.getTextInputValue('folk') ?? '';
  const cls = interaction.fields.getTextInputValue('class') ?? '';
  const homeland = interaction.fields.getTextInputValue('homeland') ?? '';

  const char = createChar({ guild_id: guildId, owner_user_id: userId, name, pronouns, folk, class: cls, homeland, kind: charKind });

  await interaction.reply({
    content: 'Character created. Ask the GM to set your stats.',
    flags: MessageFlags.Ephemeral,
  });

  const { embed, components } = buildCharacterCard(char);
  await (interaction.channel as GuildTextBasedChannel).send({ embeds: [embed], components });
}

export async function handleSheet(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;

  const charIdOpt = interaction.options.getString('character');
  if (charIdOpt) {
    const id = parseInt(charIdOpt, 10);
    if (!isNaN(id)) {
      const chars = getCharsByOwner(guildId, userId);
      const char = chars.find(c => c.id === id);
      if (char) {
        const { embed, components } = buildCharacterCard(char);
        await interaction.reply({ embeds: [embed], components });
        return;
      }
    }
    await interaction.reply({ content: 'Character not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  const chars = getCharsByOwner(guildId, userId);
  if (chars.length === 0) {
    await interaction.reply({
      content: "You don't have a character yet. Use `/character create` to make one.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (chars.length === 1) {
    const { embed, components } = buildCharacterCard(chars[0]);
    await interaction.reply({ embeds: [embed], components });
    return;
  }

  // Multiple characters — show a picker
  const select = new StringSelectMenuBuilder()
    .setCustomId(encode(['pick', 'sheet']))
    .setPlaceholder('Pick a character to show')
    .addOptions(chars.map(c => ({ label: c.name, value: String(c.id) })));

  await interaction.reply({
    content: 'Which character?',
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
    flags: MessageFlags.Ephemeral,
  });
}

export async function handleSheetAutocomplete(interaction: AutocompleteInteraction) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  const focused = interaction.options.getFocused().toLowerCase();
  const chars = getCharsByOwner(guildId, userId);
  const choices = chars
    .filter(c => c.name.toLowerCase().includes(focused))
    .slice(0, 25)
    .map(c => ({ name: c.name, value: String(c.id) }));
  await interaction.respond(choices);
}

export async function handlePickSelectMenu(interaction: StringSelectMenuInteraction) {
  const [, context] = decode(interaction.customId);
  const charId = parseInt(interaction.values[0], 10);
  const chars = getCharsByOwner(interaction.guildId!, interaction.user.id);
  const char = chars.find(c => c.id === charId);
  if (!char) {
    await interaction.reply({ content: 'Character not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (context === 'sheet') {
    const { embed, components } = buildCharacterCard(char);
    await interaction.deferUpdate();
    await interaction.followUp({ embeds: [embed], components });
  }
}
