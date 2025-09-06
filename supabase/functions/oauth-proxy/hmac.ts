const enc = new TextEncoder();

export function base64url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? enc.encode(input) : input;
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function signState(payload: Record<string, any>): Promise<string> {
  const secret = Deno.env.get("HMAC_SECRET") || "";
  const body = JSON.stringify(payload);
  const bodyB64 = base64url(body);
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(bodyB64));
  const sigB64 = base64url(new Uint8Array(sig));
  return `${bodyB64}.${sigB64}`;
}

export async function verifyState(
  token: string,
): Promise<{ ok: boolean; payload?: any }> {
  try {
    const [bodyB64, sigB64] = token.split(".");
    if (!bodyB64 || !sigB64) return { ok: false };
    const secret = Deno.env.get("HMAC_SECRET") || "";
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      enc.encode(bodyB64),
    );
    if (!ok) return { ok: false };
    const json = atob(bodyB64.replace(/-/g, "+").replace(/_/g, "/"));
    return { ok: true, payload: JSON.parse(json) };
  } catch {
    return { ok: false };
  }
}
