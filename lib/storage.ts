'use client';

import { Chat, AppState } from './types';

const CHAT_KEY = 'legalchats:v1';
const STATE_KEY = 'legalappstate:v1';

export function loadChats(): Chat[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChats(chats: Chat[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHAT_KEY, JSON.stringify(chats));
}

function monthKeyNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return { mode: 'citizen', lawyerPromptsUsedThisMonth: 0, monthKey: monthKeyNow(), plan: 'free' };
  try {
    const raw = localStorage.getItem(STATE_KEY);
    const def: AppState = { mode: 'citizen', lawyerPromptsUsedThisMonth: 0, monthKey: monthKeyNow(), plan: 'free' };
    if (!raw) return def;
    const parsed = JSON.parse(raw) as AppState;
    // reset monthly counter if new month
    const nowKey = monthKeyNow();
    if (parsed.monthKey !== nowKey) {
      parsed.monthKey = nowKey;
      parsed.lawyerPromptsUsedThisMonth = 0;
    }
    return parsed;
  } catch {
    return { mode: 'citizen', lawyerPromptsUsedThisMonth: 0, monthKey: monthKeyNow(), plan: 'free' };
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}
