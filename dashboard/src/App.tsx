import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { fetchCurrentUser, setStoredToken, removeStoredToken, logoutUser } from './api';
import { Login } from './pages/Login';
import { ServerSelector } from './pages/ServerSelector';
import { Dashboard } from './pages/Dashboard';
import { CinemaRoom } from './pages/CinemaRoom';
import { Navbar } from './components/Navbar';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [isCinemaView, setIsCinemaView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if error is passed in URL query param
    const errorParam = urlParams.get('error');
    if (errorParam) {
      if (errorParam === 'auth_failed') {
        setAuthError('تعذر إكمال المصادقة عبر Discord. يرجى التأكد من إضافة رابط Redirect URI في لوحة Discord Developer Portal.');
      } else {
        setAuthError(`خطأ Discord OAuth2: ${decodeURIComponent(errorParam)}`);
      }
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // 1. Check if token is passed in URL query param from OAuth2 callback
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setStoredToken(tokenParam);
      // Clean token from browser URL address
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // 2. Check if path is cinema
    if (window.location.pathname === '/cinema' || window.location.search.includes('channel=')) {
      setIsCinemaView(true);
    }

    // 3. Check if guildId is in URL
    const guildParam = urlParams.get('guild');
    if (guildParam) {
      setSelectedGuildId(guildParam);
    }

    // 4. Fetch authenticated session
    fetchCurrentUser().then(u => {
      // Invalidate any leftover mock dev sessions
      if (u && (u.id === '100000000000000001' || u.username === 'RoyalAdmin')) {
        removeStoredToken();
        setUser(null);
      } else {
        setUser(u);
      }
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setSelectedGuildId(null);
  };

  if (loading) {
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
        <div className="gold-text" style={{ fontSize: '1.2rem' }}>ROYAL BOT SUITE</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 1. Cinema View
  if (isCinemaView) {
    return <CinemaRoom onBack={() => setIsCinemaView(false)} />;
  }

  // 2. Not Logged In View
  if (!user) {
    return <Login errorMessage={authError} />;
  }

  // 3. Guild Management Dashboard View
  if (selectedGuildId) {
    return (
      <Dashboard
        user={user}
        guildId={selectedGuildId}
        onLogout={handleLogout}
        onSwitchServer={() => setSelectedGuildId(null)}
      />
    );
  }

  // 4. Server Selection View
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1 }}>
        <ServerSelector
          user={user}
          guilds={user.guilds || []}
          onSelectGuild={(id) => setSelectedGuildId(id)}
        />
      </main>
    </div>
  );
};
