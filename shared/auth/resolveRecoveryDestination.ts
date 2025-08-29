export type ResolveArgs = {
  liveDomain?: string | null;
  storeDomain?: string | null;
  signInRedirectUrl?: string | null; // full URL allowed
  orig?: string | null;              // optional caller-provided origin (dev-only)
  nodeEnv?: string | undefined;      // process.env.NODE_ENV passthrough
};

export type ResolveResult =
  | { type: 'ok'; origin: string }
  | { type: 'error'; code: 'NO_ALLOWED_ORIGIN' | 'INVALID_ORIGIN' };

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
  const ordered = [live, store, signin].filter(Boolean) as string[];
  if (ordered.length > 0) {
    return { type: 'ok', origin: ordered[0] };
  }

  // No configured domains → dev-only allowance for localhost/127.0.0.1
  const dev = nodeEnv && nodeEnv !== 'production';
  if (dev && isDevHost(orig)) {
    const devOrigin = toOrigin(orig);
    if (devOrigin) return { type: 'ok', origin: devOrigin };
  }

  // Production: do not trust arbitrary orig
  return { type: 'error', code: 'NO_ALLOWED_ORIGIN' };
}
