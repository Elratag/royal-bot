import { Message } from 'discord.js';
import { prisma } from '../../database/index.js';
import { cacheMessage } from '../cache/messageCache.js';

export async function onMessageCreate(message: Message) {
  if (message.author.bot || !message.guild) return;

  // 1. Cache message for delete logs
  cacheMessage(message);

  // 2. Auto Responses
  try {
    const autoResponses = await prisma.autoResponse.findMany({
      where: {
        guildId: message.guild.id,
        enabled: true,
      },
    });

    if (autoResponses.length === 0) return;

    const content = message.content.trim();

    for (const ar of autoResponses) {
      if (ar.channelId && ar.channelId !== message.channel.id) {
        continue;
      }

      let matched = false;
      if (ar.exactMatch) {
        matched = content.toLowerCase() === ar.trigger.trim().toLowerCase();
      } else {
        matched = content.toLowerCase().includes(ar.trigger.trim().toLowerCase());
      }

      if (matched) {
        await message.reply(ar.response);
        break; // Match first response
      }
    }
  } catch (err) {
    console.error('[onMessageCreate AutoResponse] Error:', err);
  }
}
