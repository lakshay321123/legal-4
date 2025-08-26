'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { loadChats, saveChats } from '@/lib/storage';
import type { Chat } from '@/lib/types';
import { Plus, Search, Trash2 } from 'lucide-react';

export default function ChatSidebar({ activeId }: { activeId?: string }) {
  const [q, setQ] = useState('');
  const [chats, setChats] = useState<Chat[]>(loadChats());
  useEffect(() => {
    function onUpdate() {
      setChats(loadChats());
    }
    window.addEventListener('app:chats', onUpdate);
    return () => window.removeEventListener('app:chats', onUpdate);
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return chats.sort((a,b)=>b.updatedAt-a.updatedAt);
    return chats.filter(c => (c.title?.toLowerCase().includes(t) || c.messages.some(m => m.content.toLowerCase().includes(t)))).sort((a,b)=>b.updatedAt-a.updatedAt);
  }, [q, chats]);

  function newChat() {
    const id = crypto.randomUUID();
    const chat: Chat = { id, title: 'New chat', createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
    const all = [chat, ...loadChats()];
    saveChats(all);
    window.location.href = `/?id=${id}`;
  }

  function deleteChat(id: string) {
    const all = loadChats().filter(c => c.id !== id);
    saveChats(all);
    setChats(all);
    if (activeId === id) window.location.href = `/`;
    window.dispatchEvent(new Event('app:chats'));
  }

  return (
    <aside className="w-72 border-r border-zinc-200 h-[calc(100vh-56px-40px)] sticky top-[56px] bg-white hidden md:flex flex-col">
      <div className="p-3 flex gap-2">
        <button onClick={newChat} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white px-3 py-2 text-sm">
          <Plus size={16}/> New chat
        </button>
      </div>
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 text-zinc-400" size={16}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search chats" className="w-full pl-8 pr-3 py-2 rounded-lg bg-zinc-100 outline-none text-sm"/>
        </div>
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin">
        {filtered.length === 0 && <div className="p-4 text-sm text-zinc-500">No chats yet.</div>}
        <ul className="px-2 py-1">
          {filtered.map(chat => (
            <li key={chat.id}>
              <Link href={`/?id=${chat.id}`} className={"group flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-zinc-100 " + (activeId===chat.id?'bg-zinc-100':'')}>
                <span className="truncate text-sm">{chat.title || 'Untitled'}</span>
                <button onClick={(e)=>{e.preventDefault(); deleteChat(chat.id);}} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-700">
                  <Trash2 size={16}/>
                </button>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
