import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './routes/auth.js';
import guildRoutes from './routes/guilds.js';
import cinemaRoutes from './routes/cinema.js';
import { config } from '../config/index.js';
import { getBotClient } from '../bot/index.js';

export function createApiServer() {
  const app = express();

  // Trust reverse proxy (Cloudflare Tunnel, Nginx)
  app.set('trust proxy', 1);

  // Basic security and parsing middlewares
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again later.' },
  });
  app.use('/api', apiLimiter);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/guilds', guildRoutes);
  app.use('/api/cinema', cinemaRoutes);

  // Health check & bot overview stats
  app.get('/api/health', (req, res) => {
    const bot = getBotClient();
    res.json({
      status: 'online',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      bot: {
        ready: !!bot?.isReady(),
        tag: bot?.user?.tag || 'Not Connected',
        guildsCount: bot?.guilds.cache.size || 0,
        usersCount: bot?.users.cache.size || 0,
        ping: bot?.ws.ping || -1,
      },
    });
  });

  // Serve Dashboard static frontend build if available
  const dashboardDist = path.resolve(process.cwd(), 'dashboard/dist');
  app.use(express.static(dashboardDist));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(dashboardDist, 'index.html'), (err) => {
      if (err) {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Royal Discord Bot API</title>
              <style>
                body { background: #08080a; color: #e5c158; font-family: 'Segoe UI', Tahoma, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                .card { background: #121217; border: 1px solid #c5a059; border-radius: 12px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
                h1 { margin: 0 0 16px 0; font-size: 2.2rem; }
                p { color: #8e8e9f; }
                a { color: #e5c158; text-decoration: none; border: 1px solid #e5c158; padding: 10px 20px; border-radius: 6px; display: inline-block; margin-top: 20px; font-weight: bold; }
                a:hover { background: #e5c158; color: #08080a; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>👑 Royal Discord Bot Suite</h1>
                <p>Backend API & Discord Gateway Engine are active on port ${config.server.port}.</p>
                <a href="/api/health">Check API Health</a>
              </div>
            </body>
          </html>
        `);
      }
    });
  });

  return app;
}
