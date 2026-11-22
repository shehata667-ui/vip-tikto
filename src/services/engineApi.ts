// المحرك المحلي: يعمل بالكامل داخل الهاتف عبر إضافة FFmpeg الأصلية (بدون سيرفر)
import { VideoMetadata, SilenceSegment, ProcessingJob, VideoSettings } from '../types/video';
import { FFmpegEngine, isNative, fileUrl } from './native';
import type { NativeStatus } from './native';
import {
  ensureFonts,
  renderTextBox,
  renderCaptionFrame,
  renderLogo,
  UI_SCALE
} from './overlayRenderer';
import type { Rendered } from './overlayRenderer';
import { buildArgs, W, H } from './ffmpegBuilder';
import type { Cut, Encoder, Overlay } from './ffmpegBuilder';

export interface EngineStatus {
  online: boolean;
  ffmpeg: boolean;
  ffprobe: boolean;
  port: number;
  platform: string;
  version?: string;
  error?: string;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
let nativeInfo: NativeStatus | null = null;

export async function checkEngineHealth(): Promise<EngineStatus> {
  if (!isNative()) {
    return { online: false, ffmpeg: false, ffprobe: false, port: 0, platform: 'web', error: 'يعمل فقط داخل تطبيق أندرويد' };
  }
  try {
    nativeInfo = await FFmpegEngine.status();
    return {
      online: nativeInfo.available,
      ffmpeg: nativeInfo.available,
      ffprobe: nativeInfo.available,
      port: 0,
      platform: 'android',
      version: nativeInfo.version,
      error: nativeInfo.error
    };
  } catch (e: any) {
    return { online: false, ffmpeg: false, ffprobe: false, port: 0, platform: 'android', error: `status: ${String(e?.message || e)}` };
  }
}

export async function pickVideoFile() {
  return FFmpegEngine.pickVideo();
}

export async function inspectVideoPath(filePath: string, filename = 'video.mp4'): Promise<VideoMetadata> {
  const p = await FFmpegEngine.probe({ path: filePath });
  return {
    filename,
    duration: p.duration,
    sizeBytes: p.sizeBytes,
    width: p.width,
    height: p.height,
    aspectRatio: p.height ? r2(p.width / p.height) : 0,
    isPortrait: p.height >= p.width,
    fps: p.fps ? Math.round(p.fps * 10) / 10 : 30,
    hasAudio: p.hasAudio,
    hasGpsMetadata: p.tags.some(k => /location|gps/i.test(k))
  };
}

function parseSilences(log: string, duration: number, minDuration: number): SilenceSegment[] {
  const out: SilenceSegment[] = [];
  let start: number | null = null;
  for (const line of log.split(/[\r\n]+/)) {
    const ms = line.match(/silence_start:\s*(-?[\d.]+)/);
    if (ms) {
      start = Math.max(0, parseFloat(ms[1]));
      continue;
    }
    const me = line.match(/silence_end:\s*([\d.]+)/);
    if (me && start !== null) {
      const end = parseFloat(me[1]);
      if (end - start >= minDuration) out.push({ start: r2(start), end: r2(end), duration: r2(end - start) });
      start = null;
    }
  }
  if (start !== null && duration - start >= minDuration) {
    out.push({ start: r2(start), end: r2(duration), duration: r2(duration - start) });
  }
  return out;
}

export async function detectSilenceOnServer(filePath: string, thresholdDb = -30, minDuration = 0.4): Promise<SilenceSegment[]> {
  const info = await FFmpegEngine.probe({ path: filePath });
  if (!info.hasAudio) return [];
  const res = await FFmpegEngine.execute({
    args: ['-hide_banner', '-i', filePath, '-vn', '-af', `silencedetect=noise=${thresholdDb}dB:d=${minDuration}`, '-f', 'null', '-']
  });
  if (!res.success) throw new Error('فشل كشف السكتات');
  return parseSilences(res.output, info.duration, minDuration);
}

// ---------------------------------------------------------------- الطابور
const STORE_KEY = 'tts_jobs_v1';
let jobs: ProcessingJob[] = loadJobs();
let chain: Promise<void> = Promise.resolve();

function loadJobs(): ProcessingJob[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]') as ProcessingJob[];
    return raw.map(j =>
      j.status === 'processing' || j.status === 'queued'
        ? { ...j, status: 'error' as const, errorMessage: 'تم إيقاف المعالجة بإغلاق التطبيق', currentStep: 'توقفت المعالجة' }
        : j
    );
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(jobs.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

function patchJob(id: string, patch: Partial<ProcessingJob>) {
  jobs = jobs.map(j => (j.id === id ? { ...j, ...patch } : j));
  persist();
}

export async function fetchQueueJobs(): Promise<ProcessingJob[]> {
  return jobs.map(j => ({ ...j }));
}

export function clearCompletedJobs() {
  jobs = jobs.filter(j => j.status !== 'completed');
  persist();
}

export function getDownloadUrl(filename: string): string {
  const j = jobs.find(x => x.outputFilename === filename);
  return j?.outputPath ? fileUrl(j.outputPath) : '';
}

export async function saveJobToGallery(job: ProcessingJob): Promise<void> {
  if (!job.outputPath || !job.outputFilename) throw new Error('لا يوجد ملف ناتج');
  await FFmpegEngine.saveToGallery({ path: job.outputPath, name: job.outputFilename });
}

export async function shareVideoFile(path: string): Promise<void> {
  await FFmpegEngine.shareVideo({ path });
}

export function cancelCurrentJob() {
  return FFmpegEngine.cancel();
}

export async function submitProcessingJob(
  videoName: string,
  inputPath: string,
  settings: VideoSettings,
  thumbnailUrl: string
): Promise<{ jobId: string }> {
  const id = Math.random().toString(36).substring(2, 10);
  const job: ProcessingJob = {
    id,
    videoId: id,
    videoName,
    thumbnailUrl,
    status: 'queued',
    progress: 0,
    currentStep: 'في طابور المعالجة...',
    createdAt: Math.floor(Date.now() / 1000)
  };
  jobs = [job, ...jobs];
  persist();
  chain = chain.then(() => runJob(id, inputPath, settings)).catch(() => undefined);
  return { jobId: id };
}

// ------------------------------------------------------------ تنفيذ المهمة
type Pos = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'safe-center-bottom';
function posExpr(pos: Pos): { x: string; y: string } {
  switch (pos) {
    case 'top-left': return { x: '60', y: '220' };
    case 'top-right': return { x: 'W-w-60', y: '220' };
    case 'bottom-left': return { x: '60', y: 'H-h-260' };
    case 'bottom-right': return { x: 'W-w-60', y: 'H-h-260' };
    default: return { x: '(W-w)/2', y: 'H-h-260' };
  }
}

async function runJob(id: string, inputPath: string, s: VideoSettings) {
  const step = (progress: number, currentStep: string) => patchJob(id, { status: 'processing', progress, currentStep });
  let listener: { remove: () => Promise<void> } | null = null;
  try {
    step(5, 'جاري فحص الفيديو...');
    const st = nativeInfo || (await FFmpegEngine.status());
    nativeInfo = st;
    if (!st.available) throw new Error(st.error || 'محرك FFmpeg غير متاح على هذا الجهاز');

    const info = await FFmpegEngine.probe({ path: inputPath });
    const dur = info.duration;
    if (!dur || !info.width) throw new Error('الملف لا يحتوي على مسار فيديو صالح');

    // القص
    const trimStart = Math.min(Math.max(0, s.trimStart || 0), Math.max(0, dur - 0.5));
    let trimEnd = s.trimEnd > trimStart ? Math.min(s.trimEnd, dur) : dur;
    if (s.delogo.removeCapcutOutro && dur > 3) trimEnd = Math.min(trimEnd, dur - 2);
    const trimDuration = Math.max(0.5, trimEnd - trimStart);

    // السكتات
    let cuts: Cut[] = [];
    if (s.removeSilence && info.hasAudio) {
      step(15, 'جاري كشف السكتات...');
      const sil = await detectSilenceOnServer(inputPath, s.silenceThresholdDb, s.minSilenceDuration);
      cuts = sil
        .map(x => ({ start: Math.max(0, x.start - trimStart) + 0.08, end: Math.min(trimDuration, x.end - trimStart) - 0.08 }))
        .filter(c => c.end - c.start > 0.15);
      const removed = cuts.reduce((a, c) => a + (c.end - c.start), 0);
      if (trimDuration - removed < 1) cuts = [];
    }
    const removedTotal = cuts.reduce((a, c) => a + (c.end - c.start), 0);
    const outDuration = Math.max(1, trimDuration - removedTotal);

    // الصور الشفافة للنصوص
    step(25, 'جاري تجهيز النصوص والشعارات...');
    await ensureFonts();
    let imgN = 0;
    const save = async (r: Rendered): Promise<string> => {
      const { path } = await FFmpegEngine.writeBase64({ name: `${id}_${imgN++}.png`, data: r.base64 });
      return path;
    };

    const captionOverlays: Overlay[] = [];
    if (s.captionsEnabled && s.captions.length) {
      const cs = s.captionStyle;
      const phrases = s.captions
        .map(p => ({ ...p, start: p.start - trimStart, end: p.end - trimStart, words: p.words.map(w => ({ ...w, start: w.start - trimStart, end: w.end - trimStart })) }))
        .filter(p => p.end > 0 && p.start < trimDuration && p.words.length);
      const states = phrases.reduce((a, p) => a + p.words.length, 0);
      const karaoke = states <= 120;
      for (const p of phrases) {
        const words = p.words.map(w => w.word);
        if (karaoke) {
          for (let k = 0; k < p.words.length; k++) {
            const a = k === 0 ? Math.max(0, p.start) : Math.max(0, p.words[k].start);
            const b = k + 1 < p.words.length ? p.words[k + 1].start : p.end;
            if (b <= a) continue;
            const path = await save(renderCaptionFrame(words, k, cs));
            captionOverlays.push({ path, x: '(W-w)/2', y: '1180', start: a, end: b });
          }
        } else {
          const path = await save(renderCaptionFrame(words, -1, cs));
          captionOverlays.push({ path, x: '(W-w)/2', y: '1180', start: Math.max(0, p.start), end: p.end });
        }
      }
    }

    const topOverlays: Overlay[] = [];
    if (s.hook.enabled && s.hook.text.trim()) {
      const r = renderTextBox({
        text: s.hook.text,
        fontSize: Math.round(s.hook.fontSize * UI_SCALE),
        color: s.hook.textColor || '#ffffff',
        bg: s.hook.bgColor || 'rgba(0,0,0,0.8)',
        padding: 22
      });
      const y = s.hook.position === 'center' ? '(H-h)/2' : s.hook.position === 'bottom' ? 'H-h-450' : '320';
      topOverlays.push({ path: await save(r), x: '(W-w)/2', y, start: 0, end: s.hook.duration || 3 });
    }
    const tw = s.watermark.textWatermark;
    if (tw.enabled && tw.text.trim()) {
      const r = renderTextBox({
        text: tw.text,
        fontSize: tw.fontSize || 32,
        color: `rgba(255,255,255,${tw.opacity ?? 0.85})`,
        bg: 'rgba(0,0,0,0.55)',
        padding: 12,
        maxWidth: 700,
        radius: 12
      });
      const p = posExpr(tw.position);
      topOverlays.push({ path: await save(r), x: p.x, y: p.y });
    }
    const iw = s.watermark.imageWatermark;
    if (iw.enabled && iw.imageUrl) {
      const r = await renderLogo(iw.imageUrl, (W * (iw.sizePercent || 15)) / 100, iw.opacity ?? 0.9);
      const p = posExpr(iw.position);
      topOverlays.push({ path: await save(r), x: p.x, y: p.y });
    }

    // جودة التصدير
    const src = info.fps || 30;
    const fps = s.exportQuality === 'ultra_hd_60fps' && src > 45 ? 60 : Math.min(60, Math.max(24, Math.round(src)));
    const bitrateM = s.exportQuality === 'ultra_hd_60fps' ? 12 : s.exportQuality === 'high_1080p' ? 8 : 5;

    const outputFilename = `tiktok_${id}_${Date.now()}.mp4`;
    const outputPath = `${st.exportsDir}/${outputFilename}`;

    listener = await FFmpegEngine.addListener('progress', e => {
      const pct = Math.min(95, 40 + (e.timeMs / 1000 / outDuration) * 55);
      patchJob(id, { progress: Math.round(pct) });
    });

    const encoders: Encoder[] = ['libx264', 'h264_mediacodec', 'mpeg4'];
    let lastLog = '';
    let ok = false;
    for (const encoder of encoders) {
      step(40, encoder === 'libx264' ? 'جاري الرندر والتصدير 1080×1920...' : `جاري إعادة المحاولة بمشفّر بديل (${encoder})...`);
      const args = buildArgs({
        inputPath,
        outputPath,
        trimStart,
        trimDuration,
        hasAudio: info.hasAudio,
        aspect: s.aspectRatioMode,
        delogo: s.delogo,
        cuts,
        captionOverlays,
        topOverlays,
        fps,
        bitrateM,
        stripMetadata: s.stripGps,
        encoder
      });
      const res = await FFmpegEngine.execute({ args });
      if (res.cancelled) throw new Error('تم إلغاء المعالجة');
      if (res.success) {
        ok = true;
        break;
      }
      lastLog = res.output;
    }
    if (!ok) throw new Error(`فشل التصدير: ${lastLog.slice(-500)}`);

    const { size } = await FFmpegEngine.fileSize({ path: outputPath });
    patchJob(id, {
      status: 'completed',
      progress: 100,
      currentStep: 'تم تجهيز الفيديو وجاهز لتيك توك! 🎉',
      outputPath,
      outputFilename,
      outputSizeMb: r2(size / (1024 * 1024)),
      completedAt: Math.floor(Date.now() / 1000)
    });
  } catch (e: any) {
    patchJob(id, { status: 'error', currentStep: 'فشل التصدير', errorMessage: String(e?.message || e) });
  } finally {
    if (listener) await listener.remove();
    try {
      await FFmpegEngine.cleanup({ prefix: `${id}_` });
    } catch {
      /* ignore */
    }
  }
}

export { H as OUTPUT_HEIGHT };
