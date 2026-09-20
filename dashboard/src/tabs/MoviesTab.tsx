import React, { useState, useEffect } from 'react';
import { MovieItem } from '../types';
import { getMediaCatalog, addMediaItem, deleteMediaItem } from '../api';
import { Film, Play, Plus, Trash2, ExternalLink, ShieldCheck, Eye } from 'lucide-react';

interface MoviesTabProps {
  guildId: string;
}

export const MoviesTab: React.FC<MoviesTabProps> = ({ guildId }) => {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [title, setTitle] = useState('');
  const [quality, setQuality] = useState('1080p Full HD');
  const [language, setLanguage] = useState('Arabic / Multi-audio');
  const [subtitles, setSubtitles] = useState('Arabic, English');
  const [streamUrl, setStreamUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    const data = await getMediaCatalog('movie');
    setMovies(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!title || !streamUrl) return;
    await addMediaItem({
      title,
      type: 'movie',
      quality,
      language,
      subtitles,
      streamUrl,
      posterUrl: posterUrl || null,
      isLegalPublicDomain: true,
    });
    setTitle('');
    setStreamUrl('');
    setPosterUrl('');
    loadMovies();
  };

  const handleDelete = async (id: number) => {
    await deleteMediaItem(id);
    loadMovies();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            سينما الأفلام المتزامنة (Movies Watch Party)
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            مشاهدة سينمائية متزامنة لجميع الأعضاء داخل الروم الصوتي عبر تقنية <strong>Discord Embedded Activity</strong>.
          </p>
        </div>

        <a 
          href={`/cinema?guild=${guildId}`}
          target="_blank"
          rel="noreferrer"
          className="btn-gold"
          style={{ textDecoration: 'none' }}
        >
          <Play size={18} />
          <span>فتح شاشة السينما (Watch Room)</span>
        </a>
      </div>

      {/* Architecture note */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: 'var(--radius-sm)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        color: '#6EE7B7',
        fontSize: '0.9rem'
      }}>
        <ShieldCheck size={26} color="#10B981" />
        <div>
          <strong>النظام المعتمد رسميًا من Discord:</strong> يتم بث ومشاهدة الفيديو بجودة فائقة وصوت متزامن 100% عبر مشغل الـ Watch Party المدمج، وهو متوافق مع الكمبيوتر والجوال وآمن 100% ضد حظر الحسابات والسيرفرات.
        </div>
      </div>

      {/* Add Movie Form */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} color="#D4AF37" />
          <span>إضافة فيلم جديد للمكتبة</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>اسم الفيلم</label>
            <input 
              type="text"
              className="form-input"
              placeholder="مثال: Tears of Steel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>رابط البث المباشر (Direct Stream/MP4/HLS)</label>
            <input 
              type="url"
              className="form-input"
              placeholder="https://.../video.mp4"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>الجودة (Quality)</label>
            <select className="form-select" value={quality} onChange={(e) => setQuality(e.target.value)}>
              <option value="4K Ultra HD">4K Ultra HD</option>
              <option value="1080p Full HD">1080p Full HD</option>
              <option value="720p HD">720p HD</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>لغة الصوت (Audio)</label>
            <input 
              type="text"
              className="form-input"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>الترجمة المتوفرة (Subtitles)</label>
            <input 
              type="text"
              className="form-input"
              value={subtitles}
              onChange={(e) => setSubtitles(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>رابط صورة البوستر (Poster Image)</label>
            <input 
              type="url"
              className="form-input"
              placeholder="https://.../poster.jpg"
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button onClick={handleAdd} disabled={!title || !streamUrl} className="btn-gold">
            <Plus size={18} />
            <span>إضافة الفيلم للمكتبة</span>
          </button>
        </div>
      </div>

      {/* Movies Grid */}
      <div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>مكتبة الأفلام المتاحة ({movies.length})</h3>
        <div className="grid-cards">
          {movies.map(movie => (
            <div 
              key={movie.id}
              className="glass-panel"
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{
                height: '180px',
                backgroundImage: `url(${movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(17,18,23,0.95), transparent)'
                }}></div>
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                  <span className="badge-gold">{movie.quality}</span>
                </div>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{movie.title}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>الصوت: {movie.language}</div>
                  <div>الترجمة: {movie.subtitles}</div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px' }}>
                  <a 
                    href={`/cinema?guild=${guildId}&id=${movie.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-gold"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', textDecoration: 'none' }}
                  >
                    <Play size={16} />
                    <span>مشاهدة فورية</span>
                  </a>

                  <button onClick={() => handleDelete(movie.id)} className="btn-danger" style={{ padding: '8px 10px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
