import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../app/api/scrape/route';

test('allows whitelisted https urls', async () => {
  const html = `<html><body><p>${'a'.repeat(300)}</p></body></html>`;
  const origFetch = global.fetch;
  global.fetch = async () => new Response(html);

  const req = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ url: 'https://example.com' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const res = await POST(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.text.length > 0);

  global.fetch = origFetch;
});

test('rejects non-http schemes', async () => {
  const origFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('should not fetch');
  };

  const req = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ url: 'ftp://example.com' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const res = await POST(req);
  assert.equal(res.status, 400);

  global.fetch = origFetch;
});

test('rejects private addresses', async () => {
  const origFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('should not fetch');
  };

  const req = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ url: 'http://127.0.0.1' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const res = await POST(req);
  assert.equal(res.status, 400);

  global.fetch = origFetch;
});

test('rejects non-whitelisted domain', async () => {
  const origFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('should not fetch');
  };

  const req = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ url: 'https://google.com' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const res = await POST(req);
  assert.equal(res.status, 400);

  global.fetch = origFetch;
});

