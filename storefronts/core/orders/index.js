/**
 * Handles order workflows and UI widgets for the storefront.
 */

import supabase from '../../../supabase/supabaseClient.js';

export async function fetchOrderHistory(customer_id) {
  if (!customer_id) return [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customer_id)
      .order('order_date', { ascending: false });
    if (error) {
      console.error('smoothr:orders fetch error', error);
      return [];
    }
    console.log(`smoothr:orders fetched ${data.length} records`);
    return data || [];
  } catch (err) {
    console.error('smoothr:orders fetch error', err);
    return [];
  }
}

export async function renderOrders(container) {
  if (typeof document === 'undefined') return;
  const root =
    typeof container === 'string'
      ? document.querySelector(container)
      : container || document;

  const list = root.querySelector('[data-smoothr="order-list"]');
  if (!list) {
    console.warn('smoothr:orders container not found');
    return;
  }

  const template = list.querySelector('[data-smoothr="order-card"]');
  if (!template) {
    console.warn('smoothr:orders template not found');
    return;
  }

  const noOrders = root.querySelector('[data-smoothr="no-orders"]');

  // Ensure the template card stays hidden and ready for cloning
  template.setAttribute('hidden', '');

  list.querySelectorAll('[data-smoothr="order-card"]').forEach(el => {
    if (el !== template) el.remove();
  });

  const user = window.smoothr?.auth?.user;
  const orders = await fetchOrderHistory(user?.id);

  if (!orders.length) {
    if (noOrders) {
      noOrders.removeAttribute('hidden');
      noOrders.style.display = '';
    }
    return;
  }

  if (noOrders) {
    noOrders.setAttribute('hidden', '');
    noOrders.style.display = 'none';
  }

  orders.forEach(order => {
    console.log('rendering order object', order);
    const card = template.cloneNode(true);

    card.removeAttribute('hidden');
    card.style.display = 'flex';

    const setText = (sel, val) => {
      const el = card.querySelector(sel);
      if (el) el.textContent = val ?? '';
    };

    const dateEl = card.querySelector('[data-smoothr="order-date"]');
    if (dateEl) {
      const date = new Date(order.order_date);
      const locale = navigator.language || 'en-GB';
      const formattedDate = date.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      dateEl.textContent = formattedDate;
    }
    setText('[data-smoothr="order-number"]', order.order_number);
    setText('[data-smoothr="customer-name"]', order.customer_name);
    console.log('smoothr:orders customer email', order.customer_email);
    console.log('smoothr:orders order price', order.total_price);
    setText('[data-smoothr="order-email"]', order.customer_email);
    setText(
      '[data-smoothr="order-price"]',
      `£${Number(order.total_price).toFixed(2)}`
    );
    setText('[data-smoothr="order-status"]', order.status);

    list.appendChild(card);
  });
}

