import { fetchOrders } from './fetchOrders.js';
import { renderOrders } from './renderOrders.js';

export { fetchOrders, renderOrders };

if (typeof window !== 'undefined' && window.Webflow) {
  Webflow.push(() => {
    fetchOrders().then(renderOrders);
  });
}
