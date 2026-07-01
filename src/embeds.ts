import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import type { CharRow } from './db.js';
import { encode } from './ids.js';

export function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function buildCharacterCard(c: CharRow): {
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
} {
  const displayName = c.pronouns?.trim()
    ? `${c.name} (${c.pronouns.trim()})`
    : c.name;

  const embed = new EmbedBuilder()
    .setColor(0xba7517)
    .setAuthor({ name: displayName })
    .setDescription(`${c.folk} ${c.class} · Level ${c.level} · ${c.xp} XP${c.kind === 'npc' ? ' · NPC' : ''}`);

  if (c.portrait_url) {
    embed.setThumbnail(c.portrait_url);
  }

  if (c.tier === 'full') {
    // TODO Phase 1.5: expand Attributes into 16 skills, add Conditions, Proficiencies,
    // and the full inventory economy. For now fall through to Lite layout.
  }

  // Lite tier layout
  embed.addFields(
    {
      name: 'Attributes',
      value: `Vim ${fmtMod(c.vim)} · Vigor ${fmtMod(c.vigor)} · Knack ${fmtMod(c.knack)} · Knowhow ${fmtMod(c.knowhow)}`,
      inline: true,
    },
    {
      name: 'Vitals',
      value: `Courage ${c.courage_current}/${c.courage_max} · Attack ${fmtMod(c.attack)} · Defense ${c.defense} · Block ${c.block} · Dread ${c.dread_die} · Quest ${c.quest_pts}`,
      inline: true,
    },
    {
      name: 'Inventory',
      value: `Worn: ${c.inv_worn || '—'} | Carried: ${c.inv_carried || '—'} | Slots ${c.slots_used}/${c.slots_max}`,
    },
    {
      name: 'Perks & Abilities',
      value: c.perks || '—',
    },
  );

  const id = String(c.id);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(encode(['roll', id, 'vim'])).setLabel('Roll Vim').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(encode(['roll', id, 'vigor'])).setLabel('Roll Vigor').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(encode(['roll', id, 'knack'])).setLabel('Roll Knack').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(encode(['roll', id, 'knowhow'])).setLabel('Roll Knowhow').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(encode(['roll', id, 'attack'])).setLabel('Attack').setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(encode(['dread', id])).setLabel('Roll Dread').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(encode(['gmedit', id])).setLabel('Edit · GM').setStyle(ButtonStyle.Primary),
  );

  return { embed, components: [row1, row2] };
}
