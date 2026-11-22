import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface NativeStatus {
  available: boolean;
  version: string;
  exportsDir: string;
  overlaysDir: string;
  error?: string;
}

export interface ProbeResult {
  duration: number;
  sizeBytes: number;
  bitrate: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  tags: string[];
}

export interface ExecResult {
  success: boolean;
  cancelled: boolean;
  returnCode: number;
  output: string;
}

export interface FFmpegEnginePlugin {
  status(): Promise<NativeStatus>;
  pickVideo(): Promise<{ path: string; name: string; size: number }>;
  probe(options: { path: string }): Promise<ProbeResult>;
  execute(options: { args: string[] }): Promise<ExecResult>;
  cancel(): Promise<void>;
  writeBase64(options: { name: string; data: string }): Promise<{ path: string }>;
  fileSize(options: { path: string }): Promise<{ size: number }>;
  cleanup(options: { prefix: string }): Promise<void>;
  saveToGallery(options: { path: string; name: string }): Promise<{ uri: string }>;
  shareVideo(options: { path: string }): Promise<void>;
  addListener(
    eventName: 'progress',
    listener: (e: { timeMs: number }) => void
  ): Promise<PluginListenerHandle>;
}

export const FFmpegEngine = registerPlugin<FFmpegEnginePlugin>('FFmpegEngine');
export const isNative = (): boolean => Capacitor.isNativePlatform();
export const fileUrl = (path: string): string => Capacitor.convertFileSrc(path);
