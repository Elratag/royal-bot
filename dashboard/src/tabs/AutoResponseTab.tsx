import React, { useState, useEffect } from 'react';
import { GuildChannel, AutoResponseItem } from '../types';
import { getAutoResponses, addAutoResponse, deleteAutoResponse } from '../api';
import { MessageSquareReply, Plus, Trash2, Check } from 'lucide-react';

interface AutoResponseTabProps {
  guildId: string;
  channels: GuildChannel[];
}

export const AutoResponseTab: React.FC<AutoResponseTabProps> = ({ guildId, channels }) => {
  const [responses, setResponses] = useState<AutoResponseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [trigger, setTrigger] = useState('');
  const [response, setResponse] = useState('');
  const [exactMatch, setExactMatch] = useState(false);
  const [channelId, setChannelId] = useState('');

  const textChannels = channels.filter(c => c.isText);

  useEffect(() => {
    loadResponses();
  }, [guildId]);

  const loadResponses = async () => {
    const data = await getAutoResponses(guildId);
    setResponses(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!trigger || !response) return;
    await addAutoResponse(guildId, {
      trigger,
      response,
      exactMatch,
      channelId: channelId || null,
    });
    setTrigger('');
    setResponse('');
    loadResponses();
  };

  const handleDelete = async (id: number) => {
    await deleteAutoResponse(guildId, id);
    loadResponses();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          نظام الرد التلقائي (Auto Response)
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          إرسال ردود تلقائية مخصصة فور كتابة كلمات أو جمل محددة في الشات.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} color="#D4AF37" />
          <span>إضافة رد تلقائي جديد</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>
              الكلمة أو الجملة المستهدفة (Trigger)
            </label>
            <input 
              type="text"
              className="form-input"
              placeholder="مثال: السلام عليكم"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>
              الرد التلقائي للبوت (Response)
            </label>
            <input 
              type="text"
              className="form-input"
              placeholder="مثال: وعليكم السلام ورحمة الله وبركاته"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>
              تحديد قناة معينة (اختياري)
            </label>
            <select 
              className="form-select"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
            >
              <option value="">-- جميع القنوات --</option>
              {textChannels.map(c => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
            <input 
              type="checkbox"
              id="exactMatchToggle"
              checked={exactMatch}
              onChange={(e) => setExactMatch(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--gold-primary)' }}
            />
            <label htmlFor="exactMatchToggle" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
              تطابق تام للجملة فقط (Exact Match)
            </label>
          </div>
        </div>

        <div>
          <button 
            onClick={handleAdd}
            disabled={!trigger || !response}
            className="btn-gold"
          >
            <Plus size={18} />
            <span>إضافة الرد التلقائي</span>
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
          قائمة الردود التلقائية النشطة ({responses.length})
        </h3>

        {responses.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
            لا توجد ردود تلقائية مضافة حاليًا.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {responses.map(item => (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>إذا كتب:</span>
                    <strong style={{ color: 'var(--gold-light)' }}>"{item.trigger}"</strong>
                    {item.exactMatch && <span className="badge-gold" style={{ fontSize: '0.65rem' }}>تطابق تام</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>الرد:</span>
                    <span>{item.response}</span>
                  </div>
                </div>

                <button onClick={() => handleDelete(item.id)} className="btn-danger">
                  <Trash2 size={16} />
                  <span>حذف</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
