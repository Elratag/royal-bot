import { 
  Client, 
  Collection, 
  GatewayIntentBits, 
  Partials 
} from 'discord.js';
import { ExtendedClient, SlashCommand } from '../types/index.js';

export function createDiscordClient(): ExtendedClient {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers, // Privileged
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent, // Privileged
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.Reaction,
      Partials.User,
      Partials.GuildMember,
    ],
  }) as ExtendedClient;

  client.commands = new Collection<string, SlashCommand>();

  return client;
}
