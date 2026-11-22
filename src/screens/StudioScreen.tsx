import React, { useState, useRef } from 'react';
import { VideoProject, AspectRatioMode } from '../types/video';
import { VideoPlayer916 } from '../components/VideoPlayer916';
import { autoDistributeCaptions } from '../services/overlayRenderer';
import { Scissors, Type, Sparkles, Image, Send, ShieldAlert, Upload, SlidersHorizontal } from 'lucide-react';

interface StudioScreenProps {
  project: VideoProject;
  onUpdateProject: (updated: VideoProject) => void;
  onAddToQueue: () => void;
  onDetectSilences: () => Promise<void>;
  isDetectingSilence: boolean;
}

type StudioTab = 'crop_trim' | 'delogo' | 'branding' | 'hook' | 'captions' | 'quality';

export const StudioScreen: React.FC<StudioScreenProps> = ({
  project,
  onUpdateProject,
  onAddToQueue,
  onDetectSilences,
  isDetectingSilence
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('crop_trim');
  const [editingWord, setEditingWord] = useState<{ phraseId: string; wordId: string; text: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [captionText, setCaptionText] = useState('');

  const settings = project.settings;

  const updateSettings = (partial: Partial<typeof settings>) => {
    onUpdateProject({
      ...project,
      settings: {
        ...project.settings,
        ...partial
      }
    });
  };

  const hookPresets = [
    '🔥 سر لا يفوتك لو بتعمل كدة!',
    '⚠️ وقف فوراً قبل ما تندم!',
    '✨ أسرع وأسهل طريقة شفتها',
    '💡 معلومة هتصدمك بنسبة 90%'
  ];

  const handleWordEditSave = () => {
    if (!editingWord) return;
    const newCaptions = settings.captions.map(phrase => {
      if (phrase.id !== editingWord.phraseId) return phrase;
      return {
        ...phrase,
        words: phrase.words.map(w => (w.id === editingWord.wordId ? { ...w, word: editingWord.text } : w))
      };
    });
    updateSettings({ captions: newCaptions });
    setEditingWord(null);
  };

  // Image logo picker handler
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        updateSettings({
          watermark: {
            ...settings.watermark,
            imageWatermark: {
              ...settings.watermark.imageWatermark,
              enabled: true,
              imageUrl: dataUrl,
              imageFileName: file.name
            }
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '12px 14px 30px 14px' }}>
      {/* Top action header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>استوديو التجهيز الذكي</span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {project.metadata.filename} • {Math.round(project.metadata.duration)} ث
          </span>
        </div>

        <button
          onClick={onAddToQueue}
          style={{
            backgroundColor: '#fe2c55',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 15px rgba(254, 44, 85, 0.4)'
          }}
        >
          <Send size={15} />
          <span>تجهيز وتصدير 🚀</span>
        </button>
      </div>

      {/* 9:16 Video Preview Player */}
      <VideoPlayer916
        videoUrl={project.objectUrl}
        settings={project.settings}
        silences={project.detectedSilences}
      />

      {/* Scrollable Sub-Tabs Selector */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#121420',
          borderRadius: '12px',
          padding: '4px',
          border: '1px solid #1e2235',
          overflowX: 'auto',
          gap: 4
        }}
      >
        {[
          { id: 'crop_trim', label: 'الأبعاد والقص', icon: Scissors },
          { id: 'delogo', label: 'إزالة العلامات 🧼', icon: ShieldAlert },
          { id: 'branding', label: 'الشعار واللوجو', icon: Image },
          { id: 'hook', label: 'الهوك 🔥', icon: Sparkles },
          { id: 'captions', label: 'الكابشن', icon: Type },
          { id: 'quality', label: 'الجودة والدقة', icon: SlidersHorizontal }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as StudioTab)}
              style={{
                flex: '0 0 auto',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: isActive ? 800 : 500,
                backgroundColor: isActive ? '#fe2c55' : 'transparent',
                color: isActive ? '#fff' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Crop, Trim & Silence */}
      {activeTab === 'crop_trim' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Aspect Ratio Mode Selection */}
          <div style={{ backgroundColor: '#10121a', padding: '14px', borderRadius: '14px', border: '1px solid #1e2235' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: 10 }}>
              نمط تحويل الفيديو لمقاس 9:16 تيك توك
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { id: 'smart_crop', label: 'قص ذكي للمنتصف', desc: 'ملء الشاشة بالكامل' },
                { id: 'blur_background', label: 'خلفية ضبابية', desc: 'بدون اقتطاع الحواف' },
                { id: 'fit_bars', label: 'ملاءمة كلاسيكية', desc: 'شريطين بالأسود' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => updateSettings({ aspectRatioMode: opt.id as AspectRatioMode })}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    backgroundColor: settings.aspectRatioMode === opt.id ? 'rgba(254, 44, 85, 0.2)' : '#181b28',
                    border: `1.5px solid ${settings.aspectRatioMode === opt.id ? '#fe2c55' : '#282d42'}`,
                    color: settings.aspectRatioMode === opt.id ? '#fe2c55' : '#cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{opt.label}</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Silence Removal Automation Card */}
          <div style={{ backgroundColor: '#10121a', padding: '14px', borderRadius: '14px', border: '1px solid #1e2235' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scissors size={16} color="#25f4ee" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>حذف السكتات والفراغات الصوتية</span>
              </div>
              <input
                type="checkbox"
                checked={settings.removeSilence}
                onChange={e => updateSettings({ removeSilence: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#25f4ee', cursor: 'pointer' }}
              />
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, marginBottom: 12 }}>
              يقوم المحرك الذكي بكشف لحظات التوقف والصمت وقصها لرفع إيقاع الفيديو وزيادة نسبة إكمال المشاهدة (Watch Time).
            </p>

            <button
              onClick={onDetectSilences}
              disabled={isDetectingSilence}
              style={{
                width: '100%',
                backgroundColor: '#1b233a',
                color: '#25f4ee',
                padding: '10px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                border: '1px solid rgba(37, 244, 238, 0.3)'
              }}
            >
              {isDetectingSilence ? (
                <span>جاري فحص الترددات الصوتية...</span>
              ) : (
                <>
                  <Scissors size={14} />
                  <span>
                    {project.detectedSilences.length > 0
                      ? `تم كشف ${project.detectedSilences.length} سكتة (وفرت ${project.detectedSilences.reduce((acc, s) => acc + s.duration, 0).toFixed(1)} ث)`
                      : 'فحص وكشف السكتات الآن ⚡'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Watermark & QR Code Cleaner (تيك توك خوارزمية التوصية) */}
      {activeTab === 'delogo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ backgroundColor: '#10121a', padding: '14px', borderRadius: '14px', border: '1px solid #1e2235' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={18} color="#ef4444" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  إزالة العلامات المائية الأصلية والـ QR Code
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.delogo.enabled}
                onChange={e => updateSettings({ delogo: { ...settings.delogo, enabled: e.target.checked } })}
                style={{ width: 18, height: 18, accentColor: '#ef4444', cursor: 'pointer' }}
              />
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5, marginBottom: 12 }}>
              🛡️ **مهم جداً لتيك توك:** خوارزمية تيك توك ترصد العلامات المائية لبرامج المونتاج الأخرى (مثل CapCut أو InShot) أو باركودات QR Code وتضع الفيديو في خانة **"غير مهيأ للتوصية" (Not Eligible for FYP)**. تفعيل هذه الأداة يمسحها تلقائياً.
            </p>

            {settings.delogo.enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Presets */}
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    حدد موضع العلامة المائية الأصلية لمسحها:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { id: 'bottom-right', label: 'أسفل اليمين (CapCut/تيك توك)', x: 74, y: 84, w: 24, h: 14 },
                      { id: 'top-left', label: 'أعلى اليسار', x: 2, y: 2, w: 26, h: 14 },
                      { id: 'top-right', label: 'أعلى اليمين', x: 74, y: 2, w: 24, h: 14 },
                      { id: 'qr-code-center', label: 'باركود QR Code بالمنتصف', x: 35, y: 40, w: 30, h: 20 }
                    ].map(p => {
                      const isSelected = settings.delogo.preset === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() =>
                            updateSettings({
                              delogo: {
                                ...settings.delogo,
                                preset: p.id as any,
                                zone: { x: p.x, y: p.y, w: p.w, h: p.h }
                              }
                            })
                          }
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.2)' : '#181b28',
                            border: `1.5px solid ${isSelected ? '#ef4444' : '#282d42'}`,
                            color: isSelected ? '#ef4444' : '#cbd5e1',
                            fontSize: '11px',
                            fontWeight: 700,
                            textAlign: 'right'
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Remove Outro Screen Toggle */}
                <div
                  style={{
                    backgroundColor: '#161928',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #252b44',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                      قص ختام CapCut التلقائي (آخر ثانيتين)
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      يحذف شاشة النهاية السوداء التي تحمل لوجو كابكات
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.delogo.removeCapcutOutro}
                    onChange={e =>
                      updateSettings({
                        delogo: { ...settings.delogo, removeCapcutOutro: e.target.checked }
                      })
                    }
                    style={{ width: 16, height: 16, accentColor: '#ef4444', cursor: 'pointer' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Dual Branding (Text Name + Image Logo) */}
      {activeTab === 'branding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Card A: Text Watermark (Account Name) */}
          <div style={{ backgroundColor: '#10121a', padding: '14px', borderRadius: '14px', border: '1px solid #1e2235' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '16px' }}>✍️</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  1. الشعار النصي (اسم الحساب / التوقيع)
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.watermark.textWatermark.enabled}
                onChange={e =>
                  updateSettings({
                    watermark: {
                      ...settings.watermark,
                      textWatermark: {
                        ...settings.watermark.textWatermark,
                        enabled: e.target.checked
                      }
                    }
                  })
                }
                style={{ width: 18, height: 18, accentColor: '#fe2c55', cursor: 'pointer' }}
              />
            </div>

            {settings.watermark.textWatermark.enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    اسم الحساب أو النص:
                  </label>
                  <input
                    type="text"
                    value={settings.watermark.textWatermark.text}
                    onChange={e =>
                      updateSettings({
                        watermark: {
                          ...settings.watermark,
                          textWatermark: {
                            ...settings.watermark.textWatermark,
                            text: e.target.value
                          }
                        }
                      })
                    }
                    placeholder="@your_username"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    الموضع:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { id: 'top-left', label: 'أعلى اليسار (آمن)' },
                      { id: 'top-right', label: 'أعلى اليمين' },
                      { id: 'bottom-left', label: 'أسفل اليسار' },
                      { id: 'safe-center-bottom', label: 'أسفل الوسط' }
                    ].map(pos => (
                      <button
                        key={pos.id}
                        onClick={() =>
                          updateSettings({
                            watermark: {
                              ...settings.watermark,
                              textWatermark: {
                                ...settings.watermark.textWatermark,
                                position: pos.id as any
                              }
                            }
                          })
                        }
                        style={{
                          padding: '6px 8px',
                          borderRadius: '8px',
                          backgroundColor:
                            settings.watermark.textWatermark.position === pos.id ? '#fe2c55' : '#1c2030',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card B: Image Logo Watermark */}
          <div style={{ backgroundColor: '#10121a', padding: '14px', borderRadius: '14px', border: '1px solid #1e2235' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '16px' }}>🖼️</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  2. شعار بصورة مخصصة (لوجو من جهازك)
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.watermark.imageWatermark.enabled}
                onChange={e =>
                  updateSettings({
                    watermark: {
                      ...settings.watermark,
                      imageWatermark: {
                        ...settings.watermark.imageWatermark,
                        enabled: e.target.checked
                      }
                    }
                  })
                }
                style={{ width: 18, height: 18, accentColor: '#25f4ee', cursor: 'pointer' }}
              />
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleLogoFileChange}
            />

            {settings.watermark.imageWatermark.enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Image upload button & Preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    style={{
                      backgroundColor: '#1b233a',
                      color: '#25f4ee',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      border: '1px solid rgba(37,244,238,0.3)'
                    }}
                  >
                    <Upload size={14} />
                    <span>اختر صورة اللوجو من الجهاز</span>
                  </button>

                  {settings.watermark.imageWatermark.imageUrl && (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid #25f4ee'
                      }}
                    >
                      <img
                        src={settings.watermark.imageWatermark.imageUrl}
                        alt="Logo Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    موضع اللوجو الصوري:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { id: 'top-right', label: 'أعلى اليمين (موصى به للوجو)' },
                      { id: 'top-left', label: 'أعلى اليسار' },
                      { id: 'bottom-left', label: 'أسفل اليسار' },
                      { id: 'safe-center-bottom', label: 'أسفل الوسط' }
                    ].map(pos => (
                      <button
                        key={pos.id}
                        onClick={() =>
                          updateSettings({
                            watermark: {
                              ...settings.watermark,
                              imageWatermark: {
                                ...settings.watermark.imageWatermark,
                                position: pos.id as any
                              }
                            }
                          })
                        }
                        style={{
                          padding: '6px 8px',
                          borderRadius: '8px',
                          backgroundColor:
                            settings.watermark.imageWatermark.position === pos.id ? '#25f4ee' : '#1c2030',
                          color: settings.watermark.imageWatermark.position === pos.id ? '#000' : '#fff',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Percent */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: 4 }}>
                    <span>حجم اللوجو بالنسبة للشاشة:</span>
                    <span style={{ fontWeight: 700, color: '#25f4ee' }}>
                      {settings.watermark.imageWatermark.sizePercent || 15}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={30}
                    step={1}
                    value={settings.watermark.imageWatermark.sizePercent || 15}
                    onChange={e =>
                      updateSettings({
                        watermark: {
                          ...settings.watermark,
                          imageWatermark: {
                            ...settings.watermark.imageWatermark,
                            sizePercent: parseInt(e.target.value)
                          }
                        }
                      })
                    }
                    style={{ width: '100%', accentColor: '#25f4ee' }}
                  />
                </div>
              </div>
            )}

            <div style={{ fontSize: '10px', color: '#64748b', marginTop: 8 }}>
              💡 يمكنك تشغيل الاسم النصي فقط، أو اللوجو الصوري فقط، أو كليهما معاً في نفس الوقت.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Hook Creator */}
      {activeTab === 'hook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ backgroundColor: '#10121a', padding: '14px', borderRadius: '14px', border: '1px solid #1e2235' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>تفعيل نص الهوك التشويقي</span>
              <input
                type="checkbox"
                checked={settings.hook.enabled}
                onChange={e => updateSettings({ hook: { ...settings.hook, enabled: e.target.checked } })}
                style={{ width: 18, height: 18, accentColor: '#fe2c55', cursor: 'pointer' }}
              />
            </div>

            {settings.hook.enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    نص الهوك (يظهر في أول ثواني الفيديو)
                  </label>
                  <input
                    type="text"
                    value={settings.hook.text}
                    onChange={e => updateSettings({ hook: { ...settings.hook, text: e.target.value } })}
                    placeholder="مثال: سر خطير لا يفوتك لو بتعمل كدة..."
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    قوالب جاهزة سريعة:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {hookPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => updateSettings({ hook: { ...settings.hook, text: preset } })}
                        style={{
                          backgroundColor: '#1c2030',
                          color: '#e2e8f0',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          border: '1px solid #282f48'
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: 4 }}>
                    <span>مدة ظهور الهوك:</span>
                    <span style={{ fontWeight: 700, color: '#fe2c55' }}>{settings.hook.duration} ثوانٍ</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    step={0.5}
                    value={settings.hook.duration}
                    onChange={e => updateSettings({ hook: { ...settings.hook, duration: parseFloat(e.target.value) } })}
                    style={{ width: '100%', accentColor: '#fe2c55' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Arabic Karaoke Captions */}
      {activeTab === 'captions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ backgroundColor: '#10121a', padding: '14px', borderRadius: '14px', border: '1px solid #1e2235' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Type size={16} color="#facc15" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>الكابشن العربي ونمط الكاريوكي</span>
              </div>
              <input
                type="checkbox"
                checked={settings.captionsEnabled}
                onChange={e => updateSettings({ captionsEnabled: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#facc15', cursor: 'pointer' }}
              />
            </div>

            {settings.captionsEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    لون تمييز الكلمة الحالية (Karaoke Highlight):
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { color: '#25f4ee', label: 'سيان تيك توك' },
                      { color: '#facc15', label: 'أصفر فاقع' },
                      { color: '#fe2c55', label: 'وردي نيون' },
                      { color: '#4ade80', label: 'أخضر ليموني' }
                    ].map(c => (
                      <button
                        key={c.color}
                        onClick={() =>
                          updateSettings({
                            captionStyle: { ...settings.captionStyle, activeWordColor: c.color }
                          })
                        }
                        style={{
                          flex: 1,
                          padding: '6px 4px',
                          borderRadius: '8px',
                          backgroundColor:
                            settings.captionStyle.activeWordColor === c.color ? c.color : '#1c2030',
                          color: settings.captionStyle.activeWordColor === c.color ? '#000' : '#fff',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: `1.5px solid ${c.color}`
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    اكتب أو الصق نص الكلام (يُوزَّع تلقائياً على مدة الفيديو):
                  </label>
                  <textarea
                    value={captionText}
                    onChange={e => setCaptionText(e.target.value)}
                    rows={3}
                    placeholder="اكتب هنا ما يُقال في الفيديو..."
                    style={{
                      width: '100%',
                      backgroundColor: '#161926',
                      color: '#fff',
                      border: '1px solid #23283c',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '13px',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                  <button
                    onClick={() =>
                      updateSettings({
                        captions: autoDistributeCaptions(captionText, settings.trimStart, settings.trimEnd)
                      })
                    }
                    disabled={!captionText.trim()}
                    style={{
                      marginTop: 8,
                      width: '100%',
                      padding: '9px',
                      borderRadius: '10px',
                      backgroundColor: captionText.trim() ? '#facc15' : '#2a2f45',
                      color: captionText.trim() ? '#000' : '#64748b',
                      fontWeight: 800,
                      fontSize: '12px'
                    }}
                  >
                    توزيع النص تلقائياً كعبارات كاريوكي
                  </button>
                  <p style={{ fontSize: '10px', color: '#64748b', marginTop: 6, lineHeight: 1.5 }}>
                    التوقيت تقديري حسب طول الكلمات. التفريغ الصوتي التلقائي غير متوفر بدون إنترنت.
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    العبارات والكلمات (انقر على أي كلمة لتعديلها):
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '180px', overflowY: 'auto' }}>
                    {settings.captions.map(phrase => (
                      <div
                        key={phrase.id}
                        style={{
                          backgroundColor: '#161926',
                          padding: '10px',
                          borderRadius: '10px',
                          border: '1px solid #23283c'
                        }}
                      >
                        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: 4 }}>
                          {phrase.start.toFixed(1)}ث ⬅️ {phrase.end.toFixed(1)}ث
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {phrase.words.map(w => (
                            <button
                              key={w.id}
                              onClick={() =>
                                setEditingWord({ phraseId: phrase.id, wordId: w.id, text: w.word })
                              }
                              style={{
                                backgroundColor: '#21263a',
                                color: '#e2e8f0',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                border: '1px solid #333b5c'
                              }}
                            >
                              {w.word}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {editingWord && (
                  <div
                    style={{
                      backgroundColor: '#1f2438',
                      padding: '12px',
                      borderRadius: '10px',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center'
                    }}
                  >
                    <input
                      type="text"
                      value={editingWord.text}
                      onChange={e => setEditingWord({ ...editingWord, text: e.target.value })}
                      style={{ flex: 1, fontSize: '13px' }}
                    />
                    <button
                      onClick={handleWordEditSave}
                      style={{
                        backgroundColor: '#22c55e',
                        color: '#000',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}
                    >
                      حفظ
                    </button>
                    <button
                      onClick={() => setEditingWord(null)}
                      style={{
                        backgroundColor: '#475569',
                        color: '#fff',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: Ultra Quality Settings (1080x1920 60FPS) */}
      {activeTab === 'quality' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ backgroundColor: '#10121a', padding: '14px', borderRadius: '14px', border: '1px solid #1e2235' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'block', marginBottom: 6 }}>
              دقة وجودة التصدير لتيك توك 💎
            </span>
            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, marginBottom: 12 }}>
              يستخدم التطبيق أعلى معدل بت (Bitrate) مع 60 إطار في الثانية لمنع تشويش الفيديو عند رفعه على تيك توك.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                {
                  id: 'ultra_hd_60fps',
                  title: 'فائقة الدقة: 1080p @ 60 FPS (موصى به لتيك توك) 🌟',
                  desc: 'أقصى وضوح وسلاسة حركة تضمن عدم ضغط خوارزمية تيك توك لجودة الفيديو'
                },
                {
                  id: 'high_1080p',
                  title: 'عالية الدقة: 1080p @ 30 FPS',
                  desc: 'جودة ممتازة مع حجم ملف متوازن وسرعة تصدير عالية'
                }
              ].map(q => {
                const isSelected = settings.exportQuality === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => updateSettings({ exportQuality: q.id as any })}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? 'rgba(37,244,238,0.15)' : '#181b28',
                      border: `1.5px solid ${isSelected ? '#25f4ee' : '#282d42'}`,
                      color: isSelected ? '#25f4ee' : '#cbd5e1',
                      textAlign: 'right',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>{q.title}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{q.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
