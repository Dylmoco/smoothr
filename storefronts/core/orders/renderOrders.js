export function renderOrders(orders) {
  const wrapper = document.querySelector('[data-smoothr="order-list"]');
  const template = wrapper?.querySelector('[data-smoothr="order-card"]');

  if (!wrapper || !template) {
    console.warn('[Smoothr] Order DOM structure not found.');
    return;
  }

  wrapper.innerHTML = '';

  orders.forEach(order => {
    const clone = template.cloneNode(true);

    clone.querySelector('[data-smoothr="order-date"]').textContent =
      new Date(order.order_date).toLocaleDateString();

    clone.querySelector('[data-smoothr="order-number"]').textContent =
      order.order_number;

    clone.querySelector('[data-smoothr="order-name"]').textContent =
      order.customer_email.split('@')[0] || 'Customer';

    clone.querySelector('[data-smoothr="order-email"]').textContent =
      order.customer_email;

    clone.querySelector('[data-smoothr="order-price"]').textContent =
      `£${Number(order.total_price).toFixed(2)}`;

    wrapper.appendChild(clone);
  });
}
