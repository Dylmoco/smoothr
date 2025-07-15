// storefronts/checkout/utils/handleSuccessRedirect.js
function handleSuccessRedirect(res, data) {
  var _a, _b;
  if (res.ok && data.success) {
    (_b = (_a = Smoothr == null ? void 0 : Smoothr.cart) == null ? void 0 : _a.clearCart) == null ? void 0 : _b.call(_a);
    window.location.href = "/checkout-success";
  }
}

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
  console.log(
    "[NMI] Set data-tokenization-key on script tag:",
    tokenizationKey.substring(0, 8) + "\u2026"
  );
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
    console.error(
      "[NMI] CollectJS not ready or locked, delaying configuration."
    );
    return setTimeout(configureCollectJS, 500);
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
      fieldsAvailableCallback() {
        console.log("[NMI] Fields available, setting handlers");
      },
      callback(response) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i;
        console.log("[NMI] Tokenization response:", response);
        if (!response.token) {
          console.log("[NMI] Failed:", response.reason);
          isLocked = false;
          return;
        }
        console.log("[NMI] Success, token:", response.token);
        console.log(
          "[NMI] Sending POST with store_id:",
          window.SMOOTHR_CONFIG.storeId
        );
        const firstName = ((_a = document.querySelector("[data-smoothr-first-name]")) == null ? void 0 : _a.value) || "";
        const lastName = ((_b = document.querySelector("[data-smoothr-last-name]")) == null ? void 0 : _b.value) || "";
        const email = ((_c = document.querySelector("[data-smoothr-email]")) == null ? void 0 : _c.value) || "";
        const shipLine1 = ((_d = document.querySelector("[data-smoothr-ship-line1]")) == null ? void 0 : _d.value) || "";
        const shipLine2 = ((_e = document.querySelector("[data-smoothr-ship-line2]")) == null ? void 0 : _e.value) || "";
        const shipCity = ((_f = document.querySelector("[data-smoothr-ship-city]")) == null ? void 0 : _f.value) || "";
        const shipState = ((_g = document.querySelector("[data-smoothr-ship-state]")) == null ? void 0 : _g.value) || "";
        const shipPostal = ((_h = document.querySelector("[data-smoothr-ship-postal]")) == null ? void 0 : _h.value) || "";
        const shipCountry = ((_i = document.querySelector("[data-smoothr-ship-country]")) == null ? void 0 : _i.value) || "";
        const amountEl = document.querySelector("[data-smoothr-total]");
        const amount = amountEl ? Math.round(parseFloat(amountEl.textContent.replace(/[^0-9.]/g, "")) * 100) : 0;
        const currency = window.SMOOTHR_CONFIG.baseCurrency || "GBP";
        const cartData = window.Smoothr.cart.getCart() || {};
        const cartItems = Array.isArray(cartData.items) ? cartData.items : [];
        const cart = cartItems.map((item) => {
          var _a2;
          return {
            product_id: item.id || "unknown",
            name: item.name,
            quantity: item.quantity,
            price: Math.round(((_a2 = item.price) != null ? _a2 : 0) * 100)
          };
        });
        if (cart.length === 0) {
          console.error("[NMI] Cart is empty");
          isLocked = false;
          return;
        }
        fetch(`${window.SMOOTHR_CONFIG.apiBase}/api/checkout/nmi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_token: response.token,
            store_id: window.SMOOTHR_CONFIG.storeId,
            first_name: firstName,
            last_name: lastName,
            email,
            shipping: {
              name: `${firstName} ${lastName}`.trim(),
              address: {
                line1: shipLine1,
                line2: shipLine2,
                city: shipCity,
                state: shipState,
                postal_code: shipPostal,
                country: shipCountry
              }
            },
            cart,
            total: amount,
            currency
          })
        }).then(
          (res) => res.json().then((data) => {
            console.log("[NMI] Backend response:", data);
            handleSuccessRedirect(res, data);
            isLocked = false;
          })
        ).catch((error) => {
          console.error("[NMI] POST error:", error);
          isLocked = false;
        });
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
