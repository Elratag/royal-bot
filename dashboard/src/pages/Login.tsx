import React from 'react';
import { Crown, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoginProps {
  errorMessage?: string | null;
}

export const Login: React.FC<LoginProps> = ({ errorMessage }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '48px 36px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
        border: '1px solid var(--border-gold)',
      }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '22px',
          background: 'linear-gradient(135deg, #FFF1C5 0%, #D4AF37 50%, #AA820A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          boxShadow: '0 0 35px rgba(212, 175, 55, 0.45)',
        }}>
          <Crown size={40} color="#08080A" />
        </div>

        <h1 className="gold-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
          ROYAL BOT
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '24px' }}>
          بوابة الإدارة السحابية الفاخرة لسيرفرات الديسكورد الاحترافية
        </p>

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'right',
            color: '#FCA5A5',
            fontSize: '0.9rem',
          }}>
            <AlertCircle size={22} color="#EF4444" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#FFF', display: 'block', marginBottom: '4px' }}>تنبيه تسجيل الدخول:</strong>
              {errorMessage}
            </div>
          </div>
        )}

        <div style={{
          background: 'rgba(23, 24, 33, 0.6)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          padding: '20px',
          textAlign: 'right',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
            <CheckCircle2 size={18} color="#D4AF37" />
            <span>نظام Slash Commands بالكامل بدون Prefix</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
            <CheckCircle2 size={18} color="#D4AF37" />
            <span>حماية وتحقق أمني صارم لصلاحية Administrator</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
            <CheckCircle2 size={18} color="#D4AF37" />
            <span>نظام Watch Party وسينما متزامن عبر Discord Activities</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
            <CheckCircle2 size={18} color="#D4AF37" />
            <span>حفظ فعلي ومباشر بالإعدادات في قاعدة البيانات</span>
          </div>
        </div>

        <div>
          <a
            href="/api/auth/login"
            className="btn-gold"
            style={{
              width: '100%',
              justifyContent: 'center',
              textDecoration: 'none',
              padding: '16px 28px',
              fontSize: '1.1rem',
              borderRadius: '12px',
              boxShadow: '0 6px 25px rgba(212, 175, 55, 0.35)',
            }}
          >
            <ShieldCheck size={22} />
            <span>تسجيل الدخول عبر Discord (OAuth2)</span>
          </a>
        </div>

        <div style={{ marginTop: '28px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          تسجيل دخول آمن 100% ومشفر عبر خوادم Discord الرسمية
        </div>
      </div>
    </div>
  );
};
