export function clampTime(t: number, duration: number): number {
  if (!Number.isFinite(t)) return 0;
  return Math.min(Math.max(t, 0), Number.isFinite(duration) ? duration : t);
}

export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00.00';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, '0')}`;
}

export type ImageFormat = 'image/png' | 'image/jpeg';

export function extensionFor(format: ImageFormat): string {
  return format === 'image/png' ? 'png' : 'jpg';
}

export function frameFileName(baseName: string, time: number, format: ImageFormat): string {
  const base = baseName.replace(/\.[^.]+$/, '') || 'video';
  const t = time.toFixed(2).replace('.', '-');
  return `${base}-frame-${t}s.${extensionFor(format)}`;
}
