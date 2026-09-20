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
  streamUrl: 'https://vidlink.pro/movie/tt1375666?primaryColor=c5a059&autoplay=true',
  overview: 'Dom Cobb is a skilled thief, the absolute best in the dangerous art of extraction.',
};

// Comprehensive Arabic <-> English Popular Titles Dictionary
const POPULAR_ARABIC_MAP: Record<string, { title: string; type?: 'movie' | 'series' }> = {
  // Anime (أنمي)
  'ون بيس': { title: 'One Piece', type: 'series' },
  'ونبيس': { title: 'One Piece', type: 'series' },
  'هجوم العمالقة': { title: 'Attack on Titan', type: 'series' },
  'قاتل الشياطين': { title: 'Demon Slayer: Kimetsu no Yaiba', type: 'series' },
  'ديمون سلاير': { title: 'Demon Slayer: Kimetsu no Yaiba', type: 'series' },
  'كيميتسو': { title: 'Demon Slayer: Kimetsu no Yaiba', type: 'series' },
  'جوجوتسو كايسن': { title: 'Jujutsu Kaisen', type: 'series' },
  'جوجيتسو': { title: 'Jujutsu Kaisen', type: 'series' },
  'ناروتو': { title: 'Naruto', type: 'series' },
  'ناروتو شيبودن': { title: 'Naruto: Shippuden', type: 'series' },
  'بليتش': { title: 'Bleach', type: 'series' },
  'المحقق كونان': { title: 'Detective Conan', type: 'series' },
  'كونان': { title: 'Detective Conan', type: 'series' },
  'ديث نوت': { title: 'Death Note', type: 'series' },
  'مذكرة الموت': { title: 'Death Note', type: 'series' },
  'هنتر اكس هنتر': { title: 'Hunter x Hunter', type: 'series' },
  'القناص': { title: 'Hunter x Hunter', type: 'series' },
  'دراغون بول': { title: 'Dragon Ball Z', type: 'series' },
  'دراغون بول سوبر': { title: 'Dragon Ball Super', type: 'series' },
  'سولو ليفلينج': { title: 'Solo Leveling', type: 'series' },
  'طوكيو غول': { title: 'Tokyo Ghoul', type: 'series' },
  'فينلاند ساجا': { title: 'Vinland Saga', type: 'series' },
  'طوكيو ريفينجرز': { title: 'Tokyo Revengers', type: 'series' },
  'بلاك كلوفر': { title: 'Black Clover', type: 'series' },
  'تشينسو مان': { title: 'Chainsaw Man', type: 'series' },
  'رجل المنشار': { title: 'Chainsaw Man', type: 'series' },
  'بلو لوك': { title: 'Blue Lock', type: 'series' },
  'هايكيو': { title: 'Haikyuu!!', type: 'series' },
  'شتاينز جيت': { title: 'Steins;Gate', type: 'series' },
  'كود جياس': { title: 'Code Geass', type: 'series' },
  'الخيميائي الفولاذي': { title: 'Fullmetal Alchemist: Brotherhood', type: 'series' },
  'ون بنش مان': { title: 'One Punch Man', type: 'series' },
  'سايتاما': { title: 'One Punch Man', type: 'series' },
  'موب سايكو': { title: 'Mob Psycho 100', type: 'series' },
  'سورد ارت اونلاين': { title: 'Sword Art Online', type: 'series' },
  'فيري تيل': { title: 'Fairy Tail', type: 'series' },
  
  // Turkish Series (مسلسلات تركية)
  'المؤسس عثمان': { title: 'Establishment: Osman', type: 'series' },
  'عثمان': { title: 'Establishment: Osman', type: 'series' },
  'قيامة عثمان': { title: 'Establishment: Osman', type: 'series' },
  'قيامة ارطغرل': { title: 'Dirilis: Ertugrul', type: 'series' },
  'ارطغرل': { title: 'Dirilis: Ertugrul', type: 'series' },
  'الحفرة': { title: 'Cukur', type: 'series' },
  'طائر الرفراف': { title: 'Yali Capkini', type: 'series' },
  'وادي الذئاب': { title: 'Valley of the Wolves', type: 'series' },
  'صلاح الدين الايوبي': { title: 'Kudus Fatihi Selahaddin Eyyubi', type: 'series' },
  'الب ارسلان': { title: 'Alparslan: Buyuk Selcuklu', type: 'series' },
  'المنظمة': { title: 'Teskilat', type: 'series' },
  'حكايتنا': { title: 'Bizim Hikaye', type: 'series' },
  'القضاء': { title: 'Yargi', type: 'series' },
  'انت اطرق بابي': { title: 'Sen Cal Kapimi', type: 'series' },
  'حب اعمى': { title: 'Kara Sevda', type: 'series' },
  'العشق الممنوع': { title: 'Ask-i Memnu', type: 'series' },
  'رامو': { title: 'Ramo', type: 'series' },

  // Korean & Asian Dramas (مسلسلات كورية وآسيوية)
  'لعبة الحبار': { title: 'Squid Game', type: 'series' },
  'كلنا موتى': { title: 'All of Us Are Dead', type: 'series' },
  'اليس في بلاد العجائب': { title: 'Alice in Borderland', type: 'series' },
  'فينتشنزو': { title: 'Vincenzo', type: 'series' },
  'مجد الانتقام': { title: 'The Glory', type: 'series' },
  'المجد': { title: 'The Glory', type: 'series' },
  'هبوط اضطراري للحب': { title: 'Crash Landing on You', type: 'series' },
  'السعادة': { title: 'Happiness', type: 'series' },

  // Global Series (مسلسلات عالمية)
  'صراع العروش': { title: 'Game of Thrones', type: 'series' },
  'قيم اوف ثرونز': { title: 'Game of Thrones', type: 'series' },
  'بيت التنين': { title: 'House of the Dragon', type: 'series' },
  'ال التنين': { title: 'House of the Dragon', type: 'series' },
  'بريكنج باد': { title: 'Breaking Bad', type: 'series' },
  'بيكي بلايندرز': { title: 'Peaky Blinders', type: 'series' },
  'سترينجر ثينقز': { title: 'Stranger Things', type: 'series' },
  'اشياء غريبة': { title: 'Stranger Things', type: 'series' },
  'الفايكنج': { title: 'Vikings', type: 'series' },
  'فايكنج': { title: 'Vikings', type: 'series' },
  'ذا بويز': { title: 'The Boys', type: 'series' },
  'الرفاق': { title: 'The Boys', type: 'series' },
  'دارك': { title: 'Dark', type: 'series' },
  'لا كاسا دي بابيل': { title: 'Money Heist', type: 'series' },
  'البروفيسور': { title: 'Money Heist', type: 'series' },
  'فريندز': { title: 'Friends', type: 'series' },
  'ذا لاست اوف اس': { title: 'The Last of Us', type: 'series' },
  'اخر من تبقى منا': { title: 'The Last of Us', type: 'series' },
  'سوبرناتشورال': { title: 'Supernatural', type: 'series' },
  'ذا ووكينج ديد': { title: 'The Walking Dead', type: 'series' },
  'الموتى السائرون': { title: 'The Walking Dead', type: 'series' },
  'شيرلوك': { title: 'Sherlock', type: 'series' },
  'لوكي': { title: 'Loki', type: 'series' },
  'سكسشن': { title: 'Succession', type: 'series' },
  'الخلافة': { title: 'Succession', type: 'series' },
  'ديكستر': { title: 'Dexter', type: 'series' },
  'بريزون بريك': { title: 'Prison Break', type: 'series' },
  'الهروب من السجن': { title: 'Prison Break', type: 'series' },
  'بلاك ميرور': { title: 'Black Mirror', type: 'series' },
  'المراة السوداء': { title: 'Black Mirror', type: 'series' },

  // Arabic & Egyptian Movies & Series (أفلام ومسلسلات عربية ومصرية)
  'الفيل الازرق': { title: 'The Blue Elephant', type: 'movie' },
  'الفيل الازرق 2': { title: 'The Blue Elephant 2', type: 'movie' },
  'ولاد رزق': { title: 'Welad Rizk', type: 'movie' },
  'ولاد رزق 2': { title: 'Welad Rizk 2', type: 'movie' },
  'ولاد رزق 3': { title: 'Sons of Rizk 3', type: 'movie' },
  'كيرة والجن': { title: 'Kira & El Gin', type: 'movie' },
  'الحريفة': { title: 'El Hareefa', type: 'movie' },
  'تيتو': { title: 'Tito', type: 'movie' },
  'ابراهيم الابيض': { title: 'Ibrahim Labyad', type: 'movie' },
  'صعيدي في الجامعة الامريكية': { title: 'Saedi Fi El Gamaa El Amrekiya', type: 'movie' },
  'شمس الزناتي': { title: 'Shams El Zanati', type: 'movie' },
  'كازابلانكا': { title: 'Casablanca', type: 'movie' },
  'جعفر العمدة': { title: 'Gaafar El Omda', type: 'series' },
  'ملوك الجدعنة': { title: 'Molook El Gadana', type: 'series' },
  'الهيبة': { title: 'Al Hayba', type: 'series' },
  'الحشاشين': { title: 'The Assassins', type: 'series' },
  'سفاح الجيزة': { title: 'Safah El Giza', type: 'series' },
  'الكبير اوي': { title: 'El Kabeer Awi', type: 'series' },
  'موضوع عائلي': { title: 'Mawdoo Aeli', type: 'series' },
  'العتاولة': { title: 'Al Atawla', type: 'series' },
  'نعمة الافوكاتو': { title: 'Nema El Avocato', type: 'series' },
  'حق عرب': { title: 'Haq Arab', type: 'series' },

  // Hollywood Movies (أفلام هوليوود)
  'اوبنهايمر': { title: 'Oppenheimer', type: 'movie' },
  'باربي': { title: 'Barbie', type: 'movie' },
  'افاتار': { title: 'Avatar', type: 'movie' },
  'انترستيلر': { title: 'Interstellar', type: 'movie' },
  'بين النجوم': { title: 'Interstellar', type: 'movie' },
  'انسيبشن': { title: 'Inception', type: 'movie' },
  'استهلال': { title: 'Inception', type: 'movie' },
  'باتمان': { title: 'The Batman', type: 'movie' },
  'الجوكر': { title: 'Joker', type: 'movie' },
  'سبايدرمان': { title: 'Spider-Man', type: 'movie' },
  'الرجل العنكبوت': { title: 'Spider-Man', type: 'movie' },
  'تايتانيك': { title: 'Titanic', type: 'movie' },
  'جلادياتور': { title: 'Gladiator', type: 'movie' },
  'المحارب': { title: 'Gladiator', type: 'movie' },
  'سيد الخواتم': { title: 'The Lord of the Rings: The Fellowship of the Ring', type: 'movie' },
  'هاري بوتر': { title: "Harry Potter and the Sorcerer's Stone", type: 'movie' },
  'جون ويك': { title: 'John Wick', type: 'movie' },
  'ديدبول': { title: 'Deadpool', type: 'movie' },
  'المصفوفة': { title: 'The Matrix', type: 'movie' },
  'ماتريكس': { title: 'The Matrix', type: 'movie' },
  'افنجرز': { title: 'The Avengers', type: 'movie' },
  'المنتقمون': { title: 'The Avengers', type: 'movie' },
  'ايرون مان': { title: 'Iron Man', type: 'movie' },
  'الرجل الحديدي': { title: 'Iron Man', type: 'movie' },
  'فاست اند فيوريوس': { title: 'Fast & Furious', type: 'movie' },
  'السرعة والغضب': { title: 'Fast & Furious', type: 'movie' },
  'مهمة مستحيلة': { title: 'Mission: Impossible', type: 'movie' },
  'ميشن امبوسيبل': { title: 'Mission: Impossible', type: 'movie' },
  'توب غان': { title: 'Top Gun: Maverick', type: 'movie' },
  'دون': { title: 'Dune', type: 'movie' },
  'كثيب': { title: 'Dune', type: 'movie' },
  'كوكب القردة': { title: 'Kingdom of the Planet of the Apes', type: 'movie' },
  'قراصنة الكاريبي': { title: 'Pirates of the Caribbean: The Curse of the Black Pearl', type: 'movie' },
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
   * Live search for any movie/series/anime or resolve direct video URL from ANY source
   */
  static async resolveMovie(
    rawQuery?: string, 
    directUrl?: string,
    seasonNum: number = 1,
    episodeNum: number = 1,
    isExplicitSeries: boolean = false
  ): Promise<MovieMetadata> {
    // 1. Direct URL provided from ANY Arabic or Western website
    if (directUrl && directUrl.startsWith('http')) {
      let finalStreamUrl = directUrl;
      let cleanTitle = rawQuery || 'بث سينمائي مباشر';

      // YouTube support (watch, shorts, embed, youtu.be)
      if (directUrl.includes('youtube.com/watch?v=')) {
        const vid = directUrl.split('v=')[1]?.split('&')[0];
        if (vid) finalStreamUrl = `https://www.youtube.com/embed/${vid}?autoplay=1`;
        cleanTitle = rawQuery || 'يوتيوب سينما (YouTube Stream)';
      } else if (directUrl.includes('youtu.be/')) {
        const vid = directUrl.split('youtu.be/')[1]?.split('?')[0];
        if (vid) finalStreamUrl = `https://www.youtube.com/embed/${vid}?autoplay=1`;
        cleanTitle = rawQuery || 'يوتيوب سينما (YouTube Stream)';
      } else if (directUrl.includes('wecima') || directUrl.includes('mycima')) {
        cleanTitle = rawQuery || 'وي سيما - ماي سيما (WeeCima Stream)';
      } else if (directUrl.includes('akwam')) {
        cleanTitle = rawQuery || 'أكوام سينما (Akwam Stream)';
      } else if (directUrl.includes('faselhd')) {
        cleanTitle = rawQuery || 'فاصل إعلاني (FaselHD Stream)';
      } else if (directUrl.includes('arabseed')) {
        cleanTitle = rawQuery || 'عرب سيد (Arabseed Stream)';
      } else if (directUrl.includes('shahid')) {
        cleanTitle = rawQuery || 'شاهد (Shahid Stream)';
      } else if (directUrl.includes('egybest') || directUrl.includes('cima4u')) {
        cleanTitle = rawQuery || 'ايجي بست - سيما فور يو';
      } else {
        const filename = directUrl.split('/').pop()?.split('?')[0] || 'Direct Stream Cinema';
        cleanTitle = rawQuery || filename;
      }

      return {
        title: cleanTitle,
        type: 'movie',
        quality: '1080p Full HD',
        language: 'Arabic / Multi-Audio',
        subtitles: 'Auto Subtitles',
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
        streamUrl: finalStreamUrl,
        overview: `بث سينمائي مباشر فائق الوضوح (${cleanTitle}). خالي من الإعلانات والنوافذ المنبثقة.`,
      };
    }

    // 2. Query provided: extract Season & Episode automatically
    if (rawQuery) {
      let parsedSeason = seasonNum || 1;
      let parsedEpisode = episodeNum || 1;
      let query = rawQuery.trim();

      // Detect S01E05 or s1 e5 or 1x5
      const seMatch = query.match(/s(\d+)\s*(?:e|ep|x|\-)?\s*(\d+)/i);
      if (seMatch) {
        parsedSeason = parseInt(seMatch[1], 10);
        parsedEpisode = parseInt(seMatch[2], 10);
        query = query.replace(seMatch[0], '').trim();
      } else {
        // الموسم X
        const sMatch = query.match(/(?:الموسم|موسم|season)\s*(\d+)/i);
        if (sMatch) {
          parsedSeason = parseInt(sMatch[1], 10);
          query = query.replace(sMatch[0], '').trim();
        }
        // الحلقة Y
        const eMatch = query.match(/(?:الحلقة|حلقة|episode|ep)\s*(\d+)/i);
        if (eMatch) {
          parsedEpisode = parseInt(eMatch[1], 10);
          query = query.replace(eMatch[0], '').trim();
        }
      }

      // 2.1 Check local database catalog first
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
          overview: `الكتالوج الرسمي لسينما رويال (${dbMovie.quality} • ${dbMovie.language}).`,
        };
      }

      // 2.2 Check Arabic Popular Titles Dictionary
      const normalizedQuery = query.toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
        .trim();

      let targetEnglishTitle: string | null = null;
      let targetType: 'movie' | 'series' | null = null;

      for (const [arKey, mapped] of Object.entries(POPULAR_ARABIC_MAP)) {
        const normKey = arKey.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();
        if (normalizedQuery.includes(normKey) || normKey.includes(normalizedQuery)) {
          targetEnglishTitle = mapped.title;
          targetType = mapped.type || null;
          break;
        }
      }

      // 2.3 Online Translation Fallback if query has Arabic characters and wasn't in dictionary
      let searchQueries = [query];
      if (targetEnglishTitle) {
        searchQueries.unshift(targetEnglishTitle);
      } else if (/[\u0600-\u06FF]/.test(query)) {
        try {
          const trans = await axios.get(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=ar|en`,
            { timeout: 3000 }
          );
          const tText = trans.data?.responseData?.translatedText?.replace(/[."'"]/g, '').trim();
          if (tText && tText.length > 1 && !tText.toLowerCase().includes('theme music')) {
            searchQueries.unshift(tText);
          }
        } catch {}
      }

      // 2.4 Multi-Catalog Search (Cinemeta Series & Movies: 10,000,000+ entries)
      const clean = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const scoreTitle = (t: string, q: string): number => {
        const ct = clean(t);
        const cq = clean(q);
        if (!ct || !cq) return 0;
        if (ct === cq) return 100;
        if (ct.startsWith(cq) || cq.startsWith(ct)) return 85;
        if (ct.includes(cq) || cq.includes(ct)) return 70;
        return 15;
      };

      try {
        for (const sq of searchQueries) {
          const [movieRes, seriesRes] = await Promise.all([
            axios.get(`https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(sq)}.json`, { timeout: 4000 }).catch(() => ({ data: { metas: [] } })),
            axios.get(`https://v3-cinemeta.strem.io/catalog/series/top/search=${encodeURIComponent(sq)}.json`, { timeout: 4000 }).catch(() => ({ data: { metas: [] } })),
          ]);

          const moviesList = movieRes.data?.metas || [];
          const seriesList = seriesRes.data?.metas || [];

          const bestMovie = moviesList.length > 0 ? { item: moviesList[0], score: scoreTitle(moviesList[0].name, sq) } : { item: null, score: -1 };
          const bestSeries = seriesList.length > 0 ? { item: seriesList[0], score: scoreTitle(seriesList[0].name, sq) } : { item: null, score: -1 };

          const isSeriesTarget = targetType === 'series' || isExplicitSeries || /مسلسل|حلقة|season|episode|anime|series|أنمي/i.test(rawQuery) || parsedEpisode > 1 || parsedSeason > 1;

          if (isSeriesTarget && bestSeries.item) {
            const s = Math.max(1, parsedSeason);
            const e = Math.max(1, parsedEpisode);
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
              streamUrl: `https://vidlink.pro/tv/${bestSeries.item.id}/${s}/${e}?primaryColor=c5a059&autoplay=true`,
              overview: bestSeries.item.description || `حلقة كاملة من ${bestSeries.item.name} الموسم ${s} الحلقة ${e} بدون إعلانات وبجودة 1080p مع ترجمة عربية.`,
            };
          } else if (bestMovie.item && !isSeriesTarget) {
            return {
              imdbId: bestMovie.item.id,
              title: `${bestMovie.item.name} (${bestMovie.item.releaseInfo || 'Movie'})`,
              type: 'movie',
              quality: '1080p Full HD',
              language: 'Multi-Audio (Arabic Subtitles)',
              subtitles: 'Arabic, English',
              duration: 'Full Movie (120+ mins)',
              posterUrl: bestMovie.item.poster || DEFAULT_MOVIE.posterUrl,
              streamUrl: `https://vidlink.pro/movie/${bestMovie.item.id}?primaryColor=c5a059&autoplay=true`,
              overview: bestMovie.item.description || `فيلم ${bestMovie.item.name} كامل بدقة عالية 1080p بدون إعلانات مع ترجمة عربية.`,
            };
          } else if (bestSeries.item) {
            const s = Math.max(1, parsedSeason);
            const e = Math.max(1, parsedEpisode);
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
              streamUrl: `https://vidlink.pro/tv/${bestSeries.item.id}/${s}/${e}?primaryColor=c5a059&autoplay=true`,
              overview: bestSeries.item.description || `حلقة كاملة من ${bestSeries.item.name} الموسم ${s} الحلقة ${e} بدون إعلانات وبجودة 1080p مع ترجمة عربية.`,
            };
          }
        }
      } catch (err) {}

      // 2.5 Dynamic fallback entry
      return {
        title: rawQuery,
        type: isExplicitSeries ? 'series' : 'movie',
        season: isExplicitSeries ? parsedSeason : undefined,
        episode: isExplicitSeries ? parsedEpisode : undefined,
        quality: '1080p Full HD',
        language: 'Arabic / Multi-Audio',
        subtitles: 'Arabic, English',
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
        streamUrl: DEFAULT_MOVIE.streamUrl,
        overview: `جلسة سينما رويال فائقة التزامن لـ ${rawQuery}. خالية تماماً من الإعلانات والنوافذ المنبثقة.`,
      };
    }

    // Default movie if no query or URL
    return { ...DEFAULT_MOVIE };
  }

  /**
   * Search all catalogs and return multiple items for live search UI
   */
  static async searchCatalog(query: string, type?: string): Promise<MovieMetadata[]> {
    if (!query || query.trim().length === 0) return [];
    const cleanQ = query.trim();

    const results: MovieMetadata[] = [];
    const seenImdbIds = new Set<string>();

    // 1. Search local DB first
    try {
      const dbItems = await prisma.movieItem.findMany({
        where: {
          title: { contains: cleanQ },
          type: type ? String(type) : undefined,
        },
        take: 6,
      });

      for (const item of dbItems) {
        results.push({
          id: item.id,
          title: item.title,
          type: item.type as 'movie' | 'series',
          quality: item.quality,
          language: item.language,
          subtitles: item.subtitles,
          posterUrl: item.posterUrl || DEFAULT_MOVIE.posterUrl,
          streamUrl: item.streamUrl,
          season: item.season || undefined,
          episode: item.episode || undefined,
          duration: item.duration || undefined,
        });
      }
    } catch {}

    // 2. Resolve English Title for Cinemeta if query is in Arabic
    const normalizedQuery = cleanQ.toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '')
      .trim();

    const hasArabic = /[\u0600-\u06FF]/.test(cleanQ);
    let resolvedEnglishTerm: string | null = null;
    let matchedMappedType: 'movie' | 'series' | null = null;

    for (const [arKey, mapped] of Object.entries(POPULAR_ARABIC_MAP)) {
      const normKey = arKey.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();
      if (normalizedQuery.includes(normKey) || normKey.includes(normalizedQuery)) {
        resolvedEnglishTerm = mapped.title;
        if (mapped.type) matchedMappedType = mapped.type;
        break;
      }
    }

    if (!resolvedEnglishTerm && hasArabic) {
      try {
        const trans = await axios.get(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanQ)}&langpair=ar|en`,
          { timeout: 3000 }
        );
        const tText = trans.data?.responseData?.translatedText?.replace(/[."'"]/g, '').trim();
        if (tText && tText.length > 1 && !tText.toLowerCase().includes('theme music')) {
          resolvedEnglishTerm = tText;
        }
      } catch {}
    }

    // 3. Search Cinemeta with resolved terms (NEVER pass raw Arabic to Cinemeta as it strips non-ascii characters)
    try {
      const cinemetaTerms: string[] = [];
      if (resolvedEnglishTerm) {
        cinemetaTerms.push(resolvedEnglishTerm);
      }
      if (!hasArabic) {
        cinemetaTerms.push(cleanQ);
      }

      const targetType = type || matchedMappedType;
      const searchTypes = targetType === 'series' ? ['series'] : targetType === 'movie' ? ['movie'] : ['movie', 'series'];

      for (const term of cinemetaTerms) {
        for (const t of searchTypes) {
          const res = await axios.get(
            `https://v3-cinemeta.strem.io/catalog/${t}/top/search=${encodeURIComponent(term)}.json`, 
            { timeout: 3500 }
          ).catch(() => ({ data: { metas: [] } }));

          for (const meta of (res.data?.metas || []).slice(0, 6)) {
            if (meta.id && seenImdbIds.has(meta.id)) continue;
            if (meta.id) seenImdbIds.add(meta.id);

            results.push({
              imdbId: meta.id,
              title: meta.name,
              type: t as 'movie' | 'series',
              quality: '1080p Full HD',
              language: 'Multi-Audio (Arabic Subs)',
              subtitles: 'Arabic, English',
              duration: meta.releaseInfo || (t === 'series' ? 'Series' : 'Movie'),
              posterUrl: meta.poster || DEFAULT_MOVIE.posterUrl,
              streamUrl: t === 'series'
                ? `https://vidlink.pro/tv/${meta.id}/1/1?primaryColor=c5a059&autoplay=true`
                : `https://vidlink.pro/movie/${meta.id}?primaryColor=c5a059&autoplay=true`,
              overview: meta.description || '',
            });
          }
        }
        if (results.length >= 8) break;
      }
    } catch {}

    return results;
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
