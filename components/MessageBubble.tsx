'use client';

import Markdown from './Markdown';
import { clsx } from 'clsx';

export default function MessageBubble({
  role,
  text,
}: {
  role: 'user' | 'assistant';
  text: string;
}) {
  const mine = role === 'user';
  return (
    <div className={clsx("w-full flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] md:max-w-[75%] lg:max-w-[70%] card p-4 md:p-5",
          mine ? "bg-slate-900 text-white border-transparent" : "bg-white"
        )}
      >
        {mine ? (
          <div className="whitespace-pre-wrap">{text}</div>
        ) : (
          <Markdown>{text}</Markdown>
        )}
      </div>
    </div>
  );
}
