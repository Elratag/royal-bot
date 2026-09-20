import React, { useState } from 'react';
import { UserGuild, UserProfile } from '../types';
import { Shield, ShieldAlert, Plus, ArrowRight, Search, Crown, Sparkles } from 'lucide-react';
import { getUserAvatarUrl } from '../api';

interface ServerSelectorProps {
  user: UserProfile | null;
  guilds: UserGuild[];
  onSelectGuild: (guildId: string) => void;
}

export const ServerSelector: React.FC<ServerSelectorProps> = ({ user, guilds, onSelectGuild }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const adminGuilds = guilds.filter(g => g.isAdmin);
  const nonAdminGuilds = guilds.filter(g => !g.isAdmin);

  const filteredAdmin = adminGuilds.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>
      {/* Discord User Greeting Banner */}
      {user && (
        <div className="glass-panel" style={{
          padding: '24px 32px',
          marginBottom: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid var(--border-gold)',
          background: 'linear-gradient(135deg, rgba(23, 24, 33, 0.95) 0%, rgba(17, 18, 23, 0.98) 100%)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(212, 175, 55, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
            <div style={{ position: 'relative' }}>
              <img 
                src={getUserAvatarUrl(user)} 
                alt={user.displayName || user.globalName || user.username}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  border: '3px solid var(--gold-primary)',
                  boxShadow: '0 0 20px rgba(212, 175, 55, 0.35)',
                  display: 'block',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                }}
              />
              <span style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#10B981',
                border: '2.5px solid #08080A',
              }}></span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                  مرحباً بك، {user.displayName || user.globalName || user.username}
                </h2>
                <span className="badge-gold">Discord Verified</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
                مسجل الدخول بحساب ديسكورد الرسمي <strong>(@{user.username})</strong> • لديك <strong>{adminGuilds.length}</strong> سيرفر بصلاحية Administrator
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-green" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              🛡️ مصرح لك بالإدارة
            </span>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 className="gold-text" style={{ fontSize: '2.2rem', marginBottom: '10px' }}>
          اختر السيرفر للإدارة
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem' }}>
          يتم عرض السيرفرات التي تمتلك فيها صلاحية <strong>Administrator</strong> فقط لضمان الأمان التام.
        </p>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto 36px auto', position: 'relative' }}>
        <input 
          type="text"
          className="form-input"
          placeholder="ابحث عن سيرفر..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingRight: '42px', textAlign: 'right' }}
        />
        <Search size={18} color="#888DA0" style={{ position: 'absolute', right: '14px', top: '15px' }} />
      </div>

      <h2 style={{ fontSize: '1.3rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Shield size={20} color="#D4AF37" />
        <span>السيرفرات المصرح لك بإدارتها ({filteredAdmin.length})</span>
      </h2>

      <div className="grid-cards" style={{ marginBottom: '48px' }}>
        {filteredAdmin.length === 0 ? (
          <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <ShieldAlert size={36} color="#F59E0B" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>لا توجد سيرفرات تملك فيها صلاحية Administrator حالياً</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              تأكد من امتلاكك لرتبة فيها Administrator في سيرفر مشترك مع البوت.
            </p>
          </div>
        ) : (
          filteredAdmin.map(guild => {
            const iconUrl = guild.icon 
              ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` 
              : null;

            return (
              <div 
                key={guild.id}
                className="glass-panel"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '20px',
                  border: guild.hasBot ? '1px solid var(--border-gold)' : '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {iconUrl ? (
                    <img 
                      src={iconUrl} 
                      alt={guild.name}
                      style={{ width: '56px', height: '56px', borderRadius: '16px', border: '1px solid var(--border-gold)' }}
                    />
                  ) : (
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '16px', background: '#1A1B24',
                      border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '1.2rem', color: 'var(--gold-primary)'
                    }}>
                      {guild.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {guild.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      {guild.owner && <span className="badge-gold">مالك السيرفر</span>}
                      {guild.hasBot ? (
                        <span className="badge-green">البوت مفعل</span>
                      ) : (
                        <span className="badge-gold" style={{ borderColor: '#F59E0B', color: '#FCD34D' }}>البوت غير مضاف</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {guild.hasBot ? (
                    <button 
                      onClick={() => onSelectGuild(guild.id)}
                      className="btn-gold" 
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <span>لوحة التحكم (Manage)</span>
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <a
                      href={`https://discord.com/api/oauth2/authorize?client_id=1551167756542418956&permissions=8&scope=bot%20applications.commands&guild_id=${guild.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
                    >
                      <Plus size={18} color="#D4AF37" />
                      <span>إضافة البوت إلى السيرفر</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {nonAdminGuilds.length > 0 && (
        <div style={{ opacity: 0.7 }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="#EF4444" />
            <span>سيرفرات أخرى (لا تملك صلاحية Administrator فيها - ممنوع الوصول)</span>
          </h3>
          <div className="grid-cards">
            {nonAdminGuilds.slice(0, 3).map(guild => (
              <div 
                key={guild.id}
                className="glass-panel"
                style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', filter: 'grayscale(0.6)' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#171822', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {guild.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{guild.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#EF4444' }}>مطلوب صلاحية Administrator</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
