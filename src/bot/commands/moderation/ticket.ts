import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  SlashCommandBuilder,
  TextChannel
} from 'discord.js';
import { SlashCommand } from '../../../types/index.js';
import { prisma } from '../../../database/index.js';

export const ticketCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Deploy or refresh the Royal Support Ticket panel in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  category: 'tickets',
  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) return;

    await interaction.deferReply({ ephemeral: true });

    let panel = await prisma.ticketPanel.findFirst({
      where: { guildId: guild.id },
    });

    if (!panel) {
      panel = await prisma.ticketPanel.create({
        data: {
          guildId: guild.id,
          channelId: interaction.channelId,
          title: '🎟️ Royal Support Tickets',
          description: 'Need assistance from our staff team? Click the button below to open a private ticket channel.',
        },
      });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_open:${panel.id}`)
        .setLabel('Open Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📩')
    );

    const embed = new EmbedBuilder()
      .setColor('#C5A059')
      .setTitle(panel.title)
      .setDescription(panel.description || 'Click the button below to open a ticket.')
      .setFooter({ text: 'Royal Ticket System • Fast & Secure Staff Support' });

    const channel = interaction.channel as TextChannel | null;
    if (channel && 'send' in channel) {
      const msg = await channel.send({ embeds: [embed], components: [row] });
      await prisma.ticketPanel.update({
        where: { id: panel.id },
        data: { channelId: interaction.channelId, messageId: msg.id },
      });

      await interaction.editReply({ content: '✅ Ticket panel successfully deployed!' });
    }
  },
};
