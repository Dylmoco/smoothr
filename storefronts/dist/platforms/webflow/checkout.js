// storefronts/checkout/gateways/nmi.js
var hasMounted = false;
var isConfigured = false;
var isLocked = false;
function initNMI(tokenizationKey) {
  mountNMIFields(tokenizationKey);
}
function mountNMIFields(tokenizationKey) {
  console.log("[NMI] Attempting to mount NMI fields...");
  if (hasMounted) {
    console.log("[NMI] NMI fields already mounted, skipping.");
    return;
  }
  hasMounted = true;
  const script = document.createElement("script");
  script.id = "collectjs-script";
  script.src = "https://secure.nmi.com/token/Collect.js";
  script.setAttribute("data-tokenization-key", tokenizationKey);
  console.log("[NMI] Set data-tokenization-key on script tag:", tokenizationKey.substring(0, 8) + "...");
  script.async = true;
  document.head.appendChild(script);
  script.onload = () => {
    console.log("[NMI] CollectJS script loaded.");
    configureCollectJS();
  };
  script.onerror = () => {
    console.error("[NMI] Failed to load CollectJS script.");
  };
}
function configureCollectJS() {
  if (isLocked || typeof CollectJS === "undefined") {
    console.error("[NMI] CollectJS not ready or locked, delaying configuration.");
    setTimeout(configureCollectJS, 500);
    return;
  }
  isLocked = true;
  try {
    CollectJS.configure({
      variant: "inline",
      paymentSelector: "[data-smoothr-pay]",
      fields: {
        ccnumber: { selector: "[data-smoothr-card-number]" },
        ccexp: { selector: "[data-smoothr-card-expiry]" },
        cvv: { selector: "[data-smoothr-card-cvc]" }
      },
      fieldsAvailableCallback: function() {
        console.log("[NMI] Fields available, setting handlers");
      },
      callback: function(response) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
        console.log("[NMI] Tokenization response:", response);
        if (response.token) {
          console.log("[NMI] Success, token:", response.token);
          console.log("[NMI] Sending POST with store_id:", window.SMOOTHR_CONFIG.storeId);
          const email = ((_a = document.querySelector("[data-smoothr-email]")) == null ? void 0 : _a.value) || "";
          const phone = ((_b = document.querySelector("[data-smoothr-phone]")) == null ? void 0 : _b.value) || "";
          const billFirst = ((_c = document.querySelector("[data-smoothr-bill-first-name]")) == null ? void 0 : _c.value) || "";
          const billLast = ((_d = document.querySelector("[data-smoothr-bill-last-name]")) == null ? void 0 : _d.value) || "";
          const billingAddress1 = ((_e = document.querySelector("[data-smoothr-bill-line1]")) == null ? void 0 : _e.value) || "";
          const billingAddress2 = ((_f = document.querySelector("[data-smoothr-bill-line2]")) == null ? void 0 : _f.value) || "";
          const billingCity = ((_g = document.querySelector("[data-smoothr-bill-city]")) == null ? void 0 : _g.value) || "";
          const billingState = ((_h = document.querySelector("[data-smoothr-bill-state]")) == null ? void 0 : _h.value) || "";
          const billingZip = ((_i = document.querySelector("[data-smoothr-bill-postal]")) == null ? void 0 : _i.value) || "";
          const billingCountry = ((_j = document.querySelector("[data-smoothr-bill-country]")) == null ? void 0 : _j.value) || "";
          const shipFirst = ((_k = document.querySelector("[data-smoothr-first-name]")) == null ? void 0 : _k.value) || "";
          const shipLast = ((_l = document.querySelector("[data-smoothr-last-name]")) == null ? void 0 : _l.value) || "";
          const shippingAddress1 = ((_m = document.querySelector("[data-smoothr-ship-line1]")) == null ? void 0 : _m.value) || "";
          const shippingAddress2 = ((_n = document.querySelector("[data-smoothr-ship-line2]")) == null ? void 0 : _n.value) || "";
          const shippingCity = ((_o = document.querySelector("[data-smoothr-ship-city]")) == null ? void 0 : _o.value) || "";
          const shippingState = ((_p = document.querySelector("[data-smoothr-ship-state]")) == null ? void 0 : _p.value) || "";
          const shippingZip = ((_q = document.querySelector("[data-smoothr-ship-postal]")) == null ? void 0 : _q.value) || "";
          const shippingCountry = ((_r = document.querySelector("[data-smoothr-ship-country]")) == null ? void 0 : _r.value) || "";
          const amountElement = document.querySelector("[data-smoothr-total]");
          const amount = amountElement ? parseFloat(amountElement.textContent.replace(/[^0-9.]/g, "")) * 100 : 0;
          const currency = window.SMOOTHR_CONFIG.baseCurrency || "GBP";
          const orderId = "smoothr-" + Date.now();
          const orderDescription = "Smoothr Checkout Order";
          console.log("[NMI] SDK cart:", window.Smoothr.cart);
          const cartData = window.Smoothr.cart.getCart() || {};
          const cartItems = Array.isArray(cartData.items) ? cartData.items : [];
          const cart = cartItems.map((item) => ({
            product_id: item.id || "unknown",
            name: item.name,
            quantity: item.quantity,
            price: item.price * 100
            // Multiplyy item prices too
          }));
          if (cart.length === 0) {
            console.error("[NMI] Cart is empty");
            return;
          }
          fetch(`${window.SMOOTHR_CONFIG.apiBase}/api/checkout/nmi`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payment_token: response.token,
              store_id: window.SMOOTHR_CONFIG.storeId,
              first_name: shipFirst,
              last_name: shipLast,
              email,
              phone,
              shipping: {
                name: `${shipFirst} ${shipLast}`.trim(),
                address: {
                  line1: shippingAddress1,
                  line2: shippingAddress2,
                  city: shippingCity,
                  state: shippingState,
                  postal_code: shippingZip,
                  country: shippingCountry
                }
              },
              billing: {
                name: `${billFirst} ${billLast}`.trim(),
                address: {
                  line1: billingAddress1,
                  line2: billingAddress2,
                  city: billingCity,
                  state: billingState,
                  postal_code: billingZip,
                  country: billingCountry
                }
              },
              cart,
              total: amount,
              currency,
              description: orderDescription
            })
          }).then((res) => res.json()).then((data) => console.log("[NMI] Backend response:", data)).catch((error) => console.error("[NMI] POST error:", error));
        } else {
          console.log("[NMI] Failed:", response.reason);
        }
      }
    });
    isConfigured = true;
    console.log("[NMI] CollectJS configured successfully");
  } catch (error) {
    console.error("[NMI] Error configuring CollectJS:", error);
    isLocked = false;
  }
}

// storefronts/platforms/webflow/checkout.js
(async function() {
  async function initCheckout() {
    if (!window.SMOOTHR_CONFIG) {
      console.error("[Smoothr Checkout] Config not found");
      return;
    }
    console.log("[Smoothr Checkout] SDK initialized");
    console.log("[Smoothr Checkout] SMOOTHR_CONFIG", window.SMOOTHR_CONFIG);
    const gateway = window.SMOOTHR_CONFIG.active_payment_gateway;
    console.log("[Smoothr Checkout] Using gateway:", gateway);
    console.log("[Smoothr Checkout] checkout trigger found", document.querySelector("[data-smoothr-pay]"));
    if (gateway === "nmi") {
      try {
        const tokenizationKey = await fetchTokenizationKey(window.SMOOTHR_CONFIG.storeId);
        console.log("[NMI] NMI tokenization key fetched:", tokenizationKey.substring(0, 8) + "...");
        initNMI(tokenizationKey);
      } catch (error) {
        console.error("[Smoothr Checkout] Failed to mount gateway", error);
      }
    }
    const payButton = document.querySelector("[data-smoothr-pay]");
    if (payButton) {
      console.log("[Smoothr Checkout] Pay div found and bound");
    } else {
      console.warn("[Smoothr Checkout] Pay div not found");
    }
  }
  async function fetchTokenizationKey(storeId) {
    const apiBase = window.SMOOTHR_CONFIG.apiBase;
    const response = await fetch(`${apiBase}/api/get-payment-key?storeId=${storeId}&provider=nmi`, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`API fetch error: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.tokenization_key) {
      return data.tokenization_key;
    } else {
      throw new Error("No NMI key found");
    }
  }
  document.addEventListener("DOMContentLoaded", initCheckout);
})();
