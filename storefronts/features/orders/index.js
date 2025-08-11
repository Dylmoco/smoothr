/**
 * Handles order workflows and UI widgets for the storefront.
 */

import { supabase } from '../../../shared/supabase/browserClient.js';
import { getConfig } from '../config/globalConfig.js';

const { debug } = getConfig();
const log = (...args) => debug && console.log('[Smoothr Orders]', ...args);
const warn = (...args) => debug && console.warn('[Smoothr Orders]', ...args);
const err = (...args) => debug && console.error('[Smoothr Orders]', ...args);

export async function fetchOrderHistory(customer_id) {
  if (!customer_id) return [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(email, name)')
      .eq('customer_id', customer_id)
      .order('order_date', { ascending: false });
    if (error) {
      err('fetch error', error);
      return [];
    }
    log(`fetched ${data.length} records`);
    return data || [];
  } catch (err) {
    err('fetch error', err);
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
    warn('container not found');
    return;
  }

  const template = list.querySelector('[data-smoothr="order-card"]');
  if (!template) {
    warn('template not found');
    return;
  }

  const noOrders = root.querySelector('[data-smoothr="no-orders"]');

  // Ensure the template card stays hidden and ready for cloning
  template.setAttribute('hidden', '');

  list.querySelectorAll('[data-smoothr="order-card"]').forEach(el => {
    if (el !== template) el.remove();
  });

  const user = window.smoothr?.auth?.user?.value;
  const orders = await fetchOrderHistory(user?.id);

  if (!orders.length) {
    list.setAttribute('hidden', '');
    if (noOrders) {
      noOrders.removeAttribute('hidden');
      noOrders.style.display = 'flex';
    }
    return;
  }

  list.removeAttribute('hidden');
  if (noOrders) {
    noOrders.setAttribute('hidden', '');
    noOrders.style.display = 'none';
  }

  orders.forEach(order => {
    log('rendering order object', order);
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
    setText('[data-smoothr="customer-name"]', order.customers?.name);
    log('customer email', order.customers?.email);
    log('order price', order.total_price);
    setText('[data-smoothr="order-email"]', order.customers?.email);
    setText(
      '[data-smoothr="order-price"]',
      `£${Number(order.total_price).toFixed(2)}`
    );
    setText('[data-smoothr="order-status"]', order.status);

    list.appendChild(card);
  });
}

