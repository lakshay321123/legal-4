import { test } from 'node:test';
import assert from 'node:assert';
import { validateUrl } from './url.ts';

test('rejects private IPv4 addresses', () => {
  assert.equal(validateUrl('http://10.0.0.1'), false);
  assert.equal(validateUrl('http://127.0.0.1'), false);
  assert.equal(validateUrl('http://169.254.0.1'), false);
  assert.equal(validateUrl('http://172.16.0.1'), false);
  assert.equal(validateUrl('http://192.168.1.1'), false);
});

test('rejects localhost and IPv6 loopback', () => {
  assert.equal(validateUrl('http://localhost'), false);
  assert.equal(validateUrl('http://[::1]'), false);
});

test('rejects invalid protocol', () => {
  assert.equal(validateUrl('ftp://example.com'), false);
});

test('accepts public URLs', () => {
  assert.equal(validateUrl('https://example.com'), true);
  assert.equal(validateUrl('http://8.8.8.8'), true);
});
