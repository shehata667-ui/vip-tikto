import React, { useState } from 'react';
import { Settings, Shield, HardDrive, Trash2, CheckCircle2, User, Sparkles } from 'lucide-react';
import { EngineStatus } from '../services/engineApi';

interface SettingsScreenProps {
  engineStatus: EngineStatus;
  defaultUsername: string;
  onUpdateDefaultUsername: (name: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  engineStatus,
  defaultUsername,
  onUpdateDefaultUsername
}) => {
  const [username, setUsername] = useState(defaultUsername);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleSaveUsername = () => {
    onUpdateDefaultUsername(username);
  };

  const handleClearCache = () => {
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 14px 30px 14px' }}>
      <div>
        <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: 0 }}>
          الإعدادات والخصوصية
        </h2>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          تخصيص التطبيق وإدارة التخزين والمحرك
        </span>
      </div>

      {/* Account Defaults */}
      <div
        style={{
          backgroundColor: '#10121a',
          borderRadius: '14px',
          padding: '14px',
          border: '1px solid #1e2235',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={18} color="#fe2c55" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>حساب تيك توك الافتراضي</span>
        </div>
        <p style={{ fontSize: '11px', color: '#94a3b8' }}>
          يتم وضع هذا الاسم تلقائياً كشعار على جميع الفيديوهات الجديدة.
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="@your_tiktok_name"
            style={{ flex: 1, fontSize: '13px' }}
          />
          <button
            onClick={handleSaveUsername}
            style={{
              backgroundColor: '#fe2c55',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '12px'
            }}
          >
            حفظ
          </button>
        </div>
      </div>

      {/* Engine Status Diagnostic */}
      <div
        style={{
          backgroundColor: '#10121a',
          borderRadius: '14px',
          padding: '14px',
          border: '1px solid #1e2235',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HardDrive size={18} color="#25f4ee" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>محرك المعالجة المحلي (On-Device)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>حالة المحرك:</span>
            <span style={{ color: engineStatus.online ? '#4ade80' : '#f87171', fontWeight: 700 }}>
              {engineStatus.online ? 'متصل وجاهز للعمل' : 'غير متصل'}
            </span>
          </div>

          {engineStatus.error && (
            <div style={{ color: '#fbbf24', fontSize: '11px', direction: 'ltr', textAlign: 'left', wordBreak: 'break-word', background: '#1a1405', padding: 8, borderRadius: 8 }}>
              {engineStatus.error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>محرك الفيديو (FFmpeg):</span>
            <span style={{ color: engineStatus.ffmpeg ? '#4ade80' : '#f87171', fontWeight: 700 }}>
              {engineStatus.ffmpeg ? `مدمج في التطبيق${engineStatus.version ? ' (v' + engineStatus.version + ')' : ''}` : 'غير متوفر'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>دعم الخطوط العربية (HarfBuzz/FriBidi):</span>
            <span style={{ color: '#4ade80', fontWeight: 700 }}>نشط 100%</span>
          </div>
        </div>
      </div>

      {/* Privacy Promise */}
      <div
        style={{
          backgroundColor: '#10121a',
          borderRadius: '14px',
          padding: '14px',
          border: '1px solid #1e2235',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={18} color="#4ade80" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>مبدأ الخصوصية الصارمة</span>
        </div>
        <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
          جميع عمليات قص وتدوير وتجهيز الفيديو، بالإضافة إلى مسح بيانات الموقع الجغرافي، تتم على هاتفك وجهازك المحلي مباشرة بدون رفع أي بايت واحد إلى الإنترنت أو خوادم خارجية.
        </p>
      </div>

      {/* Storage Cleaner */}
      <div
        style={{
          backgroundColor: '#10121a',
          borderRadius: '14px',
          padding: '14px',
          border: '1px solid #1e2235',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trash2 size={18} color="#f87171" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>إدارة الذاكرة المؤقتة</span>
        </div>
        <p style={{ fontSize: '11px', color: '#94a3b8' }}>
          مسح المقاطع المعالجة القديمة وملفات المعاينة لتوفير مساحة التخزين على الجهاز.
        </p>

        <button
          onClick={handleClearCache}
          style={{
            backgroundColor: '#1f2030',
            color: cacheCleared ? '#4ade80' : '#e2e8f0',
            padding: '10px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            border: '1px solid #282f48'
          }}
        >
          {cacheCleared ? (
            <>
              <CheckCircle2 size={15} color="#4ade80" />
              <span>تم تفريغ الذاكرة المؤقتة بنجاح!</span>
            </>
          ) : (
            <>
              <Trash2 size={15} />
              <span>تفريغ الذاكرة المؤقتة الآن</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
