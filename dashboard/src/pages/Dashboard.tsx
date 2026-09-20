import React, { useState, useEffect } from 'react';
import { UserProfile, GuildChannel, GuildRole } from '../types';
import { fetchGuildDetails } from '../api';
import { Navbar } from '../components/Navbar';
import { Sidebar, DashboardTab } from '../components/Sidebar';

// Tabs
import { OverviewTab } from '../tabs/OverviewTab';
import { GeneralSettingsTab } from '../tabs/GeneralSettingsTab';
import { WelcomeTab } from '../tabs/WelcomeTab';
import { AutoRolesTab } from '../tabs/AutoRolesTab';
import { ColorRolesTab } from '../tabs/ColorRolesTab';
import { LogsTab } from '../tabs/LogsTab';
import { TicketsTab } from '../tabs/TicketsTab';
import { AutoResponseTab } from '../tabs/AutoResponseTab';
import { MusicTab } from '../tabs/MusicTab';
import { MoviesTab } from '../tabs/MoviesTab';
import { SeriesTab } from '../tabs/SeriesTab';
import { CommandsTab } from '../tabs/CommandsTab';
import { BotSettingsTab } from '../tabs/BotSettingsTab';
import { ServerInfoTab } from '../tabs/ServerInfoTab';

interface DashboardProps {
  user: UserProfile | null;
  guildId: string;
  onLogout: () => void;
  onSwitchServer: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  guildId,
  onLogout,
  onSwitchServer,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guildData, setGuildData] = useState<any>(null);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuildDetails(guildId)
      .then(res => {
        setGuildData(res.guild);
        setChannels(res.channels);
        setRoles(res.roles);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching guild details:', err);
        setLoading(false);
      });
  }, [guildId]);

  if (loading || !guildData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '50px', height: '50px', borderRadius: '50%',
          border: '4px solid rgba(212, 175, 55, 0.2)',
          borderTopColor: 'var(--gold-primary)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div className="gold-text" style={{ fontSize: '1.2rem' }}>جاري تحميل إعدادات السيرفر الفاخرة...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        onLogout={onLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        currentGuildName={guildData.name}
        onBackToServers={onSwitchServer}
      />

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          onSwitchServer={onSwitchServer}
        />

        <main style={{
          flex: 1,
          padding: '0 24px 40px 0',
          minWidth: 0,
        }}>
          {activeTab === 'overview' && (
            <OverviewTab 
              guild={guildData} 
              channelsCount={channels.length} 
              rolesCount={roles.length} 
            />
          )}

          {activeTab === 'general' && <GeneralSettingsTab guild={guildData} />}
          {activeTab === 'welcome' && <WelcomeTab guildId={guildId} channels={channels} />}
          {activeTab === 'autoroles' && <AutoRolesTab guildId={guildId} roles={roles} />}
          {activeTab === 'colorroles' && <ColorRolesTab guildId={guildId} roles={roles} channels={channels} />}
          {activeTab === 'logs' && <LogsTab guildId={guildId} channels={channels} />}
          {activeTab === 'tickets' && <TicketsTab guildId={guildId} channels={channels} roles={roles} />}
          {activeTab === 'autoresp' && <AutoResponseTab guildId={guildId} channels={channels} />}
          {activeTab === 'music' && <MusicTab guildId={guildId} />}
          {activeTab === 'movies' && <MoviesTab guildId={guildId} />}
          {activeTab === 'series' && <SeriesTab guildId={guildId} />}
          {activeTab === 'commands' && <CommandsTab guildId={guildId} />}
          {activeTab === 'botsettings' && <BotSettingsTab guildId={guildId} />}
          {activeTab === 'serverinfo' && <ServerInfoTab guild={guildData} channels={channels} roles={roles} />}
        </main>
      </div>
    </div>
  );
};
