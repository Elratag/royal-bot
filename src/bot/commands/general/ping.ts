import { SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../../types/index.js';

export const pingCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check Royal Bot latency and WebSocket heartbeat'),
  category: 'general',
  async execute(interaction, client) {
    const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const ws = client.ws.ping;

    await interaction.editReply({
      content: `👑 **Royal Bot Status**\n⚡ **Roundtrip Latency:** \`${roundtrip}ms\`\n💓 **WebSocket Heartbeat:** \`${ws}ms\``,
    });
  },
};
