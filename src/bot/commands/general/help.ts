import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../../types/index.js';
import { config } from '../../../config/index.js';

export const helpCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Explore all Royal Bot features and access the Web Dashboard'),
  category: 'general',
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#C5A059')
      .setTitle('👑 Royal Bot & Dashboard Command Directory')
      .setDescription('Welcome to **Royal Bot**, the ultimate Discord management suite.\nAll features can be controlled in real time from the external web dashboard!')
      .addFields(
        {
          name: '🛡️ Moderation & Administration',
          value: '`/setup` • `/welcome` • `/autorole` • `/colorroles` • `/ticket`',
          inline: false,
        },
        {
          name: '🎵 Music System',
          value: '`/play` • `/pause` • `/resume` • `/skip` • `/stop` • `/queue` • `/volume` • `/loop` • `/nowplaying`',
          inline: false,
        },
        {
          name: '🎬 Cinema & Movies',
          value: '`/playmovie` — Start synchronized Watch Party Activity in voice channel',
          inline: false,
        },
        {
          name: '⚙️ General & Info',
          value: '`/help` • `/ping` • `/serverinfo`',
          inline: false,
        }
      )
      .setFooter({ text: 'Royal Luxury Edition • 24/7 Production Suite' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Open Web Dashboard')
        .setStyle(ButtonStyle.Link)
        .setURL(config.server.dashboardUrl)
        .setEmoji('🌐')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
