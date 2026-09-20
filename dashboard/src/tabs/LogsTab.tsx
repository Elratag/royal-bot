import React, { useState, useEffect } from 'react';
import { GuildChannel, LogConfig } from '../types';
import { getLogConfig, saveLogConfig } from '../api';
import { FileText, Check, AlertCircle } from 'lucide-react';

interface LogsTabProps {
  guildId: string;
  channels: GuildChannel[];
}

export const LogsTab: React.FC<LogsTabProps> = ({ guildId, channels }) => {
  const [logs, setLogs] = useState<LogConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const textChannels = channels.filter(c => c.isText);

  useEffect(() => {
    getLogConfig(guildId).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, [guildId]);

  const handleSave = async () => {
    if (!logs) return;
    setSaving(true);
    await saveLogConfig(guildId, logs);
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (loading || !logs) {
    return <div style={{ color: 'var(--gold-primary)' }}>جاري تحميل إعدادات السجلات...</div>;
  }

  const logFields = [
    { key: 'memberLogChannel', label: '📥 سجل دخول وخروج الأعضاء (Member Join / Leave)' },
    { key: 'kickLogChannel', label: '👢 سجل طرد الأعضاء (Kick Logs مع الفاعل)' },
    { key: 'banLogChannel', label: '🔨 سجل الحظر وفك الحظر (Ban / Unban Logs)' },
    { key: 'voiceLogChannel', label: '🔊 سجل سحب ونقل الرومات الصوتية (Voice Channel Move)' },
    { key: 'muteLogChannel', label: '🎙️ سجل Server Mute & Deafen (مع الفاعل)' },
    { key: 'messageLogChannel', label: '🗑️ سجل حذف الرسائل (Message Delete Log مع الكاش)' },
    { key: 'ticketLogChannel', label: '🎫 سجل إغلاق التذاكر والترانسكريبت (Ticket Logs)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            نظام السجلات المتقدم (Audit Logs)
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            تخصيص قنوات مستقلة لكل نوع من السجلات لمراقبة دقيقة لكل ما يحدث داخل السيرفر.
          </p>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-gold">
          <Check size={18} />
          <span>{saving ? 'جاري الحفظ...' : savedSuccess ? 'تم الحفظ بنجاح!' : 'حفظ قنوات السجلات'}</span>
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="grid-cards">
          {logFields.map(field => (
            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.92rem', fontWeight: 600 }}>
                {field.label}
              </label>
              <select 
                className="form-select"
                value={(logs as any)[field.key] || ''}
                onChange={(e) => setLogs({ ...logs, [field.key]: e.target.value || null })}
              >
                <option value="">-- غير مفعل (معطل) --</option>
                {textChannels.map(c => (
                  <option key={c.id} value={c.id}>#{c.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: 'rgba(23, 24, 33, 0.7)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '16px 20px',
        fontSize: '0.88rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.6
      }}>
        <div style={{ fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '4px' }}>
          🛡️ دقة بيانات السجلات وقيود Discord API:
        </div>
        • <strong>Kick & Ban:</strong> يتم استخراج الفاعل والسبب تلقائيًا عبر فحص Audit Logs.<br />
        • <strong>Message Delete:</strong> يتم حفظ محتوى الرسالة في كاش البوت وعرض المشرف الذي حذفها إن وجد.<br />
        • <strong>Voice Move:</strong> يسجل الروم السابق والروم الجديد ووقت النقل بدقة.
      </div>
    </div>
  );
};
