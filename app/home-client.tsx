'use client';

import { useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function HomeClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'citizen' | 'lawyer'>('citizen');
  const [input, setInput] = useState('');

  async function ask(q: string) {
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, mode }),
      });
      const data = await res.json();
      const text = data?.answer ?? 'No answer.';
      setMessages((m) => [...m, { role: 'assistant', content: text }]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: 'assistant', content: '⚠️ Error talking to server.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen">
      <aside className="w-[260px] border-r p-3">
        <div className="text-sm text-zinc-600 mb-2">Mode</div>
        <div className="flex gap-2">
          <button className={`text-sm border rounded px-3 py-1 ${mode==='citizen'?'bg-zinc-100':''}`} onClick={()=>setMode('citizen')}>Citizen</button>
          <button className={`text-sm border rounded px-3 py-1 ${mode==='lawyer'?'bg-zinc-100':''}`} onClick={()=>setMode('lawyer')}>Lawyer</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-4">
          {messages.length === 0 ? (
            <div className="text-sm text-zinc-500">Ask about a law, section, or case…</div>
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[80ch] whitespace-pre-wrap rounded px-3 py-2 border ${m.role==='user'?'bg-white':'bg-zinc-50'}`}>
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">
                    {m.role === 'user' ? 'You' : (mode === 'lawyer' ? 'Research' : 'LexLens')}
                  </div>
                  <div className="text-sm leading-6">{m.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t flex gap-2">
          <input
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={(e)=>{ if(e.key==='Enter' && !loading && input.trim()){ ask(input.trim()); setInput(''); } }}
            placeholder="Type your question…"
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <button
            className="border rounded px-3 py-2 text-sm"
            disabled={loading || !input.trim()}
            onClick={()=>{ const q=input.trim(); if(q){ ask(q); setInput(''); } }}
          >
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
