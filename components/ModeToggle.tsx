'use client';

import { clsx } from 'clsx';

export default function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'citizen'|'lawyer';
  onChange: (m: 'citizen'|'lawyer') => void;
}) {
  const btn = "px-3 py-1.5 rounded-xl border text-sm transition";
  const active = "bg-slate-900 text-white border-transparent";
  const idle = "bg-white border-slate-300 hover:bg-slate-50";

  return (
    <div className="card p-2 flex gap-2">
      <button
        className={clsx(btn, mode === 'citizen' ? active : idle)}
        onClick={() => onChange('citizen')}
      >
        Citizen
      </button>
      <button
        className={clsx(btn, mode === 'lawyer' ? active : idle)}
        onClick={() => onChange('lawyer')}
      >
        Lawyer
      </button>
    </div>
  );
}
