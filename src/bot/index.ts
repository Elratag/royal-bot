import play from 'play-dl';
import { createDiscordClient } from './client.js';
import { registerEvents } from './handlers/eventHandler.js';
import { registerCommands, deploySlashCommands } from './handlers/commandHandler.js';
import { config } from '../config/index.js';
import { ExtendedClient } from '../types/index.js';

let botInstance: ExtendedClient | null = null;

export function getBotClient(): ExtendedClient | null {
  return botInstance;
}

export async function startDiscordBot(): Promise<ExtendedClient> {
  const client = createDiscordClient();
  botInstance = client;

  registerEvents(client);
  registerCommands(client);

  if (config.discord.token) {
    try {
      // Initialize SoundCloud free client ID for audio streaming
      try {
        const scClientId = await play.getFreeClientID();
        await play.setToken({ soundcloud: { client_id: scClientId } });
        console.log('🎵 [Music Engine] SoundCloud audio client initialized successfully.');
      } catch (scErr: any) {
        console.warn('⚠️ [Music Engine] SoundCloud client ID note:', scErr.message);
      }

      await client.login(config.discord.token);
    } catch (err: any) {
      console.error('❌ [Discord Bot] Failed to log in with provided DISCORD_TOKEN:', err.message);
    }
  } else {
    console.warn('⚠️ [Discord Bot] DISCORD_TOKEN is empty in .env. Bot Gateway connection paused until token is provided.');
  }

  return client;
}
