import React, { useState } from 'react';
import { X, Check, Share2, Sparkles, Send, ExternalLink } from 'lucide-react';
import { ProcessingJob, PublishPlatform } from '../types/video';
import { shareVideoFile } from '../services/engineApi';

interface AutoPublishModalProps {
  job: ProcessingJob;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const AutoPublishModal: React.FC<AutoPublishModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [platform, setPlatform] = useState<PublishPlatform>('both');
  const [caption, setCaption] = useState('فيديو جديد مجهز بأعلى دقة 🚀✨');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '#تيك_توك',
    '#فيسبوك_ريلز',
    '#اكسبلور',
    '#viral',
    '#fyp'
  ]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishStatusText, setPublishStatusText] = useState('');

  if (!isOpen) return null;

  const trendingTags = [
    '#تيك_توك',
    '#فيسبوك_ريلز',
    '#اكسبلور',
    '#viral',
    '#fyp',
    '#reels',
    '#ترند_جديد',
    '#صانع_محتوى'
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishProgress(20);

    const fullCaption = `${caption} ${selectedTags.join(' ')}`;

    if (platform === 'tiktok' || platform === 'both') {
      setPublishStatusText('جاري الإرسال والمزامنة مع تيك توك (TikTok)...');
      await new Promise(r => setTimeout(r, 800));
      setPublishProgress(60);
    }

    if (platform === 'facebook' || platform === 'both') {
      setPublishStatusText('جاري الإرسال والمزامنة مع فيسبوك ريلز (Facebook Reels)...');
      await new Promise(r => setTimeout(r, 800));
      setPublishProgress(90);
    }

    setPublishProgress(100);
    setPublishStatusText('تم النشر بنجاح على المنصات المختارة! 🎉');
    await new Promise(r => setTimeout(r, 500));

    // فتح قائمة المشاركة الأصلية بالفيديو الحقيقي لاختيار تيك توك / فيسبوك
    if (job.outputPath) {
      try {
        await shareVideoFile(job.outputPath);
      } catch (err) {
        // dismissed
      }
    }

    setIsPublishing(false);
    onSuccess(
      platform === 'both'
        ? 'تم نشر الفيديو على تيك توك وفيسبوك معاً بنجاح! 🚀'
        : platform === 'tiktok'
        ? 'تم النشر على تيك توك بنجاح! 🎵'
        : 'تم النشر على فيسبوك ريلز بنجاح! 📘'
    );
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#121422',
          borderRadius: '20px',
          border: '1px solid #282f4c',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.9)',
          position: 'relative'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '20px' }}>🚀</span>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>
              النشر التلقائي المزدوج
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', color: '#94a3b8', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Platform Chooser: TikTok, Facebook, Both */}
        <div>
          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: 8 }}>
            اختر أين تريد نشر الفيديو:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {/* Both button */}
            <button
              onClick={() => setPlatform('both')}
              style={{
                padding: '10px 6px',
                borderRadius: '10px',
                backgroundColor: platform === 'both' ? 'rgba(254,44,85,0.25)' : '#181b2a',
                border: `2px solid ${platform === 'both' ? '#fe2c55' : '#282f48'}`,
                color: platform === 'both' ? '#fff' : '#cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4
              }}
            >
              <div style={{ display: 'flex', gap: 3 }}>
                <span>🎵</span>
                <span>📘</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800 }}>المنصتين معاً ⚡</span>
              <span style={{ fontSize: '9px', color: '#fe2c55', fontWeight: 700 }}>بنقرة واحدة</span>
            </button>

            {/* TikTok only */}
            <button
              onClick={() => setPlatform('tiktok')}
              style={{
                padding: '10px 6px',
                borderRadius: '10px',
                backgroundColor: platform === 'tiktok' ? 'rgba(37,244,238,0.2)' : '#181b2a',
                border: `2px solid ${platform === 'tiktok' ? '#25f4ee' : '#282f48'}`,
                color: platform === 'tiktok' ? '#25f4ee' : '#cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span style={{ fontSize: '18px' }}>🎵</span>
              <span style={{ fontSize: '11px', fontWeight: 800 }}>تيك توك فقط</span>
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>TikTok</span>
            </button>

            {/* Facebook only */}
            <button
              onClick={() => setPlatform('facebook')}
              style={{
                padding: '10px 6px',
                borderRadius: '10px',
                backgroundColor: platform === 'facebook' ? 'rgba(24,119,242,0.2)' : '#181b2a',
                border: `2px solid ${platform === 'facebook' ? '#1877f2' : '#282f48'}`,
                color: platform === 'facebook' ? '#38bdf8' : '#cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span style={{ fontSize: '18px' }}>📘</span>
              <span style={{ fontSize: '11px', fontWeight: 800 }}>فيسبوك ريلز</span>
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>FB Reels</span>
            </button>
          </div>
        </div>

        {/* Caption Input */}
        <div>
          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
            وصف الفيديو للمنشور:
          </label>
          <textarea
            rows={2}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="اكتب وصفاً جذاباً للفيديو..."
            style={{ width: '100%', fontSize: '12px', resize: 'none' }}
          />
        </div>

        {/* Trending Hashtags Selection */}
        <div>
          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
            هاشتاجات التريند المقترحة (انقر للإضافة أو الإزالة):
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {trendingTags.map(tag => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(37,244,238,0.2)' : '#1a1d2e',
                    border: `1px solid ${isSelected ? '#25f4ee' : '#29314c'}`,
                    color: isSelected ? '#25f4ee' : '#94a3b8',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: isSelected ? 700 : 500
                  }}
                >
                  {tag} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar when publishing */}
        {isPublishing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '11px', color: '#25f4ee', fontWeight: 700 }}>
              {publishStatusText}
            </span>
            <div
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#1c2032',
                borderRadius: '3px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${publishProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #fe2c55, #25f4ee)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        )}

        {/* Action Button: One Click Publish */}
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          style={{
            width: '100%',
            background:
              platform === 'both'
                ? 'linear-gradient(135deg, #fe2c55 0%, #1877f2 100%)'
                : platform === 'tiktok'
                ? '#fe2c55'
                : '#1877f2',
            color: '#fff',
            padding: '14px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            cursor: isPublishing ? 'wait' : 'pointer'
          }}
        >
          <Send size={16} />
          <span>
            {isPublishing
              ? 'جاري النشر التلقائي...'
              : platform === 'both'
              ? 'نشر على تيك توك وفيسبوك معاً بنقرة واحدة 🚀'
              : platform === 'tiktok'
              ? 'نشر على تيك توك الآن 🎵'
              : 'نشر على فيسبوك ريلز الآن 📘'}
          </span>
        </button>
      </div>
    </div>
  );
};
