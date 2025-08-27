'use client';
import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import type { SourceLink } from '@/lib/types';

type Msg = { role: 'user' | 'assistant'; content: string };
type Doc = { name: string; type: string; text: string };

export default function ChatWindow({ mode }: { mode: 'citizen'|'lawyer' }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sources, setSources] = useState<SourceLink[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: q }]);
    setLoading(true);
    setSources([]);
    try {
      // show temporary searching status
      setMessages(m => [...m, { role: 'assistant', content: 'Searching…' }]);
      setSearching(true);

      let webDocs: Doc[] = [];
      let webSources: SourceLink[] = [];
      try {
        const r = await fetch('/api/websearch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        });
        const data = await r.json();
        webSources = Array.isArray(data?.results) ? data.results.slice(0, 3) : [];

        for (const s of webSources) {
          try {
            const scr = await fetch('/api/scrape', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: s.url }),
            });
            const scrData = await scr.json();
            if (scrData?.text) {
              webDocs.push({ name: s.title, type: 'web', text: scrData.text });
            }
          } catch {}
        }
      } catch {}

      setSearching(false);
      // remove the 'Searching…' placeholder
      setMessages(m => m.slice(0, -1));

      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, mode, docs: [...docs, ...webDocs] }),
      });
      const data = await res.json();
      const text = data?.answer ?? 'No answer.';
      setMessages(m => [...m, { role: 'assistant', content: text }]);
      setSources(webSources);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: '⚠️ Error talking to server.' }]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }

  // Enter inserts newline; use button to send
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // don’t send on Enter
    }
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('files', f));
    setUploadBusy(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data?.files?.length) {
        setDocs(prev => [...prev, ...data.files]);
      } else {
        alert('Could not read those files.');
      }
    } catch {
      alert('Upload failed.');
    } finally {
      setUploadBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }

  async function clearChat() {
    setMessages([]);
    setDocs([]);
    setSources([]);
    setInput('');
    try { await fetch('/api/clear', { method: 'POST' }); } catch {}
    textareaRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Conversation */}
      <div className="flex-1 overflow-auto p-5">
        {messages.length === 0 ? (
          <div className="text-sm text-slate-500">
            👋 Ask about a law, section, or case. Example: <em>“Draft a rent agreement for a Delhi apartment.”</em>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} />
            ))}
            {sources.length > 0 && (
              <div className="pt-3 border-t mt-3">
                <div className="text-xs font-medium mb-2">Sources</div>
                <ul className="space-y-1 text-xs">
                  {sources.map((s, i) => (
                    <li key={i}>
                      <a className="text-brand hover:underline" href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.title}
                      </a>
                      {s.snippet && (
                        <div className="text-[11px] text-slate-600">{s.snippet}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t p-4 space-y-3">
        {/* attachments */}
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn"
            disabled={uploadBusy}
          >
            {uploadBusy ? 'Reading…' : 'Attach files'}
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="btn"
            disabled={uploadBusy}
          >
            Camera
          </button>
          <button onClick={clearChat} className="btn">New Chat</button>
        </div>

        {/* hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
          accept=".pdf,.docx,.txt,image/*"
        />
        <input
          ref={cameraInputRef}
          type="file"
          capture="environment"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        {/* list of attached docs */}
        {docs.length > 0 && (
          <div className="text-xs">
            <div className="font-medium mb-1">Attached ({docs.length})</div>
            <ul className="space-y-1 max-h-28 overflow-auto pr-1">
              {docs.map((d, i) => <li key={i} className="truncate">• {d.name}</li>)}
            </ul>
          </div>
        )}

        {/* input + send button (Enter key no-send) */}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your question… (Shift+Enter for a new line)"
            className="input h-24 resize-y"
          />
          <button
            className="btn"
            disabled={loading || !input.trim()}
            onClick={send}
            title="Send"
          >
            {searching ? 'Searching…' : loading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
