// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 nsuurmey. See LICENSE.
//
// SRD-DERIVED CONTENT: KEY_LABELS values (Vim, Vigor, Knack, Knowhow) are Land of
// Eem attribute names from the SRD, governed by the Land of Eem Open License.
// See LICENSES/LAND-OF-EEM-OPEN-LICENSE.md. They are NOT licensed under Apache 2.0.

import { ButtonInteraction, MessageFlags } from 'discord.js';
import { getCharById } from '../db.js';
import { decode } from '../ids.js';
import { resolveD12, resolveDread } from '../roll.js';
import { fmtMod } from '../embeds.js';
import { isGM } from '../config.js';
import type { CharRow } from '../db.js';

const KEY_LABELS: Record<string, string> = {
  vim: 'Vim',
  vigor: 'Vigor',
  knack: 'Knack',
  knowhow: 'Knowhow',
  attack: 'Attack',
};

const KEY_TO_STAT: Record<string, keyof CharRow> = {
  vim: 'vim',
  vigor: 'vigor',
  knack: 'knack',
  knowhow: 'knowhow',
  attack: 'attack',
};

export async function handleRollButton(interaction: ButtonInteraction) {
  const [, charIdStr, key] = decode(interaction.customId);
  const charId = parseInt(charIdStr, 10);

  const char = getCharById(charId);
  if (!char) {
    await interaction.reply({ content: 'Character not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (interaction.user.id !== char.owner_user_id && !isGM(interaction)) {
    await interaction.reply({ content: "That's not your character.", flags: MessageFlags.Ephemeral });
    return;
  }

  const statKey = KEY_TO_STAT[key];
  if (!statKey) {
    await interaction.reply({ content: 'Unknown roll type.', flags: MessageFlags.Ephemeral });
    return;
  }

  const mod = char[statKey] as number;
  const { die, total, band } = resolveD12(mod);
  const label = KEY_LABELS[key] ?? key;

  await interaction.reply(
    `**${char.name}** rolls ${label} — d12 [${die}] ${fmtMod(mod)} = **${total}** → **${band}**`,
  );
}

export async function handleDreadButton(interaction: ButtonInteraction) {
  const [, charIdStr] = decode(interaction.customId);
  const charId = parseInt(charIdStr, 10);

  const char = getCharById(charId);
  if (!char) {
    await interaction.reply({ content: 'Character not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (interaction.user.id !== char.owner_user_id && !isGM(interaction)) {
    await interaction.reply({ content: "That's not your character.", flags: MessageFlags.Ephemeral });
    return;
  }

  const { die } = resolveDread(char.dread_die);
  await interaction.reply(
    `**${char.name}** rolls Dread — ${char.dread_die} [${die}] = **${die} damage**`,
  );
}
