"use client";
import { useRef, useState } from "react";
import ModeToggle from "@/components/ModeToggle";
import ChatWindow, { ChatWindowHandle } from "@/components/ChatWindow";

export default function HomeClient() {
  const [mode, setMode] = useState<'citizen' | 'lawyer'>('citizen');
  const chatRef = useRef<ChatWindowHandle>(null);

  return (
    <div className="py-6 grid gap-4 md:grid-cols-[280px_1fr] h-screen">
      {/* Left Sidebar */}
      <div className="space-y-3 px-4">
        <div className="text-lg font-semibold">LexLens</div>
        <ModeToggle mode={mode} onChange={setMode} />
        <div className="card p-3 space-y-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">Quick starts</div>
          {[
            "Draft a rent agreement for a Delhi apartment (essentials + clauses).",
            "Explain Article 21 with 2 landmark cases in simple words.",
            "Steps to file an online consumer complaint in India.",
            "Bail basics: types and common conditions.",
          ].map(q => (
            <button
              key={q}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm"
              onClick={() => chatRef.current?.setInputValue(q)}
            >
              {q}
            </button>
          ))}
          <div className="text-[11px] text-slate-500 px-1">
            Informational only — not legal advice.
          </div>
        </div>
      </div>

      {/* Right Main */}
      <div className="border-l">
        <header className="px-5 py-3 text-sm text-slate-700 border-b">
          {mode === 'lawyer' ? 'LexLens — Lawyer Mode' : 'LexLens — Citizen Mode'}
        </header>
        <ChatWindow mode={mode} ref={chatRef} />
      </div>
    </div>
  );
}
