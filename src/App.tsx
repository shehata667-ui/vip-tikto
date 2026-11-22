import React, { useState, useEffect } from 'react';
import { TabType, BottomTabs } from './components/BottomTabs';
import { HomeScreen } from './screens/HomeScreen';
import { StudioScreen } from './screens/StudioScreen';
import { InspectorScreen } from './screens/InspectorScreen';
import { QueueScreen } from './screens/QueueScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { VideoProject, VideoMetadata, VideoSettings, ProcessingJob, SubtitlePhrase } from './types/video';
import { checkEngineHealth, EngineStatus, fetchQueueJobs, submitProcessingJob, detectSilenceOnServer, pickVideoFile, inspectVideoPath, clearCompletedJobs } from './services/engineApi';
import { fileUrl } from './services/native';
import { captureThumbnail } from './services/overlayRenderer';

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [activeProject, setActiveProject] = useState<VideoProject | null>(null);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>({
    online: false,
    ffmpeg: false,
    ffprobe: false,
    port: 0,
    platform: 'unknown'
  });
  const [defaultUsername, setDefaultUsername] = useState<string>('@tiktok_creator');
  const [isDetectingSilence, setIsDetectingSilence] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check engine health on startup and periodically
  useEffect(() => {
    const check = async () => {
      const status = await checkEngineHealth();
      setEngineStatus(status);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // Poll jobs from local engine
  useEffect(() => {
    const pollJobs = async () => {
      const updated = await fetchQueueJobs();
      setJobs(updated);
    };
    pollJobs();
    const interval = setInterval(pollJobs, 2500);
    return () => clearInterval(interval);
  }, []);

  // Video selection handler (اختيار فيديو من الهاتف ونسخه لمجلد التطبيق)
  const handlePickVideo = async () => {
    try {
      const picked = await pickVideoFile();
      showToast('جاري قراءة الفيديو...');
      const metadata: VideoMetadata = await inspectVideoPath(picked.path, picked.name);
      const duration = metadata.duration || 60;
      const objectUrl = fileUrl(picked.path);
      const thumbnailUrl = await captureThumbnail(objectUrl, duration);

      const settings: VideoSettings = {
        aspectRatioMode: metadata.isPortrait ? 'smart_crop' : 'blur_background',
        trimStart: 0,
        trimEnd: duration,
        removeSilence: true,
        silenceThresholdDb: -30,
        minSilenceDuration: 0.4,
        hook: {
          enabled: true,
          text: '🔥 سر خطير لازم تعرفه الآن!',
          duration: 3.0,
          position: 'top',
          bgColor: 'rgba(0,0,0,0.85)',
          textColor: '#ffffff',
          fontSize: 18
        },
        captionsEnabled: false,
        captions: [],
        captionStyle: {
          fontSize: 19,
          activeWordColor: '#25f4ee',
          normalWordColor: '#ffffff',
          bgColor: 'rgba(0,0,0,0.6)',
          fontFamily: 'Cairo',
          strokeColor: '#000000',
          strokeWidth: 2
        },
        watermark: {
          textWatermark: {
            enabled: true,
            text: defaultUsername,
            position: 'top-left',
            opacity: 0.85,
            fontSize: 32
          },
          imageWatermark: {
            enabled: false,
            imageUrl: '',
            position: 'top-right',
            opacity: 0.9,
            sizePercent: 15
          }
        },
        delogo: {
          enabled: true,
          mode: 'delogo',
          preset: 'bottom-right',
          zone: { x: 74, y: 84, w: 24, h: 14 },
          removeCapcutOutro: true
        },
        stripGps: true,
        exportQuality: 'ultra_hd_60fps'
      };

      const project: VideoProject = {
        id: Math.random().toString(36).substring(2, 9),
        file: null,
        sourcePath: picked.path,
        objectUrl,
        thumbnailUrl,
        metadata,
        settings,
        detectedSilences: [],
        qualityScore: 95
      };

      setActiveProject(project);
      showToast(`تم استيراد الفيديو بنجاح: ${picked.name}`);
      setCurrentTab('studio');
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg !== 'cancelled') showToast(`تعذر فتح الفيديو: ${msg}`);
    }
  };

  // Silence detection handler
  const handleDetectSilences = async () => {
    if (!activeProject) return;
    setIsDetectingSilence(true);
    try {
      const serverPath = activeProject.sourcePath || '';
      const silences = await detectSilenceOnServer(serverPath, activeProject.settings.silenceThresholdDb, activeProject.settings.minSilenceDuration);
      setActiveProject({
        ...activeProject,
        detectedSilences: silences
      });
      const totalCut = silences.reduce((acc, s) => acc + s.duration, 0);
      showToast(`⚡ تم كشف ${silences.length} سكتة وتوفير ${totalCut.toFixed(1)} ثانية!`);
    } catch (e) {
      showToast('فشل كشف السكتات');
    } finally {
      setIsDetectingSilence(false);
    }
  };

  // Add to background processing queue
  const handleAddToQueue = async () => {
    if (!activeProject) return;

    try {
      showToast('تمت إضافة الفيديو إلى طابور المعالجة بالخلفية 🚀');
      const serverPath = activeProject.sourcePath || '';

      await submitProcessingJob(
        activeProject.metadata.filename,
        serverPath,
        activeProject.settings,
        activeProject.thumbnailUrl
      );

      // Refresh jobs list immediately
      const updated = await fetchQueueJobs();
      setJobs(updated);
      setCurrentTab('queue');
    } catch (e: any) {
      showToast(`تعذر بدء المعالجة: ${e.message}`);
    }
  };

  // Auto-magic 1-click processing
  const handleAutoMagic = () => {
    if (!activeProject) return;
    showToast('✨ تم تطبيق الإعدادات السحرية المثالية وإرسال الفيديو للطابور!');
    handleAddToQueue();
  };

  return (
    <div className="mobile-viewport">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1e2235',
            color: '#fff',
            border: '1px solid #fe2c55',
            borderRadius: '12px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            zIndex: 1000,
            boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <span>⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Views */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {currentTab === 'home' && (
          <HomeScreen
            onPickVideo={handlePickVideo}
            onAutoMagic={handleAutoMagic}
            activeProject={activeProject}
            onGoToStudio={() => setCurrentTab('studio')}
            isEngineOnline={engineStatus.online}
          />
        )}

        {currentTab === 'studio' && activeProject && (
          <StudioScreen
            project={activeProject}
            onUpdateProject={setActiveProject}
            onAddToQueue={handleAddToQueue}
            onDetectSilences={handleDetectSilences}
            isDetectingSilence={isDetectingSilence}
          />
        )}

        {currentTab === 'inspector' && activeProject && (
          <InspectorScreen
            project={activeProject}
            onGoToStudio={() => setCurrentTab('studio')}
            onAddToQueue={handleAddToQueue}
          />
        )}

        {currentTab === 'queue' && (
          <QueueScreen
            jobs={jobs}
            onRefreshJobs={async () => {
              const updated = await fetchQueueJobs();
              setJobs(updated);
              showToast('تم تحديث حالة الطابور');
            }}
            onClearCompleted={() => {
              clearCompletedJobs();
              setJobs(jobs.filter(j => j.status !== 'completed'));
              showToast('تم مسح الفيديوهات المكتملة');
            }}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen
            engineStatus={engineStatus}
            defaultUsername={defaultUsername}
            onUpdateDefaultUsername={name => {
              setDefaultUsername(name);
              showToast('تم حفظ اسم الحساب الافتراضي');
            }}
          />
        )}
      </div>

      {/* Bottom Tabs Navigation */}
      <BottomTabs
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        queueCount={jobs.filter(j => j.status === 'processing' || j.status === 'queued').length}
        hasActiveVideo={activeProject !== null}
      />
    </div>
  );
}

export default App;
