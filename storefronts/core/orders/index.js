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

  const empty = root.querySelector('[data-smoothr="no-orders"]');
  if (!orders.length) {
    if (empty) empty.removeAttribute('hidden');
    list.setAttribute('hidden', '');
    console.log('smoothr:orders no orders found');
    return;
  }
  if (empty) empty.setAttribute('hidden', '');
  list.removeAttribute('hidden');

  template.setAttribute('hidden', '');
  orders.forEach(order => {
    const card = template.cloneNode(true);
    const dateEl = card.querySelector('[data-smoothr="order-date"]');
    const numEl = card.querySelector('[data-smoothr="order-number"]');
    const nameEl = card.querySelector('[data-smoothr="order-name"]');
    const emailEl = card.querySelector('[data-smoothr="order-email"]');
    const priceEl = card.querySelector('[data-smoothr="order-price"]');
    const statusEl = card.querySelector('[data-smoothr="order-status"]');
    if (dateEl) dateEl.textContent = order.order_date;
    if (numEl) numEl.textContent = order.order_number;
    if (nameEl) nameEl.textContent = order.customer_name;
    if (emailEl) emailEl.textContent = order.customer_email;
    if (priceEl) priceEl.textContent = order.total_price;
    if (statusEl) statusEl.textContent = order.order_status;
    card.removeAttribute('hidden');
    list.appendChild(card);
  });
}

