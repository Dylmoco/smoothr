import { postForm } from './form.js';

// primary: JSON + Authorization header
// fallback: form POST when Authorization flow is unavailable (older embeds, CSP, or strict CORS)
export async function sessionSync({ brokerBase, store_id, access_token }) {
  const url = `${brokerBase}/api/auth/session-sync`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(access_token ? { Authorization: `Bearer ${access_token}` } : {})
      },
      body: JSON.stringify({ store_id })
    });
    if (res.ok) return res.json();
    // If unauthorized or blocked, try form-encoded path (back-compat)
    if (res.status === 401 || res.status === 403) {
      const res2 = await postForm(url, { store_id, access_token });
      if (res2.ok) return res2.json();
      return Promise.reject(new Error(`session-sync failed: ${res.status}/${res2.status}`));
    }
    return Promise.reject(new Error(`session-sync failed: ${res.status}`));
  } catch (e) {
    // Network failure → best-effort form fallback
    const res2 = await postForm(url, { store_id, access_token });
    if (res2.ok) return res2.json();
    throw e;
  }
}
