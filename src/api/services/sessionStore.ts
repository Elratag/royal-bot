import fs from 'fs';
import path from 'path';
import { UserGuild } from '../../types/index.js';

const SESSIONS_FILE = path.join(process.cwd(), 'dev_sessions.json');

class SessionStore {
  private guildsCache = new Map<string, { guilds: UserGuild[]; timestamp: number }>();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
        const data = JSON.parse(raw);
        for (const [userId, item] of Object.entries(data)) {
          this.guildsCache.set(userId, item as any);
        }
      }
    } catch (err) {
      console.error('Failed to load sessions from disk:', err);
    }
  }

  private saveToDisk() {
    try {
      const obj: Record<string, any> = {};
      for (const [k, v] of this.guildsCache.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save sessions to disk:', err);
    }
  }

  setGuilds(userId: string, guilds: UserGuild[]) {
    this.guildsCache.set(userId, { guilds, timestamp: Date.now() });
    this.saveToDisk();
  }

  getGuilds(userId: string): UserGuild[] {
    const item = this.guildsCache.get(userId);
    return item ? item.guilds : [];
  }
}

export const sessionStore = new SessionStore();
