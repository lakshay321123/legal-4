'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShieldAlert, ShieldCheck, User, Scale, Search, LibraryBig, PlusCircle } from 'lucide-react';
import { loadState, saveState } from '@/lib/storage';

export default function TopBar() {
  const state = loadState();
  const mode = state.mode;
  function toggleMode() {
    const s = loadState();
    s.mode = s.mode === 'citizen' ? 'lawyer' : 'citizen';
    saveState(s);
    window.dispatchEvent(new Event('app:state'));
  }

  return (
    <div className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-zinc-200">
      <div className="mx-auto max-w-[1400px] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Logo" width={28} height={28} />
          <span className="font-semibold">LexLens</span>
          <span className="text-xs bg-brand-muted text-brand px-2 py-0.5 rounded-full ml-2">beta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex text-xs items-center gap-3 px-2 py-1 rounded-full bg-zinc-100">
            <button onClick={toggleMode} className={"px-3 py-1 rounded-full " + (mode === 'citizen' ? 'bg-white shadow' : '')}>
              <div className="flex gap-2 items-center"><User size={14}/> Citizen</div>
            </button>
            <button onClick={toggleMode} className={"px-3 py-1 rounded-full " + (mode === 'lawyer' ? 'bg-white shadow' : '')}>
              <div className="flex gap-2 items-center"><Scale size={14}/> Lawyer</div>
            </button>
          </div>
          <Link href="/" className="hidden sm:inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full hover:bg-zinc-100"><PlusCircle size={16}/> New chat</Link>
          <Link href="/library" className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full hover:bg-zinc-100"><LibraryBig size={16}/> Library</Link>
          <Link href="/search" className="hidden sm:inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full hover:bg-zinc-100"><Search size={16}/> Search chats</Link>
                  <a href="/settings" className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full hover:bg-zinc-100">Settings</a>
        </div>
      </div>
      <div className="bg-amber-50 border-t border-b border-amber-200 text-amber-900 text-xs">
        <div className="mx-auto max-w-[1400px] px-4 py-2 flex items-center gap-2">
          {mode === 'citizen' ? <ShieldAlert size={16}/> : <ShieldCheck size={16}/>}
          <div>
            <strong>Informational only.</strong> Not legal advice; no attorney–client relationship. Verify with the linked sources.
          </div>
                  <a href="/settings" className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full hover:bg-zinc-100">Settings</a>
        </div>
      </div>
    </div>
  );
}
