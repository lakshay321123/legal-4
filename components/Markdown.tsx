// components/Markdown.tsx
'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  children: string;
  className?: string;
};

/**
 * Safe markdown renderer (no raw HTML execution).
 * Supports **bold**, _italics_, lists, tables, links, and fenced code blocks.
 */
export default function Markdown({ children, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        // GitHub-flavored markdown (tables, strikethrough, task lists)
        remarkPlugins={[remarkGfm]}
        // DO NOT render raw HTML from user/model for safety
        skipHtml
        components={{
          p: ({ node, ...props }) => (
            <p className="leading-7 my-3" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 my-3 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 my-3 space-y-1" {...props} />
          ),
          li: ({ node, ...props }) => <li className="my-1" {...props} />,
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          code({ inline, children, ...props }) {
            const text = String(children);
            if (inline) {
              return (
                <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-800" {...props}>
                  {text}
                </code>
              );
            }
            return (
              <pre className="my-3 rounded-lg bg-slate-950 text-slate-100 p-3 overflow-x-auto">
                <code {...props}>{text}</code>
              </pre>
            );
          },
          h1: ({ node, ...props }) => <h1 className="text-xl font-semibold mt-4 mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mt-4 mb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-3 mb-1.5" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-slate-300 pl-3 italic my-3 text-slate-700" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-[480px] text-sm border border-slate-200" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-slate-200 px-2 py-1 align-top" {...props} />
          ),
          hr: () => <hr className="my-4 border-slate-200" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
