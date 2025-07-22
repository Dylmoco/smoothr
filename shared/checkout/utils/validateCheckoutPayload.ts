export interface CheckoutPayload {
  order_number?: string;
  payment_method?: any;
  payment_token?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  shipping?: {
    name?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  billing?: {
    name?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  billing_first_name?: string;
  billing_last_name?: string;
  cart?: any[];
  total?: number;
  currency?: string;
  description?: string;
  discount_code?: string;
  discount_id?: string;
  customer_id?: string | null;
  store_id?: string;
  platform?: string;
  same_billing?: boolean;
}

export interface ValidationError {
  error: string;
  user_message: string;
  missing_fields?: Array<{ field: string; message: string }>;
  shipping_errors?: Array<{ field: string; message: string }>;
  billing_errors?: Array<{ field: string; message: string }>;
}

export function validateCheckoutPayload(payload: CheckoutPayload): ValidationError | null {
  const {
    email,
    first_name,
    last_name,
    shipping,
    cart,
    total,
    currency,
    store_id,
    billing,
    same_billing
  } = payload;

  const missingFields: Array<{ field: string; message: string }> = [];
  if (!email) missingFields.push({ field: 'email', message: 'Email is required' });
  if (!first_name) missingFields.push({ field: 'first_name', message: 'First name is required' });
  if (!last_name) missingFields.push({ field: 'last_name', message: 'Last name is required' });
  if (!shipping) missingFields.push({ field: 'shipping', message: 'Shipping information is required' });
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    missingFields.push({ field: 'cart', message: 'Cart cannot be empty' });
  }
  if (typeof total !== 'number' || total <= 0) {
    missingFields.push({ field: 'total', message: 'Invalid order total' });
  }
  if (!currency) missingFields.push({ field: 'currency', message: 'Currency is required' });
  if (!store_id) missingFields.push({ field: 'store_id', message: 'Store ID is required' });

  if (missingFields.length > 0) {
    return {
      error: 'Missing required fields',
      missing_fields: missingFields,
      user_message: 'Please fill in all required fields and try again.'
    };
  }

  const { name, address } = shipping!;
  const { line1, city, state, postal_code, country } = address || {} as any;

  const shippingErrors: Array<{ field: string; message: string }> = [];
  if (!name) shippingErrors.push({ field: 'shipping_name', message: 'Recipient name is required' });
  if (!line1) shippingErrors.push({ field: 'ship_line1', message: 'Street address is required' });
  if (!city) shippingErrors.push({ field: 'ship_city', message: 'City is required' });
  if (!postal_code) shippingErrors.push({ field: 'ship_postal', message: 'Postal code is required' });
  if (!state) shippingErrors.push({ field: 'ship_state', message: 'State is required' });
  if (!country) shippingErrors.push({ field: 'ship_country', message: 'Country is required' });

  if (shippingErrors.length > 0) {
    return {
      error: 'Invalid shipping details',
      shipping_errors: shippingErrors,
      user_message: 'Please check your shipping information and try again.'
    };
  }

  if (!same_billing) {
    const billingErrors: Array<{ field: string; message: string }> = [];
    const billAddr: any = billing?.address || {};
    if (!billAddr.line1) billingErrors.push({ field: 'bill_line1', message: 'Billing street required' });
    if (!billAddr.city) billingErrors.push({ field: 'bill_city', message: 'Billing city required' });
    if (!billAddr.state) billingErrors.push({ field: 'bill_state', message: 'Billing state required' });
    if (!billAddr.postal_code) billingErrors.push({ field: 'bill_postal', message: 'Billing postal required' });
    if (!billAddr.country) billingErrors.push({ field: 'bill_country', message: 'Billing country required' });

    if (billingErrors.length > 0) {
      return {
        error: 'Invalid billing details',
        billing_errors: billingErrors,
        user_message: 'Please check your billing information and try again.'
      };
    }
  }

  return null;
}
