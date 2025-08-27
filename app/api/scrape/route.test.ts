import test from 'node:test';
import assert from 'node:assert';
import { POST } from './route.ts';

const makeRequest = (url: string) =>
  new Request('http://example.com', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });

test('blocks localhost', async () => {
  const res = await POST(makeRequest('http://localhost'));
  assert.strictEqual(res.status, 400);
});

test('blocks private ip', async () => {
  const res = await POST(makeRequest('http://192.168.0.1'));
  assert.strictEqual(res.status, 400);
});
