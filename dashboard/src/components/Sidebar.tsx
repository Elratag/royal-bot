import React from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  UserPlus, 
  ShieldCheck, 
  Palette, 
  FileText, 
  Ticket, 
  MessageSquareReply, 
  Music, 
  Film, 
  Tv, 
  Terminal, 
  Bot, 
  Server,
  ChevronLeft
} from 'lucide-react';

export type DashboardTab = 
  | 'overview'
  | 'general'
  | 'welcome'
  | 'autoroles'
  | 'colorroles'
  | 'logs'
  | 'tickets'
  | 'autoresp'
  | 'music'
  | 'movies'
  | 'series'
  | 'commands'
  | 'botsettings'
  | 'serverinfo';

interface SidebarProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
  onSwitchServer: () => void;
}

const menuItems: { id: DashboardTab; label: string; icon: any; badge?: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'general', label: 'General Settings', icon: Settings },
  { id: 'welcome', label: 'Welcome System', icon: UserPlus },
  { id: 'autoroles', label: 'Auto Roles', icon: ShieldCheck },
  { id: 'colorroles', label: 'Color Roles', icon: Palette, badge: 'VIP' },
  { id: 'logs', label: 'Audit Logs', icon: FileText },
  { id: 'tickets', label: 'Ticket System', icon: Ticket },
  { id: 'autoresp', label: 'Auto Response', icon: MessageSquareReply },
  { id: 'music', label: 'Music System', icon: Music },
  { id: 'movies', label: 'Movies Watch Party', icon: Film, badge: 'Live' },
  { id: 'series', label: 'Series Episodes', icon: Tv },
  { id: 'commands', label: 'Slash Commands', icon: Terminal },
  { id: 'botsettings', label: 'Bot Settings', icon: Bot },
  { id: 'serverinfo', label: 'Server Information', icon: Server },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  onSwitchServer,
}) => {
  return (
    <aside 
      className="glass-panel"
      style={{
        width: '280px',
        margin: '0 24px 24px 24px',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        height: 'calc(100vh - 120px)',
        position: 'sticky',
        top: '96px',
        overflowY: 'auto',
      }}
    >
      <button 
        onClick={onSwitchServer}
        className="btn-secondary"
        style={{
          marginBottom: '14px',
          width: '100%',
          justifyContent: 'center',
          borderColor: 'var(--border-gold)',
          background: 'rgba(212, 175, 55, 0.08)',
          color: 'var(--gold-light)',
          fontSize: '0.9rem'
        }}
      >
        <ChevronLeft size={16} />
        <span>تغيير السيرفر (Server Selector)</span>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 16px',
                borderRadius: 'var(--radius-sm)',
                border: isActive ? '1px solid var(--gold-primary)' : '1px solid transparent',
                background: isActive 
                  ? 'linear-gradient(90deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%)' 
                  : 'transparent',
                color: isActive ? '#FFF' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
                textAlign: 'right',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} color={isActive ? '#D4AF37' : '#888DA0'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="badge-gold" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
