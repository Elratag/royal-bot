import { 
  UserProfile, 
  UserGuild, 
  WelcomeConfig, 
  AutoRoleItem, 
  ColorPanel, 
  LogConfig, 
  TicketPanel, 
  TicketItem, 
  AutoResponseItem, 
  CommandItem, 
  BotSetting, 
  GuildChannel, 
  GuildRole, 
  MovieItem 
} from './types';

const BASE_URL = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('royal_token');
}

export function setStoredToken(token: string) {
  localStorage.setItem('royal_token', token);
}

export function removeStoredToken() {
  localStorage.removeItem('royal_token');
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  return response;
}

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await apiFetch('/auth/user');
    if (!res.ok) {
      removeStoredToken();
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  removeStoredToken();
  await apiFetch('/auth/logout', { method: 'POST' });
}

export async function fetchGuildDetails(guildId: string): Promise<{
  guild: any;
  channels: GuildChannel[];
  roles: GuildRole[];
}> {
  const res = await apiFetch(`/guilds/${guildId}/details`);
  if (!res.ok) throw new Error('Failed to fetch guild details');
  return res.json();
}

// Welcome
export async function getWelcomeConfig(guildId: string): Promise<WelcomeConfig> {
  const res = await apiFetch(`/guilds/${guildId}/welcome`);
  const data = await res.json();
  return data.config;
}

export async function saveWelcomeConfig(guildId: string, payload: Partial<WelcomeConfig>): Promise<void> {
  await apiFetch(`/guilds/${guildId}/welcome`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// Auto Roles
export async function getAutoRoles(guildId: string): Promise<AutoRoleItem[]> {
  const res = await apiFetch(`/guilds/${guildId}/autoroles`);
  const data = await res.json();
  return data.autoRoles;
}

export async function addAutoRole(guildId: string, roleId: string): Promise<void> {
  await apiFetch(`/guilds/${guildId}/autoroles`, {
    method: 'POST',
    body: JSON.stringify({ roleId }),
  });
}

export async function deleteAutoRole(guildId: string, id: number): Promise<void> {
  await apiFetch(`/guilds/${guildId}/autoroles/${id}`, { method: 'DELETE' });
}

// Color Roles
export async function getColorPanel(guildId: string): Promise<ColorPanel> {
  const res = await apiFetch(`/guilds/${guildId}/colorroles`);
  const data = await res.json();
  return data.panel;
}

export async function saveColorPanel(guildId: string, payload: any): Promise<void> {
  await apiFetch(`/guilds/${guildId}/colorroles`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function addColorOption(guildId: string, payload: { roleId: string; name: string; emoji?: string }): Promise<void> {
  await apiFetch(`/guilds/${guildId}/colorroles/options`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteColorOption(guildId: string, id: number): Promise<void> {
  await apiFetch(`/guilds/${guildId}/colorroles/options/${id}`, { method: 'DELETE' });
}

// Logs
export async function getLogConfig(guildId: string): Promise<LogConfig> {
  const res = await apiFetch(`/guilds/${guildId}/logs`);
  const data = await res.json();
  return data.logs;
}

export async function saveLogConfig(guildId: string, payload: Partial<LogConfig>): Promise<void> {
  await apiFetch(`/guilds/${guildId}/logs`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// Tickets
export async function getTicketsData(guildId: string): Promise<{ panel: TicketPanel; tickets: TicketItem[] }> {
  const res = await apiFetch(`/guilds/${guildId}/tickets`);
  return res.json();
}

export async function saveTicketPanel(guildId: string, payload: Partial<TicketPanel>): Promise<void> {
  await apiFetch(`/guilds/${guildId}/tickets/panel`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// Auto Responses
export async function getAutoResponses(guildId: string): Promise<AutoResponseItem[]> {
  const res = await apiFetch(`/guilds/${guildId}/autoresp`);
  const data = await res.json();
  return data.responses;
}

export async function addAutoResponse(guildId: string, payload: { trigger: string; response: string; exactMatch: boolean; channelId?: string | null }): Promise<void> {
  await apiFetch(`/guilds/${guildId}/autoresp`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteAutoResponse(guildId: string, id: number): Promise<void> {
  await apiFetch(`/guilds/${guildId}/autoresp/${id}`, { method: 'DELETE' });
}

// Commands
export async function getCommands(guildId: string): Promise<CommandItem[]> {
  const res = await apiFetch(`/guilds/${guildId}/commands`);
  const data = await res.json();
  return data.commands;
}

export async function toggleCommand(guildId: string, commandName: string, enabled: boolean): Promise<void> {
  await apiFetch(`/guilds/${guildId}/commands/${commandName}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
}

// Bot Settings
export async function getBotSettings(guildId: string): Promise<BotSetting> {
  const res = await apiFetch(`/guilds/${guildId}/botsettings`);
  const data = await res.json();
  return data.settings;
}

export async function saveBotSettings(guildId: string, payload: Partial<BotSetting>): Promise<void> {
  await apiFetch(`/guilds/${guildId}/botsettings`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// Cinema & Media Catalog
export async function getMediaCatalog(type?: 'movie' | 'series'): Promise<MovieItem[]> {
  const res = await apiFetch(`/cinema/catalog${type ? `?type=${type}` : ''}`);
  const data = await res.json();
  return data.items;
}

export async function addMediaItem(payload: Partial<MovieItem>): Promise<void> {
  await apiFetch(`/cinema/items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteMediaItem(id: number): Promise<void> {
  await apiFetch(`/cinema/items/${id}`, { method: 'DELETE' });
}

export function getUserAvatarUrl(user: { id: string; avatar?: string | null }): string {
  if (!user || !user.id) {
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }
  if (!user.avatar) {
    try {
      const idBig = BigInt(user.id);
      const defaultIndex = Number((idBig >> 22n) % 6n);
      return `https://cdn.discordapp.com/embed/avatars/${Math.abs(defaultIndex)}.png`;
    } catch {
      return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
  }
  const isGif = user.avatar.startsWith('a_');
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${isGif ? 'gif' : 'png'}?size=256`;
}
