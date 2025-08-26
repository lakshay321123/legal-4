'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

/** Renders answer markdown nicely (no more *** showing) */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-custom">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: (props) => <h2 className="mt-0" {...props} />,
          code: (props: any) => {
            const { inline, children, className, ...rest } = props;
            if (inline) {
              return <code className="px-1 py-0.5 rounded bg-slate-100" {...rest}>{children}</code>;
            }
            return (
              <pre className="rounded-xl border border-slate-200 bg-slate-50 p-3 overflow-auto">
                <code className={className} {...rest}>{children}</code>
              </pre>
            );
          },
          table: (props) => (
            <div className="overflow-x-auto">{/* keep tables scrollable */}
              <table className="min-w-[560px]" {...props} />
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
