// رسم النصوص العربية والشعارات كصور PNG شفافة (الـ Canvas يتولى تشكيل الحروف العربية بشكل صحيح)
// ثم يركّبها FFmpeg فوق الفيديو بفلتر overlay.

import type { SubtitlePhrase } from '../types/video';

const FONT = '"Cairo","Tajawal","Noto Sans Arabic","Noto Naskh Arabic",Roboto,sans-serif';
export const UI_SCALE = 2.8; // الواجهة مصممة لعرض ~390px والتصدير 1080px

export interface Rendered {
  base64: string;
  width: number;
  height: number;
}

const hasArabic = (s: string) => /[\u0600-\u06FF]/.test(s);

export async function ensureFonts(): Promise<void> {
  try {
    const load = Promise.all([
      document.fonts.load(`800 40px Cairo`),
      document.fonts.load(`700 40px Tajawal`)
    ]);
    await Promise.race([load, new Promise(r => setTimeout(r, 1500))]);
  } catch {
    /* الخطوط غير متاحة، سنستخدم خط النظام */
  }
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.ceil(w));
  c.height = Math.max(2, Math.ceil(h));
  const ctx = c.getContext('2d')!;
  return { c, ctx };
}

function toRendered(c: HTMLCanvasElement): Rendered {
  return { base64: c.toDataURL('image/png').split(',')[1], width: c.width, height: c.height };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapWords(ctx: CanvasRenderingContext2D, words: string[], maxWidth: number): string[][] {
  const space = ctx.measureText(' ').width;
  const lines: string[][] = [];
  let cur: string[] = [];
  let curW = 0;
  for (const w of words) {
    const ww = ctx.measureText(w).width;
    if (cur.length && curW + space + ww > maxWidth) {
      lines.push(cur);
      cur = [w];
      curW = ww;
    } else {
      curW += (cur.length ? space : 0) + ww;
      cur.push(w);
    }
  }
  if (cur.length) lines.push(cur);
  return lines;
}

export interface TextBoxOptions {
  text: string;
  fontSize: number; // بكسل بعد التكبير
  color: string;
  bg?: string;
  padding?: number;
  maxWidth?: number;
  weight?: number;
  radius?: number;
}

export function renderTextBox(o: TextBoxOptions): Rendered {
  const pad = o.padding ?? 18;
  const maxW = (o.maxWidth ?? 960) - pad * 2;
  const probe = makeCanvas(10, 10).ctx;
  probe.font = `${o.weight ?? 800} ${o.fontSize}px ${FONT}`;
  const lines = wrapWords(probe, o.text.split(/\s+/).filter(Boolean), maxW);
  const lh = Math.round(o.fontSize * 1.5);
  const widest = Math.max(...lines.map(l => probe.measureText(l.join(' ')).width), 10);
  const w = widest + pad * 2;
  const h = lines.length * lh + pad * 2;
  const { c, ctx } = makeCanvas(w, h);
  if (o.bg) {
    ctx.fillStyle = o.bg;
    roundRect(ctx, 0, 0, c.width, c.height, o.radius ?? 20);
    ctx.fill();
  }
  ctx.font = `${o.weight ?? 800} ${o.fontSize}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = hasArabic(o.text) ? 'rtl' : 'ltr';
  ctx.fillStyle = o.color;
  lines.forEach((l, i) => ctx.fillText(l.join(' '), c.width / 2, pad + lh * i + lh / 2));
  return toRendered(c);
}

export interface CaptionStyleLite {
  fontSize: number;
  activeWordColor: string;
  normalWordColor: string;
  bgColor: string;
  strokeColor: string;
  strokeWidth: number;
}

// إطار كاريوكي: العبارة كاملة مع تلوين الكلمة النشطة (activeIdx = -1 بدون تمييز)
export function renderCaptionFrame(words: string[], activeIdx: number, st: CaptionStyleLite): Rendered {
  const fs = Math.round(st.fontSize * UI_SCALE);
  const pad = 22;
  const maxW = 960 - pad * 2;
  const rtl = hasArabic(words.join(' '));
  const probe = makeCanvas(10, 10).ctx;
  probe.font = `800 ${fs}px ${FONT}`;
  const space = probe.measureText(' ').width;
  const widths = words.map(w => probe.measureText(w).width);

  // تقسيم لأسطر على مستوى الكلمات
  const lines: number[][] = [];
  let cur: number[] = [];
  let curW = 0;
  words.forEach((_, i) => {
    if (cur.length && curW + space + widths[i] > maxW) {
      lines.push(cur);
      cur = [i];
      curW = widths[i];
    } else {
      curW += (cur.length ? space : 0) + widths[i];
      cur.push(i);
    }
  });
  if (cur.length) lines.push(cur);

  const lineWidth = (l: number[]) => l.reduce((a, i) => a + widths[i], 0) + space * (l.length - 1);
  const lh = Math.round(fs * 1.5);
  const w = Math.max(...lines.map(lineWidth)) + pad * 2;
  const h = lines.length * lh + pad * 2;
  const { c, ctx } = makeCanvas(w, h);

  ctx.fillStyle = st.bgColor;
  roundRect(ctx, 0, 0, c.width, c.height, 24);
  ctx.fill();

  ctx.font = `800 ${fs}px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.direction = rtl ? 'rtl' : 'ltr';

  lines.forEach((l, row) => {
    const lw = lineWidth(l);
    const y = pad + lh * row + lh / 2;
    let x = rtl ? c.width / 2 + lw / 2 : c.width / 2 - lw / 2;
    for (const i of l) {
      ctx.textAlign = rtl ? 'right' : 'left';
      if (st.strokeWidth > 0) {
        ctx.lineWidth = st.strokeWidth * 2.2;
        ctx.strokeStyle = st.strokeColor;
        ctx.strokeText(words[i], x, y);
      }
      ctx.fillStyle = i === activeIdx ? st.activeWordColor : st.normalWordColor;
      ctx.fillText(words[i], x, y);
      x += (rtl ? -1 : 1) * (widths[i] + space);
    }
  });
  return toRendered(c);
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('تعذر تحميل صورة الشعار'));
    img.src = src;
  });
}

export async function renderLogo(dataUrl: string, targetWidth: number, opacity: number): Promise<Rendered> {
  const img = await loadImage(dataUrl);
  const w = Math.max(16, Math.round(targetWidth));
  const h = Math.max(16, Math.round((img.height / img.width) * w));
  const { c, ctx } = makeCanvas(w, h);
  ctx.globalAlpha = Math.min(1, Math.max(0.05, opacity));
  ctx.drawImage(img, 0, 0, w, h);
  return toRendered(c);
}

// صورة مصغرة من الفيديو
export function captureThumbnail(url: string, duration: number): Promise<string> {
  return new Promise(resolve => {
    const v = document.createElement('video');
    v.muted = true;
    v.preload = 'auto';
    v.playsInline = true;
    const done = (val: string) => {
      v.removeAttribute('src');
      v.load();
      resolve(val);
    };
    const timer = setTimeout(() => done(''), 6000);
    v.onloadeddata = () => {
      v.currentTime = Math.min(1, Math.max(0, duration / 3));
    };
    v.onseeked = () => {
      try {
        const scale = 320 / (v.videoHeight || 320);
        const { c, ctx } = makeCanvas((v.videoWidth || 180) * scale, 320);
        ctx.drawImage(v, 0, 0, c.width, c.height);
        clearTimeout(timer);
        done(c.toDataURL('image/jpeg', 0.6));
      } catch {
        clearTimeout(timer);
        done('');
      }
    };
    v.onerror = () => {
      clearTimeout(timer);
      done('');
    };
    v.src = url;
  });
}

// تقسيم نص إلى عبارات وكلمات بتوقيت تقديري موزع على مدة الفيديو
export function autoDistributeCaptions(text: string, start: number, end: number): SubtitlePhrase[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length || end <= start) return [];
  const PER_PHRASE = 4;
  const totalChars = words.reduce((a, w) => a + w.length + 1, 0);
  const span = end - start;
  const out: SubtitlePhrase[] = [];
  let t = start;
  for (let i = 0; i < words.length; i += PER_PHRASE) {
    const chunk = words.slice(i, i + PER_PHRASE);
    const phraseId = `p${i / PER_PHRASE + 1}`;
    const pStart = t;
    const wordObjs = chunk.map((w, k) => {
      const d = ((w.length + 1) / totalChars) * span;
      const ws = t;
      t += d;
      return { id: `${phraseId}w${k}`, word: w, start: ws, end: t };
    });
    out.push({ id: phraseId, text: chunk.join(' '), start: pStart, end: t, words: wordObjs });
  }
  return out;
}
