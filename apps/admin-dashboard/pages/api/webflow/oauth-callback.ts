import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  },
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const code = req.query.code as string | undefined;
  const user_id = req.query.state as string | undefined;

  if (!code) {
    res.status(400).json({ error: 'Missing code' });
    return;
  }

  try {
    const tokenRes = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.WEBFLOW_CLIENT_ID,
        client_secret: process.env.WEBFLOW_CLIENT_SECRET,
        redirect_uri: process.env.WEBFLOW_REDIRECT_URI,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      res.status(500).json({ error: 'Token exchange failed', detail: text });
      return;
    }

    const tokenData = await tokenRes.json();
    const { access_token, site_id } = tokenData as {
      access_token: string;
      site_id: string;
    };

    if (user_id) {
      await supabase.from('webflow_connections').insert({
        user_id,
        site_id,
        access_token,
      });
    }

    const webhookUrl = process.env.WEBFLOW_WEBHOOK_URL!;

    await fetch(`https://api.webflow.com/sites/${site_id}/webhooks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Accept-Version': '1.0.0',
      },
      body: JSON.stringify({
        triggerType: 'order_created',
        url: webhookUrl,
      }),
    });

    res.status(200).json({ success: true, site_id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
}