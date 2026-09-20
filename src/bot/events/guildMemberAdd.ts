import { EmbedBuilder, GuildMember, TextChannel } from 'discord.js';
import { prisma } from '../../database/index.js';

export async function onGuildMemberAdd(member: GuildMember) {
  const guild = member.guild;

  // 1. Handle Auto Roles
  try {
    const autoRoles = await prisma.autoRole.findMany({
      where: { guildId: guild.id },
    });

    if (autoRoles.length > 0) {
      const botMember = guild.members.me;
      const botHighestRole = botMember?.roles.highest;

      for (const ar of autoRoles) {
        const role = guild.roles.cache.get(ar.roleId);
        if (role && botHighestRole && botHighestRole.position > role.position) {
          await member.roles.add(role).catch(err => {
            console.warn(`[AutoRole] Failed to assign role ${role.name}:`, err.message);
          });
        }
      }
    }
  } catch (err) {
    console.error('[AutoRole] Error:', err);
  }

  // 2. Handle Welcome System
  try {
    const welcomeConfig = await prisma.welcomeConfig.findUnique({
      where: { guildId: guild.id },
    });

    if (welcomeConfig && welcomeConfig.enabled && welcomeConfig.channelId) {
      const channel = guild.channels.cache.get(welcomeConfig.channelId) as TextChannel;
      if (channel && channel.isTextBased()) {
        const formattedMsg = welcomeConfig.message
          .replace(/{user}/g, `<@${member.id}>`)
          .replace(/{username}/g, member.user.username)
          .replace(/{server}/g, guild.name)
          .replace(/{memberCount}/g, guild.memberCount.toString());

        if (welcomeConfig.embedEnabled) {
          const embed = new EmbedBuilder()
            .setColor((welcomeConfig.embedColor as any) || '#C5A059')
            .setTitle(welcomeConfig.embedTitle || '👑 Welcome to the Realm')
            .setDescription(formattedMsg)
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setTimestamp()
            .setFooter({ text: `${guild.name} • Member #${guild.memberCount}` });

          await channel.send({ content: `<@${member.id}>`, embeds: [embed] });
        } else {
          await channel.send(formattedMsg);
        }
      }
    }
  } catch (err) {
    console.error('[Welcome System] Error:', err);
  }

  // 3. Member Join Log
  try {
    const logConfig = await prisma.logConfig.findUnique({
      where: { guildId: guild.id },
    });

    if (logConfig?.memberLogChannel) {
      const logChannel = guild.channels.cache.get(logConfig.memberLogChannel) as TextChannel;
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#4ADE80') // Green
          .setTitle('📥 Member Joined')
          .setDescription(`**Member:** ${member.user.tag} (<@${member.id}>)\n**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: `User ID: ${member.id}` })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    console.error('[Member Join Log] Error:', err);
  }
}
