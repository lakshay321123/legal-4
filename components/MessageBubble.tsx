'use client';
import Markdown from './Markdown';
import clsx from 'clsx';

export default function MessageBubble({
  role,
  content,
}: {
  role: 'user' | 'assistant';
  content: string;
}) {
  return (
    <div className={clsx(
      "max-w-[80ch] rounded-2xl border px-4 py-3",
      role === 'user' ? "bg-white" : "bg-slate-50"
    )}>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
        {role === 'user' ? 'You' : 'LexLens'}
      </div>
      <div className="text-sm leading-7">
        <Markdown>{content}</Markdown>
      </div>
    </div>
  );
}
