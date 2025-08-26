'use client';

import { loadChats } from '@/lib/storage';
import type { Message } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function LibraryPage() {
  const [saved, setSaved] = useState<Message[]>([]);
  useEffect(() => {
    function refresh() {
      const all = loadChats();
      const msgs = all.flatMap(c => c.messages.filter(m => m.saved));
      setSaved(msgs.sort((a,b)=>b.createdAt-a.createdAt));
    }
    refresh();
    window.addEventListener('app:chats', refresh);
    return () => window.removeEventListener('app:chats', refresh);
  }, []);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Library</h1>
        <p className="text-sm text-zinc-600">Saved answers with their sources.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {saved.length === 0 && <div className="text-sm text-zinc-500">Nothing saved yet.</div>}
        {saved.map(m => (
          <div key={m.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-sm whitespace-pre-wrap">{m.content}</div>
            {m.sources && m.sources.length > 0 && (
              <ul className="mt-3 space-y-1">
                {m.sources.map((s,i)=>(
                  <li key={i} className="text-xs">
                    <a className="text-brand hover:underline" href={s.url} target="_blank">{s.title}</a>{' '}
                    {s.tag && <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-zinc-100 rounded">{s.tag}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
