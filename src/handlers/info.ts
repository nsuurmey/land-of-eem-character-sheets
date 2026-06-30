// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 nsuurmey. See LICENSE.
//
// Note: "Land of Eem" and "Compatible with Land of Eem" are used solely for
// identification and attribution purposes as required by the Land of Eem Open
// License §8 and §10. This bot is not official, endorsed by, or affiliated
// with the creators of Land of Eem. See LICENSES/LAND-OF-EEM-OPEN-LICENSE.md.

import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';

const REPO_URL = 'https://github.com/nsuurmey/land-of-eem-character-sheets';

export async function handleAbout(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0xba7517)
    .setTitle('Eem Character Sheet Bot')
    .setDescription(
      'A fan-made Discord bot for play-by-post *Land of Eem* games.\n' +
      'Stores character sheets and lets players roll dice via buttons.\n\n' +
      '**Compatible with Land of Eem.**\n\n' +
      'This bot is not official, not endorsed by, and not affiliated with ' +
      'the creators or publishers of *Land of Eem*. ' +
      '*Land of Eem* is a trademark of its creators.\n\n' +
      'Use `/license` for full licensing and attribution information.',
    )
    .addFields(
      { name: 'Source', value: `<${REPO_URL}>`, inline: true },
      { name: 'Version', value: '1.0.0', inline: true },
    );

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

export async function handleLicense(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Licensing Information')
    .addFields(
      {
        name: 'Required LOEL Notice',
        value:
          'This work was created using the Land Of Eem TTRPG Open License.\n' +
          'Land Of Eem TTRPG Open License, v.1.0 Copyright 2025, Ben Costa and James Parks.',
      },
      {
        name: 'Bot source code — Apache License 2.0',
        value:
          'Original software copyright 2026 nsuurmey.\n' +
          `See: <${REPO_URL}/blob/main/LICENSE>`,
      },
      {
        name: 'Land of Eem SRD content — Land of Eem Open License',
        value:
          'Result band names, attribute names, and game terminology are from ' +
          'the Land of Eem SRD. This content is governed by the LOEL and is ' +
          '**not** licensed under Apache 2.0.\n' +
          `See: <${REPO_URL}/blob/main/LICENSES/LAND-OF-EEM-OPEN-LICENSE.md>`,
      },
      {
        name: 'Disclaimer',
        value:
          'This bot is not official, not endorsed by, and not affiliated with ' +
          'the creators or publishers of *Land of Eem*. ' +
          '"Land of Eem" is a trademark of its creators.',
      },
    );

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
