import { it, expect, vi } from 'vitest';
import { postForm } from '../../core/http/form.js';

it('postForm encodes payload and sets header', async () => {
  const fetchMock = vi.fn().mockResolvedValue({});
  const realFetch = global.fetch;
  // @ts-ignore
  global.fetch = fetchMock;
  await postForm('https://example.com', { a: 1, b: 'two', c: null, d: undefined });
  expect(fetchMock).toHaveBeenCalledWith('https://example.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'a=1&b=two'
  });
  global.fetch = realFetch;
});
