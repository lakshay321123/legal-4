// app/home-client.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };
type Doc = { name: string; type: string; text: string };

export default function HomeClient() {
  const [mode, setMode] = useState<'citizen' | 'lawyer'>('citizen');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // focus textarea on mount
  useEffect(() => { textareaRef.current?.focus(); }, []);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, mode, docs }),
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

  // Enter inserts newline. Use button to send.
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      // prevent submit on single Enter
      e.preventDefault();
      return;
    }
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fd = new FormData();
    // allow multiple
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
    } catch (e) {
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

  const starters = [
    'Draft a rent agreement for a Delhi apartment (essentials + clauses).',
    'Explain Article 21 with 2 landmark cases in simple words.',
    'Steps to file an online consumer complaint in India.',
    'Bail basics: types and common conditions.',
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-[300px] border-r p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">LexLens</div>
          <button
            onClick={clearChat}
            className="text-xs border rounded px-2 py-1 hover:bg-zinc-50"
            title="Start a fresh chat"
          >
            New Chat
          </button>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Mode</div>
          <div className="flex gap-2">
            <button
              className={`text-sm border rounded px-3 py-1 ${mode==='citizen' ? 'bg-zinc-100' : ''}`}
              onClick={() => setMode('citizen')}
            >
              Citizen
            </button>
            <button
              className={`text-sm border rounded px-3 py-1 ${mode==='lawyer' ? 'bg-zinc-100' : ''}`}
              onClick={() => setMode('lawyer')}
            >
              Lawyer
            </button>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {mode === 'lawyer' ? 'Structured analysis with issues, rules, analysis, notes.' : 'Plain-language explanations with steps.'}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Quick Starts</div>
          <div className="space-y-2">
            {starters.map((s, i) => (
              <button
                key={i}
                onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                className="block text-left w-full border rounded p-2 text-sm hover:bg-zinc-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Attachments</div>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm border rounded px-3 py-1 hover:bg-zinc-50"
              disabled={uploadBusy}
            >
              {uploadBusy ? 'Reading…' : 'Attach files'}
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="text-sm border rounded px-3 py-1 hover:bg-zinc-50"
              disabled={uploadBusy}
            >
              Camera
            </button>
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

          {/* small list of attached docs */}
          {docs.length > 0 && (
            <div className="mt-3 text-xs">
              <div className="font-medium mb-1">Attached ({docs.length})</div>
              <ul className="space-y-1 max-h-28 overflow-auto pr-1">
                {docs.map((d, i) => (
                  <li key={i} className="truncate">
                    • {d.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        <header className="border-b px-5 py-3 text-sm text-zinc-700">
          {mode === 'lawyer' ? 'LexLens — Lawyer Mode' : 'LexLens — Citizen Mode'}
        </header>

        {/* Conversation */}
        <div className="flex-1 overflow-auto p-5">
          {messages.length === 0 ? (
            <div className="text-sm text-zinc-500">
              👋 Ask about a law, section, or case. Example: <em>“Draft a rent agreement for a Delhi apartment.”</em>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[80ch] whitespace-pre-wrap rounded px-3 py-2 border ${m.role==='user'?'bg-white':'bg-zinc-50'}`}
                >
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">
                    {m.role === 'user' ? 'You' : (mode === 'lawyer' ? 'Research' : 'LexLens')}
                  </div>
                  <div className="text-sm leading-6">{m.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="p-4 border-t flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your question… (Shift+Enter for a new line)"
            className="flex-1 border rounded px-4 py-3 text-base h-24 resize-y"
          />
          <button
            className="border rounded px-4 py-3 text-sm"
            disabled={loading || !input.trim()}
            onClick={send}
            title="Send"
          >
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </main>
    </div>
  );
}
