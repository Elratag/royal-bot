import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  SlashCommandSubcommandsOnlyBuilder,
  Client, 
  Collection 
} from 'discord.js';

export interface SlashCommand {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | any;
  category: 'general' | 'admin' | 'moderation' | 'music' | 'tickets' | 'cinema';
  description?: string;
  execute: (interaction: ChatInputCommandInteraction, client: ExtendedClient) => Promise<void>;
}

export interface ExtendedClient extends Client {
  commands: Collection<string, SlashCommand>;
}

export interface JwtUserPayload {
  id: string;
  username: string;
  globalName?: string | null;
  displayName?: string;
  discriminator: string;
  avatar: string | null;
  guilds?: UserGuild[];
}

export interface UserGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  permissions_new?: string;
  hasBot?: boolean;
  isAdmin?: boolean;
}
