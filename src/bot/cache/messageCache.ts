import { Message } from 'discord.js';

interface CachedMessage {
  id: string;
  authorId: string;
  authorTag: string;
  content: string;
  channelId: string;
  guildId: string;
  createdAt: Date;
  attachments: string[];
}

const MAX_CACHE_SIZE = 2000;
const messageCache = new Map<string, CachedMessage>();

export function cacheMessage(message: Message) {
  if (!message.guild || message.author.bot) return;

  if (messageCache.size >= MAX_CACHE_SIZE) {
    const firstKey = messageCache.keys().next().value;
    if (firstKey) messageCache.delete(firstKey);
  }

  messageCache.set(message.id, {
    id: message.id,
    authorId: message.author.id,
    authorTag: message.author.tag,
    content: message.content,
    channelId: message.channel.id,
    guildId: message.guild.id,
    createdAt: message.createdAt,
    attachments: message.attachments.map(a => a.url),
  });
}

export function getCachedMessage(messageId: string): CachedMessage | undefined {
  return messageCache.get(messageId);
}
