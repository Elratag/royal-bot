import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  GuildMember, 
  SlashCommandBuilder 
} from 'discord.js';
import { SlashCommand } from '../../../types/index.js';
import { config } from '../../../config/index.js';
import { CinemaManager } from '../../modules/cinemaManager.js';

export const playmovieCommand: SlashCommand = {
  data: new SlashCommandBuilder()
  .setName('playmovie')
  .setDescription('Start a synchronized Watch Party session in your voice channel')
  .addStringOption(opt =>
    opt.setName('title')
      .setDescription('Movie or series title to search and stream dynamically')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName('url')
      .setDescription('Direct video stream URL (MP4, HLS, Web Stream)')
      .setRequired(false)
  )
  .addIntegerOption(opt =>
    opt.setName('season')
      .setDescription('Season number for TV series (e.g. 1)')
      .setRequired(false)
  )
  .addIntegerOption(opt =>
    opt.setName('episode')
      .setDescription('Episode number for TV series (e.g. 1)')
      .setRequired(false)
  ),
  category: 'cinema',
  async execute(interaction) {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice?.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: '❌ يجب أن تكون داخل روم صوتي (Voice Channel) لبدء صالة السينما المشتركة!',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const searchTitle = interaction.options.getString('title') || undefined;
    const directUrl = interaction.options.getString('url') || undefined;
    const seasonOpt = interaction.options.getInteger('season');
    const episodeOpt = interaction.options.getInteger('episode');

    const season = seasonOpt || 1;
    const episode = episodeOpt || 1;
    const isExplicitSeries = seasonOpt !== null || episodeOpt !== null;

    // Dynamically search and resolve movie metadata with season & episode support
    const movie = await CinemaManager.resolveMovie(searchTitle, directUrl, season, episode, isExplicitSeries);

    // Initialize session with this movie for the voice room
    CinemaManager.setSessionMovie(voiceChannel.id, movie, interaction.guildId || undefined);

    const cinemaRoomUrl = `${config.server.dashboardUrl}/cinema?channel=${voiceChannel.id}&guild=${interaction.guildId}&user=${interaction.user.id}`;

    const embed = new EmbedBuilder()
      .setColor('#C5A059')
      .setTitle(`🎬 صالة سينما رويال — ${movie.title}`)
      .setDescription(
        `تم إطلاق صالة المشاهدة السينمائية فائقة التزامن في الروم الصوتي **${voiceChannel.name}**!\n\n` +
        `**معلومات العرض:**\n` +
        `• **الجودة:** \`${movie.quality}\` • **النوع:** \`${movie.type === 'series' ? 'مسلسل' : 'فيلم'}\`\n` +
        `• **الصوت:** \`${movie.language}\` • **الترجمة:** \`${movie.subtitles}\`\n` +
        (movie.duration ? `• **المدة:** \`${movie.duration}\`\n` : '') +
        (movie.overview ? `• **النبذة:** ${movie.overview}\n\n` : '\n') +
        `🔒 **التزامن التام (Zero Drift):**\n` +
        `جميع المشاهدين في الروم يشاهدون في نفس اللحظة بالمللي ثانية دون أي تقدم أو تأخير! أي إيقاف أو تقديم ينطبق على الجميع فوراً.\n\n` +
        `اضغط على الزر الذهبي بالأسفل للانضمام لصالة العرض أو تحكم مباشرة من الأزرار:`
      )
      .setThumbnail(movie.posterUrl)
      .setFooter({ text: 'Royal Cinema Suite • Ultra-Tight Synchronized Engine 100%' })
      .setTimestamp();

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('🍿 دخول صالة السينما وبدء المشاهدة')
        .setStyle(ButtonStyle.Link)
        .setURL(cinemaRoomUrl),
      new ButtonBuilder()
        .setCustomId(`cinema_toggle:${voiceChannel.id}`)
        .setLabel('⏯️ تشغيل / إيقاف للجميع')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`cinema_resync:${voiceChannel.id}`)
        .setLabel('🔄 إعادة المزامنة')
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`cinema_bwd:${voiceChannel.id}`)
        .setLabel('⏪ -10 ثواني')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`cinema_fwd:${voiceChannel.id}`)
        .setLabel('⏩ +10 ثواني')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel('📜 الكتالوج واللوحة')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.server.dashboardUrl}/guilds/${interaction.guildId}?tab=movies`)
    );

    await interaction.editReply({ embeds: [embed], components: [row1, row2] });
  },
};
