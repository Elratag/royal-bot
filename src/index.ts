import http from 'http';
import { initDatabase } from './database/index.js';
import { startDiscordBot } from './bot/index.js';
import { createApiServer } from './api/server.js';
import { config } from './config/index.js';
import { sessionStore } from './api/services/sessionStore.js';

async function bootstrap() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑  ROYAL DISCORD BOT & LUXURY DASHBOARD SUITE  👑');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. Initialize Database
  await initDatabase();
  await sessionStore.loadFromDatabase();

  // 2. Start Discord Bot Service
  await startDiscordBot();

  // 3. Start Backend API & Dashboard Server
  const app = createApiServer();
  const server = http.createServer({ maxHeaderSize: 65536 }, app);
  server.listen(config.server.port, () => {
    console.log(`🌐 [API Server] Listening on http://localhost:${config.server.port}`);
    console.log(`💎 [Dashboard] Accessible at ${config.server.dashboardUrl}`);
  });
}

bootstrap().catch((err) => {
  console.error('💥 [Fatal Error during bootstrap]:', err);
  process.exit(1);
});
