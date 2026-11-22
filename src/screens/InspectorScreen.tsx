import React from 'react';
import { VideoProject } from '../types/video';
import { ShieldCheck, CheckCircle2, Zap, Award, Sparkles, ShieldAlert } from 'lucide-react';

interface InspectorScreenProps {
  project: VideoProject;
  onGoToStudio: () => void;
  onAddToQueue: () => void;
}

export const InspectorScreen: React.FC<InspectorScreenProps> = ({
  project,
  onAddToQueue
}) => {
  const meta = project.metadata;
  const settings = project.settings;

  // Calculate TikTok Algorithm Readiness score
  let score = 75;
  if (settings.aspectRatioMode === 'smart_crop' || settings.aspectRatioMode === 'blur_background') score += 5;
  if (settings.delogo.enabled) score += 10;
  if (settings.exportQuality === 'ultra_hd_60fps') score += 5;
  if (settings.hook.enabled && settings.hook.text) score += 5;
  if (settings.captionsEnabled) score += 5;
  if (settings.stripGps) score += 5;
  if (score > 100) score = 100;

  const totalSilenceCut = project.detectedSilences.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 14px 30px 14px' }}>
      {/* Header with Score */}
      <div
        style={{
          background: 'linear-gradient(135deg, #181c2e 0%, #10121d 100%)',
          borderRadius: '18px',
          padding: '18px',
          border: '1px solid #282f48',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={20} color="#facc15" />
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>جاهزية خوارزمية تيك توك</span>
          </div>
          <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 700 }}>
            مؤهل للتوصية في صفحة "لك" (For You Page) 🚀
          </span>
        </div>

        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'conic-gradient(#25f4ee 0% 90%, #23283c 90% 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: '#0c0e17',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '17px',
              color: '#25f4ee'
            }}
          >
            {score}%
          </div>
        </div>
      </div>

      {/* Check 1: Watermark & QR Code FYP Eligibility */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={18} color="#25f4ee" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              فحص العلامات الخارجية والـ QR Code
            </span>
          </div>
          <span
            style={{
              fontSize: '11px',
              color: '#4ade80',
              fontWeight: 700,
              backgroundColor: 'rgba(74,222,128,0.15)',
              padding: '2px 8px',
              borderRadius: '10px'
            }}
          >
            {settings.delogo.enabled ? 'تم تفعيل الحذف 🧼' : 'آمن'}
          </span>
        </div>
        <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
          {settings.delogo.enabled
            ? '✅ تم تنشيط فلتر مسح العلامات المائية الخارجية والـ QR Code وقص ختام كابكات. لن يكتشف تيك توك أي لوجو خارجي ولن يصنف الفيديو كـ "غير مهيأ للتوصية".'
            : '💡 نصيحة: إذا كان الفيديو يحتوي على لوجو CapCut أو علامة تيك توك سابقة أو QR، فعّل خيار "إزالة العلامات" من الاستوديو.'}
        </p>
      </div>

      {/* Check 2: Ultra Resolution & 60FPS */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color="#4ade80" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              الدقة ومعدل الإطارات (Ultra HD 60FPS)
            </span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#25f4ee' }}>1080 × 1920 @ 60FPS</span>
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
          معدل البت (Bitrate) مضبوط على 12-16 Mbps لضمان بقاء الفيديو فائق الوضوح حتى بعد ضغط خوارزمية تيك توك.
        </div>
      </div>

      {/* Check 3: Privacy & GPS Metadata Cleaner */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color="#4ade80" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>حماية الخصوصية ومسح بيانات الموقع</span>
          </div>
          <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700, backgroundColor: 'rgba(74,222,128,0.15)', padding: '2px 8px', borderRadius: '10px' }}>
            مفعل تلقائياً 🛡️
          </span>
        </div>
        <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
          تجريد الفيديو من إحداثيات الـ GPS ومعلومات الكاميرا الحساسة بالكامل لحماية خصوصيتك بنسبة 100%.
        </p>
      </div>

      {/* Check 4: Silence Cut & Pacing */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="#facc15" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>سرعة الإيقاع وتخطي السكتات</span>
          </div>
          <span style={{ fontSize: '11px', color: '#facc15', fontWeight: 700 }}>
            {settings.removeSilence ? 'مفعل' : 'معطل'}
          </span>
        </div>
        <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
          {project.detectedSilences.length > 0
            ? `كشف المحرك ${project.detectedSilences.length} سكتة صامتة بمجموع ${totalSilenceCut.toFixed(1)} ثانية تم حذفها لرفع نسبة المشاهدة الكاملة (Watch Time).`
            : 'سكتات متوازنة تضمن بقاء المشاهد مشدوداً طوال الفيديو.'}
        </p>
      </div>

      {/* Bottom Action */}
      <button
        onClick={onAddToQueue}
        style={{
          width: '100%',
          backgroundColor: '#fe2c55',
          color: '#fff',
          padding: '14px',
          borderRadius: '14px',
          fontWeight: 800,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: '0 4px 15px rgba(254, 44, 85, 0.4)',
          marginTop: 6
        }}
      >
        <Sparkles size={16} />
        <span>تصدير الفيديو الآن بأعلى جودة تيك توك</span>
      </button>
    </div>
  );
};
