// app/home-client.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

const starters = [
  'Draft a rent agreement for a Delhi apartment (essentials + clauses).',
  'Steps to file a consumer complaint online (India).',
  'Explain Article 21 in simple language with 2 key cases.',
  'Bail basics: types and common conditions.',
];

export default function HomeClient() {
  const [mode, setMode] = useState<'citizen' | 'lawyer'>('citizen');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  async function ask(q: string) {
    setMessages(m => [...m, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, mode }),
      });
      const data = await res.json();
      const text = data?.answer ?? 'No answer.';
      setMessages(m => [...m, { role: 'assistant', content: text }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: '⚠️ Error talking to server.' }]);
    } finally {
      setLoading(false);
    }
  }

  const headerTitle = useMemo(
    () => (mode === 'lawyer' ? 'LexLens — Lawyer Mode' : 'LexLens — Citizen Mode'),
    [mode]
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-[280px] border-r p-4 flex flex-col gap-4">
        <div className="text-xs uppercase tracking-wide text-zinc-500">Mode</div>
        <div className="flex gap-2">
          <button
            className={`text-sm border rounded px-3 py-1 ${mode==='citizen' ? 'bg-zinc-100' : ''}`}
            onClick={() => setMode('citizen')}
          >
            Citizen
          </button>
          <button
            className={`text-sm border rounded px-3 py-1 ${mode==='lawyer' ? 'bg-zinc-100' : ''}`}
            onClick={() => setMode('lawyer')}
          >
            Lawyer
          </button>
        </div>

        <div className="text-xs uppercase tracking-wide text-zinc-500">Quick Starts</div>
        <div className="space-y-2">
          {starters.map((s, i) => (
            <button
              key={i}
              onClick={() => ask(s)}
              className="block text-left w-full border rounded p-2 text-sm hover:bg-zinc-50"
            >
              {s}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        <header className="border-b px-5 py-3 text-sm text-zinc-700">{headerTitle}</header>

        <div className="flex-1 overflow-auto p-5">
          {messages.length === 0 ? (
            <div className="text-sm text-zinc-500">
              👋 Ask about a law, section, or case. Example: <em>“Draft a rent agreement for a Delhi apartment.”</em>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[80ch] whitespace-pre-wrap rounded px-3 py-2 border ${m.role==='user'?'bg-white':'bg-zinc-50'}`}
                >
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">
                    {m.role === 'user' ? 'You' : (mode === 'lawyer' ? 'Research' : 'LexLens')}
                  </div>
                  <div className="text-sm leading-6">{m.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Big input bar */}
        <div className="p-4 border-t flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={(e)=>{ if(e.key==='Enter' && !loading && input.trim()){ const q=input.trim(); setInput(''); ask(q); } }}
            placeholder="Type your question…"
            className="flex-1 border rounded px-4 py-3 text-base"
          />
          <button
            className="border rounded px-4 py-3 text-sm"
            disabled={loading || !input.trim()}
            onClick={()=>{ const q=input.trim(); if(q){ setInput(''); ask(q); } }}
          >
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </main>
    </div>
  );
}
