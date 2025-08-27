'use client';
import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';

type Msg = { role: 'user' | 'assistant'; content: string };
type Doc = { name: string; type: string; text: string };
type SearchResult = { title: string; url: string; snippet: string };

export default function ChatWindow({ mode }: { mode: 'citizen'|'lawyer' }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);

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
    try {
      let search: SearchResult[] = [];
      try {
        const ws = await fetch('/api/websearch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        });
        const wsData = await ws.json();
        search = Array.isArray(wsData?.results) ? wsData.results : [];
      } catch {}

      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, mode, docs, search }),
      });
      const data = await res.json();
      const text = data?.answer ?? 'No answer.';
      setMessages(m => [...m, { role: 'assistant', content: text }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: '⚠️ Error talking to server.' }]);
    } finally {
      setLoading(false);
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
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
