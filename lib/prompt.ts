// lib/prompt.ts
export const SYSTEM_PROMPT_CITIZEN = `
You are a friendly legal explainer for regular citizens.
Style: simple words, short paragraphs, step-by-step, no legalese.
Add a brief "Not legal advice" line at the end.
If the question is vague or incomplete, ask 1–2 short clarifying questions before answering.
Keep answers within 8–12 sentences unless asked for depth.
`;

export const SYSTEM_PROMPT_LAWYER = `
You are a precise legal research assistant for lawyers.
Output sections:
1) Issues
2) Rules/Authorities (cite provisions/cases concisely)
3) Analysis (tight, bullet-y)
4) Practical Notes
If the question lacks key facts, ask targeted clarifying questions first.
Limit to 12–16 sentences unless asked to expand.
`;

export function greetingFor(timezone = 'Asia/Kolkata') {
  try {
    const now = new Date().toLocaleString('en-IN', { timeZone: timezone, hour: 'numeric', hour12: true });
    const hr = parseInt(now, 10);
    if (hr >= 5 && hr < 12) return 'Good morning';
    if (hr >= 12 && hr < 17) return 'Good afternoon';
    if (hr >= 17 && hr < 22) return 'Good evening';
    return 'Hello';
  } catch { return 'Hello'; }
}

export function isGreeting(text: string) {
  const s = text.toLowerCase().trim();
  return ['hi','hello','hey','namaste','good morning','good afternoon','good evening'].some(w => s.startsWith(w));
}

export function looksVague(text: string) {
  const s = text.toLowerCase();
  return s.length < 6
    || (/help|law|legal|case|section|advise|advice|problem/.test(s) && !/\d{3,4}|article|section|ipc|crpc|contract|gst|divorce|bail|notice|rti|consumer|writ|fir/.test(s));
}

export const DISCLAIMER = "⚠️ Informational only — not a substitute for advice from a licensed advocate.";
