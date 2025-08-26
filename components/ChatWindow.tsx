'use client';

import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

export default function ChatWindow({ mode }: { mode: 'citizen'|'lawyer' }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const scRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scRef.current?.scrollTo({ top: scRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, loading]);

  async function send(text: string) {
    const id = crypto.randomUUID();
    setMsgs((m) => [...m, { id, role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, mode }),
      });
      const data = await res.json();
      const reply = data?.answer || 'Sorry, I could not generate an answer.';
      setMsgs((m) => [...m, { id: id + '-a', role: 'assistant', content: reply }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { id: id + '-e', role: 'assistant', content: '⚠️ Network error.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-container grid gap-4">
      <div ref={scRef} className="card p-4 md:p-6 h-[62vh] overflow-y-auto space-y-4">
        {msgs.length === 0 && (
          <div className="text-sm text-slate-500">
            Ask anything about Indian law. Toggle <span className="font-medium">Citizen/Lawyer</span> in the sidebar.
          </div>
        )}
        {msgs.map(m => <MessageBubble key={m.id} role={m.role} text={m.content} />)}
        {loading && <div className="text-slate-400 text-sm">Thinking…</div>}
      </div>

      {/* Attachments row (buttons only for now; you can hook to /api/upload later) */}
      <div className="flex gap-2">
        <button className="card px-3 py-2 text-sm hover:bg-slate-50">Attach files</button>
        <button className="card px-3 py-2 text-sm hover:bg-slate-50">Camera</button>
      </div>

      {/* Composer */}
      {/* Import Composer at top if you prefer that component;
          or keep this inline. Here’s inline for self-contained: */}
      <div className="card p-3 flex items-end gap-3">
        <textarea
          placeholder="Type your question… (Shift+Enter for a new line)"
          rows={1}
          className="flex-1 resize-none outline-none bg-transparent px-3 py-2 rounded-xl border border-slate-300 focus:border-brand-500"
          onKeyDown={(e) => {
            const target = e.target as HTMLTextAreaElement;
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const t = target.value.trim();
              if (t) {
                send(t);
                target.value = '';
              }
            }
          }}
        />
        <button
          onClick={() => {
            const ta = (document.activeElement as HTMLTextAreaElement) || document.querySelector('textarea');
            const t = (ta?.value || '').trim();
            if (t) {
              send(t);
              if (ta) ta.value = '';
            }
          }}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
