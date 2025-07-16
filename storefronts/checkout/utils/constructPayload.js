export default function constructPayload(provider, token, info) {
  const {
    email,
    first_name,
    last_name,
    shipping,
    billing,
    bill_first_name,
    bill_last_name,
    cart,
    total,
    currency,
    customer_id,
    store_id,
    platform
  } = info;

  const payload = {
    email,
    first_name,
    last_name,
    shipping,
    billing,
    billing_first_name: bill_first_name,
    billing_last_name: bill_last_name,
    cart,
    total,
    currency,
    customer_id,
    store_id,
    platform
  };

  if (provider === 'stripe') {
    payload.payment_method = token.id;
  } else if (provider === 'authorizeNet') {
    payload.payment_method = token;
  } else if (provider === 'nmi') {
    Object.assign(payload, token);
  } else {
    payload.payment_method = token?.id;
  }

  return payload;
}
