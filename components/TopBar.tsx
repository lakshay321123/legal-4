// components/TopBar.tsx
'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
  title?: string;
};

export default function TopBar({ title = 'LexLens' }: Props) {
  return (
    <header className="w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-6xl px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold text-zinc-800">
            {title}
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-600">
            <Link href="/search" className="hover:text-black">Search</Link>
            <Link href="/library" className="hover:text-black">Library</Link>
            <Link href="/settings" className="hover:text-black">Settings</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/upgrade"
            className="text-xs sm:text-sm border rounded px-3 py-1 hover:bg-zinc-50"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </header>
  );
}
