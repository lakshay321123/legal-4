// app/home-client.tsx
'use client';

import { useState } from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import SmartInput from '@/components/SmartInput';
import Welcome from '@/components/Welcome';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function HomeClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'citizen' | 'lawyer'>('citizen');

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
      <ChatSidebar />
      <div className="flex flex-col flex-1">
        {/* Header with mode toggle */}
        <div className="px-4 py-2 border-b flex items-center gap-2">
          <span className="text-sm text-zinc-600">Mode:</span>
          <button
            className={`text-sm rounded px-3 py-1 border ${mode === 'citizen' ? 'bg-zinc-100' : ''}`}
            onClick={() => setMode('citizen')}
          >
            Citizen
          </button>
          <button
            className={`text-sm rounded px-3 py-1 border ${mode === 'lawyer' ? 'bg-zinc-100' : ''}`}
            onClick={() => setMode('lawyer')}
          >
            Lawyer
          </button>
        </div>

        {/* Messages area / Welcome */}
        <div className="flex-1 overflow-auto p-4">
          {messages.length === 0 ? (
            <Welcome onPick={(q) => ask(q)} />
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[80ch] whitespace-pre-wrap rounded px-3 py-2 border ${
                    m.role === 'user' ? 'bg-white' : 'bg-zinc-50'
                  }`}
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

        {/* Input */}
        <SmartInput onSend={ask} disabled={loading} />
      </div>
    </div>
  );
}
