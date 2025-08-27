'use client';

import { useState, useRef } from 'react';

export default function Composer({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [val, setVal] = useState('');
  const ref = useRef<HTMLTextAreaElement | null>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  }
  function doSend() {
    const t = val.trim();
    if (!t || disabled) return;
    onSend(t);
    setVal('');
    ref.current?.focus();
  }

  return (
    <div className="card p-3 flex items-end gap-3">
      <textarea
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your question… (Shift+Enter for a new line)"
        rows={1}
        className="flex-1 resize-none outline-none bg-transparent px-3 py-2 rounded-xl border border-slate-300 focus:border-slate-500"
      />
      <button
        onClick={doSend}
        disabled={disabled || val.trim().length === 0}
        className="px-4 py-2 rounded-xl bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition"
        aria-label="Send"
      >
        Send
      </button>
    </div>
  );
}
