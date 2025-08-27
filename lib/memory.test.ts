import test from 'node:test';
import assert from 'node:assert';
import { configureMemory, updateContext, getContext, memorySize, purgeStale } from './memory.ts';

test('removes entries older than maxAgeMs', { concurrency: false }, async () => {
  configureMemory({ maxAgeMs: 10, maxEntries: 100 });
  updateContext('u1', { lastQ: 'hi' });
  await new Promise(r => setTimeout(r, 15));
  purgeStale();
  assert.strictEqual(memorySize(), 0);
});

test('evicts oldest when exceeding maxEntries', { concurrency: false }, () => {
  configureMemory({ maxEntries: 2, maxAgeMs: 1000 });
  updateContext('a', { lastQ: '1' });
  updateContext('b', { lastQ: '2' });
  updateContext('c', { lastQ: '3' });
  purgeStale();
  assert.strictEqual(memorySize(), 2);
  assert.deepStrictEqual(getContext('a'), {});
  assert.strictEqual(getContext('b').lastQ, '2');
  assert.strictEqual(getContext('c').lastQ, '3');
});
