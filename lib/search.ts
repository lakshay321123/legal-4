export async function geminiSearch(term: string) {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: term }),
  });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}
