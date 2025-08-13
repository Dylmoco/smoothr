import { createSupabaseClient } from 'shared/supabase/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createSupabaseClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const code = req.query.code as string | undefined;
  const customer_id = req.query.state as string | undefined;

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

    interface TokenData {
      access_token: string;
      site_id: string;
    }
    const tokenData = (await tokenRes.json()) as TokenData;
    const { access_token, site_id } = tokenData;

    if (customer_id) {
      await supabase.from('webflow_connections').insert({
        customer_id,
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
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}