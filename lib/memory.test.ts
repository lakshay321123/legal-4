import { describe, it, expect } from 'vitest';
import { extractContextBits } from './memory';

describe('extractContextBits', () => {
  it('detects rent agreement intent', () => {
    const bits = extractContextBits('Need a rent agreement for my house.');
    expect(bits).toMatchObject({ intent: 'rent_agreement' });
  });

  it('extracts city and state', () => {
    const bits = extractContextBits('I need documents in mumbai maharashtra');
    expect(bits).toMatchObject({ city: 'Mumbai', state: 'Maharashtra' });
  });

  it('detects property type', () => {
    const bits = extractContextBits('Looking to rent out an apartment.');
    expect(bits).toMatchObject({ property: 'apartment' });
  });

  it('returns empty object for unrelated text', () => {
    const bits = extractContextBits('How are you today?');
    expect(bits).toEqual({});
  });
});
