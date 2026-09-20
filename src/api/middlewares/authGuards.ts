import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { JwtUserPayload } from '../../types/index.js';
import { getBotClient } from '../../bot/index.js';

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
  guildPermissions?: bigint;
}

import { sessionStore } from '../services/sessionStore.js';

export function authGuard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.royal_token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.server.jwtSecret) as JwtUserPayload;
    if (decoded.id === '100000000000000001' || decoded.username === 'RoyalAdmin') {
      return res.status(401).json({ error: 'Mock session expired. Please login with Discord.' });
    }
    decoded.guilds = sessionStore.getGuilds(decoded.id);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }
}

export function adminGuard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { guildId } = req.params;
  const user = req.user;

  if (!guildId || !user) {
    return res.status(400).json({ error: 'Missing guildId or user authentication' });
  }

  // Find user's guild from their OAuth guilds cache
  const userGuild = user.guilds?.find(g => g.id === guildId);

  if (!userGuild) {
    return res.status(403).json({ error: 'Forbidden: You are not a member of this server' });
  }

  const permissions = BigInt(userGuild.permissions || '0');
  const ADMINISTRATOR_BIT = BigInt(0x8);

  const isAdmin = userGuild.owner || (permissions & ADMINISTRATOR_BIT) === ADMINISTRATOR_BIT;

  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required to manage this guild' });
  }

  // Also verify bot is actually in this guild
  const botClient = getBotClient();
  if (botClient && botClient.isReady() && !botClient.guilds.cache.has(guildId)) {
    return res.status(404).json({ error: 'Royal Bot is not currently in this server. Please invite the bot first.' });
  }

  req.guildPermissions = permissions;
  next();
}
