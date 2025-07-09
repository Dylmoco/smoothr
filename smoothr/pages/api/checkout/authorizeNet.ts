import type { NextApiRequest, NextApiResponse } from 'next';

import '../../../../shared/init';
import handleAuthorizeNet from '../../../../shared/checkout/providers/authorizeNet';
import supabase from '../../../../shared/supabase/serverClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('[TEST] \ud83d\udd25 API route /api/checkout/authorizeNet is live and running');
  const result = await handleAuthorizeNet(req.body);

  if (result.success && result.data?.messages?.resultCode === 'Ok') {
    const payload: any = req.body;
    const transId = result.data?.transactionResponse?.transId || null;
    let orderNumber: string | undefined;
    try {
      orderNumber = await (globalThis as any).generateOrderNumber?.(payload.store_id);
    } catch (e) {
      console.error('[AuthorizeNet] Failed to generate order number:', e);
    }
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_email: payload.email,
          total_price: payload.total,
          payment_intent_id: transId,
          status: 'paid',
          payment_provider: 'authorizeNet',
          store_id: payload.store_id,
          raw_data: { ...payload, transaction_id: transId },
        })
        .select('id')
        .single();

      if (!error && order) {
        const items = (payload.cart || []).map((item: any) => ({
          order_id: order.id,
          sku: item.product_id || item.sku || '',
          product_name: item.name || item.product_name || '',
          quantity: item.quantity,
          unit_price: item.price || item.unit_price,
        }));
        if (items.length) {
          const { error: itemsErr } = await supabase.from('order_items').insert(items);
          if (itemsErr) console.error('[AuthorizeNet] order_items insert error:', itemsErr.message);
        }
        (result as any).order_id = order.id;
        (result as any).order_number = orderNumber;
      } else if (error) {
        console.error('[AuthorizeNet] order insert error:', error.message);
      }
    } catch (e) {
      console.error('[AuthorizeNet] order logging failed:', e);
    }
  }

  res.status(result.success ? 200 : 500).json(result);
}

export const config = {
  api: {
    bodyParser: true,
  },
};
