import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Film, 
  Play, 
  Pause, 
  Users, 
  ArrowRight, 
  Lock, 
  RotateCcw, 
  Radio, 
  FastForward, 
  Rewind,
  Sparkles,
  LogIn,
  Server,
  Shield,
  ShieldCheck,
  Subtitles,
  Download,
  Search,
  Tv,
  Link as LinkIcon,
  List,
  Compass,
  Check
} from 'lucide-react';
import { MovieItem } from '../types';
import { getMediaCatalog } from '../api';

interface CinemaRoomProps {
  onBack: () => void;
}

interface CinemaMovie {
  id?: number;
  imdbId?: string;
  title: string;
  posterUrl: string;
  streamUrl: string;
  quality: string;
  language: string;
  subtitles: string;
  type: string;
  season?: number;
  episode?: number;
  duration?: string;
  overview?: string;
}

export const CinemaRoom: React.FC<CinemaRoomProps> = ({ onBack }) => {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [currentMovie, setCurrentMovie] = useState<CinemaMovie | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchersCount, setWatchersCount] = useState(1);
  const [channelId, setChannelId] = useState('default');
  const [guildId, setGuildId] = useState('');
  const [userId, setUserId] = useState('');
  const [activeServer, setActiveServer] = useState<'server1' | 'server2' | 'server3' | 'server4' | 'server5' | 'server6'>('server1');
  const [adShieldEnabled, setAdShieldEnabled] = useState<boolean>(true);
  const [subtitlesList, setSubtitlesList] = useState<any[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState<boolean>(false);

  // Universal Live Search & Sidebar Tabs State
  const [sidebarTab, setSidebarTab] = useState<'search' | 'catalog' | 'direct'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CinemaMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSeriesForEpisodes, setSelectedSeriesForEpisodes] = useState<CinemaMovie | null>(null);
  const [customSeason, setCustomSeason] = useState<number>(1);
  const [customEpisode, setCustomEpisode] = useState<number>(1);
  const [directInputUrl, setDirectInputUrl] = useState('');
  const [directInputTitle, setDirectInputTitle] = useState('');

  // Voice Access Lock State
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [voiceChannelName, setVoiceChannelName] = useState<string>('');
  const [accessMessage, setAccessMessage] = useState<string>('');
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastUserInteraction = useRef<number>(0);
  const currentMovieRef = useRef<CinemaMovie | null>(null);

  useEffect(() => {
    currentMovieRef.current = currentMovie;
  }, [currentMovie]);

  // Intercept top-level popups created by ad networks
  useEffect(() => {
    const originalOpen = window.open;
    window.open = function (...args) {
      console.warn('[Royal Shield] Intercepted top-level popup ad attempt');
      return null;
    };
    return () => {
      window.open = originalOpen;
    };
  }, []);

  // Fetch verified Arabic subtitles from OpenSubtitles whenever the movie changes
  useEffect(() => {
    if (!currentMovie) return;
    const id = getImdbId(currentMovie);
    setIsLoadingSubs(true);
    fetch(`/api/cinema/subtitles?imdbId=${encodeURIComponent(id)}&type=${encodeURIComponent(currentMovie.type || 'movie')}&season=${encodeURIComponent(currentMovie.season || 1)}&episode=${encodeURIComponent(currentMovie.episode || 1)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.subtitles) {
          setSubtitlesList(d.subtitles);
        } else {
          setSubtitlesList([]);
        }
      })
      .catch(() => setSubtitlesList([]))
      .finally(() => setIsLoadingSubs(false));
  }, [currentMovie?.title, currentMovie?.streamUrl]);

  // Live Universal Catalog Search Debouncer
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/cinema/search?q=${encodeURIComponent(searchQuery.trim())}`)
        .then(r => r.json())
        .then(d => {
          setSearchResults(d.results || []);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isEmbedStream = (url?: string) => {
    if (!url) return false;
    const l = url.toLowerCase();
    if (l.endsWith('.mp4') || l.endsWith('.webm') || l.endsWith('.m3u8') || l.includes('.mp4?') || l.includes('.webm?')) {
      return false;
    }
    return true;
  };

  // Helper to resolve IMDb ID from movie
  const getImdbId = (movie: CinemaMovie | null): string => {
    if (!movie) return 'tt1375666';
    if (movie.imdbId) return movie.imdbId;
    const match = movie.streamUrl.match(/video_id=([a-zA-Z0-9]+)/) ||
                  movie.streamUrl.match(/imdb=([a-zA-Z0-9]+)/) ||
                  movie.streamUrl.match(/\/embed\/(?:movie\/)?([a-zA-Z0-9]+)/);
    return match ? match[1] : 'tt1375666';
  };

  // Helper to generate correct streaming URL per server with Arabic subtitle hints
  const buildServerStreamUrl = (movie: CinemaMovie, server: 'server1' | 'server2' | 'server3' | 'server4' | 'server5' | 'server6'): string => {
    const id = getImdbId(movie);
    const isSeries = movie.type === 'series' || !!movie.season;
    const s = movie.season || 1;
    const e = movie.episode || 1;

    // If direct uploaded or custom stream url is present and not a generic embed
    if (movie.streamUrl && !movie.streamUrl.includes('vidsrc') && !movie.streamUrl.includes('multiembed') && !movie.streamUrl.includes('autoembed') && !movie.streamUrl.includes('vidlink') && !movie.streamUrl.includes('2embed') && !movie.streamUrl.includes('smashystream')) {
      return movie.streamUrl;
    }

    switch (server) {
      case 'server1': // VidLink VIP (خالي من الإعلانات تماماً مع ترجمة عربية تلقائية)
        return isSeries
          ? `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=c5a059&secondaryColor=121217&autoplay=true`
          : `https://vidlink.pro/movie/${id}?primaryColor=c5a059&secondaryColor=121217&autoplay=true`;
      case 'server2': // AutoEmbed Pro (سيرفر نقي متعدد الجودات)
        return isSeries 
          ? `https://player.autoembed.co/embed/tv/${id}/${s}/${e}`
          : `https://player.autoembed.co/embed/movie/${id}`;
      case 'server3': // VidSrc CC (سيرفر فائق السرعة)
        return isSeries
          ? `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}?autoPlay=true`
          : `https://vidsrc.cc/v2/embed/movie/${id}?autoPlay=true`;
      case 'server4': // 2Embed Global (شبكة سيرفرات عالمية سريعة)
        return isSeries
          ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
          : `https://www.2embed.cc/embed/${id}`;
      case 'server5': // MultiEmbed (سيرفر متعدد اللغات والترجمة)
        return isSeries 
          ? `https://multiembed.mov/?video_id=${id}&s=${s}&e=${e}&sub_lang=Arabic`
          : `https://multiembed.mov/?video_id=${id}&sub_lang=Arabic`;
      case 'server6': // SmashyStream (بديل احتياطي فوري)
        return isSeries
          ? `https://embed.smashystream.com/playere.php?imdb=${id}&season=${s}&episode=${e}`
          : `https://embed.smashystream.com/playere.php?imdb=${id}`;
      default:
        return movie.streamUrl;
    }
  };

  // 1. Check Voice Channel Access (Required by server rules)
  const verifyVoiceAccess = useCallback(async (cId: string, gId: string, uId: string) => {
    setIsCheckingAccess(true);
    try {
      const res = await fetch(`/api/cinema/check-access?channelId=${encodeURIComponent(cId)}&guildId=${encodeURIComponent(gId)}&user=${encodeURIComponent(uId)}`);
      const data = await res.json();

      if (data.allowed) {
        setAccessAllowed(true);
        setVoiceChannelName(data.voiceChannelName || 'روم صوتي نشط');
        setAccessMessage(data.message || 'تم التحقق بنجاح');
      } else {
        setAccessAllowed(false);
        setAccessMessage(data.message || 'يجب التواجد في إحدى القنوات الصوتية بالسيرفر للمشاهدة.');
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }
    } catch {
      // keep state on temporary error
    } finally {
      setIsCheckingAccess(false);
    }
  }, []);

  // 2. Initialize params, session, and Real-Time Sync on Mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramChannel = urlParams.get('channel') || 'default-channel';
    const paramGuild = urlParams.get('guild') || '';
    const paramUser = urlParams.get('user') || '';

    setChannelId(paramChannel);
    setGuildId(paramGuild);
    setUserId(paramUser);

    // 2.1 Fetch active session immediately via standard HTTP GET
    fetch(`/api/cinema/session/${encodeURIComponent(paramChannel)}`)
      .then(res => res.json())
      .then(data => {
        if (data?.session?.movie) {
          setCurrentMovie(data.session.movie);
          if (typeof data.session.currentTime === 'number' && videoRef.current) {
            videoRef.current.currentTime = data.session.currentTime;
          }
          if (data.session.isPlaying) {
            setIsPlaying(true);
          }
        }
      })
      .catch(err => console.error('[Cinema Session Fetch Error]:', err));

    // 2.2 Fetch catalog items for sidebar
    getMediaCatalog().then(items => {
      setMovies(items);
      // Fallback if session has no movie yet
      setCurrentMovie(prev => {
        if (prev) return prev;
        if (items.length > 0) {
          const first = items[0];
          const imdbMatch = first.streamUrl.match(/video_id=([a-zA-Z0-9]+)/) ||
                            first.streamUrl.match(/imdb=([a-zA-Z0-9]+)/);
          return {
            id: first.id,
            imdbId: imdbMatch ? imdbMatch[1] : undefined,
            title: first.title,
            type: first.type,
            quality: first.quality,
            language: first.language,
            subtitles: first.subtitles,
            season: first.season || undefined,
            episode: first.episode || undefined,
            duration: first.duration || undefined,
            posterUrl: first.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
            streamUrl: first.streamUrl,
          };
        }
        return null;
      });
    });

    // 2.3 Check voice channel access immediately
    verifyVoiceAccess(paramChannel, paramGuild, paramUser);

    // Periodic voice channel check every 10s
    const accessTimer = setInterval(() => {
      verifyVoiceAccess(paramChannel, paramGuild, paramUser);
    }, 10000);

    // 2.4 Safe Session Poller: Syncs viewers count and movie changes without interrupting playback
    const syncPollingTimer = setInterval(() => {
      fetch(`/api/cinema/session/${encodeURIComponent(paramChannel)}`)
        .then(r => r.json())
        .then(data => {
          if (!data?.session) return;
          const s = data.session;

          if (s.movie) {
            const cur = currentMovieRef.current;
            if (!cur || cur.title !== s.movie.title || cur.streamUrl !== s.movie.streamUrl) {
              currentMovieRef.current = s.movie;
              setCurrentMovie(s.movie);
              setActiveServer('server1');
            }
          }

          if (typeof s.viewersCount === 'number') {
            setWatchersCount(Math.max(1, s.viewersCount));
          }
        })
        .catch(() => {});
    }, 3000);

    // 2.5 Establish Server-Sent Events (SSE) Live Stream for Movie Changes and Room Updates
    const sseUrl = `/api/cinema/session/${encodeURIComponent(paramChannel)}/stream?guildId=${encodeURIComponent(paramGuild)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'INIT':
          case 'MOVIE_CHANGE':
            if (data.movie) {
              const cur = currentMovieRef.current;
              if (!cur || cur.title !== data.movie.title || cur.streamUrl !== data.movie.streamUrl) {
                currentMovieRef.current = data.movie;
                setCurrentMovie(data.movie);
                setActiveServer('server1');
              }
            }
            if (typeof data.viewersCount === 'number') {
              setWatchersCount(data.viewersCount);
            }
            break;

          case 'VIEWERS_UPDATE':
            if (typeof data.viewersCount === 'number') {
              setWatchersCount(data.viewersCount);
            }
            break;
        }
      } catch (err) {
        console.error('[Cinema SSE Error]:', err);
      }
    };

    return () => {
      clearInterval(accessTimer);
      clearInterval(syncPollingTimer);
      eventSource.close();
    };
  }, [verifyVoiceAccess]);

  // Send action to server so all clients in the voice room stay updated
  const sendRoomAction = async (action: string, time?: number, movie?: any) => {
    lastUserInteraction.current = Date.now();
    try {
      await fetch(`/api/cinema/session/${encodeURIComponent(channelId)}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, time, movie }),
      });
    } catch (err) {
      console.error('[Action Send Error]:', err);
    }
  };

  const handleTogglePlay = () => {
    if (accessAllowed === false) return;
    lastUserInteraction.current = Date.now();

    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      sendRoomAction('pause', videoRef.current.currentTime);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        sendRoomAction('play', videoRef.current?.currentTime || 0);
      }).catch(err => {
        console.warn('[Play Warning]:', err);
        videoRef.current?.play();
      });
    }
  };

  const handleSeekRelative = (delta: number) => {
    if (!videoRef.current || accessAllowed === false) return;
    lastUserInteraction.current = Date.now();
    const newTime = Math.max(0, videoRef.current.currentTime + delta);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    sendRoomAction('seek', newTime);
  };

  const handleTimelineSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (accessAllowed === false || !videoRef.current) return;
    lastUserInteraction.current = Date.now();
    const target = parseFloat(e.target.value);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    sendRoomAction('seek', target);
  };

  const handleSelectMovie = (movieItem: MovieItem | CinemaMovie) => {
    lastUserInteraction.current = Date.now();
    const imdbMatch = movieItem.streamUrl.match(/video_id=([a-zA-Z0-9]+)/) ||
                      movieItem.streamUrl.match(/imdb=([a-zA-Z0-9]+)/);

    const cinemaMovie: CinemaMovie = {
      id: movieItem.id,
      imdbId: ('imdbId' in movieItem && movieItem.imdbId) ? movieItem.imdbId : (imdbMatch ? imdbMatch[1] : undefined),
      title: movieItem.title,
      type: movieItem.type,
      quality: movieItem.quality || '1080p Full HD',
      language: movieItem.language || 'عربي / Multi-Audio',
      subtitles: movieItem.subtitles || 'Arabic, English',
      season: movieItem.season || undefined,
      episode: movieItem.episode || undefined,
      duration: movieItem.duration || undefined,
      posterUrl: movieItem.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
      streamUrl: movieItem.streamUrl,
      overview: movieItem.overview || undefined,
    };
    setCurrentMovie(cinemaMovie);
    setIsPlaying(false);
    setActiveServer('server1');
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    sendRoomAction('setMovie', 0, cinemaMovie);
  };

  // Switch between servers (VidLink VIP, AutoEmbed Pro, VidSrc CC VIP, 2Embed Global, MultiEmbed, Smashy)
  const handleSwitchServer = (serverType: 'server1' | 'server2' | 'server3' | 'server4' | 'server5' | 'server6') => {
    if (!currentMovie) return;
    setActiveServer(serverType);

    const newUrl = buildServerStreamUrl(currentMovie, serverType);
    const updated = { ...currentMovie, streamUrl: newUrl };
    setCurrentMovie(updated);
    sendRoomAction('setMovie', 0, updated);
  };

  const handlePlaySeriesEpisode = (movie: CinemaMovie, s: number, e: number) => {
    const id = getImdbId(movie);
    const cleanTitle = movie.title.replace(/\s*\(الموسم.*?\)/g, '').replace(/\s*\(Season.*?\)/gi, '');
    const updated: CinemaMovie = {
      ...movie,
      type: 'series',
      season: s,
      episode: e,
      title: `${cleanTitle} (الموسم ${s} - الحلقة ${e})`,
      streamUrl: `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=c5a059&autoplay=true`
    };
    handleSelectMovie(updated);
  };

  const handlePlayDirectUrl = () => {
    if (!directInputUrl || !directInputUrl.startsWith('http')) return;
    let finalUrl = directInputUrl.trim();
    let title = directInputTitle.trim() || 'بث مباشر خارجي';

    if (finalUrl.includes('youtube.com/watch?v=')) {
      const vid = finalUrl.split('v=')[1]?.split('&')[0];
      if (vid) finalUrl = `https://www.youtube.com/embed/${vid}?autoplay=1`;
    } else if (finalUrl.includes('youtu.be/')) {
      const vid = finalUrl.split('youtu.be/')[1]?.split('?')[0];
      if (vid) finalUrl = `https://www.youtube.com/embed/${vid}?autoplay=1`;
    }

    const directMovie: CinemaMovie = {
      title,
      type: 'movie',
      quality: '1080p Full HD',
      language: 'Direct Stream',
      subtitles: 'Arabic / Embedded',
      posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
      streamUrl: finalUrl,
      overview: `بث سينمائي مباشر من رابط خارجي (${title})`,
    };
    handleSelectMovie(directMovie);
    setDirectInputUrl('');
    setDirectInputTitle('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isEmbed = isEmbedStream(currentMovie?.streamUrl);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px', direction: 'rtl' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={onBack} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowRight size={18} />
          <span>العودة للوحة التحكم</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Voice Room Status Badge */}
          {accessAllowed ? (
            <div className="badge-green" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px' }}>
              <Radio size={14} className="pulse-green" />
              <span>متصل بالروم: <strong>{voiceChannelName}</strong></span>
            </div>
          ) : (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#F87171',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Lock size={14} />
              <span>يلزم التواجد في روم صوتي</span>
            </div>
          )}

          {/* Sync Status Badge */}
          <div className="badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px' }}>
            <Sparkles size={14} />
            <span>⚡ صالة سينما رويال المتزامنة</span>
          </div>

          {/* Viewers Count Badge */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-gold)',
            color: 'var(--gold-light)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
          }}>
            <Users size={14} />
            <span>{watchersCount} مشاهدين في الروم</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left: Main Cinema Screen & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Server Switcher Bar */}
          {/* Server Switcher Bar & Ad Shield */}
          {isEmbed && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-gold)',
              borderRadius: '12px',
              padding: '10px 16px',
              flexWrap: 'wrap',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <Server size={16} color="var(--gold-primary)" />
                <span>تبديل السيرفر:</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button 
                  onClick={() => handleSwitchServer('server1')}
                  className={activeServer === 'server1' ? 'btn-gold' : 'btn-secondary'}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  ⚡ سيرفر 1 (VidLink VIP - بدون إعلانات)
                </button>
                <button 
                  onClick={() => handleSwitchServer('server2')}
                  className={activeServer === 'server2' ? 'btn-gold' : 'btn-secondary'}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  🍿 سيرفر 2 (AutoEmbed Pro)
                </button>
                <button 
                  onClick={() => handleSwitchServer('server3')}
                  className={activeServer === 'server3' ? 'btn-gold' : 'btn-secondary'}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  🎬 سيرفر 3 (VidSrc CC VIP)
                </button>
                <button 
                  onClick={() => handleSwitchServer('server4')}
                  className={activeServer === 'server4' ? 'btn-gold' : 'btn-secondary'}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  🌐 سيرفر 4 (2Embed Global)
                </button>
                <button 
                  onClick={() => handleSwitchServer('server5')}
                  className={activeServer === 'server5' ? 'btn-gold' : 'btn-secondary'}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  📺 سيرفر 5 (MultiEmbed)
                </button>
                <button 
                  onClick={() => handleSwitchServer('server6')}
                  className={activeServer === 'server6' ? 'btn-gold' : 'btn-secondary'}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  ⚡ سيرفر 6 (Smashy)
                </button>

                <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 4px' }} />

                <div
                  onClick={() => setAdShieldEnabled(!adShieldEnabled)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    background: adShieldEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: adShieldEnabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                    color: adShieldEnabled ? '#34D399' : '#F87171',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  title="انقر لتشغيل أو إيقاف درع حظر الإعلانات والنوافذ المنبثقة"
                >
                  <ShieldCheck size={15} />
                  <span>{adShieldEnabled ? '🛡️ درع منع الإعلانات نشط' : '⚠️ درع الإعلانات معطل'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Main Video Screen Container */}
          <div className="glass-panel" style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            aspectRatio: '16/9',
            background: '#000',
            border: '2px solid var(--border-gold)',
            boxShadow: '0 0 60px rgba(212, 175, 55, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* 1. Voice Access Denied Lock Screen */}
            {accessAllowed === false && (
              <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                background: 'rgba(8, 8, 10, 0.96)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                textAlign: 'center',
                gap: '16px',
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '2px solid var(--gold-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
                }}>
                  <Lock size={40} color="var(--gold-primary)" />
                </div>

                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gold-primary)', margin: 0 }}>
                  المشاهدة محصورة لأعضاء الرومات الصوتية فقط
                </h2>

                <p style={{ maxWidth: '580px', color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                  {accessMessage || 'لا يمكن لأي شخص متابعة الفلم أو المسلسل إلا إذا كان متواجداً في إحدى القنوات الصوتية داخل السيرفر!'}
                </p>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button 
                    onClick={() => verifyVoiceAccess(channelId, guildId, userId)}
                    disabled={isCheckingAccess}
                    className="btn-gold" 
                    style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <RotateCcw size={18} className={isCheckingAccess ? 'spin-icon' : ''} />
                    <span>{isCheckingAccess ? 'جاري التحقق...' : 'التحقق من وجودي في الروم الآن'}</span>
                  </button>

                  <a 
                    href={`/api/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                    className="btn-secondary"
                    style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <LogIn size={18} />
                    <span>تسجيل الدخول بديسكورد</span>
                  </a>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  💡 بمجرد دخولك أي روم صوتي في ديسكورد والضغط على "التحقق"، ستفتح شاشة السينما فوراً!
                </div>
              </div>
            )}

            {/* 2. Video Player Element (IFrame for Embeds / HTML5 Video for Direct Links) */}
            {currentMovie ? (
              isEmbed ? (
                <iframe
                  key={`${currentMovie.streamUrl}-${activeServer}`}
                  src={buildServerStreamUrl(currentMovie, activeServer)}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: '#000',
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  sandbox={adShieldEnabled ? "allow-scripts allow-same-origin allow-forms allow-presentation" : undefined}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={currentMovie.streamUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  controls
                  playsInline
                  preload="auto"
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                      setDuration(videoRef.current.duration || 0);
                    }
                  }}
                  onPlay={() => {
                    setIsPlaying(true);
                    lastUserInteraction.current = Date.now();
                  }}
                  onPause={() => {
                    setIsPlaying(false);
                    lastUserInteraction.current = Date.now();
                  }}
                />
              )
            ) : (
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Film size={24} color="var(--gold-primary)" />
                <span>جاري تحميل جلسة السينما المتزامنة...</span>
              </div>
            )}
          </div>

          {/* Arabic Subtitles & Player Guide Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(18, 18, 23, 0.95) 100%)',
            border: '1px solid var(--border-gold)',
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(212, 175, 55, 0.15)',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Subtitles size={20} color="var(--gold-primary)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: 'var(--gold-light)', fontSize: '0.95rem' }}>
                    🌐 الترجمة العربية (Arabic Subtitles):
                  </strong>
                  {isLoadingSubs ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>جاري فحص ملفات الترجمة...</span>
                  ) : subtitlesList.length > 0 ? (
                    <span className="badge-green" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                      متوفرة ومجهزة ({subtitlesList.length} ملفات معتمدة)
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)' }}>
                      متاحة داخل المشغل عبر قائمة [CC]
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  💡 <strong>طريقة تشغيل الترجمة:</strong> اضغط على أيقونة <strong>[CC]</strong> أو الترس ⚙️ في أسفل شاشة الفيديو واختر <strong>Arabic / العربية</strong>.
                </div>
              </div>
            </div>

            {subtitlesList.length > 0 && (
              <a
                href={subtitlesList[0].url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  color: 'var(--gold-primary)',
                  borderColor: 'var(--border-gold)',
                }}
              >
                <Download size={14} />
                <span>تحميل ملف الترجمة المباشر ({subtitlesList[0].format.toUpperCase()})</span>
              </a>
            )}
          </div>

          {/* Details Bar and Controls */}
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Direct Video Scrubbing Bar (Only for direct video streams) */}
            {!isEmbed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', minWidth: '45px', textAlign: 'center' }}>
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleTimelineSeek}
                  disabled={accessAllowed === false}
                  style={{
                    flex: 1,
                    accentColor: 'var(--gold-primary)',
                    cursor: accessAllowed === false ? 'not-allowed' : 'pointer',
                  }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', minWidth: '45px', textAlign: 'center' }}>
                  {formatTime(duration)}
                </span>
              </div>
            )}

            {/* Title & Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#FFF' }}>
                  {currentMovie?.title || 'صالة سينما رويال'}
                </h2>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                  <span>الجودة: <strong style={{ color: 'var(--gold-primary)' }}>{currentMovie?.quality || '1080p Full HD'}</strong></span>
                  <span>•</span>
                  <span>الصوت: <strong>{currentMovie?.language || 'عربي / مترجم'}</strong></span>
                  <span>•</span>
                  <span>النوع: <strong>{currentMovie?.type === 'series' ? 'مسلسل' : 'فيلم'}</strong></span>
                  {currentMovie?.duration && (
                    <>
                      <span>•</span>
                      <span>المدة: <strong>{currentMovie.duration}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {!isEmbed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    onClick={() => handleSeekRelative(-10)} 
                    disabled={accessAllowed === false}
                    className="btn-secondary" 
                    title="ترجيع 10 ثواني"
                    style={{ padding: '10px 16px' }}
                  >
                    <Rewind size={18} />
                    <span>10s-</span>
                  </button>

                  <button 
                    onClick={handleTogglePlay} 
                    disabled={accessAllowed === false}
                    className="btn-gold" 
                    style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}</span>
                  </button>

                  <button 
                    onClick={() => handleSeekRelative(10)} 
                    disabled={accessAllowed === false}
                    className="btn-secondary" 
                    title="تقديم 10 ثواني"
                    style={{ padding: '10px 16px' }}
                  >
                    <span>+10s</span>
                    <FastForward size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cinema Playlist & Live Universal Navigator Sidebar */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: 'fit-content' }}>
          {/* Tabs header: Search | Catalog | Direct Link */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '6px',
            background: 'var(--bg-surface-elevated)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setSidebarTab('search')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 4px',
                fontSize: '0.8rem',
                borderRadius: '7px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: sidebarTab === 'search' ? 'var(--gold-primary)' : 'transparent',
                color: sidebarTab === 'search' ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              <Search size={14} />
              <span>بحث شامل</span>
            </button>
            <button
              onClick={() => setSidebarTab('catalog')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 4px',
                fontSize: '0.8rem',
                borderRadius: '7px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: sidebarTab === 'catalog' ? 'var(--gold-primary)' : 'transparent',
                color: sidebarTab === 'catalog' ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              <Film size={14} />
              <span>الكتالوج</span>
            </button>
            <button
              onClick={() => setSidebarTab('direct')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 4px',
                fontSize: '0.8rem',
                borderRadius: '7px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: sidebarTab === 'direct' ? 'var(--gold-primary)' : 'transparent',
                color: sidebarTab === 'direct' ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              <LinkIcon size={14} />
              <span>رابط خارجي</span>
            </button>
          </div>

          {/* TAB 1: UNIVERSAL LIVE SEARCH */}
          {sidebarTab === 'search' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="ابحث عن أي فيلم، مسلسل، أو أنمي..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-gold)',
                    color: '#FFF',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Search size={16} color="var(--gold-primary)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>

              {/* Quick Suggestion Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['ون بيس', 'هجوم العمالقة', 'بريكنج باد', 'المؤسس عثمان', 'ولاد رزق', 'صراع العروش'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    style={{
                      background: 'rgba(212, 175, 55, 0.08)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--gold-light)',
                      borderRadius: '14px',
                      padding: '3px 10px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Series Episode Selector Modal/Box if a series is selected */}
              {selectedSeriesForEpisodes && (
                <div style={{
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
                      📺 اختيار حلقة: {selectedSeriesForEpisodes.title}
                    </span>
                    <button
                      onClick={() => setSelectedSeriesForEpisodes(null)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      إلغاء ✕
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>الموسم</label>
                      <input
                        type="number"
                        min={1}
                        value={customSeason}
                        onChange={e => setCustomSeason(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '6px',
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          color: '#FFF',
                          textAlign: 'center',
                          fontSize: '0.85rem',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>الحلقة</label>
                      <input
                        type="number"
                        min={1}
                        value={customEpisode}
                        onChange={e => setCustomEpisode(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '6px',
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          color: '#FFF',
                          textAlign: 'center',
                          fontSize: '0.85rem',
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handlePlaySeriesEpisode(selectedSeriesForEpisodes, customSeason, customEpisode);
                      setSelectedSeriesForEpisodes(null);
                    }}
                    className="btn-gold"
                    style={{ padding: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Play size={14} />
                    <span>تشغيل الموسم {customSeason} الحلقة {customEpisode} بالصالة</span>
                  </button>
                </div>
              )}

              {/* Live Search Results List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {isSearching ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    جاري البحث في قاعدة البيانات العالمية بدون إعلانات...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item, idx) => {
                    const isSeries = item.type === 'series';
                    return (
                      <div
                        key={`${item.imdbId || item.id || idx}`}
                        onClick={() => {
                          if (isSeries) {
                            setSelectedSeriesForEpisodes(item);
                            setCustomSeason(item.season || 1);
                            setCustomEpisode(item.episode || 1);
                          } else {
                            handleSelectMovie(item);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        className="hover-gold-border"
                      >
                        {item.posterUrl && (
                          <img
                            src={item.posterUrl}
                            alt=""
                            style={{ width: '42px', height: '60px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: '0.85rem', color: '#FFF', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title}
                          </strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span className="badge-gold" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
                              {isSeries ? 'مسلسل / أنمي' : 'فيلم'}
                            </span>
                            {item.duration && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {item.duration}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ color: 'var(--gold-primary)', flexShrink: 0 }}>
                          {isSeries ? <Tv size={16} /> : <Play size={16} />}
                        </div>
                      </div>
                    );
                  })
                ) : searchQuery.trim().length > 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    لم يتم العثور على نتائج مباشرة. جرب البحث بالإنجليزية أو استخدم تبويب "رابط خارجي".
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    🔍 اكتب اسم أي فيلم، مسلسل عالمي، أو أنمي بالعربي أو الإنجليزي لتشغيله مباشرة بدقة 1080p وترجمة عربية بدون أي إعلانات!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FEATURED CATALOG */}
          {sidebarTab === 'catalog' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
              {movies.map(item => {
                const isCurrent = currentMovie?.title === item.title;
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleSelectMovie(item)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: isCurrent ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-surface-elevated)',
                      border: isCurrent ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                      cursor: accessAllowed === false ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem', color: isCurrent ? '#FFF' : 'var(--text-primary)' }}>
                        {item.title}
                      </strong>
                      <span className="badge-gold" style={{ fontSize: '0.65rem' }}>{item.quality}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.type === 'series' ? `الموسم ${item.season} الحلقة ${item.episode}` : item.duration}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: DIRECT STREAM / EMBED URL */}
          {sidebarTab === 'direct' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                🔗 يمكنك وضع أي رابط مباشر من مواقع الأفلام العربية أو العالمية (أكوام، فاصل إعلاني، عرب سيد، وي سيما، يوتيوب، أو رابط فيديو MP4/M3U8):
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  عنوان العرض (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: ون بيس الحلقة 1071"
                  value={directInputTitle}
                  onChange={e => setDirectInputTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: '#FFF',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  رابط البث أو الفيديو (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://... (mp4, m3u8, embed, youtube)"
                  value={directInputUrl}
                  onChange={e => setDirectInputUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-gold)',
                    color: '#FFF',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button
                onClick={handlePlayDirectUrl}
                disabled={!directInputUrl.trim().startsWith('http')}
                className="btn-gold"
                style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}
              >
                <Play size={16} />
                <span>تشغيل الرابط المباشر في السينما</span>
              </button>
            </div>
          )}

          <div style={{
            background: 'rgba(212, 175, 55, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}>
            🛡️ <strong>درع الحماية نشط:</strong> النوافذ المنبثقة والإعلانات محظورة كلياً على جميع المشاهدين في الروم لضمان تجربة مشاهدة سينمائية ملكية متزامنة 100%.
          </div>
        </div>
      </div>
    </div>
  );
};
