import express, { Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { JwtUserPayload, UserGuild } from '../../types/index.js';
import { getBotClient } from '../../bot/index.js';
import { authGuard, AuthenticatedRequest } from '../middlewares/authGuards.js';

const router = express.Router();

import { sessionStore } from '../services/sessionStore.js';

// 1. Initiate OAuth2 Login
router.get('/login', (req, res) => {
  res.clearCookie('royal_token');

  if (!config.discord.clientId || !config.discord.clientSecret) {
    return res.redirect(`${config.server.dashboardUrl}/login?mock=true`);
  }

  const state = Math.random().toString(36).substring(2, 15);
  res.cookie('oauth_state', state, { httpOnly: true, maxAge: 10 * 60 * 1000 });

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${encodeURIComponent(
    config.discord.redirectUri
  )}&response_type=code&scope=identify%20guilds&state=${state}`;

  res.redirect(discordAuthUrl);
});

// 2. OAuth2 Callback
router.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('❌ [OAuth2 Discord Error]:', error, error_description);
    return res.redirect(`${config.server.dashboardUrl}/?error=${encodeURIComponent(String(error_description || error))}`);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing.');
  }

  try {
    // Exchange Code for Access Token
    const tokenRes = await axios.post(
      'https://discord.com/api/v10/oauth2/token',
      new URLSearchParams({
        client_id: config.discord.clientId,
        client_secret: config.discord.clientSecret,
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: config.discord.redirectUri,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // Fetch User Profile from Discord API
    const userRes = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Fetch User Guilds
    const guildsRes = await axios.get<UserGuild[]>('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const botClient = getBotClient();

    // Attach bot membership flag
    const guilds = guildsRes.data.map(g => {
      const perms = BigInt(g.permissions || '0');
      const isAdmin = g.owner || (perms & BigInt(0x8)) === BigInt(0x8);
      return {
        ...g,
        isAdmin,
        hasBot: botClient ? botClient.guilds.cache.has(g.id) : false,
      };
    });

    // Save guilds into server session store (avoiding large JWT / Cookie size / HTTP 431)
    sessionStore.setGuilds(userRes.data.id, guilds);

    // Modern Discord Display Name (global_name) or fallback to username handle
    const displayName = userRes.data.global_name || userRes.data.username;

    // Compact JWT Payload - keep headers small!
    const userPayload: JwtUserPayload = {
      id: userRes.data.id,
      username: userRes.data.username,
      globalName: userRes.data.global_name || null,
      displayName: displayName,
      discriminator: userRes.data.discriminator || '0',
      avatar: userRes.data.avatar,
    };

    const token = jwt.sign(userPayload, config.server.jwtSecret, { expiresIn: '7d' });

    res.cookie('royal_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${config.server.dashboardUrl}/?token=${token}`);
  } catch (err: any) {
    console.error('❌ [OAuth2 Error]:', err.response?.data || err.message);
    res.redirect(`${config.server.dashboardUrl}/?error=auth_failed`);
  }
});

// 4. Get Current User Info
router.get('/user', authGuard, (req: AuthenticatedRequest, res: Response) => {
  const guilds = sessionStore.getGuilds(req.user!.id);
  res.json({
    user: {
      ...req.user,
      guilds: guilds || [],
    }
  });
});

// 5. Logout
router.post('/logout', (req, res) => {
  res.clearCookie('royal_token');
  res.json({ success: true });
});

export default router;
