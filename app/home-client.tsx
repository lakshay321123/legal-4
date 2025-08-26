// app/home-client.tsx
'use client';

import { useState } from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import ChatWindow from '@/components/ChatWindow';

export default function HomeClient() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const q = input.trim();
    if (!q || loading) return;

    // show the user message immediately
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // IMPORTANT
        body: JSON.stringify({ q, mode: 'citizen' }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Request failed (${res.status})`);
      }
      const data = await res.json();
      const answer = data?.answer ?? 'No answer.';
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Error talking to OpenAI. Check API key and logs.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <div className="flex flex-col flex-1">
        <ChatWindow messages={messages} />
        <div className="p-4 border-t flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about a law, section, or case…"
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
