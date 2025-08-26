'use client';

import ChatSidebar from '@/components/ChatSidebar';
import ChatWindow from '@/components/ChatWindow';
import { useSearchParams } from 'next/navigation';

export default function HomePage() {
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;
  return (
    <div className="w-full flex">
      <ChatSidebar activeId={id}/>
      <ChatWindow/>
    </div>
  );
}
