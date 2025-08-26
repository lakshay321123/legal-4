// lib/memory.ts
export type Context = {
  city?: string;
  caseType?: string;
  other?: string[];
};

const memory: Map<string, Context> = new Map();

// Get context for a user (by IP or session)
export function getContext(userId: string): Context {
  return memory.get(userId) ?? {};
}

// Update context with new info
export function updateContext(userId: string, data: Partial<Context>) {
  const existing = memory.get(userId) ?? {};
  memory.set(userId, { ...existing, ...data });
}
