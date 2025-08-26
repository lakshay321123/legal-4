// components/ChatWindow.tsx
'use client';

export default function ChatWindow({
  messages = [],
}: {
  messages: { role: 'user' | 'assistant'; content: string }[];
}) {
  return (
    <div className="flex-1 overflow-auto p-4">
      {messages.length === 0 ? (
        <div className="text-sm text-zinc-500">Start a new legal search. Ask in plain English.</div>
      ) : (
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80ch] whitespace-pre-wrap rounded px-3 py-2 border ${
                m.role === 'user' ? 'bg-white' : 'bg-zinc-50'
              }`}
            >
              <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">
                {m.role === 'user' ? 'You' : 'LexLens'}
              </div>
              <div className="text-sm leading-6">{m.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
