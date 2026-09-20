import { ExtendedClient } from '../../types/index.js';
import { onGuildMemberAdd } from '../events/guildMemberAdd.js';
import { onGuildMemberRemove } from '../events/guildMemberRemove.js';
import { onGuildBanAdd, onGuildBanRemove } from '../events/guildBan.js';
import { onVoiceStateUpdate } from '../events/voiceStateUpdate.js';
import { onMessageDelete } from '../events/messageDelete.js';
import { onMessageCreate } from '../events/messageCreate.js';
import { onInteractionCreate } from '../events/interactionCreate.js';

import { deploySlashCommands, clearAllGuildCommands } from './commandHandler.js';

export function registerEvents(client: ExtendedClient) {
  client.on('guildMemberAdd', onGuildMemberAdd);
  client.on('guildMemberRemove', onGuildMemberRemove);
  client.on('guildBanAdd', onGuildBanAdd);
  client.on('guildBanRemove', onGuildBanRemove);
  client.on('voiceStateUpdate', onVoiceStateUpdate);
  client.on('messageDelete', onMessageDelete);
  client.on('messageCreate', onMessageCreate);
  client.on('interactionCreate', (interaction) => onInteractionCreate(interaction, client));

  client.once('ready', async () => {
    console.log(`👑 [Discord Bot] Logged in successfully as ${client.user?.tag}!`);
    console.log(`📡 [Discord Bot] Serving ${client.guilds.cache.size} guilds and ${client.users.cache.size} cached users.`);
    // 1. Remove duplicate guild-level commands so only single global commands remain
    await clearAllGuildCommands(client);
    // 2. Ensure global commands are up-to-date
    await deploySlashCommands();
  });
}
