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
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, mode, docs }),
      });
      const data = await res.json();
      const text = data?.answer ?? 'No answer.';
      setMessages(m => [...m, { role: 'assistant', content: text }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant
