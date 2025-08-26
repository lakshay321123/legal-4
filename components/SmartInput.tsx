// components/SmartInput.tsx
'use client';

import { useEffect, useState } from 'react';
import { looksVague } from '@/lib/prompt';

export default function SmartInput({
  onSend,
  disabled,
}: {
  onSend: (q: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const v = value.trim();
    if (!v) { setHint(null); return; }
    if (looksVague(v)) setHint('Tip: add location, law/section, or a brief fact to get a sharper answer.');
    else setHint(null);
  }, [value]);

  function send() {
    const q = value.trim();
    if (!q) return;
    onSend(q);
    setValue('');
  }

  return (
    <div className="p-3 border-t">
      <div className="flex items-end gap-2">
        <textarea
          className="flex-1 border rounded p-2 text-sm min-h-[44px] max-h-[180px]"
          placeholder="Ask about a law, section, or case…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          }}
        />
        <button
          className="border rounded px-3 py-2 text-sm"
          onClick={send}
          disabled={disabled || !value.trim()}
        >
          {disabled ? 'Sending…' : 'Send'}
        </button>
      </div>
      {hint && <div className="text-xs text-zinc-500 mt-2">{hint}</div>}
    </div>
  );
}
