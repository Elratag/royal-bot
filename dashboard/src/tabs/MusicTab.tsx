import React, { useState, useEffect } from 'react';
import { BotSetting } from '../types';
import { getBotSettings, saveBotSettings } from '../api';
import { Music, Volume2, Check, Radio, Play, SkipForward } from 'lucide-react';

interface MusicTabProps {
  guildId: string;
}

export const MusicTab: React.FC<MusicTabProps> = ({ guildId }) => {
  const [settings, setSettings] = useState<BotSetting | null>(null);
  const [volume, setVolume] = useState(80);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBotSettings(guildId).then(data => {
      setSettings(data);
      setVolume(data.musicVolume || 80);
    });
  }, [guildId]);

  const handleSaveVolume = async () => {
    if (!settings) return;
    setSaving(true);
    await saveBotSettings(guildId, { ...settings, musicVolume: volume });
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          نظام الموسيقى والصوتيات (Music System)
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          إدارة تشغيل الصوتيات عالية النقاء في الرومات الصوتية والتحكم في مستوى الصوت الافتراضي.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Volume Settings */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={20} color="#D4AF37" />
            <span>مستوى الصوت الافتراضي (Default Volume)</span>
          </h3>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>درجة الصوت</span>
              <strong style={{ color: 'var(--gold-primary)', fontSize: '1.1rem' }}>{volume}%</strong>
            </div>
            <input 
              type="range"
              min="1"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
            />
          </div>

          <button onClick={handleSaveVolume} disabled={saving} className="btn-gold" style={{ width: 'fit-content' }}>
            <Check size={18} />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ مستوى الصوت'}</span>
          </button>
        </div>

        {/* Audio Engine Status */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={20} color="#10B981" />
            <span>حالة محرك الصوت (Voice Audio Engine)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>ترميز الصوت (Audio Codec):</span>
              <span style={{ fontWeight: 600, color: 'var(--gold-light)' }}>Opus 48kHz Stereo</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>بروتوكول البث:</span>
              <span style={{ fontWeight: 600, color: '#10B981' }}>UDP / RTP WebRTC Voice Gateway</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>استقرار الاتصال:</span>
              <span style={{ fontWeight: 600, color: '#3B82F6' }}>24/7 Persistent Socket</span>
            </div>
          </div>
        </div>
      </div>

      {/* Music Commands Reference */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>أوامر الموسيقى داخل الديسكورد (Slash Commands)</h3>
        <div className="grid-cards">
          {[
            { cmd: '/play <query>', desc: 'البحث وتشغيل الأغنية أو الرابط في الروم الصوتي' },
            { cmd: '/pause', desc: 'إيقاف التشغيل مؤقتًا' },
            { cmd: '/resume', desc: 'استئناف التشغيل المتوقف' },
            { cmd: '/skip', desc: 'تخطي الأغنية الحالية والانتقال للتالية في الـ Queue' },
            { cmd: '/stop', desc: 'إيقاف التشغيل بالكامل ومغادرة الروم الصوتي' },
            { cmd: '/queue', desc: 'عرض قائمة الأغاني القادمة' },
            { cmd: '/volume <1-100>', desc: 'تغيير درجة الصوت لحظيًا' },
            { cmd: '/loop <mode>', desc: 'تكرار الأغنية الحالية أو الـ Queue بالكامل' },
            { cmd: '/nowplaying', desc: 'عرض تفاصيل الأغنية الجاري تشغيلها حاليًا' },
          ].map((item, idx) => (
            <div key={idx} style={{ padding: '14px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <code style={{ color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.95rem' }}>{item.cmd}</code>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
