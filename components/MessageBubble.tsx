'use client';
import Markdown from './Markdown';
import clsx from 'clsx';

export default function MessageBubble({
  role,
  content,
  sources,
}: {
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; url: string }[];
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
        {sources?.length ? (
          <ol className="mt-3 space-y-1 text-xs">
            {sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  [{i + 1}] {s.title}
                </a>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
