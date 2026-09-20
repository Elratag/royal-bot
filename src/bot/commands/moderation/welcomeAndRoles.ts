import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../../types/index.js';
import { prisma } from '../../../database/index.js';

export const welcomeCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('View or test current Welcome message configuration')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  category: 'moderation',
  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) return;

    const config = await prisma.welcomeConfig.findUnique({
      where: { guildId: guild.id },
    });

    if (!config || !config.enabled) {
      await interaction.reply({
        content: '⚙️ Welcome system is currently **Disabled** for this server. Enable and customize it in the **Web Dashboard**!',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor((config.embedColor as any) || '#C5A059')
      .setTitle(`[Test Preview] ${config.embedTitle}`)
      .setDescription(
        config.message
          .replace(/{user}/g, `<@${interaction.user.id}>`)
          .replace(/{username}/g, interaction.user.username)
          .replace(/{server}/g, guild.name)
          .replace(/{memberCount}/g, guild.memberCount.toString())
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: `Channel: <#${config.channelId}> • Configured via Royal Dashboard` });

    await interaction.reply({
      content: '✅ Here is a preview of the active welcome configuration:',
      embeds: [embed],
      ephemeral: true,
    });
  },
};

export const autoroleCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('List all configured auto roles for new members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  category: 'moderation',
  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) return;

    const autoRoles = await prisma.autoRole.findMany({
      where: { guildId: guild.id },
    });

    if (autoRoles.length === 0) {
      await interaction.reply({
        content: '⚙️ No auto roles configured yet. Configure automatic roles in the **Web Dashboard**!',
        ephemeral: true,
      });
      return;
    }

    const rolesList = autoRoles.map(ar => `<@&${ar.roleId}>`).join(', ');

    const embed = new EmbedBuilder()
      .setColor('#C5A059')
      .setTitle('🎭 Configured Auto Roles')
      .setDescription(`New members will automatically receive:\n${rolesList}`)
      .setFooter({ text: 'Ensure the Bot role is placed higher than these roles in Server Settings!' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
