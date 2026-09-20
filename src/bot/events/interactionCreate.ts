import { 
  ActionRowBuilder, 
  AttachmentBuilder, 
  ButtonBuilder, 
  ButtonInteraction, 
  ButtonStyle, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  Interaction, 
  PermissionFlagsBits, 
  TextChannel 
} from 'discord.js';
import { ExtendedClient } from '../../types/index.js';
import { prisma } from '../../database/index.js';
import { TicketManager } from '../modules/ticketManager.js';
import { CinemaManager } from '../modules/cinemaManager.js';

export async function onInteractionCreate(interaction: Interaction, client: ExtendedClient) {
  // 1. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction, client);
    return;
  }

  // 2. Handle Button Interactions
  if (interaction.isButton()) {
    await handleButtonInteraction(interaction, client);
    return;
  }
}

async function handleSlashCommand(interaction: ChatInputCommandInteraction, client: ExtendedClient) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const guildId = interaction.guildId;

  // Check Guild Command Settings
  if (guildId) {
    try {
      const setting = await prisma.commandSetting.findUnique({
        where: {
          guildId_commandName: {
            guildId,
            commandName: interaction.commandName,
          },
        },
      });

      if (setting && !setting.enabled) {
        await interaction.reply({
          content: '⚠️ This command has been disabled by the server administration.',
          ephemeral: true,
        });
        return;
      }
    } catch (err) {
      console.error('[CommandSetting Check Error]:', err);
    }
  }

  try {
    await command.execute(interaction, client);
  } catch (error: any) {
    console.error(`❌ [Command Error: /${interaction.commandName}]:`, error);
    const replyContent = '❌ There was an error while executing this command!';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: replyContent, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: replyContent, ephemeral: true }).catch(() => {});
    }
  }
}

async function handleButtonInteraction(interaction: ButtonInteraction, client: ExtendedClient) {
  const customId = interaction.customId;
  const guild = interaction.guild;
  if (!guild) return;

  // --- TICKET SYSTEM BUTTONS ---
  if (customId.startsWith('ticket_open')) {
    const parts = customId.split(':');
    const panelId = parts[1];

    await interaction.deferReply({ ephemeral: true });

    // Check if user already has an open ticket
    const existing = await prisma.ticket.findFirst({
      where: {
        guildId: guild.id,
        creatorId: interaction.user.id,
        status: 'OPEN',
      },
    });

    if (existing) {
      await interaction.editReply({
        content: `⚠️ You already have an open ticket in <#${existing.channelId}>!`,
      });
      return;
    }

    const channel = await TicketManager.createTicket(guild, interaction.user, panelId);

    if (!channel) {
      await interaction.editReply({ content: '❌ Failed to create ticket channel. Please check bot permissions.' });
      return;
    }

    // Send initial message in ticket channel
    const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('Claim Ticket')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🙋'),
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );

    const welcomeEmbed = new EmbedBuilder()
      .setColor('#C5A059')
      .setTitle('👑 Royal Support Ticket')
      .setDescription(`Welcome <@${interaction.user.id}>! Our support staff will assist you shortly.\nUse the controls below to manage this ticket.`)
      .setTimestamp();

    await channel.send({ content: `<@${interaction.user.id}>`, embeds: [welcomeEmbed], components: [controlRow] });

    await interaction.editReply({
      content: `✅ Your ticket has been created: <#${channel.id}>`,
    });
    return;
  }

  if (customId === 'ticket_claim') {
    const member = await guild.members.fetch(interaction.user.id);
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({ content: '❌ Only staff can claim tickets.', ephemeral: true });
      return;
    }

    await prisma.ticket.updateMany({
      where: { channelId: interaction.channelId },
      data: { status: 'CLAIMED', claimedBy: interaction.user.id },
    });

    const embed = new EmbedBuilder()
      .setColor('#10B981')
      .setDescription(`🙋 **Ticket claimed by <@${interaction.user.id}>**`);

    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (customId === 'ticket_transcript') {
    await interaction.deferReply();
    const textChannel = interaction.channel as TextChannel;
    const html = await TicketManager.generateHtmlTranscript(textChannel);
    const attachment = new AttachmentBuilder(Buffer.from(html, 'utf-8'), { name: `transcript-${textChannel.name}.html` });

    await interaction.editReply({
      content: '📜 Here is the transcript for this ticket:',
      files: [attachment],
    });
    return;
  }

  if (customId === 'ticket_close') {
    await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });

    const textChannel = interaction.channel as TextChannel;
    const html = await TicketManager.generateHtmlTranscript(textChannel);
    const attachment = new AttachmentBuilder(Buffer.from(html, 'utf-8'), { name: `transcript-${textChannel.name}.html` });

    // Find log channel
    const logConfig = await prisma.logConfig.findUnique({ where: { guildId: guild.id } });
    if (logConfig?.ticketLogChannel) {
      const logChannel = guild.channels.cache.get(logConfig.ticketLogChannel) as TextChannel;
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#EF4444')
          .setTitle('🎫 Ticket Closed')
          .addFields(
            { name: 'Channel', value: textChannel.name, inline: true },
            { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [embed], files: [attachment] }).catch(() => {});
      }
    }

    await prisma.ticket.updateMany({
      where: { channelId: textChannel.id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    setTimeout(async () => {
      await textChannel.delete().catch(() => {});
    }, 5000);
    return;
  }

  // --- COLOR ROLES BUTTONS ---
  if (customId.startsWith('color_role:')) {
    const [, roleId, panelId] = customId.split(':');
    const member = await guild.members.fetch(interaction.user.id);
    const targetRole = guild.roles.cache.get(roleId);

    if (!targetRole) {
      await interaction.reply({ content: '❌ This color role no longer exists.', ephemeral: true });
      return;
    }

    const botMember = guild.members.me;
    if (botMember && botMember.roles.highest.position <= targetRole.position) {
      await interaction.reply({ content: '❌ Bot role hierarchy is lower than this role. Please elevate the bot role in Server Settings.', ephemeral: true });
      return;
    }

    const panel = await prisma.colorPanel.findUnique({
      where: { id: panelId },
      include: { options: true },
    });

    if (panel?.singleColor) {
      // Remove other colors from this panel
      const otherRoleIds = panel.options.map(o => o.roleId).filter(id => id !== roleId);
      for (const otherId of otherRoleIds) {
        if (member.roles.cache.has(otherId)) {
          await member.roles.remove(otherId).catch(() => {});
        }
      }
    }

    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
      await interaction.reply({ content: `🎨 Removed color role **${targetRole.name}**!`, ephemeral: true });
    } else {
      await member.roles.add(roleId);
      await interaction.reply({ content: `🎨 Applied color role **${targetRole.name}**!`, ephemeral: true });
    }
    return;
  }

  // --- CINEMA ROOM CONTROLS ---
  if (customId.startsWith('cinema_')) {
    const member = await guild.members.fetch(interaction.user.id);
    const voiceChannel = member.voice.channel;

    // Check user constraint: Must be in a voice channel
    if (!voiceChannel) {
      await interaction.reply({
        content: '❌ لا يمكنك التحكم في صالة السينما أو المشاهدة إلا بعد الانضمام إلى إحدى القنوات الصوتية في السيرفر!',
        ephemeral: true,
      });
      return;
    }

    const [action, channelId] = customId.split(':');

    if (action === 'cinema_toggle') {
      const { isPlaying } = CinemaManager.toggle(channelId, member.displayName || member.user.username);
      if (isPlaying) {
        await interaction.reply({ content: `▶️ تم استئناف العرض لجميع المشاهدين بواسطة <@${interaction.user.id}>!` });
      } else {
        await interaction.reply({ content: `⏸️ تم إيقاف العرض مؤقتاً للجميع بواسطة <@${interaction.user.id}>!` });
      }
      return;
    }

    if (action === 'cinema_fwd') {
      CinemaManager.seekRelative(channelId, 10, member.displayName || member.user.username);
      await interaction.reply({ content: `⏩ تم تقديم 10 ثوانٍ للجميع بواسطة <@${interaction.user.id}>!` });
      return;
    }

    if (action === 'cinema_bwd') {
      CinemaManager.seekRelative(channelId, -10, member.displayName || member.user.username);
      await interaction.reply({ content: `⏪ تم ترجيع 10 ثوانٍ للجميع بواسطة <@${interaction.user.id}>!` });
      return;
    }

    if (action === 'cinema_resync') {
      CinemaManager.forceResync(channelId, member.displayName || member.user.username);
      await interaction.reply({ content: `🔄 تم إعادة مزامنة جميع شاشات المشاهدين بنجاح 100%!`, ephemeral: true });
      return;
    }
  }
}
