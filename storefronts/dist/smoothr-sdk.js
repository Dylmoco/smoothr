import { s as a } from "./browserClient-D597XlEB.js";
const p = document.currentScript || document.getElementById("smoothr-sdk"), c = p?.getAttribute?.("data-store-id") || p?.dataset?.storeId;
window.SMOOTHR_CONFIG = window.SMOOTHR_CONFIG || {};
window.SMOOTHR_CONFIG.storeId = c;
console.log("[Smoothr SDK] Initialized storeId:", c);
c || console.warn(
  "[Smoothr SDK] No storeId found — auth metadata will be incomplete"
);
const [
  b,
  g,
  I,
  o,
  R,
  _,
  f,
  y,
  T,
  M,
  G,
  h,
  C,
  N,
  F,
  D,
  H,
  E
] = await Promise.all([
  import("./index-D8-ajrxI.js"),
  import("./index-l0sNRNKZ.js"),
  import("./index-DP2rzg_V.js"),
  import("./index-Dkk_fHn0.js"),
  import("./index-K6Dvbx-E.js"),
  import("./index-C6Kfwj0f.js"),
  import("./cart-B4TreNmy.js").then((r) => r.c),
  import("./index-DJKqiILC.js"),
  import("./index-RnTpOC5-.js"),
  import("./index-DVN7Oi2P.js"),
  import("./index-DdXTRxfG.js"),
  import("./index-CiqK_mhe.js"),
  import("./stripe-CVIssmpr.js"),
  import("./live-rates-DDmeqLjo.js"),
  import("./addToCart-CKwAs-r9.js"),
  import("./renderCart-Bm3EkEl-.js"),
  import("./webflow-dom-D85yY8Wo.js"),
  import("./cms-currency-CNzwnkVa.js")
]), d = h.default || h, { fetchExchangeRates: B } = N, { initCartBindings: O } = F, { renderCart: S } = D, { setSelectedCurrency: v } = H, { setSelectedCurrency: k } = E;
async function U(r) {
  const { data: s, error: i } = await a.from("public_store_settings").select("*").eq("store_id", r).single();
  if (i) throw i;
  window.SMOOTHR_CONFIG = {
    ...window.SMOOTHR_CONFIG || {},
    ...s || {}
  }, "api_base" in window.SMOOTHR_CONFIG && !window.SMOOTHR_CONFIG.apiBase && (window.SMOOTHR_CONFIG.apiBase = window.SMOOTHR_CONFIG.api_base), window.SMOOTHR_CONFIG.storeId = r;
}
const K = "https://<your-project-id>.functions.supabase.co/proxy-live-rates?base=GBP&symbols=USD,EUR,GBP", x = {
  abandonedCart: b,
  affiliates: g,
  analytics: I,
  currency: o,
  dashboard: R,
  discounts: _,
  cart: f,
  orders: y,
  returns: T,
  reviews: M,
  subscriptions: G,
  auth: d,
  checkout: C
};
(async function() {
  typeof globalThis.setSelectedCurrency != "function" && (globalThis.setSelectedCurrency = () => {
  });
  const s = window.SMOOTHR_CONFIG.storeId;
  if (console.log("[Smoothr SDK] Bootstrap triggered", { storeId: s }), !s) throw new Error("Missing data-store-id on <script> tag");
  try {
    await U(s);
  } catch (t) {
    if (!(typeof process < "u" && process.env.NODE_ENV === "test"))
      throw t;
  }
  const i = typeof window < "u" && window.SMOOTHR_CONFIG?.debug, n = (...t) => i && console.log("[Smoothr SDK]", ...t);
  n("Smoothr SDK loaded");
  let u = v;
  if (typeof window < "u") {
    const t = window.SMOOTHR_CONFIG;
    if (typeof document < "u" && typeof document.createElement == "function" && !document.querySelector("#smoothr-card-styles")) {
      const e = document.createElement("style");
      e.id = "smoothr-card-styles", e.textContent = `[data-smoothr-card-number],
[data-smoothr-card-expiry],
[data-smoothr-card-cvc]{display:block;position:relative;}
iframe[data-accept-id]{display:block!important;}`, document.head.appendChild(e);
    }
    t.baseCurrency && o.setBaseCurrency(t.baseCurrency), t.rates && o.updateRates(t.rates);
    const l = t.baseCurrency || o.baseCurrency, m = t.rates ? Object.keys(t.rates) : Object.keys(o.rates), w = t.rateSource || K;
    if (t.debug) {
      let e = w;
      /[?&]base=/.test(e) || (e += (e.includes("?") ? "&" : "?") + `base=${encodeURIComponent(l)}`), /[?&]symbols=/.test(e) || (e += (e.includes("?") ? "&" : "?") + `symbols=${m.join(",")}`), n("smoothr:live-rates-url", e);
    }
    B(l, m, t.rateSource || w).then((e) => {
      e && (o.updateRates(e), t.debug && n("smoothr:live-rates", e));
    }).catch(() => {
    }), t.platform === "cms" && (u = k), window.Smoothr = x, window.smoothr = window.smoothr || {}, window.smoothr.auth = d, window.smoothr.supabase = a, window.smoothr.getSession = () => a.auth.getSession(), window.smoothr.getUser = () => a.auth.getUser(), window.renderCart = S, n("🎨 renderCart registered in SDK"), window.Smoothr.cart = { ...f, ...window.Smoothr.cart || {} }, window.Smoothr.cart.renderCart = S, window.Smoothr.checkout = C, window.initCartBindings = O, document.addEventListener("DOMContentLoaded", () => {
      n("✅ DOM ready – calling initCartBindings"), O();
    }), d.initAuth().then(() => {
      window.smoothr?.auth?.user?.value && y.renderOrders();
    }), globalThis.setSelectedCurrency = globalThis.setSelectedCurrency || u;
  }
})();
export {
  b as abandonedCart,
  g as affiliates,
  I as analytics,
  d as auth,
  f as cart,
  C as checkout,
  o as currency,
  R as dashboard,
  x as default,
  _ as discounts,
  y as orders,
  T as returns,
  M as reviews,
  G as subscriptions
};
