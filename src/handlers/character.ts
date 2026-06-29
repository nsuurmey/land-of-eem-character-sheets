import {
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
  MessageFlags,
  type GuildTextBasedChannel,
} from 'discord.js';
import { getCharByOwner, createChar } from '../db.js';
import { buildCharacterCard } from '../embeds.js';

export async function handleCharacterCreate(interaction: ChatInputCommandInteraction) {
  const modal = new ModalBuilder()
    .setCustomId('char_create')
    .setTitle('Create Your Character')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('name').setLabel('Character Name').setStyle(TextInputStyle.Short).setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('pronouns').setLabel('Pronouns').setStyle(TextInputStyle.Short).setRequired(false),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('folk').setLabel('Folk (e.g. Hobble, Mellow, etc.)').setStyle(TextInputStyle.Short).setRequired(false),
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

  const existing = getCharByOwner(guildId, userId);
  if (existing) {
    await interaction.reply({
      content: 'You already have a character sheet. Use `/sheet` to view it.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const name = interaction.fields.getTextInputValue('name');
  const pronouns = interaction.fields.getTextInputValue('pronouns') ?? '';
  const folk = interaction.fields.getTextInputValue('folk') ?? '';
  const cls = interaction.fields.getTextInputValue('class') ?? '';
  const homeland = interaction.fields.getTextInputValue('homeland') ?? '';

  const char = createChar({ guild_id: guildId, owner_user_id: userId, name, pronouns, folk, class: cls, homeland });

  await interaction.reply({
    content: 'Character created. Ask the GM to set your stats.',
    flags: MessageFlags.Ephemeral,
  });

  const { embed, components } = buildCharacterCard(char);
  await (interaction.channel as GuildTextBasedChannel).send({ embeds: [embed], components });
}

export async function handleSheet(interaction: ChatInputCommandInteraction) {
  const char = getCharByOwner(interaction.guildId!, interaction.user.id);
  if (!char) {
    await interaction.reply({
      content: "You don't have a character yet. Use `/character create` to make one.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const { embed, components } = buildCharacterCard(char);
  await interaction.reply({ embeds: [embed], components });
}
