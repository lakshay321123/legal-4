// components/TopBar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

type Props = {
  title?: string;
};

export default function TopBar({ title = 'LexLens' }: Props) {
  return (
    <header className="w-full border-b border-zinc-200 bg-white/70 dark:bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-zinc-900/60 dark:border-zinc-700">
      <div className="mx-auto max-w-6xl px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold text-zinc-800 dark:text-zinc-100">
            {title}
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/search" className="hover:text-black dark:hover:text-white">Search</Link>
            <Link href="/library" className="hover:text-black dark:hover:text-white">Library</Link>
            <Link href="/settings" className="hover:text-black dark:hover:text-white">Settings</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/upgrade"
            className="text-xs sm:text-sm border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </header>
  );
}
