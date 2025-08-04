const us = (s) => {
  let e;
  return s ? e = s : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => ye).then(({ default: r }) => r(...t)) : e = fetch, (...t) => e(...t);
};
class Tt extends Error {
  constructor(e, t = "FunctionsError", r) {
    super(e), this.name = t, this.context = r;
  }
}
class ds extends Tt {
  constructor(e) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", e);
  }
}
class Ut extends Tt {
  constructor(e) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", e);
  }
}
class Lt extends Tt {
  constructor(e) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e);
  }
}
var dt;
(function(s) {
  s.Any = "any", s.ApNortheast1 = "ap-northeast-1", s.ApNortheast2 = "ap-northeast-2", s.ApSouth1 = "ap-south-1", s.ApSoutheast1 = "ap-southeast-1", s.ApSoutheast2 = "ap-southeast-2", s.CaCentral1 = "ca-central-1", s.EuCentral1 = "eu-central-1", s.EuWest1 = "eu-west-1", s.EuWest2 = "eu-west-2", s.EuWest3 = "eu-west-3", s.SaEast1 = "sa-east-1", s.UsEast1 = "us-east-1", s.UsWest1 = "us-west-1", s.UsWest2 = "us-west-2";
})(dt || (dt = {}));
var hs = function(s, e, t, r) {
  function n(o) {
    return o instanceof t ? o : new t(function(i) {
      i(o);
    });
  }
  return new (t || (t = Promise))(function(o, i) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        i(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        i(d);
      }
    }
    function l(u) {
      u.done ? o(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
class fs {
  constructor(e, { headers: t = {}, customFetch: r, region: n = dt.Any } = {}) {
    this.url = e, this.headers = t, this.region = n, this.fetch = us(r);
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
    return hs(this, void 0, void 0, function* () {
      try {
        const { headers: n, method: o, body: i } = t;
        let a = {}, { region: c } = t;
        c || (c = this.region);
        const l = new URL(`${this.url}/${e}`);
        c && c !== "any" && (a["x-region"] = c, l.searchParams.set("forceFunctionRegion", c));
        let u;
        i && (n && !Object.prototype.hasOwnProperty.call(n, "Content-Type") || !n) && (typeof Blob < "u" && i instanceof Blob || i instanceof ArrayBuffer ? (a["Content-Type"] = "application/octet-stream", u = i) : typeof i == "string" ? (a["Content-Type"] = "text/plain", u = i) : typeof FormData < "u" && i instanceof FormData ? u = i : (a["Content-Type"] = "application/json", u = JSON.stringify(i)));
        const d = yield this.fetch(l.toString(), {
          method: o || "POST",
          // headers priority is (high to low):
          // 1. invoke-level headers
          // 2. client-level headers
          // 3. default Content-Type header
          headers: Object.assign(Object.assign(Object.assign({}, a), this.headers), n),
          body: u
        }).catch((w) => {
          throw new ds(w);
        }), h = d.headers.get("x-relay-error");
        if (h && h === "true")
          throw new Ut(d);
        if (!d.ok)
          throw new Lt(d);
        let f = ((r = d.headers.get("Content-Type")) !== null && r !== void 0 ? r : "text/plain").split(";")[0].trim(), g;
        return f === "application/json" ? g = yield d.json() : f === "application/octet-stream" ? g = yield d.blob() : f === "text/event-stream" ? g = d : f === "multipart/form-data" ? g = yield d.formData() : g = yield d.text(), { data: g, error: null, response: d };
      } catch (n) {
        return {
          data: null,
          error: n,
          response: n instanceof Lt || n instanceof Ut ? n.context : void 0
        };
      }
    });
  }
}
var x = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function gs(s) {
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
var P = {}, Ct = {}, Me = {}, je = {}, Fe = {}, We = {}, ps = function() {
  if (typeof self < "u")
    return self;
  if (typeof window < "u")
    return window;
  if (typeof global < "u")
    return global;
  throw new Error("unable to locate global object");
}, me = ps();
const ms = me.fetch, pr = me.fetch.bind(me), mr = me.Headers, ws = me.Request, ys = me.Response, ye = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Headers: mr,
  Request: ws,
  Response: ys,
  default: pr,
  fetch: ms
}, Symbol.toStringTag, { value: "Module" })), vs = /* @__PURE__ */ gs(ye);
var ze = {};
Object.defineProperty(ze, "__esModule", { value: !0 });
let _s = class extends Error {
  constructor(e) {
    super(e.message), this.name = "PostgrestError", this.details = e.details, this.hint = e.hint, this.code = e.code;
  }
};
var Ji = ze.default = _s, wr = x && x.__importDefault || function(s) {
  return s && s.__esModule ? s : { default: s };
};
Object.defineProperty(We, "__esModule", { value: !0 });
const bs = wr(vs), Ss = wr(ze);
let ks = class {
  constructor(e) {
    this.shouldThrowOnError = !1, this.method = e.method, this.url = e.url, this.headers = e.headers, this.schema = e.schema, this.body = e.body, this.shouldThrowOnError = e.shouldThrowOnError, this.signal = e.signal, this.isMaybeSingle = e.isMaybeSingle, e.fetch ? this.fetch = e.fetch : typeof fetch > "u" ? this.fetch = bs.default : this.fetch = fetch;
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
    }).then(async (o) => {
      var i, a, c;
      let l = null, u = null, d = null, h = o.status, f = o.statusText;
      if (o.ok) {
        if (this.method !== "HEAD") {
          const y = await o.text();
          y === "" || (this.headers.Accept === "text/csv" || this.headers.Accept && this.headers.Accept.includes("application/vnd.pgrst.plan+text") ? u = y : u = JSON.parse(y));
        }
        const w = (i = this.headers.Prefer) === null || i === void 0 ? void 0 : i.match(/count=(exact|planned|estimated)/), p = (a = o.headers.get("content-range")) === null || a === void 0 ? void 0 : a.split("/");
        w && p && p.length > 1 && (d = parseInt(p[1])), this.isMaybeSingle && this.method === "GET" && Array.isArray(u) && (u.length > 1 ? (l = {
          // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
          code: "PGRST116",
          details: `Results contain ${u.length} rows, application/vnd.pgrst.object+json requires 1 row`,
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned"
        }, u = null, d = null, h = 406, f = "Not Acceptable") : u.length === 1 ? u = u[0] : u = null);
      } else {
        const w = await o.text();
        try {
          l = JSON.parse(w), Array.isArray(l) && o.status === 404 && (u = [], l = null, h = 200, f = "OK");
        } catch {
          o.status === 404 && w === "" ? (h = 204, f = "No Content") : l = {
            message: w
          };
        }
        if (l && this.isMaybeSingle && (!((c = l == null ? void 0 : l.details) === null || c === void 0) && c.includes("0 rows")) && (l = null, h = 200, f = "OK"), l && this.shouldThrowOnError)
          throw new Ss.default(l);
      }
      return {
        error: l,
        data: u,
        count: d,
        status: h,
        statusText: f
      };
    });
    return this.shouldThrowOnError || (n = n.catch((o) => {
      var i, a, c;
      return {
        error: {
          message: `${(i = o == null ? void 0 : o.name) !== null && i !== void 0 ? i : "FetchError"}: ${o == null ? void 0 : o.message}`,
          details: `${(a = o == null ? void 0 : o.stack) !== null && a !== void 0 ? a : ""}`,
          hint: "",
          code: `${(c = o == null ? void 0 : o.code) !== null && c !== void 0 ? c : ""}`
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
var Qi = We.default = ks, Es = x && x.__importDefault || function(s) {
  return s && s.__esModule ? s : { default: s };
};
Object.defineProperty(Fe, "__esModule", { value: !0 });
const Os = Es(We);
let Ts = class extends Os.default {
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
  order(e, { ascending: t = !0, nullsFirst: r, foreignTable: n, referencedTable: o = n } = {}) {
    const i = o ? `${o}.order` : "order", a = this.url.searchParams.get(i);
    return this.url.searchParams.set(i, `${a ? `${a},` : ""}${e}.${t ? "asc" : "desc"}${r === void 0 ? "" : r ? ".nullsfirst" : ".nullslast"}`), this;
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
    const o = typeof n > "u" ? "offset" : `${n}.offset`, i = typeof n > "u" ? "limit" : `${n}.limit`;
    return this.url.searchParams.set(o, `${e}`), this.url.searchParams.set(i, `${t - e + 1}`), this;
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
  explain({ analyze: e = !1, verbose: t = !1, settings: r = !1, buffers: n = !1, wal: o = !1, format: i = "text" } = {}) {
    var a;
    const c = [
      e ? "analyze" : null,
      t ? "verbose" : null,
      r ? "settings" : null,
      n ? "buffers" : null,
      o ? "wal" : null
    ].filter(Boolean).join("|"), l = (a = this.headers.Accept) !== null && a !== void 0 ? a : "application/json";
    return this.headers.Accept = `application/vnd.pgrst.plan+${i}; for="${l}"; options=${c};`, i === "json" ? this : this;
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
var Xi = Fe.default = Ts, Cs = x && x.__importDefault || function(s) {
  return s && s.__esModule ? s : { default: s };
};
Object.defineProperty(je, "__esModule", { value: !0 });
const As = Cs(Fe);
let js = class extends As.default {
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
    let o = "";
    n === "plain" ? o = "pl" : n === "phrase" ? o = "ph" : n === "websearch" && (o = "w");
    const i = r === void 0 ? "" : `(${r})`;
    return this.url.searchParams.append(e, `${o}fts${i}.${t}`), this;
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
var ea = je.default = js, Ps = x && x.__importDefault || function(s) {
  return s && s.__esModule ? s : { default: s };
};
Object.defineProperty(Me, "__esModule", { value: !0 });
const Se = Ps(je);
let $s = class {
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
    let o = !1;
    const i = (e ?? "*").split("").map((a) => /\s/.test(a) && !o ? "" : (a === '"' && (o = !o), a)).join("");
    return this.url.searchParams.set("select", i), r && (this.headers.Prefer = `count=${r}`), new Se.default({
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
    const n = "POST", o = [];
    if (this.headers.Prefer && o.push(this.headers.Prefer), t && o.push(`count=${t}`), r || o.push("missing=default"), this.headers.Prefer = o.join(","), Array.isArray(e)) {
      const i = e.reduce((a, c) => a.concat(Object.keys(c)), []);
      if (i.length > 0) {
        const a = [...new Set(i)].map((c) => `"${c}"`);
        this.url.searchParams.set("columns", a.join(","));
      }
    }
    return new Se.default({
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
  upsert(e, { onConflict: t, ignoreDuplicates: r = !1, count: n, defaultToNull: o = !0 } = {}) {
    const i = "POST", a = [`resolution=${r ? "ignore" : "merge"}-duplicates`];
    if (t !== void 0 && this.url.searchParams.set("on_conflict", t), this.headers.Prefer && a.push(this.headers.Prefer), n && a.push(`count=${n}`), o || a.push("missing=default"), this.headers.Prefer = a.join(","), Array.isArray(e)) {
      const c = e.reduce((l, u) => l.concat(Object.keys(u)), []);
      if (c.length > 0) {
        const l = [...new Set(c)].map((u) => `"${u}"`);
        this.url.searchParams.set("columns", l.join(","));
      }
    }
    return new Se.default({
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
    return this.headers.Prefer && n.push(this.headers.Prefer), t && n.push(`count=${t}`), this.headers.Prefer = n.join(","), new Se.default({
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
    return e && r.push(`count=${e}`), this.headers.Prefer && r.unshift(this.headers.Prefer), this.headers.Prefer = r.join(","), new Se.default({
      method: t,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
var ra = Me.default = $s, Ge = {}, He = {};
Object.defineProperty(He, "__esModule", { value: !0 });
var xs = He.version = void 0;
xs = He.version = "0.0.0-automated";
Object.defineProperty(Ge, "__esModule", { value: !0 });
var Rs = Ge.DEFAULT_HEADERS = void 0;
const Is = He;
Rs = Ge.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${Is.version}` };
var yr = x && x.__importDefault || function(s) {
  return s && s.__esModule ? s : { default: s };
};
Object.defineProperty(Ct, "__esModule", { value: !0 });
const Us = yr(Me), Ls = yr(je), Ds = Ge;
let qs = class vr {
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
    this.url = e, this.headers = Object.assign(Object.assign({}, Ds.DEFAULT_HEADERS), t), this.schemaName = r, this.fetch = n;
  }
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(e) {
    const t = new URL(`${this.url}/${e}`);
    return new Us.default(t, {
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
    return new vr(this.url, {
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
  rpc(e, t = {}, { head: r = !1, get: n = !1, count: o } = {}) {
    let i;
    const a = new URL(`${this.url}/rpc/${e}`);
    let c;
    r || n ? (i = r ? "HEAD" : "GET", Object.entries(t).filter(([u, d]) => d !== void 0).map(([u, d]) => [u, Array.isArray(d) ? `{${d.join(",")}}` : `${d}`]).forEach(([u, d]) => {
      a.searchParams.append(u, d);
    })) : (i = "POST", c = t);
    const l = Object.assign({}, this.headers);
    return o && (l.Prefer = `count=${o}`), new Ls.default({
      method: i,
      url: a,
      headers: l,
      schema: this.schemaName,
      body: c,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
var sa = Ct.default = qs, ve = x && x.__importDefault || function(s) {
  return s && s.__esModule ? s : { default: s };
};
Object.defineProperty(P, "__esModule", { value: !0 });
var Ns = P.PostgrestError = zs = P.PostgrestBuilder = Ws = P.PostgrestTransformBuilder = Fs = P.PostgrestFilterBuilder = Ms = P.PostgrestQueryBuilder = Bs = P.PostgrestClient = void 0;
const _r = ve(Ct);
var Bs = P.PostgrestClient = _r.default;
const br = ve(Me);
var Ms = P.PostgrestQueryBuilder = br.default;
const Sr = ve(je);
var Fs = P.PostgrestFilterBuilder = Sr.default;
const kr = ve(Fe);
var Ws = P.PostgrestTransformBuilder = kr.default;
const Er = ve(We);
var zs = P.PostgrestBuilder = Er.default;
const Or = ve(ze);
Ns = P.PostgrestError = Or.default;
var Gs = P.default = {
  PostgrestClient: _r.default,
  PostgrestQueryBuilder: br.default,
  PostgrestFilterBuilder: Sr.default,
  PostgrestTransformBuilder: kr.default,
  PostgrestBuilder: Er.default,
  PostgrestError: Or.default
};
const {
  PostgrestClient: Hs,
  PostgrestQueryBuilder: na,
  PostgrestFilterBuilder: oa,
  PostgrestTransformBuilder: ia,
  PostgrestBuilder: aa,
  PostgrestError: ca
} = Gs;
function Ks() {
  if (typeof WebSocket < "u")
    return WebSocket;
  if (typeof global.WebSocket < "u")
    return global.WebSocket;
  if (typeof window.WebSocket < "u")
    return window.WebSocket;
  if (typeof self.WebSocket < "u")
    return self.WebSocket;
  throw new Error("`WebSocket` is not supported in this environment");
}
const Js = Ks(), Vs = "2.11.15", Qs = `realtime-js/${Vs}`, Ys = "1.0.0";
const Tr = 1e4, Xs = 1e3;
var Ee;
(function(s) {
  s[s.connecting = 0] = "connecting", s[s.open = 1] = "open", s[s.closing = 2] = "closing", s[s.closed = 3] = "closed";
})(Ee || (Ee = {}));
var A;
(function(s) {
  s.closed = "closed", s.errored = "errored", s.joined = "joined", s.joining = "joining", s.leaving = "leaving";
})(A || (A = {}));
var D;
(function(s) {
  s.close = "phx_close", s.error = "phx_error", s.join = "phx_join", s.reply = "phx_reply", s.leave = "phx_leave", s.access_token = "access_token";
})(D || (D = {}));
var ht;
(function(s) {
  s.websocket = "websocket";
})(ht || (ht = {}));
var re;
(function(s) {
  s.Connecting = "connecting", s.Open = "open", s.Closing = "closing", s.Closed = "closed";
})(re || (re = {}));
class Zs {
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
    const n = t.getUint8(1), o = t.getUint8(2);
    let i = this.HEADER_LENGTH + 2;
    const a = r.decode(e.slice(i, i + n));
    i = i + n;
    const c = r.decode(e.slice(i, i + o));
    i = i + o;
    const l = JSON.parse(r.decode(e.slice(i, e.byteLength)));
    return { ref: null, topic: a, event: c, payload: l };
  }
}
class Cr {
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
var k;
(function(s) {
  s.abstime = "abstime", s.bool = "bool", s.date = "date", s.daterange = "daterange", s.float4 = "float4", s.float8 = "float8", s.int2 = "int2", s.int4 = "int4", s.int4range = "int4range", s.int8 = "int8", s.int8range = "int8range", s.json = "json", s.jsonb = "jsonb", s.money = "money", s.numeric = "numeric", s.oid = "oid", s.reltime = "reltime", s.text = "text", s.time = "time", s.timestamp = "timestamp", s.timestamptz = "timestamptz", s.timetz = "timetz", s.tsrange = "tsrange", s.tstzrange = "tstzrange";
})(k || (k = {}));
const Dt = (s, e, t = {}) => {
  var r;
  const n = (r = t.skipTypes) !== null && r !== void 0 ? r : [];
  return Object.keys(e).reduce((o, i) => (o[i] = en(i, s, e, n), o), {});
}, en = (s, e, t, r) => {
  const n = e.find((a) => a.name === s), o = n == null ? void 0 : n.type, i = t[s];
  return o && !r.includes(o) ? Ar(o, i) : ft(i);
}, Ar = (s, e) => {
  if (s.charAt(0) === "_") {
    const t = s.slice(1, s.length);
    return nn(e, t);
  }
  switch (s) {
    case k.bool:
      return tn(e);
    case k.float4:
    case k.float8:
    case k.int2:
    case k.int4:
    case k.int8:
    case k.numeric:
    case k.oid:
      return rn(e);
    case k.json:
    case k.jsonb:
      return sn(e);
    case k.timestamp:
      return on(e);
    case k.abstime:
    case k.date:
    case k.daterange:
    case k.int4range:
    case k.int8range:
    case k.money:
    case k.reltime:
    case k.text:
    case k.time:
    case k.timestamptz:
    case k.timetz:
    case k.tsrange:
    case k.tstzrange:
      return ft(e);
    default:
      return ft(e);
  }
}, ft = (s) => s, tn = (s) => {
  switch (s) {
    case "t":
      return !0;
    case "f":
      return !1;
    default:
      return s;
  }
}, rn = (s) => {
  if (typeof s == "string") {
    const e = parseFloat(s);
    if (!Number.isNaN(e))
      return e;
  }
  return s;
}, sn = (s) => {
  if (typeof s == "string")
    try {
      return JSON.parse(s);
    } catch (e) {
      return console.log(`JSON parse error: ${e}`), s;
    }
  return s;
}, nn = (s, e) => {
  if (typeof s != "string")
    return s;
  const t = s.length - 1, r = s[t];
  if (s[0] === "{" && r === "}") {
    let o;
    const i = s.slice(1, t);
    try {
      o = JSON.parse("[" + i + "]");
    } catch {
      o = i ? i.split(",") : [];
    }
    return o.map((a) => Ar(e, a));
  }
  return s;
}, on = (s) => typeof s == "string" ? s.replace(" ", "T") : s, jr = (s) => {
  let e = s;
  return e = e.replace(/^ws/i, "http"), e = e.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, ""), e.replace(/\/+$/, "");
};
class Ve {
  /**
   * Initializes the Push
   *
   * @param channel The Channel
   * @param event The event, for example `"phx_join"`
   * @param payload The payload, for example `{user_id: 123}`
   * @param timeout The push timeout in milliseconds
   */
  constructor(e, t, r = {}, n = Tr) {
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
var qt;
(function(s) {
  s.SYNC = "sync", s.JOIN = "join", s.LEAVE = "leave";
})(qt || (qt = {}));
class Oe {
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
      const { onJoin: o, onLeave: i, onSync: a } = this.caller;
      this.joinRef = this.channel._joinRef(), this.state = Oe.syncState(this.state, n, o, i), this.pendingDiffs.forEach((c) => {
        this.state = Oe.syncDiff(this.state, c, o, i);
      }), this.pendingDiffs = [], a();
    }), this.channel._on(r.diff, {}, (n) => {
      const { onJoin: o, onLeave: i, onSync: a } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(n) : (this.state = Oe.syncDiff(this.state, n, o, i), a());
    }), this.onJoin((n, o, i) => {
      this.channel._trigger("presence", {
        event: "join",
        key: n,
        currentPresences: o,
        newPresences: i
      });
    }), this.onLeave((n, o, i) => {
      this.channel._trigger("presence", {
        event: "leave",
        key: n,
        currentPresences: o,
        leftPresences: i
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
    const o = this.cloneDeep(e), i = this.transformState(t), a = {}, c = {};
    return this.map(o, (l, u) => {
      i[l] || (c[l] = u);
    }), this.map(i, (l, u) => {
      const d = o[l];
      if (d) {
        const h = u.map((p) => p.presence_ref), f = d.map((p) => p.presence_ref), g = u.filter((p) => f.indexOf(p.presence_ref) < 0), w = d.filter((p) => h.indexOf(p.presence_ref) < 0);
        g.length > 0 && (a[l] = g), w.length > 0 && (c[l] = w);
      } else
        a[l] = u;
    }), this.syncDiff(o, { joins: a, leaves: c }, r, n);
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
    const { joins: o, leaves: i } = {
      joins: this.transformState(t.joins),
      leaves: this.transformState(t.leaves)
    };
    return r || (r = () => {
    }), n || (n = () => {
    }), this.map(o, (a, c) => {
      var l;
      const u = (l = e[a]) !== null && l !== void 0 ? l : [];
      if (e[a] = this.cloneDeep(c), u.length > 0) {
        const d = e[a].map((f) => f.presence_ref), h = u.filter((f) => d.indexOf(f.presence_ref) < 0);
        e[a].unshift(...h);
      }
      r(a, u, c);
    }), this.map(i, (a, c) => {
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
      return "metas" in n ? t[r] = n.metas.map((o) => (o.presence_ref = o.phx_ref, delete o.phx_ref, delete o.phx_ref_prev, o)) : t[r] = n, t;
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
var Nt;
(function(s) {
  s.ALL = "*", s.INSERT = "INSERT", s.UPDATE = "UPDATE", s.DELETE = "DELETE";
})(Nt || (Nt = {}));
var Bt;
(function(s) {
  s.BROADCAST = "broadcast", s.PRESENCE = "presence", s.POSTGRES_CHANGES = "postgres_changes", s.SYSTEM = "system";
})(Bt || (Bt = {}));
var F;
(function(s) {
  s.SUBSCRIBED = "SUBSCRIBED", s.TIMED_OUT = "TIMED_OUT", s.CLOSED = "CLOSED", s.CHANNEL_ERROR = "CHANNEL_ERROR";
})(F || (F = {}));
class At {
  constructor(e, t = { config: {} }, r) {
    this.topic = e, this.params = t, this.socket = r, this.bindings = {}, this.state = A.closed, this.joinedOnce = !1, this.pushBuffer = [], this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "" },
      private: !1
    }, t.config), this.timeout = this.socket.timeout, this.joinPush = new Ve(this, D.join, this.params, this.timeout), this.rejoinTimer = new Cr(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs), this.joinPush.receive("ok", () => {
      this.state = A.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((n) => n.send()), this.pushBuffer = [];
    }), this._onClose(() => {
      this.rejoinTimer.reset(), this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`), this.state = A.closed, this.socket._remove(this);
    }), this._onError((n) => {
      this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, n), this.state = A.errored, this.rejoinTimer.scheduleTimeout());
    }), this.joinPush.receive("timeout", () => {
      this._isJoining() && (this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), this.state = A.errored, this.rejoinTimer.scheduleTimeout());
    }), this._on(D.reply, {}, (n, o) => {
      this._trigger(this._replyEventName(o), n);
    }), this.presence = new Oe(this), this.broadcastEndpointURL = jr(this.socket.endPoint) + "/api/broadcast", this.private = this.params.config.private || !1;
  }
  /** Subscribe registers your client with the server */
  subscribe(e, t = this.timeout) {
    var r, n;
    if (this.socket.isConnected() || this.socket.connect(), this.state == A.closed) {
      const { config: { broadcast: o, presence: i, private: a } } = this.params;
      this._onError((u) => e == null ? void 0 : e(F.CHANNEL_ERROR, u)), this._onClose(() => e == null ? void 0 : e(F.CLOSED));
      const c = {}, l = {
        broadcast: o,
        presence: i,
        postgres_changes: (n = (r = this.bindings.postgres_changes) === null || r === void 0 ? void 0 : r.map((u) => u.filter)) !== null && n !== void 0 ? n : [],
        private: a
      };
      this.socket.accessTokenValue && (c.access_token = this.socket.accessTokenValue), this.updateJoinPayload(Object.assign({ config: l }, c)), this.joinedOnce = !0, this._rejoin(t), this.joinPush.receive("ok", async ({ postgres_changes: u }) => {
        var d;
        if (this.socket.setAuth(), u === void 0) {
          e == null || e(F.SUBSCRIBED);
          return;
        } else {
          const h = this.bindings.postgres_changes, f = (d = h == null ? void 0 : h.length) !== null && d !== void 0 ? d : 0, g = [];
          for (let w = 0; w < f; w++) {
            const p = h[w], { filter: { event: y, schema: S, table: m, filter: b } } = p, C = u && u[w];
            if (C && C.event === y && C.schema === S && C.table === m && C.filter === b)
              g.push(Object.assign(Object.assign({}, p), { id: C.id }));
            else {
              this.unsubscribe(), this.state = A.errored, e == null || e(F.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
              return;
            }
          }
          this.bindings.postgres_changes = g, e && e(F.SUBSCRIBED);
          return;
        }
      }).receive("error", (u) => {
        this.state = A.errored, e == null || e(F.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(u).join(", ") || "error")));
      }).receive("timeout", () => {
        e == null || e(F.TIMED_OUT);
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
      const { event: o, payload: i } = e, c = {
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
              event: o,
              payload: i,
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
      return new Promise((o) => {
        var i, a, c;
        const l = this._push(e.type, e, t.timeout || this.timeout);
        e.type === "broadcast" && !(!((c = (a = (i = this.params) === null || i === void 0 ? void 0 : i.config) === null || a === void 0 ? void 0 : a.broadcast) === null || c === void 0) && c.ack) && o("ok"), l.receive("ok", () => o("ok")), l.receive("error", () => o("error")), l.receive("timeout", () => o("timed out"));
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
    this.state = A.leaving;
    const t = () => {
      this.socket.log("channel", `leave ${this.topic}`), this._trigger(D.close, "leave", this._joinRef());
    };
    this.joinPush.destroy();
    let r = null;
    return new Promise((n) => {
      r = new Ve(this, D.leave, {}, e), r.receive("ok", () => {
        t(), n("ok");
      }).receive("timeout", () => {
        t(), n("timed out");
      }).receive("error", () => {
        n("error");
      }), r.send(), this._canPush() || r.trigger("ok", {});
    }).finally(() => {
      r == null || r.destroy();
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
    const n = new AbortController(), o = setTimeout(() => n.abort(), r), i = await this.socket.fetch(e, Object.assign(Object.assign({}, t), { signal: n.signal }));
    return clearTimeout(o), i;
  }
  /** @internal */
  _push(e, t, r = this.timeout) {
    if (!this.joinedOnce)
      throw `tried to push '${e}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
    let n = new Ve(this, e, t, r);
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
    var n, o;
    const i = e.toLocaleLowerCase(), { close: a, error: c, leave: l, join: u } = D;
    if (r && [a, c, l, u].indexOf(i) >= 0 && r !== this._joinRef())
      return;
    let h = this._onMessage(i, t, r);
    if (t && !h)
      throw "channel onMessage callbacks must return the payload, modified or unmodified";
    ["insert", "update", "delete"].includes(i) ? (n = this.bindings.postgres_changes) === null || n === void 0 || n.filter((f) => {
      var g, w, p;
      return ((g = f.filter) === null || g === void 0 ? void 0 : g.event) === "*" || ((p = (w = f.filter) === null || w === void 0 ? void 0 : w.event) === null || p === void 0 ? void 0 : p.toLocaleLowerCase()) === i;
    }).map((f) => f.callback(h, r)) : (o = this.bindings[i]) === null || o === void 0 || o.filter((f) => {
      var g, w, p, y, S, m;
      if (["broadcast", "presence", "postgres_changes"].includes(i))
        if ("id" in f) {
          const b = f.id, C = (g = f.filter) === null || g === void 0 ? void 0 : g.event;
          return b && ((w = t.ids) === null || w === void 0 ? void 0 : w.includes(b)) && (C === "*" || (C == null ? void 0 : C.toLocaleLowerCase()) === ((p = t.data) === null || p === void 0 ? void 0 : p.type.toLocaleLowerCase()));
        } else {
          const b = (S = (y = f == null ? void 0 : f.filter) === null || y === void 0 ? void 0 : y.event) === null || S === void 0 ? void 0 : S.toLocaleLowerCase();
          return b === "*" || b === ((m = t == null ? void 0 : t.event) === null || m === void 0 ? void 0 : m.toLocaleLowerCase());
        }
      else
        return f.type.toLocaleLowerCase() === i;
    }).map((f) => {
      if (typeof h == "object" && "ids" in h) {
        const g = h.data, { schema: w, table: p, commit_timestamp: y, type: S, errors: m } = g;
        h = Object.assign(Object.assign({}, {
          schema: w,
          table: p,
          commit_timestamp: y,
          eventType: S,
          new: {},
          old: {},
          errors: m
        }), this._getPayloadRecords(g));
      }
      f.callback(h, r);
    });
  }
  /** @internal */
  _isClosed() {
    return this.state === A.closed;
  }
  /** @internal */
  _isJoined() {
    return this.state === A.joined;
  }
  /** @internal */
  _isJoining() {
    return this.state === A.joining;
  }
  /** @internal */
  _isLeaving() {
    return this.state === A.leaving;
  }
  /** @internal */
  _replyEventName(e) {
    return `chan_reply_${e}`;
  }
  /** @internal */
  _on(e, t, r) {
    const n = e.toLocaleLowerCase(), o = {
      type: n,
      filter: t,
      callback: r
    };
    return this.bindings[n] ? this.bindings[n].push(o) : this.bindings[n] = [o], this;
  }
  /** @internal */
  _off(e, t) {
    const r = e.toLocaleLowerCase();
    return this.bindings[r] = this.bindings[r].filter((n) => {
      var o;
      return !(((o = n.type) === null || o === void 0 ? void 0 : o.toLocaleLowerCase()) === r && At.isEqual(n.filter, t));
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
    this._on(D.close, {}, e);
  }
  /**
   * Registers a callback that will be executed when the channel encounteres an error.
   *
   * @internal
   */
  _onError(e) {
    this._on(D.error, {}, (t) => e(t));
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
    this._isLeaving() || (this.socket._leaveOpenTopic(this.topic), this.state = A.joining, this.joinPush.resend(e));
  }
  /** @internal */
  _getPayloadRecords(e) {
    const t = {
      new: {},
      old: {}
    };
    return (e.type === "INSERT" || e.type === "UPDATE") && (t.new = Dt(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (t.old = Dt(e.columns, e.old_record)), t;
  }
}
const Mt = () => {
}, an = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
class cn {
  /**
   * Initializes the Socket.
   *
   * @param endPoint The string WebSocket endpoint, ie, "ws://example.com/socket", "wss://example.com", "/socket" (inherited host & protocol)
   * @param httpEndpoint The string HTTP endpoint, ie, "https://example.com", "/" (inherited host & protocol)
   * @param options.transport The Websocket Transport, for example WebSocket. This can be a custom implementation
   * @param options.timeout The default timeout in milliseconds to trigger push timeouts.
   * @param options.params The optional params to pass when connecting.
   * @param options.headers Deprecated: headers cannot be set on websocket connections and this option will be removed in the future.
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
    this.accessTokenValue = null, this.apiKey = null, this.channels = new Array(), this.endPoint = "", this.httpEndpoint = "", this.headers = {}, this.params = {}, this.timeout = Tr, this.heartbeatIntervalMs = 25e3, this.heartbeatTimer = void 0, this.pendingHeartbeatRef = null, this.heartbeatCallback = Mt, this.ref = 0, this.logger = Mt, this.conn = null, this.sendBuffer = [], this.serializer = new Zs(), this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    }, this.accessToken = null, this._resolveFetch = (o) => {
      let i;
      return o ? i = o : typeof fetch > "u" ? i = (...a) => Promise.resolve().then(() => ye).then(({ default: c }) => c(...a)) : i = fetch, (...a) => i(...a);
    }, this.endPoint = `${e}/${ht.websocket}`, this.httpEndpoint = jr(e), t != null && t.transport ? this.transport = t.transport : this.transport = null, t != null && t.params && (this.params = t.params), t != null && t.timeout && (this.timeout = t.timeout), t != null && t.logger && (this.logger = t.logger), (t != null && t.logLevel || t != null && t.log_level) && (this.logLevel = t.logLevel || t.log_level, this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel })), t != null && t.heartbeatIntervalMs && (this.heartbeatIntervalMs = t.heartbeatIntervalMs);
    const n = (r = t == null ? void 0 : t.params) === null || r === void 0 ? void 0 : r.apikey;
    if (n && (this.accessTokenValue = n, this.apiKey = n), this.reconnectAfterMs = t != null && t.reconnectAfterMs ? t.reconnectAfterMs : (o) => [1e3, 2e3, 5e3, 1e4][o - 1] || 1e4, this.encode = t != null && t.encode ? t.encode : (o, i) => i(JSON.stringify(o)), this.decode = t != null && t.decode ? t.decode : this.serializer.decode.bind(this.serializer), this.reconnectTimer = new Cr(async () => {
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
      if (this.transport || (this.transport = Js), !this.transport)
        throw new Error("No transport provided");
      this.conn = new this.transport(this.endpointURL()), this.setupConnection();
    }
  }
  /**
   * Returns the URL of the websocket.
   * @returns string The URL of the websocket.
   */
  endpointURL() {
    return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: Ys }));
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
    return this.channels.length === 0 && this.disconnect(), t;
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
      case Ee.connecting:
        return re.Connecting;
      case Ee.open:
        return re.Open;
      case Ee.closing:
        return re.Closing;
      default:
        return re.Closed;
    }
  }
  /**
   * Returns `true` is the connection is open.
   */
  isConnected() {
    return this.connectionState() === re.Open;
  }
  channel(e, t = { config: {} }) {
    const r = `realtime:${e}`, n = this.getChannels().find((o) => o.topic === r);
    if (n)
      return n;
    {
      const o = new At(`realtime:${e}`, t, this);
      return this.channels.push(o), o;
    }
  }
  /**
   * Push out a message if the socket is connected.
   *
   * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
   */
  push(e) {
    const { topic: t, event: r, payload: n, ref: o } = e, i = () => {
      this.encode(e, (a) => {
        var c;
        (c = this.conn) === null || c === void 0 || c.send(a);
      });
    };
    this.log("push", `${t} ${r} (${o})`, n), this.isConnected() ? i() : this.sendBuffer.push(i);
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
      const n = {
        access_token: t,
        version: Qs
      };
      t && r.updateJoinPayload(n), r.joinedOnce && r._isJoined() && r._push(D.access_token, {
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
      this.pendingHeartbeatRef = null, this.log("transport", "heartbeat timeout. Attempting to re-establish connection"), this.heartbeatCallback("timeout"), (e = this.conn) === null || e === void 0 || e.close(Xs, "hearbeat timeout");
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
      let { topic: r, event: n, payload: o, ref: i } = t;
      r === "phoenix" && n === "phx_reply" && this.heartbeatCallback(t.payload.status == "ok" ? "ok" : "error"), i && i === this.pendingHeartbeatRef && (this.pendingHeartbeatRef = null), this.log("receive", `${o.status || ""} ${r} ${n} ${i && "(" + i + ")" || ""}`, o), Array.from(this.channels).filter((a) => a._isMember(r)).forEach((a) => a._trigger(n, o, i)), this.stateChangeCallbacks.message.forEach((a) => a(t));
    });
  }
  /** @internal */
  _onConnOpen() {
    this.log("transport", `connected to ${this.endpointURL()}`), this.flushSendBuffer(), this.reconnectTimer.reset(), this.worker ? this.workerRef || this._startWorkerHeartbeat() : this._startHeartbeat(), this.stateChangeCallbacks.open.forEach((e) => e());
  }
  /** @internal */
  _startHeartbeat() {
    this.heartbeatTimer && clearInterval(this.heartbeatTimer), this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.heartbeatIntervalMs);
  }
  /** @internal */
  _startWorkerHeartbeat() {
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
  /** @internal */
  _onConnClose(e) {
    this.log("transport", "close", e), this._triggerChanError(), this.heartbeatTimer && clearInterval(this.heartbeatTimer), this.reconnectTimer.scheduleTimeout(), this.stateChangeCallbacks.close.forEach((t) => t(e));
  }
  /** @internal */
  _onConnError(e) {
    this.log("transport", `${e}`), this._triggerChanError(), this.stateChangeCallbacks.error.forEach((t) => t(e));
  }
  /** @internal */
  _triggerChanError() {
    this.channels.forEach((e) => e._trigger(D.error));
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
      const r = new Blob([an], { type: "application/javascript" });
      t = URL.createObjectURL(r);
    }
    return t;
  }
}
class jt extends Error {
  constructor(e) {
    super(e), this.__isStorageError = !0, this.name = "StorageError";
  }
}
function T(s) {
  return typeof s == "object" && s !== null && "__isStorageError" in s;
}
class ln extends jt {
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
class gt extends jt {
  constructor(e, t) {
    super(e), this.name = "StorageUnknownError", this.originalError = t;
  }
}
var un = function(s, e, t, r) {
  function n(o) {
    return o instanceof t ? o : new t(function(i) {
      i(o);
    });
  }
  return new (t || (t = Promise))(function(o, i) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        i(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        i(d);
      }
    }
    function l(u) {
      u.done ? o(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
const Pr = (s) => {
  let e;
  return s ? e = s : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => ye).then(({ default: r }) => r(...t)) : e = fetch, (...t) => e(...t);
}, dn = () => un(void 0, void 0, void 0, function* () {
  return typeof Response > "u" ? (yield Promise.resolve().then(() => ye)).Response : Response;
}), pt = (s) => {
  if (Array.isArray(s))
    return s.map((t) => pt(t));
  if (typeof s == "function" || s !== Object(s))
    return s;
  const e = {};
  return Object.entries(s).forEach(([t, r]) => {
    const n = t.replace(/([-_][a-z])/gi, (o) => o.toUpperCase().replace(/[-_]/g, ""));
    e[n] = pt(r);
  }), e;
};
var ne = function(s, e, t, r) {
  function n(o) {
    return o instanceof t ? o : new t(function(i) {
      i(o);
    });
  }
  return new (t || (t = Promise))(function(o, i) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        i(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        i(d);
      }
    }
    function l(u) {
      u.done ? o(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
const Qe = (s) => s.msg || s.message || s.error_description || s.error || JSON.stringify(s), hn = (s, e, t) => ne(void 0, void 0, void 0, function* () {
  const r = yield dn();
  s instanceof r && !(t != null && t.noResolveJson) ? s.json().then((n) => {
    e(new ln(Qe(n), s.status || 500));
  }).catch((n) => {
    e(new gt(Qe(n), n));
  }) : e(new gt(Qe(s), s));
}), fn = (s, e, t, r) => {
  const n = { method: s, headers: (e == null ? void 0 : e.headers) || {} };
  return s === "GET" ? n : (n.headers = Object.assign({ "Content-Type": "application/json" }, e == null ? void 0 : e.headers), r && (n.body = JSON.stringify(r)), Object.assign(Object.assign({}, n), t));
};
function Pe(s, e, t, r, n, o) {
  return ne(this, void 0, void 0, function* () {
    return new Promise((i, a) => {
      s(t, fn(e, r, n, o)).then((c) => {
        if (!c.ok)
          throw c;
        return r != null && r.noResolveJson ? c : c.json();
      }).then((c) => i(c)).catch((c) => hn(c, a, r));
    });
  });
}
function Le(s, e, t, r) {
  return ne(this, void 0, void 0, function* () {
    return Pe(s, "GET", e, t, r);
  });
}
function H(s, e, t, r, n) {
  return ne(this, void 0, void 0, function* () {
    return Pe(s, "POST", e, r, n, t);
  });
}
function gn(s, e, t, r, n) {
  return ne(this, void 0, void 0, function* () {
    return Pe(s, "PUT", e, r, n, t);
  });
}
function pn(s, e, t, r) {
  return ne(this, void 0, void 0, function* () {
    return Pe(s, "HEAD", e, Object.assign(Object.assign({}, t), { noResolveJson: !0 }), r);
  });
}
function $r(s, e, t, r, n) {
  return ne(this, void 0, void 0, function* () {
    return Pe(s, "DELETE", e, r, n, t);
  });
}
var j = function(s, e, t, r) {
  function n(o) {
    return o instanceof t ? o : new t(function(i) {
      i(o);
    });
  }
  return new (t || (t = Promise))(function(o, i) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        i(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        i(d);
      }
    }
    function l(u) {
      u.done ? o(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
const mn = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
}, Ft = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: !1
};
class wn {
  constructor(e, t = {}, r, n) {
    this.url = e, this.headers = t, this.bucketId = r, this.fetch = Pr(n);
  }
  /**
   * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
   *
   * @param method HTTP method.
   * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadOrUpdate(e, t, r, n) {
    return j(this, void 0, void 0, function* () {
      try {
        let o;
        const i = Object.assign(Object.assign({}, Ft), n);
        let a = Object.assign(Object.assign({}, this.headers), e === "POST" && { "x-upsert": String(i.upsert) });
        const c = i.metadata;
        typeof Blob < "u" && r instanceof Blob ? (o = new FormData(), o.append("cacheControl", i.cacheControl), c && o.append("metadata", this.encodeMetadata(c)), o.append("", r)) : typeof FormData < "u" && r instanceof FormData ? (o = r, o.append("cacheControl", i.cacheControl), c && o.append("metadata", this.encodeMetadata(c))) : (o = r, a["cache-control"] = `max-age=${i.cacheControl}`, a["content-type"] = i.contentType, c && (a["x-metadata"] = this.toBase64(this.encodeMetadata(c)))), n != null && n.headers && (a = Object.assign(Object.assign({}, a), n.headers));
        const l = this._removeEmptyFolders(t), u = this._getFinalPath(l), d = yield this.fetch(`${this.url}/object/${u}`, Object.assign({ method: e, body: o, headers: a }, i != null && i.duplex ? { duplex: i.duplex } : {})), h = yield d.json();
        return d.ok ? {
          data: { path: l, id: h.Id, fullPath: h.Key },
          error: null
        } : { data: null, error: h };
      } catch (o) {
        if (T(o))
          return { data: null, error: o };
        throw o;
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
    return j(this, void 0, void 0, function* () {
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
    return j(this, void 0, void 0, function* () {
      const o = this._removeEmptyFolders(e), i = this._getFinalPath(o), a = new URL(this.url + `/object/upload/sign/${i}`);
      a.searchParams.set("token", t);
      try {
        let c;
        const l = Object.assign({ upsert: Ft.upsert }, n), u = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(l.upsert) });
        typeof Blob < "u" && r instanceof Blob ? (c = new FormData(), c.append("cacheControl", l.cacheControl), c.append("", r)) : typeof FormData < "u" && r instanceof FormData ? (c = r, c.append("cacheControl", l.cacheControl)) : (c = r, u["cache-control"] = `max-age=${l.cacheControl}`, u["content-type"] = l.contentType);
        const d = yield this.fetch(a.toString(), {
          method: "PUT",
          body: c,
          headers: u
        }), h = yield d.json();
        return d.ok ? {
          data: { path: o, fullPath: h.Key },
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
    return j(this, void 0, void 0, function* () {
      try {
        let r = this._getFinalPath(e);
        const n = Object.assign({}, this.headers);
        t != null && t.upsert && (n["x-upsert"] = "true");
        const o = yield H(this.fetch, `${this.url}/object/upload/sign/${r}`, {}, { headers: n }), i = new URL(this.url + o.url), a = i.searchParams.get("token");
        if (!a)
          throw new jt("No token returned by API");
        return { data: { signedUrl: i.toString(), path: e, token: a }, error: null };
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
    return j(this, void 0, void 0, function* () {
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
    return j(this, void 0, void 0, function* () {
      try {
        return { data: yield H(this.fetch, `${this.url}/object/move`, {
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
    return j(this, void 0, void 0, function* () {
      try {
        return { data: { path: (yield H(this.fetch, `${this.url}/object/copy`, {
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
    return j(this, void 0, void 0, function* () {
      try {
        let n = this._getFinalPath(e), o = yield H(this.fetch, `${this.url}/object/sign/${n}`, Object.assign({ expiresIn: t }, r != null && r.transform ? { transform: r.transform } : {}), { headers: this.headers });
        const i = r != null && r.download ? `&download=${r.download === !0 ? "" : r.download}` : "";
        return o = { signedUrl: encodeURI(`${this.url}${o.signedURL}${i}`) }, { data: o, error: null };
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
    return j(this, void 0, void 0, function* () {
      try {
        const n = yield H(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn: t, paths: e }, { headers: this.headers }), o = r != null && r.download ? `&download=${r.download === !0 ? "" : r.download}` : "";
        return {
          data: n.map((i) => Object.assign(Object.assign({}, i), { signedUrl: i.signedURL ? encodeURI(`${this.url}${i.signedURL}${o}`) : null })),
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
    return j(this, void 0, void 0, function* () {
      const n = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image/authenticated" : "object", o = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {}), i = o ? `?${o}` : "";
      try {
        const a = this._getFinalPath(e);
        return { data: yield (yield Le(this.fetch, `${this.url}/${n}/${a}${i}`, {
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
    return j(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        const r = yield Le(this.fetch, `${this.url}/object/info/${t}`, {
          headers: this.headers
        });
        return { data: pt(r), error: null };
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
    return j(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        return yield pn(this.fetch, `${this.url}/object/${t}`, {
          headers: this.headers
        }), { data: !0, error: null };
      } catch (r) {
        if (T(r) && r instanceof gt) {
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
    const r = this._getFinalPath(e), n = [], o = t != null && t.download ? `download=${t.download === !0 ? "" : t.download}` : "";
    o !== "" && n.push(o);
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
    return j(this, void 0, void 0, function* () {
      try {
        return { data: yield $r(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: e }, { headers: this.headers }), error: null };
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
    return j(this, void 0, void 0, function* () {
      try {
        const n = Object.assign(Object.assign(Object.assign({}, mn), t), { prefix: e || "" });
        return { data: yield H(this.fetch, `${this.url}/object/list/${this.bucketId}`, n, { headers: this.headers }, r), error: null };
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
const yn = "2.7.1", vn = { "X-Client-Info": `storage-js/${yn}` };
var oe = function(s, e, t, r) {
  function n(o) {
    return o instanceof t ? o : new t(function(i) {
      i(o);
    });
  }
  return new (t || (t = Promise))(function(o, i) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        i(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        i(d);
      }
    }
    function l(u) {
      u.done ? o(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
class _n {
  constructor(e, t = {}, r) {
    this.url = e, this.headers = Object.assign(Object.assign({}, vn), t), this.fetch = Pr(r);
  }
  /**
   * Retrieves the details of all Storage buckets within an existing project.
   */
  listBuckets() {
    return oe(this, void 0, void 0, function* () {
      try {
        return { data: yield Le(this.fetch, `${this.url}/bucket`, { headers: this.headers }), error: null };
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
    return oe(this, void 0, void 0, function* () {
      try {
        return { data: yield Le(this.fetch, `${this.url}/bucket/${e}`, { headers: this.headers }), error: null };
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
    return oe(this, void 0, void 0, function* () {
      try {
        return { data: yield H(this.fetch, `${this.url}/bucket`, {
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
    return oe(this, void 0, void 0, function* () {
      try {
        return { data: yield gn(this.fetch, `${this.url}/bucket/${e}`, {
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
    return oe(this, void 0, void 0, function* () {
      try {
        return { data: yield H(this.fetch, `${this.url}/bucket/${e}/empty`, {}, { headers: this.headers }), error: null };
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
    return oe(this, void 0, void 0, function* () {
      try {
        return { data: yield $r(this.fetch, `${this.url}/bucket/${e}`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (T(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
}
class bn extends _n {
  constructor(e, t = {}, r) {
    super(e, t, r);
  }
  /**
   * Perform file operation in a bucket.
   *
   * @param id The bucket id to operate on.
   */
  from(e) {
    return new wn(this.url, this.headers, e, this.fetch);
  }
}
const Sn = "2.52.1";
let ke = "";
typeof Deno < "u" ? ke = "deno" : typeof document < "u" ? ke = "web" : typeof navigator < "u" && navigator.product === "ReactNative" ? ke = "react-native" : ke = "node";
const kn = { "X-Client-Info": `supabase-js-${ke}/${Sn}` }, En = {
  headers: kn
}, On = {
  schema: "public"
}, Tn = {
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  flowType: "implicit"
}, Cn = {};
var An = function(s, e, t, r) {
  function n(o) {
    return o instanceof t ? o : new t(function(i) {
      i(o);
    });
  }
  return new (t || (t = Promise))(function(o, i) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        i(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        i(d);
      }
    }
    function l(u) {
      u.done ? o(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
const jn = (s) => {
  let e;
  return s ? e = s : typeof fetch > "u" ? e = pr : e = fetch, (...t) => e(...t);
}, Pn = () => typeof Headers > "u" ? mr : Headers, $n = (s, e, t) => {
  const r = jn(t), n = Pn();
  return (o, i) => An(void 0, void 0, void 0, function* () {
    var a;
    const c = (a = yield e()) !== null && a !== void 0 ? a : s;
    let l = new n(i == null ? void 0 : i.headers);
    return l.has("apikey") || l.set("apikey", s), l.has("Authorization") || l.set("Authorization", `Bearer ${c}`), r(o, Object.assign(Object.assign({}, i), { headers: l }));
  });
};
var xn = function(s, e, t, r) {
  function n(o) {
    return o instanceof t ? o : new t(function(i) {
      i(o);
    });
  }
  return new (t || (t = Promise))(function(o, i) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        i(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        i(d);
      }
    }
    function l(u) {
      u.done ? o(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
function Rn(s) {
  return s.endsWith("/") ? s : s + "/";
}
function In(s, e) {
  var t, r;
  const { db: n, auth: o, realtime: i, global: a } = s, { db: c, auth: l, realtime: u, global: d } = e, h = {
    db: Object.assign(Object.assign({}, c), n),
    auth: Object.assign(Object.assign({}, l), o),
    realtime: Object.assign(Object.assign({}, u), i),
    global: Object.assign(Object.assign(Object.assign({}, d), a), { headers: Object.assign(Object.assign({}, (t = d == null ? void 0 : d.headers) !== null && t !== void 0 ? t : {}), (r = a == null ? void 0 : a.headers) !== null && r !== void 0 ? r : {}) }),
    accessToken: () => xn(this, void 0, void 0, function* () {
      return "";
    })
  };
  return s.accessToken ? h.accessToken = s.accessToken : delete h.accessToken, h;
}
const xr = "2.71.1", fe = 30 * 1e3, mt = 3, Ye = mt * fe, Un = "http://localhost:9999", Ln = "supabase.auth.token";
const Dn = { "X-Client-Info": `gotrue-js/${xr}` };
const wt = "X-Supabase-Api-Version", Rr = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
}, qn = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i, Nn = 10 * 60 * 1e3;
class Pt extends Error {
  constructor(e, t, r) {
    super(e), this.__isAuthError = !0, this.name = "AuthError", this.status = t, this.code = r;
  }
}
function v(s) {
  return typeof s == "object" && s !== null && "__isAuthError" in s;
}
class Bn extends Pt {
  constructor(e, t, r) {
    super(e, t, r), this.name = "AuthApiError", this.status = t, this.code = r;
  }
}
function Mn(s) {
  return v(s) && s.name === "AuthApiError";
}
class Ir extends Pt {
  constructor(e, t) {
    super(e), this.name = "AuthUnknownError", this.originalError = t;
  }
}
class Y extends Pt {
  constructor(e, t, r, n) {
    super(e, r, n), this.name = t, this.status = r;
  }
}
class G extends Y {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
}
function Fn(s) {
  return v(s) && s.name === "AuthSessionMissingError";
}
class xe extends Y {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
}
class Re extends Y {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
}
class Ie extends Y {
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
function Wn(s) {
  return v(s) && s.name === "AuthImplicitGrantRedirectError";
}
class Wt extends Y {
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
class yt extends Y {
  constructor(e, t) {
    super(e, "AuthRetryableFetchError", t, void 0);
  }
}
function Xe(s) {
  return v(s) && s.name === "AuthRetryableFetchError";
}
class zt extends Y {
  constructor(e, t, r) {
    super(e, "AuthWeakPasswordError", t, "weak_password"), this.reasons = r;
  }
}
class vt extends Y {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
}
const De = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), Gt = ` 	
\r=`.split(""), zn = (() => {
  const s = new Array(128);
  for (let e = 0; e < s.length; e += 1)
    s[e] = -1;
  for (let e = 0; e < Gt.length; e += 1)
    s[Gt[e].charCodeAt(0)] = -2;
  for (let e = 0; e < De.length; e += 1)
    s[De[e].charCodeAt(0)] = e;
  return s;
})();
function Ht(s, e, t) {
  if (s !== null)
    for (e.queue = e.queue << 8 | s, e.queuedBits += 8; e.queuedBits >= 6; ) {
      const r = e.queue >> e.queuedBits - 6 & 63;
      t(De[r]), e.queuedBits -= 6;
    }
  else if (e.queuedBits > 0)
    for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
      const r = e.queue >> e.queuedBits - 6 & 63;
      t(De[r]), e.queuedBits -= 6;
    }
}
function Ur(s, e, t) {
  const r = zn[s];
  if (r > -1)
    for (e.queue = e.queue << 6 | r, e.queuedBits += 6; e.queuedBits >= 8; )
      t(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (r === -2)
      return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(s)}"`);
  }
}
function Kt(s) {
  const e = [], t = (i) => {
    e.push(String.fromCodePoint(i));
  }, r = {
    utf8seq: 0,
    codepoint: 0
  }, n = { queue: 0, queuedBits: 0 }, o = (i) => {
    Kn(i, r, t);
  };
  for (let i = 0; i < s.length; i += 1)
    Ur(s.charCodeAt(i), n, o);
  return e.join("");
}
function Gn(s, e) {
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
function Hn(s, e) {
  for (let t = 0; t < s.length; t += 1) {
    let r = s.charCodeAt(t);
    if (r > 55295 && r <= 56319) {
      const n = (r - 55296) * 1024 & 65535;
      r = (s.charCodeAt(t + 1) - 56320 & 65535 | n) + 65536, t += 1;
    }
    Gn(r, e);
  }
}
function Kn(s, e, t) {
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
function Jn(s) {
  const e = [], t = { queue: 0, queuedBits: 0 }, r = (n) => {
    e.push(n);
  };
  for (let n = 0; n < s.length; n += 1)
    Ur(s.charCodeAt(n), t, r);
  return new Uint8Array(e);
}
function Vn(s) {
  const e = [];
  return Hn(s, (t) => e.push(t)), new Uint8Array(e);
}
function Qn(s) {
  const e = [], t = { queue: 0, queuedBits: 0 }, r = (n) => {
    e.push(n);
  };
  return s.forEach((n) => Ht(n, t, r)), Ht(null, t, r), e.join("");
}
function Yn(s) {
  return Math.round(Date.now() / 1e3) + s;
}
function Xn() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(s) {
    const e = Math.random() * 16 | 0;
    return (s == "x" ? e : e & 3 | 8).toString(16);
  });
}
const U = () => typeof window < "u" && typeof document < "u", X = {
  tested: !1,
  writable: !1
}, Lr = () => {
  if (!U())
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
function Zn(s) {
  const e = {}, t = new URL(s);
  if (t.hash && t.hash[0] === "#")
    try {
      new URLSearchParams(t.hash.substring(1)).forEach((n, o) => {
        e[o] = n;
      });
    } catch {
    }
  return t.searchParams.forEach((r, n) => {
    e[n] = r;
  }), e;
}
const Dr = (s) => {
  let e;
  return s ? e = s : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => ye).then(({ default: r }) => r(...t)) : e = fetch, (...t) => e(...t);
}, eo = (s) => typeof s == "object" && s !== null && "status" in s && "ok" in s && "json" in s && typeof s.json == "function", ge = async (s, e, t) => {
  await s.setItem(e, JSON.stringify(t));
}, Z = async (s, e) => {
  const t = await s.getItem(e);
  if (!t)
    return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}, z = async (s, e) => {
  await s.removeItem(e);
};
class Ke {
  constructor() {
    this.promise = new Ke.promiseConstructor((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
}
Ke.promiseConstructor = Promise;
function Ze(s) {
  const e = s.split(".");
  if (e.length !== 3)
    throw new vt("Invalid JWT structure");
  for (let r = 0; r < e.length; r++)
    if (!qn.test(e[r]))
      throw new vt("JWT not in base64url format");
  return {
    // using base64url lib
    header: JSON.parse(Kt(e[0])),
    payload: JSON.parse(Kt(e[1])),
    signature: Jn(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function to(s) {
  return await new Promise((e) => {
    setTimeout(() => e(null), s);
  });
}
function ro(s, e) {
  return new Promise((r, n) => {
    (async () => {
      for (let o = 0; o < 1 / 0; o++)
        try {
          const i = await s(o);
          if (!e(o, null, i)) {
            r(i);
            return;
          }
        } catch (i) {
          if (!e(o, i)) {
            n(i);
            return;
          }
        }
    })();
  });
}
function so(s) {
  return ("0" + s.toString(16)).substr(-2);
}
function no() {
  const e = new Uint32Array(56);
  if (typeof crypto > "u") {
    const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", r = t.length;
    let n = "";
    for (let o = 0; o < 56; o++)
      n += t.charAt(Math.floor(Math.random() * r));
    return n;
  }
  return crypto.getRandomValues(e), Array.from(e, so).join("");
}
async function oo(s) {
  const t = new TextEncoder().encode(s), r = await crypto.subtle.digest("SHA-256", t), n = new Uint8Array(r);
  return Array.from(n).map((o) => String.fromCharCode(o)).join("");
}
async function io(s) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u"))
    return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), s;
  const t = await oo(s);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function ie(s, e, t = !1) {
  const r = no();
  let n = r;
  t && (n += "/PASSWORD_RECOVERY"), await ge(s, `${e}-code-verifier`, n);
  const o = await io(r);
  return [o, r === o ? "plain" : "s256"];
}
const ao = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function co(s) {
  const e = s.headers.get(wt);
  if (!e || !e.match(ao))
    return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function lo(s) {
  if (!s)
    throw new Error("Missing exp claim");
  const e = Math.floor(Date.now() / 1e3);
  if (s <= e)
    throw new Error("JWT has expired");
}
function uo(s) {
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
const ho = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function ae(s) {
  if (!ho.test(s))
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
function et() {
  const s = {};
  return new Proxy(s, {
    get: (e, t) => {
      if (t === "__isUserNotAvailableProxy")
        return !0;
      if (typeof t == "symbol") {
        const r = t.toString();
        if (r === "Symbol(Symbol.toPrimitive)" || r === "Symbol(Symbol.toStringTag)" || r === "Symbol(util.inspect.custom)")
          return;
      }
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${t}" property of the session object is not supported. Please use getUser() instead.`);
    },
    set: (e, t) => {
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
    },
    deleteProperty: (e, t) => {
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
    }
  });
}
function Jt(s) {
  return JSON.parse(JSON.stringify(s));
}
var fo = function(s, e) {
  var t = {};
  for (var r in s) Object.prototype.hasOwnProperty.call(s, r) && e.indexOf(r) < 0 && (t[r] = s[r]);
  if (s != null && typeof Object.getOwnPropertySymbols == "function")
    for (var n = 0, r = Object.getOwnPropertySymbols(s); n < r.length; n++)
      e.indexOf(r[n]) < 0 && Object.prototype.propertyIsEnumerable.call(s, r[n]) && (t[r[n]] = s[r[n]]);
  return t;
};
const ee = (s) => s.msg || s.message || s.error_description || s.error || JSON.stringify(s), go = [502, 503, 504];
async function Vt(s) {
  var e;
  if (!eo(s))
    throw new yt(ee(s), 0);
  if (go.includes(s.status))
    throw new yt(ee(s), s.status);
  let t;
  try {
    t = await s.json();
  } catch (o) {
    throw new Ir(ee(o), o);
  }
  let r;
  const n = co(s);
  if (n && n.getTime() >= Rr["2024-01-01"].timestamp && typeof t == "object" && t && typeof t.code == "string" ? r = t.code : typeof t == "object" && t && typeof t.error_code == "string" && (r = t.error_code), r) {
    if (r === "weak_password")
      throw new zt(ee(t), s.status, ((e = t.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (r === "session_not_found")
      throw new G();
  } else if (typeof t == "object" && t && typeof t.weak_password == "object" && t.weak_password && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.reasons.reduce((o, i) => o && typeof i == "string", !0))
    throw new zt(ee(t), s.status, t.weak_password.reasons);
  throw new Bn(ee(t), s.status || 500, r);
}
const po = (s, e, t, r) => {
  const n = { method: s, headers: (e == null ? void 0 : e.headers) || {} };
  return s === "GET" ? n : (n.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, e == null ? void 0 : e.headers), n.body = JSON.stringify(r), Object.assign(Object.assign({}, n), t));
};
async function _(s, e, t, r) {
  var n;
  const o = Object.assign({}, r == null ? void 0 : r.headers);
  o[wt] || (o[wt] = Rr["2024-01-01"].name), r != null && r.jwt && (o.Authorization = `Bearer ${r.jwt}`);
  const i = (n = r == null ? void 0 : r.query) !== null && n !== void 0 ? n : {};
  r != null && r.redirectTo && (i.redirect_to = r.redirectTo);
  const a = Object.keys(i).length ? "?" + new URLSearchParams(i).toString() : "", c = await mo(s, e, t + a, {
    headers: o,
    noResolveJson: r == null ? void 0 : r.noResolveJson
  }, {}, r == null ? void 0 : r.body);
  return r != null && r.xform ? r == null ? void 0 : r.xform(c) : { data: Object.assign({}, c), error: null };
}
async function mo(s, e, t, r, n, o) {
  const i = po(e, r, n, o);
  let a;
  try {
    a = await s(t, Object.assign({}, i));
  } catch (c) {
    throw console.error(c), new yt(ee(c), 0);
  }
  if (a.ok || await Vt(a), r != null && r.noResolveJson)
    return a;
  try {
    return await a.json();
  } catch (c) {
    await Vt(c);
  }
}
function M(s) {
  var e;
  let t = null;
  _o(s) && (t = Object.assign({}, s), s.expires_at || (t.expires_at = Yn(s.expires_in)));
  const r = (e = s.user) !== null && e !== void 0 ? e : s;
  return { data: { session: t, user: r }, error: null };
}
function Qt(s) {
  const e = M(s);
  return !e.error && s.weak_password && typeof s.weak_password == "object" && Array.isArray(s.weak_password.reasons) && s.weak_password.reasons.length && s.weak_password.message && typeof s.weak_password.message == "string" && s.weak_password.reasons.reduce((t, r) => t && typeof r == "string", !0) && (e.data.weak_password = s.weak_password), e;
}
function J(s) {
  var e;
  return { data: { user: (e = s.user) !== null && e !== void 0 ? e : s }, error: null };
}
function wo(s) {
  return { data: s, error: null };
}
function yo(s) {
  const { action_link: e, email_otp: t, hashed_token: r, redirect_to: n, verification_type: o } = s, i = fo(s, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]), a = {
    action_link: e,
    email_otp: t,
    hashed_token: r,
    redirect_to: n,
    verification_type: o
  }, c = Object.assign({}, i);
  return {
    data: {
      properties: a,
      user: c
    },
    error: null
  };
}
function vo(s) {
  return s;
}
function _o(s) {
  return s.access_token && s.refresh_token && s.expires_in;
}
const tt = ["global", "local", "others"];
var bo = function(s, e) {
  var t = {};
  for (var r in s) Object.prototype.hasOwnProperty.call(s, r) && e.indexOf(r) < 0 && (t[r] = s[r]);
  if (s != null && typeof Object.getOwnPropertySymbols == "function")
    for (var n = 0, r = Object.getOwnPropertySymbols(s); n < r.length; n++)
      e.indexOf(r[n]) < 0 && Object.prototype.propertyIsEnumerable.call(s, r[n]) && (t[r[n]] = s[r[n]]);
  return t;
};
class So {
  constructor({ url: e = "", headers: t = {}, fetch: r }) {
    this.url = e, this.headers = t, this.fetch = Dr(r), this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    };
  }
  /**
   * Removes a logged-in session.
   * @param jwt A valid, logged-in JWT.
   * @param scope The logout sope.
   */
  async signOut(e, t = tt[0]) {
    if (tt.indexOf(t) < 0)
      throw new Error(`@supabase/auth-js: Parameter scope must be one of ${tt.join(", ")}`);
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
        xform: J
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
      const { options: t } = e, r = bo(e, ["options"]), n = Object.assign(Object.assign({}, r), t);
      return "newEmail" in r && (n.new_email = r == null ? void 0 : r.newEmail, delete n.newEmail), await _(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: n,
        headers: this.headers,
        xform: yo,
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
        xform: J
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
    var t, r, n, o, i, a, c;
    try {
      const l = { nextPage: null, lastPage: 0, total: 0 }, u = await _(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (r = (t = e == null ? void 0 : e.page) === null || t === void 0 ? void 0 : t.toString()) !== null && r !== void 0 ? r : "",
          per_page: (o = (n = e == null ? void 0 : e.perPage) === null || n === void 0 ? void 0 : n.toString()) !== null && o !== void 0 ? o : ""
        },
        xform: vo
      });
      if (u.error)
        throw u.error;
      const d = await u.json(), h = (i = u.headers.get("x-total-count")) !== null && i !== void 0 ? i : 0, f = (c = (a = u.headers.get("link")) === null || a === void 0 ? void 0 : a.split(",")) !== null && c !== void 0 ? c : [];
      return f.length > 0 && (f.forEach((g) => {
        const w = parseInt(g.split(";")[0].split("=")[1].substring(0, 1)), p = JSON.parse(g.split(";")[1].split("=")[1]);
        l[`${p}Page`] = w;
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
    ae(e);
    try {
      return await _(this.fetch, "GET", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        xform: J
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
    ae(e);
    try {
      return await _(this.fetch, "PUT", `${this.url}/admin/users/${e}`, {
        body: t,
        headers: this.headers,
        xform: J
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
    ae(e);
    try {
      return await _(this.fetch, "DELETE", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        body: {
          should_soft_delete: t
        },
        xform: J
      });
    } catch (r) {
      if (v(r))
        return { data: { user: null }, error: r };
      throw r;
    }
  }
  async _listFactors(e) {
    ae(e.userId);
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
    ae(e.userId), ae(e.id);
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
function Yt(s = {}) {
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
function ko() {
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
const ce = {
  /**
   * @experimental
   */
  debug: !!(globalThis && Lr() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
};
class qr extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = !0;
  }
}
class Eo extends qr {
}
async function Oo(s, e, t) {
  ce.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire lock", s, e);
  const r = new globalThis.AbortController();
  return e > 0 && setTimeout(() => {
    r.abort(), ce.debug && console.log("@supabase/gotrue-js: navigatorLock acquire timed out", s);
  }, e), await Promise.resolve().then(() => globalThis.navigator.locks.request(s, e === 0 ? {
    mode: "exclusive",
    ifAvailable: !0
  } : {
    mode: "exclusive",
    signal: r.signal
  }, async (n) => {
    if (n) {
      ce.debug && console.log("@supabase/gotrue-js: navigatorLock: acquired", s, n.name);
      try {
        return await t();
      } finally {
        ce.debug && console.log("@supabase/gotrue-js: navigatorLock: released", s, n.name);
      }
    } else {
      if (e === 0)
        throw ce.debug && console.log("@supabase/gotrue-js: navigatorLock: not immediately available", s), new Eo(`Acquiring an exclusive Navigator LockManager lock "${s}" immediately failed`);
      if (ce.debug)
        try {
          const o = await globalThis.navigator.locks.query();
          console.log("@supabase/gotrue-js: Navigator LockManager state", JSON.stringify(o, null, "  "));
        } catch (o) {
          console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state", o);
        }
      return console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request"), await t();
    }
  }));
}
ko();
const To = {
  url: Un,
  storageKey: Ln,
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  headers: Dn,
  flowType: "implicit",
  debug: !1,
  hasCustomAuthorizationHeader: !1
};
async function Xt(s, e, t) {
  return await t();
}
const le = {};
class Ae {
  /**
   * Create a new client for use in the browser.
   */
  constructor(e) {
    var t, r;
    this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = !0, this.hasCustomAuthorizationHeader = !1, this.suppressGetSessionWarning = !1, this.lockAcquired = !1, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log, this.instanceID = Ae.nextInstanceID, Ae.nextInstanceID += 1, this.instanceID > 0 && U() && console.warn("Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.");
    const n = Object.assign(Object.assign({}, To), e);
    if (this.logDebugMessages = !!n.debug, typeof n.debug == "function" && (this.logger = n.debug), this.persistSession = n.persistSession, this.storageKey = n.storageKey, this.autoRefreshToken = n.autoRefreshToken, this.admin = new So({
      url: n.url,
      headers: n.headers,
      fetch: n.fetch
    }), this.url = n.url, this.headers = n.headers, this.fetch = Dr(n.fetch), this.lock = n.lock || Xt, this.detectSessionInUrl = n.detectSessionInUrl, this.flowType = n.flowType, this.hasCustomAuthorizationHeader = n.hasCustomAuthorizationHeader, n.lock ? this.lock = n.lock : U() && (!((t = globalThis == null ? void 0 : globalThis.navigator) === null || t === void 0) && t.locks) ? this.lock = Oo : this.lock = Xt, this.jwks || (this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this)
    }, this.persistSession ? (n.storage ? this.storage = n.storage : Lr() ? this.storage = globalThis.localStorage : (this.memoryStorage = {}, this.storage = Yt(this.memoryStorage)), n.userStorage && (this.userStorage = n.userStorage)) : (this.memoryStorage = {}, this.storage = Yt(this.memoryStorage)), U() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
      try {
        this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
      } catch (o) {
        console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", o);
      }
      (r = this.broadcastChannel) === null || r === void 0 || r.addEventListener("message", async (o) => {
        this._debug("received broadcast notification from other tab or client", o), await this._notifyAllSubscribers(o.data.event, o.data.session, !1);
      });
    }
    this.initialize();
  }
  /**
   * The JWKS used for verifying asymmetric JWTs
   */
  get jwks() {
    var e, t;
    return (t = (e = le[this.storageKey]) === null || e === void 0 ? void 0 : e.jwks) !== null && t !== void 0 ? t : { keys: [] };
  }
  set jwks(e) {
    le[this.storageKey] = Object.assign(Object.assign({}, le[this.storageKey]), { jwks: e });
  }
  get jwks_cached_at() {
    var e, t;
    return (t = (e = le[this.storageKey]) === null || e === void 0 ? void 0 : e.cachedAt) !== null && t !== void 0 ? t : Number.MIN_SAFE_INTEGER;
  }
  set jwks_cached_at(e) {
    le[this.storageKey] = Object.assign(Object.assign({}, le[this.storageKey]), { cachedAt: e });
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(`GoTrueClient@${this.instanceID} (${xr}) ${(/* @__PURE__ */ new Date()).toISOString()}`, ...e), this;
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
      const t = Zn(window.location.href);
      let r = "none";
      if (this._isImplicitGrantCallback(t) ? r = "implicit" : await this._isPKCECallback(t) && (r = "pkce"), U() && this.detectSessionInUrl && r !== "none") {
        const { data: n, error: o } = await this._getSessionFromURL(t, r);
        if (o) {
          if (this._debug("#_initialize()", "error detecting session from URL", o), Wn(o)) {
            const c = (e = o.details) === null || e === void 0 ? void 0 : e.code;
            if (c === "identity_already_exists" || c === "identity_not_found" || c === "single_identity_not_deletable")
              return { error: o };
          }
          return await this._removeSession(), { error: o };
        }
        const { session: i, redirectType: a } = n;
        return this._debug("#_initialize()", "detected session in URL", i, "redirect type", a), await this._saveSession(i), setTimeout(async () => {
          a === "recovery" ? await this._notifyAllSubscribers("PASSWORD_RECOVERY", i) : await this._notifyAllSubscribers("SIGNED_IN", i);
        }, 0), { error: null };
      }
      return await this._recoverAndRefresh(), { error: null };
    } catch (t) {
      return v(t) ? { error: t } : {
        error: new Ir("Unexpected error during initialization", t)
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
      const o = await _(this.fetch, "POST", `${this.url}/signup`, {
        headers: this.headers,
        body: {
          data: (r = (t = e == null ? void 0 : e.options) === null || t === void 0 ? void 0 : t.data) !== null && r !== void 0 ? r : {},
          gotrue_meta_security: { captcha_token: (n = e == null ? void 0 : e.options) === null || n === void 0 ? void 0 : n.captchaToken }
        },
        xform: M
      }), { data: i, error: a } = o;
      if (a || !i)
        return { data: { user: null, session: null }, error: a };
      const c = i.session, l = i.user;
      return i.session && (await this._saveSession(i.session), await this._notifyAllSubscribers("SIGNED_IN", c)), { data: { user: l, session: c }, error: null };
    } catch (o) {
      if (v(o))
        return { data: { user: null, session: null }, error: o };
      throw o;
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
      let o;
      if ("email" in e) {
        const { email: u, password: d, options: h } = e;
        let f = null, g = null;
        this.flowType === "pkce" && ([f, g] = await ie(this.storage, this.storageKey)), o = await _(this.fetch, "POST", `${this.url}/signup`, {
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
          xform: M
        });
      } else if ("phone" in e) {
        const { phone: u, password: d, options: h } = e;
        o = await _(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            phone: u,
            password: d,
            data: (r = h == null ? void 0 : h.data) !== null && r !== void 0 ? r : {},
            channel: (n = h == null ? void 0 : h.channel) !== null && n !== void 0 ? n : "sms",
            gotrue_meta_security: { captcha_token: h == null ? void 0 : h.captchaToken }
          },
          xform: M
        });
      } else
        throw new Re("You must provide either an email or phone number and a password");
      const { data: i, error: a } = o;
      if (a || !i)
        return { data: { user: null, session: null }, error: a };
      const c = i.session, l = i.user;
      return i.session && (await this._saveSession(i.session), await this._notifyAllSubscribers("SIGNED_IN", c)), { data: { user: l, session: c }, error: null };
    } catch (o) {
      if (v(o))
        return { data: { user: null, session: null }, error: o };
      throw o;
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
        const { email: o, password: i, options: a } = e;
        t = await _(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            email: o,
            password: i,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          xform: Qt
        });
      } else if ("phone" in e) {
        const { phone: o, password: i, options: a } = e;
        t = await _(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            phone: o,
            password: i,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          xform: Qt
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
    var t, r, n, o;
    return await this._handleProviderSignIn(e.provider, {
      redirectTo: (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo,
      scopes: (r = e.options) === null || r === void 0 ? void 0 : r.scopes,
      queryParams: (n = e.options) === null || n === void 0 ? void 0 : n.queryParams,
      skipBrowserRedirect: (o = e.options) === null || o === void 0 ? void 0 : o.skipBrowserRedirect
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
    var t, r, n, o, i, a, c, l, u, d, h, f;
    let g, w;
    if ("message" in e)
      g = e.message, w = e.signature;
    else {
      const { chain: p, wallet: y, statement: S, options: m } = e;
      let b;
      if (U())
        if (typeof y == "object")
          b = y;
        else {
          const E = window;
          if ("solana" in E && typeof E.solana == "object" && ("signIn" in E.solana && typeof E.solana.signIn == "function" || "signMessage" in E.solana && typeof E.solana.signMessage == "function"))
            b = E.solana;
          else
            throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.");
        }
      else {
        if (typeof y != "object" || !(m != null && m.url))
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        b = y;
      }
      const C = new URL((t = m == null ? void 0 : m.url) !== null && t !== void 0 ? t : window.location.href);
      if ("signIn" in b && b.signIn) {
        const E = await b.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, m == null ? void 0 : m.signInWithSolana), {
          // non-overridable properties
          version: "1",
          domain: C.host,
          uri: C.href
        }), S ? { statement: S } : null));
        let $;
        if (Array.isArray(E) && E[0] && typeof E[0] == "object")
          $ = E[0];
        else if (E && typeof E == "object" && "signedMessage" in E && "signature" in E)
          $ = E;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in $ && "signature" in $ && (typeof $.signedMessage == "string" || $.signedMessage instanceof Uint8Array) && $.signature instanceof Uint8Array)
          g = typeof $.signedMessage == "string" ? $.signedMessage : new TextDecoder().decode($.signedMessage), w = $.signature;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in b) || typeof b.signMessage != "function" || !("publicKey" in b) || typeof b != "object" || !b.publicKey || !("toBase58" in b.publicKey) || typeof b.publicKey.toBase58 != "function")
          throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        g = [
          `${C.host} wants you to sign in with your Solana account:`,
          b.publicKey.toBase58(),
          ...S ? ["", S, ""] : [""],
          "Version: 1",
          `URI: ${C.href}`,
          `Issued At: ${(n = (r = m == null ? void 0 : m.signInWithSolana) === null || r === void 0 ? void 0 : r.issuedAt) !== null && n !== void 0 ? n : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((o = m == null ? void 0 : m.signInWithSolana) === null || o === void 0) && o.notBefore ? [`Not Before: ${m.signInWithSolana.notBefore}`] : [],
          ...!((i = m == null ? void 0 : m.signInWithSolana) === null || i === void 0) && i.expirationTime ? [`Expiration Time: ${m.signInWithSolana.expirationTime}`] : [],
          ...!((a = m == null ? void 0 : m.signInWithSolana) === null || a === void 0) && a.chainId ? [`Chain ID: ${m.signInWithSolana.chainId}`] : [],
          ...!((c = m == null ? void 0 : m.signInWithSolana) === null || c === void 0) && c.nonce ? [`Nonce: ${m.signInWithSolana.nonce}`] : [],
          ...!((l = m == null ? void 0 : m.signInWithSolana) === null || l === void 0) && l.requestId ? [`Request ID: ${m.signInWithSolana.requestId}`] : [],
          ...!((d = (u = m == null ? void 0 : m.signInWithSolana) === null || u === void 0 ? void 0 : u.resources) === null || d === void 0) && d.length ? [
            "Resources",
            ...m.signInWithSolana.resources.map(($) => `- ${$}`)
          ] : []
        ].join(`
`);
        const E = await b.signMessage(new TextEncoder().encode(g), "utf8");
        if (!E || !(E instanceof Uint8Array))
          throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        w = E;
      }
    }
    try {
      const { data: p, error: y } = await _(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({ chain: "solana", message: g, signature: Qn(w) }, !((h = e.options) === null || h === void 0) && h.captchaToken ? { gotrue_meta_security: { captcha_token: (f = e.options) === null || f === void 0 ? void 0 : f.captchaToken } } : null),
        xform: M
      });
      if (y)
        throw y;
      return !p || !p.session || !p.user ? {
        data: { user: null, session: null },
        error: new xe()
      } : (p.session && (await this._saveSession(p.session), await this._notifyAllSubscribers("SIGNED_IN", p.session)), { data: Object.assign({}, p), error: y });
    } catch (p) {
      if (v(p))
        return { data: { user: null, session: null }, error: p };
      throw p;
    }
  }
  async _exchangeCodeForSession(e) {
    const t = await Z(this.storage, `${this.storageKey}-code-verifier`), [r, n] = (t ?? "").split("/");
    try {
      const { data: o, error: i } = await _(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: r
        },
        xform: M
      });
      if (await z(this.storage, `${this.storageKey}-code-verifier`), i)
        throw i;
      return !o || !o.session || !o.user ? {
        data: { user: null, session: null, redirectType: null },
        error: new xe()
      } : (o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", o.session)), { data: Object.assign(Object.assign({}, o), { redirectType: n ?? null }), error: i });
    } catch (o) {
      if (v(o))
        return { data: { user: null, session: null, redirectType: null }, error: o };
      throw o;
    }
  }
  /**
   * Allows signing in with an OIDC ID token. The authentication provider used
   * should be enabled and configured.
   */
  async signInWithIdToken(e) {
    try {
      const { options: t, provider: r, token: n, access_token: o, nonce: i } = e, a = await _(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
        headers: this.headers,
        body: {
          provider: r,
          id_token: n,
          access_token: o,
          nonce: i,
          gotrue_meta_security: { captcha_token: t == null ? void 0 : t.captchaToken }
        },
        xform: M
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
    var t, r, n, o, i;
    try {
      if ("email" in e) {
        const { email: a, options: c } = e;
        let l = null, u = null;
        this.flowType === "pkce" && ([l, u] = await ie(this.storage, this.storageKey));
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
            create_user: (o = c == null ? void 0 : c.shouldCreateUser) !== null && o !== void 0 ? o : !0,
            gotrue_meta_security: { captcha_token: c == null ? void 0 : c.captchaToken },
            channel: (i = c == null ? void 0 : c.channel) !== null && i !== void 0 ? i : "sms"
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
      let n, o;
      "options" in e && (n = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo, o = (r = e.options) === null || r === void 0 ? void 0 : r.captchaToken);
      const { data: i, error: a } = await _(this.fetch, "POST", `${this.url}/verify`, {
        headers: this.headers,
        body: Object.assign(Object.assign({}, e), { gotrue_meta_security: { captcha_token: o } }),
        redirectTo: n,
        xform: M
      });
      if (a)
        throw a;
      if (!i)
        throw new Error("An error occurred on token verification.");
      const c = i.session, l = i.user;
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
      let o = null, i = null;
      return this.flowType === "pkce" && ([o, i] = await ie(this.storage, this.storageKey)), await _(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? { provider_id: e.providerId } : null), "domain" in e ? { domain: e.domain } : null), { redirect_to: (r = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo) !== null && r !== void 0 ? r : void 0 }), !((n = e == null ? void 0 : e.options) === null || n === void 0) && n.captchaToken ? { gotrue_meta_security: { captcha_token: e.options.captchaToken } } : null), { skip_http_redirect: !0, code_challenge: o, code_challenge_method: i }),
        headers: this.headers,
        xform: wo
      });
    } catch (o) {
      if (v(o))
        return { data: null, error: o };
      throw o;
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
          throw new G();
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
        const { email: r, type: n, options: o } = e, { error: i } = await _(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            email: r,
            type: n,
            gotrue_meta_security: { captcha_token: o == null ? void 0 : o.captchaToken }
          },
          redirectTo: o == null ? void 0 : o.emailRedirectTo
        });
        return { data: { user: null, session: null }, error: i };
      } else if ("phone" in e) {
        const { phone: r, type: n, options: o } = e, { data: i, error: a } = await _(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            phone: r,
            type: n,
            gotrue_meta_security: { captcha_token: o == null ? void 0 : o.captchaToken }
          }
        });
        return { data: { user: null, session: null, messageId: i == null ? void 0 : i.message_id }, error: a };
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
      const t = await Z(this.storage, this.storageKey);
      if (this._debug("#getSession()", "session from storage", t), t !== null && (this._isValidSession(t) ? e = t : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !e)
        return { data: { session: null }, error: null };
      const r = e.expires_at ? e.expires_at * 1e3 - Date.now() < Ye : !1;
      if (this._debug("#__loadSession()", `session has${r ? "" : " not"} expired`, "expires_at", e.expires_at), !r) {
        if (this.userStorage) {
          const i = await Z(this.userStorage, this.storageKey + "-user");
          i != null && i.user ? e.user = i.user : e.user = et();
        }
        if (this.storage.isServer && e.user) {
          let i = this.suppressGetSessionWarning;
          e = new Proxy(e, {
            get: (c, l, u) => (!i && l === "user" && (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), i = !0, this.suppressGetSessionWarning = !0), Reflect.get(c, l, u))
          });
        }
        return { data: { session: e }, error: null };
      }
      const { session: n, error: o } = await this._callRefreshToken(e.refresh_token);
      return o ? { data: { session: null }, error: o } : { data: { session: n }, error: null };
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
        xform: J
      }) : await this._useSession(async (t) => {
        var r, n, o;
        const { data: i, error: a } = t;
        if (a)
          throw a;
        return !(!((r = i.session) === null || r === void 0) && r.access_token) && !this.hasCustomAuthorizationHeader ? { data: { user: null }, error: new G() } : await _(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (o = (n = i.session) === null || n === void 0 ? void 0 : n.access_token) !== null && o !== void 0 ? o : void 0,
          xform: J
        });
      });
    } catch (t) {
      if (v(t))
        return Fn(t) && (await this._removeSession(), await z(this.storage, `${this.storageKey}-code-verifier`)), { data: { user: null }, error: t };
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
        const { data: n, error: o } = r;
        if (o)
          throw o;
        if (!n.session)
          throw new G();
        const i = n.session;
        let a = null, c = null;
        this.flowType === "pkce" && e.email != null && ([a, c] = await ie(this.storage, this.storageKey));
        const { data: l, error: u } = await _(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: t == null ? void 0 : t.emailRedirectTo,
          body: Object.assign(Object.assign({}, e), { code_challenge: a, code_challenge_method: c }),
          jwt: i.access_token,
          xform: J
        });
        if (u)
          throw u;
        return i.user = l.user, await this._saveSession(i), await this._notifyAllSubscribers("USER_UPDATED", i), { data: { user: i.user }, error: null };
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
        throw new G();
      const t = Date.now() / 1e3;
      let r = t, n = !0, o = null;
      const { payload: i } = Ze(e.access_token);
      if (i.exp && (r = i.exp, n = r <= t), n) {
        const { session: a, error: c } = await this._callRefreshToken(e.refresh_token);
        if (c)
          return { data: { user: null, session: null }, error: c };
        if (!a)
          return { data: { user: null, session: null }, error: null };
        o = a;
      } else {
        const { data: a, error: c } = await this._getUser(e.access_token);
        if (c)
          throw c;
        o = {
          access_token: e.access_token,
          refresh_token: e.refresh_token,
          user: a.user,
          token_type: "bearer",
          expires_in: r - t,
          expires_at: r
        }, await this._saveSession(o), await this._notifyAllSubscribers("SIGNED_IN", o);
      }
      return { data: { user: o.user, session: o }, error: null };
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
          const { data: i, error: a } = t;
          if (a)
            throw a;
          e = (r = i.session) !== null && r !== void 0 ? r : void 0;
        }
        if (!(e != null && e.refresh_token))
          throw new G();
        const { session: n, error: o } = await this._callRefreshToken(e.refresh_token);
        return o ? { data: { user: null, session: null }, error: o } : n ? { data: { user: n.user, session: n }, error: null } : { data: { user: null, session: null }, error: null };
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
      if (!U())
        throw new Ie("No browser detected.");
      if (e.error || e.error_description || e.error_code)
        throw new Ie(e.error_description || "Error in URL with unspecified error_description", {
          error: e.error || "unspecified_error",
          code: e.error_code || "unspecified_code"
        });
      switch (t) {
        case "implicit":
          if (this.flowType === "pkce")
            throw new Wt("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit")
            throw new Ie("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (t === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", !0), !e.code)
          throw new Wt("No code detected.");
        const { data: S, error: m } = await this._exchangeCodeForSession(e.code);
        if (m)
          throw m;
        const b = new URL(window.location.href);
        return b.searchParams.delete("code"), window.history.replaceState(window.history.state, "", b.toString()), { data: { session: S.session, redirectType: null }, error: null };
      }
      const { provider_token: r, provider_refresh_token: n, access_token: o, refresh_token: i, expires_in: a, expires_at: c, token_type: l } = e;
      if (!o || !a || !i || !l)
        throw new Ie("No session defined in URL");
      const u = Math.round(Date.now() / 1e3), d = parseInt(a);
      let h = u + d;
      c && (h = parseInt(c));
      const f = h - u;
      f * 1e3 <= fe && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${d}s`);
      const g = h - d;
      u - g >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", g, h, u) : u - g < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", g, h, u);
      const { data: w, error: p } = await this._getUser(o);
      if (p)
        throw p;
      const y = {
        provider_token: r,
        provider_refresh_token: n,
        access_token: o,
        expires_in: d,
        expires_at: h,
        refresh_token: i,
        token_type: l,
        user: w.user
      };
      return window.location.hash = "", this._debug("#_getSessionFromURL()", "clearing window.location.hash"), { data: { session: y, redirectType: e.type }, error: null };
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
    const t = await Z(this.storage, `${this.storageKey}-code-verifier`);
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
      const { data: n, error: o } = t;
      if (o)
        return { error: o };
      const i = (r = n.session) === null || r === void 0 ? void 0 : r.access_token;
      if (i) {
        const { error: a } = await this.admin.signOut(i, e);
        if (a && !(Mn(a) && (a.status === 404 || a.status === 401 || a.status === 403)))
          return { error: a };
      }
      return e !== "others" && (await this._removeSession(), await z(this.storage, `${this.storageKey}-code-verifier`)), { error: null };
    });
  }
  /**
   * Receive a notification every time an auth event happens.
   * @param callback A callback function to be invoked when an auth event happens.
   */
  onAuthStateChange(e) {
    const t = Xn(), r = {
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
        const { data: { session: o }, error: i } = t;
        if (i)
          throw i;
        await ((r = this.stateChangeEmitters.get(e)) === null || r === void 0 ? void 0 : r.callback("INITIAL_SESSION", o)), this._debug("INITIAL_SESSION", "callback id", e, "session", o);
      } catch (o) {
        await ((n = this.stateChangeEmitters.get(e)) === null || n === void 0 ? void 0 : n.callback("INITIAL_SESSION", null)), this._debug("INITIAL_SESSION", "callback id", e, "error", o), console.error(o);
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
    this.flowType === "pkce" && ([r, n] = await ie(
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
    } catch (o) {
      if (v(o))
        return { data: null, error: o };
      throw o;
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
      const { data: r, error: n } = await this._useSession(async (o) => {
        var i, a, c, l, u;
        const { data: d, error: h } = o;
        if (h)
          throw h;
        const f = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, e.provider, {
          redirectTo: (i = e.options) === null || i === void 0 ? void 0 : i.redirectTo,
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
      return U() && !(!((t = e.options) === null || t === void 0) && t.skipBrowserRedirect) && window.location.assign(r == null ? void 0 : r.url), { data: { provider: e.provider, url: r == null ? void 0 : r.url }, error: null };
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
        const { data: o, error: i } = t;
        if (i)
          throw i;
        return await _(this.fetch, "DELETE", `${this.url}/user/identities/${e.identity_id}`, {
          headers: this.headers,
          jwt: (n = (r = o.session) === null || r === void 0 ? void 0 : r.access_token) !== null && n !== void 0 ? n : void 0
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
      return await ro(async (n) => (n > 0 && await to(200 * Math.pow(2, n - 1)), this._debug(t, "refreshing attempt", n), await _(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: { refresh_token: e },
        headers: this.headers,
        xform: M
      })), (n, o) => {
        const i = 200 * Math.pow(2, n);
        return o && Xe(o) && // retryable only if the request can be sent before the backoff overflows the tick duration
        Date.now() + i - r < fe;
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
    return this._debug("#_handleProviderSignIn()", "provider", e, "options", t, "url", r), U() && !t.skipBrowserRedirect && window.location.assign(r), { data: { provider: e, url: r }, error: null };
  }
  /**
   * Recovers the session from LocalStorage and refreshes the token
   * Note: this method is async to accommodate for AsyncStorage e.g. in React native.
   */
  async _recoverAndRefresh() {
    var e, t;
    const r = "#_recoverAndRefresh()";
    this._debug(r, "begin");
    try {
      const n = await Z(this.storage, this.storageKey);
      if (n && this.userStorage) {
        let i = await Z(this.userStorage, this.storageKey + "-user");
        !this.storage.isServer && Object.is(this.storage, this.userStorage) && !i && (i = { user: n.user }, await ge(this.userStorage, this.storageKey + "-user", i)), n.user = (e = i == null ? void 0 : i.user) !== null && e !== void 0 ? e : et();
      } else if (n && !n.user && !n.user) {
        const i = await Z(this.storage, this.storageKey + "-user");
        i && (i != null && i.user) ? (n.user = i.user, await z(this.storage, this.storageKey + "-user"), await ge(this.storage, this.storageKey, n)) : n.user = et();
      }
      if (this._debug(r, "session from storage", n), !this._isValidSession(n)) {
        this._debug(r, "session is not valid"), n !== null && await this._removeSession();
        return;
      }
      const o = ((t = n.expires_at) !== null && t !== void 0 ? t : 1 / 0) * 1e3 - Date.now() < Ye;
      if (this._debug(r, `session has${o ? "" : " not"} expired with margin of ${Ye}s`), o) {
        if (this.autoRefreshToken && n.refresh_token) {
          const { error: i } = await this._callRefreshToken(n.refresh_token);
          i && (console.error(i), Xe(i) || (this._debug(r, "refresh failed with a non-retryable error, removing the session", i), await this._removeSession()));
        }
      } else if (n.user && n.user.__isUserNotAvailableProxy === !0)
        try {
          const { data: i, error: a } = await this._getUser(n.access_token);
          !a && (i != null && i.user) ? (n.user = i.user, await this._saveSession(n), await this._notifyAllSubscribers("SIGNED_IN", n)) : this._debug(r, "could not get user data, skipping SIGNED_IN notification");
        } catch (i) {
          console.error("Error getting user data:", i), this._debug(r, "error getting user data, skipping SIGNED_IN notification", i);
        }
      else
        await this._notifyAllSubscribers("SIGNED_IN", n);
    } catch (n) {
      this._debug(r, "error", n), console.error(n);
      return;
    } finally {
      this._debug(r, "end");
    }
  }
  async _callRefreshToken(e) {
    var t, r;
    if (!e)
      throw new G();
    if (this.refreshingDeferred)
      return this.refreshingDeferred.promise;
    const n = `#_callRefreshToken(${e.substring(0, 5)}...)`;
    this._debug(n, "begin");
    try {
      this.refreshingDeferred = new Ke();
      const { data: o, error: i } = await this._refreshAccessToken(e);
      if (i)
        throw i;
      if (!o.session)
        throw new G();
      await this._saveSession(o.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", o.session);
      const a = { session: o.session, error: null };
      return this.refreshingDeferred.resolve(a), a;
    } catch (o) {
      if (this._debug(n, "error", o), v(o)) {
        const i = { session: null, error: o };
        return Xe(o) || await this._removeSession(), (t = this.refreshingDeferred) === null || t === void 0 || t.resolve(i), i;
      }
      throw (r = this.refreshingDeferred) === null || r === void 0 || r.reject(o), o;
    } finally {
      this.refreshingDeferred = null, this._debug(n, "end");
    }
  }
  async _notifyAllSubscribers(e, t, r = !0) {
    const n = `#_notifyAllSubscribers(${e})`;
    this._debug(n, "begin", t, `broadcast = ${r}`);
    try {
      this.broadcastChannel && r && this.broadcastChannel.postMessage({ event: e, session: t });
      const o = [], i = Array.from(this.stateChangeEmitters.values()).map(async (a) => {
        try {
          await a.callback(e, t);
        } catch (c) {
          o.push(c);
        }
      });
      if (await Promise.all(i), o.length > 0) {
        for (let a = 0; a < o.length; a += 1)
          console.error(o[a]);
        throw o[0];
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
    this._debug("#_saveSession()", e), this.suppressGetSessionWarning = !0;
    const t = Object.assign({}, e), r = t.user && t.user.__isUserNotAvailableProxy === !0;
    if (this.userStorage) {
      !r && t.user && await ge(this.userStorage, this.storageKey + "-user", {
        user: t.user
      });
      const n = Object.assign({}, t);
      delete n.user;
      const o = Jt(n);
      await ge(this.storage, this.storageKey, o);
    } else {
      const n = Jt(t);
      await ge(this.storage, this.storageKey, n);
    }
  }
  async _removeSession() {
    this._debug("#_removeSession()"), await z(this.storage, this.storageKey), await z(this.storage, this.storageKey + "-code-verifier"), await z(this.storage, this.storageKey + "-user"), this.userStorage && await z(this.userStorage, this.storageKey + "-user"), await this._notifyAllSubscribers("SIGNED_OUT", null);
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
      e && U() && (window != null && window.removeEventListener) && window.removeEventListener("visibilitychange", e);
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
    const e = setInterval(() => this._autoRefreshTokenTick(), fe);
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
              const n = Math.floor((r.expires_at * 1e3 - e) / fe);
              this._debug("#_autoRefreshTokenTick()", `access token expires in ${n} ticks, a tick lasts ${fe}ms, refresh threshold is ${mt} ticks`), n <= mt && await this._callRefreshToken(r.refresh_token);
            });
          } catch (t) {
            console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
          }
        } finally {
          this._debug("#_autoRefreshTokenTick()", "end");
        }
      });
    } catch (e) {
      if (e.isAcquireTimeout || e instanceof qr)
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
    if (this._debug("#_handleVisibilityChange()"), !U() || !(window != null && window.addEventListener))
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
      const [o, i] = await ie(this.storage, this.storageKey), a = new URLSearchParams({
        code_challenge: `${encodeURIComponent(o)}`,
        code_challenge_method: `${encodeURIComponent(i)}`
      });
      n.push(a.toString());
    }
    if (r != null && r.queryParams) {
      const o = new URLSearchParams(r.queryParams);
      n.push(o.toString());
    }
    return r != null && r.skipBrowserRedirect && n.push(`skip_http_redirect=${r.skipBrowserRedirect}`), `${e}?${n.join("&")}`;
  }
  async _unenroll(e) {
    try {
      return await this._useSession(async (t) => {
        var r;
        const { data: n, error: o } = t;
        return o ? { data: null, error: o } : await _(this.fetch, "DELETE", `${this.url}/factors/${e.factorId}`, {
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
        const { data: o, error: i } = t;
        if (i)
          return { data: null, error: i };
        const a = Object.assign({ friendly_name: e.friendlyName, factor_type: e.factorType }, e.factorType === "phone" ? { phone: e.phone } : { issuer: e.issuer }), { data: c, error: l } = await _(this.fetch, "POST", `${this.url}/factors`, {
          body: a,
          headers: this.headers,
          jwt: (r = o == null ? void 0 : o.session) === null || r === void 0 ? void 0 : r.access_token
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
          const { data: n, error: o } = t;
          if (o)
            return { data: null, error: o };
          const { data: i, error: a } = await _(this.fetch, "POST", `${this.url}/factors/${e.factorId}/verify`, {
            body: { code: e.code, challenge_id: e.challengeId },
            headers: this.headers,
            jwt: (r = n == null ? void 0 : n.session) === null || r === void 0 ? void 0 : r.access_token
          });
          return a ? { data: null, error: a } : (await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + i.expires_in }, i)), await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", i), { data: i, error: a });
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
          const { data: n, error: o } = t;
          return o ? { data: null, error: o } : await _(this.fetch, "POST", `${this.url}/factors/${e.factorId}/challenge`, {
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
    const r = (e == null ? void 0 : e.factors) || [], n = r.filter((i) => i.factor_type === "totp" && i.status === "verified"), o = r.filter((i) => i.factor_type === "phone" && i.status === "verified");
    return {
      data: {
        all: r,
        totp: n,
        phone: o
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
      const { data: { session: n }, error: o } = e;
      if (o)
        return { data: null, error: o };
      if (!n)
        return {
          data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
          error: null
        };
      const { payload: i } = Ze(n.access_token);
      let a = null;
      i.aal && (a = i.aal);
      let c = a;
      ((r = (t = n.user.factors) === null || t === void 0 ? void 0 : t.filter((d) => d.status === "verified")) !== null && r !== void 0 ? r : []).length > 0 && (c = "aal2");
      const u = i.amr || [];
      return { data: { currentLevel: a, nextLevel: c, currentAuthenticationMethods: u }, error: null };
    }));
  }
  async fetchJwk(e, t = { keys: [] }) {
    let r = t.keys.find((a) => a.kid === e);
    if (r)
      return r;
    const n = Date.now();
    if (r = this.jwks.keys.find((a) => a.kid === e), r && this.jwks_cached_at + Nn > n)
      return r;
    const { data: o, error: i } = await _(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
      headers: this.headers
    });
    if (i)
      throw i;
    return !o.keys || o.keys.length === 0 || (this.jwks = o, this.jwks_cached_at = n, r = o.keys.find((a) => a.kid === e), !r) ? null : r;
  }
  /**
   * Extracts the JWT claims present in the access token by first verifying the
   * JWT against the server's JSON Web Key Set endpoint
   * `/.well-known/jwks.json` which is often cached, resulting in significantly
   * faster responses. Prefer this method over {@link #getUser} which always
   * sends a request to the Auth server for each JWT.
   *
   * If the project is not using an asymmetric JWT signing key (like ECC or
   * RSA) it always sends a request to the Auth server (similar to {@link
   * #getUser}) to verify the JWT.
   *
   * @param jwt An optional specific JWT you wish to verify, not the one you
   *            can obtain from {@link #getSession}.
   * @param options Various additional options that allow you to customize the
   *                behavior of this method.
   */
  async getClaims(e, t = {}) {
    try {
      let r = e;
      if (!r) {
        const { data: f, error: g } = await this.getSession();
        if (g || !f.session)
          return { data: null, error: g };
        r = f.session.access_token;
      }
      const { header: n, payload: o, signature: i, raw: { header: a, payload: c } } = Ze(r);
      t != null && t.allowExpired || lo(o.exp);
      const l = !n.alg || n.alg.startsWith("HS") || !n.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(n.kid, t != null && t.keys ? { keys: t.keys } : t == null ? void 0 : t.jwks);
      if (!l) {
        const { error: f } = await this.getUser(r);
        if (f)
          throw f;
        return {
          data: {
            claims: o,
            header: n,
            signature: i
          },
          error: null
        };
      }
      const u = uo(n.alg), d = await crypto.subtle.importKey("jwk", l, u, !0, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(u, d, i, Vn(`${a}.${c}`)))
        throw new vt("Invalid JWT signature");
      return {
        data: {
          claims: o,
          header: n,
          signature: i
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
const Co = Ae;
class Ao extends Co {
  constructor(e) {
    super(e);
  }
}
var jo = function(s, e, t, r) {
  function n(o) {
    return o instanceof t ? o : new t(function(i) {
      i(o);
    });
  }
  return new (t || (t = Promise))(function(o, i) {
    function a(u) {
      try {
        l(r.next(u));
      } catch (d) {
        i(d);
      }
    }
    function c(u) {
      try {
        l(r.throw(u));
      } catch (d) {
        i(d);
      }
    }
    function l(u) {
      u.done ? o(u.value) : n(u.value).then(a, c);
    }
    l((r = r.apply(s, e || [])).next());
  });
};
class Po {
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
    var n, o, i;
    if (this.supabaseUrl = e, this.supabaseKey = t, !e)
      throw new Error("supabaseUrl is required.");
    if (!t)
      throw new Error("supabaseKey is required.");
    const a = Rn(e), c = new URL(a);
    this.realtimeUrl = new URL("realtime/v1", c), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", c), this.storageUrl = new URL("storage/v1", c), this.functionsUrl = new URL("functions/v1", c);
    const l = `sb-${c.hostname.split(".")[0]}-auth-token`, u = {
      db: On,
      realtime: Cn,
      auth: Object.assign(Object.assign({}, Tn), { storageKey: l }),
      global: En
    }, d = In(r ?? {}, u);
    this.storageKey = (n = d.auth.storageKey) !== null && n !== void 0 ? n : "", this.headers = (o = d.global.headers) !== null && o !== void 0 ? o : {}, d.accessToken ? (this.accessToken = d.accessToken, this.auth = new Proxy({}, {
      get: (h, f) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(f)} is not possible`);
      }
    })) : this.auth = this._initSupabaseAuthClient((i = d.auth) !== null && i !== void 0 ? i : {}, this.headers, d.global.fetch), this.fetch = $n(t, this._getAccessToken.bind(this), d.global.fetch), this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, d.realtime)), this.rest = new Hs(new URL("rest/v1", c).href, {
      headers: this.headers,
      schema: d.db.schema,
      fetch: this.fetch
    }), d.accessToken || this._listenForAuthEvents();
  }
  /**
   * Supabase Functions allows you to deploy and invoke edge functions.
   */
  get functions() {
    return new fs(this.functionsUrl.href, {
      headers: this.headers,
      customFetch: this.fetch
    });
  }
  /**
   * Supabase Storage allows you to manage user-generated content, such as photos or videos.
   */
  get storage() {
    return new bn(this.storageUrl.href, this.headers, this.fetch);
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
    return jo(this, void 0, void 0, function* () {
      if (this.accessToken)
        return yield this.accessToken();
      const { data: r } = yield this.auth.getSession();
      return (t = (e = r.session) === null || e === void 0 ? void 0 : e.access_token) !== null && t !== void 0 ? t : null;
    });
  }
  _initSupabaseAuthClient({ autoRefreshToken: e, persistSession: t, detectSessionInUrl: r, storage: n, storageKey: o, flowType: i, lock: a, debug: c }, l, u) {
    const d = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new Ao({
      url: this.authUrl.href,
      headers: Object.assign(Object.assign({}, d), l),
      storageKey: o,
      autoRefreshToken: e,
      persistSession: t,
      detectSessionInUrl: r,
      storage: n,
      flowType: i,
      lock: a,
      debug: c,
      fetch: u,
      // auth checks if there is a custom authorizaiton header using this flag
      // so it knows whether to return an error when getUser is called with no session
      hasCustomAuthorizationHeader: "Authorization" in this.headers
    });
  }
  _initRealtimeClient(e) {
    return new cn(this.realtimeUrl.href, Object.assign(Object.assign({}, e), { params: Object.assign({ apikey: this.supabaseKey }, e == null ? void 0 : e.params) }));
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
const $o = (s, e, t) => new Po(s, e, t);
function xo() {
  if (typeof window < "u" || typeof process > "u" || process.version === void 0 || process.version === null)
    return !1;
  const s = process.version.match(/^v(\d+)\./);
  return s ? parseInt(s[1], 10) <= 18 : !1;
}
xo() && console.warn("⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");
const O = $o(
  "https://lpuqrzvokroazwlricgn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdXFyenZva3JvYXp3bHJpY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTM2MzQsImV4cCI6MjA2NTI4OTYzNH0.bIItSJMzdx9BgXm5jOtTFI03yq94CLVHepiPQ0Xl_lU"
), Nr = "smoothr_cart_meta";
let Zt = !1;
var ar;
const Ro = (ar = window.SMOOTHR_CONFIG) == null ? void 0 : ar.debug;
const Io = (...s) => Ro && console.warn("smoothr:abandoned-cart", ...s);
function rt() {
  if (typeof window > "u" || !window.localStorage) return {};
  try {
    const s = window.localStorage.getItem(Nr);
    if (s) return JSON.parse(s);
  } catch (s) {
    Io("invalid meta", s);
  }
  return {};
}
function st(s) {
  if (!(typeof window > "u" || !window.localStorage))
    try {
      window.localStorage.setItem(Nr, JSON.stringify(s));
    } catch (e) {
      e("write failed", e);
    }
}
function Uo(s) {
  if (s.sessionId) return s.sessionId;
  let e;
  return typeof crypto < "u" && crypto.randomUUID ? e = crypto.randomUUID() : e = Date.now().toString(36) + Math.random().toString(36).slice(2), s.sessionId = e, e;
}
function Lo() {
  if (typeof window > "u") return {};
  const s = new URLSearchParams(window.location.search), e = {};
  return ["source", "medium", "campaign"].forEach((t) => {
    const r = s.get("utm_" + t);
    r && (e[t] = r);
  }), e;
}
function Br(s = {}) {
  if (Zt || typeof window > "u") return;
  Zt = !0;
  const e = !!s.debug, t = rt();
  Uo(t), !t.referrer && typeof document < "u" && (t.referrer = document.referrer || ""), (!t.utm || Object.keys(t.utm).length === 0) && (t.utm = Lo()), t.lastActive = Date.now(), st(t);
  const r = () => {
    const o = rt();
    o.lastModified = Date.now(), st(o), e && console.log("smoothr:abandoned-cart lastModified", o.lastModified);
  }, n = () => {
    const o = rt();
    o.lastActive = Date.now(), st(o), e && console.log("smoothr:abandoned-cart lastActive", o.lastActive);
  };
  window.addEventListener("smoothr:cart:updated", r), ["click", "keydown", "scroll", "mousemove"].forEach((o) => {
    window.addEventListener(o, n);
  });
}
function Mr() {
}
const Do = {
  setupAbandonedCartTracker: Br,
  triggerRecoveryFlow: Mr
}, qo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Do,
  setupAbandonedCartTracker: Br,
  triggerRecoveryFlow: Mr
}, Symbol.toStringTag, { value: "Module" })), No = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Bo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
let R = "USD", V = {
  USD: 1,
  EUR: 0.9,
  GBP: 0.8
};
function Fr(s) {
  R = s;
}
function _t(s = {}) {
  V = { ...V, ...s };
}
function qe(s, e = R, t = R) {
  if (!V[t] || !V[e])
    throw new Error("Unsupported currency");
  return s / V[t] * V[e];
}
function Ne(s, e = R, t = "en-US") {
  return new Intl.NumberFormat(t, {
    style: "currency",
    currency: e
  }).format(s);
}
const Mo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get baseCurrency() {
    return R;
  },
  convertCurrency: qe,
  convertPrice: qe,
  formatCurrency: Ne,
  formatPrice: Ne,
  get rates() {
    return V;
  },
  setBaseCurrency: Fr,
  updateRates: _t
}, Symbol.toStringTag, { value: "Module" })), Fo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Wo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Wr = "smoothr_cart";
var cr;
const zo = (cr = window.SMOOTHR_CONFIG) == null ? void 0 : cr.debug;
const Go = (...s) => zo && console.warn("[Smoothr Cart]", ...s);
function zr() {
  return typeof window < "u" && window.localStorage ? window.localStorage : typeof globalThis < "u" && globalThis.localStorage ? globalThis.localStorage : null;
}
function B() {
  const s = zr();
  if (!s)
    return { items: [], meta: { lastModified: Date.now() } };
  try {
    const e = s.getItem(Wr);
    if (e) return JSON.parse(e);
  } catch (e) {
    Go("invalid data", e);
  }
  return { items: [], meta: { lastModified: Date.now() } };
}
function _e(s) {
  const e = zr();
  if (e)
    try {
      e.setItem(Wr, JSON.stringify(s));
    } catch (t) {
      t("write failed", t);
    }
}
function be(s) {
  typeof window < "u" && window.dispatchEvent && window.dispatchEvent(
    new CustomEvent("smoothr:cart:updated", { detail: s })
  );
}
function Gr() {
  return B();
}
function Ho() {
  return Gr().meta || {};
}
function Ko(s, e) {
  const t = B();
  t.meta = t.meta || {}, t.meta[s] = e, t.meta.lastModified = Date.now(), _e(t), be(t);
}
function Jo(s) {
  const e = B(), t = e.items.find((r) => r.product_id === s.product_id);
  t ? t.quantity += s.quantity || 1 : e.items.push({ ...s, quantity: s.quantity || 1 }), e.meta.lastModified = Date.now(), _e(e), be(e);
}
function Vo(s) {
  const e = B();
  e.items = e.items.filter((t) => t.product_id !== s), e.meta.lastModified = Date.now(), _e(e), be(e);
}
function Qo(s, e) {
  const t = B(), r = t.items.find((n) => n.product_id === s);
  r && (e <= 0 ? t.items = t.items.filter((n) => n !== r) : r.quantity = e, t.meta.lastModified = Date.now(), _e(t), be(t));
}
function Yo() {
  const s = { items: [], meta: { lastModified: Date.now() } };
  _e(s), be(s);
}
function Xo() {
  return B().items.reduce((s, e) => s + e.price * e.quantity, 0);
}
function Zo(s) {
  const e = B();
  e.discount = s, e.meta.lastModified = Date.now(), _e(e), be(e);
}
function ei() {
  return B().discount || null;
}
function ti() {
  const s = B();
  let e = s.items.reduce((t, r) => t + r.price * r.quantity, 0);
  return s.discount && (s.discount.type === "percent" ? e -= Math.round(e * (s.discount.amount / 100)) : e -= s.discount.amount), e < 0 ? 0 : e;
}
const $t = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addItem: Jo,
  applyDiscount: Zo,
  clearCart: Yo,
  getCart: Gr,
  getDiscount: ei,
  getMeta: Ho,
  getSubtotal: Xo,
  getTotal: ti,
  readCart: B,
  removeItem: Vo,
  setMetaField: Ko,
  updateQuantity: Qo
}, Symbol.toStringTag, { value: "Module" }));
var lr;
const xt = (lr = window.SMOOTHR_CONFIG) == null ? void 0 : lr.debug, Ue = (...s) => xt && console.log("[Smoothr Orders]", ...s), er = (...s) => xt && console.warn("[Smoothr Orders]", ...s), ri = (...s) => xt && console.error("[Smoothr Orders]", ...s);
async function Hr(s) {
  if (!s) return [];
  try {
    const { data: e, error: t } = await O.from("orders").select("*, customers(email, name)").eq("customer_id", s).order("order_date", { ascending: !1 });
    return t ? (ri("fetch error", t), []) : (Ue(`fetched ${e.length} records`), e || []);
  } catch (e) {
    return e("fetch error", e), [];
  }
}
async function Kr(s) {
  var a, c, l;
  if (typeof document > "u") return;
  const e = typeof s == "string" ? document.querySelector(s) : s || document, t = e.querySelector('[data-smoothr="order-list"]');
  if (!t) {
    er("container not found");
    return;
  }
  const r = t.querySelector('[data-smoothr="order-card"]');
  if (!r) {
    er("template not found");
    return;
  }
  const n = e.querySelector('[data-smoothr="no-orders"]');
  r.setAttribute("hidden", ""), t.querySelectorAll('[data-smoothr="order-card"]').forEach((u) => {
    u !== r && u.remove();
  });
  const o = (l = (c = (a = window.smoothr) == null ? void 0 : a.auth) == null ? void 0 : c.user) == null ? void 0 : l.value, i = await Hr(o == null ? void 0 : o.id);
  if (!i.length) {
    t.setAttribute("hidden", ""), n && (n.removeAttribute("hidden"), n.style.display = "flex");
    return;
  }
  t.removeAttribute("hidden"), n && (n.setAttribute("hidden", ""), n.style.display = "none"), i.forEach((u) => {
    var g, w, p;
    Ue("rendering order object", u);
    const d = r.cloneNode(!0);
    d.removeAttribute("hidden"), d.style.display = "flex";
    const h = (y, S) => {
      const m = d.querySelector(y);
      m && (m.textContent = S ?? "");
    }, f = d.querySelector('[data-smoothr="order-date"]');
    if (f) {
      const y = new Date(u.order_date), S = navigator.language || "en-GB", m = y.toLocaleDateString(S, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      f.textContent = m;
    }
    h('[data-smoothr="order-number"]', u.order_number), h('[data-smoothr="customer-name"]', (g = u.customers) == null ? void 0 : g.name), Ue("customer email", (w = u.customers) == null ? void 0 : w.email), Ue("order price", u.total_price), h('[data-smoothr="order-email"]', (p = u.customers) == null ? void 0 : p.email), h(
      '[data-smoothr="order-price"]',
      `£${Number(u.total_price).toFixed(2)}`
    ), h('[data-smoothr="order-status"]', u.status), t.appendChild(d);
  });
}
const si = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  fetchOrderHistory: Hr,
  renderOrders: Kr
}, Symbol.toStringTag, { value: "Module" })), ni = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), oi = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), ii = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
var ur;
const Jr = typeof window < "u" && ((ur = window.SMOOTHR_CONFIG) == null ? void 0 : ur.debug), bt = (...s) => Jr && console.log("[Smoothr Auth]", ...s);
const ai = (...s) => Jr && console.error("[Smoothr Auth]", ...s);
function Vr() {
  return typeof window < "u" ? window.location.origin : "";
}
function ci() {
  return typeof window < "u" ? window.location.origin : "";
}
function nt(s) {
  return /^\S+@\S+\.\S+$/.test(s);
}
function Qr(s) {
  let e = 0;
  return s.length >= 8 && e++, /[a-z]/.test(s) && e++, /[A-Z]/.test(s) && e++, /\d/.test(s) && e++, /[^A-Za-z0-9]/.test(s) && e++, e;
}
function li(s, e) {
  const t = s.querySelector("[data-smoothr-password-strength]");
  if (!t) return;
  const r = Qr(e), n = r >= 4 ? "Strong" : r >= 3 ? "Medium" : "Weak";
  t.tagName === "PROGRESS" ? t.value = r : t.textContent = n;
}
function ue(s, e) {
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
function Yr(s, e) {
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
function I(s, e, t, r) {
  const n = Yr(r || s, "[data-smoothr-error]") || s.querySelector("[data-smoothr-error]");
  n ? (n.removeAttribute("hidden"), n.textContent = e, n.style.display = "", n.focus && n.focus()) : (ai("No [data-smoothr-error] container found"), alert(e)), t && t.focus && t.focus();
}
function ot(s, e, t) {
  const r = Yr(t || s, "[data-smoothr-success]") || s.querySelector("[data-smoothr-success]");
  r ? (r.removeAttribute("hidden"), r.textContent = e, r.style.display = "", r.focus && r.focus()) : (bt("No [data-smoothr-success] container found"), alert(e));
}
function Xr(s) {
  return s = s || "", s.replace(/^www\./, "").toLowerCase();
}
async function we(s = "login") {
  const e = Xr(window.location.hostname), t = `${s}_redirect_url`;
  try {
    const { data: r, error: n } = await O.from("public_store_settings").select(t).eq("domain", e).single();
    if (n) throw n;
    return (r == null ? void 0 : r[t]) || window.location.origin;
  } catch (r) {
    return console.warn("[Smoothr Auth] Redirect lookup failed:", r), window.location.origin;
  }
}
async function ui() {
  const s = Xr(window.location.hostname);
  try {
    const { data: e, error: t } = await O.from("public_store_settings").select("dashboard_home_url").eq("domain", s).single();
    if (t) throw t;
    return (e == null ? void 0 : e.dashboard_home_url) || "/";
  } catch (e) {
    return console.warn("[Smoothr Auth] Dashboard home lookup failed:", e), "/";
  }
}
function di() {
  const s = O.auth.getUser().then(async ({ data: { user: t } }) => {
    var r, n;
    if (typeof window < "u") {
      window.smoothr = window.smoothr || {}, window.smoothr.auth = { user: t || null }, t ? bt(`%c✅ Smoothr Auth: Logged in as ${t.email}`, "color: #22c55e; font-weight: bold;") : bt("%c🔒 Smoothr Auth: Not logged in", "color: #f87171; font-weight: bold;");
      const o = typeof localStorage < "u" ? localStorage : typeof globalThis < "u" ? globalThis.localStorage : void 0;
      if (((r = o == null ? void 0 : o.getItem) == null ? void 0 : r.call(o, "smoothr_oauth")) && t) {
        document.dispatchEvent(new CustomEvent("smoothr:login", { detail: { user: t } })), (n = o == null ? void 0 : o.removeItem) == null || n.call(o, "smoothr_oauth");
        const a = await we("login");
        window.location.href = a;
      }
    }
  }), e = () => {
    St(), kt(), typeof MutationObserver < "u" && new MutationObserver(() => {
      St(), kt();
    }).observe(document.body, { childList: !0, subtree: !0 });
  };
  return document.readyState !== "loading" ? e() : document.addEventListener("DOMContentLoaded", e), s;
}
async function hi() {
  await we("login"), typeof window < "u" && localStorage.setItem("smoothr_oauth", "1"), await O.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: Vr() }
  });
}
async function fi() {
  await we("login"), typeof window < "u" && localStorage.setItem("smoothr_oauth", "1"), await O.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo: Vr() }
  });
}
async function gi(s) {
  return await O.auth.resetPasswordForEmail(s, {
    redirectTo: ci()
  });
}
let St = () => {
}, kt = () => {
};
function pi(s, e) {
  St = s, kt = e;
}
var dr;
const mi = (dr = window.SMOOTHR_CONFIG) == null ? void 0 : dr.debug, Et = (...s) => mi && console.log("[Smoothr Auth]", ...s);
function wi(s) {
  return { value: s };
}
const $e = wi(null);
async function Zr(s, e) {
  const { data: t, error: r } = await O.auth.signInWithPassword({
    email: s,
    password: e
  });
  return r || ($e.value = t.user || null, typeof window < "u" && (window.smoothr = window.smoothr || {}, window.smoothr.auth = Q)), { data: t, error: r };
}
async function es(s, e) {
  const { data: t, error: r } = await O.auth.signUp({ email: s, password: e });
  return r || ($e.value = t.user || null, typeof window < "u" && (window.smoothr = window.smoothr || {}, window.smoothr.auth = Q)), { data: t, error: r };
}
async function ts(s) {
  return await gi(s);
}
async function rs() {
  const { error: s } = await O.auth.signOut(), {
    data: { user: e }
  } = await O.auth.getUser();
  return $e.value = e || null, typeof window < "u" && (window.smoothr = window.smoothr || {}, window.smoothr.auth = Q, e ? Et(
    `%c✅ Smoothr Auth: Logged in as ${e.email}`,
    "color: #22c55e; font-weight: bold;"
  ) : Et("%c🔒 Smoothr Auth: Not logged in", "color: #f87171; font-weight: bold;")), { error: s };
}
async function yi(...s) {
  var e, t;
  await di(...s), typeof window < "u" && ($e.value = ((t = (e = window.smoothr) == null ? void 0 : e.auth) == null ? void 0 : t.user) || null, window.smoothr.auth = Q);
}
function it(s, e, t) {
  try {
    s && s.dataset && (s.dataset[e] = t);
  } catch {
  }
}
function vi(s = document) {
  document.querySelectorAll('[data-smoothr="login"]').forEach((t) => {
    if (t.dataset.smoothrBoundAuth) return;
    it(t, "smoothrBoundAuth", "1");
    const r = t.closest ? t.closest('[data-smoothr="auth-form"]') : null;
    t.addEventListener && t.addEventListener("click", async (n) => {
      n.preventDefault();
      const o = r;
      if (!o) return;
      const i = o.querySelector('[data-smoothr="email"]'), a = o.querySelector('[data-smoothr="password"]'), c = (i == null ? void 0 : i.value) || "", l = (a == null ? void 0 : a.value) || "";
      if (!nt(c)) {
        I(o, "Enter a valid email address", i, t);
        return;
      }
      ue(t, !0);
      try {
        const { data: u, error: d } = await Zr(c, l);
        if (d)
          I(o, d.message || "Invalid credentials", i, t);
        else {
          ot(o, "Logged in, redirecting...", t), document.dispatchEvent(new CustomEvent("smoothr:login", { detail: u }));
          const h = await we("login");
          setTimeout(() => {
            window.location.href = h;
          }, 1e3);
        }
      } catch (u) {
        I(o, u.message || "Network error", i, t);
      } finally {
        ue(t, !1);
      }
    });
  }), s.querySelectorAll('[data-smoothr="signup"], [data-smoothr="login-google"], [data-smoothr="login-apple"], [data-smoothr="password-reset"]').forEach((t) => {
    if (t.dataset.smoothrBoundAuth) return;
    it(t, "smoothrBoundAuth", "1");
    const r = t.getAttribute("data-smoothr"), n = t.closest ? t.closest('[data-smoothr="auth-form"]') : null;
    switch (r) {
      case "login-google": {
        t.addEventListener("click", async (o) => {
          o.preventDefault(), await hi();
        });
        break;
      }
      case "login-apple": {
        t.addEventListener("click", async (o) => {
          o.preventDefault(), await fi();
        });
        break;
      }
      case "signup": {
        if (n) {
          const o = n.querySelector('[data-smoothr="password"]');
          o && o.addEventListener && o.addEventListener("input", () => {
            li(n, o.value);
          });
        }
        t.addEventListener("click", async (o) => {
          o.preventDefault();
          const i = n;
          if (!i) return;
          const a = i.querySelector('[data-smoothr="email"]'), c = i.querySelector('[data-smoothr="password"]'), l = i.querySelector('[data-smoothr="password-confirm"]'), u = (a == null ? void 0 : a.value) || "", d = (c == null ? void 0 : c.value) || "", h = (l == null ? void 0 : l.value) || "";
          if (!nt(u)) {
            I(i, "Enter a valid email address", a, t);
            return;
          }
          if (Qr(d) < 3) {
            I(i, "Weak password", c, t);
            return;
          }
          if (d !== h) {
            I(i, "Passwords do not match", l, t);
            return;
          }
          ue(t, !0);
          try {
            const { data: f, error: g } = await es(u, d);
            if (g)
              I(i, g.message || "Signup failed", a, t);
            else {
              document.dispatchEvent(new CustomEvent("smoothr:login", { detail: f })), ot(i, "Account created! Redirecting...", t);
              const w = await we("login");
              setTimeout(() => {
                window.location.href = w;
              }, 1e3);
            }
          } catch (f) {
            I(i, f.message || "Network error", a, t);
          } finally {
            ue(t, !1);
          }
        });
        break;
      }
      case "password-reset": {
        t.addEventListener("click", async (o) => {
          o.preventDefault();
          const i = n;
          if (!i) return;
          const a = i.querySelector('[data-smoothr="email"]'), c = (a == null ? void 0 : a.value) || "";
          if (!nt(c)) {
            I(i, "Enter a valid email address", a, t);
            return;
          }
          ue(t, !0);
          try {
            const { error: l } = await ts(c);
            l ? I(
              i,
              l.message || "Error requesting password reset",
              a,
              t
            ) : ot(i, "Check your email for a reset link.", t);
          } catch (l) {
            I(
              i,
              l.message || "Error requesting password reset",
              a,
              t
            );
          } finally {
            ue(t, !1);
          }
        });
        break;
      }
    }
  }), document.querySelectorAll('[data-smoothr="account-access"]').forEach((t) => {
    t.dataset.smoothrBoundAuth || (it(t, "smoothrBoundAuth", "1"), t.addEventListener("click", async (r) => {
      var o, i;
      r.preventDefault();
      const n = (i = (o = window.smoothr) == null ? void 0 : o.auth) == null ? void 0 : i.user;
      if ((n == null ? void 0 : n.value) !== null) {
        const a = await ui() || "/";
        window.location.href = a;
      } else
        (document.querySelector('[data-smoothr="auth-wrapper"]') || document).dispatchEvent(
          new CustomEvent("smoothr:open-auth", {
            detail: { targetSelector: '[data-smoothr="auth-wrapper"]' }
          })
        );
    }));
  });
}
function _i() {
  document.querySelectorAll('[data-smoothr="sign-out"]').forEach((s) => {
    s.addEventListener("click", async (e) => {
      e.preventDefault();
      const { error: t } = await rs();
      t && Et(t), document.dispatchEvent(new CustomEvent("smoothr:sign-out"));
      const r = await we("sign-out");
      window.location.href = r;
    });
  });
}
pi(vi, _i);
const Q = {
  login: Zr,
  signup: es,
  resetPassword: ts,
  signOut: rs,
  initAuth: yi,
  user: $e
};
typeof window < "u" && (window.smoothr = window.smoothr || {}, window.smoothr.auth = Q);
function de(s, e = null) {
  if (typeof document > "u") return;
  let t = 0;
  const r = setInterval(() => {
    const n = document.querySelector(s), o = n == null ? void 0 : n.querySelector("iframe");
    o ? (o.style.width = "100%", o.style.minWidth = "100%", o.style.height = "100%", o.style.minHeight = "100%", o.style.boxSizing = "border-box", o.style.display = "block", o.style.opacity = "1", n && (n.style.width = "100%", n.style.minWidth = "100%", typeof window < "u" && window.getComputedStyle(n).position === "static" && (n.style.position = "relative"), ki(o, n, e)), console.log(`[Smoothr Stripe] Forced iframe styles for ${s}`), clearInterval(r)) : ++t >= 20 && clearInterval(r);
  }, 100);
}
function bi() {
  if (typeof document < "u" && typeof document.createElement == "function" && !document.querySelector("#smoothr-card-styles")) {
    const s = document.createElement("style");
    s.id = "smoothr-card-styles", s.textContent = `[data-smoothr-card-number],
[data-smoothr-card-expiry],
[data-smoothr-card-cvc]{display:block;position:relative;}
iframe[data-accept-id]{display:block!important;}`, document.head.appendChild(s);
  }
}
function Si() {
  const s = document.querySelector("[data-smoothr-email]") || document.querySelector("[data-smoothr-card-number]");
  let e = [];
  if (s) {
    const r = window.getComputedStyle(s).fontFamily.split(",")[0].trim().replace(/"/g, ""), n = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(r)}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    console.log("[Stripe] Loading Google Font:", n), e = [{ cssSrc: n }];
  }
  return e;
}
function at(s) {
  if (!s || typeof window > "u" || typeof window.getComputedStyle != "function") return {};
  const e = window.getComputedStyle(s), t = {
    base: {
      fontSize: e.fontSize,
      color: e.color,
      fontFamily: e.fontFamily,
      fontWeight: e.fontWeight,
      lineHeight: e.height
      // Set to container height to force full input height
    }
  }, r = document.querySelector("[data-smoothr-email]");
  if (r) {
    const n = window.getComputedStyle(r, "::placeholder");
    t.base["::placeholder"] = {
      color: n.color || "#aab7c4",
      // Fallback to Stripe default
      fontWeight: n.fontWeight || e.fontWeight
    };
  } else
    t.base["::placeholder"] = {
      color: "#aab7c4",
      // Default if no email input found
      fontWeight: e.fontWeight
    };
  return console.log("[Stripe] element style from container", t), t;
}
function ki(s, e, t) {
  var g;
  const r = document.querySelector("[data-smoothr-email]");
  if (!r || !e || typeof window.getComputedStyle != "function") return;
  let n = "", o = "", i = "", a = "", c = "", l = "";
  const u = document.activeElement, d = window.getComputedStyle(r);
  a = d.border, c = d.boxShadow, l = d.borderRadius;
  try {
    r.focus();
    const w = window.getComputedStyle(r);
    n = w.border, o = w.boxShadow, i = w.borderRadius;
  } catch {
  } finally {
    (g = u == null ? void 0 : u.focus) == null || g.call(u), u !== r && r.blur();
  }
  const h = () => {
    e.style.border = n || a || "1px solid transparent", e.style.boxShadow = o || c || "none", e.style.borderRadius = i || l || "";
  }, f = () => {
    e.style.border = a || "none", e.style.boxShadow = c || "none", e.style.borderRadius = l || "";
  };
  t && typeof t.on == "function" ? (t.on("focus", h), t.on("blur", f)) : (s.addEventListener("focus", h), s.addEventListener("blur", f));
}
async function Ei(s, e, t) {
  if (!s || !e) return null;
  try {
    if (e === "nmi" || t === "nmi") {
      const { data: i, error: a } = await O.from("public_store_integration_credentials").select("tokenization_key").eq("store_id", s).eq("gateway", t || e).maybeSingle();
      return a ? (console.warn("[Smoothr] Credential lookup failed:", a.message || a), null) : i ? { tokenization_key: i.tokenization_key } : null;
    }
    if (e === "stripe" || t === "stripe") {
      const { data: i, error: a } = await O.from("public_store_integration_credentials").select("publishable_key").eq("store_id", s).eq("gateway", "stripe").maybeSingle();
      return a ? (console.warn("[Smoothr] Credential lookup failed:", a.message || a), null) : i != null && i.publishable_key ? (console.log("[Smoothr] Loaded Stripe key from Supabase."), { publishable_key: i.publishable_key }) : (console.warn("[Smoothr] Stripe publishable key not found"), null);
    }
    let r = O.from("store_integrations").select("api_key, settings").eq("store_id", s);
    t ? r = r.or(
      `gateway.eq.${e},settings->>gateway.eq.${t}`
    ) : r = r.eq("gateway", e);
    const { data: n, error: o } = await r.maybeSingle();
    return o ? (console.warn("[Smoothr] Credential lookup failed:", o.message || o), null) : n;
  } catch (r) {
    return console.warn("[Smoothr] Credential fetch error:", (r == null ? void 0 : r.message) || r), null;
  }
}
let Ot = !1, tr = 0, pe, N, ct, lt, L, q;
var hr;
const ss = (hr = window.SMOOTHR_CONFIG) == null ? void 0 : hr.debug, W = (...s) => ss && console.log("[Smoothr Stripe]", ...s), se = (...s) => ss && console.warn("[Smoothr Stripe]", ...s);
bi();
async function ns(s, e = 1e3) {
  if (!(!s || typeof s.getBoundingClientRect != "function")) {
    W("Waiting for element to be visible", s);
    for (let t = 0; t < 10; t++) {
      if (s.getBoundingClientRect().width > 10) {
        W("Element visible", s);
        return;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    se("Element still invisible after timeout", s);
  }
}
async function Te(s, e = 1500) {
  if (!s || typeof s.getBoundingClientRect != "function") return;
  W("Waiting for mount target to be visible and clickable");
  const t = Math.ceil(e / 100);
  for (let r = 0; r < t; r++) {
    if (s.offsetParent !== null && s.getBoundingClientRect().width > 10 && document.activeElement !== s) {
      W("Target ready → mounting...");
      return;
    }
    await new Promise((n) => setTimeout(n, 100));
  }
  se("Mount target not interactable after 1.5s");
}
async function Oi() {
  var t;
  if (lt) return lt;
  const s = (t = window.SMOOTHR_CONFIG) == null ? void 0 : t.storeId;
  let e;
  if (s)
    try {
      const r = await Ei(s, "stripe", "stripe");
      r && (e = r.publishable_key || "", e && W("✅ Stripe key resolved, mounting gateway..."));
    } catch (r) {
      se("Integration fetch error:", (r == null ? void 0 : r.message) || r);
    }
  return e ? (lt = e, e) : (se("❌ Stripe key not found — aborting Stripe mount."), null);
}
async function Je() {
  return pe && N ? { stripe: pe, elements: N } : (ct || (ct = (async () => {
    const s = await Oi();
    if (!s) return { stripe: null, elements: null };
    W("Using Stripe key", s), pe = Stripe(s);
    const e = Si();
    return N = pe.elements({ fonts: e }), { stripe: pe, elements: N };
  })()), ct);
}
async function Rt() {
  if (q) return q;
  if (!Ot)
    return q = (async () => {
      W("Mounting split fields");
      const s = document.querySelector("[data-smoothr-card-number]"), e = document.querySelector("[data-smoothr-card-expiry]"), t = document.querySelector("[data-smoothr-card-cvc]");
      if (W("Targets found", {
        number: !!s,
        expiry: !!e,
        cvc: !!t
      }), !s && !e && !t) {
        tr < 5 ? (tr++, q = null, setTimeout(Rt, 200)) : (se("card fields not found"), q = null);
        return;
      }
      const { elements: r } = await Je();
      if (!r) {
        q = null;
        return;
      }
      Ot = !0;
      const n = r.getElement ? r.getElement("cardNumber") : null;
      if (s && !n) {
        await Te(s);
        const a = at(s);
        console.log("[Stripe] cardNumber style", a);
        const c = N.create("cardNumber", { style: a });
        c.mount("[data-smoothr-card-number]"), console.log("[Stripe] Mounted iframe"), setTimeout(() => {
          var d;
          const l = document.querySelector("[data-smoothr-card-number] iframe"), u = l == null ? void 0 : l.getBoundingClientRect().width;
          console.log("[Stripe] iframe bbox", u), l && u < 10 && (console.warn("[Stripe] iframe dead → remounting now..."), (d = L == null ? void 0 : L.unmount) == null || d.call(L), L = N.create("cardNumber", { style: a }), L.mount("[data-smoothr-card-number]"), de("[data-smoothr-card-number]", L));
        }, 500), de("[data-smoothr-card-number]", c), L = c;
      }
      const o = r.getElement ? r.getElement("cardExpiry") : null;
      if (e && !o) {
        await Te(e);
        const a = at(e);
        console.log("[Stripe] cardExpiry style", a);
        const c = N.create("cardExpiry", { style: a });
        c.mount("[data-smoothr-card-expiry]"), console.log("[Stripe] Mounted iframe"), setTimeout(() => {
          var d;
          const l = document.querySelector("[data-smoothr-card-expiry] iframe"), u = l == null ? void 0 : l.getBoundingClientRect().width;
          if (console.log("[Stripe] iframe bbox", u), l && u < 10) {
            console.warn("[Stripe] iframe dead → remounting now..."), (d = c == null ? void 0 : c.unmount) == null || d.call(c);
            const h = N.create("cardExpiry", { style: a });
            h.mount("[data-smoothr-card-expiry]"), de("[data-smoothr-card-expiry]", h);
          }
        }, 500), de("[data-smoothr-card-expiry]", c);
      }
      const i = r.getElement ? r.getElement("cardCvc") : null;
      if (t && !i) {
        await Te(t);
        const a = at(t);
        console.log("[Stripe] cardCvc style", a);
        const c = N.create("cardCvc", { style: a });
        c.mount("[data-smoothr-card-cvc]"), console.log("[Stripe] Mounted iframe"), setTimeout(() => {
          var d;
          const l = document.querySelector("[data-smoothr-card-cvc] iframe"), u = l == null ? void 0 : l.getBoundingClientRect().width;
          if (console.log("[Stripe] iframe bbox", u), l && u < 10) {
            console.warn("[Stripe] iframe dead → remounting now..."), (d = c == null ? void 0 : c.unmount) == null || d.call(c);
            const h = N.create("cardCvc", { style: a });
            h.mount("[data-smoothr-card-cvc]"), de("[data-smoothr-card-cvc]", h);
          }
        }, 500), de("[data-smoothr-card-cvc]", c);
      }
      W("Mounted split fields");
    })(), q = q.finally(() => {
      q = null;
    }), q;
}
function os() {
  return Ot;
}
function It() {
  return !!pe && !!L;
}
async function is(s) {
  if (!s) return null;
  try {
    const { data: e, error: t } = await O.from("public_store_settings").select("*").eq("store_id", s).maybeSingle();
    return t ? (se("Store settings lookup failed:", t.message || t), null) : e || null;
  } catch (e) {
    return se("Store settings fetch error:", (e == null ? void 0 : e.message) || e), null;
  }
}
async function as(s) {
  if (!It())
    return { error: { message: "Stripe not ready" } };
  const { stripe: e, elements: t } = await Je();
  if (!e || !t)
    return { error: { message: "Stripe not ready" } };
  const r = L || (typeof t.getElement == "function" ? t.getElement("cardNumber") : null), n = await e.createPaymentMethod({
    type: "card",
    card: r,
    billing_details: s
  });
  return {
    error: n.error || null,
    payment_method: n.paymentMethod || null
  };
}
const Ti = {
  mountCardFields: Rt,
  isMounted: os,
  ready: It,
  getStoreSettings: is,
  getElements: Je,
  createPaymentMethod: as,
  waitForVisible: ns,
  waitForInteractable: Te
}, cs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createPaymentMethod: as,
  default: Ti,
  getElements: Je,
  getStoreSettings: is,
  isMounted: os,
  mountCardFields: Rt,
  ready: It,
  waitForInteractable: Te,
  waitForVisible: ns
}, Symbol.toStringTag, { value: "Module" }));
var fr;
const la = typeof window < "u" && ((fr = window.SMOOTHR_CONFIG) == null ? void 0 : fr.debug);
function Ci() {
  var s;
  return typeof window < "u" && ((s = window.SMOOTHR_CONFIG) == null ? void 0 : s.liveRatesToken) || typeof process < "u" && process.env.LIVE_RATES_AUTH_TOKEN;
}
const Ai = "https://<your-project-id>.functions.supabase.co/proxy-live-rates?base=GBP&symbols=USD,EUR,GBP";
async function ji(s = "GBP", e = ["USD", "EUR", "GBP"], t) {
  if (typeof fetch > "u") return null;
  const r = "smoothrRatesCache";
  if (typeof window < "u")
    try {
      const n = JSON.parse(localStorage.getItem(r) || "null");
      if (n && n.base === s && Date.now() - n.timestamp < 864e5 && e.every((o) => n.rates[o]))
        return n.rates;
    } catch {
    }
  try {
    const n = t || Ai;
    let o = n;
    const i = [];
    /[?&]base=/.test(n) || i.push(`base=${encodeURIComponent(s)}`), /[?&]symbols=/.test(n) || i.push(`symbols=${e.join(",")}`), i.length && (o += (n.includes("?") ? "&" : "?") + i.join("&"));
    const a = {
      Accept: "application/json"
    };
    typeof window > "u" && (a["User-Agent"] = "SmoothrCurrencyBot/1.0");
    try {
      const { hostname: d, pathname: h } = new URL(o);
      if (d.endsWith(".functions.supabase.co") && h === "/proxy-live-rates") {
        const f = Ci();
        f && (a.Authorization = `Token ${f}`);
      }
    } catch {
    }
    const c = await fetch(o, {
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
let rr = !1, sr = !1, nr = !1;
var gr;
const K = (gr = window.SMOOTHR_CONFIG) == null ? void 0 : gr.debug, te = (...s) => K && console.log("[Smoothr Cart]", ...s), he = (...s) => K && console.warn("[Smoothr Cart]", ...s);
function Be() {
  var t, r;
  if (K && !rr && (te("🧩 initCartBindings loaded and executing"), rr = !0), typeof document > "u") return;
  const s = window.Smoothr || window.smoothr;
  if (!((t = s == null ? void 0 : s.cart) != null && t.addItem)) {
    he("cart module not found");
    return;
  }
  const e = document.querySelectorAll("[data-smoothr-add]");
  if (K && !nr && te(`found ${e.length} [data-smoothr-add] elements`), nr = !0, e.length === 0) {
    if ((((r = window.location) == null ? void 0 : r.pathname) || "").includes("/checkout")) {
      K && te("🧩 addToCart polling disabled on checkout page");
      return;
    }
    sr || (he("no buttons found; retrying..."), sr = !0), setTimeout(Be, 500);
    return;
  }
  e.forEach((n) => {
    K && te("🔗 binding [data-smoothr-add] button", n), !n.__smoothrBound && (n.__smoothrBound = !0, n.addEventListener("click", (o) => {
      var i, a, c;
      (i = o == null ? void 0 : o.preventDefault) == null || i.call(o), (a = o == null ? void 0 : o.stopPropagation) == null || a.call(o), K && te("🛒 Add to cart clicked:", n);
      try {
        const l = n.getAttribute("data-product-price") || "0", u = Math.round(parseFloat(l) * 100), d = n.getAttribute("data-product-id"), h = n.getAttribute("data-product-name"), f = n.getAttribute("data-product-options"), g = n.getAttribute("data-product-subscription") === "true";
        if (!d || !h || isNaN(u)) {
          he("Missing required cart attributes on:", n);
          return;
        }
        const w = n.closest("[data-smoothr-product]");
        let p = "", y = n;
        for (; y && !p; ) {
          const m = (c = y.querySelector) == null ? void 0 : c.call(y, "[data-smoothr-image]");
          m != null && m.src && (p = m.src), y = y.parentElement;
        }
        w || he(`No [data-smoothr-product] found for product "${d}"`), p || he(`No [data-smoothr-image] found for product "${d}"`);
        const S = {
          product_id: d,
          name: h,
          price: u,
          quantity: 1,
          options: f ? JSON.parse(f) : void 0,
          isSubscription: g,
          image: p
        };
        s.cart.addItem(S), typeof window.renderCart == "function" ? (K && te("🧼 Calling renderCart() to update UI"), window.renderCart()) : he("renderCart not found");
      } catch (l) {
        l("addToCart failed", l);
      }
    }));
  });
}
function Pi() {
  document.addEventListener("DOMContentLoaded", () => {
    te("✅ DOM ready – calling initCartBindings"), Be();
  });
}
typeof window < "u" && Pi();
function ut(s) {
  var e, t;
  return typeof window > "u" ? ((e = s == null ? void 0 : s.currency) == null ? void 0 : e.baseCurrency) || "USD" : localStorage.getItem("smoothr:currency") || ((t = s == null ? void 0 : s.currency) == null ? void 0 : t.baseCurrency) || "USD";
}
function $i() {
  typeof document > "u" || document.querySelectorAll("[data-smoothr-template]").forEach((s) => s.style.display = "none");
}
function Ce() {
  var o, i, a, c;
  const s = (o = window.SMOOTHR_CONFIG) == null ? void 0 : o.debug;
  if (s && console.log("🎨 renderCart() triggered"), typeof document > "u") return;
  setTimeout(() => $i(), 50);
  const e = window.Smoothr || window.smoothr;
  if (!(e != null && e.cart)) return;
  const t = e.cart.getCart(), r = e.cart.getTotal(), n = ((i = e.currency) == null ? void 0 : i.format) || ((a = e.currency) == null ? void 0 : a.formatPrice) || ((c = e.currency) == null ? void 0 : c.formatCurrency);
  document.querySelectorAll("[data-smoothr-total]").forEach((l) => {
    var f;
    const u = r / 100, d = ut(e);
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
        var S;
        const w = d.price / 100, p = ut(e);
        let y = w;
        (S = e.currency) != null && S.convertPrice && (y = e.currency.convertPrice(
          w,
          p,
          e.currency.baseCurrency
        )), g.dataset.smoothrBase = w, g.setAttribute("data-smoothr-price", y), n ? g.textContent = n(y, p) : g.textContent = String(y);
      }), h.querySelectorAll("[data-smoothr-subtotal]").forEach((g) => {
        var S;
        const w = d.price * d.quantity / 100, p = ut(e);
        let y = w;
        (S = e.currency) != null && S.convertPrice && (y = e.currency.convertPrice(
          w,
          p,
          e.currency.baseCurrency
        )), g.dataset.smoothrBase = w, g.setAttribute("data-smoothr-subtotal", y), g.textContent = n ? n(y, p) : String(y);
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
typeof window < "u" && (document.addEventListener("DOMContentLoaded", Ce), window.addEventListener("smoothr:cart:updated", Ce), window.renderCart = Ce);
const xi = '[data-smoothr-price], [data-smoothr-total], [data-smoothr="price"]';
function Ri(s) {
  return parseFloat(s.replace(/[£$€]/g, "").replace(/[\,\s]/g, ""));
}
function Ii(s, e) {
  if (s.hasAttribute("data-product-price"))
    return parseFloat(s.getAttribute("data-product-price"));
  let t = parseFloat(s.dataset.smoothrBase);
  return isNaN(t) && (t = parseFloat(s.getAttribute(e)) || Ri(s.textContent || ""), isNaN(t) || (s.dataset.smoothrBase = t)), t;
}
function Ui() {
  return typeof window > "u" ? R : localStorage.getItem("smoothr:currency") || R;
}
function Li(s) {
  typeof window > "u" || (localStorage.setItem("smoothr:currency", s), document.dispatchEvent(
    new CustomEvent("smoothr:currencychange", { detail: { currency: s } })
  ));
}
function or() {
  const s = Ui();
  document.querySelectorAll(xi).forEach((e) => {
    const t = e.hasAttribute("data-smoothr-total") ? "data-smoothr-total" : "data-smoothr-price", r = Ii(e, t);
    if (isNaN(r)) return;
    const n = qe(r, s, R);
    e.textContent = Ne(n, s), e.setAttribute(t, n);
  });
}
function Di() {
  typeof document > "u" || (or(), document.addEventListener("smoothr:currencychange", or));
}
typeof window < "u" && Di();
const qi = "[data-smoothr-price], [data-smoothr-total]";
function Ni(s) {
  return parseFloat(s.replace(/[£$€]/g, "").replace(/[\,\s]/g, ""));
}
function Bi(s, e) {
  let t = parseFloat(s.dataset.smoothrBase);
  return isNaN(t) && (t = parseFloat(s.getAttribute(e)) || Ni(s.textContent || ""), isNaN(t) || (s.dataset.smoothrBase = t)), t;
}
function Mi() {
  return typeof window > "u" ? R : localStorage.getItem("smoothr:currency") || R;
}
function ls(s) {
  typeof window > "u" || (localStorage.setItem("smoothr:currency", s), document.dispatchEvent(
    new CustomEvent("smoothr:currencychange", { detail: { currency: s } })
  ));
}
function ir() {
  const s = Mi();
  document.querySelectorAll(qi).forEach((e) => {
    const t = e.hasAttribute("data-smoothr-total") ? "data-smoothr-total" : "data-smoothr-price", r = Bi(e, t);
    if (isNaN(r)) return;
    const n = qe(r, s, R);
    e.textContent = Ne(n, s), e.setAttribute(t, n);
  });
}
function Fi(s = document) {
  s.querySelectorAll('[id^="currency-"]').forEach((e) => {
    const t = e.id.slice(9).toUpperCase();
    e.__smoothrCurrencyBound || (e.addEventListener("click", () => ls(t)), e.__smoothrCurrencyBound = !0);
  });
}
function Wi() {
  typeof document > "u" || (document.addEventListener("DOMContentLoaded", () => {
    ir(), Fi();
  }), document.addEventListener("smoothr:currencychange", ir));
}
typeof window < "u" && Wi();
async function zi(s) {
  const { data: e, error: t } = await O.from("public_store_settings").select("*").eq("store_id", s).single();
  if (t) throw t;
  window.SMOOTHR_CONFIG = {
    ...window.SMOOTHR_CONFIG || {},
    ...e || {}
  }, "api_base" in window.SMOOTHR_CONFIG && !window.SMOOTHR_CONFIG.apiBase && (window.SMOOTHR_CONFIG.apiBase = window.SMOOTHR_CONFIG.api_base), window.SMOOTHR_CONFIG.storeId = s;
}
const Gi = "https://<your-project-id>.functions.supabase.co/proxy-live-rates?base=GBP&symbols=USD,EUR,GBP", Hi = {
  abandonedCart: qo,
  affiliates: No,
  analytics: Bo,
  currency: Mo,
  dashboard: Fo,
  discounts: Wo,
  cart: $t,
  orders: si,
  returns: ni,
  reviews: oi,
  subscriptions: ii,
  auth: Q,
  checkout: cs
};
(async function() {
  var i, a;
  typeof globalThis.setSelectedCurrency != "function" && (globalThis.setSelectedCurrency = () => {
  });
  const e = document.currentScript || document.querySelector('script[src*="smoothr-sdk"][data-store-id]'), t = (i = e == null ? void 0 : e.dataset) == null ? void 0 : i.storeId;
  if (console.log("[Smoothr SDK] Bootstrap triggered", { storeId: t }), !t) throw new Error("Missing data-store-id on <script> tag");
  try {
    await zi(t);
  } catch (c) {
    if (!(typeof process < "u" && process.env.NODE_ENV === "test"))
      throw c;
  }
  const r = typeof window < "u" && ((a = window.SMOOTHR_CONFIG) == null ? void 0 : a.debug), n = (...c) => r && console.log("[Smoothr SDK]", ...c);
  n("Smoothr SDK loaded");
  let o = Li;
  if (typeof window < "u") {
    const c = window.SMOOTHR_CONFIG;
    if (typeof document < "u" && typeof document.createElement == "function" && !document.querySelector("#smoothr-card-styles")) {
      const h = document.createElement("style");
      h.id = "smoothr-card-styles", h.textContent = `[data-smoothr-card-number],
[data-smoothr-card-expiry],
[data-smoothr-card-cvc]{display:block;position:relative;}
iframe[data-accept-id]{display:block!important;}`, document.head.appendChild(h);
    }
    c.baseCurrency && Fr(c.baseCurrency), c.rates && _t(c.rates);
    const l = c.baseCurrency || R, u = c.rates ? Object.keys(c.rates) : Object.keys(V), d = c.rateSource || Gi;
    if (c.debug) {
      let h = d;
      /[?&]base=/.test(h) || (h += (h.includes("?") ? "&" : "?") + `base=${encodeURIComponent(l)}`), /[?&]symbols=/.test(h) || (h += (h.includes("?") ? "&" : "?") + `symbols=${u.join(",")}`), n("smoothr:live-rates-url", h);
    }
    ji(l, u, c.rateSource || d).then((h) => {
      h && (_t(h), c.debug && n("smoothr:live-rates", h));
    }).catch(() => {
    }), c.platform === "cms" && (o = ls), window.Smoothr = Hi, window.smoothr = window.smoothr || {}, window.smoothr.auth = Q, window.smoothr.supabase = O, window.smoothr.getSession = () => O.auth.getSession(), window.smoothr.getUser = () => O.auth.getUser(), window.renderCart = Ce, n("🎨 renderCart registered in SDK"), window.Smoothr.cart = { ...$t, ...window.Smoothr.cart || {} }, window.Smoothr.cart.renderCart = Ce, window.Smoothr.checkout = cs, window.initCartBindings = Be, document.addEventListener("DOMContentLoaded", () => {
      n("✅ DOM ready – calling initCartBindings"), Be();
    }), Q.initAuth().then(() => {
      var h, f, g;
      (g = (f = (h = window.smoothr) == null ? void 0 : h.auth) == null ? void 0 : f.user) != null && g.value && Kr();
    }), globalThis.setSelectedCurrency = globalThis.setSelectedCurrency || o;
  }
})();
export {
  qo as abandonedCart,
  No as affiliates,
  Bo as analytics,
  Q as auth,
  $t as cart,
  cs as checkout,
  Mo as currency,
  Fo as dashboard,
  Hi as default,
  Wo as discounts,
  si as orders,
  ni as returns,
  oi as reviews,
  ii as subscriptions
};
