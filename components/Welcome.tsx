// components/Welcome.tsx
'use client';

import { greetingFor } from '@/lib/prompt';

export default function Welcome({ onPick }: { onPick: (text: string) => void }) {
  const g = greetingFor();
  const ideas = [
    'How to file an RTI in India?',
    'Rent agreement basics (landlord/tenant)',
    'Consumer complaint for defective product',
    'Key cases on anticipatory bail (S.438 CrPC)',
  ];

  return (
    <div className="p-6">
      <div className="text-2xl font-semibold mb-2">{g}! 👋</div>
      <div className="text-zinc-600 mb-4">
        Ask about a law, section, or case. I’ll keep it simple and cite where possible.
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {ideas.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left border rounded-lg px-4 py-3 hover:bg-zinc-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
