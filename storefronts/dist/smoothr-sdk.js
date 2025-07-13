const Sr = "smoothr_cart_meta";
let Mt = !1;
var fr;
const ws = (fr = window.SMOOTHR_CONFIG) == null ? void 0 : fr.debug;
const vs = (...s) => ws && console.warn("smoothr:abandoned-cart", ...s);
function Xe() {
  if (typeof window > "u" || !window.localStorage) return {};
  try {
    const s = window.localStorage.getItem(Sr);
    if (s) return JSON.parse(s);
  } catch (s) {
    vs("invalid meta", s);
  }
  return {};
}
function Ye(s) {
  if (!(typeof window > "u" || !window.localStorage))
    try {
      window.localStorage.setItem(Sr, JSON.stringify(s));
    } catch (e) {
      e("write failed", e);
    }
}
function _s(s) {
  if (s.sessionId) return s.sessionId;
  let e;
  return typeof crypto < "u" && crypto.randomUUID ? e = crypto.randomUUID() : e = Date.now().toString(36) + Math.random().toString(36).slice(2), s.sessionId = e, e;
}
function bs() {
  if (typeof window > "u") return {};
  const s = new URLSearchParams(window.location.search), e = {};
  return ["source", "medium", "campaign"].forEach((t) => {
    const r = s.get("utm_" + t);
    r && (e[t] = r);
  }), e;
}
function kr(s = {}) {
  if (Mt || typeof window > "u") return;
  Mt = !0;
  const e = !!s.debug, t = Xe();
  _s(t), !t.referrer && typeof document < "u" && (t.referrer = document.referrer || ""), (!t.utm || Object.keys(t.utm).length === 0) && (t.utm = bs()), t.lastActive = Date.now(), Ye(t);
  const r = () => {
    const i = Xe();
    i.lastModified = Date.now(), Ye(i), e && console.log("smoothr:abandoned-cart lastModified", i.lastModified);
  }, n = () => {
    const i = Xe();
    i.lastActive = Date.now(), Ye(i), e && console.log("smoothr:abandoned-cart lastActive", i.lastActive);
  };
  window.addEventListener("smoothr:cart:updated", r), ["click", "keydown", "scroll", "mousemove"].forEach((i) => {
    window.addEventListener(i, n);
  });
}
function Er() {
}
const Ss = {
  setupAbandonedCartTracker: kr,
  triggerRecoveryFlow: Er
}, ks = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Ss,
  setupAbandonedCartTracker: kr,
  triggerRecoveryFlow: Er
}, Symbol.toStringTag, { value: "Module" })), Es = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Ts = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
let $ = "USD", V = {
  USD: 1,
  EUR: 0.9,
  GBP: 0.8
};
function Tr(s) {
  $ = s;
}
function ft(s = {}) {
  V = { ...V, ...s };
}
function Oe(s, e = $, t = $) {
  if (!V[t] || !V[e])
    throw new Error("Unsupported currency");
  return s / V[t] * V[e];
}
function Ce(s, e = $, t = "en-US") {
  return new Intl.NumberFormat(t, {
    style: "currency",
    currency: e
  }).format(s);
}
const Os = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get baseCurrency() {
    return $;
  },
  convertCurrency: Oe,
  convertPrice: Oe,
  formatCurrency: Ce,
  formatPrice: Ce,
  get rates() {
    return V;
  },
  setBaseCurrency: Tr,
  updateRates: ft
}, Symbol.toStringTag, { value: "Module" })), Cs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), As = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Or = "smoothr_cart";
var gr;
const $s = (gr = window.SMOOTHR_CONFIG) == null ? void 0 : gr.debug;
const Ps = (...s) => $s && console.warn("[Smoothr Cart]", ...s);
function Cr() {
  return typeof window < "u" && window.localStorage ? window.localStorage : typeof globalThis < "u" && globalThis.localStorage ? globalThis.localStorage : null;
}
function N() {
  const s = Cr();
  if (!s)
    return { items: [], meta: { lastModified: Date.now() } };
  try {
    const e = s.getItem(Or);
    if (e) return JSON.parse(e);
  } catch (e) {
    Ps("invalid data", e);
  }
  return { items: [], meta: { lastModified: Date.now() } };
}
function ge(s) {
  const e = Cr();
  if (e)
    try {
      e.setItem(Or, JSON.stringify(s));
    } catch (t) {
      t("write failed", t);
    }
}
function pe(s) {
  typeof window < "u" && window.dispatchEvent && window.dispatchEvent(
    new CustomEvent("smoothr:cart:updated", { detail: s })
  );
}
function Ar() {
  return N();
}
function js() {
  return Ar().meta || {};
}
function xs(s, e) {
  const t = N();
  t.meta = t.meta || {}, t.meta[s] = e, t.meta.lastModified = Date.now(), ge(t), pe(t);
}
function Rs(s) {
  const e = N(), t = e.items.find((r) => r.product_id === s.product_id);
  t ? t.quantity += s.quantity || 1 : e.items.push({ ...s, quantity: s.quantity || 1 }), e.meta.lastModified = Date.now(), ge(e), pe(e);
}
function Is(s) {
  const e = N();
  e.items = e.items.filter((t) => t.product_id !== s), e.meta.lastModified = Date.now(), ge(e), pe(e);
}
function Ls(s, e) {
  const t = N(), r = t.items.find((n) => n.product_id === s);
  r && (e <= 0 ? t.items = t.items.filter((n) => n !== r) : r.quantity = e, t.meta.lastModified = Date.now(), ge(t), pe(t));
}
function Us() {
  const s = { items: [], meta: { lastModified: Date.now() } };
  ge(s), pe(s);
}
function Ds() {
  return N().items.reduce((s, e) => s + e.price * e.quantity, 0);
}
function Bs(s) {
  const e = N();
  e.discount = s, e.meta.lastModified = Date.now(), ge(e), pe(e);
}
function qs() {
  return N().discount || null;
}
function Ms() {
  const s = N();
  let e = s.items.reduce((t, r) => t + r.price * r.quantity, 0);
  return s.discount && (s.discount.type === "percent" ? e -= Math.round(e * (s.discount.amount / 100)) : e -= s.discount.amount), e < 0 ? 0 : e;
}
const $t = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addItem: Rs,
  applyDiscount: Bs,
  clearCart: Us,
  getCart: Ar,
  getDiscount: qs,
  getMeta: js,
  getSubtotal: Ds,
  getTotal: Ms,
  readCart: N,
  removeItem: Is,
  setMetaField: xs,
  updateQuantity: Ls
}, Symbol.toStringTag, { value: "Module" })), Ns = (s) => {
  let e;
  return s ? e = s : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => me).then(({ default: r }) => r(...t)) : e = fetch, (...t) => e(...t);
};
class Pt extends Error {
  constructor(e, t = "FunctionsError", r) {
    super(e), this.name = t, this.context = r;
  }
}
class Fs extends Pt {
  constructor(e) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", e);
  }
}
class zs extends Pt {
  constructor(e) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", e);
  }
}
class Ws extends Pt {
  constructor(e) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e);
  }
}
var gt;
(function(s) {
  s.Any = "any", s.ApNortheast1 = "ap-northeast-1", s.ApNortheast2 = "ap-northeast-2", s.ApSouth1 = "ap-south-1", s.ApSoutheast1 = "ap-southeast-1", s.ApSoutheast2 = "ap-southeast-2", s.CaCentral1 = "ca-central-1", s.EuCentral1 = "eu-central-1", s.EuWest1 = "eu-west-1", s.EuWest2 = "eu-west-2", s.EuWest3 = "eu-west-3", s.SaEast1 = "sa-east-1", s.UsEast1 = "us-east-1", s.UsWest1 = "us-west-1", s.UsWest2 = "us-west-2";
})(gt || (gt = {}));
var Gs = function(s, e, t, r) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? i(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
class Hs {
  constructor(e, { headers: t = {}, customFetch: r, region: n = gt.Any } = {}) {
    this.url = e, this.headers = t, this.region = n, this.fetch = Ns(r);
  }
  /**
   * Updates the authorization header
   * @param token - the new jwt token sent in the authorisation header
   */
  setAuth(e) {
    this.headers.Authorization = `Bearer ${e}`;
  }
  /**
   * Invokes a function
   * @param functionName - The name of the Function to invoke.
   * @param options - Options for invoking the Function.
   */
  invoke(e, t = {}) {
    var r;
    return Gs(this, void 0, void 0, function* () {
      try {
        const { headers: n, method: i, body: o } = t;
        let a = {}, { region: c } = t;
        c || (c = this.region), c && c !== "any" && (a["x-region"] = c);
        let l;
        o && (n && !Object.prototype.hasOwnProperty.call(n, "Content-Type") || !n) && (typeof Blob < "u" && o instanceof Blob || o instanceof ArrayBuffer ? (a["Content-Type"] = "application/octet-stream", l = o) : typeof o == "string" ? (a["Content-Type"] = "text/plain", l = o) : typeof FormData < "u" && o instanceof FormData ? l = o : (a["Content-Type"] = "application/json", l = JSON.stringify(o)));
        const u = yield this.fetch(`${this.url}/${e}`, {
          method: i || "POST",
          // headers priority is (high to low):
          // 1. invoke-level headers
          // 2. client-level headers
          // 3. default Content-Type header
          headers: Object.assign(Object.assign(Object.assign({}, a), this.headers), n),
          body: l
        }).catch((g) => {
          throw new Fs(g);
        }), d = u.headers.get("x-relay-error");
        if (d && d === "true")
          throw new zs(u);
        if (!u.ok)
          throw new Ws(u);
        let h = ((r = u.headers.get("Content-Type")) !== null && r !== void 0 ? r : "text/plain").split(";")[0].trim(), f;
        return h === "application/json" ? f = yield u.json() : h === "application/octet-stream" ? f = yield u.blob() : h === "text/event-stream" ? f = u : h === "multipart/form-data" ? f = yield u.formData() : f = yield u.text(), { data: f, error: null };
      } catch (n) {
        return { data: null, error: n };
      }
    });
  }
}
var I = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Js(s) {
  if (s.__esModule) return s;
  var e = s.default;
  if (typeof e == "function") {
    var t = function r() {
      return this instanceof r ? Reflect.construct(e, arguments, this.constructor) : e.apply(this, arguments);
    };
    t.prototype = e.prototype;
  } else t = {};
  return Object.defineProperty(t, "__esModule", { value: !0 }), Object.keys(s).forEach(function(r) {
    var n = Object.getOwnPropertyDescriptor(s, r);
    Object.defineProperty(t, r, n.get ? n : {
      enumerable: !0,
      get: function() {
        return s[r];
      }
    });
  }), t;
}
var j = {}, jt = {}, ze = {}, Pe = {}, We = {}, Ge = {}, Ks = function() {
  if (typeof self < "u")
    return self;
  if (typeof window < "u")
    return window;
  if (typeof global < "u")
    return global;
  throw new Error("unable to locate global object");
}, he = Ks();
const Vs = he.fetch, $r = he.fetch.bind(he), Pr = he.Headers, Qs = he.Request, Xs = he.Response, me = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Headers: Pr,
  Request: Qs,
  Response: Xs,
  default: $r,
  fetch: Vs
}, Symbol.toStringTag, { value: "Module" })), Ys = /* @__PURE__ */ Js(me);
var He = {};
Object.defineProperty(He, "__esModule", { value: !0 });
let Zs = class extends Error {
  constructor(e) {
    super(e.message), this.name = "PostgrestError", this.details = e.details, this.hint = e.hint, this.code = e.code;
  }
};
var Xo = He.default = Zs, jr = I && I.__importDefault || function(s) {
  return s && s.__esModule ? s : { default: s };
};
Object.defineProperty(Ge, "__esModule", { value: !0 });
const en = jr(Ys), tn = jr(He);
let rn = class {
  constructor(e) {
    this.shouldThrowOnError = !1, this.method = e.method, this.url = e.url, this.headers = e.headers, this.schema = e.schema, this.body = e.body, this.shouldThrowOnError = e.shouldThrowOnError, this.signal = e.signal, this.isMaybeSingle = e.isMaybeSingle, e.fetch ? this.fetch = e.fetch : typeof fetch > "u" ? this.fetch = en.default : this.fetch = fetch;
  }
  /**
   * If there's an error with the query, throwOnError will reject the promise by
   * throwing the error instead of returning it as part of a successful response.
   *
   * {@link https://github.com/supabase/supabase-js/issues/92}
   */
  throwOnError() {
    return this.shouldThrowOnError = !0, this;
  }
  /**
   * Set an HTTP header for the request.
   */
  setHeader(e, t) {
    return this.headers = Object.assign({}, this.headers), this.headers[e] = t, this;
  }
  then(e, t) {
    this.schema === void 0 || (["GET", "HEAD"].includes(this.method) ? this.headers["Accept-Profile"] = this.schema : this.headers["Content-Profile"] = this.schema), this.method !== "GET" && this.method !== "HEAD" && (this.headers["Content-Type"] = "application/json");
    const r = this.fetch;
    let n = r(this.url.toString(), {
      method: this.method,
      headers: this.headers,
      body: JSON.stringify(this.body),
      signal: this.signal
    }).then(async (i) => {
      var o, a, c;
      let l = null, u = null, d = null, h = i.status, f = i.statusText;
      if (i.ok) {
        if (this.method !== "HEAD") {
          const w = await i.text();
          w === "" || (this.headers.Accept === "text/csv" || this.headers.Accept && this.headers.Accept.includes("application/vnd.pgrst.plan+text") ? u = w : u = JSON.parse(w));
        }
        const m = (o = this.headers.Prefer) === null || o === void 0 ? void 0 : o.match(/count=(exact|planned|estimated)/), p = (a = i.headers.get("content-range")) === null || a === void 0 ? void 0 : a.split("/");
        m && p && p.length > 1 && (d = parseInt(p[1])), this.isMaybeSingle && this.method === "GET" && Array.isArray(u) && (u.length > 1 ? (l = {
          // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
          code: "PGRST116",
          details: `Results contain ${u.length} rows, application/vnd.pgrst.object+json requires 1 row`,
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned"
        }, u = null, d = null, h = 406, f = "Not Acceptable") : u.length === 1 ? u = u[0] : u = null);
      } else {
        const m = await i.text();
        try {
          l = JSON.parse(m), Array.isArray(l) && i.status === 404 && (u = [], l = null, h = 200, f = "OK");
        } catch {
          i.status === 404 && m === "" ? (h = 204, f = "No Content") : l = {
            message: m
          };
        }
        if (l && this.isMaybeSingle && (!((c = l == null ? void 0 : l.details) === null || c === void 0) && c.includes("0 rows")) && (l = null, h = 200, f = "OK"), l && this.shouldThrowOnError)
          throw new tn.default(l);
      }
      return {
        error: l,
        data: u,
        count: d,
        status: h,
        statusText: f
      };
    });
    return this.shouldThrowOnError || (n = n.catch((i) => {
      var o, a, c;
      return {
        error: {
          message: `${(o = i == null ? void 0 : i.name) !== null && o !== void 0 ? o : "FetchError"}: ${i == null ? void 0 : i.message}`,
          details: `${(a = i == null ? void 0 : i.stack) !== null && a !== void 0 ? a : ""}`,
          hint: "",
          code: `${(c = i == null ? void 0 : i.code) !== null && c !== void 0 ? c : ""}`
        },
        data: null,
        count: null,
        status: 0,
        statusText: ""
      };
    })), n.then(e, t);
  }
  /**
   * Override the type of the returned `data`.
   *
   * @typeParam NewResult - The new result type to override with
   * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
   */
  returns() {
    return this;
  }
  /**
   * Override the type of the returned `data` field in the response.
   *
   * @typeParam NewResult - The new type to cast the response data to
   * @typeParam Options - Optional type configuration (defaults to { merge: true })
   * @typeParam Options.merge - When true, merges the new type with existing return type. When false, replaces the existing types entirely (defaults to true)
   * @example
   * ```typescript
   * // Merge with existing types (default behavior)
   * const query = supabase
   *   .from('users')
   *   .select()
   *   .overrideTypes<{ custom_field: string }>()
   *
   * // Replace existing types completely
   * const replaceQuery = supabase
   *   .from('users')
   *   .select()
   *   .overrideTypes<{ id: number; name: string }, { merge: false }>()
   * ```
   * @returns A PostgrestBuilder instance with the new type
   */
  overrideTypes() {
    return this;
  }
};
var Zo = Ge.default = rn, sn = I && I.__importDefault || function(s) {
  return s && s.__esModule ? s : { default: s };
};
Object.defineProperty(We, "__esModule", { value: !0 });
const nn = sn(Ge);
let on = class extends nn.default {
  /**
   * Perform a SELECT on the query result.
   *
   * By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not
   * return modified rows. By calling this method, modified rows are returned in
   * `data`.
   *
   * @param columns - The columns to retrieve, separated by commas
   */
  select(e) {
    let t = !1;
    const r = (e ?? "*").split("").map((n) => /\s/.test(n) && !t ? "" : (n === '"' && (t = !t), n)).join("");
    return this.url.searchParams.set("select", r), this.headers.Prefer && (this.headers.Prefer += ","), this.headers.Prefer += "return=representation", this;
  }
  /**
   * Order the query result by `column`.
   *
   * You can call this method multiple times to order by multiple columns.
   *
   * You can order referenced tables, but it only affects the ordering of the
   * parent table if you use `!inner` in the query.
   *
   * @param column - The column to order by
   * @param options - Named parameters
   * @param options.ascending - If `true`, the result will be in ascending order
   * @param options.nullsFirst - If `true`, `null`s appear first. If `false`,
   * `null`s appear last.
   * @param options.referencedTable - Set this to order a referenced table by
   * its columns
   * @param options.foreignTable - Deprecated, use `options.referencedTable`
   * instead
   */
  order(e, { ascending: t = !0, nullsFirst: r, foreignTable: n, referencedTable: i = n } = {}) {
    const o = i ? `${i}.order` : "order", a = this.url.searchParams.get(o);
    return this.url.searchParams.set(o, `${a ? `${a},` : ""}${e}.${t ? "asc" : "desc"}${r === void 0 ? "" : r ? ".nullsfirst" : ".nullslast"}`), this;
  }
  /**
   * Limit the query result by `count`.
   *
   * @param count - The maximum number of rows to return
   * @param options - Named parameters
   * @param options.referencedTable - Set this to limit rows of referenced
   * tables instead of the parent table
   * @param options.foreignTable - Deprecated, use `options.referencedTable`
   * instead
   */
  limit(e, { foreignTable: t, referencedTable: r = t } = {}) {
    const n = typeof r > "u" ? "limit" : `${r}.limit`;
    return this.url.searchParams.set(n, `${e}`), this;
  }
  /**
   * Limit the query result by starting at an offset `from` and ending at the offset `to`.
   * Only records within this range are returned.
   * This respects the query order and if there is no order clause the range could behave unexpectedly.
   * The `from` and `to` values are 0-based and inclusive: `range(1, 3)` will include the second, third
   * and fourth rows of the query.
   *
   * @param from - The starting index from which to limit the result
   * @param to - The last index to which to limit the result
   * @param options - Named parameters
   * @param options.referencedTable - Set this to limit rows of referenced
   * tables instead of the parent table
   * @param options.foreignTable - Deprecated, use `options.referencedTable`
   * instead
   */
  range(e, t, { foreignTable: r, referencedTable: n = r } = {}) {
    const i = typeof n > "u" ? "offset" : `${n}.offset`, o = typeof n > "u" ? "limit" : `${n}.limit`;
    return this.url.searchParams.set(i, `${e}`), this.url.searchParams.set(o, `${t - e + 1}`), this;
  }
  /**
   * Set the AbortSignal for the fetch request.
   *
   * @param signal - The AbortSignal to use for the fetch request
   */
  abortSignal(e) {
    return this.signal = e, this;
  }
  /**
   * Return `data` as a single object instead of an array of objects.
   *
   * Query result must be one row (e.g. using `.limit(1)`), otherwise this
   * returns an error.
   */
  single() {
    return this.headers.Accept = "application/vnd.pgrst.object+json", this;
  }
  /**
   * Return `data` as a single object instead of an array of objects.
   *
   * Query result must be zero or one row (e.g. using `.limit(1)`), otherwise
   * this returns an error.
   */
  maybeSingle() {
    return this.method === "GET" ? this.headers.Accept = "application/json" : this.headers.Accept = "application/vnd.pgrst.object+json", this.isMaybeSingle = !0, this;
  }
  /**
   * Return `data` as a string in CSV format.
   */
  csv() {
    return this.headers.Accept = "text/csv", this;
  }
  /**
   * Return `data` as an object in [GeoJSON](https://geojson.org) format.
   */
  geojson() {
    return this.headers.Accept = "application/geo+json", this;
  }
  /**
   * Return `data` as the EXPLAIN plan for the query.
   *
   * You need to enable the
   * [db_plan_enabled](https://supabase.com/docs/guides/database/debugging-performance#enabling-explain)
   * setting before using this method.
   *
   * @param options - Named parameters
   *
   * @param options.analyze - If `true`, the query will be executed and the
   * actual run time will be returned
   *
   * @param options.verbose - If `true`, the query identifier will be returned
   * and `data` will include the output columns of the query
   *
   * @param options.settings - If `true`, include information on configuration
   * parameters that affect query planning
   *
   * @param options.buffers - If `true`, include information on buffer usage
   *
   * @param options.wal - If `true`, include information on WAL record generation
   *
   * @param options.format - The format of the output, can be `"text"` (default)
   * or `"json"`
   */
  explain({ analyze: e = !1, verbose: t = !1, settings: r = !1, buffers: n = !1, wal: i = !1, format: o = "text" } = {}) {
    var a;
    const c = [
      e ? "analyze" : null,
      t ? "verbose" : null,
      r ? "settings" : null,
      n ? "buffers" : null,
      i ? "wal" : null
    ].filter(Boolean).join("|"), l = (a = this.headers.Accept) !== null && a !== void 0 ? a : "application/json";
    return this.headers.Accept = `application/vnd.pgrst.plan+${o}; for="${l}"; options=${c};`, o === "json" ? this : this;
  }
  /**
   * Rollback the query.
   *
   * `data` will still be returned, but the query is not committed.
   */
  rollback() {
    var e;
    return ((e = this.headers.Prefer) !== null && e !== void 0 ? e : "").trim().length > 0 ? this.headers.Prefer += ",tx=rollback" : this.headers.Prefer = "tx=rollback", this;
  }
  /**
   * Override the type of the returned `data`.
   *
   * @typeParam NewResult - The new result type to override with
   * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
   */
  returns() {
    return this;
  }
};
var ta = We.default = on, an = I && I.__importDefault || function(s) {
  return s && s.__esModule ? s : { default: s };
};
Object.defineProperty(Pe, "__esModule", { value: !0 });
const cn = an(We);
let ln = class extends cn.default {
  /**
   * Match only rows where `column` is equal to `value`.
   *
   * To check if the value of `column` is NULL, you should use `.is()` instead.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  eq(e, t) {
    return this.url.searchParams.append(e, `eq.${t}`), this;
  }
  /**
   * Match only rows where `column` is not equal to `value`.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  neq(e, t) {
    return this.url.searchParams.append(e, `neq.${t}`), this;
  }
  /**
   * Match only rows where `column` is greater than `value`.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  gt(e, t) {
    return this.url.searchParams.append(e, `gt.${t}`), this;
  }
  /**
   * Match only rows where `column` is greater than or equal to `value`.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  gte(e, t) {
    return this.url.searchParams.append(e, `gte.${t}`), this;
  }
  /**
   * Match only rows where `column` is less than `value`.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  lt(e, t) {
    return this.url.searchParams.append(e, `lt.${t}`), this;
  }
  /**
   * Match only rows where `column` is less than or equal to `value`.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  lte(e, t) {
    return this.url.searchParams.append(e, `lte.${t}`), this;
  }
  /**
   * Match only rows where `column` matches `pattern` case-sensitively.
   *
   * @param column - The column to filter on
   * @param pattern - The pattern to match with
   */
  like(e, t) {
    return this.url.searchParams.append(e, `like.${t}`), this;
  }
  /**
   * Match only rows where `column` matches all of `patterns` case-sensitively.
   *
   * @param column - The column to filter on
   * @param patterns - The patterns to match with
   */
  likeAllOf(e, t) {
    return this.url.searchParams.append(e, `like(all).{${t.join(",")}}`), this;
  }
  /**
   * Match only rows where `column` matches any of `patterns` case-sensitively.
   *
   * @param column - The column to filter on
   * @param patterns - The patterns to match with
   */
  likeAnyOf(e, t) {
    return this.url.searchParams.append(e, `like(any).{${t.join(",")}}`), this;
  }
  /**
   * Match only rows where `column` matches `pattern` case-insensitively.
   *
   * @param column - The column to filter on
   * @param pattern - The pattern to match with
   */
  ilike(e, t) {
    return this.url.searchParams.append(e, `ilike.${t}`), this;
  }
  /**
   * Match only rows where `column` matches all of `patterns` case-insensitively.
   *
   * @param column - The column to filter on
   * @param patterns - The patterns to match with
   */
  ilikeAllOf(e, t) {
    return this.url.searchParams.append(e, `ilike(all).{${t.join(",")}}`), this;
  }
  /**
   * Match only rows where `column` matches any of `patterns` case-insensitively.
   *
   * @param column - The column to filter on
   * @param patterns - The patterns to match with
   */
  ilikeAnyOf(e, t) {
    return this.url.searchParams.append(e, `ilike(any).{${t.join(",")}}`), this;
  }
  /**
   * Match only rows where `column` IS `value`.
   *
   * For non-boolean columns, this is only relevant for checking if the value of
   * `column` is NULL by setting `value` to `null`.
   *
   * For boolean columns, you can also set `value` to `true` or `false` and it
   * will behave the same way as `.eq()`.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  is(e, t) {
    return this.url.searchParams.append(e, `is.${t}`), this;
  }
  /**
   * Match only rows where `column` is included in the `values` array.
   *
   * @param column - The column to filter on
   * @param values - The values array to filter with
   */
  in(e, t) {
    const r = Array.from(new Set(t)).map((n) => typeof n == "string" && new RegExp("[,()]").test(n) ? `"${n}"` : `${n}`).join(",");
    return this.url.searchParams.append(e, `in.(${r})`), this;
  }
  /**
   * Only relevant for jsonb, array, and range columns. Match only rows where
   * `column` contains every element appearing in `value`.
   *
   * @param column - The jsonb, array, or range column to filter on
   * @param value - The jsonb, array, or range value to filter with
   */
  contains(e, t) {
    return typeof t == "string" ? this.url.searchParams.append(e, `cs.${t}`) : Array.isArray(t) ? this.url.searchParams.append(e, `cs.{${t.join(",")}}`) : this.url.searchParams.append(e, `cs.${JSON.stringify(t)}`), this;
  }
  /**
   * Only relevant for jsonb, array, and range columns. Match only rows where
   * every element appearing in `column` is contained by `value`.
   *
   * @param column - The jsonb, array, or range column to filter on
   * @param value - The jsonb, array, or range value to filter with
   */
  containedBy(e, t) {
    return typeof t == "string" ? this.url.searchParams.append(e, `cd.${t}`) : Array.isArray(t) ? this.url.searchParams.append(e, `cd.{${t.join(",")}}`) : this.url.searchParams.append(e, `cd.${JSON.stringify(t)}`), this;
  }
  /**
   * Only relevant for range columns. Match only rows where every element in
   * `column` is greater than any element in `range`.
   *
   * @param column - The range column to filter on
   * @param range - The range to filter with
   */
  rangeGt(e, t) {
    return this.url.searchParams.append(e, `sr.${t}`), this;
  }
  /**
   * Only relevant for range columns. Match only rows where every element in
   * `column` is either contained in `range` or greater than any element in
   * `range`.
   *
   * @param column - The range column to filter on
   * @param range - The range to filter with
   */
  rangeGte(e, t) {
    return this.url.searchParams.append(e, `nxl.${t}`), this;
  }
  /**
   * Only relevant for range columns. Match only rows where every element in
   * `column` is less than any element in `range`.
   *
   * @param column - The range column to filter on
   * @param range - The range to filter with
   */
  rangeLt(e, t) {
    return this.url.searchParams.append(e, `sl.${t}`), this;
  }
  /**
   * Only relevant for range columns. Match only rows where every element in
   * `column` is either contained in `range` or less than any element in
   * `range`.
   *
   * @param column - The range column to filter on
   * @param range - The range to filter with
   */
  rangeLte(e, t) {
    return this.url.searchParams.append(e, `nxr.${t}`), this;
  }
  /**
   * Only relevant for range columns. Match only rows where `column` is
   * mutually exclusive to `range` and there can be no element between the two
   * ranges.
   *
   * @param column - The range column to filter on
   * @param range - The range to filter with
   */
  rangeAdjacent(e, t) {
    return this.url.searchParams.append(e, `adj.${t}`), this;
  }
  /**
   * Only relevant for array and range columns. Match only rows where
   * `column` and `value` have an element in common.
   *
   * @param column - The array or range column to filter on
   * @param value - The array or range value to filter with
   */
  overlaps(e, t) {
    return typeof t == "string" ? this.url.searchParams.append(e, `ov.${t}`) : this.url.searchParams.append(e, `ov.{${t.join(",")}}`), this;
  }
  /**
   * Only relevant for text and tsvector columns. Match only rows where
   * `column` matches the query string in `query`.
   *
   * @param column - The text or tsvector column to filter on
   * @param query - The query text to match with
   * @param options - Named parameters
   * @param options.config - The text search configuration to use
   * @param options.type - Change how the `query` text is interpreted
   */
  textSearch(e, t, { config: r, type: n } = {}) {
    let i = "";
    n === "plain" ? i = "pl" : n === "phrase" ? i = "ph" : n === "websearch" && (i = "w");
    const o = r === void 0 ? "" : `(${r})`;
    return this.url.searchParams.append(e, `${i}fts${o}.${t}`), this;
  }
  /**
   * Match only rows where each column in `query` keys is equal to its
   * associated value. Shorthand for multiple `.eq()`s.
   *
   * @param query - The object to filter with, with column names as keys mapped
   * to their filter values
   */
  match(e) {
    return Object.entries(e).forEach(([t, r]) => {
      this.url.searchParams.append(t, `eq.${r}`);
    }), this;
  }
  /**
   * Match only rows which doesn't satisfy the filter.
   *
   * Unlike most filters, `opearator` and `value` are used as-is and need to
   * follow [PostgREST
   * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
   * to make sure they are properly sanitized.
   *
   * @param column - The column to filter on
   * @param operator - The operator to be negated to filter with, following
   * PostgREST syntax
   * @param value - The value to filter with, following PostgREST syntax
   */
  not(e, t, r) {
    return this.url.searchParams.append(e, `not.${t}.${r}`), this;
  }
  /**
   * Match only rows which satisfy at least one of the filters.
   *
   * Unlike most filters, `filters` is used as-is and needs to follow [PostgREST
   * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
   * to make sure it's properly sanitized.
   *
   * It's currently not possible to do an `.or()` filter across multiple tables.
   *
   * @param filters - The filters to use, following PostgREST syntax
   * @param options - Named parameters
   * @param options.referencedTable - Set this to filter on referenced tables
   * instead of the parent table
   * @param options.foreignTable - Deprecated, use `referencedTable` instead
   */
  or(e, { foreignTable: t, referencedTable: r = t } = {}) {
    const n = r ? `${r}.or` : "or";
    return this.url.searchParams.append(n, `(${e})`), this;
  }
  /**
   * Match only rows which satisfy the filter. This is an escape hatch - you
   * should use the specific filter methods wherever possible.
   *
   * Unlike most filters, `opearator` and `value` are used as-is and need to
   * follow [PostgREST
   * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
   * to make sure they are properly sanitized.
   *
   * @param column - The column to filter on
   * @param operator - The operator to filter with, following PostgREST syntax
   * @param value - The value to filter with, following PostgREST syntax
   */
  filter(e, t, r) {
    return this.url.searchParams.append(e, `${t}.${r}`), this;
  }
};
var sa = Pe.default = ln, un = I && I.__importDefault || function(s) {
  return s && s.__esModule ? s : { default: s };
};
Object.defineProperty(ze, "__esModule", { value: !0 });
const we = un(Pe);
let dn = class {
  constructor(e, { headers: t = {}, schema: r, fetch: n }) {
    this.url = e, this.headers = t, this.schema = r, this.fetch = n;
  }
  /**
   * Perform a SELECT query on the table or view.
   *
   * @param columns - The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`
   *
   * @param options - Named parameters
   *
   * @param options.head - When set to `true`, `data` will not be returned.
   * Useful if you only need the count.
   *
   * @param options.count - Count algorithm to use to count rows in the table or view.
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   */
  select(e, { head: t = !1, count: r } = {}) {
    const n = t ? "HEAD" : "GET";
    let i = !1;
    const o = (e ?? "*").split("").map((a) => /\s/.test(a) && !i ? "" : (a === '"' && (i = !i), a)).join("");
    return this.url.searchParams.set("select", o), r && (this.headers.Prefer = `count=${r}`), new we.default({
      method: n,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
  /**
   * Perform an INSERT into the table or view.
   *
   * By default, inserted rows are not returned. To return it, chain the call
   * with `.select()`.
   *
   * @param values - The values to insert. Pass an object to insert a single row
   * or an array to insert multiple rows.
   *
   * @param options - Named parameters
   *
   * @param options.count - Count algorithm to use to count inserted rows.
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   *
   * @param options.defaultToNull - Make missing fields default to `null`.
   * Otherwise, use the default value for the column. Only applies for bulk
   * inserts.
   */
  insert(e, { count: t, defaultToNull: r = !0 } = {}) {
    const n = "POST", i = [];
    if (this.headers.Prefer && i.push(this.headers.Prefer), t && i.push(`count=${t}`), r || i.push("missing=default"), this.headers.Prefer = i.join(","), Array.isArray(e)) {
      const o = e.reduce((a, c) => a.concat(Object.keys(c)), []);
      if (o.length > 0) {
        const a = [...new Set(o)].map((c) => `"${c}"`);
        this.url.searchParams.set("columns", a.join(","));
      }
    }
    return new we.default({
      method: n,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      body: e,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
  /**
   * Perform an UPSERT on the table or view. Depending on the column(s) passed
   * to `onConflict`, `.upsert()` allows you to perform the equivalent of
   * `.insert()` if a row with the corresponding `onConflict` columns doesn't
   * exist, or if it does exist, perform an alternative action depending on
   * `ignoreDuplicates`.
   *
   * By default, upserted rows are not returned. To return it, chain the call
   * with `.select()`.
   *
   * @param values - The values to upsert with. Pass an object to upsert a
   * single row or an array to upsert multiple rows.
   *
   * @param options - Named parameters
   *
   * @param options.onConflict - Comma-separated UNIQUE column(s) to specify how
   * duplicate rows are determined. Two rows are duplicates if all the
   * `onConflict` columns are equal.
   *
   * @param options.ignoreDuplicates - If `true`, duplicate rows are ignored. If
   * `false`, duplicate rows are merged with existing rows.
   *
   * @param options.count - Count algorithm to use to count upserted rows.
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   *
   * @param options.defaultToNull - Make missing fields default to `null`.
   * Otherwise, use the default value for the column. This only applies when
   * inserting new rows, not when merging with existing rows under
   * `ignoreDuplicates: false`. This also only applies when doing bulk upserts.
   */
  upsert(e, { onConflict: t, ignoreDuplicates: r = !1, count: n, defaultToNull: i = !0 } = {}) {
    const o = "POST", a = [`resolution=${r ? "ignore" : "merge"}-duplicates`];
    if (t !== void 0 && this.url.searchParams.set("on_conflict", t), this.headers.Prefer && a.push(this.headers.Prefer), n && a.push(`count=${n}`), i || a.push("missing=default"), this.headers.Prefer = a.join(","), Array.isArray(e)) {
      const c = e.reduce((l, u) => l.concat(Object.keys(u)), []);
      if (c.length > 0) {
        const l = [...new Set(c)].map((u) => `"${u}"`);
        this.url.searchParams.set("columns", l.join(","));
      }
    }
    return new we.default({
      method: o,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      body: e,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
  /**
   * Perform an UPDATE on the table or view.
   *
   * By default, updated rows are not returned. To return it, chain the call
   * with `.select()` after filters.
   *
   * @param values - The values to update with
   *
   * @param options - Named parameters
   *
   * @param options.count - Count algorithm to use to count updated rows.
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   */
  update(e, { count: t } = {}) {
    const r = "PATCH", n = [];
    return this.headers.Prefer && n.push(this.headers.Prefer), t && n.push(`count=${t}`), this.headers.Prefer = n.join(","), new we.default({
      method: r,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      body: e,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
  /**
   * Perform a DELETE on the table or view.
   *
   * By default, deleted rows are not returned. To return it, chain the call
   * with `.select()` after filters.
   *
   * @param options - Named parameters
   *
   * @param options.count - Count algorithm to use to count deleted rows.
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   */
  delete({ count: e } = {}) {
    const t = "DELETE", r = [];
    return e && r.push(`count=${e}`), this.headers.Prefer && r.unshift(this.headers.Prefer), this.headers.Prefer = r.join(","), new we.default({
      method: t,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
var ia = ze.default = dn, Je = {}, Ke = {};
Object.defineProperty(Ke, "__esModule", { value: !0 });
var hn = Ke.version = void 0;
hn = Ke.version = "0.0.0-automated";
Object.defineProperty(Je, "__esModule", { value: !0 });
var fn = Je.DEFAULT_HEADERS = void 0;
const gn = Ke;
fn = Je.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${gn.version}` };
var xr = I && I.__importDefault || function(s) {
  return s && s.__esModule ? s : { default: s };
};
Object.defineProperty(jt, "__esModule", { value: !0 });
const pn = xr(ze), mn = xr(Pe), yn = Je;
let wn = class Rr {
  // TODO: Add back shouldThrowOnError once we figure out the typings
  /**
   * Creates a PostgREST client.
   *
   * @param url - URL of the PostgREST endpoint
   * @param options - Named parameters
   * @param options.headers - Custom headers
   * @param options.schema - Postgres schema to switch to
   * @param options.fetch - Custom fetch
   */
  constructor(e, { headers: t = {}, schema: r, fetch: n } = {}) {
    this.url = e, this.headers = Object.assign(Object.assign({}, yn.DEFAULT_HEADERS), t), this.schemaName = r, this.fetch = n;
  }
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(e) {
    const t = new URL(`${this.url}/${e}`);
    return new pn.default(t, {
      headers: Object.assign({}, this.headers),
      schema: this.schemaName,
      fetch: this.fetch
    });
  }
  /**
   * Select a schema to query or perform an function (rpc) call.
   *
   * The schema needs to be on the list of exposed schemas inside Supabase.
   *
   * @param schema - The schema to query
   */
  schema(e) {
    return new Rr(this.url, {
      headers: this.headers,
      schema: e,
      fetch: this.fetch
    });
  }
  /**
   * Perform a function call.
   *
   * @param fn - The function name to call
   * @param args - The arguments to pass to the function call
   * @param options - Named parameters
   * @param options.head - When set to `true`, `data` will not be returned.
   * Useful if you only need the count.
   * @param options.get - When set to `true`, the function will be called with
   * read-only access mode.
   * @param options.count - Count algorithm to use to count rows returned by the
   * function. Only applicable for [set-returning
   * functions](https://www.postgresql.org/docs/current/functions-srf.html).
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   */
  rpc(e, t = {}, { head: r = !1, get: n = !1, count: i } = {}) {
    let o;
    const a = new URL(`${this.url}/rpc/${e}`);
    let c;
    r || n ? (o = r ? "HEAD" : "GET", Object.entries(t).filter(([u, d]) => d !== void 0).map(([u, d]) => [u, Array.isArray(d) ? `{${d.join(",")}}` : `${d}`]).forEach(([u, d]) => {
      a.searchParams.append(u, d);
    })) : (o = "POST", c = t);
    const l = Object.assign({}, this.headers);
    return i && (l.Prefer = `count=${i}`), new mn.default({
      method: o,
      url: a,
      headers: l,
      schema: this.schemaName,
      body: c,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
var oa = jt.default = wn, ye = I && I.__importDefault || function(s) {
  return s && s.__esModule ? s : { default: s };
};
Object.defineProperty(j, "__esModule", { value: !0 });
var vn = j.PostgrestError = En = j.PostgrestBuilder = kn = j.PostgrestTransformBuilder = Sn = j.PostgrestFilterBuilder = bn = j.PostgrestQueryBuilder = _n = j.PostgrestClient = void 0;
const Ir = ye(jt);
var _n = j.PostgrestClient = Ir.default;
const Lr = ye(ze);
var bn = j.PostgrestQueryBuilder = Lr.default;
const Ur = ye(Pe);
var Sn = j.PostgrestFilterBuilder = Ur.default;
const Dr = ye(We);
var kn = j.PostgrestTransformBuilder = Dr.default;
const Br = ye(Ge);
var En = j.PostgrestBuilder = Br.default;
const qr = ye(He);
vn = j.PostgrestError = qr.default;
var Tn = j.default = {
  PostgrestClient: Ir.default,
  PostgrestQueryBuilder: Lr.default,
  PostgrestFilterBuilder: Ur.default,
  PostgrestTransformBuilder: Dr.default,
  PostgrestBuilder: Br.default,
  PostgrestError: qr.default
};
const {
  PostgrestClient: On,
  PostgrestQueryBuilder: aa,
  PostgrestFilterBuilder: ca,
  PostgrestTransformBuilder: la,
  PostgrestBuilder: ua,
  PostgrestError: da
} = Tn;
let pt;
typeof window > "u" ? pt = require("ws") : pt = window.WebSocket;
const Cn = pt, An = "2.11.10", $n = { "X-Client-Info": `realtime-js/${An}` }, Pn = "1.0.0";
const Mr = 1e4, jn = 1e3;
var de;
(function(s) {
  s[s.connecting = 0] = "connecting", s[s.open = 1] = "open", s[s.closing = 2] = "closing", s[s.closed = 3] = "closed";
})(de || (de = {}));
var C;
(function(s) {
  s.closed = "closed", s.errored = "errored", s.joined = "joined", s.joining = "joining", s.leaving = "leaving";
})(C || (C = {}));
var U;
(function(s) {
  s.close = "phx_close", s.error = "phx_error", s.join = "phx_join", s.reply = "phx_reply", s.leave = "phx_leave", s.access_token = "access_token";
})(U || (U = {}));
var mt;
(function(s) {
  s.websocket = "websocket";
})(mt || (mt = {}));
var ee;
(function(s) {
  s.Connecting = "connecting", s.Open = "open", s.Closing = "closing", s.Closed = "closed";
})(ee || (ee = {}));
class xn {
  constructor() {
    this.HEADER_LENGTH = 1;
  }
  decode(e, t) {
    return e.constructor === ArrayBuffer ? t(this._binaryDecode(e)) : t(typeof e == "string" ? JSON.parse(e) : {});
  }
  _binaryDecode(e) {
    const t = new DataView(e), r = new TextDecoder();
    return this._decodeBroadcast(e, t, r);
  }
  _decodeBroadcast(e, t, r) {
    const n = t.getUint8(1), i = t.getUint8(2);
    let o = this.HEADER_LENGTH + 2;
    const a = r.decode(e.slice(o, o + n));
    o = o + n;
    const c = r.decode(e.slice(o, o + i));
    o = o + i;
    const l = JSON.parse(r.decode(e.slice(o, e.byteLength)));
    return { ref: null, topic: a, event: c, payload: l };
  }
}
class Nr {
  constructor(e, t) {
    this.callback = e, this.timerCalc = t, this.timer = void 0, this.tries = 0, this.callback = e, this.timerCalc = t;
  }
  reset() {
    this.tries = 0, clearTimeout(this.timer);
  }
  // Cancels any previous scheduleTimeout and schedules callback
  scheduleTimeout() {
    clearTimeout(this.timer), this.timer = setTimeout(() => {
      this.tries = this.tries + 1, this.callback();
    }, this.timerCalc(this.tries + 1));
  }
}
var S;
(function(s) {
  s.abstime = "abstime", s.bool = "bool", s.date = "date", s.daterange = "daterange", s.float4 = "float4", s.float8 = "float8", s.int2 = "int2", s.int4 = "int4", s.int4range = "int4range", s.int8 = "int8", s.int8range = "int8range", s.json = "json", s.jsonb = "jsonb", s.money = "money", s.numeric = "numeric", s.oid = "oid", s.reltime = "reltime", s.text = "text", s.time = "time", s.timestamp = "timestamp", s.timestamptz = "timestamptz", s.timetz = "timetz", s.tsrange = "tsrange", s.tstzrange = "tstzrange";
})(S || (S = {}));
const Nt = (s, e, t = {}) => {
  var r;
  const n = (r = t.skipTypes) !== null && r !== void 0 ? r : [];
  return Object.keys(e).reduce((i, o) => (i[o] = Rn(o, s, e, n), i), {});
}, Rn = (s, e, t, r) => {
  const n = e.find((a) => a.name === s), i = n == null ? void 0 : n.type, o = t[s];
  return i && !r.includes(i) ? Fr(i, o) : yt(o);
}, Fr = (s, e) => {
  if (s.charAt(0) === "_") {
    const t = s.slice(1, s.length);
    return Dn(e, t);
  }
  switch (s) {
    case S.bool:
      return In(e);
    case S.float4:
    case S.float8:
    case S.int2:
    case S.int4:
    case S.int8:
    case S.numeric:
    case S.oid:
      return Ln(e);
    case S.json:
    case S.jsonb:
      return Un(e);
    case S.timestamp:
      return Bn(e);
    case S.abstime:
    case S.date:
    case S.daterange:
    case S.int4range:
    case S.int8range:
    case S.money:
    case S.reltime:
    case S.text:
    case S.time:
    case S.timestamptz:
    case S.timetz:
    case S.tsrange:
    case S.tstzrange:
      return yt(e);
    default:
      return yt(e);
  }
}, yt = (s) => s, In = (s) => {
  switch (s) {
    case "t":
      return !0;
    case "f":
      return !1;
    default:
      return s;
  }
}, Ln = (s) => {
  if (typeof s == "string") {
    const e = parseFloat(s);
    if (!Number.isNaN(e))
      return e;
  }
  return s;
}, Un = (s) => {
  if (typeof s == "string")
    try {
      return JSON.parse(s);
    } catch (e) {
      return console.log(`JSON parse error: ${e}`), s;
    }
  return s;
}, Dn = (s, e) => {
  if (typeof s != "string")
    return s;
  const t = s.length - 1, r = s[t];
  if (s[0] === "{" && r === "}") {
    let i;
    const o = s.slice(1, t);
    try {
      i = JSON.parse("[" + o + "]");
    } catch {
      i = o ? o.split(",") : [];
    }
    return i.map((a) => Fr(e, a));
  }
  return s;
}, Bn = (s) => typeof s == "string" ? s.replace(" ", "T") : s, zr = (s) => {
  let e = s;
  return e = e.replace(/^ws/i, "http"), e = e.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, ""), e.replace(/\/+$/, "");
};
class Ze {
  /**
   * Initializes the Push
   *
   * @param channel The Channel
   * @param event The event, for example `"phx_join"`
   * @param payload The payload, for example `{user_id: 123}`
   * @param timeout The push timeout in milliseconds
   */
  constructor(e, t, r = {}, n = Mr) {
    this.channel = e, this.event = t, this.payload = r, this.timeout = n, this.sent = !1, this.timeoutTimer = void 0, this.ref = "", this.receivedResp = null, this.recHooks = [], this.refEvent = null;
  }
  resend(e) {
    this.timeout = e, this._cancelRefEvent(), this.ref = "", this.refEvent = null, this.receivedResp = null, this.sent = !1, this.send();
  }
  send() {
    this._hasReceived("timeout") || (this.startTimeout(), this.sent = !0, this.channel.socket.push({
      topic: this.channel.topic,
      event: this.event,
      payload: this.payload,
      ref: this.ref,
      join_ref: this.channel._joinRef()
    }));
  }
  updatePayload(e) {
    this.payload = Object.assign(Object.assign({}, this.payload), e);
  }
  receive(e, t) {
    var r;
    return this._hasReceived(e) && t((r = this.receivedResp) === null || r === void 0 ? void 0 : r.response), this.recHooks.push({ status: e, callback: t }), this;
  }
  startTimeout() {
    if (this.timeoutTimer)
      return;
    this.ref = this.channel.socket._makeRef(), this.refEvent = this.channel._replyEventName(this.ref);
    const e = (t) => {
      this._cancelRefEvent(), this._cancelTimeout(), this.receivedResp = t, this._matchReceive(t);
    };
    this.channel._on(this.refEvent, {}, e), this.timeoutTimer = setTimeout(() => {
      this.trigger("timeout", {});
    }, this.timeout);
  }
  trigger(e, t) {
    this.refEvent && this.channel._trigger(this.refEvent, { status: e, response: t });
  }
  destroy() {
    this._cancelRefEvent(), this._cancelTimeout();
  }
  _cancelRefEvent() {
    this.refEvent && this.channel._off(this.refEvent, {});
  }
  _cancelTimeout() {
    clearTimeout(this.timeoutTimer), this.timeoutTimer = void 0;
  }
  _matchReceive({ status: e, response: t }) {
    this.recHooks.filter((r) => r.status === e).forEach((r) => r.callback(t));
  }
  _hasReceived(e) {
    return this.receivedResp && this.receivedResp.status === e;
  }
}
var Ft;
(function(s) {
  s.SYNC = "sync", s.JOIN = "join", s.LEAVE = "leave";
})(Ft || (Ft = {}));
class be {
  /**
   * Initializes the Presence.
   *
   * @param channel - The RealtimeChannel
   * @param opts - The options,
   *        for example `{events: {state: 'state', diff: 'diff'}}`
   */
  constructor(e, t) {
    this.channel = e, this.state = {}, this.pendingDiffs = [], this.joinRef = null, this.caller = {
      onJoin: () => {
      },
      onLeave: () => {
      },
      onSync: () => {
      }
    };
    const r = (t == null ? void 0 : t.events) || {
      state: "presence_state",
      diff: "presence_diff"
    };
    this.channel._on(r.state, {}, (n) => {
      const { onJoin: i, onLeave: o, onSync: a } = this.caller;
      this.joinRef = this.channel._joinRef(), this.state = be.syncState(this.state, n, i, o), this.pendingDiffs.forEach((c) => {
        this.state = be.syncDiff(this.state, c, i, o);
      }), this.pendingDiffs = [], a();
    }), this.channel._on(r.diff, {}, (n) => {
      const { onJoin: i, onLeave: o, onSync: a } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(n) : (this.state = be.syncDiff(this.state, n, i, o), a());
    }), this.onJoin((n, i, o) => {
      this.channel._trigger("presence", {
        event: "join",
        key: n,
        currentPresences: i,
        newPresences: o
      });
    }), this.onLeave((n, i, o) => {
      this.channel._trigger("presence", {
        event: "leave",
        key: n,
        currentPresences: i,
        leftPresences: o
      });
    }), this.onSync(() => {
      this.channel._trigger("presence", { event: "sync" });
    });
  }
  /**
   * Used to sync the list of presences on the server with the
   * client's state.
   *
   * An optional `onJoin` and `onLeave` callback can be provided to
   * react to changes in the client's local presences across
   * disconnects and reconnects with the server.
   *
   * @internal
   */
  static syncState(e, t, r, n) {
    const i = this.cloneDeep(e), o = this.transformState(t), a = {}, c = {};
    return this.map(i, (l, u) => {
      o[l] || (c[l] = u);
    }), this.map(o, (l, u) => {
      const d = i[l];
      if (d) {
        const h = u.map((p) => p.presence_ref), f = d.map((p) => p.presence_ref), g = u.filter((p) => f.indexOf(p.presence_ref) < 0), m = d.filter((p) => h.indexOf(p.presence_ref) < 0);
        g.length > 0 && (a[l] = g), m.length > 0 && (c[l] = m);
      } else
        a[l] = u;
    }), this.syncDiff(i, { joins: a, leaves: c }, r, n);
  }
  /**
   * Used to sync a diff of presence join and leave events from the
   * server, as they happen.
   *
   * Like `syncState`, `syncDiff` accepts optional `onJoin` and
   * `onLeave` callbacks to react to a user joining or leaving from a
   * device.
   *
   * @internal
   */
  static syncDiff(e, t, r, n) {
    const { joins: i, leaves: o } = {
      joins: this.transformState(t.joins),
      leaves: this.transformState(t.leaves)
    };
    return r || (r = () => {
    }), n || (n = () => {
    }), this.map(i, (a, c) => {
      var l;
      const u = (l = e[a]) !== null && l !== void 0 ? l : [];
      if (e[a] = this.cloneDeep(c), u.length > 0) {
        const d = e[a].map((f) => f.presence_ref), h = u.filter((f) => d.indexOf(f.presence_ref) < 0);
        e[a].unshift(...h);
      }
      r(a, u, c);
    }), this.map(o, (a, c) => {
      let l = e[a];
      if (!l)
        return;
      const u = c.map((d) => d.presence_ref);
      l = l.filter((d) => u.indexOf(d.presence_ref) < 0), e[a] = l, n(a, l, c), l.length === 0 && delete e[a];
    }), e;
  }
  /** @internal */
  static map(e, t) {
    return Object.getOwnPropertyNames(e).map((r) => t(r, e[r]));
  }
  /**
   * Remove 'metas' key
   * Change 'phx_ref' to 'presence_ref'
   * Remove 'phx_ref' and 'phx_ref_prev'
   *
   * @example
   * // returns {
   *  abc123: [
   *    { presence_ref: '2', user_id: 1 },
   *    { presence_ref: '3', user_id: 2 }
   *  ]
   * }
   * RealtimePresence.transformState({
   *  abc123: {
   *    metas: [
   *      { phx_ref: '2', phx_ref_prev: '1' user_id: 1 },
   *      { phx_ref: '3', user_id: 2 }
   *    ]
   *  }
   * })
   *
   * @internal
   */
  static transformState(e) {
    return e = this.cloneDeep(e), Object.getOwnPropertyNames(e).reduce((t, r) => {
      const n = e[r];
      return "metas" in n ? t[r] = n.metas.map((i) => (i.presence_ref = i.phx_ref, delete i.phx_ref, delete i.phx_ref_prev, i)) : t[r] = n, t;
    }, {});
  }
  /** @internal */
  static cloneDeep(e) {
    return JSON.parse(JSON.stringify(e));
  }
  /** @internal */
  onJoin(e) {
    this.caller.onJoin = e;
  }
  /** @internal */
  onLeave(e) {
    this.caller.onLeave = e;
  }
  /** @internal */
  onSync(e) {
    this.caller.onSync = e;
  }
  /** @internal */
  inPendingSyncState() {
    return !this.joinRef || this.joinRef !== this.channel._joinRef();
  }
}
var zt;
(function(s) {
  s.ALL = "*", s.INSERT = "INSERT", s.UPDATE = "UPDATE", s.DELETE = "DELETE";
})(zt || (zt = {}));
var Wt;
(function(s) {
  s.BROADCAST = "broadcast", s.PRESENCE = "presence", s.POSTGRES_CHANGES = "postgres_changes", s.SYSTEM = "system";
})(Wt || (Wt = {}));
var z;
(function(s) {
  s.SUBSCRIBED = "SUBSCRIBED", s.TIMED_OUT = "TIMED_OUT", s.CLOSED = "CLOSED", s.CHANNEL_ERROR = "CHANNEL_ERROR";
})(z || (z = {}));
class xt {
  constructor(e, t = { config: {} }, r) {
    this.topic = e, this.params = t, this.socket = r, this.bindings = {}, this.state = C.closed, this.joinedOnce = !1, this.pushBuffer = [], this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "" },
      private: !1
    }, t.config), this.timeout = this.socket.timeout, this.joinPush = new Ze(this, U.join, this.params, this.timeout), this.rejoinTimer = new Nr(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs), this.joinPush.receive("ok", () => {
      this.state = C.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((n) => n.send()), this.pushBuffer = [];
    }), this._onClose(() => {
      this.rejoinTimer.reset(), this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`), this.state = C.closed, this.socket._remove(this);
    }), this._onError((n) => {
      this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, n), this.state = C.errored, this.rejoinTimer.scheduleTimeout());
    }), this.joinPush.receive("timeout", () => {
      this._isJoining() && (this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), this.state = C.errored, this.rejoinTimer.scheduleTimeout());
    }), this._on(U.reply, {}, (n, i) => {
      this._trigger(this._replyEventName(i), n);
    }), this.presence = new be(this), this.broadcastEndpointURL = zr(this.socket.endPoint) + "/api/broadcast", this.private = this.params.config.private || !1;
  }
  /** Subscribe registers your client with the server */
  subscribe(e, t = this.timeout) {
    var r, n;
    if (this.socket.isConnected() || this.socket.connect(), this.joinedOnce)
      throw "tried to subscribe multiple times. 'subscribe' can only be called a single time per channel instance";
    {
      const { config: { broadcast: i, presence: o, private: a } } = this.params;
      this._onError((u) => e == null ? void 0 : e(z.CHANNEL_ERROR, u)), this._onClose(() => e == null ? void 0 : e(z.CLOSED));
      const c = {}, l = {
        broadcast: i,
        presence: o,
        postgres_changes: (n = (r = this.bindings.postgres_changes) === null || r === void 0 ? void 0 : r.map((u) => u.filter)) !== null && n !== void 0 ? n : [],
        private: a
      };
      this.socket.accessTokenValue && (c.access_token = this.socket.accessTokenValue), this.updateJoinPayload(Object.assign({ config: l }, c)), this.joinedOnce = !0, this._rejoin(t), this.joinPush.receive("ok", async ({ postgres_changes: u }) => {
        var d;
        if (this.socket.setAuth(), u === void 0) {
          e == null || e(z.SUBSCRIBED);
          return;
        } else {
          const h = this.bindings.postgres_changes, f = (d = h == null ? void 0 : h.length) !== null && d !== void 0 ? d : 0, g = [];
          for (let m = 0; m < f; m++) {
            const p = h[m], { filter: { event: w, schema: k, table: y, filter: b } } = p, O = u && u[m];
            if (O && O.event === w && O.schema === k && O.table === y && O.filter === b)
              g.push(Object.assign(Object.assign({}, p), { id: O.id }));
            else {
              this.unsubscribe(), this.state = C.errored, e == null || e(z.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
              return;
            }
          }
          this.bindings.postgres_changes = g, e && e(z.SUBSCRIBED);
          return;
        }
      }).receive("error", (u) => {
        this.state = C.errored, e == null || e(z.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(u).join(", ") || "error")));
      }).receive("timeout", () => {
        e == null || e(z.TIMED_OUT);
      });
    }
    return this;
  }
  presenceState() {
    return this.presence.state;
  }
  async track(e, t = {}) {
    return await this.send({
      type: "presence",
      event: "track",
      payload: e
    }, t.timeout || this.timeout);
  }
  async untrack(e = {}) {
    return await this.send({
      type: "presence",
      event: "untrack"
    }, e);
  }
  on(e, t, r) {
    return this._on(e, t, r);
  }
  /**
   * Sends a message into the channel.
   *
   * @param args Arguments to send to channel
   * @param args.type The type of event to send
   * @param args.event The name of the event being sent
   * @param args.payload Payload to be sent
   * @param opts Options to be used during the send process
   */
  async send(e, t = {}) {
    var r, n;
    if (!this._canPush() && e.type === "broadcast") {
      const { event: i, payload: o } = e, c = {
        method: "POST",
        headers: {
          Authorization: this.socket.accessTokenValue ? `Bearer ${this.socket.accessTokenValue}` : "",
          apikey: this.socket.apiKey ? this.socket.apiKey : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              topic: this.subTopic,
              event: i,
              payload: o,
              private: this.private
            }
          ]
        })
      };
      try {
        const l = await this._fetchWithTimeout(this.broadcastEndpointURL, c, (r = t.timeout) !== null && r !== void 0 ? r : this.timeout);
        return await ((n = l.body) === null || n === void 0 ? void 0 : n.cancel()), l.ok ? "ok" : "error";
      } catch (l) {
        return l.name === "AbortError" ? "timed out" : "error";
      }
    } else
      return new Promise((i) => {
        var o, a, c;
        const l = this._push(e.type, e, t.timeout || this.timeout);
        e.type === "broadcast" && !(!((c = (a = (o = this.params) === null || o === void 0 ? void 0 : o.config) === null || a === void 0 ? void 0 : a.broadcast) === null || c === void 0) && c.ack) && i("ok"), l.receive("ok", () => i("ok")), l.receive("error", () => i("error")), l.receive("timeout", () => i("timed out"));
      });
  }
  updateJoinPayload(e) {
    this.joinPush.updatePayload(e);
  }
  /**
   * Leaves the channel.
   *
   * Unsubscribes from server events, and instructs channel to terminate on server.
   * Triggers onClose() hooks.
   *
   * To receive leave acknowledgements, use the a `receive` hook to bind to the server ack, ie:
   * channel.unsubscribe().receive("ok", () => alert("left!") )
   */
  unsubscribe(e = this.timeout) {
    this.state = C.leaving;
    const t = () => {
      this.socket.log("channel", `leave ${this.topic}`), this._trigger(U.close, "leave", this._joinRef());
    };
    return this.joinPush.destroy(), new Promise((r) => {
      const n = new Ze(this, U.leave, {}, e);
      n.receive("ok", () => {
        t(), r("ok");
      }).receive("timeout", () => {
        t(), r("timed out");
      }).receive("error", () => {
        r("error");
      }), n.send(), this._canPush() || n.trigger("ok", {});
    });
  }
  /**
   * Teardown the channel.
   *
   * Destroys and stops related timers.
   */
  teardown() {
    this.pushBuffer.forEach((e) => e.destroy()), this.rejoinTimer && clearTimeout(this.rejoinTimer.timer), this.joinPush.destroy();
  }
  /** @internal */
  async _fetchWithTimeout(e, t, r) {
    const n = new AbortController(), i = setTimeout(() => n.abort(), r), o = await this.socket.fetch(e, Object.assign(Object.assign({}, t), { signal: n.signal }));
    return clearTimeout(i), o;
  }
  /** @internal */
  _push(e, t, r = this.timeout) {
    if (!this.joinedOnce)
      throw `tried to push '${e}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
    let n = new Ze(this, e, t, r);
    return this._canPush() ? n.send() : (n.startTimeout(), this.pushBuffer.push(n)), n;
  }
  /**
   * Overridable message hook
   *
   * Receives all events for specialized message handling before dispatching to the channel callbacks.
   * Must return the payload, modified or unmodified.
   *
   * @internal
   */
  _onMessage(e, t, r) {
    return t;
  }
  /** @internal */
  _isMember(e) {
    return this.topic === e;
  }
  /** @internal */
  _joinRef() {
    return this.joinPush.ref;
  }
  /** @internal */
  _trigger(e, t, r) {
    var n, i;
    const o = e.toLocaleLowerCase(), { close: a, error: c, leave: l, join: u } = U;
    if (r && [a, c, l, u].indexOf(o) >= 0 && r !== this._joinRef())
      return;
    let h = this._onMessage(o, t, r);
    if (t && !h)
      throw "channel onMessage callbacks must return the payload, modified or unmodified";
    ["insert", "update", "delete"].includes(o) ? (n = this.bindings.postgres_changes) === null || n === void 0 || n.filter((f) => {
      var g, m, p;
      return ((g = f.filter) === null || g === void 0 ? void 0 : g.event) === "*" || ((p = (m = f.filter) === null || m === void 0 ? void 0 : m.event) === null || p === void 0 ? void 0 : p.toLocaleLowerCase()) === o;
    }).map((f) => f.callback(h, r)) : (i = this.bindings[o]) === null || i === void 0 || i.filter((f) => {
      var g, m, p, w, k, y;
      if (["broadcast", "presence", "postgres_changes"].includes(o))
        if ("id" in f) {
          const b = f.id, O = (g = f.filter) === null || g === void 0 ? void 0 : g.event;
          return b && ((m = t.ids) === null || m === void 0 ? void 0 : m.includes(b)) && (O === "*" || (O == null ? void 0 : O.toLocaleLowerCase()) === ((p = t.data) === null || p === void 0 ? void 0 : p.type.toLocaleLowerCase()));
        } else {
          const b = (k = (w = f == null ? void 0 : f.filter) === null || w === void 0 ? void 0 : w.event) === null || k === void 0 ? void 0 : k.toLocaleLowerCase();
          return b === "*" || b === ((y = t == null ? void 0 : t.event) === null || y === void 0 ? void 0 : y.toLocaleLowerCase());
        }
      else
        return f.type.toLocaleLowerCase() === o;
    }).map((f) => {
      if (typeof h == "object" && "ids" in h) {
        const g = h.data, { schema: m, table: p, commit_timestamp: w, type: k, errors: y } = g;
        h = Object.assign(Object.assign({}, {
          schema: m,
          table: p,
          commit_timestamp: w,
          eventType: k,
          new: {},
          old: {},
          errors: y
        }), this._getPayloadRecords(g));
      }
      f.callback(h, r);
    });
  }
  /** @internal */
  _isClosed() {
    return this.state === C.closed;
  }
  /** @internal */
  _isJoined() {
    return this.state === C.joined;
  }
  /** @internal */
  _isJoining() {
    return this.state === C.joining;
  }
  /** @internal */
  _isLeaving() {
    return this.state === C.leaving;
  }
  /** @internal */
  _replyEventName(e) {
    return `chan_reply_${e}`;
  }
  /** @internal */
  _on(e, t, r) {
    const n = e.toLocaleLowerCase(), i = {
      type: n,
      filter: t,
      callback: r
    };
    return this.bindings[n] ? this.bindings[n].push(i) : this.bindings[n] = [i], this;
  }
  /** @internal */
  _off(e, t) {
    const r = e.toLocaleLowerCase();
    return this.bindings[r] = this.bindings[r].filter((n) => {
      var i;
      return !(((i = n.type) === null || i === void 0 ? void 0 : i.toLocaleLowerCase()) === r && xt.isEqual(n.filter, t));
    }), this;
  }
  /** @internal */
  static isEqual(e, t) {
    if (Object.keys(e).length !== Object.keys(t).length)
      return !1;
    for (const r in e)
      if (e[r] !== t[r])
        return !1;
    return !0;
  }
  /** @internal */
  _rejoinUntilConnected() {
    this.rejoinTimer.scheduleTimeout(), this.socket.isConnected() && this._rejoin();
  }
  /**
   * Registers a callback that will be executed when the channel closes.
   *
   * @internal
   */
  _onClose(e) {
    this._on(U.close, {}, e);
  }
  /**
   * Registers a callback that will be executed when the channel encounteres an error.
   *
   * @internal
   */
  _onError(e) {
    this._on(U.error, {}, (t) => e(t));
  }
  /**
   * Returns `true` if the socket is connected and the channel has been joined.
   *
   * @internal
   */
  _canPush() {
    return this.socket.isConnected() && this._isJoined();
  }
  /** @internal */
  _rejoin(e = this.timeout) {
    this._isLeaving() || (this.socket._leaveOpenTopic(this.topic), this.state = C.joining, this.joinPush.resend(e));
  }
  /** @internal */
  _getPayloadRecords(e) {
    const t = {
      new: {},
      old: {}
    };
    return (e.type === "INSERT" || e.type === "UPDATE") && (t.new = Nt(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (t.old = Nt(e.columns, e.old_record)), t;
  }
}
const Gt = () => {
}, qn = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
class Mn {
  /**
   * Initializes the Socket.
   *
   * @param endPoint The string WebSocket endpoint, ie, "ws://example.com/socket", "wss://example.com", "/socket" (inherited host & protocol)
   * @param httpEndpoint The string HTTP endpoint, ie, "https://example.com", "/" (inherited host & protocol)
   * @param options.transport The Websocket Transport, for example WebSocket. This can be a custom implementation
   * @param options.timeout The default timeout in milliseconds to trigger push timeouts.
   * @param options.params The optional params to pass when connecting.
   * @param options.headers The optional headers to pass when connecting.
   * @param options.heartbeatIntervalMs The millisec interval to send a heartbeat message.
   * @param options.logger The optional function for specialized logging, ie: logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
   * @param options.logLevel Sets the log level for Realtime
   * @param options.encode The function to encode outgoing messages. Defaults to JSON: (payload, callback) => callback(JSON.stringify(payload))
   * @param options.decode The function to decode incoming messages. Defaults to Serializer's decode.
   * @param options.reconnectAfterMs he optional function that returns the millsec reconnect interval. Defaults to stepped backoff off.
   * @param options.worker Use Web Worker to set a side flow. Defaults to false.
   * @param options.workerUrl The URL of the worker script. Defaults to https://realtime.supabase.com/worker.js that includes a heartbeat event call to keep the connection alive.
   */
  constructor(e, t) {
    var r;
    this.accessTokenValue = null, this.apiKey = null, this.channels = new Array(), this.endPoint = "", this.httpEndpoint = "", this.headers = $n, this.params = {}, this.timeout = Mr, this.heartbeatIntervalMs = 25e3, this.heartbeatTimer = void 0, this.pendingHeartbeatRef = null, this.heartbeatCallback = Gt, this.ref = 0, this.logger = Gt, this.conn = null, this.sendBuffer = [], this.serializer = new xn(), this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    }, this.accessToken = null, this._resolveFetch = (i) => {
      let o;
      return i ? o = i : typeof fetch > "u" ? o = (...a) => Promise.resolve().then(() => me).then(({ default: c }) => c(...a)) : o = fetch, (...a) => o(...a);
    }, this.endPoint = `${e}/${mt.websocket}`, this.httpEndpoint = zr(e), t != null && t.transport ? this.transport = t.transport : this.transport = null, t != null && t.params && (this.params = t.params), t != null && t.headers && (this.headers = Object.assign(Object.assign({}, this.headers), t.headers)), t != null && t.timeout && (this.timeout = t.timeout), t != null && t.logger && (this.logger = t.logger), (t != null && t.logLevel || t != null && t.log_level) && (this.logLevel = t.logLevel || t.log_level, this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel })), t != null && t.heartbeatIntervalMs && (this.heartbeatIntervalMs = t.heartbeatIntervalMs);
    const n = (r = t == null ? void 0 : t.params) === null || r === void 0 ? void 0 : r.apikey;
    if (n && (this.accessTokenValue = n, this.apiKey = n), this.reconnectAfterMs = t != null && t.reconnectAfterMs ? t.reconnectAfterMs : (i) => [1e3, 2e3, 5e3, 1e4][i - 1] || 1e4, this.encode = t != null && t.encode ? t.encode : (i, o) => o(JSON.stringify(i)), this.decode = t != null && t.decode ? t.decode : this.serializer.decode.bind(this.serializer), this.reconnectTimer = new Nr(async () => {
      this.disconnect(), this.connect();
    }, this.reconnectAfterMs), this.fetch = this._resolveFetch(t == null ? void 0 : t.fetch), t != null && t.worker) {
      if (typeof window < "u" && !window.Worker)
        throw new Error("Web Worker is not supported");
      this.worker = (t == null ? void 0 : t.worker) || !1, this.workerUrl = t == null ? void 0 : t.workerUrl;
    }
    this.accessToken = (t == null ? void 0 : t.accessToken) || null;
  }
  /**
   * Connects the socket, unless already connected.
   */
  connect() {
    if (!this.conn) {
      if (this.transport || (this.transport = Cn), this.transport) {
        typeof window < "u" && this.transport === window.WebSocket ? this.conn = new this.transport(this.endpointURL()) : this.conn = new this.transport(this.endpointURL(), void 0, {
          headers: this.headers
        }), this.setupConnection();
        return;
      }
      this.conn = new Nn(this.endpointURL(), void 0, {
        close: () => {
          this.conn = null;
        }
      });
    }
  }
  /**
   * Returns the URL of the websocket.
   * @returns string The URL of the websocket.
   */
  endpointURL() {
    return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: Pn }));
  }
  /**
   * Disconnects the socket.
   *
   * @param code A numeric status code to send on disconnect.
   * @param reason A custom reason for the disconnect.
   */
  disconnect(e, t) {
    this.conn && (this.conn.onclose = function() {
    }, e ? this.conn.close(e, t ?? "") : this.conn.close(), this.conn = null, this.heartbeatTimer && clearInterval(this.heartbeatTimer), this.reconnectTimer.reset(), this.channels.forEach((r) => r.teardown()));
  }
  /**
   * Returns all created channels
   */
  getChannels() {
    return this.channels;
  }
  /**
   * Unsubscribes and removes a single channel
   * @param channel A RealtimeChannel instance
   */
  async removeChannel(e) {
    const t = await e.unsubscribe();
    return this.channels = this.channels.filter((r) => r._joinRef !== e._joinRef), this.channels.length === 0 && this.disconnect(), t;
  }
  /**
   * Unsubscribes and removes all channels
   */
  async removeAllChannels() {
    const e = await Promise.all(this.channels.map((t) => t.unsubscribe()));
    return this.channels = [], this.disconnect(), e;
  }
  /**
   * Logs the message.
   *
   * For customized logging, `this.logger` can be overridden.
   */
  log(e, t, r) {
    this.logger(e, t, r);
  }
  /**
   * Returns the current state of the socket.
   */
  connectionState() {
    switch (this.conn && this.conn.readyState) {
      case de.connecting:
        return ee.Connecting;
      case de.open:
        return ee.Open;
      case de.closing:
        return ee.Closing;
      default:
        return ee.Closed;
    }
  }
  /**
   * Returns `true` is the connection is open.
   */
  isConnected() {
    return this.connectionState() === ee.Open;
  }
  channel(e, t = { config: {} }) {
    const r = `realtime:${e}`, n = this.getChannels().find((i) => i.topic === r);
    if (n)
      return n;
    {
      const i = new xt(`realtime:${e}`, t, this);
      return this.channels.push(i), i;
    }
  }
  /**
   * Push out a message if the socket is connected.
   *
   * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
   */
  push(e) {
    const { topic: t, event: r, payload: n, ref: i } = e, o = () => {
      this.encode(e, (a) => {
        var c;
        (c = this.conn) === null || c === void 0 || c.send(a);
      });
    };
    this.log("push", `${t} ${r} (${i})`, n), this.isConnected() ? o() : this.sendBuffer.push(o);
  }
  /**
   * Sets the JWT access token used for channel subscription authorization and Realtime RLS.
   *
   * If param is null it will use the `accessToken` callback function or the token set on the client.
   *
   * On callback used, it will set the value of the token internal to the client.
   *
   * @param token A JWT string to override the token set on the client.
   */
  async setAuth(e = null) {
    let t = e || this.accessToken && await this.accessToken() || this.accessTokenValue;
    this.accessTokenValue != t && (this.accessTokenValue = t, this.channels.forEach((r) => {
      t && r.updateJoinPayload({
        access_token: t,
        version: this.headers && this.headers["X-Client-Info"]
      }), r.joinedOnce && r._isJoined() && r._push(U.access_token, {
        access_token: t
      });
    }));
  }
  /**
   * Sends a heartbeat message if the socket is connected.
   */
  async sendHeartbeat() {
    var e;
    if (!this.isConnected()) {
      this.heartbeatCallback("disconnected");
      return;
    }
    if (this.pendingHeartbeatRef) {
      this.pendingHeartbeatRef = null, this.log("transport", "heartbeat timeout. Attempting to re-establish connection"), this.heartbeatCallback("timeout"), (e = this.conn) === null || e === void 0 || e.close(jn, "hearbeat timeout");
      return;
    }
    this.pendingHeartbeatRef = this._makeRef(), this.push({
      topic: "phoenix",
      event: "heartbeat",
      payload: {},
      ref: this.pendingHeartbeatRef
    }), this.heartbeatCallback("sent"), await this.setAuth();
  }
  onHeartbeat(e) {
    this.heartbeatCallback = e;
  }
  /**
   * Flushes send buffer
   */
  flushSendBuffer() {
    this.isConnected() && this.sendBuffer.length > 0 && (this.sendBuffer.forEach((e) => e()), this.sendBuffer = []);
  }
  /**
   * Return the next message ref, accounting for overflows
   *
   * @internal
   */
  _makeRef() {
    let e = this.ref + 1;
    return e === this.ref ? this.ref = 0 : this.ref = e, this.ref.toString();
  }
  /**
   * Unsubscribe from channels with the specified topic.
   *
   * @internal
   */
  _leaveOpenTopic(e) {
    let t = this.channels.find((r) => r.topic === e && (r._isJoined() || r._isJoining()));
    t && (this.log("transport", `leaving duplicate topic "${e}"`), t.unsubscribe());
  }
  /**
   * Removes a subscription from the socket.
   *
   * @param channel An open subscription.
   *
   * @internal
   */
  _remove(e) {
    this.channels = this.channels.filter((t) => t.topic !== e.topic);
  }
  /**
   * Sets up connection handlers.
   *
   * @internal
   */
  setupConnection() {
    this.conn && (this.conn.binaryType = "arraybuffer", this.conn.onopen = () => this._onConnOpen(), this.conn.onerror = (e) => this._onConnError(e), this.conn.onmessage = (e) => this._onConnMessage(e), this.conn.onclose = (e) => this._onConnClose(e));
  }
  /** @internal */
  _onConnMessage(e) {
    this.decode(e.data, (t) => {
      let { topic: r, event: n, payload: i, ref: o } = t;
      r === "phoenix" && n === "phx_reply" && this.heartbeatCallback(t.payload.status == "ok" ? "ok" : "error"), o && o === this.pendingHeartbeatRef && (this.pendingHeartbeatRef = null), this.log("receive", `${i.status || ""} ${r} ${n} ${o && "(" + o + ")" || ""}`, i), Array.from(this.channels).filter((a) => a._isMember(r)).forEach((a) => a._trigger(n, i, o)), this.stateChangeCallbacks.message.forEach((a) => a(t));
    });
  }
  /** @internal */
  _onConnOpen() {
    if (this.log("transport", `connected to ${this.endpointURL()}`), this.flushSendBuffer(), this.reconnectTimer.reset(), !this.worker)
      this.heartbeatTimer && clearInterval(this.heartbeatTimer), this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.heartbeatIntervalMs);
    else {
      this.workerUrl ? this.log("worker", `starting worker for from ${this.workerUrl}`) : this.log("worker", "starting default worker");
      const e = this._workerObjectUrl(this.workerUrl);
      this.workerRef = new Worker(e), this.workerRef.onerror = (t) => {
        this.log("worker", "worker error", t.message), this.workerRef.terminate();
      }, this.workerRef.onmessage = (t) => {
        t.data.event === "keepAlive" && this.sendHeartbeat();
      }, this.workerRef.postMessage({
        event: "start",
        interval: this.heartbeatIntervalMs
      });
    }
    this.stateChangeCallbacks.open.forEach((e) => e());
  }
  /** @internal */
  _onConnClose(e) {
    this.log("transport", "close", e), this._triggerChanError(), this.heartbeatTimer && clearInterval(this.heartbeatTimer), this.reconnectTimer.scheduleTimeout(), this.stateChangeCallbacks.close.forEach((t) => t(e));
  }
  /** @internal */
  _onConnError(e) {
    this.log("transport", e.message), this._triggerChanError(), this.stateChangeCallbacks.error.forEach((t) => t(e));
  }
  /** @internal */
  _triggerChanError() {
    this.channels.forEach((e) => e._trigger(U.error));
  }
  /** @internal */
  _appendParams(e, t) {
    if (Object.keys(t).length === 0)
      return e;
    const r = e.match(/\?/) ? "&" : "?", n = new URLSearchParams(t);
    return `${e}${r}${n}`;
  }
  _workerObjectUrl(e) {
    let t;
    if (e)
      t = e;
    else {
      const r = new Blob([qn], { type: "application/javascript" });
      t = URL.createObjectURL(r);
    }
    return t;
  }
}
class Nn {
  constructor(e, t, r) {
    this.binaryType = "arraybuffer", this.onclose = () => {
    }, this.onerror = () => {
    }, this.onmessage = () => {
    }, this.onopen = () => {
    }, this.readyState = de.connecting, this.send = () => {
    }, this.url = null, this.url = e, this.close = r.close;
  }
}
class Rt extends Error {
  constructor(e) {
    super(e), this.__isStorageError = !0, this.name = "StorageError";
  }
}
function T(s) {
  return typeof s == "object" && s !== null && "__isStorageError" in s;
}
class Fn extends Rt {
  constructor(e, t) {
    super(e), this.name = "StorageApiError", this.status = t;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status
    };
  }
}
class wt extends Rt {
  constructor(e, t) {
    super(e), this.name = "StorageUnknownError", this.originalError = t;
  }
}
var zn = function(s, e, t, r) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? i(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
const Wr = (s) => {
  let e;
  return s ? e = s : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => me).then(({ default: r }) => r(...t)) : e = fetch, (...t) => e(...t);
}, Wn = () => zn(void 0, void 0, void 0, function* () {
  return typeof Response > "u" ? (yield Promise.resolve().then(() => me)).Response : Response;
}), vt = (s) => {
  if (Array.isArray(s))
    return s.map((t) => vt(t));
  if (typeof s == "function" || s !== Object(s))
    return s;
  const e = {};
  return Object.entries(s).forEach(([t, r]) => {
    const n = t.replace(/([-_][a-z])/gi, (i) => i.toUpperCase().replace(/[-_]/g, ""));
    e[n] = vt(r);
  }), e;
};
var re = function(s, e, t, r) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? i(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
const et = (s) => s.msg || s.message || s.error_description || s.error || JSON.stringify(s), Gn = (s, e, t) => re(void 0, void 0, void 0, function* () {
  const r = yield Wn();
  s instanceof r && !(t != null && t.noResolveJson) ? s.json().then((n) => {
    e(new Fn(et(n), s.status || 500));
  }).catch((n) => {
    e(new wt(et(n), n));
  }) : e(new wt(et(s), s));
}), Hn = (s, e, t, r) => {
  const n = { method: s, headers: (e == null ? void 0 : e.headers) || {} };
  return s === "GET" ? n : (n.headers = Object.assign({ "Content-Type": "application/json" }, e == null ? void 0 : e.headers), r && (n.body = JSON.stringify(r)), Object.assign(Object.assign({}, n), t));
};
function je(s, e, t, r, n, i) {
  return re(this, void 0, void 0, function* () {
    return new Promise((o, a) => {
      s(t, Hn(e, r, n, i)).then((c) => {
        if (!c.ok)
          throw c;
        return r != null && r.noResolveJson ? c : c.json();
      }).then((c) => o(c)).catch((c) => Gn(c, a, r));
    });
  });
}
function qe(s, e, t, r) {
  return re(this, void 0, void 0, function* () {
    return je(s, "GET", e, t, r);
  });
}
function G(s, e, t, r, n) {
  return re(this, void 0, void 0, function* () {
    return je(s, "POST", e, r, n, t);
  });
}
function Jn(s, e, t, r, n) {
  return re(this, void 0, void 0, function* () {
    return je(s, "PUT", e, r, n, t);
  });
}
function Kn(s, e, t, r) {
  return re(this, void 0, void 0, function* () {
    return je(s, "HEAD", e, Object.assign(Object.assign({}, t), { noResolveJson: !0 }), r);
  });
}
function Gr(s, e, t, r, n) {
  return re(this, void 0, void 0, function* () {
    return je(s, "DELETE", e, r, n, t);
  });
}
var P = function(s, e, t, r) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? i(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
const Vn = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
}, Ht = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: !1
};
class Qn {
  constructor(e, t = {}, r, n) {
    this.url = e, this.headers = t, this.bucketId = r, this.fetch = Wr(n);
  }
  /**
   * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
   *
   * @param method HTTP method.
   * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadOrUpdate(e, t, r, n) {
    return P(this, void 0, void 0, function* () {
      try {
        let i;
        const o = Object.assign(Object.assign({}, Ht), n);
        let a = Object.assign(Object.assign({}, this.headers), e === "POST" && { "x-upsert": String(o.upsert) });
        const c = o.metadata;
        typeof Blob < "u" && r instanceof Blob ? (i = new FormData(), i.append("cacheControl", o.cacheControl), c && i.append("metadata", this.encodeMetadata(c)), i.append("", r)) : typeof FormData < "u" && r instanceof FormData ? (i = r, i.append("cacheControl", o.cacheControl), c && i.append("metadata", this.encodeMetadata(c))) : (i = r, a["cache-control"] = `max-age=${o.cacheControl}`, a["content-type"] = o.contentType, c && (a["x-metadata"] = this.toBase64(this.encodeMetadata(c)))), n != null && n.headers && (a = Object.assign(Object.assign({}, a), n.headers));
        const l = this._removeEmptyFolders(t), u = this._getFinalPath(l), d = yield this.fetch(`${this.url}/object/${u}`, Object.assign({ method: e, body: i, headers: a }, o != null && o.duplex ? { duplex: o.duplex } : {})), h = yield d.json();
        return d.ok ? {
          data: { path: l, id: h.Id, fullPath: h.Key },
          error: null
        } : { data: null, error: h };
      } catch (i) {
        if (T(i))
          return { data: null, error: i };
        throw i;
      }
    });
  }
  /**
   * Uploads a file to an existing bucket.
   *
   * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  upload(e, t, r) {
    return P(this, void 0, void 0, function* () {
      return this.uploadOrUpdate("POST", e, t, r);
    });
  }
  /**
   * Upload a file with a token generated from `createSignedUploadUrl`.
   * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param token The token generated from `createSignedUploadUrl`
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadToSignedUrl(e, t, r, n) {
    return P(this, void 0, void 0, function* () {
      const i = this._removeEmptyFolders(e), o = this._getFinalPath(i), a = new URL(this.url + `/object/upload/sign/${o}`);
      a.searchParams.set("token", t);
      try {
        let c;
        const l = Object.assign({ upsert: Ht.upsert }, n), u = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(l.upsert) });
        typeof Blob < "u" && r instanceof Blob ? (c = new FormData(), c.append("cacheControl", l.cacheControl), c.append("", r)) : typeof FormData < "u" && r instanceof FormData ? (c = r, c.append("cacheControl", l.cacheControl)) : (c = r, u["cache-control"] = `max-age=${l.cacheControl}`, u["content-type"] = l.contentType);
        const d = yield this.fetch(a.toString(), {
          method: "PUT",
          body: c,
          headers: u
        }), h = yield d.json();
        return d.ok ? {
          data: { path: i, fullPath: h.Key },
          error: null
        } : { data: null, error: h };
      } catch (c) {
        if (T(c))
          return { data: null, error: c };
        throw c;
      }
    });
  }
  /**
   * Creates a signed upload URL.
   * Signed upload URLs can be used to upload files to the bucket without further authentication.
   * They are valid for 2 hours.
   * @param path The file path, including the current file name. For example `folder/image.png`.
   * @param options.upsert If set to true, allows the file to be overwritten if it already exists.
   */
  createSignedUploadUrl(e, t) {
    return P(this, void 0, void 0, function* () {
      try {
        let r = this._getFinalPath(e);
        const n = Object.assign({}, this.headers);
        t != null && t.upsert && (n["x-upsert"] = "true");
        const i = yield G(this.fetch, `${this.url}/object/upload/sign/${r}`, {}, { headers: n }), o = new URL(this.url + i.url), a = o.searchParams.get("token");
        if (!a)
          throw new Rt("No token returned by API");
        return { data: { signedUrl: o.toString(), path: e, token: a }, error: null };
      } catch (r) {
        if (T(r))
          return { data: null, error: r };
        throw r;
      }
    });
  }
  /**
   * Replaces an existing file at the specified path with a new one.
   *
   * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  update(e, t, r) {
    return P(this, void 0, void 0, function* () {
      return this.uploadOrUpdate("PUT", e, t, r);
    });
  }
  /**
   * Moves an existing file to a new path in the same bucket.
   *
   * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
   * @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
   * @param options The destination options.
   */
  move(e, t, r) {
    return P(this, void 0, void 0, function* () {
      try {
        return { data: yield G(this.fetch, `${this.url}/object/move`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: r == null ? void 0 : r.destinationBucket
        }, { headers: this.headers }), error: null };
      } catch (n) {
        if (T(n))
          return { data: null, error: n };
        throw n;
      }
    });
  }
  /**
   * Copies an existing file to a new path in the same bucket.
   *
   * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
   * @param toPath The new file path, including the new file name. For example `folder/image-copy.png`.
   * @param options The destination options.
   */
  copy(e, t, r) {
    return P(this, void 0, void 0, function* () {
      try {
        return { data: { path: (yield G(this.fetch, `${this.url}/object/copy`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: r == null ? void 0 : r.destinationBucket
        }, { headers: this.headers })).Key }, error: null };
      } catch (n) {
        if (T(n))
          return { data: null, error: n };
        throw n;
      }
    });
  }
  /**
   * Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.
   *
   * @param path The file path, including the current file name. For example `folder/image.png`.
   * @param expiresIn The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.
   * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
   * @param options.transform Transform the asset before serving it to the client.
   */
  createSignedUrl(e, t, r) {
    return P(this, void 0, void 0, function* () {
      try {
        let n = this._getFinalPath(e), i = yield G(this.fetch, `${this.url}/object/sign/${n}`, Object.assign({ expiresIn: t }, r != null && r.transform ? { transform: r.transform } : {}), { headers: this.headers });
        const o = r != null && r.download ? `&download=${r.download === !0 ? "" : r.download}` : "";
        return i = { signedUrl: encodeURI(`${this.url}${i.signedURL}${o}`) }, { data: i, error: null };
      } catch (n) {
        if (T(n))
          return { data: null, error: n };
        throw n;
      }
    });
  }
  /**
   * Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.
   *
   * @param paths The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.
   * @param expiresIn The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.
   * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
   */
  createSignedUrls(e, t, r) {
    return P(this, void 0, void 0, function* () {
      try {
        const n = yield G(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn: t, paths: e }, { headers: this.headers }), i = r != null && r.download ? `&download=${r.download === !0 ? "" : r.download}` : "";
        return {
          data: n.map((o) => Object.assign(Object.assign({}, o), { signedUrl: o.signedURL ? encodeURI(`${this.url}${o.signedURL}${i}`) : null })),
          error: null
        };
      } catch (n) {
        if (T(n))
          return { data: null, error: n };
        throw n;
      }
    });
  }
  /**
   * Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.
   *
   * @param path The full path and file name of the file to be downloaded. For example `folder/image.png`.
   * @param options.transform Transform the asset before serving it to the client.
   */
  download(e, t) {
    return P(this, void 0, void 0, function* () {
      const n = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image/authenticated" : "object", i = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {}), o = i ? `?${i}` : "";
      try {
        const a = this._getFinalPath(e);
        return { data: yield (yield qe(this.fetch, `${this.url}/${n}/${a}${o}`, {
          headers: this.headers,
          noResolveJson: !0
        })).blob(), error: null };
      } catch (a) {
        if (T(a))
          return { data: null, error: a };
        throw a;
      }
    });
  }
  /**
   * Retrieves the details of an existing file.
   * @param path
   */
  info(e) {
    return P(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        const r = yield qe(this.fetch, `${this.url}/object/info/${t}`, {
          headers: this.headers
        });
        return { data: vt(r), error: null };
      } catch (r) {
        if (T(r))
          return { data: null, error: r };
        throw r;
      }
    });
  }
  /**
   * Checks the existence of a file.
   * @param path
   */
  exists(e) {
    return P(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        return yield Kn(this.fetch, `${this.url}/object/${t}`, {
          headers: this.headers
        }), { data: !0, error: null };
      } catch (r) {
        if (T(r) && r instanceof wt) {
          const n = r.originalError;
          if ([400, 404].includes(n == null ? void 0 : n.status))
            return { data: !1, error: r };
        }
        throw r;
      }
    });
  }
  /**
   * A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.
   * This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.
   *
   * @param path The path and name of the file to generate the public URL for. For example `folder/image.png`.
   * @param options.download Triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
   * @param options.transform Transform the asset before serving it to the client.
   */
  getPublicUrl(e, t) {
    const r = this._getFinalPath(e), n = [], i = t != null && t.download ? `download=${t.download === !0 ? "" : t.download}` : "";
    i !== "" && n.push(i);
    const a = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image" : "object", c = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {});
    c !== "" && n.push(c);
    let l = n.join("&");
    return l !== "" && (l = `?${l}`), {
      data: { publicUrl: encodeURI(`${this.url}/${a}/public/${r}${l}`) }
    };
  }
  /**
   * Deletes files within the same bucket
   *
   * @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
   */
  remove(e) {
    return P(this, void 0, void 0, function* () {
      try {
        return { data: yield Gr(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: e }, { headers: this.headers }), error: null };
      } catch (t) {
        if (T(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
  /**
   * Get file metadata
   * @param id the file id to retrieve metadata
   */
  // async getMetadata(
  //   id: string
  // ): Promise<
  //   | {
  //       data: Metadata
  //       error: null
  //     }
  //   | {
  //       data: null
  //       error: StorageError
  //     }
  // > {
  //   try {
  //     const data = await get(this.fetch, `${this.url}/metadata/${id}`, { headers: this.headers })
  //     return { data, error: null }
  //   } catch (error) {
  //     if (isStorageError(error)) {
  //       return { data: null, error }
  //     }
  //     throw error
  //   }
  // }
  /**
   * Update file metadata
   * @param id the file id to update metadata
   * @param meta the new file metadata
   */
  // async updateMetadata(
  //   id: string,
  //   meta: Metadata
  // ): Promise<
  //   | {
  //       data: Metadata
  //       error: null
  //     }
  //   | {
  //       data: null
  //       error: StorageError
  //     }
  // > {
  //   try {
  //     const data = await post(
  //       this.fetch,
  //       `${this.url}/metadata/${id}`,
  //       { ...meta },
  //       { headers: this.headers }
  //     )
  //     return { data, error: null }
  //   } catch (error) {
  //     if (isStorageError(error)) {
  //       return { data: null, error }
  //     }
  //     throw error
  //   }
  // }
  /**
   * Lists all the files within a bucket.
   * @param path The folder path.
   */
  list(e, t, r) {
    return P(this, void 0, void 0, function* () {
      try {
        const n = Object.assign(Object.assign(Object.assign({}, Vn), t), { prefix: e || "" });
        return { data: yield G(this.fetch, `${this.url}/object/list/${this.bucketId}`, n, { headers: this.headers }, r), error: null };
      } catch (n) {
        if (T(n))
          return { data: null, error: n };
        throw n;
      }
    });
  }
  encodeMetadata(e) {
    return JSON.stringify(e);
  }
  toBase64(e) {
    return typeof Buffer < "u" ? Buffer.from(e).toString("base64") : btoa(e);
  }
  _getFinalPath(e) {
    return `${this.bucketId}/${e}`;
  }
  _removeEmptyFolders(e) {
    return e.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
  }
  transformOptsToQueryString(e) {
    const t = [];
    return e.width && t.push(`width=${e.width}`), e.height && t.push(`height=${e.height}`), e.resize && t.push(`resize=${e.resize}`), e.format && t.push(`format=${e.format}`), e.quality && t.push(`quality=${e.quality}`), t.join("&");
  }
}
const Xn = "2.7.1", Yn = { "X-Client-Info": `storage-js/${Xn}` };
var se = function(s, e, t, r) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? i(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
class Zn {
  constructor(e, t = {}, r) {
    this.url = e, this.headers = Object.assign(Object.assign({}, Yn), t), this.fetch = Wr(r);
  }
  /**
   * Retrieves the details of all Storage buckets within an existing project.
   */
  listBuckets() {
    return se(this, void 0, void 0, function* () {
      try {
        return { data: yield qe(this.fetch, `${this.url}/bucket`, { headers: this.headers }), error: null };
      } catch (e) {
        if (T(e))
          return { data: null, error: e };
        throw e;
      }
    });
  }
  /**
   * Retrieves the details of an existing Storage bucket.
   *
   * @param id The unique identifier of the bucket you would like to retrieve.
   */
  getBucket(e) {
    return se(this, void 0, void 0, function* () {
      try {
        return { data: yield qe(this.fetch, `${this.url}/bucket/${e}`, { headers: this.headers }), error: null };
      } catch (t) {
        if (T(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
  /**
   * Creates a new Storage bucket
   *
   * @param id A unique identifier for the bucket you are creating.
   * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations. By default, buckets are private.
   * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
   * The global file size limit takes precedence over this value.
   * The default value is null, which doesn't set a per bucket file size limit.
   * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
   * The default value is null, which allows files with all mime types to be uploaded.
   * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
   * @returns newly created bucket id
   */
  createBucket(e, t = {
    public: !1
  }) {
    return se(this, void 0, void 0, function* () {
      try {
        return { data: yield G(this.fetch, `${this.url}/bucket`, {
          id: e,
          name: e,
          public: t.public,
          file_size_limit: t.fileSizeLimit,
          allowed_mime_types: t.allowedMimeTypes
        }, { headers: this.headers }), error: null };
      } catch (r) {
        if (T(r))
          return { data: null, error: r };
        throw r;
      }
    });
  }
  /**
   * Updates a Storage bucket
   *
   * @param id A unique identifier for the bucket you are updating.
   * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations.
   * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
   * The global file size limit takes precedence over this value.
   * The default value is null, which doesn't set a per bucket file size limit.
   * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
   * The default value is null, which allows files with all mime types to be uploaded.
   * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
   */
  updateBucket(e, t) {
    return se(this, void 0, void 0, function* () {
      try {
        return { data: yield Jn(this.fetch, `${this.url}/bucket/${e}`, {
          id: e,
          name: e,
          public: t.public,
          file_size_limit: t.fileSizeLimit,
          allowed_mime_types: t.allowedMimeTypes
        }, { headers: this.headers }), error: null };
      } catch (r) {
        if (T(r))
          return { data: null, error: r };
        throw r;
      }
    });
  }
  /**
   * Removes all objects inside a single bucket.
   *
   * @param id The unique identifier of the bucket you would like to empty.
   */
  emptyBucket(e) {
    return se(this, void 0, void 0, function* () {
      try {
        return { data: yield G(this.fetch, `${this.url}/bucket/${e}/empty`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (T(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
  /**
   * Deletes an existing bucket. A bucket can't be deleted with existing objects inside it.
   * You must first `empty()` the bucket.
   *
   * @param id The unique identifier of the bucket you would like to delete.
   */
  deleteBucket(e) {
    return se(this, void 0, void 0, function* () {
      try {
        return { data: yield Gr(this.fetch, `${this.url}/bucket/${e}`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (T(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
}
class ei extends Zn {
  constructor(e, t = {}, r) {
    super(e, t, r);
  }
  /**
   * Perform file operation in a bucket.
   *
   * @param id The bucket id to operate on.
   */
  from(e) {
    return new Qn(this.url, this.headers, e, this.fetch);
  }
}
const ti = "2.50.0";
let ve = "";
typeof Deno < "u" ? ve = "deno" : typeof document < "u" ? ve = "web" : typeof navigator < "u" && navigator.product === "ReactNative" ? ve = "react-native" : ve = "node";
const ri = { "X-Client-Info": `supabase-js-${ve}/${ti}` }, si = {
  headers: ri
}, ni = {
  schema: "public"
}, ii = {
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  flowType: "implicit"
}, oi = {};
var ai = function(s, e, t, r) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? i(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
const ci = (s) => {
  let e;
  return s ? e = s : typeof fetch > "u" ? e = $r : e = fetch, (...t) => e(...t);
}, li = () => typeof Headers > "u" ? Pr : Headers, ui = (s, e, t) => {
  const r = ci(t), n = li();
  return (i, o) => ai(void 0, void 0, void 0, function* () {
    var a;
    const c = (a = yield e()) !== null && a !== void 0 ? a : s;
    let l = new n(o == null ? void 0 : o.headers);
    return l.has("apikey") || l.set("apikey", s), l.has("Authorization") || l.set("Authorization", `Bearer ${c}`), r(i, Object.assign(Object.assign({}, o), { headers: l }));
  });
};
var di = function(s, e, t, r) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? i(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
function hi(s) {
  return s.endsWith("/") ? s : s + "/";
}
function fi(s, e) {
  var t, r;
  const { db: n, auth: i, realtime: o, global: a } = s, { db: c, auth: l, realtime: u, global: d } = e, h = {
    db: Object.assign(Object.assign({}, c), n),
    auth: Object.assign(Object.assign({}, l), i),
    realtime: Object.assign(Object.assign({}, u), o),
    global: Object.assign(Object.assign(Object.assign({}, d), a), { headers: Object.assign(Object.assign({}, (t = d == null ? void 0 : d.headers) !== null && t !== void 0 ? t : {}), (r = a == null ? void 0 : a.headers) !== null && r !== void 0 ? r : {}) }),
    accessToken: () => di(this, void 0, void 0, function* () {
      return "";
    })
  };
  return s.accessToken ? h.accessToken = s.accessToken : delete h.accessToken, h;
}
const Hr = "2.70.0", le = 30 * 1e3, _t = 3, tt = _t * le, gi = "http://localhost:9999", pi = "supabase.auth.token";
const mi = { "X-Client-Info": `gotrue-js/${Hr}` };
const bt = "X-Supabase-Api-Version", Jr = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
}, yi = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i, wi = 6e5;
class It extends Error {
  constructor(e, t, r) {
    super(e), this.__isAuthError = !0, this.name = "AuthError", this.status = t, this.code = r;
  }
}
function v(s) {
  return typeof s == "object" && s !== null && "__isAuthError" in s;
}
class vi extends It {
  constructor(e, t, r) {
    super(e, t, r), this.name = "AuthApiError", this.status = t, this.code = r;
  }
}
function _i(s) {
  return v(s) && s.name === "AuthApiError";
}
class Kr extends It {
  constructor(e, t) {
    super(e), this.name = "AuthUnknownError", this.originalError = t;
  }
}
class Q extends It {
  constructor(e, t, r, n) {
    super(e, r, n), this.name = t, this.status = r;
  }
}
class W extends Q {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
}
function bi(s) {
  return v(s) && s.name === "AuthSessionMissingError";
}
class xe extends Q {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
}
class Re extends Q {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
}
class Ie extends Q {
  constructor(e, t = null) {
    super(e, "AuthImplicitGrantRedirectError", 500, void 0), this.details = null, this.details = t;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      details: this.details
    };
  }
}
function Si(s) {
  return v(s) && s.name === "AuthImplicitGrantRedirectError";
}
class Jt extends Q {
  constructor(e, t = null) {
    super(e, "AuthPKCEGrantCodeExchangeError", 500, void 0), this.details = null, this.details = t;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      details: this.details
    };
  }
}
class St extends Q {
  constructor(e, t) {
    super(e, "AuthRetryableFetchError", t, void 0);
  }
}
function rt(s) {
  return v(s) && s.name === "AuthRetryableFetchError";
}
class Kt extends Q {
  constructor(e, t, r) {
    super(e, "AuthWeakPasswordError", t, "weak_password"), this.reasons = r;
  }
}
class Se extends Q {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
}
const Me = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), Vt = ` 	
\r=`.split(""), ki = (() => {
  const s = new Array(128);
  for (let e = 0; e < s.length; e += 1)
    s[e] = -1;
  for (let e = 0; e < Vt.length; e += 1)
    s[Vt[e].charCodeAt(0)] = -2;
  for (let e = 0; e < Me.length; e += 1)
    s[Me[e].charCodeAt(0)] = e;
  return s;
})();
function Qt(s, e, t) {
  if (s !== null)
    for (e.queue = e.queue << 8 | s, e.queuedBits += 8; e.queuedBits >= 6; ) {
      const r = e.queue >> e.queuedBits - 6 & 63;
      t(Me[r]), e.queuedBits -= 6;
    }
  else if (e.queuedBits > 0)
    for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
      const r = e.queue >> e.queuedBits - 6 & 63;
      t(Me[r]), e.queuedBits -= 6;
    }
}
function Vr(s, e, t) {
  const r = ki[s];
  if (r > -1)
    for (e.queue = e.queue << 6 | r, e.queuedBits += 6; e.queuedBits >= 8; )
      t(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (r === -2)
      return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(s)}"`);
  }
}
function Xt(s) {
  const e = [], t = (o) => {
    e.push(String.fromCodePoint(o));
  }, r = {
    utf8seq: 0,
    codepoint: 0
  }, n = { queue: 0, queuedBits: 0 }, i = (o) => {
    Oi(o, r, t);
  };
  for (let o = 0; o < s.length; o += 1)
    Vr(s.charCodeAt(o), n, i);
  return e.join("");
}
function Ei(s, e) {
  if (s <= 127) {
    e(s);
    return;
  } else if (s <= 2047) {
    e(192 | s >> 6), e(128 | s & 63);
    return;
  } else if (s <= 65535) {
    e(224 | s >> 12), e(128 | s >> 6 & 63), e(128 | s & 63);
    return;
  } else if (s <= 1114111) {
    e(240 | s >> 18), e(128 | s >> 12 & 63), e(128 | s >> 6 & 63), e(128 | s & 63);
    return;
  }
  throw new Error(`Unrecognized Unicode codepoint: ${s.toString(16)}`);
}
function Ti(s, e) {
  for (let t = 0; t < s.length; t += 1) {
    let r = s.charCodeAt(t);
    if (r > 55295 && r <= 56319) {
      const n = (r - 55296) * 1024 & 65535;
      r = (s.charCodeAt(t + 1) - 56320 & 65535 | n) + 65536, t += 1;
    }
    Ei(r, e);
  }
}
function Oi(s, e, t) {
  if (e.utf8seq === 0) {
    if (s <= 127) {
      t(s);
      return;
    }
    for (let r = 1; r < 6; r += 1)
      if (!(s >> 7 - r & 1)) {
        e.utf8seq = r;
        break;
      }
    if (e.utf8seq === 2)
      e.codepoint = s & 31;
    else if (e.utf8seq === 3)
      e.codepoint = s & 15;
    else if (e.utf8seq === 4)
      e.codepoint = s & 7;
    else
      throw new Error("Invalid UTF-8 sequence");
    e.utf8seq -= 1;
  } else if (e.utf8seq > 0) {
    if (s <= 127)
      throw new Error("Invalid UTF-8 sequence");
    e.codepoint = e.codepoint << 6 | s & 63, e.utf8seq -= 1, e.utf8seq === 0 && t(e.codepoint);
  }
}
function Ci(s) {
  const e = [], t = { queue: 0, queuedBits: 0 }, r = (n) => {
    e.push(n);
  };
  for (let n = 0; n < s.length; n += 1)
    Vr(s.charCodeAt(n), t, r);
  return new Uint8Array(e);
}
function Ai(s) {
  const e = [];
  return Ti(s, (t) => e.push(t)), new Uint8Array(e);
}
function $i(s) {
  const e = [], t = { queue: 0, queuedBits: 0 }, r = (n) => {
    e.push(n);
  };
  return s.forEach((n) => Qt(n, t, r)), Qt(null, t, r), e.join("");
}
function Pi(s) {
  return Math.round(Date.now() / 1e3) + s;
}
function ji() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(s) {
    const e = Math.random() * 16 | 0;
    return (s == "x" ? e : e & 3 | 8).toString(16);
  });
}
const L = () => typeof window < "u" && typeof document < "u", X = {
  tested: !1,
  writable: !1
}, ke = () => {
  if (!L())
    return !1;
  try {
    if (typeof globalThis.localStorage != "object")
      return !1;
  } catch {
    return !1;
  }
  if (X.tested)
    return X.writable;
  const s = `lswt-${Math.random()}${Math.random()}`;
  try {
    globalThis.localStorage.setItem(s, s), globalThis.localStorage.removeItem(s), X.tested = !0, X.writable = !0;
  } catch {
    X.tested = !0, X.writable = !1;
  }
  return X.writable;
};
function xi(s) {
  const e = {}, t = new URL(s);
  if (t.hash && t.hash[0] === "#")
    try {
      new URLSearchParams(t.hash.substring(1)).forEach((n, i) => {
        e[i] = n;
      });
    } catch {
    }
  return t.searchParams.forEach((r, n) => {
    e[n] = r;
  }), e;
}
const Qr = (s) => {
  let e;
  return s ? e = s : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => me).then(({ default: r }) => r(...t)) : e = fetch, (...t) => e(...t);
}, Ri = (s) => typeof s == "object" && s !== null && "status" in s && "ok" in s && "json" in s && typeof s.json == "function", Xr = async (s, e, t) => {
  await s.setItem(e, JSON.stringify(t));
}, Le = async (s, e) => {
  const t = await s.getItem(e);
  if (!t)
    return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}, Ue = async (s, e) => {
  await s.removeItem(e);
};
class Ve {
  constructor() {
    this.promise = new Ve.promiseConstructor((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
}
Ve.promiseConstructor = Promise;
function st(s) {
  const e = s.split(".");
  if (e.length !== 3)
    throw new Se("Invalid JWT structure");
  for (let r = 0; r < e.length; r++)
    if (!yi.test(e[r]))
      throw new Se("JWT not in base64url format");
  return {
    // using base64url lib
    header: JSON.parse(Xt(e[0])),
    payload: JSON.parse(Xt(e[1])),
    signature: Ci(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function Ii(s) {
  return await new Promise((e) => {
    setTimeout(() => e(null), s);
  });
}
function Li(s, e) {
  return new Promise((r, n) => {
    (async () => {
      for (let i = 0; i < 1 / 0; i++)
        try {
          const o = await s(i);
          if (!e(i, null, o)) {
            r(o);
            return;
          }
        } catch (o) {
          if (!e(i, o)) {
            n(o);
            return;
          }
        }
    })();
  });
}
function Ui(s) {
  return ("0" + s.toString(16)).substr(-2);
}
function Di() {
  const e = new Uint32Array(56);
  if (typeof crypto > "u") {
    const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", r = t.length;
    let n = "";
    for (let i = 0; i < 56; i++)
      n += t.charAt(Math.floor(Math.random() * r));
    return n;
  }
  return crypto.getRandomValues(e), Array.from(e, Ui).join("");
}
async function Bi(s) {
  const t = new TextEncoder().encode(s), r = await crypto.subtle.digest("SHA-256", t), n = new Uint8Array(r);
  return Array.from(n).map((i) => String.fromCharCode(i)).join("");
}
async function qi(s) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u"))
    return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), s;
  const t = await Bi(s);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function ne(s, e, t = !1) {
  const r = Di();
  let n = r;
  t && (n += "/PASSWORD_RECOVERY"), await Xr(s, `${e}-code-verifier`, n);
  const i = await qi(r);
  return [i, r === i ? "plain" : "s256"];
}
const Mi = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function Ni(s) {
  const e = s.headers.get(bt);
  if (!e || !e.match(Mi))
    return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function Fi(s) {
  if (!s)
    throw new Error("Missing exp claim");
  const e = Math.floor(Date.now() / 1e3);
  if (s <= e)
    throw new Error("JWT has expired");
}
function zi(s) {
  switch (s) {
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" }
      };
    case "ES256":
      return {
        name: "ECDSA",
        namedCurve: "P-256",
        hash: { name: "SHA-256" }
      };
    default:
      throw new Error("Invalid alg claim");
  }
}
const Wi = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function ie(s) {
  if (!Wi.test(s))
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
var Gi = function(s, e) {
  var t = {};
  for (var r in s) Object.prototype.hasOwnProperty.call(s, r) && e.indexOf(r) < 0 && (t[r] = s[r]);
  if (s != null && typeof Object.getOwnPropertySymbols == "function")
    for (var n = 0, r = Object.getOwnPropertySymbols(s); n < r.length; n++)
      e.indexOf(r[n]) < 0 && Object.prototype.propertyIsEnumerable.call(s, r[n]) && (t[r[n]] = s[r[n]]);
  return t;
};
const Y = (s) => s.msg || s.message || s.error_description || s.error || JSON.stringify(s), Hi = [502, 503, 504];
async function Yt(s) {
  var e;
  if (!Ri(s))
    throw new St(Y(s), 0);
  if (Hi.includes(s.status))
    throw new St(Y(s), s.status);
  let t;
  try {
    t = await s.json();
  } catch (i) {
    throw new Kr(Y(i), i);
  }
  let r;
  const n = Ni(s);
  if (n && n.getTime() >= Jr["2024-01-01"].timestamp && typeof t == "object" && t && typeof t.code == "string" ? r = t.code : typeof t == "object" && t && typeof t.error_code == "string" && (r = t.error_code), r) {
    if (r === "weak_password")
      throw new Kt(Y(t), s.status, ((e = t.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (r === "session_not_found")
      throw new W();
  } else if (typeof t == "object" && t && typeof t.weak_password == "object" && t.weak_password && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.reasons.reduce((i, o) => i && typeof o == "string", !0))
    throw new Kt(Y(t), s.status, t.weak_password.reasons);
  throw new vi(Y(t), s.status || 500, r);
}
const Ji = (s, e, t, r) => {
  const n = { method: s, headers: (e == null ? void 0 : e.headers) || {} };
  return s === "GET" ? n : (n.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, e == null ? void 0 : e.headers), n.body = JSON.stringify(r), Object.assign(Object.assign({}, n), t));
};
async function _(s, e, t, r) {
  var n;
  const i = Object.assign({}, r == null ? void 0 : r.headers);
  i[bt] || (i[bt] = Jr["2024-01-01"].name), r != null && r.jwt && (i.Authorization = `Bearer ${r.jwt}`);
  const o = (n = r == null ? void 0 : r.query) !== null && n !== void 0 ? n : {};
  r != null && r.redirectTo && (o.redirect_to = r.redirectTo);
  const a = Object.keys(o).length ? "?" + new URLSearchParams(o).toString() : "", c = await Ki(s, e, t + a, {
    headers: i,
    noResolveJson: r == null ? void 0 : r.noResolveJson
  }, {}, r == null ? void 0 : r.body);
  return r != null && r.xform ? r == null ? void 0 : r.xform(c) : { data: Object.assign({}, c), error: null };
}
async function Ki(s, e, t, r, n, i) {
  const o = Ji(e, r, n, i);
  let a;
  try {
    a = await s(t, Object.assign({}, o));
  } catch (c) {
    throw console.error(c), new St(Y(c), 0);
  }
  if (a.ok || await Yt(a), r != null && r.noResolveJson)
    return a;
  try {
    return await a.json();
  } catch (c) {
    await Yt(c);
  }
}
function F(s) {
  var e;
  let t = null;
  Yi(s) && (t = Object.assign({}, s), s.expires_at || (t.expires_at = Pi(s.expires_in)));
  const r = (e = s.user) !== null && e !== void 0 ? e : s;
  return { data: { session: t, user: r }, error: null };
}
function Zt(s) {
  const e = F(s);
  return !e.error && s.weak_password && typeof s.weak_password == "object" && Array.isArray(s.weak_password.reasons) && s.weak_password.reasons.length && s.weak_password.message && typeof s.weak_password.message == "string" && s.weak_password.reasons.reduce((t, r) => t && typeof r == "string", !0) && (e.data.weak_password = s.weak_password), e;
}
function K(s) {
  var e;
  return { data: { user: (e = s.user) !== null && e !== void 0 ? e : s }, error: null };
}
function Vi(s) {
  return { data: s, error: null };
}
function Qi(s) {
  const { action_link: e, email_otp: t, hashed_token: r, redirect_to: n, verification_type: i } = s, o = Gi(s, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]), a = {
    action_link: e,
    email_otp: t,
    hashed_token: r,
    redirect_to: n,
    verification_type: i
  }, c = Object.assign({}, o);
  return {
    data: {
      properties: a,
      user: c
    },
    error: null
  };
}
function Xi(s) {
  return s;
}
function Yi(s) {
  return s.access_token && s.refresh_token && s.expires_in;
}
const nt = ["global", "local", "others"];
var Zi = function(s, e) {
  var t = {};
  for (var r in s) Object.prototype.hasOwnProperty.call(s, r) && e.indexOf(r) < 0 && (t[r] = s[r]);
  if (s != null && typeof Object.getOwnPropertySymbols == "function")
    for (var n = 0, r = Object.getOwnPropertySymbols(s); n < r.length; n++)
      e.indexOf(r[n]) < 0 && Object.prototype.propertyIsEnumerable.call(s, r[n]) && (t[r[n]] = s[r[n]]);
  return t;
};
class eo {
  constructor({ url: e = "", headers: t = {}, fetch: r }) {
    this.url = e, this.headers = t, this.fetch = Qr(r), this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    };
  }
  /**
   * Removes a logged-in session.
   * @param jwt A valid, logged-in JWT.
   * @param scope The logout sope.
   */
  async signOut(e, t = nt[0]) {
    if (nt.indexOf(t) < 0)
      throw new Error(`@supabase/auth-js: Parameter scope must be one of ${nt.join(", ")}`);
    try {
      return await _(this.fetch, "POST", `${this.url}/logout?scope=${t}`, {
        headers: this.headers,
        jwt: e,
        noResolveJson: !0
      }), { data: null, error: null };
    } catch (r) {
      if (v(r))
        return { data: null, error: r };
      throw r;
    }
  }
  /**
   * Sends an invite link to an email address.
   * @param email The email address of the user.
   * @param options Additional options to be included when inviting.
   */
  async inviteUserByEmail(e, t = {}) {
    try {
      return await _(this.fetch, "POST", `${this.url}/invite`, {
        body: { email: e, data: t.data },
        headers: this.headers,
        redirectTo: t.redirectTo,
        xform: K
      });
    } catch (r) {
      if (v(r))
        return { data: { user: null }, error: r };
      throw r;
    }
  }
  /**
   * Generates email links and OTPs to be sent via a custom email provider.
   * @param email The user's email.
   * @param options.password User password. For signup only.
   * @param options.data Optional user metadata. For signup only.
   * @param options.redirectTo The redirect url which should be appended to the generated link
   */
  async generateLink(e) {
    try {
      const { options: t } = e, r = Zi(e, ["options"]), n = Object.assign(Object.assign({}, r), t);
      return "newEmail" in r && (n.new_email = r == null ? void 0 : r.newEmail, delete n.newEmail), await _(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: n,
        headers: this.headers,
        xform: Qi,
        redirectTo: t == null ? void 0 : t.redirectTo
      });
    } catch (t) {
      if (v(t))
        return {
          data: {
            properties: null,
            user: null
          },
          error: t
        };
      throw t;
    }
  }
  // User Admin API
  /**
   * Creates a new user.
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async createUser(e) {
    try {
      return await _(this.fetch, "POST", `${this.url}/admin/users`, {
        body: e,
        headers: this.headers,
        xform: K
      });
    } catch (t) {
      if (v(t))
        return { data: { user: null }, error: t };
      throw t;
    }
  }
  /**
   * Get a list of users.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   * @param params An object which supports `page` and `perPage` as numbers, to alter the paginated results.
   */
  async listUsers(e) {
    var t, r, n, i, o, a, c;
    try {
      const l = { nextPage: null, lastPage: 0, total: 0 }, u = await _(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (r = (t = e == null ? void 0 : e.page) === null || t === void 0 ? void 0 : t.toString()) !== null && r !== void 0 ? r : "",
          per_page: (i = (n = e == null ? void 0 : e.perPage) === null || n === void 0 ? void 0 : n.toString()) !== null && i !== void 0 ? i : ""
        },
        xform: Xi
      });
      if (u.error)
        throw u.error;
      const d = await u.json(), h = (o = u.headers.get("x-total-count")) !== null && o !== void 0 ? o : 0, f = (c = (a = u.headers.get("link")) === null || a === void 0 ? void 0 : a.split(",")) !== null && c !== void 0 ? c : [];
      return f.length > 0 && (f.forEach((g) => {
        const m = parseInt(g.split(";")[0].split("=")[1].substring(0, 1)), p = JSON.parse(g.split(";")[1].split("=")[1]);
        l[`${p}Page`] = m;
      }), l.total = parseInt(h)), { data: Object.assign(Object.assign({}, d), l), error: null };
    } catch (l) {
      if (v(l))
        return { data: { users: [] }, error: l };
      throw l;
    }
  }
  /**
   * Get user by id.
   *
   * @param uid The user's unique identifier
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async getUserById(e) {
    ie(e);
    try {
      return await _(this.fetch, "GET", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        xform: K
      });
    } catch (t) {
      if (v(t))
        return { data: { user: null }, error: t };
      throw t;
    }
  }
  /**
   * Updates the user data.
   *
   * @param attributes The data you want to update.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async updateUserById(e, t) {
    ie(e);
    try {
      return await _(this.fetch, "PUT", `${this.url}/admin/users/${e}`, {
        body: t,
        headers: this.headers,
        xform: K
      });
    } catch (r) {
      if (v(r))
        return { data: { user: null }, error: r };
      throw r;
    }
  }
  /**
   * Delete a user. Requires a `service_role` key.
   *
   * @param id The user id you want to remove.
   * @param shouldSoftDelete If true, then the user will be soft-deleted from the auth schema. Soft deletion allows user identification from the hashed user ID but is not reversible.
   * Defaults to false for backward compatibility.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async deleteUser(e, t = !1) {
    ie(e);
    try {
      return await _(this.fetch, "DELETE", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        body: {
          should_soft_delete: t
        },
        xform: K
      });
    } catch (r) {
      if (v(r))
        return { data: { user: null }, error: r };
      throw r;
    }
  }
  async _listFactors(e) {
    ie(e.userId);
    try {
      const { data: t, error: r } = await _(this.fetch, "GET", `${this.url}/admin/users/${e.userId}/factors`, {
        headers: this.headers,
        xform: (n) => ({ data: { factors: n }, error: null })
      });
      return { data: t, error: r };
    } catch (t) {
      if (v(t))
        return { data: null, error: t };
      throw t;
    }
  }
  async _deleteFactor(e) {
    ie(e.userId), ie(e.id);
    try {
      return { data: await _(this.fetch, "DELETE", `${this.url}/admin/users/${e.userId}/factors/${e.id}`, {
        headers: this.headers
      }), error: null };
    } catch (t) {
      if (v(t))
        return { data: null, error: t };
      throw t;
    }
  }
}
const to = {
  getItem: (s) => ke() ? globalThis.localStorage.getItem(s) : null,
  setItem: (s, e) => {
    ke() && globalThis.localStorage.setItem(s, e);
  },
  removeItem: (s) => {
    ke() && globalThis.localStorage.removeItem(s);
  }
};
function er(s = {}) {
  return {
    getItem: (e) => s[e] || null,
    setItem: (e, t) => {
      s[e] = t;
    },
    removeItem: (e) => {
      delete s[e];
    }
  };
}
function ro() {
  if (typeof globalThis != "object")
    try {
      Object.defineProperty(Object.prototype, "__magic__", {
        get: function() {
          return this;
        },
        configurable: !0
      }), __magic__.globalThis = __magic__, delete Object.prototype.__magic__;
    } catch {
      typeof self < "u" && (self.globalThis = self);
    }
}
const oe = {
  /**
   * @experimental
   */
  debug: !!(globalThis && ke() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
};
class Yr extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = !0;
  }
}
class so extends Yr {
}
async function no(s, e, t) {
  oe.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire lock", s, e);
  const r = new globalThis.AbortController();
  return e > 0 && setTimeout(() => {
    r.abort(), oe.debug && console.log("@supabase/gotrue-js: navigatorLock acquire timed out", s);
  }, e), await Promise.resolve().then(() => globalThis.navigator.locks.request(s, e === 0 ? {
    mode: "exclusive",
    ifAvailable: !0
  } : {
    mode: "exclusive",
    signal: r.signal
  }, async (n) => {
    if (n) {
      oe.debug && console.log("@supabase/gotrue-js: navigatorLock: acquired", s, n.name);
      try {
        return await t();
      } finally {
        oe.debug && console.log("@supabase/gotrue-js: navigatorLock: released", s, n.name);
      }
    } else {
      if (e === 0)
        throw oe.debug && console.log("@supabase/gotrue-js: navigatorLock: not immediately available", s), new so(`Acquiring an exclusive Navigator LockManager lock "${s}" immediately failed`);
      if (oe.debug)
        try {
          const i = await globalThis.navigator.locks.query();
          console.log("@supabase/gotrue-js: Navigator LockManager state", JSON.stringify(i, null, "  "));
        } catch (i) {
          console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state", i);
        }
      return console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request"), await t();
    }
  }));
}
ro();
const io = {
  url: gi,
  storageKey: pi,
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  headers: mi,
  flowType: "implicit",
  debug: !1,
  hasCustomAuthorizationHeader: !1
};
async function tr(s, e, t) {
  return await t();
}
class Ae {
  /**
   * Create a new client for use in the browser.
   */
  constructor(e) {
    var t, r;
    this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = !0, this.hasCustomAuthorizationHeader = !1, this.suppressGetSessionWarning = !1, this.lockAcquired = !1, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log, this.instanceID = Ae.nextInstanceID, Ae.nextInstanceID += 1, this.instanceID > 0 && L() && console.warn("Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.");
    const n = Object.assign(Object.assign({}, io), e);
    if (this.logDebugMessages = !!n.debug, typeof n.debug == "function" && (this.logger = n.debug), this.persistSession = n.persistSession, this.storageKey = n.storageKey, this.autoRefreshToken = n.autoRefreshToken, this.admin = new eo({
      url: n.url,
      headers: n.headers,
      fetch: n.fetch
    }), this.url = n.url, this.headers = n.headers, this.fetch = Qr(n.fetch), this.lock = n.lock || tr, this.detectSessionInUrl = n.detectSessionInUrl, this.flowType = n.flowType, this.hasCustomAuthorizationHeader = n.hasCustomAuthorizationHeader, n.lock ? this.lock = n.lock : L() && (!((t = globalThis == null ? void 0 : globalThis.navigator) === null || t === void 0) && t.locks) ? this.lock = no : this.lock = tr, this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER, this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this)
    }, this.persistSession ? n.storage ? this.storage = n.storage : ke() ? this.storage = to : (this.memoryStorage = {}, this.storage = er(this.memoryStorage)) : (this.memoryStorage = {}, this.storage = er(this.memoryStorage)), L() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
      try {
        this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
      } catch (i) {
        console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", i);
      }
      (r = this.broadcastChannel) === null || r === void 0 || r.addEventListener("message", async (i) => {
        this._debug("received broadcast notification from other tab or client", i), await this._notifyAllSubscribers(i.data.event, i.data.session, !1);
      });
    }
    this.initialize();
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(`GoTrueClient@${this.instanceID} (${Hr}) ${(/* @__PURE__ */ new Date()).toISOString()}`, ...e), this;
  }
  /**
   * Initializes the client session either from the url or from storage.
   * This method is automatically called when instantiating the client, but should also be called
   * manually when checking for an error from an auth redirect (oauth, magiclink, password recovery, etc).
   */
  async initialize() {
    return this.initializePromise ? await this.initializePromise : (this.initializePromise = (async () => await this._acquireLock(-1, async () => await this._initialize()))(), await this.initializePromise);
  }
  /**
   * IMPORTANT:
   * 1. Never throw in this method, as it is called from the constructor
   * 2. Never return a session from this method as it would be cached over
   *    the whole lifetime of the client
   */
  async _initialize() {
    var e;
    try {
      const t = xi(window.location.href);
      let r = "none";
      if (this._isImplicitGrantCallback(t) ? r = "implicit" : await this._isPKCECallback(t) && (r = "pkce"), L() && this.detectSessionInUrl && r !== "none") {
        const { data: n, error: i } = await this._getSessionFromURL(t, r);
        if (i) {
          if (this._debug("#_initialize()", "error detecting session from URL", i), Si(i)) {
            const c = (e = i.details) === null || e === void 0 ? void 0 : e.code;
            if (c === "identity_already_exists" || c === "identity_not_found" || c === "single_identity_not_deletable")
              return { error: i };
          }
          return await this._removeSession(), { error: i };
        }
        const { session: o, redirectType: a } = n;
        return this._debug("#_initialize()", "detected session in URL", o, "redirect type", a), await this._saveSession(o), setTimeout(async () => {
          a === "recovery" ? await this._notifyAllSubscribers("PASSWORD_RECOVERY", o) : await this._notifyAllSubscribers("SIGNED_IN", o);
        }, 0), { error: null };
      }
      return await this._recoverAndRefresh(), { error: null };
    } catch (t) {
      return v(t) ? { error: t } : {
        error: new Kr("Unexpected error during initialization", t)
      };
    } finally {
      await this._handleVisibilityChange(), this._debug("#_initialize()", "end");
    }
  }
  /**
   * Creates a new anonymous user.
   *
   * @returns A session where the is_anonymous claim in the access token JWT set to true
   */
  async signInAnonymously(e) {
    var t, r, n;
    try {
      const i = await _(this.fetch, "POST", `${this.url}/signup`, {
        headers: this.headers,
        body: {
          data: (r = (t = e == null ? void 0 : e.options) === null || t === void 0 ? void 0 : t.data) !== null && r !== void 0 ? r : {},
          gotrue_meta_security: { captcha_token: (n = e == null ? void 0 : e.options) === null || n === void 0 ? void 0 : n.captchaToken }
        },
        xform: F
      }), { data: o, error: a } = i;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const c = o.session, l = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", c)), { data: { user: l, session: c }, error: null };
    } catch (i) {
      if (v(i))
        return { data: { user: null, session: null }, error: i };
      throw i;
    }
  }
  /**
   * Creates a new user.
   *
   * Be aware that if a user account exists in the system you may get back an
   * error message that attempts to hide this information from the user.
   * This method has support for PKCE via email signups. The PKCE flow cannot be used when autoconfirm is enabled.
   *
   * @returns A logged-in session if the server has "autoconfirm" ON
   * @returns A user if the server has "autoconfirm" OFF
   */
  async signUp(e) {
    var t, r, n;
    try {
      let i;
      if ("email" in e) {
        const { email: u, password: d, options: h } = e;
        let f = null, g = null;
        this.flowType === "pkce" && ([f, g] = await ne(this.storage, this.storageKey)), i = await _(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          redirectTo: h == null ? void 0 : h.emailRedirectTo,
          body: {
            email: u,
            password: d,
            data: (t = h == null ? void 0 : h.data) !== null && t !== void 0 ? t : {},
            gotrue_meta_security: { captcha_token: h == null ? void 0 : h.captchaToken },
            code_challenge: f,
            code_challenge_method: g
          },
          xform: F
        });
      } else if ("phone" in e) {
        const { phone: u, password: d, options: h } = e;
        i = await _(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            phone: u,
            password: d,
            data: (r = h == null ? void 0 : h.data) !== null && r !== void 0 ? r : {},
            channel: (n = h == null ? void 0 : h.channel) !== null && n !== void 0 ? n : "sms",
            gotrue_meta_security: { captcha_token: h == null ? void 0 : h.captchaToken }
          },
          xform: F
        });
      } else
        throw new Re("You must provide either an email or phone number and a password");
      const { data: o, error: a } = i;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const c = o.session, l = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", c)), { data: { user: l, session: c }, error: null };
    } catch (i) {
      if (v(i))
        return { data: { user: null, session: null }, error: i };
      throw i;
    }
  }
  /**
   * Log in an existing user with an email and password or phone and password.
   *
   * Be aware that you may get back an error message that will not distinguish
   * between the cases where the account does not exist or that the
   * email/phone and password combination is wrong or that the account can only
   * be accessed via social login.
   */
  async signInWithPassword(e) {
    try {
      let t;
      if ("email" in e) {
        const { email: i, password: o, options: a } = e;
        t = await _(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            email: i,
            password: o,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          xform: Zt
        });
      } else if ("phone" in e) {
        const { phone: i, password: o, options: a } = e;
        t = await _(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            phone: i,
            password: o,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          xform: Zt
        });
      } else
        throw new Re("You must provide either an email or phone number and a password");
      const { data: r, error: n } = t;
      return n ? { data: { user: null, session: null }, error: n } : !r || !r.session || !r.user ? { data: { user: null, session: null }, error: new xe() } : (r.session && (await this._saveSession(r.session), await this._notifyAllSubscribers("SIGNED_IN", r.session)), {
        data: Object.assign({ user: r.user, session: r.session }, r.weak_password ? { weakPassword: r.weak_password } : null),
        error: n
      });
    } catch (t) {
      if (v(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Log in an existing user via a third-party provider.
   * This method supports the PKCE flow.
   */
  async signInWithOAuth(e) {
    var t, r, n, i;
    return await this._handleProviderSignIn(e.provider, {
      redirectTo: (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo,
      scopes: (r = e.options) === null || r === void 0 ? void 0 : r.scopes,
      queryParams: (n = e.options) === null || n === void 0 ? void 0 : n.queryParams,
      skipBrowserRedirect: (i = e.options) === null || i === void 0 ? void 0 : i.skipBrowserRedirect
    });
  }
  /**
   * Log in an existing user by exchanging an Auth Code issued during the PKCE flow.
   */
  async exchangeCodeForSession(e) {
    return await this.initializePromise, this._acquireLock(-1, async () => this._exchangeCodeForSession(e));
  }
  /**
   * Signs in a user by verifying a message signed by the user's private key.
   * Only Solana supported at this time, using the Sign in with Solana standard.
   */
  async signInWithWeb3(e) {
    const { chain: t } = e;
    if (t === "solana")
      return await this.signInWithSolana(e);
    throw new Error(`@supabase/auth-js: Unsupported chain "${t}"`);
  }
  async signInWithSolana(e) {
    var t, r, n, i, o, a, c, l, u, d, h, f;
    let g, m;
    if ("message" in e)
      g = e.message, m = e.signature;
    else {
      const { chain: p, wallet: w, statement: k, options: y } = e;
      let b;
      if (L())
        if (typeof w == "object")
          b = w;
        else {
          const E = window;
          if ("solana" in E && typeof E.solana == "object" && ("signIn" in E.solana && typeof E.solana.signIn == "function" || "signMessage" in E.solana && typeof E.solana.signMessage == "function"))
            b = E.solana;
          else
            throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.");
        }
      else {
        if (typeof w != "object" || !(y != null && y.url))
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        b = w;
      }
      const O = new URL((t = y == null ? void 0 : y.url) !== null && t !== void 0 ? t : window.location.href);
      if ("signIn" in b && b.signIn) {
        const E = await b.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, y == null ? void 0 : y.signInWithSolana), {
          // non-overridable properties
          version: "1",
          domain: O.host,
          uri: O.href
        }), k ? { statement: k } : null));
        let x;
        if (Array.isArray(E) && E[0] && typeof E[0] == "object")
          x = E[0];
        else if (E && typeof E == "object" && "signedMessage" in E && "signature" in E)
          x = E;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in x && "signature" in x && (typeof x.signedMessage == "string" || x.signedMessage instanceof Uint8Array) && x.signature instanceof Uint8Array)
          g = typeof x.signedMessage == "string" ? x.signedMessage : new TextDecoder().decode(x.signedMessage), m = x.signature;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in b) || typeof b.signMessage != "function" || !("publicKey" in b) || typeof b != "object" || !b.publicKey || !("toBase58" in b.publicKey) || typeof b.publicKey.toBase58 != "function")
          throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        g = [
          `${O.host} wants you to sign in with your Solana account:`,
          b.publicKey.toBase58(),
          ...k ? ["", k, ""] : [""],
          "Version: 1",
          `URI: ${O.href}`,
          `Issued At: ${(n = (r = y == null ? void 0 : y.signInWithSolana) === null || r === void 0 ? void 0 : r.issuedAt) !== null && n !== void 0 ? n : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((i = y == null ? void 0 : y.signInWithSolana) === null || i === void 0) && i.notBefore ? [`Not Before: ${y.signInWithSolana.notBefore}`] : [],
          ...!((o = y == null ? void 0 : y.signInWithSolana) === null || o === void 0) && o.expirationTime ? [`Expiration Time: ${y.signInWithSolana.expirationTime}`] : [],
          ...!((a = y == null ? void 0 : y.signInWithSolana) === null || a === void 0) && a.chainId ? [`Chain ID: ${y.signInWithSolana.chainId}`] : [],
          ...!((c = y == null ? void 0 : y.signInWithSolana) === null || c === void 0) && c.nonce ? [`Nonce: ${y.signInWithSolana.nonce}`] : [],
          ...!((l = y == null ? void 0 : y.signInWithSolana) === null || l === void 0) && l.requestId ? [`Request ID: ${y.signInWithSolana.requestId}`] : [],
          ...!((d = (u = y == null ? void 0 : y.signInWithSolana) === null || u === void 0 ? void 0 : u.resources) === null || d === void 0) && d.length ? [
            "Resources",
            ...y.signInWithSolana.resources.map((x) => `- ${x}`)
          ] : []
        ].join(`
`);
        const E = await b.signMessage(new TextEncoder().encode(g), "utf8");
        if (!E || !(E instanceof Uint8Array))
          throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        m = E;
      }
    }
    try {
      const { data: p, error: w } = await _(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({ chain: "solana", message: g, signature: $i(m) }, !((h = e.options) === null || h === void 0) && h.captchaToken ? { gotrue_meta_security: { captcha_token: (f = e.options) === null || f === void 0 ? void 0 : f.captchaToken } } : null),
        xform: F
      });
      if (w)
        throw w;
      return !p || !p.session || !p.user ? {
        data: { user: null, session: null },
        error: new xe()
      } : (p.session && (await this._saveSession(p.session), await this._notifyAllSubscribers("SIGNED_IN", p.session)), { data: Object.assign({}, p), error: w });
    } catch (p) {
      if (v(p))
        return { data: { user: null, session: null }, error: p };
      throw p;
    }
  }
  async _exchangeCodeForSession(e) {
    const t = await Le(this.storage, `${this.storageKey}-code-verifier`), [r, n] = (t ?? "").split("/");
    try {
      const { data: i, error: o } = await _(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: r
        },
        xform: F
      });
      if (await Ue(this.storage, `${this.storageKey}-code-verifier`), o)
        throw o;
      return !i || !i.session || !i.user ? {
        data: { user: null, session: null, redirectType: null },
        error: new xe()
      } : (i.session && (await this._saveSession(i.session), await this._notifyAllSubscribers("SIGNED_IN", i.session)), { data: Object.assign(Object.assign({}, i), { redirectType: n ?? null }), error: o });
    } catch (i) {
      if (v(i))
        return { data: { user: null, session: null, redirectType: null }, error: i };
      throw i;
    }
  }
  /**
   * Allows signing in with an OIDC ID token. The authentication provider used
   * should be enabled and configured.
   */
  async signInWithIdToken(e) {
    try {
      const { options: t, provider: r, token: n, access_token: i, nonce: o } = e, a = await _(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
        headers: this.headers,
        body: {
          provider: r,
          id_token: n,
          access_token: i,
          nonce: o,
          gotrue_meta_security: { captcha_token: t == null ? void 0 : t.captchaToken }
        },
        xform: F
      }), { data: c, error: l } = a;
      return l ? { data: { user: null, session: null }, error: l } : !c || !c.session || !c.user ? {
        data: { user: null, session: null },
        error: new xe()
      } : (c.session && (await this._saveSession(c.session), await this._notifyAllSubscribers("SIGNED_IN", c.session)), { data: c, error: l });
    } catch (t) {
      if (v(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Log in a user using magiclink or a one-time password (OTP).
   *
   * If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent.
   * If the `{{ .Token }}` variable is specified in the email template, an OTP will be sent.
   * If you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.
   *
   * Be aware that you may get back an error message that will not distinguish
   * between the cases where the account does not exist or, that the account
   * can only be accessed via social login.
   *
   * Do note that you will need to configure a Whatsapp sender on Twilio
   * if you are using phone sign in with the 'whatsapp' channel. The whatsapp
   * channel is not supported on other providers
   * at this time.
   * This method supports PKCE when an email is passed.
   */
  async signInWithOtp(e) {
    var t, r, n, i, o;
    try {
      if ("email" in e) {
        const { email: a, options: c } = e;
        let l = null, u = null;
        this.flowType === "pkce" && ([l, u] = await ne(this.storage, this.storageKey));
        const { error: d } = await _(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            email: a,
            data: (t = c == null ? void 0 : c.data) !== null && t !== void 0 ? t : {},
            create_user: (r = c == null ? void 0 : c.shouldCreateUser) !== null && r !== void 0 ? r : !0,
            gotrue_meta_security: { captcha_token: c == null ? void 0 : c.captchaToken },
            code_challenge: l,
            code_challenge_method: u
          },
          redirectTo: c == null ? void 0 : c.emailRedirectTo
        });
        return { data: { user: null, session: null }, error: d };
      }
      if ("phone" in e) {
        const { phone: a, options: c } = e, { data: l, error: u } = await _(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            phone: a,
            data: (n = c == null ? void 0 : c.data) !== null && n !== void 0 ? n : {},
            create_user: (i = c == null ? void 0 : c.shouldCreateUser) !== null && i !== void 0 ? i : !0,
            gotrue_meta_security: { captcha_token: c == null ? void 0 : c.captchaToken },
            channel: (o = c == null ? void 0 : c.channel) !== null && o !== void 0 ? o : "sms"
          }
        });
        return { data: { user: null, session: null, messageId: l == null ? void 0 : l.message_id }, error: u };
      }
      throw new Re("You must provide either an email or phone number.");
    } catch (a) {
      if (v(a))
        return { data: { user: null, session: null }, error: a };
      throw a;
    }
  }
  /**
   * Log in a user given a User supplied OTP or TokenHash received through mobile or email.
   */
  async verifyOtp(e) {
    var t, r;
    try {
      let n, i;
      "options" in e && (n = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo, i = (r = e.options) === null || r === void 0 ? void 0 : r.captchaToken);
      const { data: o, error: a } = await _(this.fetch, "POST", `${this.url}/verify`, {
        headers: this.headers,
        body: Object.assign(Object.assign({}, e), { gotrue_meta_security: { captcha_token: i } }),
        redirectTo: n,
        xform: F
      });
      if (a)
        throw a;
      if (!o)
        throw new Error("An error occurred on token verification.");
      const c = o.session, l = o.user;
      return c != null && c.access_token && (await this._saveSession(c), await this._notifyAllSubscribers(e.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", c)), { data: { user: l, session: c }, error: null };
    } catch (n) {
      if (v(n))
        return { data: { user: null, session: null }, error: n };
      throw n;
    }
  }
  /**
   * Attempts a single-sign on using an enterprise Identity Provider. A
   * successful SSO attempt will redirect the current page to the identity
   * provider authorization page. The redirect URL is implementation and SSO
   * protocol specific.
   *
   * You can use it by providing a SSO domain. Typically you can extract this
   * domain by asking users for their email address. If this domain is
   * registered on the Auth instance the redirect will use that organization's
   * currently active SSO Identity Provider for the login.
   *
   * If you have built an organization-specific login page, you can use the
   * organization's SSO Identity Provider UUID directly instead.
   */
  async signInWithSSO(e) {
    var t, r, n;
    try {
      let i = null, o = null;
      return this.flowType === "pkce" && ([i, o] = await ne(this.storage, this.storageKey)), await _(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? { provider_id: e.providerId } : null), "domain" in e ? { domain: e.domain } : null), { redirect_to: (r = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo) !== null && r !== void 0 ? r : void 0 }), !((n = e == null ? void 0 : e.options) === null || n === void 0) && n.captchaToken ? { gotrue_meta_security: { captcha_token: e.options.captchaToken } } : null), { skip_http_redirect: !0, code_challenge: i, code_challenge_method: o }),
        headers: this.headers,
        xform: Vi
      });
    } catch (i) {
      if (v(i))
        return { data: null, error: i };
      throw i;
    }
  }
  /**
   * Sends a reauthentication OTP to the user's email or phone number.
   * Requires the user to be signed-in.
   */
  async reauthenticate() {
    return await this.initializePromise, await this._acquireLock(-1, async () => await this._reauthenticate());
  }
  async _reauthenticate() {
    try {
      return await this._useSession(async (e) => {
        const { data: { session: t }, error: r } = e;
        if (r)
          throw r;
        if (!t)
          throw new W();
        const { error: n } = await _(this.fetch, "GET", `${this.url}/reauthenticate`, {
          headers: this.headers,
          jwt: t.access_token
        });
        return { data: { user: null, session: null }, error: n };
      });
    } catch (e) {
      if (v(e))
        return { data: { user: null, session: null }, error: e };
      throw e;
    }
  }
  /**
   * Resends an existing signup confirmation email, email change email, SMS OTP or phone change OTP.
   */
  async resend(e) {
    try {
      const t = `${this.url}/resend`;
      if ("email" in e) {
        const { email: r, type: n, options: i } = e, { error: o } = await _(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            email: r,
            type: n,
            gotrue_meta_security: { captcha_token: i == null ? void 0 : i.captchaToken }
          },
          redirectTo: i == null ? void 0 : i.emailRedirectTo
        });
        return { data: { user: null, session: null }, error: o };
      } else if ("phone" in e) {
        const { phone: r, type: n, options: i } = e, { data: o, error: a } = await _(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            phone: r,
            type: n,
            gotrue_meta_security: { captcha_token: i == null ? void 0 : i.captchaToken }
          }
        });
        return { data: { user: null, session: null, messageId: o == null ? void 0 : o.message_id }, error: a };
      }
      throw new Re("You must provide either an email or phone number and a type");
    } catch (t) {
      if (v(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Returns the session, refreshing it if necessary.
   *
   * The session returned can be null if the session is not detected which can happen in the event a user is not signed-in or has logged out.
   *
   * **IMPORTANT:** This method loads values directly from the storage attached
   * to the client. If that storage is based on request cookies for example,
   * the values in it may not be authentic and therefore it's strongly advised
   * against using this method and its results in such circumstances. A warning
   * will be emitted if this is detected. Use {@link #getUser()} instead.
   */
  async getSession() {
    return await this.initializePromise, await this._acquireLock(-1, async () => this._useSession(async (t) => t));
  }
  /**
   * Acquires a global lock based on the storage key.
   */
  async _acquireLock(e, t) {
    this._debug("#_acquireLock", "begin", e);
    try {
      if (this.lockAcquired) {
        const r = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve(), n = (async () => (await r, await t()))();
        return this.pendingInLock.push((async () => {
          try {
            await n;
          } catch {
          }
        })()), n;
      }
      return await this.lock(`lock:${this.storageKey}`, e, async () => {
        this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
        try {
          this.lockAcquired = !0;
          const r = t();
          for (this.pendingInLock.push((async () => {
            try {
              await r;
            } catch {
            }
          })()), await r; this.pendingInLock.length; ) {
            const n = [...this.pendingInLock];
            await Promise.all(n), this.pendingInLock.splice(0, n.length);
          }
          return await r;
        } finally {
          this._debug("#_acquireLock", "lock released for storage key", this.storageKey), this.lockAcquired = !1;
        }
      });
    } finally {
      this._debug("#_acquireLock", "end");
    }
  }
  /**
   * Use instead of {@link #getSession} inside the library. It is
   * semantically usually what you want, as getting a session involves some
   * processing afterwards that requires only one client operating on the
   * session at once across multiple tabs or processes.
   */
  async _useSession(e) {
    this._debug("#_useSession", "begin");
    try {
      const t = await this.__loadSession();
      return await e(t);
    } finally {
      this._debug("#_useSession", "end");
    }
  }
  /**
   * NEVER USE DIRECTLY!
   *
   * Always use {@link #_useSession}.
   */
  async __loadSession() {
    this._debug("#__loadSession()", "begin"), this.lockAcquired || this._debug("#__loadSession()", "used outside of an acquired lock!", new Error().stack);
    try {
      let e = null;
      const t = await Le(this.storage, this.storageKey);
      if (this._debug("#getSession()", "session from storage", t), t !== null && (this._isValidSession(t) ? e = t : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !e)
        return { data: { session: null }, error: null };
      const r = e.expires_at ? e.expires_at * 1e3 - Date.now() < tt : !1;
      if (this._debug("#__loadSession()", `session has${r ? "" : " not"} expired`, "expires_at", e.expires_at), !r) {
        if (this.storage.isServer) {
          let o = this.suppressGetSessionWarning;
          e = new Proxy(e, {
            get: (c, l, u) => (!o && l === "user" && (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), o = !0, this.suppressGetSessionWarning = !0), Reflect.get(c, l, u))
          });
        }
        return { data: { session: e }, error: null };
      }
      const { session: n, error: i } = await this._callRefreshToken(e.refresh_token);
      return i ? { data: { session: null }, error: i } : { data: { session: n }, error: null };
    } finally {
      this._debug("#__loadSession()", "end");
    }
  }
  /**
   * Gets the current user details if there is an existing session. This method
   * performs a network request to the Supabase Auth server, so the returned
   * value is authentic and can be used to base authorization rules on.
   *
   * @param jwt Takes in an optional access token JWT. If no JWT is provided, the JWT from the current session is used.
   */
  async getUser(e) {
    return e ? await this._getUser(e) : (await this.initializePromise, await this._acquireLock(-1, async () => await this._getUser()));
  }
  async _getUser(e) {
    try {
      return e ? await _(this.fetch, "GET", `${this.url}/user`, {
        headers: this.headers,
        jwt: e,
        xform: K
      }) : await this._useSession(async (t) => {
        var r, n, i;
        const { data: o, error: a } = t;
        if (a)
          throw a;
        return !(!((r = o.session) === null || r === void 0) && r.access_token) && !this.hasCustomAuthorizationHeader ? { data: { user: null }, error: new W() } : await _(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (i = (n = o.session) === null || n === void 0 ? void 0 : n.access_token) !== null && i !== void 0 ? i : void 0,
          xform: K
        });
      });
    } catch (t) {
      if (v(t))
        return bi(t) && (await this._removeSession(), await Ue(this.storage, `${this.storageKey}-code-verifier`)), { data: { user: null }, error: t };
      throw t;
    }
  }
  /**
   * Updates user data for a logged in user.
   */
  async updateUser(e, t = {}) {
    return await this.initializePromise, await this._acquireLock(-1, async () => await this._updateUser(e, t));
  }
  async _updateUser(e, t = {}) {
    try {
      return await this._useSession(async (r) => {
        const { data: n, error: i } = r;
        if (i)
          throw i;
        if (!n.session)
          throw new W();
        const o = n.session;
        let a = null, c = null;
        this.flowType === "pkce" && e.email != null && ([a, c] = await ne(this.storage, this.storageKey));
        const { data: l, error: u } = await _(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: t == null ? void 0 : t.emailRedirectTo,
          body: Object.assign(Object.assign({}, e), { code_challenge: a, code_challenge_method: c }),
          jwt: o.access_token,
          xform: K
        });
        if (u)
          throw u;
        return o.user = l.user, await this._saveSession(o), await this._notifyAllSubscribers("USER_UPDATED", o), { data: { user: o.user }, error: null };
      });
    } catch (r) {
      if (v(r))
        return { data: { user: null }, error: r };
      throw r;
    }
  }
  /**
   * Sets the session data from the current session. If the current session is expired, setSession will take care of refreshing it to obtain a new session.
   * If the refresh token or access token in the current session is invalid, an error will be thrown.
   * @param currentSession The current session that minimally contains an access token and refresh token.
   */
  async setSession(e) {
    return await this.initializePromise, await this._acquireLock(-1, async () => await this._setSession(e));
  }
  async _setSession(e) {
    try {
      if (!e.access_token || !e.refresh_token)
        throw new W();
      const t = Date.now() / 1e3;
      let r = t, n = !0, i = null;
      const { payload: o } = st(e.access_token);
      if (o.exp && (r = o.exp, n = r <= t), n) {
        const { session: a, error: c } = await this._callRefreshToken(e.refresh_token);
        if (c)
          return { data: { user: null, session: null }, error: c };
        if (!a)
          return { data: { user: null, session: null }, error: null };
        i = a;
      } else {
        const { data: a, error: c } = await this._getUser(e.access_token);
        if (c)
          throw c;
        i = {
          access_token: e.access_token,
          refresh_token: e.refresh_token,
          user: a.user,
          token_type: "bearer",
          expires_in: r - t,
          expires_at: r
        }, await this._saveSession(i), await this._notifyAllSubscribers("SIGNED_IN", i);
      }
      return { data: { user: i.user, session: i }, error: null };
    } catch (t) {
      if (v(t))
        return { data: { session: null, user: null }, error: t };
      throw t;
    }
  }
  /**
   * Returns a new session, regardless of expiry status.
   * Takes in an optional current session. If not passed in, then refreshSession() will attempt to retrieve it from getSession().
   * If the current session's refresh token is invalid, an error will be thrown.
   * @param currentSession The current session. If passed in, it must contain a refresh token.
   */
  async refreshSession(e) {
    return await this.initializePromise, await this._acquireLock(-1, async () => await this._refreshSession(e));
  }
  async _refreshSession(e) {
    try {
      return await this._useSession(async (t) => {
        var r;
        if (!e) {
          const { data: o, error: a } = t;
          if (a)
            throw a;
          e = (r = o.session) !== null && r !== void 0 ? r : void 0;
        }
        if (!(e != null && e.refresh_token))
          throw new W();
        const { session: n, error: i } = await this._callRefreshToken(e.refresh_token);
        return i ? { data: { user: null, session: null }, error: i } : n ? { data: { user: n.user, session: n }, error: null } : { data: { user: null, session: null }, error: null };
      });
    } catch (t) {
      if (v(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Gets the session data from a URL string
   */
  async _getSessionFromURL(e, t) {
    try {
      if (!L())
        throw new Ie("No browser detected.");
      if (e.error || e.error_description || e.error_code)
        throw new Ie(e.error_description || "Error in URL with unspecified error_description", {
          error: e.error || "unspecified_error",
          code: e.error_code || "unspecified_code"
        });
      switch (t) {
        case "implicit":
          if (this.flowType === "pkce")
            throw new Jt("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit")
            throw new Ie("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (t === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", !0), !e.code)
          throw new Jt("No code detected.");
        const { data: k, error: y } = await this._exchangeCodeForSession(e.code);
        if (y)
          throw y;
        const b = new URL(window.location.href);
        return b.searchParams.delete("code"), window.history.replaceState(window.history.state, "", b.toString()), { data: { session: k.session, redirectType: null }, error: null };
      }
      const { provider_token: r, provider_refresh_token: n, access_token: i, refresh_token: o, expires_in: a, expires_at: c, token_type: l } = e;
      if (!i || !a || !o || !l)
        throw new Ie("No session defined in URL");
      const u = Math.round(Date.now() / 1e3), d = parseInt(a);
      let h = u + d;
      c && (h = parseInt(c));
      const f = h - u;
      f * 1e3 <= le && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${d}s`);
      const g = h - d;
      u - g >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", g, h, u) : u - g < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", g, h, u);
      const { data: m, error: p } = await this._getUser(i);
      if (p)
        throw p;
      const w = {
        provider_token: r,
        provider_refresh_token: n,
        access_token: i,
        expires_in: d,
        expires_at: h,
        refresh_token: o,
        token_type: l,
        user: m.user
      };
      return window.location.hash = "", this._debug("#_getSessionFromURL()", "clearing window.location.hash"), { data: { session: w, redirectType: e.type }, error: null };
    } catch (r) {
      if (v(r))
        return { data: { session: null, redirectType: null }, error: r };
      throw r;
    }
  }
  /**
   * Checks if the current URL contains parameters given by an implicit oauth grant flow (https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2)
   */
  _isImplicitGrantCallback(e) {
    return !!(e.access_token || e.error_description);
  }
  /**
   * Checks if the current URL and backing storage contain parameters given by a PKCE flow
   */
  async _isPKCECallback(e) {
    const t = await Le(this.storage, `${this.storageKey}-code-verifier`);
    return !!(e.code && t);
  }
  /**
   * Inside a browser context, `signOut()` will remove the logged in user from the browser session and log them out - removing all items from localstorage and then trigger a `"SIGNED_OUT"` event.
   *
   * For server-side management, you can revoke all refresh tokens for a user by passing a user's JWT through to `auth.api.signOut(JWT: string)`.
   * There is no way to revoke a user's access token jwt until it expires. It is recommended to set a shorter expiry on the jwt for this reason.
   *
   * If using `others` scope, no `SIGNED_OUT` event is fired!
   */
  async signOut(e = { scope: "global" }) {
    return await this.initializePromise, await this._acquireLock(-1, async () => await this._signOut(e));
  }
  async _signOut({ scope: e } = { scope: "global" }) {
    return await this._useSession(async (t) => {
      var r;
      const { data: n, error: i } = t;
      if (i)
        return { error: i };
      const o = (r = n.session) === null || r === void 0 ? void 0 : r.access_token;
      if (o) {
        const { error: a } = await this.admin.signOut(o, e);
        if (a && !(_i(a) && (a.status === 404 || a.status === 401 || a.status === 403)))
          return { error: a };
      }
      return e !== "others" && (await this._removeSession(), await Ue(this.storage, `${this.storageKey}-code-verifier`)), { error: null };
    });
  }
  /**
   * Receive a notification every time an auth event happens.
   * @param callback A callback function to be invoked when an auth event happens.
   */
  onAuthStateChange(e) {
    const t = ji(), r = {
      id: t,
      callback: e,
      unsubscribe: () => {
        this._debug("#unsubscribe()", "state change callback with id removed", t), this.stateChangeEmitters.delete(t);
      }
    };
    return this._debug("#onAuthStateChange()", "registered callback with id", t), this.stateChangeEmitters.set(t, r), (async () => (await this.initializePromise, await this._acquireLock(-1, async () => {
      this._emitInitialSession(t);
    })))(), { data: { subscription: r } };
  }
  async _emitInitialSession(e) {
    return await this._useSession(async (t) => {
      var r, n;
      try {
        const { data: { session: i }, error: o } = t;
        if (o)
          throw o;
        await ((r = this.stateChangeEmitters.get(e)) === null || r === void 0 ? void 0 : r.callback("INITIAL_SESSION", i)), this._debug("INITIAL_SESSION", "callback id", e, "session", i);
      } catch (i) {
        await ((n = this.stateChangeEmitters.get(e)) === null || n === void 0 ? void 0 : n.callback("INITIAL_SESSION", null)), this._debug("INITIAL_SESSION", "callback id", e, "error", i), console.error(i);
      }
    });
  }
  /**
   * Sends a password reset request to an email address. This method supports the PKCE flow.
   *
   * @param email The email address of the user.
   * @param options.redirectTo The URL to send the user to after they click the password reset link.
   * @param options.captchaToken Verification token received when the user completes the captcha on the site.
   */
  async resetPasswordForEmail(e, t = {}) {
    let r = null, n = null;
    this.flowType === "pkce" && ([r, n] = await ne(
      this.storage,
      this.storageKey,
      !0
      // isPasswordRecovery
    ));
    try {
      return await _(this.fetch, "POST", `${this.url}/recover`, {
        body: {
          email: e,
          code_challenge: r,
          code_challenge_method: n,
          gotrue_meta_security: { captcha_token: t.captchaToken }
        },
        headers: this.headers,
        redirectTo: t.redirectTo
      });
    } catch (i) {
      if (v(i))
        return { data: null, error: i };
      throw i;
    }
  }
  /**
   * Gets all the identities linked to a user.
   */
  async getUserIdentities() {
    var e;
    try {
      const { data: t, error: r } = await this.getUser();
      if (r)
        throw r;
      return { data: { identities: (e = t.user.identities) !== null && e !== void 0 ? e : [] }, error: null };
    } catch (t) {
      if (v(t))
        return { data: null, error: t };
      throw t;
    }
  }
  /**
   * Links an oauth identity to an existing user.
   * This method supports the PKCE flow.
   */
  async linkIdentity(e) {
    var t;
    try {
      const { data: r, error: n } = await this._useSession(async (i) => {
        var o, a, c, l, u;
        const { data: d, error: h } = i;
        if (h)
          throw h;
        const f = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, e.provider, {
          redirectTo: (o = e.options) === null || o === void 0 ? void 0 : o.redirectTo,
          scopes: (a = e.options) === null || a === void 0 ? void 0 : a.scopes,
          queryParams: (c = e.options) === null || c === void 0 ? void 0 : c.queryParams,
          skipBrowserRedirect: !0
        });
        return await _(this.fetch, "GET", f, {
          headers: this.headers,
          jwt: (u = (l = d.session) === null || l === void 0 ? void 0 : l.access_token) !== null && u !== void 0 ? u : void 0
        });
      });
      if (n)
        throw n;
      return L() && !(!((t = e.options) === null || t === void 0) && t.skipBrowserRedirect) && window.location.assign(r == null ? void 0 : r.url), { data: { provider: e.provider, url: r == null ? void 0 : r.url }, error: null };
    } catch (r) {
      if (v(r))
        return { data: { provider: e.provider, url: null }, error: r };
      throw r;
    }
  }
  /**
   * Unlinks an identity from a user by deleting it. The user will no longer be able to sign in with that identity once it's unlinked.
   */
  async unlinkIdentity(e) {
    try {
      return await this._useSession(async (t) => {
        var r, n;
        const { data: i, error: o } = t;
        if (o)
          throw o;
        return await _(this.fetch, "DELETE", `${this.url}/user/identities/${e.identity_id}`, {
          headers: this.headers,
          jwt: (n = (r = i.session) === null || r === void 0 ? void 0 : r.access_token) !== null && n !== void 0 ? n : void 0
        });
      });
    } catch (t) {
      if (v(t))
        return { data: null, error: t };
      throw t;
    }
  }
  /**
   * Generates a new JWT.
   * @param refreshToken A valid refresh token that was returned on login.
   */
  async _refreshAccessToken(e) {
    const t = `#_refreshAccessToken(${e.substring(0, 5)}...)`;
    this._debug(t, "begin");
    try {
      const r = Date.now();
      return await Li(async (n) => (n > 0 && await Ii(200 * Math.pow(2, n - 1)), this._debug(t, "refreshing attempt", n), await _(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: { refresh_token: e },
        headers: this.headers,
        xform: F
      })), (n, i) => {
        const o = 200 * Math.pow(2, n);
        return i && rt(i) && // retryable only if the request can be sent before the backoff overflows the tick duration
        Date.now() + o - r < le;
      });
    } catch (r) {
      if (this._debug(t, "error", r), v(r))
        return { data: { session: null, user: null }, error: r };
      throw r;
    } finally {
      this._debug(t, "end");
    }
  }
  _isValidSession(e) {
    return typeof e == "object" && e !== null && "access_token" in e && "refresh_token" in e && "expires_at" in e;
  }
  async _handleProviderSignIn(e, t) {
    const r = await this._getUrlForProvider(`${this.url}/authorize`, e, {
      redirectTo: t.redirectTo,
      scopes: t.scopes,
      queryParams: t.queryParams
    });
    return this._debug("#_handleProviderSignIn()", "provider", e, "options", t, "url", r), L() && !t.skipBrowserRedirect && window.location.assign(r), { data: { provider: e, url: r }, error: null };
  }
  /**
   * Recovers the session from LocalStorage and refreshes the token
   * Note: this method is async to accommodate for AsyncStorage e.g. in React native.
   */
  async _recoverAndRefresh() {
    var e;
    const t = "#_recoverAndRefresh()";
    this._debug(t, "begin");
    try {
      const r = await Le(this.storage, this.storageKey);
      if (this._debug(t, "session from storage", r), !this._isValidSession(r)) {
        this._debug(t, "session is not valid"), r !== null && await this._removeSession();
        return;
      }
      const n = ((e = r.expires_at) !== null && e !== void 0 ? e : 1 / 0) * 1e3 - Date.now() < tt;
      if (this._debug(t, `session has${n ? "" : " not"} expired with margin of ${tt}s`), n) {
        if (this.autoRefreshToken && r.refresh_token) {
          const { error: i } = await this._callRefreshToken(r.refresh_token);
          i && (console.error(i), rt(i) || (this._debug(t, "refresh failed with a non-retryable error, removing the session", i), await this._removeSession()));
        }
      } else
        await this._notifyAllSubscribers("SIGNED_IN", r);
    } catch (r) {
      this._debug(t, "error", r), console.error(r);
      return;
    } finally {
      this._debug(t, "end");
    }
  }
  async _callRefreshToken(e) {
    var t, r;
    if (!e)
      throw new W();
    if (this.refreshingDeferred)
      return this.refreshingDeferred.promise;
    const n = `#_callRefreshToken(${e.substring(0, 5)}...)`;
    this._debug(n, "begin");
    try {
      this.refreshingDeferred = new Ve();
      const { data: i, error: o } = await this._refreshAccessToken(e);
      if (o)
        throw o;
      if (!i.session)
        throw new W();
      await this._saveSession(i.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", i.session);
      const a = { session: i.session, error: null };
      return this.refreshingDeferred.resolve(a), a;
    } catch (i) {
      if (this._debug(n, "error", i), v(i)) {
        const o = { session: null, error: i };
        return rt(i) || await this._removeSession(), (t = this.refreshingDeferred) === null || t === void 0 || t.resolve(o), o;
      }
      throw (r = this.refreshingDeferred) === null || r === void 0 || r.reject(i), i;
    } finally {
      this.refreshingDeferred = null, this._debug(n, "end");
    }
  }
  async _notifyAllSubscribers(e, t, r = !0) {
    const n = `#_notifyAllSubscribers(${e})`;
    this._debug(n, "begin", t, `broadcast = ${r}`);
    try {
      this.broadcastChannel && r && this.broadcastChannel.postMessage({ event: e, session: t });
      const i = [], o = Array.from(this.stateChangeEmitters.values()).map(async (a) => {
        try {
          await a.callback(e, t);
        } catch (c) {
          i.push(c);
        }
      });
      if (await Promise.all(o), i.length > 0) {
        for (let a = 0; a < i.length; a += 1)
          console.error(i[a]);
        throw i[0];
      }
    } finally {
      this._debug(n, "end");
    }
  }
  /**
   * set currentSession and currentUser
   * process to _startAutoRefreshToken if possible
   */
  async _saveSession(e) {
    this._debug("#_saveSession()", e), this.suppressGetSessionWarning = !0, await Xr(this.storage, this.storageKey, e);
  }
  async _removeSession() {
    this._debug("#_removeSession()"), await Ue(this.storage, this.storageKey), await this._notifyAllSubscribers("SIGNED_OUT", null);
  }
  /**
   * Removes any registered visibilitychange callback.
   *
   * {@see #startAutoRefresh}
   * {@see #stopAutoRefresh}
   */
  _removeVisibilityChangedCallback() {
    this._debug("#_removeVisibilityChangedCallback()");
    const e = this.visibilityChangedCallback;
    this.visibilityChangedCallback = null;
    try {
      e && L() && (window != null && window.removeEventListener) && window.removeEventListener("visibilitychange", e);
    } catch (t) {
      console.error("removing visibilitychange callback failed", t);
    }
  }
  /**
   * This is the private implementation of {@link #startAutoRefresh}. Use this
   * within the library.
   */
  async _startAutoRefresh() {
    await this._stopAutoRefresh(), this._debug("#_startAutoRefresh()");
    const e = setInterval(() => this._autoRefreshTokenTick(), le);
    this.autoRefreshTicker = e, e && typeof e == "object" && typeof e.unref == "function" ? e.unref() : typeof Deno < "u" && typeof Deno.unrefTimer == "function" && Deno.unrefTimer(e), setTimeout(async () => {
      await this.initializePromise, await this._autoRefreshTokenTick();
    }, 0);
  }
  /**
   * This is the private implementation of {@link #stopAutoRefresh}. Use this
   * within the library.
   */
  async _stopAutoRefresh() {
    this._debug("#_stopAutoRefresh()");
    const e = this.autoRefreshTicker;
    this.autoRefreshTicker = null, e && clearInterval(e);
  }
  /**
   * Starts an auto-refresh process in the background. The session is checked
   * every few seconds. Close to the time of expiration a process is started to
   * refresh the session. If refreshing fails it will be retried for as long as
   * necessary.
   *
   * If you set the {@link GoTrueClientOptions#autoRefreshToken} you don't need
   * to call this function, it will be called for you.
   *
   * On browsers the refresh process works only when the tab/window is in the
   * foreground to conserve resources as well as prevent race conditions and
   * flooding auth with requests. If you call this method any managed
   * visibility change callback will be removed and you must manage visibility
   * changes on your own.
   *
   * On non-browser platforms the refresh process works *continuously* in the
   * background, which may not be desirable. You should hook into your
   * platform's foreground indication mechanism and call these methods
   * appropriately to conserve resources.
   *
   * {@see #stopAutoRefresh}
   */
  async startAutoRefresh() {
    this._removeVisibilityChangedCallback(), await this._startAutoRefresh();
  }
  /**
   * Stops an active auto refresh process running in the background (if any).
   *
   * If you call this method any managed visibility change callback will be
   * removed and you must manage visibility changes on your own.
   *
   * See {@link #startAutoRefresh} for more details.
   */
  async stopAutoRefresh() {
    this._removeVisibilityChangedCallback(), await this._stopAutoRefresh();
  }
  /**
   * Runs the auto refresh token tick.
   */
  async _autoRefreshTokenTick() {
    this._debug("#_autoRefreshTokenTick()", "begin");
    try {
      await this._acquireLock(0, async () => {
        try {
          const e = Date.now();
          try {
            return await this._useSession(async (t) => {
              const { data: { session: r } } = t;
              if (!r || !r.refresh_token || !r.expires_at) {
                this._debug("#_autoRefreshTokenTick()", "no session");
                return;
              }
              const n = Math.floor((r.expires_at * 1e3 - e) / le);
              this._debug("#_autoRefreshTokenTick()", `access token expires in ${n} ticks, a tick lasts ${le}ms, refresh threshold is ${_t} ticks`), n <= _t && await this._callRefreshToken(r.refresh_token);
            });
          } catch (t) {
            console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
          }
        } finally {
          this._debug("#_autoRefreshTokenTick()", "end");
        }
      });
    } catch (e) {
      if (e.isAcquireTimeout || e instanceof Yr)
        this._debug("auto refresh token tick lock not available");
      else
        throw e;
    }
  }
  /**
   * Registers callbacks on the browser / platform, which in-turn run
   * algorithms when the browser window/tab are in foreground. On non-browser
   * platforms it assumes always foreground.
   */
  async _handleVisibilityChange() {
    if (this._debug("#_handleVisibilityChange()"), !L() || !(window != null && window.addEventListener))
      return this.autoRefreshToken && this.startAutoRefresh(), !1;
    try {
      this.visibilityChangedCallback = async () => await this._onVisibilityChanged(!1), window == null || window.addEventListener("visibilitychange", this.visibilityChangedCallback), await this._onVisibilityChanged(!0);
    } catch (e) {
      console.error("_handleVisibilityChange", e);
    }
  }
  /**
   * Callback registered with `window.addEventListener('visibilitychange')`.
   */
  async _onVisibilityChanged(e) {
    const t = `#_onVisibilityChanged(${e})`;
    this._debug(t, "visibilityState", document.visibilityState), document.visibilityState === "visible" ? (this.autoRefreshToken && this._startAutoRefresh(), e || (await this.initializePromise, await this._acquireLock(-1, async () => {
      if (document.visibilityState !== "visible") {
        this._debug(t, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");
        return;
      }
      await this._recoverAndRefresh();
    }))) : document.visibilityState === "hidden" && this.autoRefreshToken && this._stopAutoRefresh();
  }
  /**
   * Generates the relevant login URL for a third-party provider.
   * @param options.redirectTo A URL or mobile address to send the user to after they are confirmed.
   * @param options.scopes A space-separated list of scopes granted to the OAuth application.
   * @param options.queryParams An object of key-value pairs containing query parameters granted to the OAuth application.
   */
  async _getUrlForProvider(e, t, r) {
    const n = [`provider=${encodeURIComponent(t)}`];
    if (r != null && r.redirectTo && n.push(`redirect_to=${encodeURIComponent(r.redirectTo)}`), r != null && r.scopes && n.push(`scopes=${encodeURIComponent(r.scopes)}`), this.flowType === "pkce") {
      const [i, o] = await ne(this.storage, this.storageKey), a = new URLSearchParams({
        code_challenge: `${encodeURIComponent(i)}`,
        code_challenge_method: `${encodeURIComponent(o)}`
      });
      n.push(a.toString());
    }
    if (r != null && r.queryParams) {
      const i = new URLSearchParams(r.queryParams);
      n.push(i.toString());
    }
    return r != null && r.skipBrowserRedirect && n.push(`skip_http_redirect=${r.skipBrowserRedirect}`), `${e}?${n.join("&")}`;
  }
  async _unenroll(e) {
    try {
      return await this._useSession(async (t) => {
        var r;
        const { data: n, error: i } = t;
        return i ? { data: null, error: i } : await _(this.fetch, "DELETE", `${this.url}/factors/${e.factorId}`, {
          headers: this.headers,
          jwt: (r = n == null ? void 0 : n.session) === null || r === void 0 ? void 0 : r.access_token
        });
      });
    } catch (t) {
      if (v(t))
        return { data: null, error: t };
      throw t;
    }
  }
  async _enroll(e) {
    try {
      return await this._useSession(async (t) => {
        var r, n;
        const { data: i, error: o } = t;
        if (o)
          return { data: null, error: o };
        const a = Object.assign({ friendly_name: e.friendlyName, factor_type: e.factorType }, e.factorType === "phone" ? { phone: e.phone } : { issuer: e.issuer }), { data: c, error: l } = await _(this.fetch, "POST", `${this.url}/factors`, {
          body: a,
          headers: this.headers,
          jwt: (r = i == null ? void 0 : i.session) === null || r === void 0 ? void 0 : r.access_token
        });
        return l ? { data: null, error: l } : (e.factorType === "totp" && (!((n = c == null ? void 0 : c.totp) === null || n === void 0) && n.qr_code) && (c.totp.qr_code = `data:image/svg+xml;utf-8,${c.totp.qr_code}`), { data: c, error: null });
      });
    } catch (t) {
      if (v(t))
        return { data: null, error: t };
      throw t;
    }
  }
  /**
   * {@see GoTrueMFAApi#verify}
   */
  async _verify(e) {
    return this._acquireLock(-1, async () => {
      try {
        return await this._useSession(async (t) => {
          var r;
          const { data: n, error: i } = t;
          if (i)
            return { data: null, error: i };
          const { data: o, error: a } = await _(this.fetch, "POST", `${this.url}/factors/${e.factorId}/verify`, {
            body: { code: e.code, challenge_id: e.challengeId },
            headers: this.headers,
            jwt: (r = n == null ? void 0 : n.session) === null || r === void 0 ? void 0 : r.access_token
          });
          return a ? { data: null, error: a } : (await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + o.expires_in }, o)), await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", o), { data: o, error: a });
        });
      } catch (t) {
        if (v(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
  /**
   * {@see GoTrueMFAApi#challenge}
   */
  async _challenge(e) {
    return this._acquireLock(-1, async () => {
      try {
        return await this._useSession(async (t) => {
          var r;
          const { data: n, error: i } = t;
          return i ? { data: null, error: i } : await _(this.fetch, "POST", `${this.url}/factors/${e.factorId}/challenge`, {
            body: { channel: e.channel },
            headers: this.headers,
            jwt: (r = n == null ? void 0 : n.session) === null || r === void 0 ? void 0 : r.access_token
          });
        });
      } catch (t) {
        if (v(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
  /**
   * {@see GoTrueMFAApi#challengeAndVerify}
   */
  async _challengeAndVerify(e) {
    const { data: t, error: r } = await this._challenge({
      factorId: e.factorId
    });
    return r ? { data: null, error: r } : await this._verify({
      factorId: e.factorId,
      challengeId: t.id,
      code: e.code
    });
  }
  /**
   * {@see GoTrueMFAApi#listFactors}
   */
  async _listFactors() {
    const { data: { user: e }, error: t } = await this.getUser();
    if (t)
      return { data: null, error: t };
    const r = (e == null ? void 0 : e.factors) || [], n = r.filter((o) => o.factor_type === "totp" && o.status === "verified"), i = r.filter((o) => o.factor_type === "phone" && o.status === "verified");
    return {
      data: {
        all: r,
        totp: n,
        phone: i
      },
      error: null
    };
  }
  /**
   * {@see GoTrueMFAApi#getAuthenticatorAssuranceLevel}
   */
  async _getAuthenticatorAssuranceLevel() {
    return this._acquireLock(-1, async () => await this._useSession(async (e) => {
      var t, r;
      const { data: { session: n }, error: i } = e;
      if (i)
        return { data: null, error: i };
      if (!n)
        return {
          data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
          error: null
        };
      const { payload: o } = st(n.access_token);
      let a = null;
      o.aal && (a = o.aal);
      let c = a;
      ((r = (t = n.user.factors) === null || t === void 0 ? void 0 : t.filter((d) => d.status === "verified")) !== null && r !== void 0 ? r : []).length > 0 && (c = "aal2");
      const u = o.amr || [];
      return { data: { currentLevel: a, nextLevel: c, currentAuthenticationMethods: u }, error: null };
    }));
  }
  async fetchJwk(e, t = { keys: [] }) {
    let r = t.keys.find((o) => o.kid === e);
    if (r || (r = this.jwks.keys.find((o) => o.kid === e), r && this.jwks_cached_at + wi > Date.now()))
      return r;
    const { data: n, error: i } = await _(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
      headers: this.headers
    });
    if (i)
      throw i;
    if (!n.keys || n.keys.length === 0)
      throw new Se("JWKS is empty");
    if (this.jwks = n, this.jwks_cached_at = Date.now(), r = n.keys.find((o) => o.kid === e), !r)
      throw new Se("No matching signing key found in JWKS");
    return r;
  }
  /**
   * @experimental This method may change in future versions.
   * @description Gets the claims from a JWT. If the JWT is symmetric JWTs, it will call getUser() to verify against the server. If the JWT is asymmetric, it will be verified against the JWKS using the WebCrypto API.
   */
  async getClaims(e, t = { keys: [] }) {
    try {
      let r = e;
      if (!r) {
        const { data: f, error: g } = await this.getSession();
        if (g || !f.session)
          return { data: null, error: g };
        r = f.session.access_token;
      }
      const { header: n, payload: i, signature: o, raw: { header: a, payload: c } } = st(r);
      if (Fi(i.exp), !n.kid || n.alg === "HS256" || !("crypto" in globalThis && "subtle" in globalThis.crypto)) {
        const { error: f } = await this.getUser(r);
        if (f)
          throw f;
        return {
          data: {
            claims: i,
            header: n,
            signature: o
          },
          error: null
        };
      }
      const l = zi(n.alg), u = await this.fetchJwk(n.kid, t), d = await crypto.subtle.importKey("jwk", u, l, !0, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(l, d, o, Ai(`${a}.${c}`)))
        throw new Se("Invalid JWT signature");
      return {
        data: {
          claims: i,
          header: n,
          signature: o
        },
        error: null
      };
    } catch (r) {
      if (v(r))
        return { data: null, error: r };
      throw r;
    }
  }
}
Ae.nextInstanceID = 0;
const oo = Ae;
class ao extends oo {
  constructor(e) {
    super(e);
  }
}
var co = function(s, e, t, r) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? i(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
class lo {
  /**
   * Create a new client for use in the browser.
   * @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
   * @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
   * @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
   * @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
   * @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
   * @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
   * @param options.realtime Options passed along to realtime-js constructor.
   * @param options.global.fetch A custom fetch implementation.
   * @param options.global.headers Any additional headers to send with each network request.
   */
  constructor(e, t, r) {
    var n, i, o;
    if (this.supabaseUrl = e, this.supabaseKey = t, !e)
      throw new Error("supabaseUrl is required.");
    if (!t)
      throw new Error("supabaseKey is required.");
    const a = hi(e), c = new URL(a);
    this.realtimeUrl = new URL("realtime/v1", c), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", c), this.storageUrl = new URL("storage/v1", c), this.functionsUrl = new URL("functions/v1", c);
    const l = `sb-${c.hostname.split(".")[0]}-auth-token`, u = {
      db: ni,
      realtime: oi,
      auth: Object.assign(Object.assign({}, ii), { storageKey: l }),
      global: si
    }, d = fi(r ?? {}, u);
    this.storageKey = (n = d.auth.storageKey) !== null && n !== void 0 ? n : "", this.headers = (i = d.global.headers) !== null && i !== void 0 ? i : {}, d.accessToken ? (this.accessToken = d.accessToken, this.auth = new Proxy({}, {
      get: (h, f) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(f)} is not possible`);
      }
    })) : this.auth = this._initSupabaseAuthClient((o = d.auth) !== null && o !== void 0 ? o : {}, this.headers, d.global.fetch), this.fetch = ui(t, this._getAccessToken.bind(this), d.global.fetch), this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, d.realtime)), this.rest = new On(new URL("rest/v1", c).href, {
      headers: this.headers,
      schema: d.db.schema,
      fetch: this.fetch
    }), d.accessToken || this._listenForAuthEvents();
  }
  /**
   * Supabase Functions allows you to deploy and invoke edge functions.
   */
  get functions() {
    return new Hs(this.functionsUrl.href, {
      headers: this.headers,
      customFetch: this.fetch
    });
  }
  /**
   * Supabase Storage allows you to manage user-generated content, such as photos or videos.
   */
  get storage() {
    return new ei(this.storageUrl.href, this.headers, this.fetch);
  }
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(e) {
    return this.rest.from(e);
  }
  // NOTE: signatures must be kept in sync with PostgrestClient.schema
  /**
   * Select a schema to query or perform an function (rpc) call.
   *
   * The schema needs to be on the list of exposed schemas inside Supabase.
   *
   * @param schema - The schema to query
   */
  schema(e) {
    return this.rest.schema(e);
  }
  // NOTE: signatures must be kept in sync with PostgrestClient.rpc
  /**
   * Perform a function call.
   *
   * @param fn - The function name to call
   * @param args - The arguments to pass to the function call
   * @param options - Named parameters
   * @param options.head - When set to `true`, `data` will not be returned.
   * Useful if you only need the count.
   * @param options.get - When set to `true`, the function will be called with
   * read-only access mode.
   * @param options.count - Count algorithm to use to count rows returned by the
   * function. Only applicable for [set-returning
   * functions](https://www.postgresql.org/docs/current/functions-srf.html).
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   */
  rpc(e, t = {}, r = {}) {
    return this.rest.rpc(e, t, r);
  }
  /**
   * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
   *
   * @param {string} name - The name of the Realtime channel.
   * @param {Object} opts - The options to pass to the Realtime channel.
   *
   */
  channel(e, t = { config: {} }) {
    return this.realtime.channel(e, t);
  }
  /**
   * Returns all Realtime channels.
   */
  getChannels() {
    return this.realtime.getChannels();
  }
  /**
   * Unsubscribes and removes Realtime channel from Realtime client.
   *
   * @param {RealtimeChannel} channel - The name of the Realtime channel.
   *
   */
  removeChannel(e) {
    return this.realtime.removeChannel(e);
  }
  /**
   * Unsubscribes and removes all Realtime channels from Realtime client.
   */
  removeAllChannels() {
    return this.realtime.removeAllChannels();
  }
  _getAccessToken() {
    var e, t;
    return co(this, void 0, void 0, function* () {
      if (this.accessToken)
        return yield this.accessToken();
      const { data: r } = yield this.auth.getSession();
      return (t = (e = r.session) === null || e === void 0 ? void 0 : e.access_token) !== null && t !== void 0 ? t : null;
    });
  }
  _initSupabaseAuthClient({ autoRefreshToken: e, persistSession: t, detectSessionInUrl: r, storage: n, storageKey: i, flowType: o, lock: a, debug: c }, l, u) {
    const d = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new ao({
      url: this.authUrl.href,
      headers: Object.assign(Object.assign({}, d), l),
      storageKey: i,
      autoRefreshToken: e,
      persistSession: t,
      detectSessionInUrl: r,
      storage: n,
      flowType: o,
      lock: a,
      debug: c,
      fetch: u,
      // auth checks if there is a custom authorizaiton header using this flag
      // so it knows whether to return an error when getUser is called with no session
      hasCustomAuthorizationHeader: "Authorization" in this.headers
    });
  }
  _initRealtimeClient(e) {
    return new Mn(this.realtimeUrl.href, Object.assign(Object.assign({}, e), { params: Object.assign({ apikey: this.supabaseKey }, e == null ? void 0 : e.params) }));
  }
  _listenForAuthEvents() {
    return this.auth.onAuthStateChange((t, r) => {
      this._handleTokenChanged(t, "CLIENT", r == null ? void 0 : r.access_token);
    });
  }
  _handleTokenChanged(e, t, r) {
    (e === "TOKEN_REFRESHED" || e === "SIGNED_IN") && this.changedAccessToken !== r ? this.changedAccessToken = r : e === "SIGNED_OUT" && (this.realtime.setAuth(), t == "STORAGE" && this.auth.signOut(), this.changedAccessToken = void 0);
  }
}
const uo = (s, e, t) => new lo(s, e, t), ho = "https://lpuqrzvokroazwlricgn.supabase.co", it = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdXFyenZva3JvYXp3bHJpY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTM2MzQsImV4cCI6MjA2NTI4OTYzNH0.bIItSJMzdx9BgXm5jOtTFI03yq94CLVHepiPQ0Xl_lU", R = uo(ho, it, {
  global: {
    headers: {
      apikey: it,
      Authorization: `Bearer ${it}`
    }
  },
  auth: {
    persistSession: !1,
    autoRefreshToken: !1,
    detectSessionInUrl: !1
  }
});
var pr;
const Lt = (pr = window.SMOOTHR_CONFIG) == null ? void 0 : pr.debug, De = (...s) => Lt && console.log("[Smoothr Orders]", ...s), rr = (...s) => Lt && console.warn("[Smoothr Orders]", ...s), fo = (...s) => Lt && console.error("[Smoothr Orders]", ...s);
async function Zr(s) {
  if (!s) return [];
  try {
    const { data: e, error: t } = await R.from("orders").select("*").eq("customer_id", s).order("order_date", { ascending: !1 });
    return t ? (fo("fetch error", t), []) : (De(`fetched ${e.length} records`), e || []);
  } catch (e) {
    return e("fetch error", e), [];
  }
}
async function es(s) {
  var a, c;
  if (typeof document > "u") return;
  const e = typeof s == "string" ? document.querySelector(s) : s || document, t = e.querySelector('[data-smoothr="order-list"]');
  if (!t) {
    rr("container not found");
    return;
  }
  const r = t.querySelector('[data-smoothr="order-card"]');
  if (!r) {
    rr("template not found");
    return;
  }
  const n = e.querySelector('[data-smoothr="no-orders"]');
  r.setAttribute("hidden", ""), t.querySelectorAll('[data-smoothr="order-card"]').forEach((l) => {
    l !== r && l.remove();
  });
  const i = (c = (a = window.smoothr) == null ? void 0 : a.auth) == null ? void 0 : c.user, o = await Zr(i == null ? void 0 : i.id);
  if (!o.length) {
    t.setAttribute("hidden", ""), n && (n.removeAttribute("hidden"), n.style.display = "flex");
    return;
  }
  t.removeAttribute("hidden"), n && (n.setAttribute("hidden", ""), n.style.display = "none"), o.forEach((l) => {
    De("rendering order object", l);
    const u = r.cloneNode(!0);
    u.removeAttribute("hidden"), u.style.display = "flex";
    const d = (f, g) => {
      const m = u.querySelector(f);
      m && (m.textContent = g ?? "");
    }, h = u.querySelector('[data-smoothr="order-date"]');
    if (h) {
      const f = new Date(l.order_date), g = navigator.language || "en-GB", m = f.toLocaleDateString(g, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      h.textContent = m;
    }
    d('[data-smoothr="order-number"]', l.order_number), d('[data-smoothr="customer-name"]', l.customer_name), De("customer email", l.customer_email), De("order price", l.total_price), d('[data-smoothr="order-email"]', l.customer_email), d(
      '[data-smoothr="order-price"]',
      `£${Number(l.total_price).toFixed(2)}`
    ), d('[data-smoothr="order-status"]', l.status), t.appendChild(u);
  });
}
const go = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  fetchOrderHistory: Zr,
  renderOrders: es
}, Symbol.toStringTag, { value: "Module" })), po = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), mo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), yo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
var mr;
const ts = typeof window < "u" && ((mr = window.SMOOTHR_CONFIG) == null ? void 0 : mr.debug), kt = (...s) => ts && console.log("[Smoothr Auth]", ...s);
const rs = (...s) => ts && console.error("[Smoothr Auth]", ...s);
function wo() {
  return typeof window < "u" ? window.location.origin : "";
}
function vo() {
  return typeof window < "u" ? window.location.origin : "";
}
function ot(s) {
  return /^\S+@\S+\.\S+$/.test(s);
}
function Ut(s) {
  let e = 0;
  return s.length >= 8 && e++, /[a-z]/.test(s) && e++, /[A-Z]/.test(s) && e++, /\d/.test(s) && e++, /[^A-Za-z0-9]/.test(s) && e++, e;
}
function ss(s, e) {
  const t = s.querySelector("[data-smoothr-password-strength]");
  if (!t) return;
  const r = Ut(e), n = r >= 4 ? "Strong" : r >= 3 ? "Medium" : "Weak";
  t.tagName === "PROGRESS" ? t.value = r : t.textContent = n;
}
function H(s, e) {
  if (s)
    if (e) {
      try {
        s.dataset.originalText = s.textContent;
      } catch {
      }
      s.textContent = "Loading...", s.disabled = !0;
    } else {
      try {
        s.dataset.originalText && (s.textContent = s.dataset.originalText, delete s.dataset.originalText);
      } catch {
      }
      s.disabled = !1;
    }
}
function ns(s, e) {
  let t = s;
  for (; t; ) {
    if (t.matches && t.matches(e)) return t;
    if (t.querySelector) {
      const r = t.querySelector(e);
      if (r) return r;
    }
    t = t.parentElement;
  }
  return null;
}
function A(s, e, t, r) {
  const n = ns(r || s, "[data-smoothr-error]") || s.querySelector("[data-smoothr-error]");
  n ? (n.removeAttribute("hidden"), n.textContent = e, n.style.display = "", n.focus && n.focus()) : (rs("No [data-smoothr-error] container found"), alert(e)), t && t.focus && t.focus();
}
function Be(s, e, t) {
  const r = ns(t || s, "[data-smoothr-success]") || s.querySelector("[data-smoothr-success]");
  r ? (r.removeAttribute("hidden"), r.textContent = e, r.style.display = "", r.focus && r.focus()) : (kt("No [data-smoothr-success] container found"), alert(e));
}
function is(s) {
  return s = s || "", s.replace(/^www\./, "").toLowerCase();
}
async function fe(s) {
  const e = is(window.location.hostname);
  try {
    const { data: t, error: r } = await R.from("stores").select(`${s}_redirect_url`).eq("store_domain", e).single();
    if (r || !t)
      throw r;
    return t[`${s}_redirect_url`] || window.location.origin;
  } catch (t) {
    return rs(t), window.location.origin;
  }
}
function os() {
  const s = R.auth.getUser().then(async ({ data: { user: e } }) => {
    var t, r;
    if (typeof window < "u") {
      window.smoothr = window.smoothr || {}, window.smoothr.auth = { user: e || null }, e ? kt(`%c✅ Smoothr Auth: Logged in as ${e.email}`, "color: #22c55e; font-weight: bold;") : kt("%c🔒 Smoothr Auth: Not logged in", "color: #f87171; font-weight: bold;");
      const n = typeof localStorage < "u" ? localStorage : typeof globalThis < "u" ? globalThis.localStorage : void 0;
      if (((t = n == null ? void 0 : n.getItem) == null ? void 0 : t.call(n, "smoothr_oauth")) && e) {
        document.dispatchEvent(new CustomEvent("smoothr:login", { detail: { user: e } })), (r = n == null ? void 0 : n.removeItem) == null || r.call(n, "smoothr_oauth");
        const o = await fe("login");
        window.location.href = o;
      }
    }
  });
  return document.addEventListener("DOMContentLoaded", () => {
    Et(), us(), typeof MutationObserver < "u" && new MutationObserver(() => Et()).observe(document.body, { childList: !0, subtree: !0 });
  }), s;
}
async function as() {
  await fe("login"), typeof window < "u" && localStorage.setItem("smoothr_oauth", "1"), await R.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: wo() }
  });
}
async function cs(s, e) {
  const { data: t, error: r } = await R.auth.signUp({ email: s, password: e });
  return !r && typeof window < "u" && (window.smoothr = window.smoothr || {}, window.smoothr.auth = { user: t.user || null }), { data: t, error: r };
}
async function ls(s) {
  return await R.auth.resetPasswordForEmail(s, {
    redirectTo: vo()
  });
}
function _o({ redirectTo: s = "/" } = {}) {
  document.addEventListener("DOMContentLoaded", () => {
    const e = new URLSearchParams(window.location.hash.slice(1)), t = e.get("access_token"), r = e.get("refresh_token");
    t && r && R.auth.setSession({ access_token: t, refresh_token: r }), document.querySelectorAll('form[data-smoothr="password-reset-confirm"]').forEach((n) => {
      const i = n.querySelector('[data-smoothr-input="password"]');
      i && i.addEventListener && i.addEventListener("input", () => {
        ss(n, i.value);
      }), n.addEventListener && n.addEventListener("submit", async (o) => {
        o.preventDefault();
        const a = n.querySelector('[data-smoothr-input="password-confirm"]'), c = (i == null ? void 0 : i.value) || "", l = (a == null ? void 0 : a.value) || "";
        if (Ut(c) < 3) {
          A(n, "Weak password", i, n);
          return;
        }
        if (c !== l) {
          A(n, "Passwords do not match", a, n);
          return;
        }
        const u = n.querySelector('[type="submit"]');
        H(u, !0);
        try {
          const { data: d, error: h } = await R.auth.updateUser({ password: c });
          h ? A(n, h.message || "Password update failed", u, n) : (typeof window < "u" && (window.smoothr = window.smoothr || {}, window.smoothr.auth = { user: d.user || null }), Be(n, "Password updated", n), setTimeout(() => {
            window.location.href = s;
          }, 1e3));
        } catch (d) {
          A(n, d.message || "Password update failed", u, n);
        } finally {
          H(u, !1);
        }
      });
    });
  });
}
let Et = () => {
}, us = () => {
};
function bo(s, e) {
  Et = s, us = e;
}
var yr;
const So = (yr = window.SMOOTHR_CONFIG) == null ? void 0 : yr.debug, at = (...s) => So && console.log("[Smoothr Auth]", ...s);
function sr(s, e, t) {
  try {
    s && s.dataset && (s.dataset[e] = t);
  } catch {
  }
}
function ko(s = document) {
  s.querySelectorAll('[data-smoothr="login"], [data-smoothr="signup"], [data-smoothr="login-google"], [data-smoothr="password-reset"]').forEach((t) => {
    var o;
    if (t.dataset.smoothrBoundAuth) return;
    sr(t, "smoothrBoundAuth", "1");
    const r = t.getAttribute("data-smoothr"), n = (a) => {
      t.tagName === "FORM" ? t.addEventListener && t.addEventListener("submit", a) : t.addEventListener && t.addEventListener("click", a);
    }, i = t.tagName === "FORM" ? t : t.closest("form");
    switch (r) {
      case "login": {
        i && t !== i && !((o = i.dataset) != null && o.smoothrBoundLoginSubmit) && (sr(i, "smoothrBoundLoginSubmit", "1"), i.addEventListener && i.addEventListener("submit", (a) => {
          a.preventDefault(), t.dispatchEvent && t.dispatchEvent(new Event("click", { bubbles: !0, cancelable: !0 }));
        })), n(async (a) => {
          a.preventDefault();
          const c = i;
          if (!c) return;
          const l = c.querySelector('[data-smoothr-input="email"]'), u = c.querySelector('[data-smoothr-input="password"]'), d = (l == null ? void 0 : l.value) || "", h = (u == null ? void 0 : u.value) || "";
          if (!ot(d)) {
            A(c, "Enter a valid email address", l, t);
            return;
          }
          H(t, !0);
          try {
            const { data: f, error: g } = await R.auth.signInWithPassword({
              email: d,
              password: h
            });
            if (g)
              A(c, g.message || "Invalid credentials", l, t);
            else {
              typeof window < "u" && (window.smoothr = window.smoothr || {}, window.smoothr.auth = { user: f.user || null }), Be(c, "Logged in, redirecting...", t), document.dispatchEvent(
                new CustomEvent("smoothr:login", { detail: f })
              );
              const m = await fe("login");
              setTimeout(() => {
                window.location.href = m;
              }, 1e3);
            }
          } catch (f) {
            A(c, f.message || "Network error", l, t);
          } finally {
            H(t, !1);
          }
        });
        break;
      }
      case "login-google": {
        n(async (a) => {
          a.preventDefault(), await as();
        });
        break;
      }
      case "signup": {
        if (i) {
          const a = i.querySelector('[data-smoothr-input="password"]');
          a && a.addEventListener && a.addEventListener("input", () => {
            ss(i, a.value);
          });
        }
        n(async (a) => {
          a.preventDefault();
          const c = i;
          if (!c) return;
          const l = c.querySelector('[data-smoothr-input="email"]'), u = c.querySelector('[data-smoothr-input="password"]'), d = c.querySelector('[data-smoothr-input="password-confirm"]'), h = (l == null ? void 0 : l.value) || "", f = (u == null ? void 0 : u.value) || "", g = (d == null ? void 0 : d.value) || "";
          if (!ot(h)) {
            A(c, "Enter a valid email address", l, t);
            return;
          }
          if (Ut(f) < 3) {
            A(c, "Weak password", u, t);
            return;
          }
          if (f !== g) {
            A(c, "Passwords do not match", d, t);
            return;
          }
          const m = c.querySelector('[type="submit"]');
          H(m, !0);
          try {
            const { data: p, error: w } = await cs(h, f);
            if (w)
              A(c, w.message || "Signup failed", l, t);
            else {
              typeof window < "u" && (window.smoothr = window.smoothr || {}, window.smoothr.auth = { user: p.user || null }), document.dispatchEvent(new CustomEvent("smoothr:login", { detail: p })), Be(c, "Account created! Redirecting...", t);
              const k = await fe("login");
              setTimeout(() => {
                window.location.href = k;
              }, 1e3);
            }
          } catch (p) {
            A(c, p.message || "Network error", l, t);
          } finally {
            H(m, !1);
          }
        });
        break;
      }
      case "password-reset": {
        n(async (a) => {
          a.preventDefault();
          const c = i;
          if (!c) return;
          const l = c.querySelector('[data-smoothr-input="email"]'), u = (l == null ? void 0 : l.value) || "";
          if (!ot(u)) {
            A(c, "Enter a valid email address", l, t);
            return;
          }
          const d = c.querySelector('[type="submit"]');
          H(d, !0);
          try {
            const { error: h } = await ls(u);
            h ? A(
              c,
              h.message || "Error requesting password reset",
              l,
              t
            ) : Be(c, "Check your email for a reset link.", t);
          } catch (h) {
            A(
              c,
              h.message || "Error requesting password reset",
              l,
              t
            );
          } finally {
            H(d, !1);
          }
        });
        break;
      }
    }
  });
}
function Eo() {
  document.querySelectorAll('[data-smoothr="logout"]').forEach((s) => {
    s.addEventListener("click", async (e) => {
      e.preventDefault();
      const { error: t } = await R.auth.signOut();
      t && at(t);
      const {
        data: { user: r }
      } = await R.auth.getUser();
      typeof window < "u" && (window.smoothr = window.smoothr || {}, window.smoothr.auth = { user: r || null }, r ? at(`%c✅ Smoothr Auth: Logged in as ${r.email}`, "color: #22c55e; font-weight: bold;") : at("%c🔒 Smoothr Auth: Not logged in", "color: #f87171; font-weight: bold;")), document.dispatchEvent(new CustomEvent("smoothr:logout"));
      const n = await fe("logout");
      window.location.href = n;
    });
  });
}
bo(ko, Eo);
const To = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  initAuth: os,
  initPasswordResetConfirmation: _o,
  lookupRedirectUrl: fe,
  normalizeDomain: is,
  requestPasswordReset: ls,
  signInWithGoogle: as,
  signUp: cs
}, Symbol.toStringTag, { value: "Module" }));
function ae(s) {
  if (typeof document > "u") return;
  let e = 0;
  const t = setInterval(() => {
    const r = document.querySelector(s), n = r == null ? void 0 : r.querySelector("iframe");
    n ? (n.style.width = "100%", n.style.minWidth = "100%", n.style.display = "block", n.style.opacity = "1", r && (r.style.width = "100%", r.style.minWidth = "100%", typeof window < "u" && window.getComputedStyle(r).position === "static" && (r.style.position = "relative")), console.log(`[Smoothr Stripe] Forced iframe styles for ${s}`), clearInterval(t)) : ++e >= 20 && clearInterval(t);
  }, 100);
}
let Tt = !1, nr = 0, ue, M, ct, lt, q, B;
var wr;
const ds = (wr = window.SMOOTHR_CONFIG) == null ? void 0 : wr.debug, D = (...s) => ds && console.log("[Smoothr Stripe]", ...s), te = (...s) => ds && console.warn("[Smoothr Stripe]", ...s);
if (typeof document < "u" && typeof document.createElement == "function" && !document.querySelector("#smoothr-card-styles")) {
  const s = document.createElement("style");
  s.id = "smoothr-card-styles", s.textContent = `[data-smoothr-card-number],
[data-smoothr-card-expiry],
[data-smoothr-card-cvc]{display:block;position:relative;}
iframe[data-accept-id]{display:block!important;}`, document.head.appendChild(s);
}
async function hs(s, e = 1e3) {
  if (!(!s || typeof s.getBoundingClientRect != "function")) {
    D("Waiting for element to be visible", s);
    for (let t = 0; t < 10; t++) {
      if (s.getBoundingClientRect().width > 10) {
        D("Element visible", s);
        return;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    te("Element still invisible after timeout", s);
  }
}
async function Ee(s, e = 1500) {
  if (!s || typeof s.getBoundingClientRect != "function") return;
  D("Waiting for mount target to be visible and clickable");
  const t = Math.ceil(e / 100);
  for (let r = 0; r < t; r++) {
    if (s.offsetParent !== null && s.getBoundingClientRect().width > 10 && document.activeElement !== s) {
      D("Target ready → mounting...");
      return;
    }
    await new Promise((n) => setTimeout(n, 100));
  }
  te("Mount target not interactable after 1.5s");
}
function ut(s) {
  if (!s || typeof window > "u" || typeof window.getComputedStyle != "function") return {};
  const e = window.getComputedStyle(s), t = {
    base: {
      fontSize: e.fontSize,
      color: e.color,
      fontFamily: e.fontFamily,
      backgroundColor: e.backgroundColor,
      borderColor: e.borderColor,
      borderWidth: e.borderWidth,
      borderStyle: e.borderStyle,
      borderRadius: e.borderRadius,
      padding: e.padding
    }
  };
  return console.log("[Stripe] element style from container", t), t;
}
async function Oo() {
  var t;
  if (lt) return lt;
  const s = window.SMOOTHR_CONFIG || {};
  let e = s.stripeKey;
  if (e)
    D("Loaded key from window.SMOOTHR_CONFIG");
  else {
    const r = s.storeId;
    if (r) {
      const n = await qt(r);
      if (n != null && n.stripeKey && (e = n.stripeKey, D("Loaded key from Supabase.store_settings")), !e)
        try {
          const { data: i, error: o } = await R.from("store_integrations").select("api_key, settings").eq("store_id", r).eq("provider", "stripe").maybeSingle();
          o ? te("Integration lookup failed:", o.message || o) : i && (e = i.api_key || ((t = i.settings) == null ? void 0 : t.public_key) || "", e && D(
            "Loaded key from Supabase." + (i.api_key ? "store_integrations.api_key" : "store_integrations.settings.public_key")
          ));
        } catch (i) {
          te("Integration fetch error:", (i == null ? void 0 : i.message) || i);
        }
    }
  }
  if (!e)
    throw new Error("❌ Stripe key not found — aborting Stripe mount.");
  return lt = e, s.stripeKey || (s.stripeKey = e), e;
}
async function Qe() {
  return ue && M ? { stripe: ue, elements: M } : (ct || (ct = (async () => {
    const s = await Oo();
    return s ? (D("Using Stripe key", s), ue = Stripe(s), M = ue.elements(), { stripe: ue, elements: M }) : { stripe: null, elements: null };
  })()), ct);
}
async function Dt() {
  if (B) return B;
  if (!Tt)
    return B = (async () => {
      D("Mounting split fields");
      const s = document.querySelector("[data-smoothr-card-number]"), e = document.querySelector("[data-smoothr-card-expiry]"), t = document.querySelector("[data-smoothr-card-cvc]");
      if (D("Targets found", {
        number: !!s,
        expiry: !!e,
        cvc: !!t
      }), !s && !e && !t) {
        nr < 5 ? (nr++, B = null, setTimeout(Dt, 200)) : (te("card fields not found"), B = null);
        return;
      }
      const { elements: r } = await Qe();
      if (!r) {
        B = null;
        return;
      }
      Tt = !0;
      const n = r.getElement ? r.getElement("cardNumber") : null;
      if (s && !n) {
        await Ee(s);
        const a = ut(s);
        console.log("[Stripe] cardNumber style", a);
        const c = M.create("cardNumber", { style: a });
        c.mount("[data-smoothr-card-number]"), console.log("[Stripe] Mounted iframe"), setTimeout(() => {
          var d;
          const l = document.querySelector("[data-smoothr-card-number] iframe"), u = l == null ? void 0 : l.getBoundingClientRect().width;
          console.log("[Stripe] iframe bbox", u), l && u < 10 && (console.warn("[Stripe] iframe dead → remounting now..."), (d = q == null ? void 0 : q.unmount) == null || d.call(q), q = M.create("cardNumber", { style: a }), q.mount("[data-smoothr-card-number]"), ae("[data-smoothr-card-number]"));
        }, 500), ae("[data-smoothr-card-number]"), q = c;
      }
      const i = r.getElement ? r.getElement("cardExpiry") : null;
      if (e && !i) {
        await Ee(e);
        const a = ut(e);
        console.log("[Stripe] cardExpiry style", a);
        const c = M.create("cardExpiry", { style: a });
        c.mount("[data-smoothr-card-expiry]"), console.log("[Stripe] Mounted iframe"), setTimeout(() => {
          var d;
          const l = document.querySelector("[data-smoothr-card-expiry] iframe"), u = l == null ? void 0 : l.getBoundingClientRect().width;
          console.log("[Stripe] iframe bbox", u), l && u < 10 && (console.warn("[Stripe] iframe dead → remounting now..."), (d = c == null ? void 0 : c.unmount) == null || d.call(c), M.create("cardExpiry", { style: a }).mount("[data-smoothr-card-expiry]"), ae("[data-smoothr-card-expiry]"));
        }, 500), ae("[data-smoothr-card-expiry]");
      }
      const o = r.getElement ? r.getElement("cardCvc") : null;
      if (t && !o) {
        await Ee(t);
        const a = ut(t);
        console.log("[Stripe] cardCvc style", a);
        const c = M.create("cardCvc", { style: a });
        c.mount("[data-smoothr-card-cvc]"), console.log("[Stripe] Mounted iframe"), setTimeout(() => {
          var d;
          const l = document.querySelector("[data-smoothr-card-cvc] iframe"), u = l == null ? void 0 : l.getBoundingClientRect().width;
          console.log("[Stripe] iframe bbox", u), l && u < 10 && (console.warn("[Stripe] iframe dead → remounting now..."), (d = c == null ? void 0 : c.unmount) == null || d.call(c), M.create("cardCvc", { style: a }).mount("[data-smoothr-card-cvc]"), ae("[data-smoothr-card-cvc]"));
        }, 500), ae("[data-smoothr-card-cvc]");
      }
      D("Mounted split fields");
    })(), B = B.finally(() => {
      B = null;
    }), B;
}
function fs() {
  return Tt;
}
function Bt() {
  return !!ue && !!q;
}
async function qt(s) {
  if (!s) return null;
  try {
    const { data: e, error: t } = await R.from("store_settings").select("settings").eq("store_id", s).maybeSingle();
    return t ? (te("Store settings lookup failed:", t.message || t), null) : (e == null ? void 0 : e.settings) || null;
  } catch (e) {
    return te("Store settings fetch error:", (e == null ? void 0 : e.message) || e), null;
  }
}
async function gs(s) {
  if (!Bt())
    return { error: { message: "Stripe not ready" } };
  const { stripe: e, elements: t } = await Qe();
  if (!e || !t)
    return { error: { message: "Stripe not ready" } };
  const r = q || (typeof t.getElement == "function" ? t.getElement("cardNumber") : null), n = await e.createPaymentMethod({
    type: "card",
    card: r,
    billing_details: s
  });
  return {
    error: n.error || null,
    payment_method: n.paymentMethod || null
  };
}
const Co = {
  mountCardFields: Dt,
  isMounted: fs,
  ready: Bt,
  getStoreSettings: qt,
  getElements: Qe,
  createPaymentMethod: gs,
  waitForVisible: hs,
  waitForInteractable: Ee
}, ps = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createPaymentMethod: gs,
  default: Co,
  getElements: Qe,
  getStoreSettings: qt,
  isMounted: fs,
  mountCardFields: Dt,
  ready: Bt,
  waitForInteractable: Ee,
  waitForVisible: hs
}, Symbol.toStringTag, { value: "Module" }));
var vr;
const ha = typeof window < "u" && ((vr = window.SMOOTHR_CONFIG) == null ? void 0 : vr.debug);
function Ao() {
  var s;
  return typeof window < "u" && ((s = window.SMOOTHR_CONFIG) == null ? void 0 : s.liveRatesToken) || typeof process < "u" && process.env.LIVE_RATES_AUTH_TOKEN;
}
const $o = "https://<your-project-id>.functions.supabase.co/proxy-live-rates?base=GBP&symbols=USD,EUR,GBP";
async function Po(s = "GBP", e = ["USD", "EUR", "GBP"], t) {
  if (typeof fetch > "u") return null;
  const r = "smoothrRatesCache";
  if (typeof window < "u")
    try {
      const n = JSON.parse(localStorage.getItem(r) || "null");
      if (n && n.base === s && Date.now() - n.timestamp < 864e5 && e.every((i) => n.rates[i]))
        return n.rates;
    } catch {
    }
  try {
    const n = t || $o;
    let i = n;
    const o = [];
    /[?&]base=/.test(n) || o.push(`base=${encodeURIComponent(s)}`), /[?&]symbols=/.test(n) || o.push(`symbols=${e.join(",")}`), o.length && (i += (n.includes("?") ? "&" : "?") + o.join("&"));
    const a = {
      Accept: "application/json"
    };
    typeof window > "u" && (a["User-Agent"] = "SmoothrCurrencyBot/1.0");
    try {
      const { hostname: d, pathname: h } = new URL(i);
      if (d.endsWith(".functions.supabase.co") && h === "/proxy-live-rates") {
        const f = Ao();
        f && (a.Authorization = `Token ${f}`);
      }
    } catch {
    }
    const c = await fetch(i, {
      headers: a,
      redirect: "manual"
    });
    if (!c.ok) throw new Error("Failed to fetch rates");
    const l = await c.json(), u = {};
    if (e.forEach((d) => {
      typeof l.rates[d] == "number" && (u[d] = l.rates[d]);
    }), typeof window < "u" && !l.fallback)
      try {
        localStorage.setItem(
          r,
          JSON.stringify({ timestamp: Date.now(), base: s, rates: u })
        );
      } catch {
      }
    return u;
  } catch {
    return null;
  }
}
typeof window < "u" && (window.Smoothr = window.Smoothr || {}, window.Smoothr.cart = { ...$t });
let ir = !1, or = !1, ar = !1;
var _r;
const J = (_r = window.SMOOTHR_CONFIG) == null ? void 0 : _r.debug, Z = (...s) => J && console.log("[Smoothr Cart]", ...s), ce = (...s) => J && console.warn("[Smoothr Cart]", ...s);
function Ne() {
  var t, r;
  if (J && !ir && (Z("🧩 initCartBindings loaded and executing"), ir = !0), typeof document > "u") return;
  const s = window.Smoothr || window.smoothr;
  if (!((t = s == null ? void 0 : s.cart) != null && t.addItem)) {
    ce("cart module not found");
    return;
  }
  const e = document.querySelectorAll("[data-smoothr-add]");
  if (J && !ar && Z(`found ${e.length} [data-smoothr-add] elements`), ar = !0, e.length === 0) {
    if ((((r = window.location) == null ? void 0 : r.pathname) || "").includes("/checkout")) {
      J && Z("🧩 addToCart polling disabled on checkout page");
      return;
    }
    or || (ce("no buttons found; retrying..."), or = !0), setTimeout(Ne, 500);
    return;
  }
  e.forEach((n) => {
    J && Z("🔗 binding [data-smoothr-add] button", n), !n.__smoothrBound && (n.__smoothrBound = !0, n.addEventListener("click", (i) => {
      var o, a, c;
      (o = i == null ? void 0 : i.preventDefault) == null || o.call(i), (a = i == null ? void 0 : i.stopPropagation) == null || a.call(i), J && Z("🛒 Add to cart clicked:", n);
      try {
        const l = n.getAttribute("data-product-price") || "0", u = Math.round(parseFloat(l) * 100), d = n.getAttribute("data-product-id"), h = n.getAttribute("data-product-name"), f = n.getAttribute("data-product-options"), g = n.getAttribute("data-product-subscription") === "true";
        if (!d || !h || isNaN(u)) {
          ce("Missing required cart attributes on:", n);
          return;
        }
        const m = n.closest("[data-smoothr-product]");
        let p = "", w = n;
        for (; w && !p; ) {
          const y = (c = w.querySelector) == null ? void 0 : c.call(w, "[data-smoothr-image]");
          y != null && y.src && (p = y.src), w = w.parentElement;
        }
        m || ce(`No [data-smoothr-product] found for product "${d}"`), p || ce(`No [data-smoothr-image] found for product "${d}"`);
        const k = {
          product_id: d,
          name: h,
          price: u,
          quantity: 1,
          options: f ? JSON.parse(f) : void 0,
          isSubscription: g,
          image: p
        };
        s.cart.addItem(k), typeof window.renderCart == "function" ? (J && Z("🧼 Calling renderCart() to update UI"), window.renderCart()) : ce("renderCart not found");
      } catch (l) {
        l("addToCart failed", l);
      }
    }));
  });
}
function jo() {
  document.addEventListener("DOMContentLoaded", () => {
    Z("✅ DOM ready – calling initCartBindings"), Ne();
  });
}
typeof window < "u" && jo();
function dt(s) {
  var e, t;
  return typeof window > "u" ? ((e = s == null ? void 0 : s.currency) == null ? void 0 : e.baseCurrency) || "USD" : localStorage.getItem("smoothr:currency") || ((t = s == null ? void 0 : s.currency) == null ? void 0 : t.baseCurrency) || "USD";
}
function xo() {
  typeof document > "u" || document.querySelectorAll("[data-smoothr-template]").forEach((s) => s.style.display = "none");
}
function Te() {
  var i, o, a, c;
  const s = (i = window.SMOOTHR_CONFIG) == null ? void 0 : i.debug;
  if (s && console.log("🎨 renderCart() triggered"), typeof document > "u") return;
  setTimeout(() => xo(), 50);
  const e = window.Smoothr || window.smoothr;
  if (!(e != null && e.cart)) return;
  const t = e.cart.getCart(), r = e.cart.getTotal(), n = ((o = e.currency) == null ? void 0 : o.format) || ((a = e.currency) == null ? void 0 : a.formatPrice) || ((c = e.currency) == null ? void 0 : c.formatCurrency);
  document.querySelectorAll("[data-smoothr-total]").forEach((l) => {
    var f;
    const u = r / 100, d = dt(e);
    let h = u;
    (f = e.currency) != null && f.convertPrice && (h = e.currency.convertPrice(
      u,
      d,
      e.currency.baseCurrency
    )), l.dataset.smoothrBase = u, l.setAttribute("data-smoothr-total", h), n ? l.textContent = n(h, d) : l.textContent = String(h);
  }), document.querySelectorAll("[data-smoothr-cart]").forEach((l) => {
    l.querySelectorAll(".cart-rendered").forEach((d) => d.remove());
    const u = l.querySelector("[data-smoothr-template]");
    if (!u) {
      s && console.warn("renderCart: no [data-smoothr-template] found", l);
      return;
    }
    u.style.display = "none", t.items.forEach((d) => {
      const h = u.cloneNode(!0);
      h.classList.add("cart-rendered", "smoothr-cart-rendered"), h.removeAttribute("data-smoothr-template"), h.style.display = "", h.querySelectorAll("[data-smoothr-name]").forEach((g) => {
        g.textContent = d.name || "";
      }), h.querySelectorAll("[data-smoothr-options]").forEach((g) => {
        d.options && (Array.isArray(d.options) ? g.textContent = d.options.join(", ") : typeof d.options == "object" ? g.textContent = Object.values(d.options).join(", ") : g.textContent = d.options);
      }), h.querySelectorAll("[data-smoothr-quantity]").forEach((g) => {
        g.textContent = String(d.quantity);
      }), h.querySelectorAll("[data-smoothr-price]").forEach((g) => {
        var k;
        const m = d.price / 100, p = dt(e);
        let w = m;
        (k = e.currency) != null && k.convertPrice && (w = e.currency.convertPrice(
          m,
          p,
          e.currency.baseCurrency
        )), g.dataset.smoothrBase = m, g.setAttribute("data-smoothr-price", w), n ? g.textContent = n(w, p) : g.textContent = String(w);
      }), h.querySelectorAll("[data-smoothr-subtotal]").forEach((g) => {
        var k;
        const m = d.price * d.quantity / 100, p = dt(e);
        let w = m;
        (k = e.currency) != null && k.convertPrice && (w = e.currency.convertPrice(
          m,
          p,
          e.currency.baseCurrency
        )), g.dataset.smoothrBase = m, g.setAttribute("data-smoothr-subtotal", w), g.textContent = n ? n(w, p) : String(w);
      });
      const f = h.querySelector("[data-smoothr-image]");
      f && (f.tagName === "IMG" ? (d.image ? f.src = d.image : f.removeAttribute("src"), f.alt = d.name || "") : f.style.backgroundImage = d.image ? `url(${d.image})` : ""), h.querySelectorAll("[data-smoothr-remove]").forEach((g) => {
        g.setAttribute("data-smoothr-remove", d.product_id), g.__smoothrBound || (g.addEventListener("click", () => e.cart.removeItem(d.product_id)), g.__smoothrBound = !0);
      }), u.parentNode.insertBefore(h, u.nextSibling);
    });
  }), document.querySelectorAll("[data-smoothr-remove]").forEach((l) => {
    if (l.__smoothrBound) return;
    const u = l.getAttribute("data-smoothr-remove");
    l.addEventListener("click", () => e.cart.removeItem(u)), l.__smoothrBound = !0;
  });
}
typeof window < "u" && (document.addEventListener("DOMContentLoaded", Te), window.addEventListener("smoothr:cart:updated", Te), window.renderCart = Te);
const Ro = '[data-smoothr-price], [data-smoothr-total], [data-smoothr="price"]';
function Io(s) {
  return parseFloat(s.replace(/[£$€]/g, "").replace(/[\,\s]/g, ""));
}
function Lo(s, e) {
  let t = parseFloat(s.dataset.smoothrBase);
  return isNaN(t) && (t = parseFloat(s.getAttribute(e)) || Io(s.textContent || ""), isNaN(t) || (s.dataset.smoothrBase = t)), t;
}
function Uo() {
  return typeof window > "u" ? $ : localStorage.getItem("smoothr:currency") || $;
}
function Do(s) {
  typeof window > "u" || (localStorage.setItem("smoothr:currency", s), document.dispatchEvent(
    new CustomEvent("smoothr:currencychange", { detail: { currency: s } })
  ));
}
function cr() {
  const s = Uo();
  document.querySelectorAll(Ro).forEach((e) => {
    const t = e.hasAttribute("data-smoothr-total") ? "data-smoothr-total" : "data-smoothr-price", r = Lo(e, t);
    if (isNaN(r)) return;
    const n = Oe(r, s, $);
    e.textContent = Ce(n, s), e.setAttribute(t, n);
  });
}
function Bo() {
  typeof document > "u" || (cr(), document.addEventListener("smoothr:currencychange", cr));
}
typeof window < "u" && Bo();
const $e = '[data-smoothr-price], [data-smoothr-total], [data-smoothr="price"]', lr = [
  ".w-commerce-commerceproductprice",
  ".w-commerce-commercecartitemprice",
  ".product-price"
];
function ms(s) {
  return parseFloat(
    s.replace(/[£$€]/g, "").replace(/[,\s]/g, "")
  );
}
function qo(s, e) {
  let t = parseFloat(s.dataset.smoothrBase);
  return isNaN(t) && (t = parseFloat(s.getAttribute(e)) || ms(s.textContent || ""), isNaN(t) || (s.dataset.smoothrBase = t)), t;
}
function Mo() {
  return typeof window > "u" ? $ : localStorage.getItem("smoothr:currency") || $;
}
function Ot(s) {
  typeof window > "u" || (localStorage.setItem("smoothr:currency", s), document.dispatchEvent(
    new CustomEvent("smoothr:currencychange", { detail: { currency: s } })
  ));
}
function Fe(s) {
  const e = s.hasAttribute("data-smoothr-total") ? "data-smoothr-total" : "data-smoothr-price", t = qo(s, e);
  if (isNaN(t)) return;
  const r = Mo(), n = Oe(t, r, $);
  s.textContent = Ce(n, r), s.setAttribute(e, n);
}
function Ct(s = document) {
  const e = [];
  s.matches && (lr.some((t) => s.matches(t)) || s.matches($e)) && e.push(s), s.querySelectorAll && s.querySelectorAll([...lr, $e].join(",")).forEach((t) => e.push(t)), e.forEach((t) => {
    var n;
    const r = t.hasAttribute("data-smoothr-total") ? "data-smoothr-total" : "data-smoothr-price";
    if (!t.hasAttribute(r)) {
      const i = ms(t.textContent || "");
      isNaN(i) || (t.dataset.smoothrBase = i, (n = window.SMOOTHR_CONFIG) != null && n.debug && console.log("smoothr:bind-price", t, i));
    }
    Fe(t);
  });
}
function ur(s = document) {
  Ct(s), s.querySelectorAll($e).forEach(Fe);
}
function ht(s = document) {
  if (s.id && s.id.startsWith("currency-")) {
    const e = s.id.slice(9).toUpperCase();
    s.__smoothrCurrencyBound || (s.addEventListener("click", () => Ot(e)), s.__smoothrCurrencyBound = !0);
  }
  s.querySelectorAll('[id^="currency-"]').forEach((e) => {
    const t = e.id.slice(9).toUpperCase();
    e.__smoothrCurrencyBound || (e.addEventListener("click", () => Ot(t)), e.__smoothrCurrencyBound = !0);
  });
}
function No() {
  if (typeof document > "u") return;
  const s = typeof MutationObserver < "u" ? new MutationObserver((e) => {
    e.forEach((t) => {
      t.addedNodes.forEach((r) => {
        var n;
        r.nodeType === 1 && (Ct(r), r.matches && r.matches($e) && Fe(r), r.matches && ((n = r.id) != null && n.startsWith("currency-")) && ht(r), r.querySelectorAll && (r.querySelectorAll($e).forEach(Fe), r.querySelectorAll('[id^="currency-"]').forEach((i) => ht(i))));
      });
    });
  }) : null;
  document.addEventListener("DOMContentLoaded", () => {
    Ct(), ur(), ht(), s == null || s.observe(document.body, { childList: !0, subtree: !0 });
  }), document.addEventListener("smoothr:currencychange", () => ur());
}
typeof window < "u" && No();
const Fo = "[data-smoothr-price], [data-smoothr-total]";
function zo(s) {
  return parseFloat(s.replace(/[£$€]/g, "").replace(/[\,\s]/g, ""));
}
function Wo(s, e) {
  let t = parseFloat(s.dataset.smoothrBase);
  return isNaN(t) && (t = parseFloat(s.getAttribute(e)) || zo(s.textContent || ""), isNaN(t) || (s.dataset.smoothrBase = t)), t;
}
function Go() {
  return typeof window > "u" ? $ : localStorage.getItem("smoothr:currency") || $;
}
function ys(s) {
  typeof window > "u" || (localStorage.setItem("smoothr:currency", s), document.dispatchEvent(
    new CustomEvent("smoothr:currencychange", { detail: { currency: s } })
  ));
}
function dr() {
  const s = Go();
  document.querySelectorAll(Fo).forEach((e) => {
    const t = e.hasAttribute("data-smoothr-total") ? "data-smoothr-total" : "data-smoothr-price", r = Wo(e, t);
    if (isNaN(r)) return;
    const n = Oe(r, s, $);
    e.textContent = Ce(n, s), e.setAttribute(t, n);
  });
}
function Ho(s = document) {
  s.querySelectorAll('[id^="currency-"]').forEach((e) => {
    const t = e.id.slice(9).toUpperCase();
    e.__smoothrCurrencyBound || (e.addEventListener("click", () => ys(t)), e.__smoothrCurrencyBound = !0);
  });
}
function Jo() {
  typeof document > "u" || (document.addEventListener("DOMContentLoaded", () => {
    dr(), Ho();
  }), document.addEventListener("smoothr:currencychange", dr));
}
typeof window < "u" && Jo();
var br;
const Ko = typeof window < "u" && ((br = window.SMOOTHR_CONFIG) == null ? void 0 : br.debug), _e = (...s) => Ko && console.log("[Smoothr SDK]", ...s);
_e("Smoothr SDK loaded");
const Vo = "https://<your-project-id>.functions.supabase.co/proxy-live-rates?base=GBP&symbols=USD,EUR,GBP", hr = {
  abandonedCart: ks,
  affiliates: Es,
  analytics: Ts,
  currency: Os,
  dashboard: Cs,
  discounts: As,
  cart: $t,
  orders: go,
  returns: po,
  reviews: mo,
  subscriptions: yo,
  auth: To,
  checkout: ps
};
let At = Do;
if (typeof window < "u") {
  const s = window.SMOOTHR_CONFIG || {};
  if (typeof document < "u" && typeof document.createElement == "function" && !document.querySelector("#smoothr-card-styles")) {
    const n = document.createElement("style");
    n.id = "smoothr-card-styles", n.textContent = `[data-smoothr-card-number],
[data-smoothr-card-expiry],
[data-smoothr-card-cvc]{display:block;position:relative;}
iframe[data-accept-id]{display:block!important;}`, document.head.appendChild(n);
  }
  s.baseCurrency && Tr(s.baseCurrency), s.rates && ft(s.rates);
  const e = s.baseCurrency || $, t = s.rates ? Object.keys(s.rates) : Object.keys(V), r = s.rateSource || Vo;
  if (s.debug) {
    let n = r;
    /[?&]base=/.test(r) || (n += (n.includes("?") ? "&" : "?") + `base=${encodeURIComponent(e)}`), /[?&]symbols=/.test(r) || (n += (n.includes("?") ? "&" : "?") + `symbols=${t.join(",")}`), _e("smoothr:live-rates-url", n);
  }
  Po(e, t, s.rateSource).then((n) => {
    n && (ft(n), s.debug && _e("smoothr:live-rates", n));
  }).catch(() => {
  }), s.platform === "webflow-ecom" ? At = Ot : s.platform === "cms" && (At = ys), window.Smoothr = hr, window.smoothr = window.smoothr || hr, window.renderCart = Te, _e("🎨 renderCart registered in SDK"), window.Smoothr = window.Smoothr || {}, window.Smoothr.cart = { ...$t, ...window.Smoothr.cart || {} }, window.Smoothr.cart.renderCart = Te, window.Smoothr.checkout = ps, window.initCartBindings = Ne, document.addEventListener("DOMContentLoaded", () => {
    _e("✅ DOM ready – calling initCartBindings"), Ne();
  }), Promise.resolve(os()).then(() => {
    var n, i;
    (i = (n = window.smoothr) == null ? void 0 : n.auth) != null && i.user && es();
  });
}
globalThis.setSelectedCurrency = globalThis.setSelectedCurrency || At;
export {
  ks as abandonedCart,
  Es as affiliates,
  Ts as analytics,
  To as auth,
  $t as cart,
  ps as checkout,
  Os as currency,
  Cs as dashboard,
  hr as default,
  As as discounts,
  go as orders,
  po as returns,
  mo as reviews,
  yo as subscriptions
};
