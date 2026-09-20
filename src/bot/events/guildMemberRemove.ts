import { EmbedBuilder, GuildMember, PartialGuildMember, TextChannel } from 'discord.js';
import { prisma } from '../../database/index.js';
import { AuditLogManager } from '../modules/auditLogManager.js';

export async function onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
  const guild = member.guild;

  try {
    const logConfig = await prisma.logConfig.findUnique({
      where: { guildId: guild.id },
    });

    if (!logConfig) return;

    // Check if member was kicked via audit logs
    const kickExecutor = await AuditLogManager.getKickExecutor(guild, member.id);

    if (kickExecutor && logConfig.kickLogChannel) {
      const kickChannel = guild.channels.cache.get(logConfig.kickLogChannel) as TextChannel;
      if (kickChannel) {
        const embed = new EmbedBuilder()
          .setColor('#EF4444') // Red
          .setTitle('👢 Member Kicked')
          .addFields(
            { name: 'Kicked Member', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
            { name: 'Executed By', value: `${kickExecutor.tag} (<@${kickExecutor.id}>)`, inline: true },
            { name: 'Member ID', value: member.id, inline: false }
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp();

        await kickChannel.send({ embeds: [embed] });
        return;
      }
    }

    // Standard Leave Log
    if (logConfig.memberLogChannel) {
      const leaveChannel = guild.channels.cache.get(logConfig.memberLogChannel) as TextChannel;
      if (leaveChannel) {
        const embed = new EmbedBuilder()
          .setColor('#F59E0B') // Amber
          .setTitle('📤 Member Left')
          .setDescription(`**Member:** ${member.user.tag} (<@${member.id}>) has left the server.`)
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: `User ID: ${member.id} • Members: ${guild.memberCount}` })
          .setTimestamp();

        await leaveChannel.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    console.error('[guildMemberRemove] Error:', err);
  }
}
