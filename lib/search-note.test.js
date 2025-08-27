import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendNoSearchNote } from './search-note.js';

test('returns question unchanged when search results exist', () => {
  const q = 'What is Article 21?';
  const out = appendNoSearchNote(q, true);
  assert.equal(out, q);
});

test('appends clarification note when no results', () => {
  const q = 'What is Article 21?';
  const out = appendNoSearchNote(q, false);
  assert.ok(out.includes('No recent info found'));
});
