import { describe, it, expect } from 'vitest';
import { normalizeDomain } from '../index.js';

describe('auth utils', () => {
  it('normalizes domains', () => {
    expect(normalizeDomain('www.Example.COM')).toBe('example.com');
    expect(normalizeDomain('Sub.Domain.com')).toBe('sub.domain.com');
  });
});
