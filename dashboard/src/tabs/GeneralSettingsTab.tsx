import React from 'react';
import { Settings, Shield, Globe, Lock } from 'lucide-react';

interface GeneralSettingsTabProps {
  guild: any;
}

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({ guild }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 className="gold-text" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          الإعدادات العامة (General Settings)
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          إعدادات الأمان الأساسية والتحكم العام بالسيرفر.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="#D4AF37" />
          <span>بروتوكولات الأمان والمصادقة</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '14px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>التحقق الصارم من صلاحيات Administrator</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>فحص بت 0x8 قبل كل عملية تعديل من الداشبورد</div>
            </div>
            <span className="badge-green">نشط ومؤمن 100%</span>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>حماية جلسات OAuth2 المشفرة (CSRF State Guard)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>رموز سرية مشفرة بكوكيز HttpOnly محمية</div>
            </div>
            <span className="badge-green">مفعل</span>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>حماية الـ API من الهجمات (Rate Limiting)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>تحديد وتوزيع الطلبات لمنع استنزاف موارد السيرفر</div>
            </div>
            <span className="badge-green">مفعل</span>
          </div>
        </div>
      </div>
    </div>
  );
};
