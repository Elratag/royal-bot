import { AuditLogEvent, Guild, User, PartialUser } from 'discord.js';

export class AuditLogManager {
  /**
   * Safely fetch the executor of a Kick action
   */
  static async getKickExecutor(guild: Guild, targetId: string): Promise<User | PartialUser | null> {
    try {
      if (!guild.members.me?.permissions.has('ViewAuditLog')) return null;

      const logs = await guild.fetchAuditLogs({
        limit: 5,
        type: AuditLogEvent.MemberKick,
      });

      const entry = logs.entries.find(
        (e) => e.target?.id === targetId && Date.now() - e.createdTimestamp < 5000
      );

      return entry?.executor || null;
    } catch {
      return null;
    }
  }

  /**
   * Safely fetch the executor of a Ban action
   */
  static async getBanExecutor(guild: Guild, targetId: string): Promise<User | PartialUser | null> {
    try {
      if (!guild.members.me?.permissions.has('ViewAuditLog')) return null;

      const logs = await guild.fetchAuditLogs({
        limit: 5,
        type: AuditLogEvent.MemberBanAdd,
      });

      const entry = logs.entries.find((e) => e.target?.id === targetId);
      return entry?.executor || null;
    } catch {
      return null;
    }
  }

  /**
   * Safely fetch the executor of a Server Mute or Deafen
   */
  static async getVoiceModerator(guild: Guild, targetId: string): Promise<User | PartialUser | null> {
    try {
      if (!guild.members.me?.permissions.has('ViewAuditLog')) return null;

      const logs = await guild.fetchAuditLogs({
        limit: 5,
        type: AuditLogEvent.MemberUpdate,
      });

      const entry = logs.entries.find(
        (e) => e.target?.id === targetId && Date.now() - e.createdTimestamp < 5000
      );

      return entry?.executor || null;
    } catch {
      return null;
    }
  }

  /**
   * Safely fetch the moderator who deleted a message
   */
  static async getMessageDeleteExecutor(guild: Guild, targetAuthorId: string, channelId: string): Promise<User | PartialUser | null> {
    try {
      if (!guild.members.me?.permissions.has('ViewAuditLog')) return null;

      const logs = await guild.fetchAuditLogs({
        limit: 5,
        type: AuditLogEvent.MessageDelete,
      });

      const entry = logs.entries.find((e) => {
        const target = e.target as User;
        const extra = e.extra as { channel: { id: string } };
        return target?.id === targetAuthorId && 
               extra?.channel?.id === channelId && 
               Date.now() - e.createdTimestamp < 5000;
      });

      return entry?.executor || null;
    } catch {
      return null;
    }
  }

  /**
   * Safely fetch the moderator who dragged/moved a member in a voice channel
   */
  static async getVoiceMoveExecutor(guild: Guild, targetMemberId: string, targetChannelId: string): Promise<User | PartialUser | null> {
    try {
      const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
      if (!me || !me.permissions.has('ViewAuditLog')) {
        console.warn('⚠️ Bot lacks ViewAuditLog permission to inspect voice moves.');
        return null;
      }

      // Query helper function
      const queryLogs = async () => {
        const logs = await guild.fetchAuditLogs({
          limit: 8,
          type: AuditLogEvent.MemberMove,
        }).catch(() => null);

        if (!logs) return null;

        const now = Date.now();
        return logs.entries.find((e) => {
          const extra = e.extra as any;
          const extraChanId = extra?.channel?.id || extra?.channelId || (typeof extra?.channel === 'string' ? extra.channel : null);
          const channelMatches = !extraChanId || extraChanId === targetChannelId;
          const isRecent = Math.abs(now - e.createdTimestamp) < 15000;
          return isRecent && channelMatches;
        });
      };

      // Attempt 1: Wait 500ms for Discord to write the audit log entry
      await new Promise(resolve => setTimeout(resolve, 500));
      let entry = await queryLogs();

      // Attempt 2: If not found, wait another 800ms and re-check
      if (!entry) {
        await new Promise(resolve => setTimeout(resolve, 800));
        entry = await queryLogs();
      }

      if (entry?.executor) {
        console.log(`🧲 [Voice Move Detected] Member ${targetMemberId} was dragged to ${targetChannelId} by ${entry.executor.tag} (${entry.executor.id})`);
        return entry.executor;
      }

      return null;
    } catch (err: any) {
      console.error('❌ [AuditLogManager] Error in getVoiceMoveExecutor:', err.message);
      return null;
    }
  }
}
