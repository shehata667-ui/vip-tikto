import React from 'react';
import { Heart, MessageCircle, Bookmark, Share2, Music, Search, Plus } from 'lucide-react';

interface TikTokSafeZoneProps {
  show: boolean;
  username?: string;
  captionText?: string;
}

export const TikTokSafeZone: React.FC<TikTokSafeZoneProps> = ({
  show,
  username = '@tiktok_creator',
  captionText = 'فيديو جديد مجهز بأعلى جودة لتيك توك 🚀✨ #اكسبلور #تيك_توك #foryou'
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 12px 20px 12px',
        boxShadow: 'inset 0 0 0 2px rgba(37, 244, 238, 0.4)'
      }}
    >
      {/* Safe zone boundary label */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(37, 244, 238, 0.85)',
          color: '#000',
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}
      >
        قناع منطقة أمان تيك توك (تجنب أزرار التطبيق)
      </div>

      {/* Top Bar: Search and Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24,
          opacity: 0.85
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#fff', fontSize: '15px', fontWeight: 600 }}>
          <span style={{ opacity: 0.6 }}>أتابعه</span>
          <span style={{ borderBottom: '2px solid #fff', paddingBottom: 2 }}>لك (For You)</span>
        </div>
        <Search size={22} color="#fff" />
      </div>

      {/* Middle/Bottom Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
        {/* Left / Bottom Details: Username, Caption & Sound */}
        <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'right' }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>{username}</div>
          <div style={{ color: '#f1f5f9', fontSize: '13px', lineHeight: '1.3', direction: 'rtl' }}>
            {captionText}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0', fontSize: '12px' }}>
            <Music size={13} />
            <span>الصوت الأصلي - {username}</span>
          </div>
        </div>

        {/* Right Rail: Profile, Like, Comment, Bookmark, Share, Sound Disc */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {/* Avatar with plus button */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '1.5px solid #fff',
                backgroundColor: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}
            >
              👤
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#fe2c55',
                borderRadius: '50%',
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={12} color="#fff" strokeWidth={3} />
            </div>
          </div>

          {/* Like */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Heart size={30} color="#fff" fill="#fff" />
            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>128.4K</span>
          </div>

          {/* Comment */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <MessageCircle size={30} color="#fff" fill="#fff" />
            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>1,492</span>
          </div>

          {/* Bookmark */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Bookmark size={30} color="#fff" fill="#fff" />
            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>14.2K</span>
          </div>

          {/* Share */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Share2 size={30} color="#fff" />
            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>مشاركة</span>
          </div>

          {/* Rotating Sound Disc */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              border: '6px solid #0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#fff' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
