import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../../types/index.js';
import { config } from '../../../config/index.js';

export const setupCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Quick setup guide to configure the bot via the Royal Web Dashboard')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  category: 'admin',
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#C5A059')
      .setTitle('👑 Royal Setup & Dashboard Access')
      .setDescription(
        'All bot systems are managed visually through the external **Web Dashboard**.\n\n' +
        '**Available Modules in Dashboard:**\n' +
        '• **Welcome System:** Custom embeds, channels & formatting\n' +
        '• **Auto Roles:** Automatically grant roles to new members\n' +
        '• **Color Roles:** Create interactive color picker panels\n' +
        '• **Logs System:** Distinct channels for joins, kicks, bans, voice, mute, & deleted messages\n' +
        '• **Tickets:** Support categories, transcripts & claim buttons\n' +
        '• **Auto Response:** Custom triggers & automated replies\n' +
        '• **Music & Cinema:** Volume, queues, & synced Watch Party activities\n' +
        '• **Commands & Bot Settings:** Enable/disable commands and adjust bot presence'
      )
      .setFooter({ text: 'Requires Administrator Permissions' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Manage on Web Dashboard')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.server.dashboardUrl}/guilds/${interaction.guildId}`)
        .setEmoji('⚙️')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
