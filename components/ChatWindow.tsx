'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { loadChats, saveChats, loadState, saveState } from '@/lib/storage';
import type { Chat, Message } from '@/lib/types';
import MessageBubble from './MessageBubble';
import { SendHorizonal, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function titleFromFirstUserMessage(messages: Message[]) {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return 'New chat';
  const t = firstUser.content.replace(/\n/g, ' ').trim();
  return t.length > 40 ? t.slice(0, 40) + '…' : t || 'New chat';
}

export default function ChatWindow() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const [chats, setChats] = useState<Chat[]>(loadChats());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState(loadState());
  const chat = useMemo(() => {
    let c = chats.find(c => c.id === id);
    if (!c && chats.length > 0) c = chats[0];
    return c;
  }, [id, chats]);

  useEffect(() => {
    function onState(){ setState(loadState()); }
    window.addEventListener('app:state', onState);
    return () => window.removeEventListener('app:state', onState);
  }, []);

  function ensureChat() {
    let all = loadChats();
    let c = all.find(c => c.id === id);
    if (!c) {
      const newId = id || crypto.randomUUID();
      c = { id: newId, title: 'New chat', createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
      all = [c, ...all];
      saveChats(all);
      setChats(all);
      if (!id) window.history.replaceState(null, '', `/?id=${newId}`);
    }
    return c;
  }

  async function handleSend() {
    const q = input.trim();
    if (!q) return;
    setInput('');

    // Lawyer gating: 10 prompts/month on free plan
    const s = loadState();
    if (s.mode === 'lawyer' && s.plan === 'free' && s.lawyerPromptsUsedThisMonth >= 10) {
      if (confirm('Lawyer mode trial limit reached (10 prompts this month). Go to Upgrade?')) { window.location.href = '/upgrade'; }
      return;
    }

    const c = ensureChat();
    const msg: Message = { id: crypto.randomUUID(), role: 'user', content: q, createdAt: Date.now(), mode: s.mode };
    c.messages.push(msg);
    c.updatedAt = Date.now();
    c.title = titleFromFirstUserMessage(c.messages);
    saveChats([c, ...loadChats().filter(x=>x.id!==c.id)]);
    setChats(loadChats());

    setLoading(true);
    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ query: q, mode: s.mode })
      });
      const data = await res.json();
      const ai: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        createdAt: Date.now(),
        sources: data.sources,
        mode: s.mode
      };
      const all = loadChats();
      const ch = all.find(x=>x.id===c.id);
      if (ch) {
        ch.messages.push(ai);
        ch.updatedAt = Date.now();
        saveChats([ch, ...all.filter(x=>x.id!==ch.id)]);
        setChats(loadChats());
      }
      if (s.mode === 'lawyer' && s.plan === 'free') {
        s.lawyerPromptsUsedThisMonth += 1;
        saveState(s);
        setState(s);
      }
    } catch (e) {
      const all = loadChats();
      const ch = all.find(x=>x.id===c.id);
      if (ch) {
        ch.messages.push({ id: crypto.randomUUID(), role: 'assistant', createdAt: Date.now(), content: 'Sorry, something went wrong. Please try again.' });
        ch.updatedAt = Date.now();
        saveChats([ch, ...all.filter(x=>x.id!==ch.id)]);
        setChats(loadChats());
      }
    } finally {
      setLoading(false);
    }
  }

  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, [chat?.id]);

  return (
    <div className="flex-1 flex flex-col">
      {!chat && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-semibold">Start a new legal search</h1>
            <p className="text-zinc-600 mt-2">Ask in plain English. We’ll show sources (Acts, judgments, gazette). Toggle Citizen/Lawyer in the top bar.</p>
          </div>
        </div>
      )}
      {chat && (
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {chat.messages.length === 0 && (
            <div className="text-center text-sm text-zinc-500">No messages yet. Ask your first question.</div>
          )}
          {chat.messages.map(m => (
            <MessageBubble key={m.id} chatId={chat.id} message={m} onSaveToggle={()=>{ setChats(loadChats()); }}/>
          ))}
        </div>
      )}
      <div className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-[950px] px-4 py-3">
          <div className="rounded-2xl border border-zinc-300 bg-white p-2 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handleSend(); }}}
              rows={1}
              placeholder="Ask about a law, section, or case…"
              className="flex-1 resize-none outline-none px-2 py-2 text-sm leading-6"
            />
            <button onClick={handleSend} disabled={loading} className="inline-flex items-center justify-center rounded-xl bg-zinc-900 text-white px-3 py-2 text-sm disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={16}/> : <SendHorizonal size={16}/>}
            </button>
          </div>
          <div className="text-[11px] text-zinc-500 mt-2">
            Informational only. Not legal advice. Sources required for every answer.
          </div>
        </div>
      </div>
    </div>
  );
}
