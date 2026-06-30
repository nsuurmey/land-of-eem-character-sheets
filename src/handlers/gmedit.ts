import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  RepliableInteraction,
  type GuildTextBasedChannel,
} from 'discord.js';
import { getCharById, updateChar, type CharRow } from '../db.js';
import { decode, encode } from '../ids.js';
import { isGM } from '../config.js';
import { buildCharacterCard } from '../embeds.js';

const GROUPS = ['vitals', 'attributes', 'combat', 'progress', 'inventory', 'bio'] as const;
type Group = typeof GROUPS[number];

export async function showEditMenu(interaction: RepliableInteraction, charId: number) {
  const char = getCharById(charId);
  if (!char) {
    await interaction.reply({ content: 'Character not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(encode(['gmsel', String(charId)]))
    .setPlaceholder('Choose a field group to edit')
    .addOptions(
      { label: 'Vitals', value: 'vitals', description: 'Courage, Defense, Quest pts, Conditions' },
      { label: 'Attributes', value: 'attributes', description: 'Vim, Vigor, Knack, Knowhow, Attack' },
      { label: 'Combat', value: 'combat', description: 'Dread die, Attack, Defense, Courage' },
      { label: 'Progress', value: 'progress', description: 'Level, XP, Tier' },
      { label: 'Inventory', value: 'inventory', description: 'Worn, Carried, Slots' },
      { label: 'Bio', value: 'bio', description: 'Folk, Class, Homeland, Portrait, Perks' },
    );

  await interaction.reply({
    content: `Editing **${char.name}**:`,
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
    flags: MessageFlags.Ephemeral,
  });
}

export async function handleGmEditButton(interaction: ButtonInteraction) {
  if (!isGM(interaction)) {
    await interaction.reply({ content: 'Only the GM can edit character sheets.', flags: MessageFlags.Ephemeral });
    return;
  }
  const [, charIdStr] = decode(interaction.customId);
  await showEditMenu(interaction, parseInt(charIdStr, 10));
}

export async function handleGmEditCommand(interaction: ChatInputCommandInteraction, charId: number) {
  await showEditMenu(interaction, charId);
}

export async function handleGmSelectMenu(interaction: StringSelectMenuInteraction) {
  if (!isGM(interaction)) {
    await interaction.reply({ content: 'Only the GM can edit character sheets.', flags: MessageFlags.Ephemeral });
    return;
  }

  const [, charIdStr] = decode(interaction.customId);
  const char = getCharById(parseInt(charIdStr, 10));
  if (!char) {
    await interaction.reply({ content: 'Character not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  const group = interaction.values[0] as Group;
  await interaction.showModal(buildGroupModal(charIdStr, group, char));
}

export async function handleGmModalSubmit(interaction: ModalSubmitInteraction) {
  if (!isGM(interaction)) {
    await interaction.reply({ content: 'Only the GM can edit character sheets.', flags: MessageFlags.Ephemeral });
    return;
  }

  const [, charIdStr, group] = decode(interaction.customId);
  const charId = parseInt(charIdStr, 10);
  const char = getCharById(charId);
  if (!char) {
    await interaction.reply({ content: 'Character not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  const patch: Partial<CharRow> = {};
  const errors: string[] = [];

  const str = (key: string): string | undefined => {
    try { return interaction.fields.getTextInputValue(key); } catch { return undefined; }
  };

  const int = (key: string, label: string): number | undefined => {
    const v = str(key);
    if (v === undefined) return undefined;
    const n = parseInt(v, 10);
    if (isNaN(n)) { errors.push(`${label} must be a whole number`); return undefined; }
    return n;
  };

  switch (group as Group) {
    case 'vitals': {
      const courageCurrent = int('courage_current', 'Courage current');
      const courageMax = int('courage_max', 'Courage max');
      const defense = int('defense', 'Defense');
      const questPts = int('quest_pts', 'Quest Points');
      const conditions = str('conditions');
      if (courageCurrent !== undefined) patch.courage_current = courageCurrent;
      if (courageMax !== undefined) patch.courage_max = courageMax;
      if (defense !== undefined) patch.defense = defense;
      if (questPts !== undefined) patch.quest_pts = questPts;
      if (conditions !== undefined) patch.conditions = conditions;
      break;
    }
    case 'attributes': {
      const vim = int('vim', 'Vim');
      const vigor = int('vigor', 'Vigor');
      const knack = int('knack', 'Knack');
      const knowhow = int('knowhow', 'Knowhow');
      const attack = int('attack', 'Attack');
      if (vim !== undefined) patch.vim = vim;
      if (vigor !== undefined) patch.vigor = vigor;
      if (knack !== undefined) patch.knack = knack;
      if (knowhow !== undefined) patch.knowhow = knowhow;
      if (attack !== undefined) patch.attack = attack;
      break;
    }
    case 'combat': {
      const dreadDie = str('dread_die');
      const attack = int('attack', 'Attack');
      const defense = int('defense', 'Defense');
      const courageMax = int('courage_max', 'Courage max');
      const courageCurrent = int('courage_current', 'Courage current');
      if (dreadDie !== undefined) {
        if (!/^d(6|8|10|12)$/.test(dreadDie)) {
          errors.push('Dread die must be d6, d8, d10, or d12');
        } else {
          patch.dread_die = dreadDie;
        }
      }
      if (attack !== undefined) patch.attack = attack;
      if (defense !== undefined) patch.defense = defense;
      if (courageMax !== undefined) patch.courage_max = courageMax;
      if (courageCurrent !== undefined) patch.courage_current = courageCurrent;
      break;
    }
    case 'progress': {
      const level = int('level', 'Level');
      const xp = int('xp', 'XP');
      const tier = str('tier');
      if (level !== undefined) patch.level = level;
      if (xp !== undefined) patch.xp = xp;
      if (tier !== undefined) {
        if (tier !== 'lite' && tier !== 'full') {
          errors.push('Tier must be "lite" or "full"');
        } else {
          patch.tier = tier;
        }
      }
      break;
    }
    case 'inventory': {
      const invWorn = str('inv_worn');
      const invCarried = str('inv_carried');
      const slotsUsed = int('slots_used', 'Slots used');
      const slotsMax = int('slots_max', 'Slots max');
      if (invWorn !== undefined) patch.inv_worn = invWorn;
      if (invCarried !== undefined) patch.inv_carried = invCarried;
      if (slotsUsed !== undefined) patch.slots_used = slotsUsed;
      if (slotsMax !== undefined) patch.slots_max = slotsMax;
      break;
    }
    case 'bio': {
      const folk = str('folk');
      const cls = str('class');
      const homeland = str('homeland');
      const portraitUrl = str('portrait_url');
      const perks = str('perks');
      if (folk !== undefined) patch.folk = folk;
      if (cls !== undefined) patch.class = cls;
      if (homeland !== undefined) patch.homeland = homeland;
      if (portraitUrl !== undefined) patch.portrait_url = portraitUrl;
      if (perks !== undefined) patch.perks = perks;
      break;
    }
  }

  if (errors.length > 0) {
    await interaction.reply({ content: `Validation errors:\n${errors.join('\n')}`, flags: MessageFlags.Ephemeral });
    return;
  }

  const updated = updateChar(charId, patch);
  await interaction.reply({ content: 'Updated.', flags: MessageFlags.Ephemeral });

  const { embed, components } = buildCharacterCard(updated);
  await (interaction.channel as GuildTextBasedChannel).send({ embeds: [embed], components });
}

function buildGroupModal(charIdStr: string, group: Group, char: CharRow): ModalBuilder {
  const title = group.charAt(0).toUpperCase() + group.slice(1);
  const modal = new ModalBuilder()
    .setCustomId(encode(['gmmodal', charIdStr, group]))
    .setTitle(`Edit ${title}`);

  let inputs: TextInputBuilder[];

  switch (group) {
    case 'vitals':
      inputs = [
        field('courage_current', 'Courage (current)', String(char.courage_current)),
        field('courage_max', 'Courage (max)', String(char.courage_max)),
        field('defense', 'Defense', String(char.defense)),
        field('quest_pts', 'Quest Points', String(char.quest_pts)),
        field('conditions', 'Conditions', char.conditions, TextInputStyle.Paragraph, false),
      ];
      break;
    case 'attributes':
      inputs = [
        field('vim', 'Vim', String(char.vim)),
        field('vigor', 'Vigor', String(char.vigor)),
        field('knack', 'Knack', String(char.knack)),
        field('knowhow', 'Knowhow', String(char.knowhow)),
        field('attack', 'Attack', String(char.attack)),
      ];
      break;
    case 'combat':
      inputs = [
        field('dread_die', 'Dread Die (d6/d8/d10/d12)', char.dread_die),
        field('attack', 'Attack', String(char.attack)),
        field('defense', 'Defense', String(char.defense)),
        field('courage_max', 'Courage (max)', String(char.courage_max)),
        field('courage_current', 'Courage (current)', String(char.courage_current)),
      ];
      break;
    case 'progress':
      inputs = [
        field('level', 'Level', String(char.level)),
        field('xp', 'XP', String(char.xp)),
        field('tier', 'Tier (lite/full)', char.tier),
      ];
      break;
    case 'inventory':
      inputs = [
        field('inv_worn', 'Worn', char.inv_worn, TextInputStyle.Short, false),
        field('inv_carried', 'Carried', char.inv_carried, TextInputStyle.Short, false),
        field('slots_used', 'Slots Used', String(char.slots_used)),
        field('slots_max', 'Slots Max', String(char.slots_max)),
      ];
      break;
    case 'bio':
      inputs = [
        field('folk', 'Folk', char.folk, TextInputStyle.Short, false),
        field('class', 'Class', char.class, TextInputStyle.Short, false),
        field('homeland', 'Homeland', char.homeland, TextInputStyle.Short, false),
        field('portrait_url', 'Portrait URL', char.portrait_url, TextInputStyle.Short, false),
        field('perks', 'Perks & Abilities', char.perks, TextInputStyle.Paragraph, false),
      ];
      break;
  }

  modal.addComponents(inputs.map(i => new ActionRowBuilder<TextInputBuilder>().addComponents(i)));
  return modal;
}

function field(
  customId: string,
  label: string,
  value: string,
  style = TextInputStyle.Short,
  required = true,
): TextInputBuilder {
  return new TextInputBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setValue(value)
    .setStyle(style)
    .setRequired(required);
}
