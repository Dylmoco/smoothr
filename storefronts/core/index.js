console.log('Smoothr SDK loaded');
import * as abandonedCart from './abandoned-cart/index.js';
import * as affiliates from './affiliates/index.js';
import * as analytics from './analytics/index.js';
import * as currency from './currency/index.js';
import * as dashboard from './dashboard/index.js';
import * as discounts from './discounts/index.js';
import * as orders from './orders/index.js';
import * as returns from './returns/index.js';
import * as reviews from './reviews/index.js';
import * as subscriptions from './subscriptions/index.js';
import * as auth from './auth/index.js';
import { fetchExchangeRates } from './currency/live-rates.js';

export {
  abandonedCart,
  affiliates,
  analytics,
  currency,
  dashboard,
  discounts,
  orders,
  returns,
  reviews,
  subscriptions,
  auth
};

const Smoothr = {
  abandonedCart,
  affiliates,
  analytics,
  currency,
  dashboard,
  discounts,
  orders,
  returns,
  reviews,
  subscriptions,
  auth
};

let setSelectedCurrency = setDomCurrency;

if (typeof window !== 'undefined') {
  const cfg = window.SMOOTHR_CONFIG || {};
  if (cfg.baseCurrency) {
    currency.setBaseCurrency(cfg.baseCurrency);
  }
  if (cfg.rates) {
    currency.updateRates(cfg.rates);
  }
  const base = cfg.baseCurrency || currency.baseCurrency;
  const symbols = cfg.rates ? Object.keys(cfg.rates) : Object.keys(currency.rates);
  const urlBase = cfg.rateSource || 'https://api.exchangerate.host/latest';
  if (cfg.debug) {
    const debugUrl = `${urlBase}?base=${encodeURIComponent(base)}&symbols=${symbols.join(',')}`;
    console.log('smoothr:live-rates-url', debugUrl);
  }
  fetchExchangeRates(base, symbols, cfg.rateSource)
    .then(rates => {
      if (rates) {
        currency.updateRates(rates);
        if (cfg.debug) {
          console.log('smoothr:live-rates', rates);
        }
      }
    })
    .catch(() => {});
  if (cfg.platform === 'webflow-ecom') {
    setSelectedCurrency = setEcomCurrency;
  } else if (cfg.platform === 'cms') {
    setSelectedCurrency = setCmsCurrency;
  }
  window.Smoothr = Smoothr;
  auth.initAuth();
}

export default Smoothr;

import { setSelectedCurrency as setDomCurrency } from '../platforms/webflow-dom.js';
import { setSelectedCurrency as setEcomCurrency } from '../platforms/webflow-ecom-currency.js';
import { setSelectedCurrency as setCmsCurrency } from './currency/cms-currency.js';
// Always expose helper on the global object for browser embeds
globalThis.setSelectedCurrency =
  globalThis.setSelectedCurrency || setSelectedCurrency;
