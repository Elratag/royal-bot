import React from 'react';
import { UserProfile } from '../types';
import { Crown, LogOut, Menu, Shield, ExternalLink } from 'lucide-react';
import { logoutUser, getUserAvatarUrl } from '../api';

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
  onToggleSidebar?: () => void;
  currentGuildName?: string;
  onBackToServers?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onToggleSidebar,
  currentGuildName,
  onBackToServers,
}) => {
  const handleLogout = async () => {
    await logoutUser();
    onLogout();
  };

  return (
    <header className="glass-panel" style={{
      margin: '16px 24px',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '16px',
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="btn-secondary" 
            style={{ padding: '8px', borderRadius: '8px' }}
            title="القائمة"
          >
            <Menu size={20} color="#D4AF37" />
          </button>
        )}
        
        <div 
          onClick={onBackToServers} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: onBackToServers ? 'pointer' : 'default' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)'
          }}>
            <Crown size={22} color="#08080A" />
          </div>
          <div>
            <h2 className="gold-text" style={{ fontSize: '1.2rem', lineHeight: 1.1 }}>ROYAL BOT</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>LUXURY DASHBOARD</span>
          </div>
        </div>

        {currentGuildName && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '4px 14px', 
            background: 'var(--bg-surface-elevated)', 
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)'
          }}>
            <Shield size={14} color="#D4AF37" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentGuildName}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a 
          href="/api/health" 
          target="_blank" 
          rel="noreferrer"
          className="badge-green" 
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
          Bot Online 24/7
        </a>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 14px',
              background: 'var(--bg-surface-elevated)',
              borderRadius: '24px',
              border: '1px solid var(--border-gold)',
            }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={getUserAvatarUrl(user)} 
                  alt={user.displayName || user.globalName || user.username}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '2px solid var(--gold-primary)',
                    display: 'block',
                  }}
                  onError={(e) => {
                    // Fallback to default Discord avatar if image fails
                    (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                  }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: '0px',
                  right: '0px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '1.5px solid #08080A',
                }}></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFF' }}>
                  {user.displayName || user.globalName || user.username}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--gold-light)' }}>
                  @{user.username}
                </span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="btn-secondary" 
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              title="تسجيل الخروج"
            >
              <LogOut size={16} color="#EF4444" />
              <span>خروج</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
