export async function postForm(url, data) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(data || {})) {
    if (v !== undefined && v !== null) body.append(k, String(v));
  }
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
}
