export type ResolveArgs = {
  liveDomain?: string | null;
  storeDomain?: string | null;
  signInRedirectUrl?: string | null; // full URL allowed
  orig?: string | null;              // optional caller-provided origin (dev-only)
  nodeEnv?: string | undefined;      // process.env.NODE_ENV passthrough
};

export type ResolveMeta = { branch: 'live' | 'store' | 'signin' | 'dev-localhost' | 'none' };
export type ResolveResult =
  | { type: 'ok'; origin: string; meta: ResolveMeta }
  | {
      type: 'error';
      code: 'NO_ALLOWED_ORIGIN' | 'INVALID_ORIGIN';
      meta: ResolveMeta;
    };

function toOrigin(u?: string | null): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    return url.origin;
  } catch {
    return null;
  }
}

function isDevHost(u?: string | null): boolean {
  if (!u) return false;
  try {
    const { hostname } = new URL(u);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function resolveRecoveryDestination(args: ResolveArgs): ResolveResult {
  const { liveDomain, storeDomain, signInRedirectUrl, orig, nodeEnv } = args;

  const live = toOrigin(liveDomain);
  const store = toOrigin(storeDomain);
  const signin = toOrigin(signInRedirectUrl);

  // Preferred order: live > store > sign-in redirect origin
  const ordered = [live, store, signin] as (string | null)[];
  if (ordered[0]) return { type: 'ok', origin: ordered[0]!, meta: { branch: 'live' } };
  if (ordered[1]) return { type: 'ok', origin: ordered[1]!, meta: { branch: 'store' } };
  if (ordered[2]) return { type: 'ok', origin: ordered[2]!, meta: { branch: 'signin' } };

  // No configured domains → dev-only allowance for localhost/127.0.0.1
  const dev = nodeEnv && nodeEnv !== 'production';
  if (dev && isDevHost(orig)) {
    const devOrigin = toOrigin(orig);
    if (devOrigin) return { type: 'ok', origin: devOrigin, meta: { branch: 'dev-localhost' } };
  }

  // Production: do not trust arbitrary orig
  return { type: 'error', code: 'NO_ALLOWED_ORIGIN', meta: { branch: 'none' } };
}
