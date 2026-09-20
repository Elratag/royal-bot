import React, { useState, useEffect } from 'react';
import { GuildChannel, WelcomeConfig } from '../types';
import { getWelcomeConfig, saveWelcomeConfig } from '../api';
import { Check, Sparkles, AlertCircle } from 'lucide-react';

interface WelcomeTabProps {
  guildId: string;
  channels: GuildChannel[];
}

export const WelcomeTab: React.FC<WelcomeTabProps> = ({ guildId, channels }) => {
  const [config, setConfig] = useState<WelcomeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const textChannels = channels.filter(c => c.isText);

  useEffect(() => {
    getWelcomeConfig(guildId).then(data => {
      setConfig(data);
      setLoading(false);
    });
  }, [guildId]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    await saveWelcomeConfig(guildId, config);
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (loading || !config) {
    return <div style={{ color: 'var(--gold-primary)' }}>جاري تحميل إعدادات الترحيب...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            نظام الترحيب (Welcome System)
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            إرسال رسائل ترحيبية أنيقة للأعضاء الجدد تلقائيًا فور انضمامهم.
          </p>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-gold"
        >
          <Check size={18} />
          <span>{saving ? 'جاري الحفظ...' : savedSuccess ? 'تم الحفظ بنجاح!' : 'حفظ التعديلات'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Settings Form */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>تفعيل نظام الترحيب</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>تشغيل أو تعطيل إرسال رسائل الترحيب</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
              قناة الترحيب (Welcome Channel)
            </label>
            <select 
              className="form-select"
              value={config.channelId || ''}
              onChange={(e) => setConfig({ ...config, channelId: e.target.value })}
            >
              <option value="">-- اختر قناة الترحيب --</option>
              {textChannels.map(c => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
              تنسيق الرسالة (Embed Message)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <input 
                type="checkbox"
                id="embedEnabled"
                checked={config.embedEnabled}
                onChange={(e) => setConfig({ ...config, embedEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--gold-primary)' }}
              />
              <label htmlFor="embedEnabled" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                إرسال الرسالة كـ بطاقة فاخرة (Rich Embed)
              </label>
            </div>
          </div>

          {config.embedEnabled && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
                  عنوان البطاقة (Embed Title)
                </label>
                <input 
                  type="text"
                  className="form-input"
                  value={config.embedTitle}
                  onChange={(e) => setConfig({ ...config, embedTitle: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
                  لون الإطار (Embed Color)
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="color"
                    value={config.embedColor}
                    onChange={(e) => setConfig({ ...config, embedColor: e.target.value })}
                    style={{ width: '48px', height: '44px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer' }}
                  />
                  <input 
                    type="text"
                    className="form-input"
                    value={config.embedColor}
                    onChange={(e) => setConfig({ ...config, embedColor: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
              نص رسالة الترحيب
            </label>
            <textarea 
              className="form-textarea"
              rows={4}
              value={config.message}
              onChange={(e) => setConfig({ ...config, message: e.target.value })}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              <span className="badge-gold" style={{ cursor: 'pointer' }} onClick={() => setConfig({ ...config, message: config.message + ' {user}' })}>+ &#123;user&#125;</span>
              <span className="badge-gold" style={{ cursor: 'pointer' }} onClick={() => setConfig({ ...config, message: config.message + ' {server}' })}>+ &#123;server&#125;</span>
              <span className="badge-gold" style={{ cursor: 'pointer' }} onClick={() => setConfig({ ...config, message: config.message + ' {memberCount}' })}>+ &#123;memberCount&#125;</span>
            </div>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#D4AF37" />
            <span>معاينة فورية (Live Discord Preview)</span>
          </h3>

          <div style={{
            background: '#2F3136',
            borderRadius: '8px',
            padding: '16px',
            color: '#DCDDDE',
            fontFamily: 'sans-serif',
            fontSize: '0.95rem',
            borderLeft: config.embedEnabled ? `4px solid ${config.embedColor}` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#D4AF37' }}></div>
              <span style={{ fontWeight: 700, color: '#FFF' }}>Royal Bot</span>
              <span style={{ background: '#5865F2', color: '#FFF', fontSize: '0.65rem', padding: '1px 4px', borderRadius: '3px' }}>BOT</span>
            </div>

            {config.embedEnabled ? (
              <div style={{ background: '#202225', padding: '14px', borderRadius: '4px', borderLeft: `4px solid ${config.embedColor}` }}>
                <div style={{ fontWeight: 700, color: '#FFF', fontSize: '1rem', marginBottom: '6px' }}>
                  {config.embedTitle}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', color: '#B9BBBE', fontSize: '0.9rem' }}>
                  {config.message
                    .replace(/{user}/g, '@NewMember')
                    .replace(/{server}/g, 'Royal Realm')
                    .replace(/{memberCount}/g, '151')}
                </div>
              </div>
            ) : (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {config.message
                  .replace(/{user}/g, '@NewMember')
                  .replace(/{server}/g, 'Royal Realm')
                  .replace(/{memberCount}/g, '151')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
