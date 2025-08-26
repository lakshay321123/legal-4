// components/Markdown.tsx
'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-slate max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Use `any` for props to avoid TS complaining about `inline`
          code: (props: any) => {
            const { inline, className, children, ...rest } = props;
            const text = String(children ?? '');

            if (inline) {
              return (
                <code
                  className={`px-1 py-0.5 rounded bg-slate-100 ${className || ''}`}
                  {...rest}
                >
                  {text}
                </code>
              );
            }

            return (
              <pre className="rounded-lg border bg-slate-50 overflow-auto p-3 text-sm">
                <code className={className} {...rest}>
                  {text}
                </code>
              </pre>
            );
          },
          a: (props: any) => (
            <a
              {...props}
              className="text-brand-600 underline"
              target="_blank"
              rel="noreferrer"
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
