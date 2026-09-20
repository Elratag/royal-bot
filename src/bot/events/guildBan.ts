import { EmbedBuilder, GuildBan, TextChannel } from 'discord.js';
import { prisma } from '../../database/index.js';
import { AuditLogManager } from '../modules/auditLogManager.js';

export async function onGuildBanAdd(ban: GuildBan) {
  try {
    const logConfig = await prisma.logConfig.findUnique({
      where: { guildId: ban.guild.id },
    });

    if (logConfig?.banLogChannel) {
      const channel = ban.guild.channels.cache.get(logConfig.banLogChannel) as TextChannel;
      if (channel) {
        const executor = await AuditLogManager.getBanExecutor(ban.guild, ban.user.id);
        const embed = new EmbedBuilder()
          .setColor('#DC2626') // Dark red
          .setTitle('🔨 Member Banned')
          .addFields(
            { name: 'User', value: `${ban.user.tag} (<@${ban.user.id}>)`, inline: true },
            { name: 'Banned By', value: executor ? `${executor.tag} (<@${executor.id}>)` : 'Unknown', inline: true },
            { name: 'Reason', value: ban.reason || 'No reason provided', inline: false }
          )
          .setThumbnail(ban.user.displayAvatarURL())
          .setFooter({ text: `User ID: ${ban.user.id}` })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    console.error('[guildBanAdd] Error:', err);
  }
}

export async function onGuildBanRemove(ban: GuildBan) {
  try {
    const logConfig = await prisma.logConfig.findUnique({
      where: { guildId: ban.guild.id },
    });

    if (logConfig?.banLogChannel) {
      const channel = ban.guild.channels.cache.get(logConfig.banLogChannel) as TextChannel;
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor('#10B981') // Emerald green
          .setTitle('🔓 Member Unbanned')
          .setDescription(`**User:** ${ban.user.tag} (<@${ban.user.id}>) was unbanned.`)
          .setThumbnail(ban.user.displayAvatarURL())
          .setFooter({ text: `User ID: ${ban.user.id}` })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    console.error('[guildBanRemove] Error:', err);
  }
}
