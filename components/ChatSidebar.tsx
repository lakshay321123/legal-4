// components/ChatSidebar.tsx
'use client';

import Link from 'next/link';

export default function ChatSidebar() {
  return (
    <aside className="w-[260px] border-r h-[calc(100dvh-96px)] flex flex-col">
      <div className="p-3 border-b flex gap-2">
        <Link className="text-sm border rounded px-3 py-1" href="/">+ New chat</Link>
      </div>
      <nav className="flex-1 overflow-auto">
        <div className="p-3 text-sm text-zinc-500">
          Welcome to LexLens. Start by asking a question.
        </div>
      </nav>
      <div className="p-3 border-t text-xs text-zinc-500">
        <div className="flex gap-2">
          <Link href="/library">Library</Link>
          <Link href="/search">Search chats</Link>
          <Link href="/settings">Settings</Link>
        </div>
      </div>
    </aside>
  );
}
