import assert from 'assert';
import { normalizeDomain } from '../index.js';

assert.strictEqual(normalizeDomain('www.Example.COM'), 'example.com');
assert.strictEqual(normalizeDomain('Sub.Domain.com'), 'sub.domain.com');

console.log('auth module tests passed');
