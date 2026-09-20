import React, { useState, useEffect } from 'react';
import { GuildRole, GuildChannel, ColorPanel } from '../types';
import { getColorPanel, saveColorPanel, addColorOption, deleteColorOption } from '../api';
import { Palette, Plus, Trash2, Check, Sparkles } from 'lucide-react';

interface ColorRolesTabProps {
  guildId: string;
  roles: GuildRole[];
  channels: GuildChannel[];
}

export const ColorRolesTab: React.FC<ColorRolesTabProps> = ({ guildId, roles, channels }) => {
  const [panel, setPanel] = useState<ColorPanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New color form
  const [newRoleId, setNewRoleId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('👑');

  const textChannels = channels.filter(c => c.isText);

  useEffect(() => {
    loadPanel();
  }, [guildId]);

  const loadPanel = async () => {
    const data = await getColorPanel(guildId);
    setPanel(data);
    setLoading(false);
  };

  const handleSavePanel = async () => {
    if (!panel) return;
    setSaving(true);
    await saveColorPanel(guildId, panel);
    setSaving(false);
  };

  const handleAddOption = async () => {
    if (!newRoleId || !newName) return;
    await addColorOption(guildId, { roleId: newRoleId, name: newName, emoji: newEmoji });
    setNewRoleId('');
    setNewName('');
    loadPanel();
  };

  const handleDeleteOption = async (id: number) => {
    await deleteColorOption(guildId, id);
    loadPanel();
  };

  if (loading || !panel) {
    return <div style={{ color: 'var(--gold-primary)' }}>جاري تحميل إعدادات لوحة الألوان...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
            نظام رتب الألوان (Color Roles)
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            لوحة تفاعلية بأزرار تتيح للأعضاء اختيار ألوان أسمائهم مع إزالة اللون السابق تلقائيًا.
          </p>
        </div>

        <button onClick={handleSavePanel} disabled={saving} className="btn-gold">
          <Check size={18} />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات اللوحة'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Panel Setup */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={20} color="#D4AF37" />
            <span>إعدادات اللوحة الرئيسية</span>
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>
              عنوان لوحة الألوان
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
              وصف اللوحة
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
              قناة إرسال اللوحة
            </label>
            <select 
              className="form-select"
              value={panel.channelId}
              onChange={(e) => setPanel({ ...panel, channelId: e.target.value })}
            >
              <option value="">-- اختر قناة --</option>
              {textChannels.map(c => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>نمط اللون الواحد (Single Color Mode)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إزالة لون العضو السابق فور اختياره لوناً جديداً</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox"
                checked={panel.singleColor}
                onChange={(e) => setPanel({ ...panel, singleColor: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div style={{ background: 'rgba(212, 175, 55, 0.08)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
            💡 <strong>نصيحة:</strong> يمكنك نشر اللوحة في أي وقت داخل الديسكورد باستخدام الأمر: <code>/colorroles</code>
          </div>
        </div>

        {/* Color Options List & Adder */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>إضافة لون جديد للوحة</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>إيموجي</label>
              <input 
                type="text"
                className="form-input"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                style={{ textAlign: 'center' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>اسم اللون</label>
              <input 
                type="text"
                className="form-input"
                placeholder="مثال: Royal Gold"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>رتبة اللون بالسيرفر</label>
            <select 
              className="form-select"
              value={newRoleId}
              onChange={(e) => {
                setNewRoleId(e.target.value);
                const r = roles.find(role => role.id === e.target.value);
                if (r && !newName) setNewName(r.name);
              }}
            >
              <option value="">-- اختر رتبة اللون --</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleAddOption}
            disabled={!newRoleId || !newName}
            className="btn-gold"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Plus size={18} />
            <span>إضافة اللون إلى اللوحة</span>
          </button>

          <hr style={{ borderColor: 'var(--border-subtle)', margin: '4px 0' }} />

          <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>الألوان الحالية ({panel.options.length})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {panel.options.map(opt => (
              <div 
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{opt.emoji}</span>
                  <span style={{ fontWeight: 600 }}>{opt.name}</span>
                </div>
                <button onClick={() => handleDeleteOption(opt.id)} className="btn-danger" style={{ padding: '4px 8px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
