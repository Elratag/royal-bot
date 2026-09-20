import { GuildMember, SlashCommandBuilder, VoiceChannel } from 'discord.js';
import { SlashCommand } from '../../../types/index.js';
import { musicManager } from '../../modules/musicPlayer.js';
import play from 'play-dl';

export const playCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or audio stream in your voice channel')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Song title, URL, or stream link')
        .setRequired(true)
    ),
  category: 'music',
  async execute(interaction) {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({ content: '❌ You must be in a voice channel to play music!', ephemeral: true });
      return;
    }

    await interaction.deferReply();
    const query = interaction.options.getString('query', true);

    try {
      const queue = await musicManager.connect(voiceChannel as VoiceChannel, interaction.channelId);

      let trackTitle = query;
      let trackUrl = query;
      let duration = '0:00';
      let thumbnail: string | undefined;

      // 1. Direct audio file / radio stream
      if (query.startsWith('http') && (query.includes('.mp3') || query.includes('.ogg') || query.includes('.wav') || query.includes('/stream'))) {
        trackTitle = 'Live Audio Stream';
        trackUrl = query;
        duration = 'Live';
      } else {
        // 2. Search SoundCloud for ultra-reliable streaming with zero cipher/PO-token blocks
        const scResults = await play.search(query, { source: { soundcloud: 'tracks' }, limit: 1 }).catch(() => []);
        if (scResults && scResults.length > 0) {
          trackTitle = scResults[0].name || query;
          trackUrl = scResults[0].url;
          duration = scResults[0].durationInSec 
            ? `${Math.floor(scResults[0].durationInSec / 60)}:${String(scResults[0].durationInSec % 60).padStart(2, '0')}` 
            : '0:00';
          thumbnail = scResults[0].thumbnail;
        } else {
          // Fallback to general search
          const generalResults = await play.search(query, { limit: 1 }).catch(() => []);
          if (generalResults && generalResults.length > 0) {
            trackTitle = generalResults[0].title || query;
            trackUrl = generalResults[0].url;
            duration = generalResults[0].durationRaw || '0:00';
            thumbnail = generalResults[0].thumbnails?.[0]?.url;
          }
        }
      }

      await musicManager.play(interaction.guildId!, {
        title: trackTitle,
        url: trackUrl,
        duration,
        thumbnail,
        requestedBy: interaction.user.tag,
      });

      await interaction.editReply({
        content: `🎵 Added to queue: **${trackTitle}** (\`${duration}\`) — Requested by <@${interaction.user.id}>`,
      });
    } catch (err: any) {
      console.error('[Play Command Error]:', err);
      await interaction.editReply({ content: `❌ Could not play track: ${err.message}` });
    }
  },
};
