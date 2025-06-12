import { createClient as u } from "@supabase/supabase-js";
const m = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), p = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), y = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), w = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), h = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), S = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), O = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), j = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), v = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), x = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
let r;
function g({ supabaseUrl: o, supabaseKey: t }) {
  r = u(o, t), r.auth.getUser().then(({ data: { user: e } }) => {
    console.log(e ? "Logged in as: " + e.email : "Not logged in");
  }), _(), b();
}
function _() {
  document.querySelectorAll('[data-smoothr-auth="login"]').forEach((o) => {
    o.addEventListener("submit", async (t) => {
      t.preventDefault();
      const e = new FormData(o), n = e.get("email"), l = e.get("password");
      try {
        const { data: a, error: s } = await r.auth.signInWithPassword({ email: n, password: l });
        if (s)
          console.error(s);
        else {
          console.log(a.user ? "Logged in as: " + a.user.email : "Logged in"), document.dispatchEvent(new CustomEvent("smoothr:login", { detail: a }));
          const d = await i("login");
          window.location.href = d;
        }
      } catch (a) {
        console.error(a);
      }
    });
  });
}
function b() {
  document.querySelectorAll('[data-smoothr-auth="logout"]').forEach((o) => {
    o.addEventListener("click", async (t) => {
      t.preventDefault();
      const { error: e } = await r.auth.signOut();
      e && console.error(e);
      const { data: { user: n } } = await r.auth.getUser();
      console.log(n ? "Logged in as: " + n.email : "Not logged in"), document.dispatchEvent(new CustomEvent("smoothr:logout"));
      const l = await i("logout");
      window.location.href = l;
    });
  });
}
function c(o) {
  return o.replace(/^www\./, "").toLowerCase();
}
async function i(o) {
  const t = c(window.location.hostname);
  try {
    const { data: e, error: n } = await r.from("stores").select(`${o}_redirect_url`).eq("store_domain", t).single();
    if (n || !e)
      throw n;
    return e[`${o}_redirect_url`] || window.location.origin;
  } catch (e) {
    return console.error(e), window.location.origin;
  }
}
const z = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  initAuth: g,
  lookupRedirectUrl: i,
  normalizeDomain: c
}, Symbol.toStringTag, { value: "Module" }));
console.log("Smoothr SDK loaded");
export {
  m as abandonedCart,
  p as affiliates,
  y as analytics,
  z as auth,
  w as currency,
  h as dashboard,
  S as discounts,
  O as orders,
  j as returns,
  v as reviews,
  x as subscriptions
};
