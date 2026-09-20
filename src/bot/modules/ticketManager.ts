import { 
  ChannelType, 
  ChatInputCommandInteraction, 
  ButtonInteraction, 
  Guild, 
  PermissionFlagsBits, 
  TextChannel, 
  User 
} from 'discord.js';
import { prisma } from '../../database/index.js';

export class TicketManager {
  static async createTicket(guild: Guild, user: User, panelId?: string): Promise<TextChannel | null> {
    try {
      const panel = panelId ? await prisma.ticketPanel.findUnique({ where: { id: panelId } }) : null;

      const ticketCount = await prisma.ticket.count({ where: { guildId: guild.id } });
      const channelName = `ticket-${(ticketCount + 1).toString().padStart(4, '0')}`;

      // Build permission overwrites: Deny @everyone, Allow Bot, Allow User, Allow Support Role
      const permissionOverwrites: any[] = [
        {
          id: guild.id, // @everyone
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: user.id, // Ticket Creator
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        {
          id: guild.members.me?.id || guild.client.user.id, // Bot
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ];

      if (panel?.supportRoleId) {
        permissionOverwrites.push({
          id: panel.supportRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        });
      }

      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: panel?.categoryId || undefined,
        permissionOverwrites,
      });

      // Save to database
      await prisma.ticket.create({
        data: {
          guildId: guild.id,
          panelId: panel?.id,
          channelId: channel.id,
          creatorId: user.id,
          status: 'OPEN',
        },
      });

      return channel;
    } catch (error) {
      console.error('❌ [TicketManager] Error creating ticket:', error);
      return null;
    }
  }

  static async generateHtmlTranscript(channel: TextChannel): Promise<string> {
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = Array.from(messages.values()).reverse();

    const rows = sorted.map(m => {
      const time = m.createdAt.toISOString().replace('T', ' ').substring(0, 19);
      const safeContent = m.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `
      <div class="message">
        <div class="avatar-col"><img src="${m.author.displayAvatarURL({ size: 64 })}" alt="${m.author.username}" /></div>
        <div class="body-col">
          <div class="header">
            <span class="author">${m.author.tag}</span>
            <span class="time">${time}</span>
          </div>
          <div class="content">${safeContent || '<i>[Embed or Attachment]</i>'}</div>
        </div>
      </div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Transcript - ${channel.name}</title>
  <style>
    body { background: #0c0d10; color: #e1e3ea; font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 24px; }
    .header-box { border-bottom: 2px solid #c5a059; padding-bottom: 16px; margin-bottom: 24px; }
    .header-box h1 { color: #c5a059; margin: 0 0 8px 0; }
    .message { display: flex; gap: 14px; margin-bottom: 16px; padding: 8px; border-radius: 6px; }
    .message:hover { background: #15171e; }
    .avatar-col img { width: 42px; height: 42px; border-radius: 50%; border: 1px solid #c5a059; }
    .author { font-weight: bold; color: #d4af37; margin-right: 8px; }
    .time { font-size: 0.8rem; color: #888da0; }
    .content { margin-top: 4px; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="header-box">
    <h1>👑 Royal Ticket Transcript</h1>
    <p>Channel: #${channel.name} | Guild: ${channel.guild.name} | Exported: ${new Date().toUTCString()}</p>
  </div>
  <div class="chat-log">
    ${rows}
  </div>
</body>
</html>`;
  }
}
