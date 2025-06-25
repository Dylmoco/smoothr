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

  list.querySelectorAll('[data-smoothr="order-card"]').forEach(el => {
    if (el !== template) el.remove();
  });

  const user = window.smoothr?.auth?.user;
  const orders = await fetchOrderHistory(user?.id);

  orders.forEach(order => {
    console.log('rendering order object', order);
    const card = template.cloneNode(true);

    const setText = (sel, val) => {
      const el = card.querySelector(sel);
      if (el) el.textContent = val ?? '';
    };

    setText('[data-smoothr="order-date"]', order.order_date);
    setText('[data-smoothr="order-number"]', order.order_number);
    setText('[data-smoothr="customer-name"]', order.customer_name);
    setText('[data-smoothr="customer-email"]', order.customer_email);
    setText('[data-smoothr="order-total"]', order.total_price);
    setText('[data-smoothr="order-status"]', order.status);

    list.appendChild(card);
  });
}

