import React from 'react';
import { Upload, Sparkles, Video, ShieldCheck, Zap, Scissors, Type, ArrowLeft } from 'lucide-react';
import { VideoProject } from '../types/video';

interface HomeScreenProps {
  onPickVideo: () => void;
  onAutoMagic: () => void;
  activeProject: VideoProject | null;
  onGoToStudio: () => void;
  isEngineOnline: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onPickVideo,
  onAutoMagic,
  activeProject,
  onGoToStudio,
  isEngineOnline
}) => {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '30px' }}>
      {/* Top Welcome Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #181b2a 0%, #0d0f17 100%)',
          borderRadius: '20px',
          padding: '20px',
          border: '1px solid #282e44',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: -20,
            width: 100,
            height: 100,
            background: 'radial-gradient(circle, rgba(254,44,85,0.25) 0%, transparent 70%)',
            borderRadius: '50%'
          }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '24px' }}>🎬</span>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>صانع تيك توك</h1>
          </div>
          
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '11px',
              backgroundColor: isEngineOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isEngineOnline ? '#4ade80' : '#f87171',
              padding: '4px 10px',
              borderRadius: '20px',
              border: `1px solid ${isEngineOnline ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isEngineOnline ? '#4ade80' : '#f87171' }} />
            <span>{isEngineOnline ? 'المحرك جاهز على الهاتف' : 'المحرك غير متاح'}</span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
          جهّز فيديوهاتك لمقاس تيك توك (9:16) بضغطة زر: كابشن عربي متزامن، حذف السكتات، هوك جذاب، وحماية كاملة لخصوصيتك دون الحاجة لسيرفر خارجي.
        </p>

        {/* Action: Select Video */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onPickVideo}
            style={{
              width: '100%',
              backgroundColor: '#fe2c55',
              color: '#fff',
              padding: '14px',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 15px rgba(254, 44, 85, 0.4)'
            }}
          >
            <Upload size={18} />
            <span>اختر فيديو من هاتفك</span>
          </button>

        </div>
      </div>

      {/* Active Project Card (if loaded) */}
      {activeProject && (
        <div
          style={{
            backgroundColor: '#12141f',
            borderRadius: '16px',
            padding: '14px',
            border: '1px solid #fe2c55',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fe2c55' }}>⚡ الفيديو الجاري تجهيزه</span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {Math.round(activeProject.metadata.duration)} ثانية
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '10px',
                backgroundColor: '#000',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              <video src={activeProject.objectUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {activeProject.metadata.filename}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {activeProject.metadata.width}x{activeProject.metadata.height} • {activeProject.metadata.fps} إطار/ث
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onAutoMagic}
              style={{
                flex: 1,
                backgroundColor: 'linear-gradient(135deg, #25f4ee 0%, #00bcd4 100%)',
                background: '#25f4ee',
                color: '#000',
                padding: '10px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5
              }}
            >
              <Sparkles size={16} />
              <span>تجهيز سحري بنقرة</span>
            </button>

            <button
              onClick={onGoToStudio}
              style={{
                flex: 1,
                backgroundColor: '#1f2438',
                color: '#fff',
                padding: '10px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5
              }}
            >
              <span>فتح الاستوديو</span>
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Feature Highlights Grid */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>
          مميزات التجهيز التلقائي
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div
            style={{
              backgroundColor: '#10121a',
              padding: '12px',
              borderRadius: '14px',
              border: '1px solid #1e2235',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fe2c55' }}>
              <Video size={18} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>أبعاد تيك توك 9:16</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
              قص ذكي أو خلفية ضبابية للأفقي دون تشويه الصورة
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#10121a',
              padding: '12px',
              borderRadius: '14px',
              border: '1px solid #1e2235',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#25f4ee' }}>
              <Scissors size={18} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>حذف السكتات ⚡</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
              مسح فترات الصمت لتسريع إيقاع الفيديو وزيادة التفاعل
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#10121a',
              padding: '12px',
              borderRadius: '14px',
              border: '1px solid #1e2235',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#facc15' }}>
              <Type size={18} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>كابشن كاريوكي</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
              تلوين الكلمة المنطوقة لحظة بلحظة باللغة العربية
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#10121a',
              padding: '12px',
              borderRadius: '14px',
              border: '1px solid #1e2235',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80' }}>
              <ShieldCheck size={18} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>درع الخصوصية</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
              مسح إحداثيات الـ GPS والبيانات الحساسة بالكامل
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
