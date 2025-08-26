'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-slate leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: (props) => <a {...props} className="text-brand-600 underline hover:no-underline" />,
          code: ({inline, className, children, ...rest}) =>
            inline ? (
              <code className="px-1 py-0.5 rounded bg-slate-100" {...rest}>{children}</code>
            ) : (
              <pre className="rounded-xl bg-slate-900 text-slate-50 p-4 overflow-auto">
                <code className={className} {...rest}>{children}</code>
              </pre>
            )
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
