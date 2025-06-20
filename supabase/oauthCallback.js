import { setSession } from './auth.js';

export default async function handleOAuthCallback() {
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUri = searchParams.get('redirect_uri') || '/';
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const access_token = hashParams.get('access_token');
  const refresh_token = hashParams.get('refresh_token');

  const go = url => window.location.replace(url);

  if (access_token && refresh_token) {
    const next = `${redirectUri}?smoothr_token=${encodeURIComponent(access_token)}&refresh_token=${encodeURIComponent(refresh_token)}`;
    try {
      await setSession({ access_token, refresh_token });
    } catch (err) {
      console.error('OAuth callback: setSession failed', err);
    } finally {
      go(next);
    }
  } else {
    go(redirectUri);
  }
}
