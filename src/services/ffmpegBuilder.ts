import type { AspectRatioMode, DelogoConfig } from '../types/video';

export const W = 1080;
export const H = 1920;

export type Encoder = 'libx264' | 'h264_mediacodec' | 'mpeg4';

export interface Overlay {
  path: string;
  x: string; // تعبير FFmpeg مثل (W-w)/2
  y: string;
  start?: number;
  end?: number;
}

export interface Cut {
  start: number;
  end: number;
}

export interface BuildParams {
  inputPath: string;
  outputPath: string;
  trimStart: number;
  trimDuration: number;
  hasAudio: boolean;
  aspect: AspectRatioMode;
  delogo: DelogoConfig;
  cuts: Cut[]; // مقاطع السكتات المراد حذفها (بزمن الفيديو بعد القص)
  captionOverlays: Overlay[]; // تُركّب قبل حذف السكتات (لتبقى متزامنة مع الصورة)
  topOverlays: Overlay[]; // تُركّب بعد القص (هوك/اسم/لوجو بزمن الفيديو الناتج)
  fps: number;
  bitrateM: number;
  stripMetadata: boolean;
  encoder: Encoder;
}

const f3 = (n: number) => (Math.round(n * 1000) / 1000).toString();

function overlayStep(inp: string, idx: number, o: Overlay, out: string): string {
  const en =
    o.start !== undefined && o.end !== undefined
      ? `:enable='between(t,${f3(o.start)},${f3(o.end)})'`
      : '';
  return `[${inp}][${idx}:v]overlay=${o.x}:${o.y}${en}[${out}]`;
}

export function buildArgs(p: BuildParams): string[] {
  const g: string[] = [];
  let n = 0;
  const next = () => `s${n++}`;
  let cur = 'v0';

  // 1) أبعاد 9:16
  if (p.aspect === 'blur_background') {
    g.push(
      `[0:v]split=2[a0][a1];` +
        `[a0]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=30:4[bg];` +
        `[a1]scale=${W}:${H}:force_original_aspect_ratio=decrease[fg];` +
        `[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v0]`
    );
  } else if (p.aspect === 'fit_bars') {
    g.push(
      `[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black,setsar=1[v0]`
    );
  } else {
    g.push(`[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1[v0]`);
  }

  // 2) إزالة العلامات المائية
  const d = p.delogo;
  if (d.enabled) {
    const out = next();
    if (d.mode === 'zoom_crop') {
      g.push(`[${cur}]scale=trunc(iw*1.15/2)*2:trunc(ih*1.15/2)*2,crop=${W}:${H}[${out}]`);
    } else {
      const x = Math.max(1, Math.round((d.zone.x * W) / 100));
      const y = Math.max(1, Math.round((d.zone.y * H) / 100));
      const w = Math.max(10, Math.min(W - x - 2, Math.round((d.zone.w * W) / 100)));
      const h = Math.max(10, Math.min(H - y - 2, Math.round((d.zone.h * H) / 100)));
      if (d.mode === 'blur_mask') {
        const r = Math.max(1, Math.min(18, Math.floor(Math.min(w, h) / 4) - 1));
        const a = next();
        const b = next();
        g.push(
          `[${cur}]split=2[${a}][${b}];` +
            `[${b}]crop=${w}:${h}:${x}:${y},boxblur=${r}:3[${b}m];` +
            `[${a}][${b}m]overlay=${x}:${y}[${out}]`
        );
      } else {
        g.push(`[${cur}]delogo=x=${x}:y=${y}:w=${w}:h=${h}[${out}]`);
      }
    }
    cur = out;
  }

  // 3) الكابشن (بزمن ما قبل حذف السكتات)
  let inputIdx = 1;
  for (const o of p.captionOverlays) {
    const out = next();
    g.push(overlayStep(cur, inputIdx++, o, out));
    cur = out;
  }

  // 4) حذف السكتات
  let audioLabel: string | null = null;
  if (p.cuts.length > 0) {
    const expr = p.cuts.map(c => `between(t,${f3(c.start)},${f3(c.end)})`).join('+');
    const out = next();
    g.push(`[${cur}]select='not(${expr})',setpts=N/FRAME_RATE/TB[${out}]`);
    cur = out;
    if (p.hasAudio) {
      g.push(`[0:a:0]aselect='not(${expr})',asetpts=N/SR/TB[aout]`);
      audioLabel = 'aout';
    }
  }

  // 5) معدل الإطارات
  if (p.fps > 0) {
    const out = next();
    g.push(`[${cur}]fps=${p.fps}[${out}]`);
    cur = out;
  }

  // 6) الهوك والاسم واللوجو (بزمن الفيديو الناتج)
  for (const o of p.topOverlays) {
    const out = next();
    g.push(overlayStep(cur, inputIdx++, o, out));
    cur = out;
  }

  // ---- الأمر النهائي
  const args: string[] = ['-hide_banner', '-y'];
  if (p.trimStart > 0) args.push('-ss', f3(p.trimStart));
  if (p.trimDuration > 0) args.push('-t', f3(p.trimDuration));
  args.push('-i', p.inputPath);
  for (const o of [...p.captionOverlays, ...p.topOverlays]) args.push('-i', o.path);

  args.push('-filter_complex', g.join(';'), '-map', `[${cur}]`);
  if (p.hasAudio) {
    args.push('-map', audioLabel ? `[${audioLabel}]` : '0:a:0');
  } else {
    args.push('-an');
  }

  if (p.stripMetadata) {
    args.push('-map_metadata', '-1', '-metadata', 'comment=Processed by TikTok Studio');
  }

  if (p.encoder === 'libx264') {
    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-maxrate', `${p.bitrateM + 4}M`, '-bufsize', `${p.bitrateM * 2}M`);
  } else if (p.encoder === 'h264_mediacodec') {
    args.push('-c:v', 'h264_mediacodec', '-b:v', `${p.bitrateM}M`);
  } else {
    args.push('-c:v', 'mpeg4', '-q:v', '3');
  }
  args.push('-pix_fmt', 'yuv420p');
  if (p.hasAudio) args.push('-c:a', 'aac', '-b:a', '192k');
  args.push('-movflags', '+faststart', p.outputPath);
  return args;
}
