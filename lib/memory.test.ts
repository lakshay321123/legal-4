import { describe, it, expect } from 'vitest';
import { extractContextBits } from './memory';

describe('extractContextBits', () => {
  it('detects rent-agreement intent', () => {
    const bits = extractContextBits('Need a rent agreement for my house.');
    expect(bits.intent).toBe('rent_agreement');
  });

  it('extracts city from known locations', () => {
    const bits = extractContextBits('We need a rent agreement in Delhi.');
    expect(bits.city).toBe('Delhi');
    expect(bits.state).toBeUndefined();
  });

  it('extracts state from known locations', () => {
    const bits = extractContextBits('Looking for rent agreement in Karnataka');
    expect(bits.state).toBe('Karnataka');
    expect(bits.city).toBeUndefined();
  });

  it('extracts property type', () => {
    const bits = extractContextBits('Prepare a rent agreement for an apartment');
    expect(bits.property).toBe('apartment');
  });

  it('returns empty object when no context bits', () => {
    const bits = extractContextBits('Hello there');
    expect(bits).toEqual({});
  });
});
