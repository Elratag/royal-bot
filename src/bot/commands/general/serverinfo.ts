import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../../types/index.js';

export const serverinfoCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display detailed statistics and information about this server'),
  category: 'general',
  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    const owner = await guild.fetchOwner();
    const channels = guild.channels.cache;
    const textCount = channels.filter(c => c.isTextBased()).size;
    const voiceCount = channels.filter(c => c.isVoiceBased()).size;

    const embed = new EmbedBuilder()
      .setColor('#C5A059')
      .setTitle(`👑 ${guild.name} - Server Overview`)
      .setThumbnail(guild.iconURL({ size: 256 }) || '')
      .addFields(
        { name: '👑 Owner', value: `${owner.user.tag} (<@${owner.id}>)`, inline: true },
        { name: '🆔 Server ID', value: `\`${guild.id}\``, inline: true },
        { name: '📅 Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '👥 Total Members', value: `**${guild.memberCount}** members`, inline: true },
        { name: '💬 Channels', value: `${textCount} Text | ${voiceCount} Voice`, inline: true },
        { name: '💎 Boost Level', value: `Tier ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
        { name: '🎭 Roles Count', value: `${guild.roles.cache.size} roles`, inline: true }
      )
      .setFooter({ text: 'Royal Bot Intelligence' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
