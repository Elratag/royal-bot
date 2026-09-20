import React from 'react';
import { Users, Hash, ShieldCheck, Ticket, Activity, Crown, Zap } from 'lucide-react';

interface OverviewTabProps {
  guild: any;
  channelsCount: number;
  rolesCount: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ guild, channelsCount, rolesCount }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          نظرة عامة على السيرفر (Overview)
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          إحصائيات فورية وحالة أنظمة البوت في سيرفر <strong>{guild.name}</strong>.
        </p>
      </div>

      <div className="grid-cards">
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="#D4AF37" />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إجمالي الأعضاء</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{guild.memberCount}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hash size={24} color="#3B82F6" />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>القنوات الصوتية والكتابية</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{channelsCount}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color="#10B981" />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الرتب المسجلة</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{rolesCount}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ticket size={24} color="#EF4444" />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>التذاكر المفتوحة</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{guild.openTickets || 0}</h3>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={20} color="#D4AF37" />
          <span>حالة استجابة خوادم ديسكورد (Gateway Telemetry)</span>
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-surface-elevated)', borderRadius: '10px', flex: 1, minWidth: '200px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>سرعة استجابة WebSocket</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>
              {guild.botPing}ms (ممتاز)
            </div>
          </div>
          <div style={{ padding: '16px', background: 'var(--bg-surface-elevated)', borderRadius: '10px', flex: 1, minWidth: '200px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>حالة التشغيل 24/7</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--gold-primary)', marginTop: '4px' }}>
              Online (Active Gateway)
            </div>
          </div>
          <div style={{ padding: '16px', background: 'var(--bg-surface-elevated)', borderRadius: '10px', flex: 1, minWidth: '200px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>بيئة التشغيل</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              Production VPS Ready
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
