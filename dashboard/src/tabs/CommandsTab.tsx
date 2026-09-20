import React, { useState, useEffect } from 'react';
import { CommandItem } from '../types';
import { getCommands, toggleCommand } from '../api';
import { Terminal, ShieldAlert, Check } from 'lucide-react';

interface CommandsTabProps {
  guildId: string;
}

export const CommandsTab: React.FC<CommandsTabProps> = ({ guildId }) => {
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadCommands();
  }, [guildId]);

  const loadCommands = async () => {
    const data = await getCommands(guildId);
    setCommands(data);
    setLoading(false);
  };

  const handleToggle = async (commandName: string, currentEnabled: boolean) => {
    const newStatus = !currentEnabled;
    setCommands(commands.map(c => c.name === commandName ? { ...c, enabled: newStatus } : c));
    await toggleCommand(guildId, commandName, newStatus);
  };

  const categories = ['all', 'general', 'music', 'moderation', 'tickets', 'cinema', 'admin'];

  const filteredCommands = filterCategory === 'all' 
    ? commands 
    : commands.filter(c => c.category === filterCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          إدارة الأوامر (Slash Commands Management)
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          تفعيل أو تعطيل أي أمر من أوامر البوت بالسيرفر بشكل فوري ومباشر.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className="btn-secondary"
            style={{
              padding: '6px 16px',
              fontSize: '0.85rem',
              borderColor: filterCategory === cat ? 'var(--gold-primary)' : 'var(--border-subtle)',
              color: filterCategory === cat ? '#FFF' : 'var(--text-secondary)',
              background: filterCategory === cat ? 'rgba(212, 175, 55, 0.15)' : undefined,
            }}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredCommands.map(cmd => (
            <div
              key={cmd.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  padding: '6px 10px',
                  background: 'rgba(212, 175, 55, 0.1)',
                  borderRadius: '6px',
                  color: 'var(--gold-primary)',
                  fontWeight: 700,
                  fontSize: '0.95rem'
                }}>
                  /{cmd.name}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{cmd.description}</div>
                  <span className="badge-gold" style={{ fontSize: '0.65rem', marginTop: '4px', display: 'inline-block' }}>
                    {cmd.category}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '0.85rem', color: cmd.enabled ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                  {cmd.enabled ? 'مفعل' : 'معطل'}
                </span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={cmd.enabled}
                    onChange={() => handleToggle(cmd.name, cmd.enabled)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
