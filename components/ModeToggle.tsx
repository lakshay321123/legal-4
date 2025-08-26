'use client';
export default function ModeToggle({
  mode,
  onChange
}: {
  mode: 'citizen' | 'lawyer';
  onChange: (m: 'citizen'|'lawyer') => void;
}) {
  return (
    <div className="card p-2">
      <div className="text-xs uppercase tracking-wide text-slate-500 px-1 mb-2">Mode</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          className={`btn ${mode === 'citizen' ? 'bg-slate-50' : ''}`}
          onClick={() => onChange('citizen')}
        >Citizen</button>
        <button
          className={`btn ${mode === 'lawyer' ? 'bg-slate-50' : ''}`}
          onClick={() => onChange('lawyer')}
        >Lawyer</button>
      </div>
      <div className="text-xs text-slate-500 px-1 mt-2">
        {mode === 'lawyer'
          ? 'Structured: Issues · Rules · Analysis · Notes.'
          : 'Simple words and step-by-step guidance.'}
      </div>
    </div>
  );
}
