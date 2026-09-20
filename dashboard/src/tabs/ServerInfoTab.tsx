import React from 'react';
import { Server, Users, Hash, Shield, Crown, Award, Calendar } from 'lucide-react';
import { GuildChannel, GuildRole } from '../types';

interface ServerInfoTabProps {
  guild: any;
  channels: GuildChannel[];
  roles: GuildRole[];
}

export const ServerInfoTab: React.FC<ServerInfoTabProps> = ({ guild, channels, roles }) => {
  const textChannels = channels.filter(c => c.isText);
  const voiceChannels = channels.filter(c => c.isVoice);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          معلومات السيرفر (Server Information)
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          بيانات الهوية الفنية والتفاصيل الإدارية لسيرفر <strong>{guild.name}</strong>.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '28px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        {guild.icon ? (
          <img 
            src={guild.icon} 
            alt={guild.name}
            style={{ width: '80px', height: '80px', borderRadius: '20px', border: '2px solid var(--gold-primary)' }}
          />
        ) : (
          <div style={{
            width: '80px', height: '80px', borderRadius: '20px', background: '#171822',
            border: '2px solid var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 700, color: 'var(--gold-primary)'
          }}>
            {guild.name.charAt(0)}
          </div>
        )}

        <div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{guild.name}</h3>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span className="badge-gold">Guild ID: {guild.id}</span>
            <span className="badge-green">Owner ID: {guild.ownerId}</span>
          </div>
        </div>
      </div>

      <div className="grid-cards">
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Users size={28} color="#D4AF37" />
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إجمالي الأعضاء</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{guild.memberCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Hash size={28} color="#3B82F6" />
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>القنوات الكتابية (Text Channels)</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{textChannels.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Hash size={28} color="#10B981" />
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>القنوات الصوتية (Voice Channels)</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{voiceChannels.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Shield size={28} color="#8B5CF6" />
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الرتب المسجلة (Roles)</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{roles.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
