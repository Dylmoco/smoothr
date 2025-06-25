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
    card.removeAttribute('hidden');
    card.style.display = '';

    const dateEl = card.querySelector('[data-smoothr="order-date"]');
    if (dateEl) dateEl.textContent = order.order_date;

    const numberEl = card.querySelector('[data-smoothr="order-number"]');
    if (numberEl) numberEl.textContent = order.order_number;

    const nameEl = card.querySelector('[data-smoothr="order-name"]');
    if (nameEl) nameEl.textContent = order.customer_name;

    const emailEl = card.querySelector('[data-smoothr="order-email"]');
    if (emailEl) emailEl.textContent = order.customer_email;

    const priceEl = card.querySelector('[data-smoothr="order-price"]');
    if (priceEl) priceEl.textContent = order.total_price;

    const statusEl = card.querySelector('[data-smoothr="order-status"]');
    if (statusEl) statusEl.textContent = order.status;

    console.log('smoothr:rendered order', order.order_number);
    list.appendChild(card);
  });
  console.log('smoothr:orders final DOM state', list.innerHTML);
}

