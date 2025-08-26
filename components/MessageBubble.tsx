'use client';

import { Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react';
import type { Message } from '@/lib/types';
import { loadChats, saveChats } from '@/lib/storage';

export default function MessageBubble({ chatId, message, onSaveToggle }:{ chatId: string, message: Message, onSaveToggle: (m: Message)=>void }) {
  const isUser = message.role === 'user';
  const bg = isUser ? 'bg-brand-muted' : 'bg-white';
  const border = isUser ? 'border-brand/20' : 'border-zinc-200';

  function toggleSave() {
    const chats = loadChats();
    const ch = chats.find(c=>c.id===chatId);
    if (!ch) return;
    const msg = ch.messages.find(m=>m.id===message.id);
    if (!msg) return;
    msg.saved = !msg.saved;
    saveChats(chats);
    onSaveToggle(msg);
  }

  return (
    <div className={`rounded-2xl border ${border} ${bg} p-4`}>
      {message.content.split('\n').map((p, i) => <p key={i} className="text-sm leading-6 whitespace-pre-wrap">{p}</p>)}
      {message.sources && message.sources.length > 0 && (
        <div className="mt-3 space-y-1">
          <div className="text-xs font-semibold text-zinc-600">Sources</div>
          <ul className="space-y-1">
            {message.sources.map((s, i)=> (
              <li key={i} className="text-xs">
                <a href={s.url} target="_blank" className="inline-flex items-center gap-1 text-brand hover:underline">
                  {s.title} <ExternalLink size={12}/>
                </a>
                {s.tag && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">{s.tag}</span>}
                {s.snippet && <div className="text-[11px] text-zinc-600 mt-0.5">{s.snippet}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!isUser && (
        <button onClick={toggleSave} className="mt-2 inline-flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-900">
          {message.saved ? <BookmarkCheck size={14}/> : <Bookmark size={14}/>}
          {message.saved ? 'Saved to Library' : 'Save to Library'}
        </button>
      )}
    </div>
  );
}
