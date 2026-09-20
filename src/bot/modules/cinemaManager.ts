import type { Response } from 'express';
import axios from 'axios';
import { prisma } from '../../database/index.js';

export interface MovieMetadata {
  id?: number;
  imdbId?: string;
  title: string;
  posterUrl: string;
  streamUrl: string;
  quality: string;
  language: string;
  subtitles: string;
  type: 'movie' | 'series';
  season?: number;
  episode?: number;
  duration?: string;
  overview?: string;
}

export interface CinemaSession {
  channelId: string;
  guildId?: string;
  movie: MovieMetadata;
  isPlaying: boolean;
  baseTime: number;          // In seconds
  startTimestamp: number;    // Epoch ms when play was triggered
  lastUpdated: number;
  lastActionBy?: string;
  clients: Set<Response>;
}

// In-memory active cinema sessions mapped by Discord Voice Channel ID
const activeSessions = new Map<string, CinemaSession>();

// Default fallback movie (High Quality Full HD Feature Film with multi-servers)
const DEFAULT_MOVIE: MovieMetadata = {
  imdbId: 'tt1375666',
  title: 'Inception (Full Movie)',
  type: 'movie',
  duration: '2h 28m',
  quality: '1080p Full HD',
  language: 'English (Arabic Subtitles)',
  subtitles: 'Arabic, English',
  posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX250.jpg',
  streamUrl: 'https://vidsrc.pm/embed/movie/tt1375666?ds_lang=ar&sub=ar',
  overview: 'Dom Cobb is a skilled thief, the absolute best in the dangerous art of extraction.',
};

export class CinemaManager {
  /**
   * Get or initialize a cinema session for a voice channel
   */
  static getOrCreateSession(channelId: string, guildId?: string): CinemaSession {
    let session = activeSessions.get(channelId);
    if (!session) {
      session = {
        channelId,
        guildId,
        movie: { ...DEFAULT_MOVIE },
        isPlaying: false,
        baseTime: 0,
        startTimestamp: Date.now(),
        lastUpdated: Date.now(),
        clients: new Set<Response>(),
      };
      activeSessions.set(channelId, session);
    }
    if (guildId && !session.guildId) {
      session.guildId = guildId;
    }
    return session;
  }

  /**
   * Calculate exact server-authoritative playback position down to the second
   */
  static getCurrentTime(session: CinemaSession): number {
    if (!session.isPlaying) {
      return session.baseTime;
    }
    const elapsed = (Date.now() - session.startTimestamp) / 1000;
    return Math.max(0, session.baseTime + elapsed);
  }

  /**
   * Set or update movie for a session
   */
  static setSessionMovie(channelId: string, movie: MovieMetadata, guildId?: string): CinemaSession {
    const session = this.getOrCreateSession(channelId, guildId);
    session.movie = movie;
    session.isPlaying = false;
    session.baseTime = 0;
    session.startTimestamp = Date.now();
    session.lastUpdated = Date.now();

    this.broadcast(session, {
      type: 'MOVIE_CHANGE',
      movie: session.movie,
      currentTime: 0,
      isPlaying: false,
      serverTimestamp: Date.now(),
    });

    return session;
  }

  /**
   * Play for everyone in the room
   */
  static play(channelId: string, actor?: string): { success: boolean; session: CinemaSession } {
    const session = this.getOrCreateSession(channelId);
    if (!session.isPlaying) {
      session.isPlaying = true;
      session.startTimestamp = Date.now();
      session.lastUpdated = Date.now();
      session.lastActionBy = actor;

      this.broadcast(session, {
        type: 'PLAY',
        currentTime: session.baseTime,
        startTimestamp: session.startTimestamp,
        isPlaying: true,
        actor,
        serverTimestamp: Date.now(),
      });
    }
    return { success: true, session };
  }

  /**
   * Pause for everyone in the room
   */
  static pause(channelId: string, actor?: string): { success: boolean; session: CinemaSession } {
    const session = this.getOrCreateSession(channelId);
    if (session.isPlaying) {
      session.baseTime = this.getCurrentTime(session);
      session.isPlaying = false;
      session.startTimestamp = Date.now();
      session.lastUpdated = Date.now();
      session.lastActionBy = actor;

      this.broadcast(session, {
        type: 'PAUSE',
        currentTime: session.baseTime,
        isPlaying: false,
        actor,
        serverTimestamp: Date.now(),
      });
    }
    return { success: true, session };
  }

  /**
   * Toggle play/pause
   */
  static toggle(channelId: string, actor?: string): { isPlaying: boolean; session: CinemaSession } {
    const session = this.getOrCreateSession(channelId);
    if (session.isPlaying) {
      this.pause(channelId, actor);
      return { isPlaying: false, session };
    } else {
      this.play(channelId, actor);
      return { isPlaying: true, session };
    }
  }

  /**
   * Absolute seek to timestamp (in seconds)
   */
  static seek(channelId: string, targetSeconds: number, actor?: string): { session: CinemaSession } {
    const session = this.getOrCreateSession(channelId);
    session.baseTime = Math.max(0, targetSeconds);
    session.startTimestamp = Date.now();
    session.lastUpdated = Date.now();
    session.lastActionBy = actor;

    this.broadcast(session, {
      type: 'SEEK',
      currentTime: session.baseTime,
      startTimestamp: session.startTimestamp,
      isPlaying: session.isPlaying,
      actor,
      serverTimestamp: Date.now(),
    });

    return { session };
  }

  /**
   * Relative seek (+10s / -10s)
   */
  static seekRelative(channelId: string, deltaSeconds: number, actor?: string): { newTime: number; session: CinemaSession } {
    const session = this.getOrCreateSession(channelId);
    const current = this.getCurrentTime(session);
    const newTime = Math.max(0, current + deltaSeconds);
    this.seek(channelId, newTime, actor);
    return { newTime, session };
  }

  /**
   * Force broadcast hard synchronization to all connected viewers
   */
  static forceResync(channelId: string, actor?: string): CinemaSession {
    const session = this.getOrCreateSession(channelId);
    const currentTime = this.getCurrentTime(session);

    this.broadcast(session, {
      type: 'RESYNC',
      currentTime,
      startTimestamp: session.startTimestamp,
      isPlaying: session.isPlaying,
      actor,
      serverTimestamp: Date.now(),
    });

    return session;
  }

  /**
   * Register SSE viewer connection
   */
  static registerClient(channelId: string, res: Response, guildId?: string): CinemaSession {
    const session = this.getOrCreateSession(channelId, guildId);
    session.clients.add(res);

    // Send initial synchronized state immediately
    const initData = JSON.stringify({
      type: 'INIT',
      movie: session.movie,
      currentTime: this.getCurrentTime(session),
      startTimestamp: session.startTimestamp,
      isPlaying: session.isPlaying,
      viewersCount: session.clients.size,
      serverTimestamp: Date.now(),
    });
    res.write(`data: ${initData}\n\n`);

    // Notify others that viewer count increased
    this.broadcast(session, {
      type: 'VIEWERS_UPDATE',
      viewersCount: session.clients.size,
    }, res);

    return session;
  }

  /**
   * Remove SSE viewer connection on disconnect
   */
  static removeClient(channelId: string, res: Response) {
    const session = activeSessions.get(channelId);
    if (!session) return;

    session.clients.delete(res);

    // Notify remaining viewers
    this.broadcast(session, {
      type: 'VIEWERS_UPDATE',
      viewersCount: session.clients.size,
    });
  }

  /**
   * Broadcast message to all SSE clients subscribed to this channel session
   */
  static broadcast(session: CinemaSession, payload: any, excludeRes?: Response) {
    const msg = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of session.clients) {
      if (excludeRes && client === excludeRes) continue;
      try {
        client.write(msg);
      } catch {
        session.clients.delete(client);
      }
    }
  }

  /**
   * Live search for any movie/series or resolve direct video URL
   */
  /**
   * Live search for any movie/series or resolve direct video URL
   */
  static async resolveMovie(
    query?: string, 
    directUrl?: string,
    seasonNum: number = 1,
    episodeNum: number = 1,
    isExplicitSeries: boolean = false
  ): Promise<MovieMetadata> {
    // 1. Direct URL provided (WeeCima, MyCima, Akwam, YouTube, MP4, M3U8, etc.)
    if (directUrl && directUrl.startsWith('http')) {
      let finalStreamUrl = directUrl;
      // Convert YouTube to embed URL
      if (directUrl.includes('youtube.com/watch?v=')) {
        const vid = directUrl.split('v=')[1]?.split('&')[0];
        if (vid) finalStreamUrl = `https://www.youtube.com/embed/${vid}?autoplay=1`;
      } else if (directUrl.includes('youtu.be/')) {
        const vid = directUrl.split('youtu.be/')[1]?.split('?')[0];
        if (vid) finalStreamUrl = `https://www.youtube.com/embed/${vid}?autoplay=1`;
      }

      const cleanTitle = query || (
        directUrl.includes('wecima') ? 'وي سيما - WeeCima Cinema' :
        directUrl.includes('mycima') ? 'ماي سيما - MyCima Cinema' :
        directUrl.includes('akwam') ? 'أكوام - Akwam Stream' :
        directUrl.includes('faselhd') ? 'فاصل إعلاني - FaselHD' :
        directUrl.split('/').pop()?.split('?')[0] || 'Direct Stream Cinema'
      );

      return {
        title: cleanTitle,
        type: 'movie',
        quality: '1080p Full HD',
        language: 'Arabic / Multi-Audio',
        subtitles: 'Auto Subtitles',
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
        streamUrl: finalStreamUrl,
        overview: `بث سينمائي مباشر (${cleanTitle}).`,
      };
    }

    // 2. Query provided: check local database catalog first
    if (query) {
      const dbMovie = await prisma.movieItem.findFirst({
        where: {
          title: { contains: query },
        },
      });

      if (dbMovie) {
        const dbImdbId = dbMovie.streamUrl.match(/video_id=([a-zA-Z0-9]+)/)?.[1] ||
                         dbMovie.streamUrl.match(/imdb=([a-zA-Z0-9]+)/)?.[1];
        return {
          id: dbMovie.id,
          imdbId: dbImdbId || undefined,
          title: dbMovie.title,
          type: dbMovie.type as 'movie' | 'series',
          season: dbMovie.season || undefined,
          episode: dbMovie.episode || undefined,
          duration: dbMovie.duration || undefined,
          quality: dbMovie.quality,
          language: dbMovie.language,
          subtitles: dbMovie.subtitles,
          posterUrl: dbMovie.posterUrl || DEFAULT_MOVIE.posterUrl,
          streamUrl: dbMovie.streamUrl,
          overview: `Official Royal Cinema catalog entry (${dbMovie.quality} • ${dbMovie.language}).`,
        };
      }

      // 3. Search Cinemeta Movies and Series simultaneously with Smart Accuracy Scoring
      const clean = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      const scoreTitle = (title: string, targetQuery: string): number => {
        const cTitle = clean(title);
        const cQuery = clean(targetQuery);
        if (!cTitle || !cQuery) return 0;
        if (cTitle === cQuery) return 100;
        if (cTitle.startsWith(cQuery) || cQuery.startsWith(cTitle)) return 85;
        if (cTitle.includes(cQuery) || cQuery.includes(cTitle)) return 70;

        const qWords = targetQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const tWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        if (qWords.length > 0) {
          const matched = qWords.filter(w => tWords.some(tw => tw.includes(w) || w.includes(tw)));
          return Math.round((matched.length / qWords.length) * 60);
        }
        return 10;
      };

      const findBestInMetas = (metas: any[], targetQuery: string) => {
        let best = null;
        let maxScore = -1;
        for (const m of (metas || [])) {
          if (!m?.name) continue;
          const s = scoreTitle(m.name, targetQuery);
          if (s > maxScore) {
            maxScore = s;
            best = m;
            if (s === 100) break;
          }
        }
        return { item: best, score: maxScore };
      };

      try {
        let searchQueries = [query];

        // Arabic translation if query contains Arabic letters
        if (/[\u0600-\u06FF]/.test(query)) {
          try {
            const trans = await axios.get(
              `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=ar|en`,
              { timeout: 3500 }
            );
            const tText = trans.data?.responseData?.translatedText?.replace(/[."'"]/g, '').trim();
            if (tText && tText.length > 1 && !tText.toLowerCase().includes('theme music')) {
              searchQueries.push(tText);
            }
          } catch {}
        }

        for (const q of searchQueries) {
          const [movieRes, seriesRes] = await Promise.all([
            axios.get(`https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(q)}.json`, { timeout: 4500 }).catch(() => ({ data: { metas: [] } })),
            axios.get(`https://v3-cinemeta.strem.io/catalog/series/top/search=${encodeURIComponent(q)}.json`, { timeout: 4500 }).catch(() => ({ data: { metas: [] } })),
          ]);

          const bestMovie = findBestInMetas(movieRes.data?.metas, q);
          const bestSeries = findBestInMetas(seriesRes.data?.metas, q);

          // For Arabic queries where Cinemeta directly returned multilingual matches
          if (/[\u0600-\u06FF]/.test(q)) {
            if (seriesRes.data?.metas?.length > 0 && bestSeries.score < 40) {
              bestSeries.item = seriesRes.data.metas[0];
              bestSeries.score = 75;
            }
            if (movieRes.data?.metas?.length > 0 && bestMovie.score < 40) {
              bestMovie.item = movieRes.data.metas[0];
              bestMovie.score = 70;
            }
          }

          let movieScore = bestMovie.score;
          let seriesScore = bestSeries.score;

          const userExplicitSeries = isExplicitSeries || /مسلسل|حلقة|season|episode|anime|series/i.test(query) || (seasonNum > 1);
          const userExplicitMovie = /فيلم|فلم|movie|film/i.test(query);

          if (userExplicitSeries) seriesScore += 30;
          if (userExplicitMovie) movieScore += 30;

          // If we have a clear match (score >= 40)
          if ((bestMovie.item && movieScore >= 40) || (bestSeries.item && seriesScore >= 40)) {
            if (bestSeries.item && (seriesScore > movieScore || (userExplicitSeries && !bestMovie.item))) {
              const s = Math.max(1, seasonNum || 1);
              const e = Math.max(1, episodeNum || 1);
              return {
                imdbId: bestSeries.item.id,
                title: `${bestSeries.item.name} (الموسم ${s} - الحلقة ${e})`,
                type: 'series',
                season: s,
                episode: e,
                quality: '1080p Full HD',
                language: 'Multi-Audio (Arabic Subtitles)',
                subtitles: 'Arabic, English',
                duration: 'Full Episode (45-60 mins)',
                posterUrl: bestSeries.item.poster || DEFAULT_MOVIE.posterUrl,
                streamUrl: `https://vidsrc.pm/embed/tv?imdb=${bestSeries.item.id}&season=${s}&episode=${e}&ds_lang=ar&sub=ar`,
                overview: bestSeries.item.description || `حلقة كاملة من ${bestSeries.item.name} الموسم ${s} الحلقة ${e} مع ترجمة وسيرفرات متعددة.`,
              };
            } else if (bestMovie.item) {
              return {
                imdbId: bestMovie.item.id,
                title: `${bestMovie.item.name} (${bestMovie.item.releaseInfo || 'Movie'})`,
                type: 'movie',
                quality: '1080p Full HD',
                language: 'Multi-Audio (Arabic Subtitles)',
                subtitles: 'Arabic, English',
                duration: 'Full Movie (120+ mins)',
                posterUrl: bestMovie.item.poster || DEFAULT_MOVIE.posterUrl,
                streamUrl: `https://vidsrc.pm/embed/movie/${bestMovie.item.id}?ds_lang=ar&sub=ar`,
                overview: bestMovie.item.description || `فيلم ${bestMovie.item.name} كامل بدقة عالية مع ترجمة وسيرفرات سريعة.`,
              };
            }
          }
        }
      } catch (err) {}

      // 4. Search Wikipedia for Movie titles & official poster as fallback
      try {
        const wikiSearch = await axios.get(
          `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query + ' film')}&limit=1&namespace=0&format=json`,
          { headers: { 'User-Agent': 'RoyalCinemaBot/1.0 (contact@royalcinema.org)' }, timeout: 4000 }
        );

        const pageTitle = wikiSearch.data?.[1]?.[0];
        if (pageTitle) {
          const pageRes = await axios.get(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
            { headers: { 'User-Agent': 'RoyalCinemaBot/1.0 (contact@royalcinema.org)' }, timeout: 4000 }
          );

          if (pageRes.data) {
            return {
              title: pageRes.data.title || query,
              type: 'movie',
              quality: '1080p Full HD',
              language: 'Multi-Audio (Arabic Subs)',
              subtitles: 'Arabic, English',
              posterUrl: pageRes.data.thumbnail?.source || DEFAULT_MOVIE.posterUrl,
              streamUrl: DEFAULT_MOVIE.streamUrl,
              overview: pageRes.data.description || pageRes.data.extract?.slice(0, 160) || 'Royal Cinema Synchronized Watch Party.',
            };
          }
        }
      } catch {
        // Fallback below
      }

      // Custom dynamic entry with query as title
      return {
        title: query,
        type: 'movie',
        quality: '1080p Full HD',
        language: 'Arabic / Multi-Audio',
        subtitles: 'Arabic, English',
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
        streamUrl: DEFAULT_MOVIE.streamUrl,
        overview: `Synchronized cinema session for ${query}. Ready for 100% frame-accurate playback.`,
      };
    }

    // Default movie if no query or URL
    return { ...DEFAULT_MOVIE };
  }
}

// Global periodic heartbeat for all active sessions with connected viewers (Every 1.5s)
setInterval(() => {
  for (const session of activeSessions.values()) {
    if (session.clients.size > 0) {
      const currentTime = CinemaManager.getCurrentTime(session);
      const payload = {
        type: 'HEARTBEAT',
        currentTime,
        startTimestamp: session.startTimestamp,
        isPlaying: session.isPlaying,
        viewersCount: session.clients.size,
        serverTimestamp: Date.now(),
      };
      CinemaManager.broadcast(session, payload);
    }
  }
}, 1500);
