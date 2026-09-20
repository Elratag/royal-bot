import React, { useState, useEffect } from 'react';
import { GuildRole, AutoRoleItem } from '../types';
import { getAutoRoles, addAutoRole, deleteAutoRole } from '../api';
import { ShieldCheck, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface AutoRolesTabProps {
  guildId: string;
  roles: GuildRole[];
}

export const AutoRolesTab: React.FC<AutoRolesTabProps> = ({ guildId, roles }) => {
  const [autoRoles, setAutoRoles] = useState<AutoRoleItem[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, [guildId]);

  const loadRoles = async () => {
    const data = await getAutoRoles(guildId);
    setAutoRoles(data);
    setLoading(false);
  };

  const handleAddRole = async () => {
    if (!selectedRole) return;
    await addAutoRole(guildId, selectedRole);
    setSelectedRole('');
    loadRoles();
  };

  const handleDeleteRole = async (id: number) => {
    await deleteAutoRole(guildId, id);
    loadRoles();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          الرتب التلقائية (Auto Roles)
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          إسناد رتب محددة تلقائيًا للأعضاء الجدد بمجرد انضمامهم للسيرفر.
        </p>
      </div>

      {/* Role Hierarchy Alert */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 'var(--radius-sm)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        color: '#FCD34D'
      }}>
        <AlertTriangle size={24} color="#F59E0B" />
        <div style={{ fontSize: '0.9rem' }}>
          <strong>تنبيه Role Hierarchy في ديسكورد:</strong> تأكد من وضع رتبة <strong>Royal Bot</strong> في أعلى قائمة الرتب في إعدادات السيرفر لتتمكن من منح الرتب المختارة للأعضاء بنجاح.
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>إضافة رتبة تلقائية جديدة</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select 
            className="form-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{ flex: 1, minWidth: '240px' }}
          >
            <option value="">-- اختر رتبة من السيرفر --</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button 
            onClick={handleAddRole}
            disabled={!selectedRole}
            className="btn-gold"
          >
            <Plus size={18} />
            <span>إضافة الرتبة</span>
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
          الرتب التلقائية النشطة حاليًا ({autoRoles.length})
        </h3>

        {autoRoles.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            لا توجد رتب تلقائية مضافة حاليًا.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {autoRoles.map(item => {
              const roleObj = roles.find(r => r.id === item.roleId);
              return (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: roleObj?.color || '#D4AF37'
                    }}></div>
                    <span style={{ fontWeight: 600 }}>{roleObj?.name || `Role ID: ${item.roleId}`}</span>
                  </div>

                  <button 
                    onClick={() => handleDeleteRole(item.id)}
                    className="btn-danger"
                  >
                    <Trash2 size={16} />
                    <span>حذف</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
