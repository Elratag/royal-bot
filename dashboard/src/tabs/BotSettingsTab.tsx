import React, { useState, useEffect } from 'react';
import { BotSetting } from '../types';
import { getBotSettings, saveBotSettings } from '../api';
import { Bot, Check, Globe, Activity } from 'lucide-react';

interface BotSettingsTabProps {
  guildId: string;
}

export const BotSettingsTab: React.FC<BotSettingsTabProps> = ({ guildId }) => {
  const [settings, setSettings] = useState<BotSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getBotSettings(guildId).then(data => {
      setSettings(data);
      setLoading(false);
    });
  }, [guildId]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    await saveBotSettings(guildId, settings);
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (loading || !settings) {
    return <div style={{ color: 'var(--gold-primary)' }}>جاري تحميل إعدادات البوت...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            إعدادات البوت والحالة (Bot Presence & Settings)
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            تخصيص نص الحالة، نوع النشاط، وحالة اتصال البوت في الديسكورد.
          </p>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-gold">
          <Check size={18} />
          <span>{saving ? 'جاري الحفظ...' : savedSuccess ? 'تم الحفظ بنجاح!' : 'حفظ الإعدادات'}</span>
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="#D4AF37" />
          <span>حالة البوت المباشرة (Presence & Activity)</span>
        </h3>

        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
            نص الحالة المخصص (Status Text)
          </label>
          <input
            type="text"
            className="form-input"
            value={settings.statusText}
            onChange={(e) => setSettings({ ...settings, statusText: e.target.value })}
          />
        </div>

        <div className="grid-cards">
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
              نوع النشاط (Activity Type)
            </label>
            <select
              className="form-select"
              value={settings.statusType}
              onChange={(e) => setSettings({ ...settings, statusType: e.target.value })}
            >
              <option value="WATCHING">مشاهدة (WATCHING)</option>
              <option value="PLAYING">يلعب (PLAYING)</option>
              <option value="LISTENING">يستمع إلى (LISTENING)</option>
              <option value="COMPETING">ينافس في (COMPETING)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
              حالة الاتصال (Online Status)
            </label>
            <select
              className="form-select"
              value={settings.onlineStatus}
              onChange={(e) => setSettings({ ...settings, onlineStatus: e.target.value })}
            >
              <option value="online">🟢 متصل (Online)</option>
              <option value="idle">🟡 خامل (Idle)</option>
              <option value="dnd">🔴 الرجاء عدم الإزعاج (Do Not Disturb)</option>
              <option value="invisible">⚪ غير مرئي (Invisible)</option>
            </select>
          </div>
        </div>

        <hr style={{ borderColor: 'var(--border-subtle)', margin: '4px 0' }} />

        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
            لغة البوت الافتراضية (Bot Language)
          </label>
          <select
            className="form-select"
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            style={{ maxWidth: '300px' }}
          >
            <option value="ar">العربية (Arabic)</option>
            <option value="en">English (US)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
