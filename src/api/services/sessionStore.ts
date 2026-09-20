import { UserGuild } from '../../types/index.js';
import { prisma } from '../../database/index.js';

class SessionStore {
  private guildsCache = new Map<string, { guilds: UserGuild[]; timestamp: number }>();

  async loadFromDatabase() {
    try {
      const sessions = await prisma.userSession.findMany();
      for (const s of sessions) {
        try {
          const parsed = JSON.parse(s.guilds);
          this.guildsCache.set(s.userId, { guilds: parsed, timestamp: s.updatedAt.getTime() });
        } catch {}
      }
      console.log(`💎 [Sessions] Loaded ${sessions.length} persistent user session(s) from PostgreSQL database.`);
    } catch (err: any) {
      console.warn('⚠️ [Sessions] Could not preload sessions from database:', err.message);
    }
  }

  setGuilds(userId: string, guilds: UserGuild[]) {
    this.guildsCache.set(userId, { guilds, timestamp: Date.now() });
    prisma.userSession.upsert({
      where: { userId },
      update: { guilds: JSON.stringify(guilds) },
      create: { userId, guilds: JSON.stringify(guilds) }
    }).catch(err => console.error('Failed to persist session to database:', err.message));
  }

  getGuilds(userId: string): UserGuild[] {
    const item = this.guildsCache.get(userId);
    return item ? item.guilds : [];
  }
}

export const sessionStore = new SessionStore();
