import { 
  AudioPlayer, 
  AudioPlayerStatus, 
  createAudioPlayer, 
  createAudioResource, 
  entersState, 
  joinVoiceChannel, 
  VoiceConnection, 
  VoiceConnectionStatus 
} from '@discordjs/voice';
import { Guild, StageChannel, VoiceChannel } from 'discord.js';
import play from 'play-dl';

export interface Track {
  title: string;
  url: string;
  duration: string;
  thumbnail?: string;
  requestedBy: string;
}

export interface GuildQueue {
  voiceChannel: VoiceChannel | StageChannel;
  textChannelId: string;
  connection: VoiceConnection;
  player: AudioPlayer;
  tracks: Track[];
  volume: number;
  loop: 'none' | 'track' | 'queue';
  currentTrack: Track | null;
  isPlaying: boolean;
}

class MusicManager {
  private queues: Map<string, GuildQueue> = new Map();

  getQueue(guildId: string): GuildQueue | undefined {
    return this.queues.get(guildId);
  }

  async connect(channel: VoiceChannel | StageChannel, textChannelId: string): Promise<GuildQueue> {
    let queue = this.queues.get(channel.guild.id);

    if (!queue) {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as any,
      });

      const player = createAudioPlayer();

      queue = {
        voiceChannel: channel,
        textChannelId,
        connection,
        player,
        tracks: [],
        volume: 80,
        loop: 'none',
        currentTrack: null,
        isPlaying: false,
      };

      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        this.handleTrackEnd(channel.guild.id);
      });

      player.on('error', (err) => {
        console.error(`🎵 [Music Error in ${channel.guild.name}]:`, err.message);
        this.handleTrackEnd(channel.guild.id);
      });

      this.queues.set(channel.guild.id, queue);
    }

    return queue;
  }

  async play(guildId: string, track: Track) {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    queue.tracks.push(track);

    if (!queue.isPlaying) {
      await this.processQueue(guildId);
    }
  }

  private async processQueue(guildId: string) {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    if (queue.tracks.length === 0) {
      queue.isPlaying = false;
      queue.currentTrack = null;
      return;
    }

    const nextTrack = queue.tracks[0];
    queue.currentTrack = nextTrack;
    queue.isPlaying = true;

    try {
      let stream: any;

      // 1. Direct audio file URL (.mp3, .ogg, .wav, or direct stream)
      if (nextTrack.url.startsWith('http') && (nextTrack.url.includes('.mp3') || nextTrack.url.includes('.ogg') || nextTrack.url.includes('.wav') || nextTrack.url.includes('/stream'))) {
        const resource = createAudioResource(nextTrack.url, { inlineVolume: true });
        resource.volume?.setVolumeLogarithmic(queue.volume / 100);
        queue.player.play(resource);
        return;
      }

      // 2. Stream using play-dl with automatic fallback
      try {
        stream = await play.stream(nextTrack.url);
      } catch (streamErr: any) {
        console.warn(`⚠️ [Music] Direct stream failed for "${nextTrack.title}", searching SoundCloud fallback...`);
        const sc = await play.search(nextTrack.title, { source: { soundcloud: 'tracks' }, limit: 1 }).catch(() => []);
        if (sc && sc.length > 0) {
          stream = await play.stream(sc[0].url);
        } else {
          throw streamErr;
        }
      }

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true,
      });

      resource.volume?.setVolumeLogarithmic(queue.volume / 100);
      queue.player.play(resource);
    } catch (err: any) {
      console.error('Error starting audio stream:', err.message || err);
      this.handleTrackEnd(guildId);
    }
  }

  private handleTrackEnd(guildId: string) {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    if (queue.loop === 'track' && queue.currentTrack) {
      // Repeat same track
      this.processQueue(guildId);
      return;
    }

    if (queue.loop === 'queue' && queue.currentTrack) {
      queue.tracks.push(queue.currentTrack);
    }

    queue.tracks.shift();
    this.processQueue(guildId);
  }

  skip(guildId: string): boolean {
    const queue = this.queues.get(guildId);
    if (!queue || !queue.isPlaying) return false;
    queue.player.stop();
    return true;
  }

  pause(guildId: string): boolean {
    const queue = this.queues.get(guildId);
    if (!queue || !queue.isPlaying) return false;
    return queue.player.pause();
  }

  resume(guildId: string): boolean {
    const queue = this.queues.get(guildId);
    if (!queue) return false;
    return queue.player.unpause();
  }

  stop(guildId: string) {
    const queue = this.queues.get(guildId);
    if (!queue) return;
    queue.tracks = [];
    queue.player.stop();
    queue.connection.destroy();
    this.queues.delete(guildId);
  }

  setVolume(guildId: string, volume: number) {
    const queue = this.queues.get(guildId);
    if (!queue) return;
    queue.volume = Math.max(0, Math.min(100, volume));
  }

  setLoop(guildId: string, mode: 'none' | 'track' | 'queue') {
    const queue = this.queues.get(guildId);
    if (!queue) return;
    queue.loop = mode;
  }
}

export const musicManager = new MusicManager();
