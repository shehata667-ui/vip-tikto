import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Shield, Eye, EyeOff } from 'lucide-react';
import { VideoSettings, SilenceSegment } from '../types/video';
import { TikTokSafeZone } from './TikTokSafeZone';

interface VideoPlayer916Props {
  videoUrl: string;
  settings: VideoSettings;
  silences?: SilenceSegment[];
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  showSafeZoneDefault?: boolean;
}

export const VideoPlayer916: React.FC<VideoPlayer916Props> = ({
  videoUrl,
  settings,
  silences = [],
  onTimeUpdate,
  showSafeZoneDefault = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showSafeZone, setShowSafeZone] = useState<boolean>(showSafeZoneDefault);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      if (bgVideoRef.current) bgVideoRef.current.pause();
    } else {
      videoRef.current.play();
      if (bgVideoRef.current) bgVideoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);
    if (onTimeUpdate) {
      onTimeUpdate(cur, videoRef.current.duration || 0);
    }

    // Sync background video if blur mode is active
    if (bgVideoRef.current && Math.abs(bgVideoRef.current.currentTime - cur) > 0.3) {
      bgVideoRef.current.currentTime = cur;
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
    if (bgVideoRef.current) {
      bgVideoRef.current.currentTime = time;
    }
  };

  // Find active caption phrase and active word
  const activePhrase = settings.captionsEnabled
    ? settings.captions.find(p => currentTime >= p.start && currentTime <= p.end)
    : null;

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#0a0c14',
        borderRadius: '18px',
        padding: '12px',
        border: '1px solid #1e2235'
      }}
    >
      {/* 9:16 Video Canvas / Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '320px',
          aspectRatio: '9 / 16',
          backgroundColor: '#000',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
          userSelect: 'none'
        }}
        onClick={togglePlay}
      >
        {/* Layer 1: Blur background if selected */}
        {settings.aspectRatioMode === 'blur_background' && (
          <video
            ref={bgVideoRef}
            src={videoUrl}
            muted
            playsInline
            loop
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(22px) brightness(0.65)',
              transform: 'scale(1.2)'
            }}
          />
        )}

        {/* Layer 2: Main Video */}
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          loop
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit:
              settings.aspectRatioMode === 'smart_crop'
                ? 'cover'
                : settings.aspectRatioMode === 'fit_bars'
                ? 'contain'
                : 'contain',
            zIndex: 10
          }}
        />

        {/* Layer 3: Hook Overlay (shown during hook.duration) */}
        {settings.hook.enabled && currentTime <= settings.hook.duration && settings.hook.text && (
          <div
            style={{
              position: 'absolute',
              top: settings.hook.position === 'top' ? '12%' : settings.hook.position === 'center' ? '40%' : '75%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              width: '88%',
              backgroundColor: settings.hook.bgColor || 'rgba(0, 0, 0, 0.85)',
              color: settings.hook.textColor || '#ffffff',
              padding: '12px 16px',
              borderRadius: '14px',
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '18px',
              lineHeight: '1.4',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              border: '2px solid rgba(254, 44, 85, 0.8)',
              animation: 'pulseGlow 2s infinite ease-in-out'
            }}
          >
            🔥 {settings.hook.text}
          </div>
        )}

        {/* Layer 4: Arabic Karaoke Subtitles */}
        {settings.captionsEnabled && activePhrase && (
          <div
            style={{
              position: 'absolute',
              bottom: '22%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              zIndex: 32,
              textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              padding: '8px 14px',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '6px',
                direction: 'rtl'
              }}
            >
              {activePhrase.words.map(w => {
                const isWordActive = currentTime >= w.start && currentTime <= w.end;
                return (
                  <span
                    key={w.id}
                    style={{
                      fontSize: '19px',
                      fontWeight: 800,
                      color: isWordActive
                        ? settings.captionStyle.activeWordColor || '#25f4ee'
                        : settings.captionStyle.normalWordColor || '#ffffff',
                      textShadow: isWordActive
                        ? '0 0 12px rgba(37, 244, 238, 0.9), 1px 1px 2px #000'
                        : '1px 1px 3px #000',
                      transform: isWordActive ? 'scale(1.18)' : 'scale(1)',
                      transition: 'all 0.12s ease-out',
                      padding: '0 2px'
                    }}
                  >
                    {w.word}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Layer 5: Delogo / Watermark & QR Code Removal Mask Overlay */}
        {settings.delogo && settings.delogo.enabled && (
          <div
            style={{
              position: 'absolute',
              top: `${settings.delogo.zone.y}%`,
              left: `${settings.delogo.zone.x}%`,
              width: `${settings.delogo.zone.w}%`,
              height: `${settings.delogo.zone.h}%`,
              zIndex: 34,
              backgroundColor: 'rgba(239, 68, 68, 0.35)',
              backdropFilter: 'blur(10px)',
              border: '2px dashed #ef4444',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              textShadow: '0 1px 2px #000',
              pointerEvents: 'none'
            }}
          >
            إزالة العلامة 🧼
          </div>
        )}

        {/* Layer 6: Text Watermark (Username / Branding) */}
        {settings.watermark.textWatermark.enabled && settings.watermark.textWatermark.text && (
          <div
            style={{
              position: 'absolute',
              zIndex: 35,
              opacity: settings.watermark.textWatermark.opacity || 0.85,
              padding: '4px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              border: '1px solid rgba(255,255,255,0.2)',
              top: settings.watermark.textWatermark.position.includes('top') ? 56 : undefined,
              bottom: settings.watermark.textWatermark.position.includes('bottom') ? 70 : undefined,
              right: settings.watermark.textWatermark.position.includes('right') ? 14 : undefined,
              left: settings.watermark.textWatermark.position.includes('left') ? 14 : undefined,
              transform:
                settings.watermark.textWatermark.position === 'safe-center-bottom'
                  ? 'translateX(-50%)'
                  : undefined
            }}
          >
            <span>🏷️</span>
            <span>{settings.watermark.textWatermark.text}</span>
          </div>
        )}

        {/* Layer 7: Image Logo Watermark */}
        {settings.watermark.imageWatermark.enabled && settings.watermark.imageWatermark.imageUrl && (
          <div
            style={{
              position: 'absolute',
              zIndex: 36,
              opacity: settings.watermark.imageWatermark.opacity || 0.85,
              width: `${settings.watermark.imageWatermark.sizePercent || 15}%`,
              maxWidth: '80px',
              top: settings.watermark.imageWatermark.position.includes('top') ? 56 : undefined,
              bottom: settings.watermark.imageWatermark.position.includes('bottom') ? 70 : undefined,
              right: settings.watermark.imageWatermark.position.includes('right') ? 14 : undefined,
              left: settings.watermark.imageWatermark.position.includes('left') ? 14 : undefined,
              transform:
                settings.watermark.imageWatermark.position === 'safe-center-bottom'
                  ? 'translateX(-50%)'
                  : undefined
            }}
          >
            <img
              src={settings.watermark.imageWatermark.imageUrl}
              alt="Logo"
              style={{
                width: '100%',
                height: 'auto',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))'
              }}
            />
          </div>
        )}

        {/* Layer 6: TikTok Safe Zone Overlay */}
        <TikTokSafeZone show={showSafeZone} />

        {/* Play/Pause Overlay Icon when paused */}
        {!isPlaying && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.25)'
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                backgroundColor: 'rgba(254, 44, 85, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(254, 44, 85, 0.6)'
              }}
            >
              <Play size={28} color="#fff" fill="#fff" style={{ transform: 'translateX(-2px)' }} />
            </div>
          </div>
        )}
      </div>

      {/* Scrubbing & Controls Bar */}
      <div style={{ width: '100%', maxWidth: '320px', marginTop: 12 }}>
        {/* Scrubber slider */}
        <div style={{ position: 'relative', width: '100%', height: '20px', display: 'flex', alignItems: 'center' }}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            style={{
              width: '100%',
              accentColor: '#fe2c55',
              cursor: 'pointer',
              height: '6px',
              backgroundColor: '#1f2438',
              borderRadius: '3px'
            }}
          />
        </div>

        {/* Bottom controls: Time & Safe Zone Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#94a3b8',
            marginTop: 4
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={togglePlay}
              style={{
                background: 'none',
                color: '#fff',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Toggle TikTok Safe Zone */}
          <button
            onClick={() => setShowSafeZone(!showSafeZone)}
            style={{
              backgroundColor: showSafeZone ? '#25f4ee' : '#1e2235',
              color: showSafeZone ? '#000' : '#e2e8f0',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Shield size={14} />
            <span>منطقة أمان تيك توك</span>
            {showSafeZone ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
};
