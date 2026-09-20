import { REST, Routes } from 'discord.js';
import { ExtendedClient, SlashCommand } from '../../types/index.js';
import { config } from '../../config/index.js';

// General commands
import { pingCommand } from '../commands/general/ping.js';
import { helpCommand } from '../commands/general/help.js';
import { serverinfoCommand } from '../commands/general/serverinfo.js';
import { setupCommand } from '../commands/general/setup.js';

// Music commands
import { playCommand } from '../commands/music/play.js';
import { 
  pauseCommand, 
  resumeCommand, 
  skipCommand, 
  stopCommand, 
  queueCommand, 
  volumeCommand, 
  loopCommand, 
  nowplayingCommand 
} from '../commands/music/musicControls.js';

// Moderation & Systems commands
import { colorrolesCommand } from '../commands/moderation/colorroles.js';
import { ticketCommand } from '../commands/moderation/ticket.js';
import { welcomeCommand, autoroleCommand } from '../commands/moderation/welcomeAndRoles.js';

// Cinema commands
import { playmovieCommand } from '../commands/cinema/playmovie.js';

export const allCommands: SlashCommand[] = [
  pingCommand,
  helpCommand,
  serverinfoCommand,
  setupCommand,
  playCommand,
  pauseCommand,
  resumeCommand,
  skipCommand,
  stopCommand,
  queueCommand,
  volumeCommand,
  loopCommand,
  nowplayingCommand,
  colorrolesCommand,
  ticketCommand,
  welcomeCommand,
  autoroleCommand,
  playmovieCommand,
];

export function registerCommands(client: ExtendedClient) {
  for (const cmd of allCommands) {
    client.commands.set(cmd.data.name, cmd);
  }
  console.log(`📦 [Slash Commands] Loaded ${client.commands.size} application commands into memory.`);
}

export async function clearAllGuildCommands(client?: ExtendedClient) {
  if (!config.discord.token || !config.discord.clientId) return;
  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  if (client && client.guilds.cache.size > 0) {
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(config.discord.clientId, guildId),
          { body: [] }
        );
        console.log(`🧹 [Slash Commands] Removed duplicate guild commands for "${guild.name}" (${guildId})!`);
      } catch (err: any) {
        console.error(`Failed to clear guild commands for ${guildId}:`, err.message);
      }
    }
  }
}

export async function deploySlashCommands() {
  if (!config.discord.token || !config.discord.clientId) {
    console.warn('⚠️ [Slash Commands] DISCORD_TOKEN or DISCORD_CLIENT_ID missing; skipping remote Discord registration.');
    return;
  }

  try {
    const rest = new REST({ version: '10' }).setToken(config.discord.token);
    const body = allCommands.map(cmd => cmd.data.toJSON());

    console.log(`🚀 [Slash Commands] Refreshing ${body.length} global application commands with Discord REST API...`);
    await rest.put(
      Routes.applicationCommands(config.discord.clientId),
      { body }
    );
    console.log('✅ [Slash Commands] Successfully refreshed global application commands with Discord!');
  } catch (err: any) {
    console.error('❌ [Slash Commands] Error registering application commands:', err.message);
  }
}
