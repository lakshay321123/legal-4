'use client';

import ChatSidebar from '@/components/ChatSidebar';
import ChatWindow from '@/components/ChatWindow';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isBrowser, load } from '@/lib/safe';

export default function HomeClient() {
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  // render only after the browser is ready to avoid client-side crashes
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  // warm up localStorage safely (ignore if missing/corrupt)
  useEffect(() => {
    if (!isBrowser()) return;
    load('lexlens_chats', []);
  }, []);

  if (!ready) return <div className="p-6 text-sm text-zinc-500">Loading…</div>;

  return (
    <div className="w-full flex">
      <ChatSidebar activeId={id}/>
      <ChatWindow/>
    </div>
  );
}
