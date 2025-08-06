import auth from './index.js';
import { init, loadConfig } from './init.js';
import {
  lookupRedirectUrl,
  lookupDashboardHomeUrl
} from '../../../supabase/authHelpers.js';
import * as currency from '../currency/index.js';

if (typeof globalThis.setSelectedCurrency !== 'function') {
  globalThis.setSelectedCurrency = () => {};
}

const storeRedirects = { lookupRedirectUrl, lookupDashboardHomeUrl };
const SMOOTHR_CONFIG =
  (typeof window !== 'undefined' && window.SMOOTHR_CONFIG) || {};

const Smoothr = { auth, loadConfig, storeRedirects, currency, SMOOTHR_CONFIG };
export { auth, loadConfig, storeRedirects, currency, SMOOTHR_CONFIG };
export default Smoothr;

if (typeof window !== 'undefined') {
  window.Smoothr = { ...(window.Smoothr || {}), ...Smoothr };
}

// Initialize immediately for backward compatibility
init();

