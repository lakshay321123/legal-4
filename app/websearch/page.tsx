'use client';

import { useState } from 'react';
import type { SearchResult } from '@/lib/multi-search';

export default function WebSearchPage() {
  const [q, setQ] = useState('');
  const [orig, setOrig] = useState('');
  const [rewritten, setRewritten] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function search() {
    const query = q.trim();
    if (!query || loading) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/websearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setMsg(data.message || '');
      setOrig(data.query || query);
      setRewritten(data.rewrittenQuery || query);
    } catch {
      setMsg('Error contacting server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Web search</h1>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a question…"
          className="flex-1 px-3 py-2 rounded border"
        />
        <button className="btn" onClick={search} disabled={loading || !q.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {orig && (
        <div className="text-sm text-zinc-600 space-y-1">
          <div>Original: {orig}</div>
          <div>Rewritten: {rewritten}</div>
        </div>
      )}
      {msg && <div className="text-sm text-zinc-600">{msg}</div>}
      <ul className="space-y-3">
        {results.map((r, i) => (
          <li key={i} className="border rounded p-3 hover:bg-zinc-50">
            <a href={r.url} target="_blank" className="font-medium text-blue-600 hover:underline">
              {r.title}
            </a>
            <div className="text-xs text-zinc-600 line-clamp-2">{r.snippet}</div>
            <div className="text-[10px] text-zinc-400">{r.engine}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
