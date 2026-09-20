import { EmbedBuilder, TextChannel, VoiceState } from 'discord.js';
import { prisma } from '../../database/index.js';
import { AuditLogManager } from '../modules/auditLogManager.js';

export async function onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  const guild = newState.guild;
  const member = newState.member;
  if (!member || member.user.bot) return;

  try {
    const logConfig = await prisma.logConfig.findUnique({
      where: { guildId: guild.id },
    });

    if (!logConfig) return;

    // 1. Voice Channel Move (سحب أو انتقال)
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      if (logConfig.voiceLogChannel) {
        const channel = guild.channels.cache.get(logConfig.voiceLogChannel) as TextChannel;
        if (channel) {
          const executor = await AuditLogManager.getVoiceMoveExecutor(guild, member.id, newState.channelId);
          const isDragged = executor && executor.id !== member.id;
          console.log(`[Voice Move Event] Member: ${member.user.tag}, from: ${oldState.channelId} to: ${newState.channelId}, Executor: ${executor ? executor.tag : 'Self'}`);

          const embed = new EmbedBuilder()
            .setColor(isDragged ? '#F59E0B' : '#38BDF8')
            .setTitle(isDragged ? '🧲 سحب عضو إلى روم صوتي (Member Dragged)' : '🔊 انتقال عضو بين الرومات (Member Moved)')
            .addFields(
              { name: isDragged ? 'المسحوب (Target)' : 'العضو (Member)', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
              ...(isDragged ? [{ name: 'الساحب (Moderator)', value: `${executor.tag} (<@${executor.id}>)`, inline: true }] : []),
              { name: 'الروم السابق (Old Channel)', value: `<#${oldState.channelId}>`, inline: true },
              { name: 'الروم الجديد (New Channel)', value: `<#${newState.channelId}>`, inline: true }
            )
            .setFooter({ text: isDragged ? `تم السحب بواسطة: ${executor.tag}` : 'انتقال شخصي ذاتي' })
            .setTimestamp();

          await channel.send({ embeds: [embed] });
        }
      }
    }

    // 2. Server Mute
    if (oldState.serverMute !== newState.serverMute && logConfig.muteLogChannel) {
      const channel = guild.channels.cache.get(logConfig.muteLogChannel) as TextChannel;
      if (channel) {
        const executor = await AuditLogManager.getVoiceModerator(guild, member.id);
        const action = newState.serverMute ? 'Server Muted' : 'Server Unmuted';
        const embed = new EmbedBuilder()
          .setColor(newState.serverMute ? '#EF4444' : '#10B981')
          .setTitle(`🎙️ ${action}`)
          .addFields(
            { name: 'Member', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
            { name: 'Action', value: action, inline: true },
            { name: 'Moderator', value: executor ? `${executor.tag} (<@${executor.id}>)` : 'Unknown', inline: true }
          )
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    }

    // 3. Server Deafen
    if (oldState.serverDeaf !== newState.serverDeaf && logConfig.muteLogChannel) {
      const channel = guild.channels.cache.get(logConfig.muteLogChannel) as TextChannel;
      if (channel) {
        const executor = await AuditLogManager.getVoiceModerator(guild, member.id);
        const action = newState.serverDeaf ? 'Server Deafened' : 'Server Undeafened';
        const embed = new EmbedBuilder()
          .setColor(newState.serverDeaf ? '#EF4444' : '#10B981')
          .setTitle(`🔇 ${action}`)
          .addFields(
            { name: 'Member', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
            { name: 'Action', value: action, inline: true },
            { name: 'Moderator', value: executor ? `${executor.tag} (<@${executor.id}>)` : 'Unknown', inline: true }
          )
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    console.error('[voiceStateUpdate] Error:', err);
  }
}
