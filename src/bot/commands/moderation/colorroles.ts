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

export const colorrolesCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('colorroles')
    .setDescription('Deploy or refresh the interactive Color Role panel in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  category: 'moderation',
  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) return;

    await interaction.deferReply({ ephemeral: true });

    // Fetch existing panel or create a default one for this channel
    let panel = await prisma.colorPanel.findFirst({
      where: { guildId: guild.id },
      include: { options: true },
    });

    if (!panel) {
      panel = await prisma.colorPanel.create({
        data: {
          guildId: guild.id,
          channelId: interaction.channelId,
          title: '👑 Royal Color Selection',
          description: 'Choose your desired VIP name color from the buttons below!',
          singleColor: true,
        },
        include: { options: true },
      });
    }

    if (panel.options.length === 0) {
      await interaction.editReply({
        content: '⚠️ No colors configured yet! Please add colors in the **Web Dashboard** under **Color Roles** before deploying.',
      });
      return;
    }

    // Build buttons in rows of up to 5
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    let currentRow = new ActionRowBuilder<ButtonBuilder>();

    for (let i = 0; i < panel.options.length; i++) {
      const opt = panel.options[i];
      const btn = new ButtonBuilder()
        .setCustomId(`color_role:${opt.roleId}:${panel.id}`)
        .setLabel(opt.name)
        .setStyle(ButtonStyle.Secondary);

      if (opt.emoji) {
        btn.setEmoji(opt.emoji);
      }

      currentRow.addComponents(btn);

      if (currentRow.components.length === 5 || i === panel.options.length - 1) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder<ButtonBuilder>();
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#C5A059')
      .setTitle(panel.title)
      .setDescription(panel.description || 'Click an option to toggle your color role!')
      .setFooter({ text: panel.singleColor ? 'Single Color Mode: Previous color removed automatically' : 'Multi-color mode' });

    const channel = interaction.channel as TextChannel | null;
    if (channel && 'send' in channel) {
      const msg = await channel.send({ embeds: [embed], components: rows });
      await prisma.colorPanel.update({
        where: { id: panel.id },
        data: { channelId: interaction.channelId, messageId: msg.id },
      });

      await interaction.editReply({ content: '✅ Color panel deployed successfully!' });
    }
  },
};
