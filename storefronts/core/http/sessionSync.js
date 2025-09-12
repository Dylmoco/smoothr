export async function sessionSync({ brokerBase, store_id, access_token }) {
  const res = await fetch(`${brokerBase}/api/auth/session-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ store_id }),
  });
  try {
    return await res.json();
  } catch {
    return {};
  }
}
