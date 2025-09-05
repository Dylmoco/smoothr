import type { GetServerSideProps } from 'next';
import { createHmac, randomUUID } from 'crypto';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';

interface Row {
  metadata: { redirect_to: string };
  hmac: string;
  code_verifier: string;
}

const HMAC_SECRET = process.env.HMAC_SECRET || '';

function sign(data: string) {
  return createHmac('sha256', HMAC_SECRET).update(data).digest('base64');
}

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  const code = typeof query.code === 'string' ? query.code : '';
  const state = typeof query.state === 'string' ? query.state : '';
  if (!code || !state) {
    res.statusCode = 400;
    res.end('Missing code or state');
    return { props: {} };
  }

  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from('auth_state_management')
    .select('metadata,hmac,code_verifier')
    .eq('state', state)
    .maybeSingle<Row>();
  if (!row || sign(JSON.stringify(row.metadata)) !== row.hmac) {
    res.statusCode = 400;
    res.end('Invalid state');
    return { props: {} };
  }

  const { data: sessData, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !sessData.session) {
    res.statusCode = 400;
    res.end('Exchange failed');
    return { props: {} };
  }

  const exchangeCode = randomUUID();
  await supabase.from('auth_state_management').insert({
    code: exchangeCode,
    session: sessData.session,
    type: 'exchange',
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    exchange_used: false,
  });
  await supabase
    .from('auth_state_management')
    .update({ used: true })
    .eq('state', state);

  const redirect = row.metadata.redirect_to;
  const origin = new URL(redirect).origin;
  const oj = JSON.stringify(origin);
  const rj = JSON.stringify(redirect);
  const cj = JSON.stringify(exchangeCode);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const body = `<!DOCTYPE html><html><body><div class="spinner">Logging in...</div><script>(function(){try{history.replaceState(null,'','/auth/callback');var t=${oj};var r=${rj};var c=${cj};if(window.opener){window.opener.postMessage({type:'smoothr:auth',code:c},t);window.close();}else{location.replace(r);}}catch(e){}})();</script></body></html>`;
  res.end(body);
  return { props: {} };
};

export default function Callback() {
  return null;
}
