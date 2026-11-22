export type AspectRatioMode = 'smart_crop' | 'blur_background' | 'fit_bars';

export interface SubtitleWord {
  id: string;
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface SubtitlePhrase {
  id: string;
  text: string;
  start: number;
  end: number;
  words: SubtitleWord[];
}

export interface HookConfig {
  enabled: boolean;
  text: string;
  duration: number; // usually 3.0 seconds
  position: 'top' | 'center' | 'bottom';
  bgColor: string;
  textColor: string;
  fontSize: number;
}

export interface WatermarkItem {
  enabled: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'safe-center-bottom';
  opacity: number;
}

export interface TextWatermarkConfig extends WatermarkItem {
  text: string;
  fontSize: number;
}

export interface ImageWatermarkConfig extends WatermarkItem {
  imageUrl: string;
  imageFileName?: string;
  sizePercent: number; // 5% to 30% of width
}

export interface DualWatermarkConfig {
  textWatermark: TextWatermarkConfig;
  imageWatermark: ImageWatermarkConfig;
}

export interface DelogoZone {
  x: number; // percent 0 - 100
  y: number; // percent 0 - 100
  w: number; // percent 0 - 100
  h: number; // percent 0 - 100
}

export interface DelogoConfig {
  enabled: boolean;
  mode: 'delogo' | 'blur_mask' | 'zoom_crop';
  preset: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left' | 'qr-code-center' | 'custom';
  zone: DelogoZone;
  removeCapcutOutro: boolean; // Auto-cut last 2 seconds
}

export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
}

export interface VideoMetadata {
  filename: string;
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
  isPortrait: boolean;
  sizeBytes: number;
  fps: number;
  hasAudio: boolean;
  hasGpsMetadata: boolean;
  locationDetails?: string;
}

export interface VideoSettings {
  aspectRatioMode: AspectRatioMode;
  trimStart: number;
  trimEnd: number;
  removeSilence: boolean;
  silenceThresholdDb: number;
  minSilenceDuration: number;
  hook: HookConfig;
  captionsEnabled: boolean;
  captions: SubtitlePhrase[];
  captionStyle: {
    fontSize: number;
    activeWordColor: string;
    normalWordColor: string;
    bgColor: string;
    fontFamily: string;
    strokeColor: string;
    strokeWidth: number;
  };
  watermark: DualWatermarkConfig;
  delogo: DelogoConfig;
  stripGps: boolean;
  exportQuality: 'ultra_hd_60fps' | 'high_1080p' | 'standard';
}

export interface ProcessingJob {
  id: string;
  videoId: string;
  videoName: string;
  thumbnailUrl: string;
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  outputPath?: string;
  outputFilename?: string;
  outputSizeMb?: number;
  errorMessage?: string;
  createdAt: number;
  completedAt?: number;
}

export type PublishPlatform = 'tiktok' | 'facebook' | 'both';

export interface PublishConfig {
  caption: string;
  hashtags: string[];
  publishToTikTok: boolean;
  publishToFacebook: boolean;
}

export interface VideoProject {
  id: string;
  file?: File | null;
  sourcePath?: string; // مسار الفيديو داخل الهاتف
  objectUrl: string;
  thumbnailUrl: string;
  metadata: VideoMetadata;
  settings: VideoSettings;
  detectedSilences: SilenceSegment[];
  qualityScore: number;
}
