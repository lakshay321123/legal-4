// app/home-client.tsx
'use client';

import { useState } from 'react';
import ModeToggle from '@/components/ModeToggle';
import ChatWindow from '@/components/ChatWindow';

export default function HomeClient() {
  // Citizen / Lawyer switcher
  const [mode, setMode] = useState<'citizen'|'lawyer'>('citizen');

  return (
    <div className="chat-container py-6 grid gap-4 md:grid-cols-[260px_1fr]">
      {/* ===== Left Sidebar ===== */}
      <div className="space-y-3">
        {/* Mode switch */}
        <ModeToggle mode={mode} onChange={setMode} />

        {/* Quick start example questions */}
        <div className="card p-3 space-y-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">Quick starts</div>
          {[
            'Draft a rent agreement for a Delhi apartment (essentials + clauses).',
            'Explain Article 21 with 2 landmark cases in simple words.',
            'Steps to file an online consumer complaint in India.',
            'Bail basics: types and common conditions.',
          ].map((q) => (
            <button
              key={q}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm"
              onClick={() => {
                // Pre-fill the composer textarea inside ChatWindow
                const ta = document.querySelector('textarea');
                if (ta) {
                  (ta as HTMLTextAreaElement).value = q;
                  ta.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="text-[11px] text-slate-500 px-1">
          Informational only. Not legal advice.
        </div>
      </div>

      {/* ===== Right: Main Chat Window ===== */}
      <ChatWindow mode={mode} />
    </div>
  );
}
