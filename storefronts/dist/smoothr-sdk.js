const Kr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Hr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Gr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Vr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Qr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Xr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Yr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Zr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), ei = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), ti = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Pt = (r) => {
  let e;
  return r ? e = r : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => Y).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
};
class De extends Error {
  constructor(e, t = "FunctionsError", s) {
    super(e), this.name = t, this.context = s;
  }
}
class At extends De {
  constructor(e) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", e);
  }
}
class Rt extends De {
  constructor(e) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", e);
  }
}
class xt extends De {
  constructor(e) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e);
  }
}
var $e;
(function(r) {
  r.Any = "any", r.ApNortheast1 = "ap-northeast-1", r.ApNortheast2 = "ap-northeast-2", r.ApSouth1 = "ap-south-1", r.ApSoutheast1 = "ap-southeast-1", r.ApSoutheast2 = "ap-southeast-2", r.CaCentral1 = "ca-central-1", r.EuCentral1 = "eu-central-1", r.EuWest1 = "eu-west-1", r.EuWest2 = "eu-west-2", r.EuWest3 = "eu-west-3", r.SaEast1 = "sa-east-1", r.UsEast1 = "us-east-1", r.UsWest1 = "us-west-1", r.UsWest2 = "us-west-2";
})($e || ($e = {}));
var Ct = function(r, e, t, s) {
  function i(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        h(s.next(c));
      } catch (u) {
        o(u);
      }
    }
    function l(c) {
      try {
        h(s.throw(c));
      } catch (u) {
        o(u);
      }
    }
    function h(c) {
      c.done ? n(c.value) : i(c.value).then(a, l);
    }
    h((s = s.apply(r, e || [])).next());
  });
};
class It {
  constructor(e, { headers: t = {}, customFetch: s, region: i = $e.Any } = {}) {
    this.url = e, this.headers = t, this.region = i, this.fetch = Pt(s);
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
    var s;
    return Ct(this, void 0, void 0, function* () {
      try {
        const { headers: i, method: n, body: o } = t;
        let a = {}, { region: l } = t;
        l || (l = this.region), l && l !== "any" && (a["x-region"] = l);
        let h;
        o && (i && !Object.prototype.hasOwnProperty.call(i, "Content-Type") || !i) && (typeof Blob < "u" && o instanceof Blob || o instanceof ArrayBuffer ? (a["Content-Type"] = "application/octet-stream", h = o) : typeof o == "string" ? (a["Content-Type"] = "text/plain", h = o) : typeof FormData < "u" && o instanceof FormData ? h = o : (a["Content-Type"] = "application/json", h = JSON.stringify(o)));
        const c = yield this.fetch(`${this.url}/${e}`, {
          method: n || "POST",
          // headers priority is (high to low):
          // 1. invoke-level headers
          // 2. client-level headers
          // 3. default Content-Type header
          headers: Object.assign(Object.assign(Object.assign({}, a), this.headers), i),
          body: h
        }).catch((v) => {
          throw new At(v);
        }), u = c.headers.get("x-relay-error");
        if (u && u === "true")
          throw new Rt(c);
        if (!c.ok)
          throw new xt(c);
        let d = ((s = c.headers.get("Content-Type")) !== null && s !== void 0 ? s : "text/plain").split(";")[0].trim(), f;
        return d === "application/json" ? f = yield c.json() : d === "application/octet-stream" ? f = yield c.blob() : d === "text/event-stream" ? f = c : d === "multipart/form-data" ? f = yield c.formData() : f = yield c.text(), { data: f, error: null };
      } catch (i) {
        return { data: null, error: i };
      }
    });
  }
}
var R = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Ut(r) {
  if (r.__esModule) return r;
  var e = r.default;
  if (typeof e == "function") {
    var t = function s() {
      return this instanceof s ? Reflect.construct(e, arguments, this.constructor) : e.apply(this, arguments);
    };
    t.prototype = e.prototype;
  } else t = {};
  return Object.defineProperty(t, "__esModule", { value: !0 }), Object.keys(r).forEach(function(s) {
    var i = Object.getOwnPropertyDescriptor(r, s);
    Object.defineProperty(t, s, i.get ? i : {
      enumerable: !0,
      get: function() {
        return r[s];
      }
    });
  }), t;
}
var P = {}, Be = {}, pe = {}, oe = {}, _e = {}, ve = {}, Lt = function() {
  if (typeof self < "u")
    return self;
  if (typeof window < "u")
    return window;
  if (typeof global < "u")
    return global;
  throw new Error("unable to locate global object");
}, Q = Lt();
const Dt = Q.fetch, it = Q.fetch.bind(Q), nt = Q.Headers, Bt = Q.Request, qt = Q.Response, Y = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Headers: nt,
  Request: Bt,
  Response: qt,
  default: it,
  fetch: Dt
}, Symbol.toStringTag, { value: "Module" })), Mt = /* @__PURE__ */ Ut(Y);
var we = {};
Object.defineProperty(we, "__esModule", { value: !0 });
let Nt = class extends Error {
  constructor(e) {
    super(e.message), this.name = "PostgrestError", this.details = e.details, this.hint = e.hint, this.code = e.code;
  }
};
we.default = Nt;
var ot = R && R.__importDefault || function(r) {
  return r && r.__esModule ? r : { default: r };
};
Object.defineProperty(ve, "__esModule", { value: !0 });
const Ft = ot(Mt), zt = ot(we);
let Wt = class {
  constructor(e) {
    this.shouldThrowOnError = !1, this.method = e.method, this.url = e.url, this.headers = e.headers, this.schema = e.schema, this.body = e.body, this.shouldThrowOnError = e.shouldThrowOnError, this.signal = e.signal, this.isMaybeSingle = e.isMaybeSingle, e.fetch ? this.fetch = e.fetch : typeof fetch > "u" ? this.fetch = Ft.default : this.fetch = fetch;
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
    const s = this.fetch;
    let i = s(this.url.toString(), {
      method: this.method,
      headers: this.headers,
      body: JSON.stringify(this.body),
      signal: this.signal
    }).then(async (n) => {
      var o, a, l;
      let h = null, c = null, u = null, d = n.status, f = n.statusText;
      if (n.ok) {
        if (this.method !== "HEAD") {
          const k = await n.text();
          k === "" || (this.headers.Accept === "text/csv" || this.headers.Accept && this.headers.Accept.includes("application/vnd.pgrst.plan+text") ? c = k : c = JSON.parse(k));
        }
        const y = (o = this.headers.Prefer) === null || o === void 0 ? void 0 : o.match(/count=(exact|planned|estimated)/), p = (a = n.headers.get("content-range")) === null || a === void 0 ? void 0 : a.split("/");
        y && p && p.length > 1 && (u = parseInt(p[1])), this.isMaybeSingle && this.method === "GET" && Array.isArray(c) && (c.length > 1 ? (h = {
          // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
          code: "PGRST116",
          details: `Results contain ${c.length} rows, application/vnd.pgrst.object+json requires 1 row`,
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned"
        }, c = null, u = null, d = 406, f = "Not Acceptable") : c.length === 1 ? c = c[0] : c = null);
      } else {
        const y = await n.text();
        try {
          h = JSON.parse(y), Array.isArray(h) && n.status === 404 && (c = [], h = null, d = 200, f = "OK");
        } catch {
          n.status === 404 && y === "" ? (d = 204, f = "No Content") : h = {
            message: y
          };
        }
        if (h && this.isMaybeSingle && (!((l = h == null ? void 0 : h.details) === null || l === void 0) && l.includes("0 rows")) && (h = null, d = 200, f = "OK"), h && this.shouldThrowOnError)
          throw new zt.default(h);
      }
      return {
        error: h,
        data: c,
        count: u,
        status: d,
        statusText: f
      };
    });
    return this.shouldThrowOnError || (i = i.catch((n) => {
      var o, a, l;
      return {
        error: {
          message: `${(o = n == null ? void 0 : n.name) !== null && o !== void 0 ? o : "FetchError"}: ${n == null ? void 0 : n.message}`,
          details: `${(a = n == null ? void 0 : n.stack) !== null && a !== void 0 ? a : ""}`,
          hint: "",
          code: `${(l = n == null ? void 0 : n.code) !== null && l !== void 0 ? l : ""}`
        },
        data: null,
        count: null,
        status: 0,
        statusText: ""
      };
    })), i.then(e, t);
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
ve.default = Wt;
var Jt = R && R.__importDefault || function(r) {
  return r && r.__esModule ? r : { default: r };
};
Object.defineProperty(_e, "__esModule", { value: !0 });
const Kt = Jt(ve);
let Ht = class extends Kt.default {
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
    const s = (e ?? "*").split("").map((i) => /\s/.test(i) && !t ? "" : (i === '"' && (t = !t), i)).join("");
    return this.url.searchParams.set("select", s), this.headers.Prefer && (this.headers.Prefer += ","), this.headers.Prefer += "return=representation", this;
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
  order(e, { ascending: t = !0, nullsFirst: s, foreignTable: i, referencedTable: n = i } = {}) {
    const o = n ? `${n}.order` : "order", a = this.url.searchParams.get(o);
    return this.url.searchParams.set(o, `${a ? `${a},` : ""}${e}.${t ? "asc" : "desc"}${s === void 0 ? "" : s ? ".nullsfirst" : ".nullslast"}`), this;
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
  limit(e, { foreignTable: t, referencedTable: s = t } = {}) {
    const i = typeof s > "u" ? "limit" : `${s}.limit`;
    return this.url.searchParams.set(i, `${e}`), this;
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
  range(e, t, { foreignTable: s, referencedTable: i = s } = {}) {
    const n = typeof i > "u" ? "offset" : `${i}.offset`, o = typeof i > "u" ? "limit" : `${i}.limit`;
    return this.url.searchParams.set(n, `${e}`), this.url.searchParams.set(o, `${t - e + 1}`), this;
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
  explain({ analyze: e = !1, verbose: t = !1, settings: s = !1, buffers: i = !1, wal: n = !1, format: o = "text" } = {}) {
    var a;
    const l = [
      e ? "analyze" : null,
      t ? "verbose" : null,
      s ? "settings" : null,
      i ? "buffers" : null,
      n ? "wal" : null
    ].filter(Boolean).join("|"), h = (a = this.headers.Accept) !== null && a !== void 0 ? a : "application/json";
    return this.headers.Accept = `application/vnd.pgrst.plan+${o}; for="${h}"; options=${l};`, o === "json" ? this : this;
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
_e.default = Ht;
var Gt = R && R.__importDefault || function(r) {
  return r && r.__esModule ? r : { default: r };
};
Object.defineProperty(oe, "__esModule", { value: !0 });
const Vt = Gt(_e);
let Qt = class extends Vt.default {
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
    const s = Array.from(new Set(t)).map((i) => typeof i == "string" && new RegExp("[,()]").test(i) ? `"${i}"` : `${i}`).join(",");
    return this.url.searchParams.append(e, `in.(${s})`), this;
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
  textSearch(e, t, { config: s, type: i } = {}) {
    let n = "";
    i === "plain" ? n = "pl" : i === "phrase" ? n = "ph" : i === "websearch" && (n = "w");
    const o = s === void 0 ? "" : `(${s})`;
    return this.url.searchParams.append(e, `${n}fts${o}.${t}`), this;
  }
  /**
   * Match only rows where each column in `query` keys is equal to its
   * associated value. Shorthand for multiple `.eq()`s.
   *
   * @param query - The object to filter with, with column names as keys mapped
   * to their filter values
   */
  match(e) {
    return Object.entries(e).forEach(([t, s]) => {
      this.url.searchParams.append(t, `eq.${s}`);
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
  not(e, t, s) {
    return this.url.searchParams.append(e, `not.${t}.${s}`), this;
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
  or(e, { foreignTable: t, referencedTable: s = t } = {}) {
    const i = s ? `${s}.or` : "or";
    return this.url.searchParams.append(i, `(${e})`), this;
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
  filter(e, t, s) {
    return this.url.searchParams.append(e, `${t}.${s}`), this;
  }
};
oe.default = Qt;
var Xt = R && R.__importDefault || function(r) {
  return r && r.__esModule ? r : { default: r };
};
Object.defineProperty(pe, "__esModule", { value: !0 });
const ee = Xt(oe);
let Yt = class {
  constructor(e, { headers: t = {}, schema: s, fetch: i }) {
    this.url = e, this.headers = t, this.schema = s, this.fetch = i;
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
  select(e, { head: t = !1, count: s } = {}) {
    const i = t ? "HEAD" : "GET";
    let n = !1;
    const o = (e ?? "*").split("").map((a) => /\s/.test(a) && !n ? "" : (a === '"' && (n = !n), a)).join("");
    return this.url.searchParams.set("select", o), s && (this.headers.Prefer = `count=${s}`), new ee.default({
      method: i,
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
  insert(e, { count: t, defaultToNull: s = !0 } = {}) {
    const i = "POST", n = [];
    if (this.headers.Prefer && n.push(this.headers.Prefer), t && n.push(`count=${t}`), s || n.push("missing=default"), this.headers.Prefer = n.join(","), Array.isArray(e)) {
      const o = e.reduce((a, l) => a.concat(Object.keys(l)), []);
      if (o.length > 0) {
        const a = [...new Set(o)].map((l) => `"${l}"`);
        this.url.searchParams.set("columns", a.join(","));
      }
    }
    return new ee.default({
      method: i,
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
  upsert(e, { onConflict: t, ignoreDuplicates: s = !1, count: i, defaultToNull: n = !0 } = {}) {
    const o = "POST", a = [`resolution=${s ? "ignore" : "merge"}-duplicates`];
    if (t !== void 0 && this.url.searchParams.set("on_conflict", t), this.headers.Prefer && a.push(this.headers.Prefer), i && a.push(`count=${i}`), n || a.push("missing=default"), this.headers.Prefer = a.join(","), Array.isArray(e)) {
      const l = e.reduce((h, c) => h.concat(Object.keys(c)), []);
      if (l.length > 0) {
        const h = [...new Set(l)].map((c) => `"${c}"`);
        this.url.searchParams.set("columns", h.join(","));
      }
    }
    return new ee.default({
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
    const s = "PATCH", i = [];
    return this.headers.Prefer && i.push(this.headers.Prefer), t && i.push(`count=${t}`), this.headers.Prefer = i.join(","), new ee.default({
      method: s,
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
    const t = "DELETE", s = [];
    return e && s.push(`count=${e}`), this.headers.Prefer && s.unshift(this.headers.Prefer), this.headers.Prefer = s.join(","), new ee.default({
      method: t,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
pe.default = Yt;
var ye = {}, me = {};
Object.defineProperty(me, "__esModule", { value: !0 });
me.version = void 0;
me.version = "0.0.0-automated";
Object.defineProperty(ye, "__esModule", { value: !0 });
ye.DEFAULT_HEADERS = void 0;
const Zt = me;
ye.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${Zt.version}` };
var at = R && R.__importDefault || function(r) {
  return r && r.__esModule ? r : { default: r };
};
Object.defineProperty(Be, "__esModule", { value: !0 });
const es = at(pe), ts = at(oe), ss = ye;
let rs = class lt {
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
  constructor(e, { headers: t = {}, schema: s, fetch: i } = {}) {
    this.url = e, this.headers = Object.assign(Object.assign({}, ss.DEFAULT_HEADERS), t), this.schemaName = s, this.fetch = i;
  }
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(e) {
    const t = new URL(`${this.url}/${e}`);
    return new es.default(t, {
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
    return new lt(this.url, {
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
  rpc(e, t = {}, { head: s = !1, get: i = !1, count: n } = {}) {
    let o;
    const a = new URL(`${this.url}/rpc/${e}`);
    let l;
    s || i ? (o = s ? "HEAD" : "GET", Object.entries(t).filter(([c, u]) => u !== void 0).map(([c, u]) => [c, Array.isArray(u) ? `{${u.join(",")}}` : `${u}`]).forEach(([c, u]) => {
      a.searchParams.append(c, u);
    })) : (o = "POST", l = t);
    const h = Object.assign({}, this.headers);
    return n && (h.Prefer = `count=${n}`), new ts.default({
      method: o,
      url: a,
      headers: h,
      schema: this.schemaName,
      body: l,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
Be.default = rs;
var Z = R && R.__importDefault || function(r) {
  return r && r.__esModule ? r : { default: r };
};
Object.defineProperty(P, "__esModule", { value: !0 });
P.PostgrestError = P.PostgrestBuilder = P.PostgrestTransformBuilder = P.PostgrestFilterBuilder = P.PostgrestQueryBuilder = P.PostgrestClient = void 0;
const ct = Z(Be);
P.PostgrestClient = ct.default;
const ht = Z(pe);
P.PostgrestQueryBuilder = ht.default;
const ut = Z(oe);
P.PostgrestFilterBuilder = ut.default;
const dt = Z(_e);
P.PostgrestTransformBuilder = dt.default;
const ft = Z(ve);
P.PostgrestBuilder = ft.default;
const gt = Z(we);
P.PostgrestError = gt.default;
var is = P.default = {
  PostgrestClient: ct.default,
  PostgrestQueryBuilder: ht.default,
  PostgrestFilterBuilder: ut.default,
  PostgrestTransformBuilder: dt.default,
  PostgrestBuilder: ft.default,
  PostgrestError: gt.default
};
const {
  PostgrestClient: ns,
  PostgrestQueryBuilder: ai,
  PostgrestFilterBuilder: li,
  PostgrestTransformBuilder: ci,
  PostgrestBuilder: hi,
  PostgrestError: ui
} = is;
let Pe;
typeof window > "u" ? Pe = require("ws") : Pe = window.WebSocket;
const os = "2.11.10", as = { "X-Client-Info": `realtime-js/${os}` }, ls = "1.0.0", pt = 1e4, cs = 1e3;
var V;
(function(r) {
  r[r.connecting = 0] = "connecting", r[r.open = 1] = "open", r[r.closing = 2] = "closing", r[r.closed = 3] = "closed";
})(V || (V = {}));
var E;
(function(r) {
  r.closed = "closed", r.errored = "errored", r.joined = "joined", r.joining = "joining", r.leaving = "leaving";
})(E || (E = {}));
var C;
(function(r) {
  r.close = "phx_close", r.error = "phx_error", r.join = "phx_join", r.reply = "phx_reply", r.leave = "phx_leave", r.access_token = "access_token";
})(C || (C = {}));
var Ae;
(function(r) {
  r.websocket = "websocket";
})(Ae || (Ae = {}));
var F;
(function(r) {
  r.Connecting = "connecting", r.Open = "open", r.Closing = "closing", r.Closed = "closed";
})(F || (F = {}));
class hs {
  constructor() {
    this.HEADER_LENGTH = 1;
  }
  decode(e, t) {
    return e.constructor === ArrayBuffer ? t(this._binaryDecode(e)) : t(typeof e == "string" ? JSON.parse(e) : {});
  }
  _binaryDecode(e) {
    const t = new DataView(e), s = new TextDecoder();
    return this._decodeBroadcast(e, t, s);
  }
  _decodeBroadcast(e, t, s) {
    const i = t.getUint8(1), n = t.getUint8(2);
    let o = this.HEADER_LENGTH + 2;
    const a = s.decode(e.slice(o, o + i));
    o = o + i;
    const l = s.decode(e.slice(o, o + n));
    o = o + n;
    const h = JSON.parse(s.decode(e.slice(o, e.byteLength)));
    return { ref: null, topic: a, event: l, payload: h };
  }
}
class _t {
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
var b;
(function(r) {
  r.abstime = "abstime", r.bool = "bool", r.date = "date", r.daterange = "daterange", r.float4 = "float4", r.float8 = "float8", r.int2 = "int2", r.int4 = "int4", r.int4range = "int4range", r.int8 = "int8", r.int8range = "int8range", r.json = "json", r.jsonb = "jsonb", r.money = "money", r.numeric = "numeric", r.oid = "oid", r.reltime = "reltime", r.text = "text", r.time = "time", r.timestamp = "timestamp", r.timestamptz = "timestamptz", r.timetz = "timetz", r.tsrange = "tsrange", r.tstzrange = "tstzrange";
})(b || (b = {}));
const ze = (r, e, t = {}) => {
  var s;
  const i = (s = t.skipTypes) !== null && s !== void 0 ? s : [];
  return Object.keys(e).reduce((n, o) => (n[o] = us(o, r, e, i), n), {});
}, us = (r, e, t, s) => {
  const i = e.find((a) => a.name === r), n = i == null ? void 0 : i.type, o = t[r];
  return n && !s.includes(n) ? vt(n, o) : Re(o);
}, vt = (r, e) => {
  if (r.charAt(0) === "_") {
    const t = r.slice(1, r.length);
    return ps(e, t);
  }
  switch (r) {
    case b.bool:
      return ds(e);
    case b.float4:
    case b.float8:
    case b.int2:
    case b.int4:
    case b.int8:
    case b.numeric:
    case b.oid:
      return fs(e);
    case b.json:
    case b.jsonb:
      return gs(e);
    case b.timestamp:
      return _s(e);
    case b.abstime:
    case b.date:
    case b.daterange:
    case b.int4range:
    case b.int8range:
    case b.money:
    case b.reltime:
    case b.text:
    case b.time:
    case b.timestamptz:
    case b.timetz:
    case b.tsrange:
    case b.tstzrange:
      return Re(e);
    default:
      return Re(e);
  }
}, Re = (r) => r, ds = (r) => {
  switch (r) {
    case "t":
      return !0;
    case "f":
      return !1;
    default:
      return r;
  }
}, fs = (r) => {
  if (typeof r == "string") {
    const e = parseFloat(r);
    if (!Number.isNaN(e))
      return e;
  }
  return r;
}, gs = (r) => {
  if (typeof r == "string")
    try {
      return JSON.parse(r);
    } catch (e) {
      return console.log(`JSON parse error: ${e}`), r;
    }
  return r;
}, ps = (r, e) => {
  if (typeof r != "string")
    return r;
  const t = r.length - 1, s = r[t];
  if (r[0] === "{" && s === "}") {
    let n;
    const o = r.slice(1, t);
    try {
      n = JSON.parse("[" + o + "]");
    } catch {
      n = o ? o.split(",") : [];
    }
    return n.map((a) => vt(e, a));
  }
  return r;
}, _s = (r) => typeof r == "string" ? r.replace(" ", "T") : r, wt = (r) => {
  let e = r;
  return e = e.replace(/^ws/i, "http"), e = e.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, ""), e.replace(/\/+$/, "");
};
class ke {
  /**
   * Initializes the Push
   *
   * @param channel The Channel
   * @param event The event, for example `"phx_join"`
   * @param payload The payload, for example `{user_id: 123}`
   * @param timeout The push timeout in milliseconds
   */
  constructor(e, t, s = {}, i = pt) {
    this.channel = e, this.event = t, this.payload = s, this.timeout = i, this.sent = !1, this.timeoutTimer = void 0, this.ref = "", this.receivedResp = null, this.recHooks = [], this.refEvent = null;
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
    var s;
    return this._hasReceived(e) && t((s = this.receivedResp) === null || s === void 0 ? void 0 : s.response), this.recHooks.push({ status: e, callback: t }), this;
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
    this.recHooks.filter((s) => s.status === e).forEach((s) => s.callback(t));
  }
  _hasReceived(e) {
    return this.receivedResp && this.receivedResp.status === e;
  }
}
var We;
(function(r) {
  r.SYNC = "sync", r.JOIN = "join", r.LEAVE = "leave";
})(We || (We = {}));
class se {
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
    const s = (t == null ? void 0 : t.events) || {
      state: "presence_state",
      diff: "presence_diff"
    };
    this.channel._on(s.state, {}, (i) => {
      const { onJoin: n, onLeave: o, onSync: a } = this.caller;
      this.joinRef = this.channel._joinRef(), this.state = se.syncState(this.state, i, n, o), this.pendingDiffs.forEach((l) => {
        this.state = se.syncDiff(this.state, l, n, o);
      }), this.pendingDiffs = [], a();
    }), this.channel._on(s.diff, {}, (i) => {
      const { onJoin: n, onLeave: o, onSync: a } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(i) : (this.state = se.syncDiff(this.state, i, n, o), a());
    }), this.onJoin((i, n, o) => {
      this.channel._trigger("presence", {
        event: "join",
        key: i,
        currentPresences: n,
        newPresences: o
      });
    }), this.onLeave((i, n, o) => {
      this.channel._trigger("presence", {
        event: "leave",
        key: i,
        currentPresences: n,
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
  static syncState(e, t, s, i) {
    const n = this.cloneDeep(e), o = this.transformState(t), a = {}, l = {};
    return this.map(n, (h, c) => {
      o[h] || (l[h] = c);
    }), this.map(o, (h, c) => {
      const u = n[h];
      if (u) {
        const d = c.map((p) => p.presence_ref), f = u.map((p) => p.presence_ref), v = c.filter((p) => f.indexOf(p.presence_ref) < 0), y = u.filter((p) => d.indexOf(p.presence_ref) < 0);
        v.length > 0 && (a[h] = v), y.length > 0 && (l[h] = y);
      } else
        a[h] = c;
    }), this.syncDiff(n, { joins: a, leaves: l }, s, i);
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
  static syncDiff(e, t, s, i) {
    const { joins: n, leaves: o } = {
      joins: this.transformState(t.joins),
      leaves: this.transformState(t.leaves)
    };
    return s || (s = () => {
    }), i || (i = () => {
    }), this.map(n, (a, l) => {
      var h;
      const c = (h = e[a]) !== null && h !== void 0 ? h : [];
      if (e[a] = this.cloneDeep(l), c.length > 0) {
        const u = e[a].map((f) => f.presence_ref), d = c.filter((f) => u.indexOf(f.presence_ref) < 0);
        e[a].unshift(...d);
      }
      s(a, c, l);
    }), this.map(o, (a, l) => {
      let h = e[a];
      if (!h)
        return;
      const c = l.map((u) => u.presence_ref);
      h = h.filter((u) => c.indexOf(u.presence_ref) < 0), e[a] = h, i(a, h, l), h.length === 0 && delete e[a];
    }), e;
  }
  /** @internal */
  static map(e, t) {
    return Object.getOwnPropertyNames(e).map((s) => t(s, e[s]));
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
    return e = this.cloneDeep(e), Object.getOwnPropertyNames(e).reduce((t, s) => {
      const i = e[s];
      return "metas" in i ? t[s] = i.metas.map((n) => (n.presence_ref = n.phx_ref, delete n.phx_ref, delete n.phx_ref_prev, n)) : t[s] = i, t;
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
var Je;
(function(r) {
  r.ALL = "*", r.INSERT = "INSERT", r.UPDATE = "UPDATE", r.DELETE = "DELETE";
})(Je || (Je = {}));
var Ke;
(function(r) {
  r.BROADCAST = "broadcast", r.PRESENCE = "presence", r.POSTGRES_CHANGES = "postgres_changes", r.SYSTEM = "system";
})(Ke || (Ke = {}));
var U;
(function(r) {
  r.SUBSCRIBED = "SUBSCRIBED", r.TIMED_OUT = "TIMED_OUT", r.CLOSED = "CLOSED", r.CHANNEL_ERROR = "CHANNEL_ERROR";
})(U || (U = {}));
class qe {
  constructor(e, t = { config: {} }, s) {
    this.topic = e, this.params = t, this.socket = s, this.bindings = {}, this.state = E.closed, this.joinedOnce = !1, this.pushBuffer = [], this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "" },
      private: !1
    }, t.config), this.timeout = this.socket.timeout, this.joinPush = new ke(this, C.join, this.params, this.timeout), this.rejoinTimer = new _t(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs), this.joinPush.receive("ok", () => {
      this.state = E.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((i) => i.send()), this.pushBuffer = [];
    }), this._onClose(() => {
      this.rejoinTimer.reset(), this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`), this.state = E.closed, this.socket._remove(this);
    }), this._onError((i) => {
      this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, i), this.state = E.errored, this.rejoinTimer.scheduleTimeout());
    }), this.joinPush.receive("timeout", () => {
      this._isJoining() && (this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), this.state = E.errored, this.rejoinTimer.scheduleTimeout());
    }), this._on(C.reply, {}, (i, n) => {
      this._trigger(this._replyEventName(n), i);
    }), this.presence = new se(this), this.broadcastEndpointURL = wt(this.socket.endPoint) + "/api/broadcast", this.private = this.params.config.private || !1;
  }
  /** Subscribe registers your client with the server */
  subscribe(e, t = this.timeout) {
    var s, i;
    if (this.socket.isConnected() || this.socket.connect(), this.joinedOnce)
      throw "tried to subscribe multiple times. 'subscribe' can only be called a single time per channel instance";
    {
      const { config: { broadcast: n, presence: o, private: a } } = this.params;
      this._onError((c) => e == null ? void 0 : e(U.CHANNEL_ERROR, c)), this._onClose(() => e == null ? void 0 : e(U.CLOSED));
      const l = {}, h = {
        broadcast: n,
        presence: o,
        postgres_changes: (i = (s = this.bindings.postgres_changes) === null || s === void 0 ? void 0 : s.map((c) => c.filter)) !== null && i !== void 0 ? i : [],
        private: a
      };
      this.socket.accessTokenValue && (l.access_token = this.socket.accessTokenValue), this.updateJoinPayload(Object.assign({ config: h }, l)), this.joinedOnce = !0, this._rejoin(t), this.joinPush.receive("ok", async ({ postgres_changes: c }) => {
        var u;
        if (this.socket.setAuth(), c === void 0) {
          e == null || e(U.SUBSCRIBED);
          return;
        } else {
          const d = this.bindings.postgres_changes, f = (u = d == null ? void 0 : d.length) !== null && u !== void 0 ? u : 0, v = [];
          for (let y = 0; y < f; y++) {
            const p = d[y], { filter: { event: k, schema: O, table: g, filter: m } } = p, j = c && c[y];
            if (j && j.event === k && j.schema === O && j.table === g && j.filter === m)
              v.push(Object.assign(Object.assign({}, p), { id: j.id }));
            else {
              this.unsubscribe(), this.state = E.errored, e == null || e(U.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
              return;
            }
          }
          this.bindings.postgres_changes = v, e && e(U.SUBSCRIBED);
          return;
        }
      }).receive("error", (c) => {
        this.state = E.errored, e == null || e(U.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(c).join(", ") || "error")));
      }).receive("timeout", () => {
        e == null || e(U.TIMED_OUT);
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
  on(e, t, s) {
    return this._on(e, t, s);
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
    var s, i;
    if (!this._canPush() && e.type === "broadcast") {
      const { event: n, payload: o } = e, l = {
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
              event: n,
              payload: o,
              private: this.private
            }
          ]
        })
      };
      try {
        const h = await this._fetchWithTimeout(this.broadcastEndpointURL, l, (s = t.timeout) !== null && s !== void 0 ? s : this.timeout);
        return await ((i = h.body) === null || i === void 0 ? void 0 : i.cancel()), h.ok ? "ok" : "error";
      } catch (h) {
        return h.name === "AbortError" ? "timed out" : "error";
      }
    } else
      return new Promise((n) => {
        var o, a, l;
        const h = this._push(e.type, e, t.timeout || this.timeout);
        e.type === "broadcast" && !(!((l = (a = (o = this.params) === null || o === void 0 ? void 0 : o.config) === null || a === void 0 ? void 0 : a.broadcast) === null || l === void 0) && l.ack) && n("ok"), h.receive("ok", () => n("ok")), h.receive("error", () => n("error")), h.receive("timeout", () => n("timed out"));
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
    this.state = E.leaving;
    const t = () => {
      this.socket.log("channel", `leave ${this.topic}`), this._trigger(C.close, "leave", this._joinRef());
    };
    return this.joinPush.destroy(), new Promise((s) => {
      const i = new ke(this, C.leave, {}, e);
      i.receive("ok", () => {
        t(), s("ok");
      }).receive("timeout", () => {
        t(), s("timed out");
      }).receive("error", () => {
        s("error");
      }), i.send(), this._canPush() || i.trigger("ok", {});
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
  async _fetchWithTimeout(e, t, s) {
    const i = new AbortController(), n = setTimeout(() => i.abort(), s), o = await this.socket.fetch(e, Object.assign(Object.assign({}, t), { signal: i.signal }));
    return clearTimeout(n), o;
  }
  /** @internal */
  _push(e, t, s = this.timeout) {
    if (!this.joinedOnce)
      throw `tried to push '${e}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
    let i = new ke(this, e, t, s);
    return this._canPush() ? i.send() : (i.startTimeout(), this.pushBuffer.push(i)), i;
  }
  /**
   * Overridable message hook
   *
   * Receives all events for specialized message handling before dispatching to the channel callbacks.
   * Must return the payload, modified or unmodified.
   *
   * @internal
   */
  _onMessage(e, t, s) {
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
  _trigger(e, t, s) {
    var i, n;
    const o = e.toLocaleLowerCase(), { close: a, error: l, leave: h, join: c } = C;
    if (s && [a, l, h, c].indexOf(o) >= 0 && s !== this._joinRef())
      return;
    let d = this._onMessage(o, t, s);
    if (t && !d)
      throw "channel onMessage callbacks must return the payload, modified or unmodified";
    ["insert", "update", "delete"].includes(o) ? (i = this.bindings.postgres_changes) === null || i === void 0 || i.filter((f) => {
      var v, y, p;
      return ((v = f.filter) === null || v === void 0 ? void 0 : v.event) === "*" || ((p = (y = f.filter) === null || y === void 0 ? void 0 : y.event) === null || p === void 0 ? void 0 : p.toLocaleLowerCase()) === o;
    }).map((f) => f.callback(d, s)) : (n = this.bindings[o]) === null || n === void 0 || n.filter((f) => {
      var v, y, p, k, O, g;
      if (["broadcast", "presence", "postgres_changes"].includes(o))
        if ("id" in f) {
          const m = f.id, j = (v = f.filter) === null || v === void 0 ? void 0 : v.event;
          return m && ((y = t.ids) === null || y === void 0 ? void 0 : y.includes(m)) && (j === "*" || (j == null ? void 0 : j.toLocaleLowerCase()) === ((p = t.data) === null || p === void 0 ? void 0 : p.type.toLocaleLowerCase()));
        } else {
          const m = (O = (k = f == null ? void 0 : f.filter) === null || k === void 0 ? void 0 : k.event) === null || O === void 0 ? void 0 : O.toLocaleLowerCase();
          return m === "*" || m === ((g = t == null ? void 0 : t.event) === null || g === void 0 ? void 0 : g.toLocaleLowerCase());
        }
      else
        return f.type.toLocaleLowerCase() === o;
    }).map((f) => {
      if (typeof d == "object" && "ids" in d) {
        const v = d.data, { schema: y, table: p, commit_timestamp: k, type: O, errors: g } = v;
        d = Object.assign(Object.assign({}, {
          schema: y,
          table: p,
          commit_timestamp: k,
          eventType: O,
          new: {},
          old: {},
          errors: g
        }), this._getPayloadRecords(v));
      }
      f.callback(d, s);
    });
  }
  /** @internal */
  _isClosed() {
    return this.state === E.closed;
  }
  /** @internal */
  _isJoined() {
    return this.state === E.joined;
  }
  /** @internal */
  _isJoining() {
    return this.state === E.joining;
  }
  /** @internal */
  _isLeaving() {
    return this.state === E.leaving;
  }
  /** @internal */
  _replyEventName(e) {
    return `chan_reply_${e}`;
  }
  /** @internal */
  _on(e, t, s) {
    const i = e.toLocaleLowerCase(), n = {
      type: i,
      filter: t,
      callback: s
    };
    return this.bindings[i] ? this.bindings[i].push(n) : this.bindings[i] = [n], this;
  }
  /** @internal */
  _off(e, t) {
    const s = e.toLocaleLowerCase();
    return this.bindings[s] = this.bindings[s].filter((i) => {
      var n;
      return !(((n = i.type) === null || n === void 0 ? void 0 : n.toLocaleLowerCase()) === s && qe.isEqual(i.filter, t));
    }), this;
  }
  /** @internal */
  static isEqual(e, t) {
    if (Object.keys(e).length !== Object.keys(t).length)
      return !1;
    for (const s in e)
      if (e[s] !== t[s])
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
    this._on(C.close, {}, e);
  }
  /**
   * Registers a callback that will be executed when the channel encounteres an error.
   *
   * @internal
   */
  _onError(e) {
    this._on(C.error, {}, (t) => e(t));
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
    this._isLeaving() || (this.socket._leaveOpenTopic(this.topic), this.state = E.joining, this.joinPush.resend(e));
  }
  /** @internal */
  _getPayloadRecords(e) {
    const t = {
      new: {},
      old: {}
    };
    return (e.type === "INSERT" || e.type === "UPDATE") && (t.new = ze(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (t.old = ze(e.columns, e.old_record)), t;
  }
}
const He = () => {
}, vs = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
class ws {
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
    var s;
    this.accessTokenValue = null, this.apiKey = null, this.channels = new Array(), this.endPoint = "", this.httpEndpoint = "", this.headers = as, this.params = {}, this.timeout = pt, this.heartbeatIntervalMs = 25e3, this.heartbeatTimer = void 0, this.pendingHeartbeatRef = null, this.heartbeatCallback = He, this.ref = 0, this.logger = He, this.conn = null, this.sendBuffer = [], this.serializer = new hs(), this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    }, this.accessToken = null, this._resolveFetch = (n) => {
      let o;
      return n ? o = n : typeof fetch > "u" ? o = (...a) => Promise.resolve().then(() => Y).then(({ default: l }) => l(...a)) : o = fetch, (...a) => o(...a);
    }, this.endPoint = `${e}/${Ae.websocket}`, this.httpEndpoint = wt(e), t != null && t.transport ? this.transport = t.transport : this.transport = null, t != null && t.params && (this.params = t.params), t != null && t.headers && (this.headers = Object.assign(Object.assign({}, this.headers), t.headers)), t != null && t.timeout && (this.timeout = t.timeout), t != null && t.logger && (this.logger = t.logger), (t != null && t.logLevel || t != null && t.log_level) && (this.logLevel = t.logLevel || t.log_level, this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel })), t != null && t.heartbeatIntervalMs && (this.heartbeatIntervalMs = t.heartbeatIntervalMs);
    const i = (s = t == null ? void 0 : t.params) === null || s === void 0 ? void 0 : s.apikey;
    if (i && (this.accessTokenValue = i, this.apiKey = i), this.reconnectAfterMs = t != null && t.reconnectAfterMs ? t.reconnectAfterMs : (n) => [1e3, 2e3, 5e3, 1e4][n - 1] || 1e4, this.encode = t != null && t.encode ? t.encode : (n, o) => o(JSON.stringify(n)), this.decode = t != null && t.decode ? t.decode : this.serializer.decode.bind(this.serializer), this.reconnectTimer = new _t(async () => {
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
      if (this.transport || (this.transport = Pe), this.transport) {
        typeof window < "u" && this.transport === window.WebSocket ? this.conn = new this.transport(this.endpointURL()) : this.conn = new this.transport(this.endpointURL(), void 0, {
          headers: this.headers
        }), this.setupConnection();
        return;
      }
      this.conn = new ys(this.endpointURL(), void 0, {
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
    return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: ls }));
  }
  /**
   * Disconnects the socket.
   *
   * @param code A numeric status code to send on disconnect.
   * @param reason A custom reason for the disconnect.
   */
  disconnect(e, t) {
    this.conn && (this.conn.onclose = function() {
    }, e ? this.conn.close(e, t ?? "") : this.conn.close(), this.conn = null, this.heartbeatTimer && clearInterval(this.heartbeatTimer), this.reconnectTimer.reset(), this.channels.forEach((s) => s.teardown()));
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
    return this.channels = this.channels.filter((s) => s._joinRef !== e._joinRef), this.channels.length === 0 && this.disconnect(), t;
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
  log(e, t, s) {
    this.logger(e, t, s);
  }
  /**
   * Returns the current state of the socket.
   */
  connectionState() {
    switch (this.conn && this.conn.readyState) {
      case V.connecting:
        return F.Connecting;
      case V.open:
        return F.Open;
      case V.closing:
        return F.Closing;
      default:
        return F.Closed;
    }
  }
  /**
   * Returns `true` is the connection is open.
   */
  isConnected() {
    return this.connectionState() === F.Open;
  }
  channel(e, t = { config: {} }) {
    const s = `realtime:${e}`, i = this.getChannels().find((n) => n.topic === s);
    if (i)
      return i;
    {
      const n = new qe(`realtime:${e}`, t, this);
      return this.channels.push(n), n;
    }
  }
  /**
   * Push out a message if the socket is connected.
   *
   * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
   */
  push(e) {
    const { topic: t, event: s, payload: i, ref: n } = e, o = () => {
      this.encode(e, (a) => {
        var l;
        (l = this.conn) === null || l === void 0 || l.send(a);
      });
    };
    this.log("push", `${t} ${s} (${n})`, i), this.isConnected() ? o() : this.sendBuffer.push(o);
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
    this.accessTokenValue != t && (this.accessTokenValue = t, this.channels.forEach((s) => {
      t && s.updateJoinPayload({
        access_token: t,
        version: this.headers && this.headers["X-Client-Info"]
      }), s.joinedOnce && s._isJoined() && s._push(C.access_token, {
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
      this.pendingHeartbeatRef = null, this.log("transport", "heartbeat timeout. Attempting to re-establish connection"), this.heartbeatCallback("timeout"), (e = this.conn) === null || e === void 0 || e.close(cs, "hearbeat timeout");
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
    let t = this.channels.find((s) => s.topic === e && (s._isJoined() || s._isJoining()));
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
      let { topic: s, event: i, payload: n, ref: o } = t;
      s === "phoenix" && i === "phx_reply" && this.heartbeatCallback(t.payload.status == "ok" ? "ok" : "error"), o && o === this.pendingHeartbeatRef && (this.pendingHeartbeatRef = null), this.log("receive", `${n.status || ""} ${s} ${i} ${o && "(" + o + ")" || ""}`, n), Array.from(this.channels).filter((a) => a._isMember(s)).forEach((a) => a._trigger(i, n, o)), this.stateChangeCallbacks.message.forEach((a) => a(t));
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
    this.channels.forEach((e) => e._trigger(C.error));
  }
  /** @internal */
  _appendParams(e, t) {
    if (Object.keys(t).length === 0)
      return e;
    const s = e.match(/\?/) ? "&" : "?", i = new URLSearchParams(t);
    return `${e}${s}${i}`;
  }
  _workerObjectUrl(e) {
    let t;
    if (e)
      t = e;
    else {
      const s = new Blob([vs], { type: "application/javascript" });
      t = URL.createObjectURL(s);
    }
    return t;
  }
}
class ys {
  constructor(e, t, s) {
    this.binaryType = "arraybuffer", this.onclose = () => {
    }, this.onerror = () => {
    }, this.onmessage = () => {
    }, this.onopen = () => {
    }, this.readyState = V.connecting, this.send = () => {
    }, this.url = null, this.url = e, this.close = s.close;
  }
}
class Me extends Error {
  constructor(e) {
    super(e), this.__isStorageError = !0, this.name = "StorageError";
  }
}
function T(r) {
  return typeof r == "object" && r !== null && "__isStorageError" in r;
}
class ms extends Me {
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
class xe extends Me {
  constructor(e, t) {
    super(e), this.name = "StorageUnknownError", this.originalError = t;
  }
}
var bs = function(r, e, t, s) {
  function i(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        h(s.next(c));
      } catch (u) {
        o(u);
      }
    }
    function l(c) {
      try {
        h(s.throw(c));
      } catch (u) {
        o(u);
      }
    }
    function h(c) {
      c.done ? n(c.value) : i(c.value).then(a, l);
    }
    h((s = s.apply(r, e || [])).next());
  });
};
const yt = (r) => {
  let e;
  return r ? e = r : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => Y).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, ks = () => bs(void 0, void 0, void 0, function* () {
  return typeof Response > "u" ? (yield Promise.resolve().then(() => Y)).Response : Response;
}), Ce = (r) => {
  if (Array.isArray(r))
    return r.map((t) => Ce(t));
  if (typeof r == "function" || r !== Object(r))
    return r;
  const e = {};
  return Object.entries(r).forEach(([t, s]) => {
    const i = t.replace(/([-_][a-z])/gi, (n) => n.toUpperCase().replace(/[-_]/g, ""));
    e[i] = Ce(s);
  }), e;
};
var z = function(r, e, t, s) {
  function i(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        h(s.next(c));
      } catch (u) {
        o(u);
      }
    }
    function l(c) {
      try {
        h(s.throw(c));
      } catch (u) {
        o(u);
      }
    }
    function h(c) {
      c.done ? n(c.value) : i(c.value).then(a, l);
    }
    h((s = s.apply(r, e || [])).next());
  });
};
const Se = (r) => r.msg || r.message || r.error_description || r.error || JSON.stringify(r), Ss = (r, e, t) => z(void 0, void 0, void 0, function* () {
  const s = yield ks();
  r instanceof s && !(t != null && t.noResolveJson) ? r.json().then((i) => {
    e(new ms(Se(i), r.status || 500));
  }).catch((i) => {
    e(new xe(Se(i), i));
  }) : e(new xe(Se(r), r));
}), Ts = (r, e, t, s) => {
  const i = { method: r, headers: (e == null ? void 0 : e.headers) || {} };
  return r === "GET" ? i : (i.headers = Object.assign({ "Content-Type": "application/json" }, e == null ? void 0 : e.headers), s && (i.body = JSON.stringify(s)), Object.assign(Object.assign({}, i), t));
};
function ae(r, e, t, s, i, n) {
  return z(this, void 0, void 0, function* () {
    return new Promise((o, a) => {
      r(t, Ts(e, s, i, n)).then((l) => {
        if (!l.ok)
          throw l;
        return s != null && s.noResolveJson ? l : l.json();
      }).then((l) => o(l)).catch((l) => Ss(l, a, s));
    });
  });
}
function fe(r, e, t, s) {
  return z(this, void 0, void 0, function* () {
    return ae(r, "GET", e, t, s);
  });
}
function D(r, e, t, s, i) {
  return z(this, void 0, void 0, function* () {
    return ae(r, "POST", e, s, i, t);
  });
}
function js(r, e, t, s, i) {
  return z(this, void 0, void 0, function* () {
    return ae(r, "PUT", e, s, i, t);
  });
}
function Es(r, e, t, s) {
  return z(this, void 0, void 0, function* () {
    return ae(r, "HEAD", e, Object.assign(Object.assign({}, t), { noResolveJson: !0 }), s);
  });
}
function mt(r, e, t, s, i) {
  return z(this, void 0, void 0, function* () {
    return ae(r, "DELETE", e, s, i, t);
  });
}
var $ = function(r, e, t, s) {
  function i(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        h(s.next(c));
      } catch (u) {
        o(u);
      }
    }
    function l(c) {
      try {
        h(s.throw(c));
      } catch (u) {
        o(u);
      }
    }
    function h(c) {
      c.done ? n(c.value) : i(c.value).then(a, l);
    }
    h((s = s.apply(r, e || [])).next());
  });
};
const Os = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
}, Ge = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: !1
};
class $s {
  constructor(e, t = {}, s, i) {
    this.url = e, this.headers = t, this.bucketId = s, this.fetch = yt(i);
  }
  /**
   * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
   *
   * @param method HTTP method.
   * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadOrUpdate(e, t, s, i) {
    return $(this, void 0, void 0, function* () {
      try {
        let n;
        const o = Object.assign(Object.assign({}, Ge), i);
        let a = Object.assign(Object.assign({}, this.headers), e === "POST" && { "x-upsert": String(o.upsert) });
        const l = o.metadata;
        typeof Blob < "u" && s instanceof Blob ? (n = new FormData(), n.append("cacheControl", o.cacheControl), l && n.append("metadata", this.encodeMetadata(l)), n.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (n = s, n.append("cacheControl", o.cacheControl), l && n.append("metadata", this.encodeMetadata(l))) : (n = s, a["cache-control"] = `max-age=${o.cacheControl}`, a["content-type"] = o.contentType, l && (a["x-metadata"] = this.toBase64(this.encodeMetadata(l)))), i != null && i.headers && (a = Object.assign(Object.assign({}, a), i.headers));
        const h = this._removeEmptyFolders(t), c = this._getFinalPath(h), u = yield this.fetch(`${this.url}/object/${c}`, Object.assign({ method: e, body: n, headers: a }, o != null && o.duplex ? { duplex: o.duplex } : {})), d = yield u.json();
        return u.ok ? {
          data: { path: h, id: d.Id, fullPath: d.Key },
          error: null
        } : { data: null, error: d };
      } catch (n) {
        if (T(n))
          return { data: null, error: n };
        throw n;
      }
    });
  }
  /**
   * Uploads a file to an existing bucket.
   *
   * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  upload(e, t, s) {
    return $(this, void 0, void 0, function* () {
      return this.uploadOrUpdate("POST", e, t, s);
    });
  }
  /**
   * Upload a file with a token generated from `createSignedUploadUrl`.
   * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param token The token generated from `createSignedUploadUrl`
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadToSignedUrl(e, t, s, i) {
    return $(this, void 0, void 0, function* () {
      const n = this._removeEmptyFolders(e), o = this._getFinalPath(n), a = new URL(this.url + `/object/upload/sign/${o}`);
      a.searchParams.set("token", t);
      try {
        let l;
        const h = Object.assign({ upsert: Ge.upsert }, i), c = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(h.upsert) });
        typeof Blob < "u" && s instanceof Blob ? (l = new FormData(), l.append("cacheControl", h.cacheControl), l.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (l = s, l.append("cacheControl", h.cacheControl)) : (l = s, c["cache-control"] = `max-age=${h.cacheControl}`, c["content-type"] = h.contentType);
        const u = yield this.fetch(a.toString(), {
          method: "PUT",
          body: l,
          headers: c
        }), d = yield u.json();
        return u.ok ? {
          data: { path: n, fullPath: d.Key },
          error: null
        } : { data: null, error: d };
      } catch (l) {
        if (T(l))
          return { data: null, error: l };
        throw l;
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
    return $(this, void 0, void 0, function* () {
      try {
        let s = this._getFinalPath(e);
        const i = Object.assign({}, this.headers);
        t != null && t.upsert && (i["x-upsert"] = "true");
        const n = yield D(this.fetch, `${this.url}/object/upload/sign/${s}`, {}, { headers: i }), o = new URL(this.url + n.url), a = o.searchParams.get("token");
        if (!a)
          throw new Me("No token returned by API");
        return { data: { signedUrl: o.toString(), path: e, token: a }, error: null };
      } catch (s) {
        if (T(s))
          return { data: null, error: s };
        throw s;
      }
    });
  }
  /**
   * Replaces an existing file at the specified path with a new one.
   *
   * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  update(e, t, s) {
    return $(this, void 0, void 0, function* () {
      return this.uploadOrUpdate("PUT", e, t, s);
    });
  }
  /**
   * Moves an existing file to a new path in the same bucket.
   *
   * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
   * @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
   * @param options The destination options.
   */
  move(e, t, s) {
    return $(this, void 0, void 0, function* () {
      try {
        return { data: yield D(this.fetch, `${this.url}/object/move`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: s == null ? void 0 : s.destinationBucket
        }, { headers: this.headers }), error: null };
      } catch (i) {
        if (T(i))
          return { data: null, error: i };
        throw i;
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
  copy(e, t, s) {
    return $(this, void 0, void 0, function* () {
      try {
        return { data: { path: (yield D(this.fetch, `${this.url}/object/copy`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: s == null ? void 0 : s.destinationBucket
        }, { headers: this.headers })).Key }, error: null };
      } catch (i) {
        if (T(i))
          return { data: null, error: i };
        throw i;
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
  createSignedUrl(e, t, s) {
    return $(this, void 0, void 0, function* () {
      try {
        let i = this._getFinalPath(e), n = yield D(this.fetch, `${this.url}/object/sign/${i}`, Object.assign({ expiresIn: t }, s != null && s.transform ? { transform: s.transform } : {}), { headers: this.headers });
        const o = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return n = { signedUrl: encodeURI(`${this.url}${n.signedURL}${o}`) }, { data: n, error: null };
      } catch (i) {
        if (T(i))
          return { data: null, error: i };
        throw i;
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
  createSignedUrls(e, t, s) {
    return $(this, void 0, void 0, function* () {
      try {
        const i = yield D(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn: t, paths: e }, { headers: this.headers }), n = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return {
          data: i.map((o) => Object.assign(Object.assign({}, o), { signedUrl: o.signedURL ? encodeURI(`${this.url}${o.signedURL}${n}`) : null })),
          error: null
        };
      } catch (i) {
        if (T(i))
          return { data: null, error: i };
        throw i;
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
    return $(this, void 0, void 0, function* () {
      const i = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image/authenticated" : "object", n = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {}), o = n ? `?${n}` : "";
      try {
        const a = this._getFinalPath(e);
        return { data: yield (yield fe(this.fetch, `${this.url}/${i}/${a}${o}`, {
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
    return $(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        const s = yield fe(this.fetch, `${this.url}/object/info/${t}`, {
          headers: this.headers
        });
        return { data: Ce(s), error: null };
      } catch (s) {
        if (T(s))
          return { data: null, error: s };
        throw s;
      }
    });
  }
  /**
   * Checks the existence of a file.
   * @param path
   */
  exists(e) {
    return $(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        return yield Es(this.fetch, `${this.url}/object/${t}`, {
          headers: this.headers
        }), { data: !0, error: null };
      } catch (s) {
        if (T(s) && s instanceof xe) {
          const i = s.originalError;
          if ([400, 404].includes(i == null ? void 0 : i.status))
            return { data: !1, error: s };
        }
        throw s;
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
    const s = this._getFinalPath(e), i = [], n = t != null && t.download ? `download=${t.download === !0 ? "" : t.download}` : "";
    n !== "" && i.push(n);
    const a = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image" : "object", l = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {});
    l !== "" && i.push(l);
    let h = i.join("&");
    return h !== "" && (h = `?${h}`), {
      data: { publicUrl: encodeURI(`${this.url}/${a}/public/${s}${h}`) }
    };
  }
  /**
   * Deletes files within the same bucket
   *
   * @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
   */
  remove(e) {
    return $(this, void 0, void 0, function* () {
      try {
        return { data: yield mt(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: e }, { headers: this.headers }), error: null };
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
  list(e, t, s) {
    return $(this, void 0, void 0, function* () {
      try {
        const i = Object.assign(Object.assign(Object.assign({}, Os), t), { prefix: e || "" });
        return { data: yield D(this.fetch, `${this.url}/object/list/${this.bucketId}`, i, { headers: this.headers }, s), error: null };
      } catch (i) {
        if (T(i))
          return { data: null, error: i };
        throw i;
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
const Ps = "2.7.1", As = { "X-Client-Info": `storage-js/${Ps}` };
var W = function(r, e, t, s) {
  function i(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        h(s.next(c));
      } catch (u) {
        o(u);
      }
    }
    function l(c) {
      try {
        h(s.throw(c));
      } catch (u) {
        o(u);
      }
    }
    function h(c) {
      c.done ? n(c.value) : i(c.value).then(a, l);
    }
    h((s = s.apply(r, e || [])).next());
  });
};
class Rs {
  constructor(e, t = {}, s) {
    this.url = e, this.headers = Object.assign(Object.assign({}, As), t), this.fetch = yt(s);
  }
  /**
   * Retrieves the details of all Storage buckets within an existing project.
   */
  listBuckets() {
    return W(this, void 0, void 0, function* () {
      try {
        return { data: yield fe(this.fetch, `${this.url}/bucket`, { headers: this.headers }), error: null };
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
    return W(this, void 0, void 0, function* () {
      try {
        return { data: yield fe(this.fetch, `${this.url}/bucket/${e}`, { headers: this.headers }), error: null };
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
    return W(this, void 0, void 0, function* () {
      try {
        return { data: yield D(this.fetch, `${this.url}/bucket`, {
          id: e,
          name: e,
          public: t.public,
          file_size_limit: t.fileSizeLimit,
          allowed_mime_types: t.allowedMimeTypes
        }, { headers: this.headers }), error: null };
      } catch (s) {
        if (T(s))
          return { data: null, error: s };
        throw s;
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
    return W(this, void 0, void 0, function* () {
      try {
        return { data: yield js(this.fetch, `${this.url}/bucket/${e}`, {
          id: e,
          name: e,
          public: t.public,
          file_size_limit: t.fileSizeLimit,
          allowed_mime_types: t.allowedMimeTypes
        }, { headers: this.headers }), error: null };
      } catch (s) {
        if (T(s))
          return { data: null, error: s };
        throw s;
      }
    });
  }
  /**
   * Removes all objects inside a single bucket.
   *
   * @param id The unique identifier of the bucket you would like to empty.
   */
  emptyBucket(e) {
    return W(this, void 0, void 0, function* () {
      try {
        return { data: yield D(this.fetch, `${this.url}/bucket/${e}/empty`, {}, { headers: this.headers }), error: null };
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
    return W(this, void 0, void 0, function* () {
      try {
        return { data: yield mt(this.fetch, `${this.url}/bucket/${e}`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (T(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
}
class xs extends Rs {
  constructor(e, t = {}, s) {
    super(e, t, s);
  }
  /**
   * Perform file operation in a bucket.
   *
   * @param id The bucket id to operate on.
   */
  from(e) {
    return new $s(this.url, this.headers, e, this.fetch);
  }
}
const Cs = "2.50.0";
let te = "";
typeof Deno < "u" ? te = "deno" : typeof document < "u" ? te = "web" : typeof navigator < "u" && navigator.product === "ReactNative" ? te = "react-native" : te = "node";
const Is = { "X-Client-Info": `supabase-js-${te}/${Cs}` }, Us = {
  headers: Is
}, Ls = {
  schema: "public"
}, Ds = {
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  flowType: "implicit"
}, Bs = {};
var qs = function(r, e, t, s) {
  function i(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        h(s.next(c));
      } catch (u) {
        o(u);
      }
    }
    function l(c) {
      try {
        h(s.throw(c));
      } catch (u) {
        o(u);
      }
    }
    function h(c) {
      c.done ? n(c.value) : i(c.value).then(a, l);
    }
    h((s = s.apply(r, e || [])).next());
  });
};
const Ms = (r) => {
  let e;
  return r ? e = r : typeof fetch > "u" ? e = it : e = fetch, (...t) => e(...t);
}, Ns = () => typeof Headers > "u" ? nt : Headers, Fs = (r, e, t) => {
  const s = Ms(t), i = Ns();
  return (n, o) => qs(void 0, void 0, void 0, function* () {
    var a;
    const l = (a = yield e()) !== null && a !== void 0 ? a : r;
    let h = new i(o == null ? void 0 : o.headers);
    return h.has("apikey") || h.set("apikey", r), h.has("Authorization") || h.set("Authorization", `Bearer ${l}`), s(n, Object.assign(Object.assign({}, o), { headers: h }));
  });
};
var zs = function(r, e, t, s) {
  function i(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        h(s.next(c));
      } catch (u) {
        o(u);
      }
    }
    function l(c) {
      try {
        h(s.throw(c));
      } catch (u) {
        o(u);
      }
    }
    function h(c) {
      c.done ? n(c.value) : i(c.value).then(a, l);
    }
    h((s = s.apply(r, e || [])).next());
  });
};
function Ws(r) {
  return r.endsWith("/") ? r : r + "/";
}
function Js(r, e) {
  var t, s;
  const { db: i, auth: n, realtime: o, global: a } = r, { db: l, auth: h, realtime: c, global: u } = e, d = {
    db: Object.assign(Object.assign({}, l), i),
    auth: Object.assign(Object.assign({}, h), n),
    realtime: Object.assign(Object.assign({}, c), o),
    global: Object.assign(Object.assign(Object.assign({}, u), a), { headers: Object.assign(Object.assign({}, (t = u == null ? void 0 : u.headers) !== null && t !== void 0 ? t : {}), (s = a == null ? void 0 : a.headers) !== null && s !== void 0 ? s : {}) }),
    accessToken: () => zs(this, void 0, void 0, function* () {
      return "";
    })
  };
  return r.accessToken ? d.accessToken = r.accessToken : delete d.accessToken, d;
}
const bt = "2.70.0", G = 30 * 1e3, Ie = 3, Te = Ie * G, Ks = "http://localhost:9999", Hs = "supabase.auth.token", Gs = { "X-Client-Info": `gotrue-js/${bt}` }, Ue = "X-Supabase-Api-Version", kt = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
}, Vs = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i, Qs = 6e5;
class Ne extends Error {
  constructor(e, t, s) {
    super(e), this.__isAuthError = !0, this.name = "AuthError", this.status = t, this.code = s;
  }
}
function _(r) {
  return typeof r == "object" && r !== null && "__isAuthError" in r;
}
class Xs extends Ne {
  constructor(e, t, s) {
    super(e, t, s), this.name = "AuthApiError", this.status = t, this.code = s;
  }
}
function Ys(r) {
  return _(r) && r.name === "AuthApiError";
}
class St extends Ne {
  constructor(e, t) {
    super(e), this.name = "AuthUnknownError", this.originalError = t;
  }
}
class q extends Ne {
  constructor(e, t, s, i) {
    super(e, s, i), this.name = t, this.status = s;
  }
}
class L extends q {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
}
function Zs(r) {
  return _(r) && r.name === "AuthSessionMissingError";
}
class le extends q {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
}
class ce extends q {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
}
class he extends q {
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
function er(r) {
  return _(r) && r.name === "AuthImplicitGrantRedirectError";
}
class Ve extends q {
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
class Le extends q {
  constructor(e, t) {
    super(e, "AuthRetryableFetchError", t, void 0);
  }
}
function je(r) {
  return _(r) && r.name === "AuthRetryableFetchError";
}
class Qe extends q {
  constructor(e, t, s) {
    super(e, "AuthWeakPasswordError", t, "weak_password"), this.reasons = s;
  }
}
class re extends q {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
}
const ge = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), Xe = ` 	
\r=`.split(""), tr = (() => {
  const r = new Array(128);
  for (let e = 0; e < r.length; e += 1)
    r[e] = -1;
  for (let e = 0; e < Xe.length; e += 1)
    r[Xe[e].charCodeAt(0)] = -2;
  for (let e = 0; e < ge.length; e += 1)
    r[ge[e].charCodeAt(0)] = e;
  return r;
})();
function Ye(r, e, t) {
  if (r !== null)
    for (e.queue = e.queue << 8 | r, e.queuedBits += 8; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(ge[s]), e.queuedBits -= 6;
    }
  else if (e.queuedBits > 0)
    for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(ge[s]), e.queuedBits -= 6;
    }
}
function Tt(r, e, t) {
  const s = tr[r];
  if (s > -1)
    for (e.queue = e.queue << 6 | s, e.queuedBits += 6; e.queuedBits >= 8; )
      t(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (s === -2)
      return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(r)}"`);
  }
}
function Ze(r) {
  const e = [], t = (o) => {
    e.push(String.fromCodePoint(o));
  }, s = {
    utf8seq: 0,
    codepoint: 0
  }, i = { queue: 0, queuedBits: 0 }, n = (o) => {
    ir(o, s, t);
  };
  for (let o = 0; o < r.length; o += 1)
    Tt(r.charCodeAt(o), i, n);
  return e.join("");
}
function sr(r, e) {
  if (r <= 127) {
    e(r);
    return;
  } else if (r <= 2047) {
    e(192 | r >> 6), e(128 | r & 63);
    return;
  } else if (r <= 65535) {
    e(224 | r >> 12), e(128 | r >> 6 & 63), e(128 | r & 63);
    return;
  } else if (r <= 1114111) {
    e(240 | r >> 18), e(128 | r >> 12 & 63), e(128 | r >> 6 & 63), e(128 | r & 63);
    return;
  }
  throw new Error(`Unrecognized Unicode codepoint: ${r.toString(16)}`);
}
function rr(r, e) {
  for (let t = 0; t < r.length; t += 1) {
    let s = r.charCodeAt(t);
    if (s > 55295 && s <= 56319) {
      const i = (s - 55296) * 1024 & 65535;
      s = (r.charCodeAt(t + 1) - 56320 & 65535 | i) + 65536, t += 1;
    }
    sr(s, e);
  }
}
function ir(r, e, t) {
  if (e.utf8seq === 0) {
    if (r <= 127) {
      t(r);
      return;
    }
    for (let s = 1; s < 6; s += 1)
      if (!(r >> 7 - s & 1)) {
        e.utf8seq = s;
        break;
      }
    if (e.utf8seq === 2)
      e.codepoint = r & 31;
    else if (e.utf8seq === 3)
      e.codepoint = r & 15;
    else if (e.utf8seq === 4)
      e.codepoint = r & 7;
    else
      throw new Error("Invalid UTF-8 sequence");
    e.utf8seq -= 1;
  } else if (e.utf8seq > 0) {
    if (r <= 127)
      throw new Error("Invalid UTF-8 sequence");
    e.codepoint = e.codepoint << 6 | r & 63, e.utf8seq -= 1, e.utf8seq === 0 && t(e.codepoint);
  }
}
function nr(r) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (i) => {
    e.push(i);
  };
  for (let i = 0; i < r.length; i += 1)
    Tt(r.charCodeAt(i), t, s);
  return new Uint8Array(e);
}
function or(r) {
  const e = [];
  return rr(r, (t) => e.push(t)), new Uint8Array(e);
}
function ar(r) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (i) => {
    e.push(i);
  };
  return r.forEach((i) => Ye(i, t, s)), Ye(null, t, s), e.join("");
}
function lr(r) {
  return Math.round(Date.now() / 1e3) + r;
}
function cr() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(r) {
    const e = Math.random() * 16 | 0;
    return (r == "x" ? e : e & 3 | 8).toString(16);
  });
}
const x = () => typeof window < "u" && typeof document < "u", M = {
  tested: !1,
  writable: !1
}, ie = () => {
  if (!x())
    return !1;
  try {
    if (typeof globalThis.localStorage != "object")
      return !1;
  } catch {
    return !1;
  }
  if (M.tested)
    return M.writable;
  const r = `lswt-${Math.random()}${Math.random()}`;
  try {
    globalThis.localStorage.setItem(r, r), globalThis.localStorage.removeItem(r), M.tested = !0, M.writable = !0;
  } catch {
    M.tested = !0, M.writable = !1;
  }
  return M.writable;
};
function hr(r) {
  const e = {}, t = new URL(r);
  if (t.hash && t.hash[0] === "#")
    try {
      new URLSearchParams(t.hash.substring(1)).forEach((i, n) => {
        e[n] = i;
      });
    } catch {
    }
  return t.searchParams.forEach((s, i) => {
    e[i] = s;
  }), e;
}
const jt = (r) => {
  let e;
  return r ? e = r : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => Y).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, ur = (r) => typeof r == "object" && r !== null && "status" in r && "ok" in r && "json" in r && typeof r.json == "function", Et = async (r, e, t) => {
  await r.setItem(e, JSON.stringify(t));
}, ue = async (r, e) => {
  const t = await r.getItem(e);
  if (!t)
    return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}, de = async (r, e) => {
  await r.removeItem(e);
};
class be {
  constructor() {
    this.promise = new be.promiseConstructor((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
}
be.promiseConstructor = Promise;
function Ee(r) {
  const e = r.split(".");
  if (e.length !== 3)
    throw new re("Invalid JWT structure");
  for (let s = 0; s < e.length; s++)
    if (!Vs.test(e[s]))
      throw new re("JWT not in base64url format");
  return {
    // using base64url lib
    header: JSON.parse(Ze(e[0])),
    payload: JSON.parse(Ze(e[1])),
    signature: nr(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function dr(r) {
  return await new Promise((e) => {
    setTimeout(() => e(null), r);
  });
}
function fr(r, e) {
  return new Promise((s, i) => {
    (async () => {
      for (let n = 0; n < 1 / 0; n++)
        try {
          const o = await r(n);
          if (!e(n, null, o)) {
            s(o);
            return;
          }
        } catch (o) {
          if (!e(n, o)) {
            i(o);
            return;
          }
        }
    })();
  });
}
function gr(r) {
  return ("0" + r.toString(16)).substr(-2);
}
function pr() {
  const e = new Uint32Array(56);
  if (typeof crypto > "u") {
    const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", s = t.length;
    let i = "";
    for (let n = 0; n < 56; n++)
      i += t.charAt(Math.floor(Math.random() * s));
    return i;
  }
  return crypto.getRandomValues(e), Array.from(e, gr).join("");
}
async function _r(r) {
  const t = new TextEncoder().encode(r), s = await crypto.subtle.digest("SHA-256", t), i = new Uint8Array(s);
  return Array.from(i).map((n) => String.fromCharCode(n)).join("");
}
async function vr(r) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u"))
    return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), r;
  const t = await _r(r);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function J(r, e, t = !1) {
  const s = pr();
  let i = s;
  t && (i += "/PASSWORD_RECOVERY"), await Et(r, `${e}-code-verifier`, i);
  const n = await vr(s);
  return [n, s === n ? "plain" : "s256"];
}
const wr = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function yr(r) {
  const e = r.headers.get(Ue);
  if (!e || !e.match(wr))
    return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function mr(r) {
  if (!r)
    throw new Error("Missing exp claim");
  const e = Math.floor(Date.now() / 1e3);
  if (r <= e)
    throw new Error("JWT has expired");
}
function br(r) {
  switch (r) {
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
const kr = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function K(r) {
  if (!kr.test(r))
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
var Sr = function(r, e) {
  var t = {};
  for (var s in r) Object.prototype.hasOwnProperty.call(r, s) && e.indexOf(s) < 0 && (t[s] = r[s]);
  if (r != null && typeof Object.getOwnPropertySymbols == "function")
    for (var i = 0, s = Object.getOwnPropertySymbols(r); i < s.length; i++)
      e.indexOf(s[i]) < 0 && Object.prototype.propertyIsEnumerable.call(r, s[i]) && (t[s[i]] = r[s[i]]);
  return t;
};
const N = (r) => r.msg || r.message || r.error_description || r.error || JSON.stringify(r), Tr = [502, 503, 504];
async function et(r) {
  var e;
  if (!ur(r))
    throw new Le(N(r), 0);
  if (Tr.includes(r.status))
    throw new Le(N(r), r.status);
  let t;
  try {
    t = await r.json();
  } catch (n) {
    throw new St(N(n), n);
  }
  let s;
  const i = yr(r);
  if (i && i.getTime() >= kt["2024-01-01"].timestamp && typeof t == "object" && t && typeof t.code == "string" ? s = t.code : typeof t == "object" && t && typeof t.error_code == "string" && (s = t.error_code), s) {
    if (s === "weak_password")
      throw new Qe(N(t), r.status, ((e = t.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (s === "session_not_found")
      throw new L();
  } else if (typeof t == "object" && t && typeof t.weak_password == "object" && t.weak_password && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.reasons.reduce((n, o) => n && typeof o == "string", !0))
    throw new Qe(N(t), r.status, t.weak_password.reasons);
  throw new Xs(N(t), r.status || 500, s);
}
const jr = (r, e, t, s) => {
  const i = { method: r, headers: (e == null ? void 0 : e.headers) || {} };
  return r === "GET" ? i : (i.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, e == null ? void 0 : e.headers), i.body = JSON.stringify(s), Object.assign(Object.assign({}, i), t));
};
async function w(r, e, t, s) {
  var i;
  const n = Object.assign({}, s == null ? void 0 : s.headers);
  n[Ue] || (n[Ue] = kt["2024-01-01"].name), s != null && s.jwt && (n.Authorization = `Bearer ${s.jwt}`);
  const o = (i = s == null ? void 0 : s.query) !== null && i !== void 0 ? i : {};
  s != null && s.redirectTo && (o.redirect_to = s.redirectTo);
  const a = Object.keys(o).length ? "?" + new URLSearchParams(o).toString() : "", l = await Er(r, e, t + a, {
    headers: n,
    noResolveJson: s == null ? void 0 : s.noResolveJson
  }, {}, s == null ? void 0 : s.body);
  return s != null && s.xform ? s == null ? void 0 : s.xform(l) : { data: Object.assign({}, l), error: null };
}
async function Er(r, e, t, s, i, n) {
  const o = jr(e, s, i, n);
  let a;
  try {
    a = await r(t, Object.assign({}, o));
  } catch (l) {
    throw console.error(l), new Le(N(l), 0);
  }
  if (a.ok || await et(a), s != null && s.noResolveJson)
    return a;
  try {
    return await a.json();
  } catch (l) {
    await et(l);
  }
}
function I(r) {
  var e;
  let t = null;
  Ar(r) && (t = Object.assign({}, r), r.expires_at || (t.expires_at = lr(r.expires_in)));
  const s = (e = r.user) !== null && e !== void 0 ? e : r;
  return { data: { session: t, user: s }, error: null };
}
function tt(r) {
  const e = I(r);
  return !e.error && r.weak_password && typeof r.weak_password == "object" && Array.isArray(r.weak_password.reasons) && r.weak_password.reasons.length && r.weak_password.message && typeof r.weak_password.message == "string" && r.weak_password.reasons.reduce((t, s) => t && typeof s == "string", !0) && (e.data.weak_password = r.weak_password), e;
}
function B(r) {
  var e;
  return { data: { user: (e = r.user) !== null && e !== void 0 ? e : r }, error: null };
}
function Or(r) {
  return { data: r, error: null };
}
function $r(r) {
  const { action_link: e, email_otp: t, hashed_token: s, redirect_to: i, verification_type: n } = r, o = Sr(r, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]), a = {
    action_link: e,
    email_otp: t,
    hashed_token: s,
    redirect_to: i,
    verification_type: n
  }, l = Object.assign({}, o);
  return {
    data: {
      properties: a,
      user: l
    },
    error: null
  };
}
function Pr(r) {
  return r;
}
function Ar(r) {
  return r.access_token && r.refresh_token && r.expires_in;
}
const Oe = ["global", "local", "others"];
var Rr = function(r, e) {
  var t = {};
  for (var s in r) Object.prototype.hasOwnProperty.call(r, s) && e.indexOf(s) < 0 && (t[s] = r[s]);
  if (r != null && typeof Object.getOwnPropertySymbols == "function")
    for (var i = 0, s = Object.getOwnPropertySymbols(r); i < s.length; i++)
      e.indexOf(s[i]) < 0 && Object.prototype.propertyIsEnumerable.call(r, s[i]) && (t[s[i]] = r[s[i]]);
  return t;
};
class xr {
  constructor({ url: e = "", headers: t = {}, fetch: s }) {
    this.url = e, this.headers = t, this.fetch = jt(s), this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    };
  }
  /**
   * Removes a logged-in session.
   * @param jwt A valid, logged-in JWT.
   * @param scope The logout sope.
   */
  async signOut(e, t = Oe[0]) {
    if (Oe.indexOf(t) < 0)
      throw new Error(`@supabase/auth-js: Parameter scope must be one of ${Oe.join(", ")}`);
    try {
      return await w(this.fetch, "POST", `${this.url}/logout?scope=${t}`, {
        headers: this.headers,
        jwt: e,
        noResolveJson: !0
      }), { data: null, error: null };
    } catch (s) {
      if (_(s))
        return { data: null, error: s };
      throw s;
    }
  }
  /**
   * Sends an invite link to an email address.
   * @param email The email address of the user.
   * @param options Additional options to be included when inviting.
   */
  async inviteUserByEmail(e, t = {}) {
    try {
      return await w(this.fetch, "POST", `${this.url}/invite`, {
        body: { email: e, data: t.data },
        headers: this.headers,
        redirectTo: t.redirectTo,
        xform: B
      });
    } catch (s) {
      if (_(s))
        return { data: { user: null }, error: s };
      throw s;
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
      const { options: t } = e, s = Rr(e, ["options"]), i = Object.assign(Object.assign({}, s), t);
      return "newEmail" in s && (i.new_email = s == null ? void 0 : s.newEmail, delete i.newEmail), await w(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: i,
        headers: this.headers,
        xform: $r,
        redirectTo: t == null ? void 0 : t.redirectTo
      });
    } catch (t) {
      if (_(t))
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
      return await w(this.fetch, "POST", `${this.url}/admin/users`, {
        body: e,
        headers: this.headers,
        xform: B
      });
    } catch (t) {
      if (_(t))
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
    var t, s, i, n, o, a, l;
    try {
      const h = { nextPage: null, lastPage: 0, total: 0 }, c = await w(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (s = (t = e == null ? void 0 : e.page) === null || t === void 0 ? void 0 : t.toString()) !== null && s !== void 0 ? s : "",
          per_page: (n = (i = e == null ? void 0 : e.perPage) === null || i === void 0 ? void 0 : i.toString()) !== null && n !== void 0 ? n : ""
        },
        xform: Pr
      });
      if (c.error)
        throw c.error;
      const u = await c.json(), d = (o = c.headers.get("x-total-count")) !== null && o !== void 0 ? o : 0, f = (l = (a = c.headers.get("link")) === null || a === void 0 ? void 0 : a.split(",")) !== null && l !== void 0 ? l : [];
      return f.length > 0 && (f.forEach((v) => {
        const y = parseInt(v.split(";")[0].split("=")[1].substring(0, 1)), p = JSON.parse(v.split(";")[1].split("=")[1]);
        h[`${p}Page`] = y;
      }), h.total = parseInt(d)), { data: Object.assign(Object.assign({}, u), h), error: null };
    } catch (h) {
      if (_(h))
        return { data: { users: [] }, error: h };
      throw h;
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
    K(e);
    try {
      return await w(this.fetch, "GET", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        xform: B
      });
    } catch (t) {
      if (_(t))
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
    K(e);
    try {
      return await w(this.fetch, "PUT", `${this.url}/admin/users/${e}`, {
        body: t,
        headers: this.headers,
        xform: B
      });
    } catch (s) {
      if (_(s))
        return { data: { user: null }, error: s };
      throw s;
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
    K(e);
    try {
      return await w(this.fetch, "DELETE", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        body: {
          should_soft_delete: t
        },
        xform: B
      });
    } catch (s) {
      if (_(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  async _listFactors(e) {
    K(e.userId);
    try {
      const { data: t, error: s } = await w(this.fetch, "GET", `${this.url}/admin/users/${e.userId}/factors`, {
        headers: this.headers,
        xform: (i) => ({ data: { factors: i }, error: null })
      });
      return { data: t, error: s };
    } catch (t) {
      if (_(t))
        return { data: null, error: t };
      throw t;
    }
  }
  async _deleteFactor(e) {
    K(e.userId), K(e.id);
    try {
      return { data: await w(this.fetch, "DELETE", `${this.url}/admin/users/${e.userId}/factors/${e.id}`, {
        headers: this.headers
      }), error: null };
    } catch (t) {
      if (_(t))
        return { data: null, error: t };
      throw t;
    }
  }
}
const Cr = {
  getItem: (r) => ie() ? globalThis.localStorage.getItem(r) : null,
  setItem: (r, e) => {
    ie() && globalThis.localStorage.setItem(r, e);
  },
  removeItem: (r) => {
    ie() && globalThis.localStorage.removeItem(r);
  }
};
function st(r = {}) {
  return {
    getItem: (e) => r[e] || null,
    setItem: (e, t) => {
      r[e] = t;
    },
    removeItem: (e) => {
      delete r[e];
    }
  };
}
function Ir() {
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
const H = {
  /**
   * @experimental
   */
  debug: !!(globalThis && ie() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
};
class Ot extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = !0;
  }
}
class Ur extends Ot {
}
async function Lr(r, e, t) {
  H.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire lock", r, e);
  const s = new globalThis.AbortController();
  return e > 0 && setTimeout(() => {
    s.abort(), H.debug && console.log("@supabase/gotrue-js: navigatorLock acquire timed out", r);
  }, e), await Promise.resolve().then(() => globalThis.navigator.locks.request(r, e === 0 ? {
    mode: "exclusive",
    ifAvailable: !0
  } : {
    mode: "exclusive",
    signal: s.signal
  }, async (i) => {
    if (i) {
      H.debug && console.log("@supabase/gotrue-js: navigatorLock: acquired", r, i.name);
      try {
        return await t();
      } finally {
        H.debug && console.log("@supabase/gotrue-js: navigatorLock: released", r, i.name);
      }
    } else {
      if (e === 0)
        throw H.debug && console.log("@supabase/gotrue-js: navigatorLock: not immediately available", r), new Ur(`Acquiring an exclusive Navigator LockManager lock "${r}" immediately failed`);
      if (H.debug)
        try {
          const n = await globalThis.navigator.locks.query();
          console.log("@supabase/gotrue-js: Navigator LockManager state", JSON.stringify(n, null, "  "));
        } catch (n) {
          console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state", n);
        }
      return console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request"), await t();
    }
  }));
}
Ir();
const Dr = {
  url: Ks,
  storageKey: Hs,
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  headers: Gs,
  flowType: "implicit",
  debug: !1,
  hasCustomAuthorizationHeader: !1
};
async function rt(r, e, t) {
  return await t();
}
class ne {
  /**
   * Create a new client for use in the browser.
   */
  constructor(e) {
    var t, s;
    this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = !0, this.hasCustomAuthorizationHeader = !1, this.suppressGetSessionWarning = !1, this.lockAcquired = !1, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log, this.instanceID = ne.nextInstanceID, ne.nextInstanceID += 1, this.instanceID > 0 && x() && console.warn("Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.");
    const i = Object.assign(Object.assign({}, Dr), e);
    if (this.logDebugMessages = !!i.debug, typeof i.debug == "function" && (this.logger = i.debug), this.persistSession = i.persistSession, this.storageKey = i.storageKey, this.autoRefreshToken = i.autoRefreshToken, this.admin = new xr({
      url: i.url,
      headers: i.headers,
      fetch: i.fetch
    }), this.url = i.url, this.headers = i.headers, this.fetch = jt(i.fetch), this.lock = i.lock || rt, this.detectSessionInUrl = i.detectSessionInUrl, this.flowType = i.flowType, this.hasCustomAuthorizationHeader = i.hasCustomAuthorizationHeader, i.lock ? this.lock = i.lock : x() && (!((t = globalThis == null ? void 0 : globalThis.navigator) === null || t === void 0) && t.locks) ? this.lock = Lr : this.lock = rt, this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER, this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this)
    }, this.persistSession ? i.storage ? this.storage = i.storage : ie() ? this.storage = Cr : (this.memoryStorage = {}, this.storage = st(this.memoryStorage)) : (this.memoryStorage = {}, this.storage = st(this.memoryStorage)), x() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
      try {
        this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
      } catch (n) {
        console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", n);
      }
      (s = this.broadcastChannel) === null || s === void 0 || s.addEventListener("message", async (n) => {
        this._debug("received broadcast notification from other tab or client", n), await this._notifyAllSubscribers(n.data.event, n.data.session, !1);
      });
    }
    this.initialize();
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(`GoTrueClient@${this.instanceID} (${bt}) ${(/* @__PURE__ */ new Date()).toISOString()}`, ...e), this;
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
      const t = hr(window.location.href);
      let s = "none";
      if (this._isImplicitGrantCallback(t) ? s = "implicit" : await this._isPKCECallback(t) && (s = "pkce"), x() && this.detectSessionInUrl && s !== "none") {
        const { data: i, error: n } = await this._getSessionFromURL(t, s);
        if (n) {
          if (this._debug("#_initialize()", "error detecting session from URL", n), er(n)) {
            const l = (e = n.details) === null || e === void 0 ? void 0 : e.code;
            if (l === "identity_already_exists" || l === "identity_not_found" || l === "single_identity_not_deletable")
              return { error: n };
          }
          return await this._removeSession(), { error: n };
        }
        const { session: o, redirectType: a } = i;
        return this._debug("#_initialize()", "detected session in URL", o, "redirect type", a), await this._saveSession(o), setTimeout(async () => {
          a === "recovery" ? await this._notifyAllSubscribers("PASSWORD_RECOVERY", o) : await this._notifyAllSubscribers("SIGNED_IN", o);
        }, 0), { error: null };
      }
      return await this._recoverAndRefresh(), { error: null };
    } catch (t) {
      return _(t) ? { error: t } : {
        error: new St("Unexpected error during initialization", t)
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
    var t, s, i;
    try {
      const n = await w(this.fetch, "POST", `${this.url}/signup`, {
        headers: this.headers,
        body: {
          data: (s = (t = e == null ? void 0 : e.options) === null || t === void 0 ? void 0 : t.data) !== null && s !== void 0 ? s : {},
          gotrue_meta_security: { captcha_token: (i = e == null ? void 0 : e.options) === null || i === void 0 ? void 0 : i.captchaToken }
        },
        xform: I
      }), { data: o, error: a } = n;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const l = o.session, h = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", l)), { data: { user: h, session: l }, error: null };
    } catch (n) {
      if (_(n))
        return { data: { user: null, session: null }, error: n };
      throw n;
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
    var t, s, i;
    try {
      let n;
      if ("email" in e) {
        const { email: c, password: u, options: d } = e;
        let f = null, v = null;
        this.flowType === "pkce" && ([f, v] = await J(this.storage, this.storageKey)), n = await w(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          redirectTo: d == null ? void 0 : d.emailRedirectTo,
          body: {
            email: c,
            password: u,
            data: (t = d == null ? void 0 : d.data) !== null && t !== void 0 ? t : {},
            gotrue_meta_security: { captcha_token: d == null ? void 0 : d.captchaToken },
            code_challenge: f,
            code_challenge_method: v
          },
          xform: I
        });
      } else if ("phone" in e) {
        const { phone: c, password: u, options: d } = e;
        n = await w(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            phone: c,
            password: u,
            data: (s = d == null ? void 0 : d.data) !== null && s !== void 0 ? s : {},
            channel: (i = d == null ? void 0 : d.channel) !== null && i !== void 0 ? i : "sms",
            gotrue_meta_security: { captcha_token: d == null ? void 0 : d.captchaToken }
          },
          xform: I
        });
      } else
        throw new ce("You must provide either an email or phone number and a password");
      const { data: o, error: a } = n;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const l = o.session, h = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", l)), { data: { user: h, session: l }, error: null };
    } catch (n) {
      if (_(n))
        return { data: { user: null, session: null }, error: n };
      throw n;
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
        const { email: n, password: o, options: a } = e;
        t = await w(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            email: n,
            password: o,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          xform: tt
        });
      } else if ("phone" in e) {
        const { phone: n, password: o, options: a } = e;
        t = await w(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            phone: n,
            password: o,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          xform: tt
        });
      } else
        throw new ce("You must provide either an email or phone number and a password");
      const { data: s, error: i } = t;
      return i ? { data: { user: null, session: null }, error: i } : !s || !s.session || !s.user ? { data: { user: null, session: null }, error: new le() } : (s.session && (await this._saveSession(s.session), await this._notifyAllSubscribers("SIGNED_IN", s.session)), {
        data: Object.assign({ user: s.user, session: s.session }, s.weak_password ? { weakPassword: s.weak_password } : null),
        error: i
      });
    } catch (t) {
      if (_(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Log in an existing user via a third-party provider.
   * This method supports the PKCE flow.
   */
  async signInWithOAuth(e) {
    var t, s, i, n;
    return await this._handleProviderSignIn(e.provider, {
      redirectTo: (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo,
      scopes: (s = e.options) === null || s === void 0 ? void 0 : s.scopes,
      queryParams: (i = e.options) === null || i === void 0 ? void 0 : i.queryParams,
      skipBrowserRedirect: (n = e.options) === null || n === void 0 ? void 0 : n.skipBrowserRedirect
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
    var t, s, i, n, o, a, l, h, c, u, d, f;
    let v, y;
    if ("message" in e)
      v = e.message, y = e.signature;
    else {
      const { chain: p, wallet: k, statement: O, options: g } = e;
      let m;
      if (x())
        if (typeof k == "object")
          m = k;
        else {
          const S = window;
          if ("solana" in S && typeof S.solana == "object" && ("signIn" in S.solana && typeof S.solana.signIn == "function" || "signMessage" in S.solana && typeof S.solana.signMessage == "function"))
            m = S.solana;
          else
            throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.");
        }
      else {
        if (typeof k != "object" || !(g != null && g.url))
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        m = k;
      }
      const j = new URL((t = g == null ? void 0 : g.url) !== null && t !== void 0 ? t : window.location.href);
      if ("signIn" in m && m.signIn) {
        const S = await m.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, g == null ? void 0 : g.signInWithSolana), {
          // non-overridable properties
          version: "1",
          domain: j.host,
          uri: j.href
        }), O ? { statement: O } : null));
        let A;
        if (Array.isArray(S) && S[0] && typeof S[0] == "object")
          A = S[0];
        else if (S && typeof S == "object" && "signedMessage" in S && "signature" in S)
          A = S;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in A && "signature" in A && (typeof A.signedMessage == "string" || A.signedMessage instanceof Uint8Array) && A.signature instanceof Uint8Array)
          v = typeof A.signedMessage == "string" ? A.signedMessage : new TextDecoder().decode(A.signedMessage), y = A.signature;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in m) || typeof m.signMessage != "function" || !("publicKey" in m) || typeof m != "object" || !m.publicKey || !("toBase58" in m.publicKey) || typeof m.publicKey.toBase58 != "function")
          throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        v = [
          `${j.host} wants you to sign in with your Solana account:`,
          m.publicKey.toBase58(),
          ...O ? ["", O, ""] : [""],
          "Version: 1",
          `URI: ${j.href}`,
          `Issued At: ${(i = (s = g == null ? void 0 : g.signInWithSolana) === null || s === void 0 ? void 0 : s.issuedAt) !== null && i !== void 0 ? i : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((n = g == null ? void 0 : g.signInWithSolana) === null || n === void 0) && n.notBefore ? [`Not Before: ${g.signInWithSolana.notBefore}`] : [],
          ...!((o = g == null ? void 0 : g.signInWithSolana) === null || o === void 0) && o.expirationTime ? [`Expiration Time: ${g.signInWithSolana.expirationTime}`] : [],
          ...!((a = g == null ? void 0 : g.signInWithSolana) === null || a === void 0) && a.chainId ? [`Chain ID: ${g.signInWithSolana.chainId}`] : [],
          ...!((l = g == null ? void 0 : g.signInWithSolana) === null || l === void 0) && l.nonce ? [`Nonce: ${g.signInWithSolana.nonce}`] : [],
          ...!((h = g == null ? void 0 : g.signInWithSolana) === null || h === void 0) && h.requestId ? [`Request ID: ${g.signInWithSolana.requestId}`] : [],
          ...!((u = (c = g == null ? void 0 : g.signInWithSolana) === null || c === void 0 ? void 0 : c.resources) === null || u === void 0) && u.length ? [
            "Resources",
            ...g.signInWithSolana.resources.map((A) => `- ${A}`)
          ] : []
        ].join(`
`);
        const S = await m.signMessage(new TextEncoder().encode(v), "utf8");
        if (!S || !(S instanceof Uint8Array))
          throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        y = S;
      }
    }
    try {
      const { data: p, error: k } = await w(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({ chain: "solana", message: v, signature: ar(y) }, !((d = e.options) === null || d === void 0) && d.captchaToken ? { gotrue_meta_security: { captcha_token: (f = e.options) === null || f === void 0 ? void 0 : f.captchaToken } } : null),
        xform: I
      });
      if (k)
        throw k;
      return !p || !p.session || !p.user ? {
        data: { user: null, session: null },
        error: new le()
      } : (p.session && (await this._saveSession(p.session), await this._notifyAllSubscribers("SIGNED_IN", p.session)), { data: Object.assign({}, p), error: k });
    } catch (p) {
      if (_(p))
        return { data: { user: null, session: null }, error: p };
      throw p;
    }
  }
  async _exchangeCodeForSession(e) {
    const t = await ue(this.storage, `${this.storageKey}-code-verifier`), [s, i] = (t ?? "").split("/");
    try {
      const { data: n, error: o } = await w(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: s
        },
        xform: I
      });
      if (await de(this.storage, `${this.storageKey}-code-verifier`), o)
        throw o;
      return !n || !n.session || !n.user ? {
        data: { user: null, session: null, redirectType: null },
        error: new le()
      } : (n.session && (await this._saveSession(n.session), await this._notifyAllSubscribers("SIGNED_IN", n.session)), { data: Object.assign(Object.assign({}, n), { redirectType: i ?? null }), error: o });
    } catch (n) {
      if (_(n))
        return { data: { user: null, session: null, redirectType: null }, error: n };
      throw n;
    }
  }
  /**
   * Allows signing in with an OIDC ID token. The authentication provider used
   * should be enabled and configured.
   */
  async signInWithIdToken(e) {
    try {
      const { options: t, provider: s, token: i, access_token: n, nonce: o } = e, a = await w(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
        headers: this.headers,
        body: {
          provider: s,
          id_token: i,
          access_token: n,
          nonce: o,
          gotrue_meta_security: { captcha_token: t == null ? void 0 : t.captchaToken }
        },
        xform: I
      }), { data: l, error: h } = a;
      return h ? { data: { user: null, session: null }, error: h } : !l || !l.session || !l.user ? {
        data: { user: null, session: null },
        error: new le()
      } : (l.session && (await this._saveSession(l.session), await this._notifyAllSubscribers("SIGNED_IN", l.session)), { data: l, error: h });
    } catch (t) {
      if (_(t))
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
    var t, s, i, n, o;
    try {
      if ("email" in e) {
        const { email: a, options: l } = e;
        let h = null, c = null;
        this.flowType === "pkce" && ([h, c] = await J(this.storage, this.storageKey));
        const { error: u } = await w(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            email: a,
            data: (t = l == null ? void 0 : l.data) !== null && t !== void 0 ? t : {},
            create_user: (s = l == null ? void 0 : l.shouldCreateUser) !== null && s !== void 0 ? s : !0,
            gotrue_meta_security: { captcha_token: l == null ? void 0 : l.captchaToken },
            code_challenge: h,
            code_challenge_method: c
          },
          redirectTo: l == null ? void 0 : l.emailRedirectTo
        });
        return { data: { user: null, session: null }, error: u };
      }
      if ("phone" in e) {
        const { phone: a, options: l } = e, { data: h, error: c } = await w(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            phone: a,
            data: (i = l == null ? void 0 : l.data) !== null && i !== void 0 ? i : {},
            create_user: (n = l == null ? void 0 : l.shouldCreateUser) !== null && n !== void 0 ? n : !0,
            gotrue_meta_security: { captcha_token: l == null ? void 0 : l.captchaToken },
            channel: (o = l == null ? void 0 : l.channel) !== null && o !== void 0 ? o : "sms"
          }
        });
        return { data: { user: null, session: null, messageId: h == null ? void 0 : h.message_id }, error: c };
      }
      throw new ce("You must provide either an email or phone number.");
    } catch (a) {
      if (_(a))
        return { data: { user: null, session: null }, error: a };
      throw a;
    }
  }
  /**
   * Log in a user given a User supplied OTP or TokenHash received through mobile or email.
   */
  async verifyOtp(e) {
    var t, s;
    try {
      let i, n;
      "options" in e && (i = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo, n = (s = e.options) === null || s === void 0 ? void 0 : s.captchaToken);
      const { data: o, error: a } = await w(this.fetch, "POST", `${this.url}/verify`, {
        headers: this.headers,
        body: Object.assign(Object.assign({}, e), { gotrue_meta_security: { captcha_token: n } }),
        redirectTo: i,
        xform: I
      });
      if (a)
        throw a;
      if (!o)
        throw new Error("An error occurred on token verification.");
      const l = o.session, h = o.user;
      return l != null && l.access_token && (await this._saveSession(l), await this._notifyAllSubscribers(e.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", l)), { data: { user: h, session: l }, error: null };
    } catch (i) {
      if (_(i))
        return { data: { user: null, session: null }, error: i };
      throw i;
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
    var t, s, i;
    try {
      let n = null, o = null;
      return this.flowType === "pkce" && ([n, o] = await J(this.storage, this.storageKey)), await w(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? { provider_id: e.providerId } : null), "domain" in e ? { domain: e.domain } : null), { redirect_to: (s = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo) !== null && s !== void 0 ? s : void 0 }), !((i = e == null ? void 0 : e.options) === null || i === void 0) && i.captchaToken ? { gotrue_meta_security: { captcha_token: e.options.captchaToken } } : null), { skip_http_redirect: !0, code_challenge: n, code_challenge_method: o }),
        headers: this.headers,
        xform: Or
      });
    } catch (n) {
      if (_(n))
        return { data: null, error: n };
      throw n;
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
        const { data: { session: t }, error: s } = e;
        if (s)
          throw s;
        if (!t)
          throw new L();
        const { error: i } = await w(this.fetch, "GET", `${this.url}/reauthenticate`, {
          headers: this.headers,
          jwt: t.access_token
        });
        return { data: { user: null, session: null }, error: i };
      });
    } catch (e) {
      if (_(e))
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
        const { email: s, type: i, options: n } = e, { error: o } = await w(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            email: s,
            type: i,
            gotrue_meta_security: { captcha_token: n == null ? void 0 : n.captchaToken }
          },
          redirectTo: n == null ? void 0 : n.emailRedirectTo
        });
        return { data: { user: null, session: null }, error: o };
      } else if ("phone" in e) {
        const { phone: s, type: i, options: n } = e, { data: o, error: a } = await w(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            phone: s,
            type: i,
            gotrue_meta_security: { captcha_token: n == null ? void 0 : n.captchaToken }
          }
        });
        return { data: { user: null, session: null, messageId: o == null ? void 0 : o.message_id }, error: a };
      }
      throw new ce("You must provide either an email or phone number and a type");
    } catch (t) {
      if (_(t))
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
        const s = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve(), i = (async () => (await s, await t()))();
        return this.pendingInLock.push((async () => {
          try {
            await i;
          } catch {
          }
        })()), i;
      }
      return await this.lock(`lock:${this.storageKey}`, e, async () => {
        this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
        try {
          this.lockAcquired = !0;
          const s = t();
          for (this.pendingInLock.push((async () => {
            try {
              await s;
            } catch {
            }
          })()), await s; this.pendingInLock.length; ) {
            const i = [...this.pendingInLock];
            await Promise.all(i), this.pendingInLock.splice(0, i.length);
          }
          return await s;
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
      const t = await ue(this.storage, this.storageKey);
      if (this._debug("#getSession()", "session from storage", t), t !== null && (this._isValidSession(t) ? e = t : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !e)
        return { data: { session: null }, error: null };
      const s = e.expires_at ? e.expires_at * 1e3 - Date.now() < Te : !1;
      if (this._debug("#__loadSession()", `session has${s ? "" : " not"} expired`, "expires_at", e.expires_at), !s) {
        if (this.storage.isServer) {
          let o = this.suppressGetSessionWarning;
          e = new Proxy(e, {
            get: (l, h, c) => (!o && h === "user" && (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), o = !0, this.suppressGetSessionWarning = !0), Reflect.get(l, h, c))
          });
        }
        return { data: { session: e }, error: null };
      }
      const { session: i, error: n } = await this._callRefreshToken(e.refresh_token);
      return n ? { data: { session: null }, error: n } : { data: { session: i }, error: null };
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
      return e ? await w(this.fetch, "GET", `${this.url}/user`, {
        headers: this.headers,
        jwt: e,
        xform: B
      }) : await this._useSession(async (t) => {
        var s, i, n;
        const { data: o, error: a } = t;
        if (a)
          throw a;
        return !(!((s = o.session) === null || s === void 0) && s.access_token) && !this.hasCustomAuthorizationHeader ? { data: { user: null }, error: new L() } : await w(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (n = (i = o.session) === null || i === void 0 ? void 0 : i.access_token) !== null && n !== void 0 ? n : void 0,
          xform: B
        });
      });
    } catch (t) {
      if (_(t))
        return Zs(t) && (await this._removeSession(), await de(this.storage, `${this.storageKey}-code-verifier`)), { data: { user: null }, error: t };
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
      return await this._useSession(async (s) => {
        const { data: i, error: n } = s;
        if (n)
          throw n;
        if (!i.session)
          throw new L();
        const o = i.session;
        let a = null, l = null;
        this.flowType === "pkce" && e.email != null && ([a, l] = await J(this.storage, this.storageKey));
        const { data: h, error: c } = await w(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: t == null ? void 0 : t.emailRedirectTo,
          body: Object.assign(Object.assign({}, e), { code_challenge: a, code_challenge_method: l }),
          jwt: o.access_token,
          xform: B
        });
        if (c)
          throw c;
        return o.user = h.user, await this._saveSession(o), await this._notifyAllSubscribers("USER_UPDATED", o), { data: { user: o.user }, error: null };
      });
    } catch (s) {
      if (_(s))
        return { data: { user: null }, error: s };
      throw s;
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
        throw new L();
      const t = Date.now() / 1e3;
      let s = t, i = !0, n = null;
      const { payload: o } = Ee(e.access_token);
      if (o.exp && (s = o.exp, i = s <= t), i) {
        const { session: a, error: l } = await this._callRefreshToken(e.refresh_token);
        if (l)
          return { data: { user: null, session: null }, error: l };
        if (!a)
          return { data: { user: null, session: null }, error: null };
        n = a;
      } else {
        const { data: a, error: l } = await this._getUser(e.access_token);
        if (l)
          throw l;
        n = {
          access_token: e.access_token,
          refresh_token: e.refresh_token,
          user: a.user,
          token_type: "bearer",
          expires_in: s - t,
          expires_at: s
        }, await this._saveSession(n), await this._notifyAllSubscribers("SIGNED_IN", n);
      }
      return { data: { user: n.user, session: n }, error: null };
    } catch (t) {
      if (_(t))
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
        var s;
        if (!e) {
          const { data: o, error: a } = t;
          if (a)
            throw a;
          e = (s = o.session) !== null && s !== void 0 ? s : void 0;
        }
        if (!(e != null && e.refresh_token))
          throw new L();
        const { session: i, error: n } = await this._callRefreshToken(e.refresh_token);
        return n ? { data: { user: null, session: null }, error: n } : i ? { data: { user: i.user, session: i }, error: null } : { data: { user: null, session: null }, error: null };
      });
    } catch (t) {
      if (_(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Gets the session data from a URL string
   */
  async _getSessionFromURL(e, t) {
    try {
      if (!x())
        throw new he("No browser detected.");
      if (e.error || e.error_description || e.error_code)
        throw new he(e.error_description || "Error in URL with unspecified error_description", {
          error: e.error || "unspecified_error",
          code: e.error_code || "unspecified_code"
        });
      switch (t) {
        case "implicit":
          if (this.flowType === "pkce")
            throw new Ve("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit")
            throw new he("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (t === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", !0), !e.code)
          throw new Ve("No code detected.");
        const { data: O, error: g } = await this._exchangeCodeForSession(e.code);
        if (g)
          throw g;
        const m = new URL(window.location.href);
        return m.searchParams.delete("code"), window.history.replaceState(window.history.state, "", m.toString()), { data: { session: O.session, redirectType: null }, error: null };
      }
      const { provider_token: s, provider_refresh_token: i, access_token: n, refresh_token: o, expires_in: a, expires_at: l, token_type: h } = e;
      if (!n || !a || !o || !h)
        throw new he("No session defined in URL");
      const c = Math.round(Date.now() / 1e3), u = parseInt(a);
      let d = c + u;
      l && (d = parseInt(l));
      const f = d - c;
      f * 1e3 <= G && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${u}s`);
      const v = d - u;
      c - v >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", v, d, c) : c - v < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", v, d, c);
      const { data: y, error: p } = await this._getUser(n);
      if (p)
        throw p;
      const k = {
        provider_token: s,
        provider_refresh_token: i,
        access_token: n,
        expires_in: u,
        expires_at: d,
        refresh_token: o,
        token_type: h,
        user: y.user
      };
      return window.location.hash = "", this._debug("#_getSessionFromURL()", "clearing window.location.hash"), { data: { session: k, redirectType: e.type }, error: null };
    } catch (s) {
      if (_(s))
        return { data: { session: null, redirectType: null }, error: s };
      throw s;
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
    const t = await ue(this.storage, `${this.storageKey}-code-verifier`);
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
      var s;
      const { data: i, error: n } = t;
      if (n)
        return { error: n };
      const o = (s = i.session) === null || s === void 0 ? void 0 : s.access_token;
      if (o) {
        const { error: a } = await this.admin.signOut(o, e);
        if (a && !(Ys(a) && (a.status === 404 || a.status === 401 || a.status === 403)))
          return { error: a };
      }
      return e !== "others" && (await this._removeSession(), await de(this.storage, `${this.storageKey}-code-verifier`)), { error: null };
    });
  }
  /**
   * Receive a notification every time an auth event happens.
   * @param callback A callback function to be invoked when an auth event happens.
   */
  onAuthStateChange(e) {
    const t = cr(), s = {
      id: t,
      callback: e,
      unsubscribe: () => {
        this._debug("#unsubscribe()", "state change callback with id removed", t), this.stateChangeEmitters.delete(t);
      }
    };
    return this._debug("#onAuthStateChange()", "registered callback with id", t), this.stateChangeEmitters.set(t, s), (async () => (await this.initializePromise, await this._acquireLock(-1, async () => {
      this._emitInitialSession(t);
    })))(), { data: { subscription: s } };
  }
  async _emitInitialSession(e) {
    return await this._useSession(async (t) => {
      var s, i;
      try {
        const { data: { session: n }, error: o } = t;
        if (o)
          throw o;
        await ((s = this.stateChangeEmitters.get(e)) === null || s === void 0 ? void 0 : s.callback("INITIAL_SESSION", n)), this._debug("INITIAL_SESSION", "callback id", e, "session", n);
      } catch (n) {
        await ((i = this.stateChangeEmitters.get(e)) === null || i === void 0 ? void 0 : i.callback("INITIAL_SESSION", null)), this._debug("INITIAL_SESSION", "callback id", e, "error", n), console.error(n);
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
    let s = null, i = null;
    this.flowType === "pkce" && ([s, i] = await J(
      this.storage,
      this.storageKey,
      !0
      // isPasswordRecovery
    ));
    try {
      return await w(this.fetch, "POST", `${this.url}/recover`, {
        body: {
          email: e,
          code_challenge: s,
          code_challenge_method: i,
          gotrue_meta_security: { captcha_token: t.captchaToken }
        },
        headers: this.headers,
        redirectTo: t.redirectTo
      });
    } catch (n) {
      if (_(n))
        return { data: null, error: n };
      throw n;
    }
  }
  /**
   * Gets all the identities linked to a user.
   */
  async getUserIdentities() {
    var e;
    try {
      const { data: t, error: s } = await this.getUser();
      if (s)
        throw s;
      return { data: { identities: (e = t.user.identities) !== null && e !== void 0 ? e : [] }, error: null };
    } catch (t) {
      if (_(t))
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
      const { data: s, error: i } = await this._useSession(async (n) => {
        var o, a, l, h, c;
        const { data: u, error: d } = n;
        if (d)
          throw d;
        const f = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, e.provider, {
          redirectTo: (o = e.options) === null || o === void 0 ? void 0 : o.redirectTo,
          scopes: (a = e.options) === null || a === void 0 ? void 0 : a.scopes,
          queryParams: (l = e.options) === null || l === void 0 ? void 0 : l.queryParams,
          skipBrowserRedirect: !0
        });
        return await w(this.fetch, "GET", f, {
          headers: this.headers,
          jwt: (c = (h = u.session) === null || h === void 0 ? void 0 : h.access_token) !== null && c !== void 0 ? c : void 0
        });
      });
      if (i)
        throw i;
      return x() && !(!((t = e.options) === null || t === void 0) && t.skipBrowserRedirect) && window.location.assign(s == null ? void 0 : s.url), { data: { provider: e.provider, url: s == null ? void 0 : s.url }, error: null };
    } catch (s) {
      if (_(s))
        return { data: { provider: e.provider, url: null }, error: s };
      throw s;
    }
  }
  /**
   * Unlinks an identity from a user by deleting it. The user will no longer be able to sign in with that identity once it's unlinked.
   */
  async unlinkIdentity(e) {
    try {
      return await this._useSession(async (t) => {
        var s, i;
        const { data: n, error: o } = t;
        if (o)
          throw o;
        return await w(this.fetch, "DELETE", `${this.url}/user/identities/${e.identity_id}`, {
          headers: this.headers,
          jwt: (i = (s = n.session) === null || s === void 0 ? void 0 : s.access_token) !== null && i !== void 0 ? i : void 0
        });
      });
    } catch (t) {
      if (_(t))
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
      const s = Date.now();
      return await fr(async (i) => (i > 0 && await dr(200 * Math.pow(2, i - 1)), this._debug(t, "refreshing attempt", i), await w(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: { refresh_token: e },
        headers: this.headers,
        xform: I
      })), (i, n) => {
        const o = 200 * Math.pow(2, i);
        return n && je(n) && // retryable only if the request can be sent before the backoff overflows the tick duration
        Date.now() + o - s < G;
      });
    } catch (s) {
      if (this._debug(t, "error", s), _(s))
        return { data: { session: null, user: null }, error: s };
      throw s;
    } finally {
      this._debug(t, "end");
    }
  }
  _isValidSession(e) {
    return typeof e == "object" && e !== null && "access_token" in e && "refresh_token" in e && "expires_at" in e;
  }
  async _handleProviderSignIn(e, t) {
    const s = await this._getUrlForProvider(`${this.url}/authorize`, e, {
      redirectTo: t.redirectTo,
      scopes: t.scopes,
      queryParams: t.queryParams
    });
    return this._debug("#_handleProviderSignIn()", "provider", e, "options", t, "url", s), x() && !t.skipBrowserRedirect && window.location.assign(s), { data: { provider: e, url: s }, error: null };
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
      const s = await ue(this.storage, this.storageKey);
      if (this._debug(t, "session from storage", s), !this._isValidSession(s)) {
        this._debug(t, "session is not valid"), s !== null && await this._removeSession();
        return;
      }
      const i = ((e = s.expires_at) !== null && e !== void 0 ? e : 1 / 0) * 1e3 - Date.now() < Te;
      if (this._debug(t, `session has${i ? "" : " not"} expired with margin of ${Te}s`), i) {
        if (this.autoRefreshToken && s.refresh_token) {
          const { error: n } = await this._callRefreshToken(s.refresh_token);
          n && (console.error(n), je(n) || (this._debug(t, "refresh failed with a non-retryable error, removing the session", n), await this._removeSession()));
        }
      } else
        await this._notifyAllSubscribers("SIGNED_IN", s);
    } catch (s) {
      this._debug(t, "error", s), console.error(s);
      return;
    } finally {
      this._debug(t, "end");
    }
  }
  async _callRefreshToken(e) {
    var t, s;
    if (!e)
      throw new L();
    if (this.refreshingDeferred)
      return this.refreshingDeferred.promise;
    const i = `#_callRefreshToken(${e.substring(0, 5)}...)`;
    this._debug(i, "begin");
    try {
      this.refreshingDeferred = new be();
      const { data: n, error: o } = await this._refreshAccessToken(e);
      if (o)
        throw o;
      if (!n.session)
        throw new L();
      await this._saveSession(n.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", n.session);
      const a = { session: n.session, error: null };
      return this.refreshingDeferred.resolve(a), a;
    } catch (n) {
      if (this._debug(i, "error", n), _(n)) {
        const o = { session: null, error: n };
        return je(n) || await this._removeSession(), (t = this.refreshingDeferred) === null || t === void 0 || t.resolve(o), o;
      }
      throw (s = this.refreshingDeferred) === null || s === void 0 || s.reject(n), n;
    } finally {
      this.refreshingDeferred = null, this._debug(i, "end");
    }
  }
  async _notifyAllSubscribers(e, t, s = !0) {
    const i = `#_notifyAllSubscribers(${e})`;
    this._debug(i, "begin", t, `broadcast = ${s}`);
    try {
      this.broadcastChannel && s && this.broadcastChannel.postMessage({ event: e, session: t });
      const n = [], o = Array.from(this.stateChangeEmitters.values()).map(async (a) => {
        try {
          await a.callback(e, t);
        } catch (l) {
          n.push(l);
        }
      });
      if (await Promise.all(o), n.length > 0) {
        for (let a = 0; a < n.length; a += 1)
          console.error(n[a]);
        throw n[0];
      }
    } finally {
      this._debug(i, "end");
    }
  }
  /**
   * set currentSession and currentUser
   * process to _startAutoRefreshToken if possible
   */
  async _saveSession(e) {
    this._debug("#_saveSession()", e), this.suppressGetSessionWarning = !0, await Et(this.storage, this.storageKey, e);
  }
  async _removeSession() {
    this._debug("#_removeSession()"), await de(this.storage, this.storageKey), await this._notifyAllSubscribers("SIGNED_OUT", null);
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
      e && x() && (window != null && window.removeEventListener) && window.removeEventListener("visibilitychange", e);
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
    const e = setInterval(() => this._autoRefreshTokenTick(), G);
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
              const { data: { session: s } } = t;
              if (!s || !s.refresh_token || !s.expires_at) {
                this._debug("#_autoRefreshTokenTick()", "no session");
                return;
              }
              const i = Math.floor((s.expires_at * 1e3 - e) / G);
              this._debug("#_autoRefreshTokenTick()", `access token expires in ${i} ticks, a tick lasts ${G}ms, refresh threshold is ${Ie} ticks`), i <= Ie && await this._callRefreshToken(s.refresh_token);
            });
          } catch (t) {
            console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
          }
        } finally {
          this._debug("#_autoRefreshTokenTick()", "end");
        }
      });
    } catch (e) {
      if (e.isAcquireTimeout || e instanceof Ot)
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
    if (this._debug("#_handleVisibilityChange()"), !x() || !(window != null && window.addEventListener))
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
  async _getUrlForProvider(e, t, s) {
    const i = [`provider=${encodeURIComponent(t)}`];
    if (s != null && s.redirectTo && i.push(`redirect_to=${encodeURIComponent(s.redirectTo)}`), s != null && s.scopes && i.push(`scopes=${encodeURIComponent(s.scopes)}`), this.flowType === "pkce") {
      const [n, o] = await J(this.storage, this.storageKey), a = new URLSearchParams({
        code_challenge: `${encodeURIComponent(n)}`,
        code_challenge_method: `${encodeURIComponent(o)}`
      });
      i.push(a.toString());
    }
    if (s != null && s.queryParams) {
      const n = new URLSearchParams(s.queryParams);
      i.push(n.toString());
    }
    return s != null && s.skipBrowserRedirect && i.push(`skip_http_redirect=${s.skipBrowserRedirect}`), `${e}?${i.join("&")}`;
  }
  async _unenroll(e) {
    try {
      return await this._useSession(async (t) => {
        var s;
        const { data: i, error: n } = t;
        return n ? { data: null, error: n } : await w(this.fetch, "DELETE", `${this.url}/factors/${e.factorId}`, {
          headers: this.headers,
          jwt: (s = i == null ? void 0 : i.session) === null || s === void 0 ? void 0 : s.access_token
        });
      });
    } catch (t) {
      if (_(t))
        return { data: null, error: t };
      throw t;
    }
  }
  async _enroll(e) {
    try {
      return await this._useSession(async (t) => {
        var s, i;
        const { data: n, error: o } = t;
        if (o)
          return { data: null, error: o };
        const a = Object.assign({ friendly_name: e.friendlyName, factor_type: e.factorType }, e.factorType === "phone" ? { phone: e.phone } : { issuer: e.issuer }), { data: l, error: h } = await w(this.fetch, "POST", `${this.url}/factors`, {
          body: a,
          headers: this.headers,
          jwt: (s = n == null ? void 0 : n.session) === null || s === void 0 ? void 0 : s.access_token
        });
        return h ? { data: null, error: h } : (e.factorType === "totp" && (!((i = l == null ? void 0 : l.totp) === null || i === void 0) && i.qr_code) && (l.totp.qr_code = `data:image/svg+xml;utf-8,${l.totp.qr_code}`), { data: l, error: null });
      });
    } catch (t) {
      if (_(t))
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
          var s;
          const { data: i, error: n } = t;
          if (n)
            return { data: null, error: n };
          const { data: o, error: a } = await w(this.fetch, "POST", `${this.url}/factors/${e.factorId}/verify`, {
            body: { code: e.code, challenge_id: e.challengeId },
            headers: this.headers,
            jwt: (s = i == null ? void 0 : i.session) === null || s === void 0 ? void 0 : s.access_token
          });
          return a ? { data: null, error: a } : (await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + o.expires_in }, o)), await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", o), { data: o, error: a });
        });
      } catch (t) {
        if (_(t))
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
          var s;
          const { data: i, error: n } = t;
          return n ? { data: null, error: n } : await w(this.fetch, "POST", `${this.url}/factors/${e.factorId}/challenge`, {
            body: { channel: e.channel },
            headers: this.headers,
            jwt: (s = i == null ? void 0 : i.session) === null || s === void 0 ? void 0 : s.access_token
          });
        });
      } catch (t) {
        if (_(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
  /**
   * {@see GoTrueMFAApi#challengeAndVerify}
   */
  async _challengeAndVerify(e) {
    const { data: t, error: s } = await this._challenge({
      factorId: e.factorId
    });
    return s ? { data: null, error: s } : await this._verify({
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
    const s = (e == null ? void 0 : e.factors) || [], i = s.filter((o) => o.factor_type === "totp" && o.status === "verified"), n = s.filter((o) => o.factor_type === "phone" && o.status === "verified");
    return {
      data: {
        all: s,
        totp: i,
        phone: n
      },
      error: null
    };
  }
  /**
   * {@see GoTrueMFAApi#getAuthenticatorAssuranceLevel}
   */
  async _getAuthenticatorAssuranceLevel() {
    return this._acquireLock(-1, async () => await this._useSession(async (e) => {
      var t, s;
      const { data: { session: i }, error: n } = e;
      if (n)
        return { data: null, error: n };
      if (!i)
        return {
          data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
          error: null
        };
      const { payload: o } = Ee(i.access_token);
      let a = null;
      o.aal && (a = o.aal);
      let l = a;
      ((s = (t = i.user.factors) === null || t === void 0 ? void 0 : t.filter((u) => u.status === "verified")) !== null && s !== void 0 ? s : []).length > 0 && (l = "aal2");
      const c = o.amr || [];
      return { data: { currentLevel: a, nextLevel: l, currentAuthenticationMethods: c }, error: null };
    }));
  }
  async fetchJwk(e, t = { keys: [] }) {
    let s = t.keys.find((o) => o.kid === e);
    if (s || (s = this.jwks.keys.find((o) => o.kid === e), s && this.jwks_cached_at + Qs > Date.now()))
      return s;
    const { data: i, error: n } = await w(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
      headers: this.headers
    });
    if (n)
      throw n;
    if (!i.keys || i.keys.length === 0)
      throw new re("JWKS is empty");
    if (this.jwks = i, this.jwks_cached_at = Date.now(), s = i.keys.find((o) => o.kid === e), !s)
      throw new re("No matching signing key found in JWKS");
    return s;
  }
  /**
   * @experimental This method may change in future versions.
   * @description Gets the claims from a JWT. If the JWT is symmetric JWTs, it will call getUser() to verify against the server. If the JWT is asymmetric, it will be verified against the JWKS using the WebCrypto API.
   */
  async getClaims(e, t = { keys: [] }) {
    try {
      let s = e;
      if (!s) {
        const { data: f, error: v } = await this.getSession();
        if (v || !f.session)
          return { data: null, error: v };
        s = f.session.access_token;
      }
      const { header: i, payload: n, signature: o, raw: { header: a, payload: l } } = Ee(s);
      if (mr(n.exp), !i.kid || i.alg === "HS256" || !("crypto" in globalThis && "subtle" in globalThis.crypto)) {
        const { error: f } = await this.getUser(s);
        if (f)
          throw f;
        return {
          data: {
            claims: n,
            header: i,
            signature: o
          },
          error: null
        };
      }
      const h = br(i.alg), c = await this.fetchJwk(i.kid, t), u = await crypto.subtle.importKey("jwk", c, h, !0, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(h, u, o, or(`${a}.${l}`)))
        throw new re("Invalid JWT signature");
      return {
        data: {
          claims: n,
          header: i,
          signature: o
        },
        error: null
      };
    } catch (s) {
      if (_(s))
        return { data: null, error: s };
      throw s;
    }
  }
}
ne.nextInstanceID = 0;
const Br = ne;
class qr extends Br {
  constructor(e) {
    super(e);
  }
}
var Mr = function(r, e, t, s) {
  function i(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        h(s.next(c));
      } catch (u) {
        o(u);
      }
    }
    function l(c) {
      try {
        h(s.throw(c));
      } catch (u) {
        o(u);
      }
    }
    function h(c) {
      c.done ? n(c.value) : i(c.value).then(a, l);
    }
    h((s = s.apply(r, e || [])).next());
  });
};
class Nr {
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
  constructor(e, t, s) {
    var i, n, o;
    if (this.supabaseUrl = e, this.supabaseKey = t, !e)
      throw new Error("supabaseUrl is required.");
    if (!t)
      throw new Error("supabaseKey is required.");
    const a = Ws(e), l = new URL(a);
    this.realtimeUrl = new URL("realtime/v1", l), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", l), this.storageUrl = new URL("storage/v1", l), this.functionsUrl = new URL("functions/v1", l);
    const h = `sb-${l.hostname.split(".")[0]}-auth-token`, c = {
      db: Ls,
      realtime: Bs,
      auth: Object.assign(Object.assign({}, Ds), { storageKey: h }),
      global: Us
    }, u = Js(s ?? {}, c);
    this.storageKey = (i = u.auth.storageKey) !== null && i !== void 0 ? i : "", this.headers = (n = u.global.headers) !== null && n !== void 0 ? n : {}, u.accessToken ? (this.accessToken = u.accessToken, this.auth = new Proxy({}, {
      get: (d, f) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(f)} is not possible`);
      }
    })) : this.auth = this._initSupabaseAuthClient((o = u.auth) !== null && o !== void 0 ? o : {}, this.headers, u.global.fetch), this.fetch = Fs(t, this._getAccessToken.bind(this), u.global.fetch), this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, u.realtime)), this.rest = new ns(new URL("rest/v1", l).href, {
      headers: this.headers,
      schema: u.db.schema,
      fetch: this.fetch
    }), u.accessToken || this._listenForAuthEvents();
  }
  /**
   * Supabase Functions allows you to deploy and invoke edge functions.
   */
  get functions() {
    return new It(this.functionsUrl.href, {
      headers: this.headers,
      customFetch: this.fetch
    });
  }
  /**
   * Supabase Storage allows you to manage user-generated content, such as photos or videos.
   */
  get storage() {
    return new xs(this.storageUrl.href, this.headers, this.fetch);
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
  rpc(e, t = {}, s = {}) {
    return this.rest.rpc(e, t, s);
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
    return Mr(this, void 0, void 0, function* () {
      if (this.accessToken)
        return yield this.accessToken();
      const { data: s } = yield this.auth.getSession();
      return (t = (e = s.session) === null || e === void 0 ? void 0 : e.access_token) !== null && t !== void 0 ? t : null;
    });
  }
  _initSupabaseAuthClient({ autoRefreshToken: e, persistSession: t, detectSessionInUrl: s, storage: i, storageKey: n, flowType: o, lock: a, debug: l }, h, c) {
    const u = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new qr({
      url: this.authUrl.href,
      headers: Object.assign(Object.assign({}, u), h),
      storageKey: n,
      autoRefreshToken: e,
      persistSession: t,
      detectSessionInUrl: s,
      storage: i,
      flowType: o,
      lock: a,
      debug: l,
      fetch: c,
      // auth checks if there is a custom authorizaiton header using this flag
      // so it knows whether to return an error when getUser is called with no session
      hasCustomAuthorizationHeader: "Authorization" in this.headers
    });
  }
  _initRealtimeClient(e) {
    return new ws(this.realtimeUrl.href, Object.assign(Object.assign({}, e), { params: Object.assign({ apikey: this.supabaseKey }, e == null ? void 0 : e.params) }));
  }
  _listenForAuthEvents() {
    return this.auth.onAuthStateChange((t, s) => {
      this._handleTokenChanged(t, "CLIENT", s == null ? void 0 : s.access_token);
    });
  }
  _handleTokenChanged(e, t, s) {
    (e === "TOKEN_REFRESHED" || e === "SIGNED_IN") && this.changedAccessToken !== s ? this.changedAccessToken = s : e === "SIGNED_OUT" && (this.realtime.setAuth(), t == "STORAGE" && this.auth.signOut(), this.changedAccessToken = void 0);
  }
}
const Fr = (r, e, t) => new Nr(r, e, t);
let X;
function zr({ supabaseUrl: r, supabaseKey: e }) {
  X = Fr(r, e), X.auth.getUser().then(({ data: { user: t } }) => {
    console.log(t ? "Logged in as: " + t.email : "Not logged in");
  }), Wr(), Jr();
}
function Wr() {
  document.querySelectorAll('[data-smoothr-auth="login"]').forEach((r) => {
    r.addEventListener("submit", async (e) => {
      e.preventDefault();
      const t = new FormData(r), s = t.get("email"), i = t.get("password");
      try {
        const { data: n, error: o } = await X.auth.signInWithPassword({ email: s, password: i });
        if (o)
          console.error(o);
        else {
          console.log(n.user ? "Logged in as: " + n.user.email : "Logged in"), document.dispatchEvent(new CustomEvent("smoothr:login", { detail: n }));
          const a = await Fe("login");
          window.location.href = a;
        }
      } catch (n) {
        console.error(n);
      }
    });
  });
}
function Jr() {
  document.querySelectorAll('[data-smoothr-auth="logout"]').forEach((r) => {
    r.addEventListener("click", async (e) => {
      e.preventDefault();
      const { error: t } = await X.auth.signOut();
      t && console.error(t);
      const { data: { user: s } } = await X.auth.getUser();
      console.log(s ? "Logged in as: " + s.email : "Not logged in"), document.dispatchEvent(new CustomEvent("smoothr:logout"));
      const i = await Fe("logout");
      window.location.href = i;
    });
  });
}
function $t(r) {
  return r.replace(/^www\./, "").toLowerCase();
}
async function Fe(r) {
  const e = $t(window.location.hostname);
  try {
    const { data: t, error: s } = await X.from("stores").select(`${r}_redirect_url`).eq("store_domain", e).single();
    if (s || !t)
      throw s;
    return t[`${r}_redirect_url`] || window.location.origin;
  } catch (t) {
    return console.error(t), window.location.origin;
  }
}
const di = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  initAuth: zr,
  lookupRedirectUrl: Fe,
  normalizeDomain: $t
}, Symbol.toStringTag, { value: "Module" }));
console.log("Smoothr SDK loaded");
export {
  Kr as abandonedCart,
  Hr as affiliates,
  Gr as analytics,
  di as auth,
  Vr as currency,
  Qr as dashboard,
  Xr as discounts,
  Yr as orders,
  Zr as returns,
  ei as reviews,
  ti as subscriptions
};
