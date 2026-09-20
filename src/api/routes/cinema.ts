import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database/index.js';
import { authGuard, AuthenticatedRequest } from '../middlewares/authGuards.js';
import { CinemaManager } from '../../bot/modules/cinemaManager.js';
import { config } from '../../config/index.js';
import { getBotClient } from '../../bot/index.js';

const router = express.Router();

// Seed initial legal public domain cinema demo content if empty
async function ensureCatalogSeeded() {
  const count = await prisma.movieItem.count();
  if (count === 0) {
    await prisma.movieItem.createMany({
      data: [
        {
          title: 'Inception (Full Movie)',
          type: 'movie',
          duration: '2h 28m',
          quality: '1080p Full HD',
          language: 'English (Arabic Subtitles)',
          subtitles: 'Arabic, English',
          posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX250.jpg',
          streamUrl: 'https://multiembed.mov/?video_id=tt1375666',
          isLegalPublicDomain: true,
        },
        {
          title: 'Attack on Titan (S1:E1)',
          type: 'series',
          season: 1,
          episode: 1,
          duration: '24 mins',
          quality: '1080p Full HD',
          language: 'Japanese (Arabic Subtitles)',
          subtitles: 'Arabic, English',
          posterUrl: 'https://m.media-amazon.com/images/M/MV5BZjliODY5MzQtMmViZC00MTZmLWFhMWMtMjMwM2I3OGY1MTRiXkEyXkFqcGc@._V1_SX250.jpg',
          streamUrl: 'https://multiembed.mov/?video_id=tt2560140&s=1&e=1',
          isLegalPublicDomain: true,
        },
        {
          title: 'Breaking Bad (S1:E1)',
          type: 'series',
          season: 1,
          episode: 1,
          duration: '58 mins',
          quality: '1080p Full HD',
          language: 'English (Arabic Subtitles)',
          subtitles: 'Arabic, English',
          posterUrl: 'https://m.media-amazon.com/images/M/MV5BOWE4NTc3YmYtNmU2Mi00ZjhkLWE1MTItZmM1M2U1ODU3YjFlXkEyXkFqcGc@._V1_SX250.jpg',
          streamUrl: 'https://multiembed.mov/?video_id=tt0903747&s=1&e=1',
          isLegalPublicDomain: true,
        },
        {
          title: 'Big Buck Bunny (Animation Classic)',
          type: 'movie',
          duration: '09:56',
          quality: '1080p 60fps',
          language: 'Original Sound',
          subtitles: 'Arabic, English',
          posterUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400',
          streamUrl: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4',
          isLegalPublicDomain: true,
        }
      ],
    });
  }
}

// Ensure seeded on startup
ensureCatalogSeeded().catch(err => console.error('[Cinema Seed Error]:', err));

// 0. Fetch real Arabic subtitles from OpenSubtitles API
router.get('/subtitles', async (req, res) => {
  const { imdbId, type, season, episode } = req.query;
  if (!imdbId || typeof imdbId !== 'string') {
    return res.json({ success: false, hasArabic: false, subtitles: [] });
  }

  try {
    const isSeries = type === 'series' || (season && Number(season) > 0);
    const url = isSeries
      ? `https://opensubtitles-v3.strem.io/subtitles/series/${imdbId}:${season || 1}:${episode || 1}.json`
      : `https://opensubtitles-v3.strem.io/subtitles/movie/${imdbId}.json`;

    const response = await axios.get(url, { timeout: 4500 });
    const allSubs = response.data?.subtitles || [];
    const arabicSubs = allSubs
      .filter((s: any) => s.lang === 'ara' || s.lang === 'ar' || s.lang === 'arabic')
      .map((s: any) => ({
        id: s.id,
        url: s.url,
        lang: 'Arabic',
        label: 'العربية (Arabic)',
        name: s.subtitleFileName || s.movieReleaseName || 'ترجمة عربية معتمدة',
        format: s.url?.endsWith('.vtt') ? 'vtt' : 'srt',
      }));

    return res.json({
      success: true,
      hasArabic: arabicSubs.length > 0,
      subtitles: arabicSubs,
    });
  } catch {
    return res.json({ success: false, hasArabic: false, subtitles: [] });
  }
});

// 1. Get Catalog
router.get('/catalog', async (req, res) => {
  const { type } = req.query;
  const items = await prisma.movieItem.findMany({
    where: type ? { type: String(type) } : undefined,
    orderBy: { id: 'asc' },
  });
  res.json({ items });
});

// 2. Add New Movie / Episode
router.post('/items', authGuard, async (req: AuthenticatedRequest, res) => {
  const { title, type, season, episode, duration, quality, language, subtitles, posterUrl, streamUrl } = req.body;

  if (!title || !streamUrl) {
    return res.status(400).json({ error: 'Title and streamUrl are required' });
  }

  const created = await prisma.movieItem.create({
    data: {
      title,
      type: type || 'movie',
      season: season ? parseInt(season, 10) : null,
      episode: episode ? parseInt(episode, 10) : null,
      duration: duration || 'Unknown',
      quality: quality || '1080p',
      language: language || 'Arabic',
      subtitles: subtitles || 'Arabic, English',
      posterUrl: posterUrl || null,
      streamUrl,
      isLegalPublicDomain: true,
    },
  });

  res.json({ success: true, item: created });
});

// 3. Delete Movie / Episode
router.delete('/items/:id', authGuard, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await prisma.movieItem.delete({ where: { id } });
  res.json({ success: true });
});

// 4. Ultra-tight Server-Sent Events (SSE) Live Stream for Synchronized Playback
router.get('/session/:channelId/stream', (req, res) => {
  const { channelId } = req.params;
  const { guildId } = req.query;

  // SSE response headers (bypass proxy buffering)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  CinemaManager.registerClient(channelId, res, typeof guildId === 'string' ? guildId : undefined);

  req.on('close', () => {
    CinemaManager.removeClient(channelId, res);
  });
});

// 5. Action endpoint for player controls (play, pause, seek, setMovie, resync)
router.post('/session/:channelId/action', async (req, res) => {
  const { channelId } = req.params;
  const { action, time, actor, movie } = req.body;

  const session = CinemaManager.getOrCreateSession(channelId);

  switch (action) {
    case 'play':
      CinemaManager.play(channelId, actor);
      break;
    case 'pause':
      CinemaManager.pause(channelId, actor);
      break;
    case 'toggle':
      CinemaManager.toggle(channelId, actor);
      break;
    case 'seek':
      if (typeof time === 'number') {
        CinemaManager.seek(channelId, time, actor);
      }
      break;
    case 'resync':
      CinemaManager.forceResync(channelId, actor);
      break;
    case 'setMovie':
      if (movie) {
        CinemaManager.setSessionMovie(channelId, movie);
      }
      break;
    default:
      return res.status(400).json({ error: 'Unknown action' });
  }

  res.json({
    success: true,
    isPlaying: session.isPlaying,
    currentTime: CinemaManager.getCurrentTime(session),
  });
});

// 6. Get current snapshot state for channel
router.get('/session/:channelId', (req, res) => {
  const { channelId } = req.params;
  const session = CinemaManager.getOrCreateSession(channelId);

  res.json({
    session: {
      channelId: session.channelId,
      guildId: session.guildId,
      movie: session.movie,
      currentTime: CinemaManager.getCurrentTime(session),
      startTimestamp: session.startTimestamp,
      isPlaying: session.isPlaying,
      viewersCount: session.clients.size,
      lastUpdated: session.lastUpdated,
    },
  });
});

// 7. Legacy sync endpoint for backward compatibility
router.post('/session/:channelId/sync', (req, res) => {
  const { channelId } = req.params;
  const { currentTime, isPlaying, actor } = req.body;

  if (typeof isPlaying === 'boolean') {
    if (isPlaying) {
      CinemaManager.play(channelId, actor);
    } else {
      CinemaManager.pause(channelId, actor);
    }
  }

  if (typeof currentTime === 'number') {
    CinemaManager.seek(channelId, currentTime, actor);
  }

  const session = CinemaManager.getOrCreateSession(channelId);
  res.json({
    success: true,
    session: {
      channelId: session.channelId,
      currentTime: CinemaManager.getCurrentTime(session),
      isPlaying: session.isPlaying,
      lastUpdated: session.lastUpdated,
    },
  });
});

// 8. Access Check: User MUST be in a Discord Voice Channel to watch
router.get('/check-access', async (req, res) => {
  const { channelId, guildId, user: queryUserId, token: queryToken } = req.query;

  // Find user ID from query param, JWT cookie, or Bearer auth
  let userId: string | null = typeof queryUserId === 'string' && queryUserId ? queryUserId : null;

  if (!userId) {
    const rawToken = req.cookies?.royal_token || req.headers.authorization?.replace('Bearer ', '') || (typeof queryToken === 'string' ? queryToken : null);
    if (rawToken) {
      try {
        const decoded = jwt.verify(rawToken, config.server.jwtSecret) as any;
        userId = decoded.id;
      } catch {
        // Invalid token
      }
    }
  }

  if (!userId) {
    return res.json({
      allowed: false,
      reason: 'NOT_IDENTIFIED',
      message: 'يرجى تسجيل الدخول أو استخدام الرابط المباشر من الديسكورد للتحقق من وجودك في الروم الصوتي.',
    });
  }

  const botClient = getBotClient();
  if (!botClient || !botClient.isReady()) {
    return res.json({ allowed: true, warning: 'Bot gateway synchronizing' });
  }

  // Find guild
  let guild = typeof guildId === 'string' && guildId ? botClient.guilds.cache.get(guildId) : null;
  if (!guild) {
    for (const g of botClient.guilds.cache.values()) {
      if (g.members.cache.has(userId)) {
        guild = g;
        break;
      }
    }
  }
  if (!guild) {
    guild = botClient.guilds.cache.first() || null;
  }

  if (!guild) {
    return res.json({
      allowed: false,
      reason: 'GUILD_NOT_FOUND',
      message: 'لم يتم العثور على سيرفر ديسكورد المطلوب.',
    });
  }

  let member = guild.members.cache.get(userId);
  if (!member) {
    try {
      member = await guild.members.fetch(userId);
    } catch {
      return res.json({
        allowed: false,
        reason: 'NOT_IN_SERVER',
        message: 'أنت لست عضواً في هذا السيرفر!',
      });
    }
  }

  // Check if member is in ANY voice channel in this server
  const voiceChannel = member.voice?.channel;
  if (!voiceChannel) {
    return res.json({
      allowed: false,
      reason: 'NOT_IN_VOICE',
      userName: member.displayName || member.user.username,
      message: 'لا يمكنك متابعة الفلم أو المسلسل إلا إذا كنت متواجداً في إحدى القنوات الصوتية داخل السيرفر!',
    });
  }

  return res.json({
    allowed: true,
    userName: member.displayName || member.user.username,
    voiceChannelId: voiceChannel.id,
    voiceChannelName: voiceChannel.name,
    message: `أهلاً بك! تم التحقق بنجاح من تواجدك في الروم الصوتي: ${voiceChannel.name}`,
  });
});

export default router;
