'use client';

import { useEffect, useState } from 'react';
import { loadState, saveState } from '@/lib/storage';

export default function SettingsPage() {
  const [plan, setPlan] = useState('free');
  const [hindi, setHindi] = useState(false);

  useEffect(() => {
    const s = loadState();
    setPlan(s.plan);
    setHindi(localStorage.getItem('lexlens:hindi') === '1');
  }, []);

  function save() {
    const s = loadState();
    s.plan = plan as any;
    saveState(s);
    localStorage.setItem('lexlens:hindi', hindi ? '1' : '0');
    alert('Saved!');
  }

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      <div className="space-y-6">
        <div>
          <div className="text-sm font-medium mb-2">Plan</div>
          <select value={plan} onChange={e=>setPlan(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="free">Free</option>
            <option value="citizen_plus">Citizen+</option>
            <option value="lawyer_pro">Lawyer Pro</option>
            <option value="firm">Firm</option>
          </select>
          <p className="text-xs text-zinc-500 mt-1">This is a local setting for demo. Billing integration will set this automatically.</p>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hindi} onChange={e=>setHindi(e.target.checked)} />
            Prefer Hindi answers for Citizen mode
          </label>
        </div>
        <button onClick={save} className="inline-flex items-center rounded-lg bg-zinc-900 text-white px-3 py-2 text-sm">Save</button>
      </div>
    </div>
  )
}
