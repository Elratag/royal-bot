import React, { useState, useEffect } from 'react';
import { GuildChannel, GuildRole, TicketPanel, TicketItem } from '../types';
import { getTicketsData, saveTicketPanel } from '../api';
import { Ticket, Check, Shield, Lock, FileText, User } from 'lucide-react';

interface TicketsTabProps {
  guildId: string;
  channels: GuildChannel[];
  roles: GuildRole[];
}

export const TicketsTab: React.FC<TicketsTabProps> = ({ guildId, channels, roles }) => {
  const [panel, setPanel] = useState<TicketPanel | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const textChannels = channels.filter(c => c.isText);
  const categories = channels.filter(c => c.isCategory || c.type === 4);

  useEffect(() => {
    getTicketsData(guildId).then(data => {
      setPanel(data.panel);
      setTickets(data.tickets);
      setLoading(false);
    });
  }, [guildId]);

  const handleSave = async () => {
    if (!panel) return;
    setSaving(true);
    await saveTicketPanel(guildId, panel);
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (loading || !panel) {
    return <div style={{ color: 'var(--gold-primary)' }}>جاري تحميل نظام التذاكر...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            نظام التذاكر المتقدم (Ticket System)
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            لوحة دعم فني احترافية مع أزرار استلام التذاكر (Claim) وإغلاقها، مع إمكانية تحديد قسم الكتاقوري.
          </p>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-gold">
          <Check size={18} />
          <span>{saving ? 'جاري الحفظ...' : savedSuccess ? 'تم الحفظ!' : 'حفظ إعدادات التذاكر'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Settings Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ticket size={20} color="#D4AF37" />
            <span>إعدادات لوحة التذاكر</span>
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
              عنوان اللوحة
            </label>
            <input 
              type="text"
              className="form-input"
              value={panel.title}
              onChange={(e) => setPanel({ ...panel, title: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
              وصف ورسالة التذاكر
            </label>
            <textarea 
              className="form-textarea"
              rows={3}
              value={panel.description || ''}
              onChange={(e) => setPanel({ ...panel, description: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
              قسم / كتاقوري التذاكر (Ticket Category)
            </label>
            <select 
              className="form-select"
              value={panel.categoryId || ''}
              onChange={(e) => setPanel({ ...panel, categoryId: e.target.value || null })}
            >
              <option value="">-- بدون قسم (إنشاء التذكرة أعلى السيرفر) --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>📁 {cat.name}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              سيتم إنشاء رومات التذاكر الجديدة تلقائياً داخل هذا القسم المحدد.
            </span>
          </div>

          <div className="grid-cards">
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
                رتبة الدعم الفني (Support Role)
              </label>
              <select 
                className="form-select"
                value={panel.supportRoleId || ''}
                onChange={(e) => setPanel({ ...panel, supportRoleId: e.target.value || null })}
              >
                <option value="">-- اختر رتبة الدعم --</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
                قناة سجلات التذاكر (Logs)
              </label>
              <select 
                className="form-select"
                value={panel.logsChannelId || ''}
                onChange={(e) => setPanel({ ...panel, logsChannelId: e.target.value || null })}
              >
                <option value="">-- اختر قناة السجل --</option>
                {textChannels.map(c => (
                  <option key={c.id} value={c.id}>#{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
              رسالة الترحيب داخل التذكرة
            </label>
            <textarea 
              className="form-textarea"
              rows={2}
              value={panel.welcomeMessage || ''}
              onChange={(e) => setPanel({ ...panel, welcomeMessage: e.target.value })}
            />
          </div>

          <div style={{ background: 'rgba(212, 175, 55, 0.08)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
            💡 انشر اللوحة في القناة الحالية بالسيرفر باستخدام الأمر: <code>/ticket</code>
          </div>
        </div>

        {/* Live Tickets Monitor */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="#D4AF37" />
            <span>التذاكر الأخيرة في السيرفر ({tickets.length})</span>
          </h3>

          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
              لا توجد تذاكر مفتوحة حاليًا.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {tickets.map(t => (
                <div 
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--gold-primary)' }}>#{t.id}</span>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>User: {t.creatorId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(t.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    {t.status === 'OPEN' && <span className="badge-green">مفتوحة (OPEN)</span>}
                    {t.status === 'CLAIMED' && <span className="badge-gold">مستلمة (CLAIMED)</span>}
                    {t.status === 'CLOSED' && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>مغلقة (CLOSED)</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
