import { describe, it, expect } from 'vitest';
import { normalizeSports } from './normalizeSports.js';

describe('normalizeSports', () => {
  it('passes through non-empty arrays', () => {
    expect(normalizeSports(['RUNNING', 'CYCLING'])).toEqual(['RUNNING', 'CYCLING']);
  });

  it('parses PostgreSQL enum array text', () => {
    expect(normalizeSports('{RUNNING,CYCLING}')).toEqual(['RUNNING', 'CYCLING']);
  });

  it('returns empty array for null or empty', () => {
    expect(normalizeSports(null)).toEqual([]);
    expect(normalizeSports('')).toEqual([]);
  });
});
