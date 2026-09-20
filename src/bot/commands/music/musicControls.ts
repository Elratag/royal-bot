import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../../types/index.js';
import { musicManager } from '../../modules/musicPlayer.js';

export const pauseCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current music playback'),
  category: 'music',
  async execute(interaction) {
    if (!interaction.guildId) return;
    const paused = musicManager.pause(interaction.guildId);
    await interaction.reply({
      content: paused ? '⏸️ Playback paused.' : '❌ Nothing is currently playing or already paused.',
    });
  },
};

export const resumeCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume the paused music playback'),
  category: 'music',
  async execute(interaction) {
    if (!interaction.guildId) return;
    const resumed = musicManager.resume(interaction.guildId);
    await interaction.reply({
      content: resumed ? '▶️ Playback resumed.' : '❌ Nothing is currently paused.',
    });
  },
};

export const skipCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip to the next song in the queue'),
  category: 'music',
  async execute(interaction) {
    if (!interaction.guildId) return;
    const skipped = musicManager.skip(interaction.guildId);
    await interaction.reply({
      content: skipped ? '⏭️ Skipped current track.' : '❌ No music is playing to skip.',
    });
  },
};

export const stopCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop the music, clear the queue, and leave the channel'),
  category: 'music',
  async execute(interaction) {
    if (!interaction.guildId) return;
    musicManager.stop(interaction.guildId);
    await interaction.reply({ content: '⏹️ Stopped playback and disconnected from voice channel.' });
  },
};

export const queueCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show the current music queue'),
  category: 'music',
  async execute(interaction) {
    if (!interaction.guildId) return;
    const queue = musicManager.getQueue(interaction.guildId);
    if (!queue || (!queue.currentTrack && queue.tracks.length === 0)) {
      await interaction.reply({ content: '📭 The queue is currently empty.' });
      return;
    }

    const current = queue.currentTrack ? `▶️ **Now Playing:** ${queue.currentTrack.title} (\`${queue.currentTrack.duration}\`)\n\n` : '';
    const upcoming = queue.tracks.slice(1, 11).map((t, idx) => `\`${idx + 1}.\` ${t.title} (\`${t.duration}\`) - <@${t.requestedBy}>`).join('\n');

    const embed = new EmbedBuilder()
      .setColor('#C5A059')
      .setTitle(`🎵 Music Queue - ${interaction.guild?.name}`)
      .setDescription(current + (upcoming ? `**Upcoming Tracks:**\n${upcoming}` : '*No more tracks in queue.*'))
      .setFooter({ text: `Total in queue: ${queue.tracks.length} track(s) • Loop: ${queue.loop}` });

    await interaction.reply({ embeds: [embed] });
  },
};

export const volumeCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set music playback volume (1-100)')
    .addIntegerOption(opt => opt.setName('level').setDescription('Volume level from 1 to 100').setRequired(true).setMinValue(1).setMaxValue(100)),
  category: 'music',
  async execute(interaction) {
    if (!interaction.guildId) return;
    const level = interaction.options.getInteger('level', true);
    musicManager.setVolume(interaction.guildId, level);
    await interaction.reply({ content: `🔊 Volume set to **${level}%**.` });
  },
};

export const loopCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set loop mode for music playback')
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('Choose loop mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'none' },
          { name: 'Repeat Current Song', value: 'track' },
          { name: 'Repeat Entire Queue', value: 'queue' }
        )
    ),
  category: 'music',
  async execute(interaction) {
    if (!interaction.guildId) return;
    const mode = interaction.options.getString('mode', true) as 'none' | 'track' | 'queue';
    musicManager.setLoop(interaction.guildId, mode);
    await interaction.reply({ content: `🔁 Loop mode updated to: **${mode}**` });
  },
};

export const nowplayingCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show information about the currently playing track'),
  category: 'music',
  async execute(interaction) {
    if (!interaction.guildId) return;
    const queue = musicManager.getQueue(interaction.guildId);
    if (!queue || !queue.currentTrack) {
      await interaction.reply({ content: '❌ Nothing is currently playing.' });
      return;
    }

    const track = queue.currentTrack;
    const embed = new EmbedBuilder()
      .setColor('#C5A059')
      .setTitle('🎶 Now Playing')
      .setDescription(`[${track.title}](${track.url})`)
      .addFields(
        { name: 'Duration', value: `\`${track.duration}\``, inline: true },
        { name: 'Volume', value: `${queue.volume}%`, inline: true },
        { name: 'Loop Mode', value: queue.loop, inline: true }
      )
      .setThumbnail(track.thumbnail || null)
      .setFooter({ text: `Requested by ${track.requestedBy}` });

    await interaction.reply({ embeds: [embed] });
  },
};
