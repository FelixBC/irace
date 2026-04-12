import { describe, it, expect } from 'vitest';
import { computeProgressPercent } from './myChallengeProgress.js';

describe('computeProgressPercent', () => {
  it('returns 0 for invalid goal', () => {
    expect(computeProgressPercent(10, 0)).toBe(0);
    expect(computeProgressPercent(10, NaN)).toBe(0);
  });

  it('caps at 100', () => {
    expect(computeProgressPercent(200, 100)).toBe(100);
  });

  it('rounds half-way sensibly', () => {
    expect(computeProgressPercent(25, 100)).toBe(25);
    expect(computeProgressPercent(33.3, 100)).toBe(33);
  });
});
