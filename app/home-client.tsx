'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Load heavy UI only on the client (no SSR) to avoid window/localStorage crashes
const ChatSidebar = dynamic(() => import('@/components/ChatSidebar'), { ssr: false });
const ChatWindow  = dynamic(() => import('@/components/ChatWindow'), { ssr: false });

const isBrowser = () => typeof window !== 'undefined';

export default function HomeClient() {
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  // render only after mount to avoid hydration/client crashes
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  // optional one-time reset if stored data is corrupt
  useEffect(() => {
    if (!isBrowser()) return;
    if (params.get('reset') === '1') {
      try { localStorage.removeItem('lexlens_chats'); } catch {}
    }
  }, [params]);

  if (!ready) return <div className="p-6 text-sm text-zinc-500">Loading…</div>;

  return (
    <div className="w-full flex">
      <Suspense fallback={<div className="p-4 text-sm text-zinc-500">Loading sidebar…</div>}>
        <ChatSidebar activeId={id}/>
      </Suspense>
      <Suspense fallback={<div className="p-4 text-sm text-zinc-500">Loading chat…</div>}>
        <ChatWindow/>
      </Suspense>
    </div>
  );
}
