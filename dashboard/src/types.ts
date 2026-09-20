export interface UserGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  isAdmin: boolean;
  hasBot: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  globalName?: string | null;
  displayName?: string;
  discriminator: string;
  avatar: string | null;
  guilds: UserGuild[];
}

export interface GuildChannel {
  id: string;
  name: string;
  type: number;
  isVoice: boolean;
  isText: boolean;
  isCategory?: boolean;
}

export interface GuildRole {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface WelcomeConfig {
  guildId: string;
  enabled: boolean;
  channelId: string | null;
  message: string;
  embedEnabled: boolean;
  embedTitle: string;
  embedColor: string;
}

export interface AutoRoleItem {
  id: number;
  guildId: string;
  roleId: string;
}

export interface ColorOption {
  id: number;
  roleId: string;
  name: string;
  emoji: string | null;
}

export interface ColorPanel {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string | null;
  title: string;
  description: string | null;
  singleColor: boolean;
  options: ColorOption[];
}

export interface LogConfig {
  guildId: string;
  memberLogChannel: string | null;
  kickLogChannel: string | null;
  banLogChannel: string | null;
  voiceLogChannel: string | null;
  muteLogChannel: string | null;
  messageLogChannel: string | null;
  ticketLogChannel: string | null;
}

export interface TicketItem {
  id: number;
  channelId: string;
  creatorId: string;
  status: string;
  claimedBy: string | null;
  createdAt: string;
}

export interface TicketPanel {
  id: string;
  guildId: string;
  channelId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  supportRoleId: string | null;
  logsChannelId: string | null;
  welcomeMessage: string | null;
}

export interface AutoResponseItem {
  id: number;
  guildId: string;
  trigger: string;
  response: string;
  exactMatch: boolean;
  channelId: string | null;
  enabled: boolean;
}

export interface CommandItem {
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

export interface BotSetting {
  guildId: string;
  statusText: string;
  statusType: string;
  onlineStatus: string;
  musicVolume: number;
  language: string;
}

export interface MovieItem {
  id: number;
  title: string;
  type: string;
  season?: number | null;
  episode?: number | null;
  duration?: string | null;
  quality: string;
  language: string;
  subtitles: string;
  posterUrl: string | null;
  streamUrl: string;
  isLegalPublicDomain?: boolean;
}
