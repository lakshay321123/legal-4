'use client';

import { useMemo, useState } from 'react';
import { loadChats } from '@/lib/storage';

export default function SearchClient() {
  const [q, setQ] = useState('');
  const chats = loadChats();

  const results = useMemo(()=>{
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return chats.flatMap(c => c.messages.map(m => ({ chatId: c.id, title: c.title, content: m.content, createdAt: m.createdAt })))
      .filter(x => x.content.toLowerCase().includes(t) || (x.title?.toLowerCase().includes(t)))
      .sort((a,b)=>b.createdAt-a.createdAt)
      .slice(0, 200);
  }, [q, chats]);

  return (
    <div className="w-full">
      <h1 className="text-xl font-semibold mb-4">Search chats</h1>
      <div className="mb-4">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search across all your chats…" className="w-full md:w-2/3 px-3 py-2 rounded-lg border border-zinc-300"/>
      </div>
      <div className="space-y-3">
        {results.map((r, i)=> (
          <a key={i} href={`/?id=${r.chatId}`} className="block rounded-lg border border-zinc-200 bg-white p-3 hover:bg-zinc-50">
            <div className="text-sm font-medium">{r.title || 'Untitled'}</div>
            <div className="text-xs text-zinc-600 line-clamp-2">{r.content}</div>
          </a>
        ))}
        {q && results.length === 0 && <div className="text-sm text-zinc-500">No matches found.</div>}
      </div>
    </div>
  );
}
