// SPDX-License-Identifier: Apache-2.0
// Original software copyright [YEAR] [YOUR NAME].
// See LICENSE and NOTICE at the repository root.
//
// Note: the strings "Land of Eem", "Compatible with Land of Eem", and the
// attribution to Ben Costa and James Parks are used solely for identification
// and attribution purposes as permitted by the Land of Eem Open License.
// This bot is not official, endorsed by, or affiliated with Land of Eem or
// its creators.  See LICENSES/LAND-OF-EEM-OPEN-LICENSE.md.

import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';

const REPO_URL = 'https://github.com/nsuurmey/land-of-eem-character-sheets';

export async function handleAbout(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0xba7517)
    .setTitle('Eem Character Sheet Bot')
    .setDescription(
      'A fan-made Discord bot for play-by-post *Land of Eem* games.\n' +
      'Stores character sheets and lets players roll dice via buttons.\n\n' +
      '**Compatible with Land of Eem.**\n' +
      'This bot is not official, not endorsed by, and not affiliated with ' +
      'the creators or publishers of Land of Eem.\n\n' +
      '*Land of Eem* was created by **Ben Costa and James Parks**.\n' +
      'Learn more at <https://landofeem.com>.',
    )
    .addFields(
      { name: 'Source code', value: `<${REPO_URL}>`, inline: true },
      { name: 'License info', value: 'Use `/license` for details', inline: true },
    );

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

export async function handleLicense(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Licensing Information')
    .addFields(
      {
        name: 'Bot source code — Apache License 2.0',
        value:
          'The original software (TypeScript source, configuration, scripts) is ' +
          'licensed under the **Apache License 2.0**.\n' +
          `See: <${REPO_URL}/blob/main/LICENSE>`,
      },
      {
        name: 'Land of Eem SRD-derived content — Land of Eem Open License',
        value:
          'Game terminology, result band definitions, and attribute names are ' +
          'derived from the Land of Eem SRD and governed by the ' +
          '**Land of Eem Open License (LOEL)**.\n' +
          'SRD-derived content is NOT licensed under Apache 2.0.\n' +
          `See: <${REPO_URL}/blob/main/LICENSES/LAND-OF-EEM-OPEN-LICENSE.md>`,
      },
      {
        name: 'Disclaimer',
        value:
          'This bot is not official, not endorsed by, and not affiliated with ' +
          'the creators or publishers of *Land of Eem*. ' +
          '"Land of Eem" is a trademark of its creators. [verify against LOEL]',
      },
    );

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
