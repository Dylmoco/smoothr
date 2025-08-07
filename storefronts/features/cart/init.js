import { mergeConfig } from '../config/globalConfig.js';
import * as cart from './index.js';
import { bindAddToCartButtons } from './addToCart.js';
import { renderCart } from './renderCart.js';

let initialized = false;

export async function init(config = {}) {
  if (initialized) return typeof window !== 'undefined' ? window.Smoothr?.cart : undefined;

  mergeConfig(config);

  if (typeof window !== 'undefined') {
    const Smoothr = (window.Smoothr = window.Smoothr || {});
    Smoothr.cart = {
      ...cart,
      renderCart,
      addButtonPollingRetries: 0,
      addButtonPollingDisabled: false
    };
  }

  bindAddToCartButtons();
  renderCart();

  initialized = true;
  return typeof window !== 'undefined' ? window.Smoothr.cart : undefined;
}

