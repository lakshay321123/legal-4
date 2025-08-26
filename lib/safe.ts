// lib/safe.ts
export function safeParse<T>(value: string | null, fallback: T): T {
  try { return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
export const isBrowser = () => typeof window !== 'undefined';

export function load<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try { return safeParse<T>(localStorage.getItem(key), fallback); } catch { return fallback; }
}
export function save<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
