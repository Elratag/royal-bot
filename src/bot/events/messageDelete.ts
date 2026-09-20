import { EmbedBuilder, Message, PartialMessage, TextChannel } from 'discord.js';
import { prisma } from '../../database/index.js';
import { getCachedMessage } from '../cache/messageCache.js';
import { AuditLogManager } from '../modules/auditLogManager.js';

export async function onMessageDelete(message: Message | PartialMessage) {
  const guild = message.guild;
  if (!guild) return;

  try {
    const logConfig = await prisma.logConfig.findUnique({
      where: { guildId: guild.id },
    });

    if (!logConfig?.messageLogChannel) return;

    const logChannel = guild.channels.cache.get(logConfig.messageLogChannel) as TextChannel;
    if (!logChannel) return;

    const cached = getCachedMessage(message.id);
    const authorId = cached?.authorId || message.author?.id;
    const authorTag = cached?.authorTag || message.author?.tag || 'Unknown User';
    const content = cached?.content || (message.content ? message.content : '*(Message content not cached or empty)*');

    // Check if a moderator deleted the message
    let deletedByStr = 'Author (Self-deleted) or Unknown';
    if (authorId) {
      const moderator = await AuditLogManager.getMessageDeleteExecutor(guild, authorId, message.channel.id);
      if (moderator) {
        deletedByStr = `${moderator.tag} (<@${moderator.id}>)`;
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#EF4444')
      .setTitle('🗑️ Message Deleted')
      .addFields(
        { name: 'Author', value: authorId ? `<@${authorId}> (${authorTag})` : authorTag, inline: true },
        { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
        { name: 'Deleted By', value: deletedByStr, inline: true },
        { name: 'Content', value: content.length > 1024 ? content.substring(0, 1020) + '...' : content, inline: false }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[onMessageDelete] Error:', err);
  }
}
