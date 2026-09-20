import React, { useState, useEffect } from 'react';
import { MovieItem } from '../types';
import { getMediaCatalog, addMediaItem, deleteMediaItem } from '../api';
import { Tv, Play, Plus, Trash2, Layers } from 'lucide-react';

interface SeriesTabProps {
  guildId: string;
}

export const SeriesTab: React.FC<SeriesTabProps> = ({ guildId }) => {
  const [series, setSeries] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [quality, setQuality] = useState('1080p Full HD');
  const [language, setLanguage] = useState('Arabic');
  const [subtitles, setSubtitles] = useState('Arabic, English');
  const [streamUrl, setStreamUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    const data = await getMediaCatalog('series');
    setSeries(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!title || !streamUrl) return;
    await addMediaItem({
      title,
      type: 'series',
      season,
      episode,
      quality,
      language,
      subtitles,
      streamUrl,
      posterUrl: posterUrl || null,
      isLegalPublicDomain: true,
    });
    setTitle('');
    setStreamUrl('');
    loadSeries();
  };

  const handleDelete = async (id: number) => {
    await deleteMediaItem(id);
    loadSeries();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          مسلسلات وحلقات السينما (Series & Episodes)
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          تنظيم المسلسلات حسب المواسم والحلقات وتشغيلها متزامنة في الرومات الصوتية.
        </p>
      </div>

      {/* Add Episode Form */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} color="#D4AF37" />
          <span>إضافة حلقة مسلسل جديدة</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>اسم المسلسل</label>
            <input 
              type="text"
              className="form-input"
              placeholder="مثال: Royal Cosmos"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>الموسم (Season)</label>
            <input 
              type="number"
              min="1"
              className="form-input"
              value={season}
              onChange={(e) => setSeason(parseInt(e.target.value, 10))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>الحلقة (Episode)</label>
            <input 
              type="number"
              min="1"
              className="form-input"
              value={episode}
              onChange={(e) => setEpisode(parseInt(e.target.value, 10))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>رابط فيديو الحلقة (Direct Stream)</label>
            <input 
              type="url"
              className="form-input"
              placeholder="https://.../episode.mp4"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button onClick={handleAdd} disabled={!title || !streamUrl} className="btn-gold">
            <Plus size={18} />
            <span>حفظ الحلقة في المكتبة</span>
          </button>
        </div>
      </div>

      {/* Series List */}
      <div className="grid-cards">
        {series.map(item => (
          <div key={item.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.title}</h4>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <span className="badge-gold">الموسم {item.season || 1}</span>
                  <span className="badge-green">الحلقة {item.episode || 1}</span>
                </div>
              </div>
              <span className="badge-gold">{item.quality}</span>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              اللغة: {item.language} | الترجمة: {item.subtitles}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <a 
                href={`/cinema?guild=${guildId}&id=${item.id}`}
                target="_blank"
                rel="noreferrer"
                className="btn-gold"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', textDecoration: 'none' }}
              >
                <Play size={16} />
                <span>مشاهدة الحلقة</span>
              </a>

              <button onClick={() => handleDelete(item.id)} className="btn-danger" style={{ padding: '8px 10px' }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
