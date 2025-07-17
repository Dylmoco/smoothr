var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/@supabase/node-fetch/browser.js
var browser_exports = {};
__export(browser_exports, {
  Headers: () => Headers2,
  Request: () => Request,
  Response: () => Response2,
  default: () => browser_default,
  fetch: () => fetch2
});
var getGlobal, globalObject, fetch2, browser_default, Headers2, Request, Response2;
var init_browser = __esm({
  "node_modules/@supabase/node-fetch/browser.js"() {
    "use strict";
    getGlobal = function() {
      if (typeof self !== "undefined") {
        return self;
      }
      if (typeof window !== "undefined") {
        return window;
      }
      if (typeof global !== "undefined") {
        return global;
      }
      throw new Error("unable to locate global object");
    };
    globalObject = getGlobal();
    fetch2 = globalObject.fetch;
    browser_default = globalObject.fetch.bind(globalObject);
    Headers2 = globalObject.Headers;
    Request = globalObject.Request;
    Response2 = globalObject.Response;
  }
});

// node_modules/@supabase/functions-js/dist/module/helper.js
var resolveFetch;
var init_helper = __esm({
  "node_modules/@supabase/functions-js/dist/module/helper.js"() {
    resolveFetch = (customFetch) => {
      let _fetch;
      if (customFetch) {
        _fetch = customFetch;
      } else if (typeof fetch === "undefined") {
        _fetch = (...args) => Promise.resolve().then(() => (init_browser(), browser_exports)).then(({ default: fetch3 }) => fetch3(...args));
      } else {
        _fetch = fetch;
      }
      return (...args) => _fetch(...args);
    };
  }
});

// node_modules/@supabase/functions-js/dist/module/types.js
var FunctionsError, FunctionsFetchError, FunctionsRelayError, FunctionsHttpError, FunctionRegion;
var init_types = __esm({
  "node_modules/@supabase/functions-js/dist/module/types.js"() {
    FunctionsError = class extends Error {
      constructor(message, name = "FunctionsError", context) {
        super(message);
        this.name = name;
        this.context = context;
      }
    };
    FunctionsFetchError = class extends FunctionsError {
      constructor(context) {
        super("Failed to send a request to the Edge Function", "FunctionsFetchError", context);
      }
    };
    FunctionsRelayError = class extends FunctionsError {
      constructor(context) {
        super("Relay Error invoking the Edge Function", "FunctionsRelayError", context);
      }
    };
    FunctionsHttpError = class extends FunctionsError {
      constructor(context) {
        super("Edge Function returned a non-2xx status code", "FunctionsHttpError", context);
      }
    };
    (function(FunctionRegion2) {
      FunctionRegion2["Any"] = "any";
      FunctionRegion2["ApNortheast1"] = "ap-northeast-1";
      FunctionRegion2["ApNortheast2"] = "ap-northeast-2";
      FunctionRegion2["ApSouth1"] = "ap-south-1";
      FunctionRegion2["ApSoutheast1"] = "ap-southeast-1";
      FunctionRegion2["ApSoutheast2"] = "ap-southeast-2";
      FunctionRegion2["CaCentral1"] = "ca-central-1";
      FunctionRegion2["EuCentral1"] = "eu-central-1";
      FunctionRegion2["EuWest1"] = "eu-west-1";
      FunctionRegion2["EuWest2"] = "eu-west-2";
      FunctionRegion2["EuWest3"] = "eu-west-3";
      FunctionRegion2["SaEast1"] = "sa-east-1";
      FunctionRegion2["UsEast1"] = "us-east-1";
      FunctionRegion2["UsWest1"] = "us-west-1";
      FunctionRegion2["UsWest2"] = "us-west-2";
    })(FunctionRegion || (FunctionRegion = {}));
  }
});

// node_modules/@supabase/functions-js/dist/module/FunctionsClient.js
var __awaiter, FunctionsClient;
var init_FunctionsClient = __esm({
  "node_modules/@supabase/functions-js/dist/module/FunctionsClient.js"() {
    init_helper();
    init_types();
    __awaiter = function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    FunctionsClient = class {
      constructor(url, { headers = {}, customFetch, region = FunctionRegion.Any } = {}) {
        this.url = url;
        this.headers = headers;
        this.region = region;
        this.fetch = resolveFetch(customFetch);
      }
      /**
       * Updates the authorization header
       * @param token - the new jwt token sent in the authorisation header
       */
      setAuth(token) {
        this.headers.Authorization = `Bearer ${token}`;
      }
      /**
       * Invokes a function
       * @param functionName - The name of the Function to invoke.
       * @param options - Options for invoking the Function.
       */
      invoke(functionName, options = {}) {
        var _a5;
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const { headers, method, body: functionArgs } = options;
            let _headers = {};
            let { region } = options;
            if (!region) {
              region = this.region;
            }
            if (region && region !== "any") {
              _headers["x-region"] = region;
            }
            let body;
            if (functionArgs && (headers && !Object.prototype.hasOwnProperty.call(headers, "Content-Type") || !headers)) {
              if (typeof Blob !== "undefined" && functionArgs instanceof Blob || functionArgs instanceof ArrayBuffer) {
                _headers["Content-Type"] = "application/octet-stream";
                body = functionArgs;
              } else if (typeof functionArgs === "string") {
                _headers["Content-Type"] = "text/plain";
                body = functionArgs;
              } else if (typeof FormData !== "undefined" && functionArgs instanceof FormData) {
                body = functionArgs;
              } else {
                _headers["Content-Type"] = "application/json";
                body = JSON.stringify(functionArgs);
              }
            }
            const response = yield this.fetch(`${this.url}/${functionName}`, {
              method: method || "POST",
              // headers priority is (high to low):
              // 1. invoke-level headers
              // 2. client-level headers
              // 3. default Content-Type header
              headers: Object.assign(Object.assign(Object.assign({}, _headers), this.headers), headers),
              body
            }).catch((fetchError) => {
              throw new FunctionsFetchError(fetchError);
            });
            const isRelayError = response.headers.get("x-relay-error");
            if (isRelayError && isRelayError === "true") {
              throw new FunctionsRelayError(response);
            }
            if (!response.ok) {
              throw new FunctionsHttpError(response);
            }
            let responseType = ((_a5 = response.headers.get("Content-Type")) !== null && _a5 !== void 0 ? _a5 : "text/plain").split(";")[0].trim();
            let data;
            if (responseType === "application/json") {
              data = yield response.json();
            } else if (responseType === "application/octet-stream") {
              data = yield response.blob();
            } else if (responseType === "text/event-stream") {
              data = response;
            } else if (responseType === "multipart/form-data") {
              data = yield response.formData();
            } else {
              data = yield response.text();
            }
            return { data, error: null };
          } catch (error) {
            return { data: null, error };
          }
        });
      }
    };
  }
});

// node_modules/@supabase/functions-js/dist/module/index.js
var init_module = __esm({
  "node_modules/@supabase/functions-js/dist/module/index.js"() {
    init_FunctionsClient();
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/PostgrestError.js
var require_PostgrestError = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestError2 = class extends Error {
      constructor(context) {
        super(context.message);
        this.name = "PostgrestError";
        this.details = context.details;
        this.hint = context.hint;
        this.code = context.code;
      }
    };
    exports.default = PostgrestError2;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/PostgrestBuilder.js
var require_PostgrestBuilder = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestBuilder.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_fetch_1 = __importDefault((init_browser(), __toCommonJS(browser_exports)));
    var PostgrestError_1 = __importDefault(require_PostgrestError());
    var PostgrestBuilder2 = class {
      constructor(builder) {
        this.shouldThrowOnError = false;
        this.method = builder.method;
        this.url = builder.url;
        this.headers = builder.headers;
        this.schema = builder.schema;
        this.body = builder.body;
        this.shouldThrowOnError = builder.shouldThrowOnError;
        this.signal = builder.signal;
        this.isMaybeSingle = builder.isMaybeSingle;
        if (builder.fetch) {
          this.fetch = builder.fetch;
        } else if (typeof fetch === "undefined") {
          this.fetch = node_fetch_1.default;
        } else {
          this.fetch = fetch;
        }
      }
      /**
       * If there's an error with the query, throwOnError will reject the promise by
       * throwing the error instead of returning it as part of a successful response.
       *
       * {@link https://github.com/supabase/supabase-js/issues/92}
       */
      throwOnError() {
        this.shouldThrowOnError = true;
        return this;
      }
      /**
       * Set an HTTP header for the request.
       */
      setHeader(name, value) {
        this.headers = Object.assign({}, this.headers);
        this.headers[name] = value;
        return this;
      }
      then(onfulfilled, onrejected) {
        if (this.schema === void 0) {
        } else if (["GET", "HEAD"].includes(this.method)) {
          this.headers["Accept-Profile"] = this.schema;
        } else {
          this.headers["Content-Profile"] = this.schema;
        }
        if (this.method !== "GET" && this.method !== "HEAD") {
          this.headers["Content-Type"] = "application/json";
        }
        const _fetch = this.fetch;
        let res = _fetch(this.url.toString(), {
          method: this.method,
          headers: this.headers,
          body: JSON.stringify(this.body),
          signal: this.signal
        }).then(async (res2) => {
          var _a5, _b, _c;
          let error = null;
          let data = null;
          let count = null;
          let status = res2.status;
          let statusText = res2.statusText;
          if (res2.ok) {
            if (this.method !== "HEAD") {
              const body = await res2.text();
              if (body === "") {
              } else if (this.headers["Accept"] === "text/csv") {
                data = body;
              } else if (this.headers["Accept"] && this.headers["Accept"].includes("application/vnd.pgrst.plan+text")) {
                data = body;
              } else {
                data = JSON.parse(body);
              }
            }
            const countHeader = (_a5 = this.headers["Prefer"]) === null || _a5 === void 0 ? void 0 : _a5.match(/count=(exact|planned|estimated)/);
            const contentRange = (_b = res2.headers.get("content-range")) === null || _b === void 0 ? void 0 : _b.split("/");
            if (countHeader && contentRange && contentRange.length > 1) {
              count = parseInt(contentRange[1]);
            }
            if (this.isMaybeSingle && this.method === "GET" && Array.isArray(data)) {
              if (data.length > 1) {
                error = {
                  // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
                  code: "PGRST116",
                  details: `Results contain ${data.length} rows, application/vnd.pgrst.object+json requires 1 row`,
                  hint: null,
                  message: "JSON object requested, multiple (or no) rows returned"
                };
                data = null;
                count = null;
                status = 406;
                statusText = "Not Acceptable";
              } else if (data.length === 1) {
                data = data[0];
              } else {
                data = null;
              }
            }
          } else {
            const body = await res2.text();
            try {
              error = JSON.parse(body);
              if (Array.isArray(error) && res2.status === 404) {
                data = [];
                error = null;
                status = 200;
                statusText = "OK";
              }
            } catch (_d) {
              if (res2.status === 404 && body === "") {
                status = 204;
                statusText = "No Content";
              } else {
                error = {
                  message: body
                };
              }
            }
            if (error && this.isMaybeSingle && ((_c = error === null || error === void 0 ? void 0 : error.details) === null || _c === void 0 ? void 0 : _c.includes("0 rows"))) {
              error = null;
              status = 200;
              statusText = "OK";
            }
            if (error && this.shouldThrowOnError) {
              throw new PostgrestError_1.default(error);
            }
          }
          const postgrestResponse = {
            error,
            data,
            count,
            status,
            statusText
          };
          return postgrestResponse;
        });
        if (!this.shouldThrowOnError) {
          res = res.catch((fetchError) => {
            var _a5, _b, _c;
            return {
              error: {
                message: `${(_a5 = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _a5 !== void 0 ? _a5 : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`,
                details: `${(_b = fetchError === null || fetchError === void 0 ? void 0 : fetchError.stack) !== null && _b !== void 0 ? _b : ""}`,
                hint: "",
                code: `${(_c = fetchError === null || fetchError === void 0 ? void 0 : fetchError.code) !== null && _c !== void 0 ? _c : ""}`
              },
              data: null,
              count: null,
              status: 0,
              statusText: ""
            };
          });
        }
        return res.then(onfulfilled, onrejected);
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
    exports.default = PostgrestBuilder2;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/PostgrestTransformBuilder.js
var require_PostgrestTransformBuilder = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestTransformBuilder.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestBuilder_1 = __importDefault(require_PostgrestBuilder());
    var PostgrestTransformBuilder2 = class extends PostgrestBuilder_1.default {
      /**
       * Perform a SELECT on the query result.
       *
       * By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not
       * return modified rows. By calling this method, modified rows are returned in
       * `data`.
       *
       * @param columns - The columns to retrieve, separated by commas
       */
      select(columns) {
        let quoted = false;
        const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
          if (/\s/.test(c) && !quoted) {
            return "";
          }
          if (c === '"') {
            quoted = !quoted;
          }
          return c;
        }).join("");
        this.url.searchParams.set("select", cleanedColumns);
        if (this.headers["Prefer"]) {
          this.headers["Prefer"] += ",";
        }
        this.headers["Prefer"] += "return=representation";
        return this;
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
      order(column, { ascending = true, nullsFirst, foreignTable, referencedTable = foreignTable } = {}) {
        const key = referencedTable ? `${referencedTable}.order` : "order";
        const existingOrder = this.url.searchParams.get(key);
        this.url.searchParams.set(key, `${existingOrder ? `${existingOrder},` : ""}${column}.${ascending ? "asc" : "desc"}${nullsFirst === void 0 ? "" : nullsFirst ? ".nullsfirst" : ".nullslast"}`);
        return this;
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
      limit(count, { foreignTable, referencedTable = foreignTable } = {}) {
        const key = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
        this.url.searchParams.set(key, `${count}`);
        return this;
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
      range(from, to, { foreignTable, referencedTable = foreignTable } = {}) {
        const keyOffset = typeof referencedTable === "undefined" ? "offset" : `${referencedTable}.offset`;
        const keyLimit = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
        this.url.searchParams.set(keyOffset, `${from}`);
        this.url.searchParams.set(keyLimit, `${to - from + 1}`);
        return this;
      }
      /**
       * Set the AbortSignal for the fetch request.
       *
       * @param signal - The AbortSignal to use for the fetch request
       */
      abortSignal(signal) {
        this.signal = signal;
        return this;
      }
      /**
       * Return `data` as a single object instead of an array of objects.
       *
       * Query result must be one row (e.g. using `.limit(1)`), otherwise this
       * returns an error.
       */
      single() {
        this.headers["Accept"] = "application/vnd.pgrst.object+json";
        return this;
      }
      /**
       * Return `data` as a single object instead of an array of objects.
       *
       * Query result must be zero or one row (e.g. using `.limit(1)`), otherwise
       * this returns an error.
       */
      maybeSingle() {
        if (this.method === "GET") {
          this.headers["Accept"] = "application/json";
        } else {
          this.headers["Accept"] = "application/vnd.pgrst.object+json";
        }
        this.isMaybeSingle = true;
        return this;
      }
      /**
       * Return `data` as a string in CSV format.
       */
      csv() {
        this.headers["Accept"] = "text/csv";
        return this;
      }
      /**
       * Return `data` as an object in [GeoJSON](https://geojson.org) format.
       */
      geojson() {
        this.headers["Accept"] = "application/geo+json";
        return this;
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
      explain({ analyze = false, verbose = false, settings = false, buffers = false, wal = false, format = "text" } = {}) {
        var _a5;
        const options = [
          analyze ? "analyze" : null,
          verbose ? "verbose" : null,
          settings ? "settings" : null,
          buffers ? "buffers" : null,
          wal ? "wal" : null
        ].filter(Boolean).join("|");
        const forMediatype = (_a5 = this.headers["Accept"]) !== null && _a5 !== void 0 ? _a5 : "application/json";
        this.headers["Accept"] = `application/vnd.pgrst.plan+${format}; for="${forMediatype}"; options=${options};`;
        if (format === "json")
          return this;
        else
          return this;
      }
      /**
       * Rollback the query.
       *
       * `data` will still be returned, but the query is not committed.
       */
      rollback() {
        var _a5;
        if (((_a5 = this.headers["Prefer"]) !== null && _a5 !== void 0 ? _a5 : "").trim().length > 0) {
          this.headers["Prefer"] += ",tx=rollback";
        } else {
          this.headers["Prefer"] = "tx=rollback";
        }
        return this;
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
    exports.default = PostgrestTransformBuilder2;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/PostgrestFilterBuilder.js
var require_PostgrestFilterBuilder = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestFilterBuilder.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestTransformBuilder_1 = __importDefault(require_PostgrestTransformBuilder());
    var PostgrestFilterBuilder2 = class extends PostgrestTransformBuilder_1.default {
      /**
       * Match only rows where `column` is equal to `value`.
       *
       * To check if the value of `column` is NULL, you should use `.is()` instead.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      eq(column, value) {
        this.url.searchParams.append(column, `eq.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` is not equal to `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      neq(column, value) {
        this.url.searchParams.append(column, `neq.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` is greater than `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      gt(column, value) {
        this.url.searchParams.append(column, `gt.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` is greater than or equal to `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      gte(column, value) {
        this.url.searchParams.append(column, `gte.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` is less than `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      lt(column, value) {
        this.url.searchParams.append(column, `lt.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` is less than or equal to `value`.
       *
       * @param column - The column to filter on
       * @param value - The value to filter with
       */
      lte(column, value) {
        this.url.searchParams.append(column, `lte.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` matches `pattern` case-sensitively.
       *
       * @param column - The column to filter on
       * @param pattern - The pattern to match with
       */
      like(column, pattern) {
        this.url.searchParams.append(column, `like.${pattern}`);
        return this;
      }
      /**
       * Match only rows where `column` matches all of `patterns` case-sensitively.
       *
       * @param column - The column to filter on
       * @param patterns - The patterns to match with
       */
      likeAllOf(column, patterns) {
        this.url.searchParams.append(column, `like(all).{${patterns.join(",")}}`);
        return this;
      }
      /**
       * Match only rows where `column` matches any of `patterns` case-sensitively.
       *
       * @param column - The column to filter on
       * @param patterns - The patterns to match with
       */
      likeAnyOf(column, patterns) {
        this.url.searchParams.append(column, `like(any).{${patterns.join(",")}}`);
        return this;
      }
      /**
       * Match only rows where `column` matches `pattern` case-insensitively.
       *
       * @param column - The column to filter on
       * @param pattern - The pattern to match with
       */
      ilike(column, pattern) {
        this.url.searchParams.append(column, `ilike.${pattern}`);
        return this;
      }
      /**
       * Match only rows where `column` matches all of `patterns` case-insensitively.
       *
       * @param column - The column to filter on
       * @param patterns - The patterns to match with
       */
      ilikeAllOf(column, patterns) {
        this.url.searchParams.append(column, `ilike(all).{${patterns.join(",")}}`);
        return this;
      }
      /**
       * Match only rows where `column` matches any of `patterns` case-insensitively.
       *
       * @param column - The column to filter on
       * @param patterns - The patterns to match with
       */
      ilikeAnyOf(column, patterns) {
        this.url.searchParams.append(column, `ilike(any).{${patterns.join(",")}}`);
        return this;
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
      is(column, value) {
        this.url.searchParams.append(column, `is.${value}`);
        return this;
      }
      /**
       * Match only rows where `column` is included in the `values` array.
       *
       * @param column - The column to filter on
       * @param values - The values array to filter with
       */
      in(column, values) {
        const cleanedValues = Array.from(new Set(values)).map((s) => {
          if (typeof s === "string" && new RegExp("[,()]").test(s))
            return `"${s}"`;
          else
            return `${s}`;
        }).join(",");
        this.url.searchParams.append(column, `in.(${cleanedValues})`);
        return this;
      }
      /**
       * Only relevant for jsonb, array, and range columns. Match only rows where
       * `column` contains every element appearing in `value`.
       *
       * @param column - The jsonb, array, or range column to filter on
       * @param value - The jsonb, array, or range value to filter with
       */
      contains(column, value) {
        if (typeof value === "string") {
          this.url.searchParams.append(column, `cs.${value}`);
        } else if (Array.isArray(value)) {
          this.url.searchParams.append(column, `cs.{${value.join(",")}}`);
        } else {
          this.url.searchParams.append(column, `cs.${JSON.stringify(value)}`);
        }
        return this;
      }
      /**
       * Only relevant for jsonb, array, and range columns. Match only rows where
       * every element appearing in `column` is contained by `value`.
       *
       * @param column - The jsonb, array, or range column to filter on
       * @param value - The jsonb, array, or range value to filter with
       */
      containedBy(column, value) {
        if (typeof value === "string") {
          this.url.searchParams.append(column, `cd.${value}`);
        } else if (Array.isArray(value)) {
          this.url.searchParams.append(column, `cd.{${value.join(",")}}`);
        } else {
          this.url.searchParams.append(column, `cd.${JSON.stringify(value)}`);
        }
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where every element in
       * `column` is greater than any element in `range`.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeGt(column, range) {
        this.url.searchParams.append(column, `sr.${range}`);
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where every element in
       * `column` is either contained in `range` or greater than any element in
       * `range`.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeGte(column, range) {
        this.url.searchParams.append(column, `nxl.${range}`);
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where every element in
       * `column` is less than any element in `range`.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeLt(column, range) {
        this.url.searchParams.append(column, `sl.${range}`);
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where every element in
       * `column` is either contained in `range` or less than any element in
       * `range`.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeLte(column, range) {
        this.url.searchParams.append(column, `nxr.${range}`);
        return this;
      }
      /**
       * Only relevant for range columns. Match only rows where `column` is
       * mutually exclusive to `range` and there can be no element between the two
       * ranges.
       *
       * @param column - The range column to filter on
       * @param range - The range to filter with
       */
      rangeAdjacent(column, range) {
        this.url.searchParams.append(column, `adj.${range}`);
        return this;
      }
      /**
       * Only relevant for array and range columns. Match only rows where
       * `column` and `value` have an element in common.
       *
       * @param column - The array or range column to filter on
       * @param value - The array or range value to filter with
       */
      overlaps(column, value) {
        if (typeof value === "string") {
          this.url.searchParams.append(column, `ov.${value}`);
        } else {
          this.url.searchParams.append(column, `ov.{${value.join(",")}}`);
        }
        return this;
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
      textSearch(column, query, { config, type } = {}) {
        let typePart = "";
        if (type === "plain") {
          typePart = "pl";
        } else if (type === "phrase") {
          typePart = "ph";
        } else if (type === "websearch") {
          typePart = "w";
        }
        const configPart = config === void 0 ? "" : `(${config})`;
        this.url.searchParams.append(column, `${typePart}fts${configPart}.${query}`);
        return this;
      }
      /**
       * Match only rows where each column in `query` keys is equal to its
       * associated value. Shorthand for multiple `.eq()`s.
       *
       * @param query - The object to filter with, with column names as keys mapped
       * to their filter values
       */
      match(query) {
        Object.entries(query).forEach(([column, value]) => {
          this.url.searchParams.append(column, `eq.${value}`);
        });
        return this;
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
      not(column, operator, value) {
        this.url.searchParams.append(column, `not.${operator}.${value}`);
        return this;
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
      or(filters, { foreignTable, referencedTable = foreignTable } = {}) {
        const key = referencedTable ? `${referencedTable}.or` : "or";
        this.url.searchParams.append(key, `(${filters})`);
        return this;
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
      filter(column, operator, value) {
        this.url.searchParams.append(column, `${operator}.${value}`);
        return this;
      }
    };
    exports.default = PostgrestFilterBuilder2;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/PostgrestQueryBuilder.js
var require_PostgrestQueryBuilder = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestQueryBuilder.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestFilterBuilder_1 = __importDefault(require_PostgrestFilterBuilder());
    var PostgrestQueryBuilder2 = class {
      constructor(url, { headers = {}, schema, fetch: fetch3 }) {
        this.url = url;
        this.headers = headers;
        this.schema = schema;
        this.fetch = fetch3;
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
      select(columns, { head: head2 = false, count } = {}) {
        const method = head2 ? "HEAD" : "GET";
        let quoted = false;
        const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
          if (/\s/.test(c) && !quoted) {
            return "";
          }
          if (c === '"') {
            quoted = !quoted;
          }
          return c;
        }).join("");
        this.url.searchParams.set("select", cleanedColumns);
        if (count) {
          this.headers["Prefer"] = `count=${count}`;
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          fetch: this.fetch,
          allowEmpty: false
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
      insert(values, { count, defaultToNull = true } = {}) {
        const method = "POST";
        const prefersHeaders = [];
        if (this.headers["Prefer"]) {
          prefersHeaders.push(this.headers["Prefer"]);
        }
        if (count) {
          prefersHeaders.push(`count=${count}`);
        }
        if (!defaultToNull) {
          prefersHeaders.push("missing=default");
        }
        this.headers["Prefer"] = prefersHeaders.join(",");
        if (Array.isArray(values)) {
          const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
          if (columns.length > 0) {
            const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
            this.url.searchParams.set("columns", uniqueColumns.join(","));
          }
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          body: values,
          fetch: this.fetch,
          allowEmpty: false
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
      upsert(values, { onConflict, ignoreDuplicates = false, count, defaultToNull = true } = {}) {
        const method = "POST";
        const prefersHeaders = [`resolution=${ignoreDuplicates ? "ignore" : "merge"}-duplicates`];
        if (onConflict !== void 0)
          this.url.searchParams.set("on_conflict", onConflict);
        if (this.headers["Prefer"]) {
          prefersHeaders.push(this.headers["Prefer"]);
        }
        if (count) {
          prefersHeaders.push(`count=${count}`);
        }
        if (!defaultToNull) {
          prefersHeaders.push("missing=default");
        }
        this.headers["Prefer"] = prefersHeaders.join(",");
        if (Array.isArray(values)) {
          const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
          if (columns.length > 0) {
            const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
            this.url.searchParams.set("columns", uniqueColumns.join(","));
          }
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          body: values,
          fetch: this.fetch,
          allowEmpty: false
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
      update(values, { count } = {}) {
        const method = "PATCH";
        const prefersHeaders = [];
        if (this.headers["Prefer"]) {
          prefersHeaders.push(this.headers["Prefer"]);
        }
        if (count) {
          prefersHeaders.push(`count=${count}`);
        }
        this.headers["Prefer"] = prefersHeaders.join(",");
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          body: values,
          fetch: this.fetch,
          allowEmpty: false
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
      delete({ count } = {}) {
        const method = "DELETE";
        const prefersHeaders = [];
        if (count) {
          prefersHeaders.push(`count=${count}`);
        }
        if (this.headers["Prefer"]) {
          prefersHeaders.unshift(this.headers["Prefer"]);
        }
        this.headers["Prefer"] = prefersHeaders.join(",");
        return new PostgrestFilterBuilder_1.default({
          method,
          url: this.url,
          headers: this.headers,
          schema: this.schema,
          fetch: this.fetch,
          allowEmpty: false
        });
      }
    };
    exports.default = PostgrestQueryBuilder2;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/version.js
var require_version = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/version.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.version = void 0;
    exports.version = "0.0.0-automated";
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/constants.js
var require_constants = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_HEADERS = void 0;
    var version_1 = require_version();
    exports.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${version_1.version}` };
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/PostgrestClient.js
var require_PostgrestClient = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/PostgrestClient.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestQueryBuilder_1 = __importDefault(require_PostgrestQueryBuilder());
    var PostgrestFilterBuilder_1 = __importDefault(require_PostgrestFilterBuilder());
    var constants_1 = require_constants();
    var PostgrestClient2 = class _PostgrestClient {
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
      constructor(url, { headers = {}, schema, fetch: fetch3 } = {}) {
        this.url = url;
        this.headers = Object.assign(Object.assign({}, constants_1.DEFAULT_HEADERS), headers);
        this.schemaName = schema;
        this.fetch = fetch3;
      }
      /**
       * Perform a query on a table or a view.
       *
       * @param relation - The table or view name to query
       */
      from(relation) {
        const url = new URL(`${this.url}/${relation}`);
        return new PostgrestQueryBuilder_1.default(url, {
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
      schema(schema) {
        return new _PostgrestClient(this.url, {
          headers: this.headers,
          schema,
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
      rpc(fn, args = {}, { head: head2 = false, get: get2 = false, count } = {}) {
        let method;
        const url = new URL(`${this.url}/rpc/${fn}`);
        let body;
        if (head2 || get2) {
          method = head2 ? "HEAD" : "GET";
          Object.entries(args).filter(([_, value]) => value !== void 0).map(([name, value]) => [name, Array.isArray(value) ? `{${value.join(",")}}` : `${value}`]).forEach(([name, value]) => {
            url.searchParams.append(name, value);
          });
        } else {
          method = "POST";
          body = args;
        }
        const headers = Object.assign({}, this.headers);
        if (count) {
          headers["Prefer"] = `count=${count}`;
        }
        return new PostgrestFilterBuilder_1.default({
          method,
          url,
          headers,
          schema: this.schemaName,
          body,
          fetch: this.fetch,
          allowEmpty: false
        });
      }
    };
    exports.default = PostgrestClient2;
  }
});

// node_modules/@supabase/postgrest-js/dist/cjs/index.js
var require_cjs = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/cjs/index.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PostgrestError = exports.PostgrestBuilder = exports.PostgrestTransformBuilder = exports.PostgrestFilterBuilder = exports.PostgrestQueryBuilder = exports.PostgrestClient = void 0;
    var PostgrestClient_1 = __importDefault(require_PostgrestClient());
    exports.PostgrestClient = PostgrestClient_1.default;
    var PostgrestQueryBuilder_1 = __importDefault(require_PostgrestQueryBuilder());
    exports.PostgrestQueryBuilder = PostgrestQueryBuilder_1.default;
    var PostgrestFilterBuilder_1 = __importDefault(require_PostgrestFilterBuilder());
    exports.PostgrestFilterBuilder = PostgrestFilterBuilder_1.default;
    var PostgrestTransformBuilder_1 = __importDefault(require_PostgrestTransformBuilder());
    exports.PostgrestTransformBuilder = PostgrestTransformBuilder_1.default;
    var PostgrestBuilder_1 = __importDefault(require_PostgrestBuilder());
    exports.PostgrestBuilder = PostgrestBuilder_1.default;
    var PostgrestError_1 = __importDefault(require_PostgrestError());
    exports.PostgrestError = PostgrestError_1.default;
    exports.default = {
      PostgrestClient: PostgrestClient_1.default,
      PostgrestQueryBuilder: PostgrestQueryBuilder_1.default,
      PostgrestFilterBuilder: PostgrestFilterBuilder_1.default,
      PostgrestTransformBuilder: PostgrestTransformBuilder_1.default,
      PostgrestBuilder: PostgrestBuilder_1.default,
      PostgrestError: PostgrestError_1.default
    };
  }
});

// node_modules/@supabase/postgrest-js/dist/esm/wrapper.mjs
var import_cjs, PostgrestClient, PostgrestQueryBuilder, PostgrestFilterBuilder, PostgrestTransformBuilder, PostgrestBuilder, PostgrestError;
var init_wrapper = __esm({
  "node_modules/@supabase/postgrest-js/dist/esm/wrapper.mjs"() {
    import_cjs = __toESM(require_cjs(), 1);
    ({
      PostgrestClient,
      PostgrestQueryBuilder,
      PostgrestFilterBuilder,
      PostgrestTransformBuilder,
      PostgrestBuilder,
      PostgrestError
    } = import_cjs.default);
  }
});

// node_modules/ws/browser.js
var require_browser = __commonJS({
  "node_modules/ws/browser.js"(exports, module) {
    "use strict";
    module.exports = function() {
      throw new Error(
        "ws does not work in the browser. Browser clients must use the native WebSocket object"
      );
    };
  }
});

// node_modules/@supabase/realtime-js/dist/module/WebSocket.js
var WebSocketImpl, WebSocket_default;
var init_WebSocket = __esm({
  "node_modules/@supabase/realtime-js/dist/module/WebSocket.js"() {
    if (typeof window === "undefined") {
      WebSocketImpl = require_browser();
    } else {
      WebSocketImpl = window.WebSocket;
    }
    WebSocket_default = WebSocketImpl;
  }
});

// node_modules/@supabase/realtime-js/dist/module/lib/version.js
var version;
var init_version = __esm({
  "node_modules/@supabase/realtime-js/dist/module/lib/version.js"() {
    version = "2.11.10";
  }
});

// node_modules/@supabase/realtime-js/dist/module/lib/constants.js
var DEFAULT_HEADERS, VSN, DEFAULT_TIMEOUT, WS_CLOSE_NORMAL, SOCKET_STATES, CHANNEL_STATES, CHANNEL_EVENTS, TRANSPORTS, CONNECTION_STATE;
var init_constants = __esm({
  "node_modules/@supabase/realtime-js/dist/module/lib/constants.js"() {
    init_version();
    DEFAULT_HEADERS = { "X-Client-Info": `realtime-js/${version}` };
    VSN = "1.0.0";
    DEFAULT_TIMEOUT = 1e4;
    WS_CLOSE_NORMAL = 1e3;
    (function(SOCKET_STATES2) {
      SOCKET_STATES2[SOCKET_STATES2["connecting"] = 0] = "connecting";
      SOCKET_STATES2[SOCKET_STATES2["open"] = 1] = "open";
      SOCKET_STATES2[SOCKET_STATES2["closing"] = 2] = "closing";
      SOCKET_STATES2[SOCKET_STATES2["closed"] = 3] = "closed";
    })(SOCKET_STATES || (SOCKET_STATES = {}));
    (function(CHANNEL_STATES2) {
      CHANNEL_STATES2["closed"] = "closed";
      CHANNEL_STATES2["errored"] = "errored";
      CHANNEL_STATES2["joined"] = "joined";
      CHANNEL_STATES2["joining"] = "joining";
      CHANNEL_STATES2["leaving"] = "leaving";
    })(CHANNEL_STATES || (CHANNEL_STATES = {}));
    (function(CHANNEL_EVENTS2) {
      CHANNEL_EVENTS2["close"] = "phx_close";
      CHANNEL_EVENTS2["error"] = "phx_error";
      CHANNEL_EVENTS2["join"] = "phx_join";
      CHANNEL_EVENTS2["reply"] = "phx_reply";
      CHANNEL_EVENTS2["leave"] = "phx_leave";
      CHANNEL_EVENTS2["access_token"] = "access_token";
    })(CHANNEL_EVENTS || (CHANNEL_EVENTS = {}));
    (function(TRANSPORTS2) {
      TRANSPORTS2["websocket"] = "websocket";
    })(TRANSPORTS || (TRANSPORTS = {}));
    (function(CONNECTION_STATE2) {
      CONNECTION_STATE2["Connecting"] = "connecting";
      CONNECTION_STATE2["Open"] = "open";
      CONNECTION_STATE2["Closing"] = "closing";
      CONNECTION_STATE2["Closed"] = "closed";
    })(CONNECTION_STATE || (CONNECTION_STATE = {}));
  }
});

// node_modules/@supabase/realtime-js/dist/module/lib/serializer.js
var Serializer;
var init_serializer = __esm({
  "node_modules/@supabase/realtime-js/dist/module/lib/serializer.js"() {
    Serializer = class {
      constructor() {
        this.HEADER_LENGTH = 1;
      }
      decode(rawPayload, callback) {
        if (rawPayload.constructor === ArrayBuffer) {
          return callback(this._binaryDecode(rawPayload));
        }
        if (typeof rawPayload === "string") {
          return callback(JSON.parse(rawPayload));
        }
        return callback({});
      }
      _binaryDecode(buffer) {
        const view = new DataView(buffer);
        const decoder = new TextDecoder();
        return this._decodeBroadcast(buffer, view, decoder);
      }
      _decodeBroadcast(buffer, view, decoder) {
        const topicSize = view.getUint8(1);
        const eventSize = view.getUint8(2);
        let offset = this.HEADER_LENGTH + 2;
        const topic = decoder.decode(buffer.slice(offset, offset + topicSize));
        offset = offset + topicSize;
        const event = decoder.decode(buffer.slice(offset, offset + eventSize));
        offset = offset + eventSize;
        const data = JSON.parse(decoder.decode(buffer.slice(offset, buffer.byteLength)));
        return { ref: null, topic, event, payload: data };
      }
    };
  }
});

// node_modules/@supabase/realtime-js/dist/module/lib/timer.js
var Timer;
var init_timer = __esm({
  "node_modules/@supabase/realtime-js/dist/module/lib/timer.js"() {
    Timer = class {
      constructor(callback, timerCalc) {
        this.callback = callback;
        this.timerCalc = timerCalc;
        this.timer = void 0;
        this.tries = 0;
        this.callback = callback;
        this.timerCalc = timerCalc;
      }
      reset() {
        this.tries = 0;
        clearTimeout(this.timer);
      }
      // Cancels any previous scheduleTimeout and schedules callback
      scheduleTimeout() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.tries = this.tries + 1;
          this.callback();
        }, this.timerCalc(this.tries + 1));
      }
    };
  }
});

// node_modules/@supabase/realtime-js/dist/module/lib/transformers.js
var PostgresTypes, convertChangeData, convertColumn, convertCell, noop, toBoolean, toNumber, toJson, toArray, toTimestampString, httpEndpointURL;
var init_transformers = __esm({
  "node_modules/@supabase/realtime-js/dist/module/lib/transformers.js"() {
    (function(PostgresTypes2) {
      PostgresTypes2["abstime"] = "abstime";
      PostgresTypes2["bool"] = "bool";
      PostgresTypes2["date"] = "date";
      PostgresTypes2["daterange"] = "daterange";
      PostgresTypes2["float4"] = "float4";
      PostgresTypes2["float8"] = "float8";
      PostgresTypes2["int2"] = "int2";
      PostgresTypes2["int4"] = "int4";
      PostgresTypes2["int4range"] = "int4range";
      PostgresTypes2["int8"] = "int8";
      PostgresTypes2["int8range"] = "int8range";
      PostgresTypes2["json"] = "json";
      PostgresTypes2["jsonb"] = "jsonb";
      PostgresTypes2["money"] = "money";
      PostgresTypes2["numeric"] = "numeric";
      PostgresTypes2["oid"] = "oid";
      PostgresTypes2["reltime"] = "reltime";
      PostgresTypes2["text"] = "text";
      PostgresTypes2["time"] = "time";
      PostgresTypes2["timestamp"] = "timestamp";
      PostgresTypes2["timestamptz"] = "timestamptz";
      PostgresTypes2["timetz"] = "timetz";
      PostgresTypes2["tsrange"] = "tsrange";
      PostgresTypes2["tstzrange"] = "tstzrange";
    })(PostgresTypes || (PostgresTypes = {}));
    convertChangeData = (columns, record, options = {}) => {
      var _a5;
      const skipTypes = (_a5 = options.skipTypes) !== null && _a5 !== void 0 ? _a5 : [];
      return Object.keys(record).reduce((acc, rec_key) => {
        acc[rec_key] = convertColumn(rec_key, columns, record, skipTypes);
        return acc;
      }, {});
    };
    convertColumn = (columnName, columns, record, skipTypes) => {
      const column = columns.find((x) => x.name === columnName);
      const colType = column === null || column === void 0 ? void 0 : column.type;
      const value = record[columnName];
      if (colType && !skipTypes.includes(colType)) {
        return convertCell(colType, value);
      }
      return noop(value);
    };
    convertCell = (type, value) => {
      if (type.charAt(0) === "_") {
        const dataType = type.slice(1, type.length);
        return toArray(value, dataType);
      }
      switch (type) {
        case PostgresTypes.bool:
          return toBoolean(value);
        case PostgresTypes.float4:
        case PostgresTypes.float8:
        case PostgresTypes.int2:
        case PostgresTypes.int4:
        case PostgresTypes.int8:
        case PostgresTypes.numeric:
        case PostgresTypes.oid:
          return toNumber(value);
        case PostgresTypes.json:
        case PostgresTypes.jsonb:
          return toJson(value);
        case PostgresTypes.timestamp:
          return toTimestampString(value);
        case PostgresTypes.abstime:
        case PostgresTypes.date:
        case PostgresTypes.daterange:
        case PostgresTypes.int4range:
        case PostgresTypes.int8range:
        case PostgresTypes.money:
        case PostgresTypes.reltime:
        case PostgresTypes.text:
        case PostgresTypes.time:
        case PostgresTypes.timestamptz:
        case PostgresTypes.timetz:
        case PostgresTypes.tsrange:
        case PostgresTypes.tstzrange:
          return noop(value);
        default:
          return noop(value);
      }
    };
    noop = (value) => {
      return value;
    };
    toBoolean = (value) => {
      switch (value) {
        case "t":
          return true;
        case "f":
          return false;
        default:
          return value;
      }
    };
    toNumber = (value) => {
      if (typeof value === "string") {
        const parsedValue = parseFloat(value);
        if (!Number.isNaN(parsedValue)) {
          return parsedValue;
        }
      }
      return value;
    };
    toJson = (value) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch (error) {
          console.log(`JSON parse error: ${error}`);
          return value;
        }
      }
      return value;
    };
    toArray = (value, type) => {
      if (typeof value !== "string") {
        return value;
      }
      const lastIdx = value.length - 1;
      const closeBrace = value[lastIdx];
      const openBrace = value[0];
      if (openBrace === "{" && closeBrace === "}") {
        let arr;
        const valTrim = value.slice(1, lastIdx);
        try {
          arr = JSON.parse("[" + valTrim + "]");
        } catch (_) {
          arr = valTrim ? valTrim.split(",") : [];
        }
        return arr.map((val) => convertCell(type, val));
      }
      return value;
    };
    toTimestampString = (value) => {
      if (typeof value === "string") {
        return value.replace(" ", "T");
      }
      return value;
    };
    httpEndpointURL = (socketUrl) => {
      let url = socketUrl;
      url = url.replace(/^ws/i, "http");
      url = url.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, "");
      return url.replace(/\/+$/, "");
    };
  }
});

// node_modules/@supabase/realtime-js/dist/module/lib/push.js
var Push;
var init_push = __esm({
  "node_modules/@supabase/realtime-js/dist/module/lib/push.js"() {
    init_constants();
    Push = class {
      /**
       * Initializes the Push
       *
       * @param channel The Channel
       * @param event The event, for example `"phx_join"`
       * @param payload The payload, for example `{user_id: 123}`
       * @param timeout The push timeout in milliseconds
       */
      constructor(channel, event, payload = {}, timeout = DEFAULT_TIMEOUT) {
        this.channel = channel;
        this.event = event;
        this.payload = payload;
        this.timeout = timeout;
        this.sent = false;
        this.timeoutTimer = void 0;
        this.ref = "";
        this.receivedResp = null;
        this.recHooks = [];
        this.refEvent = null;
      }
      resend(timeout) {
        this.timeout = timeout;
        this._cancelRefEvent();
        this.ref = "";
        this.refEvent = null;
        this.receivedResp = null;
        this.sent = false;
        this.send();
      }
      send() {
        if (this._hasReceived("timeout")) {
          return;
        }
        this.startTimeout();
        this.sent = true;
        this.channel.socket.push({
          topic: this.channel.topic,
          event: this.event,
          payload: this.payload,
          ref: this.ref,
          join_ref: this.channel._joinRef()
        });
      }
      updatePayload(payload) {
        this.payload = Object.assign(Object.assign({}, this.payload), payload);
      }
      receive(status, callback) {
        var _a5;
        if (this._hasReceived(status)) {
          callback((_a5 = this.receivedResp) === null || _a5 === void 0 ? void 0 : _a5.response);
        }
        this.recHooks.push({ status, callback });
        return this;
      }
      startTimeout() {
        if (this.timeoutTimer) {
          return;
        }
        this.ref = this.channel.socket._makeRef();
        this.refEvent = this.channel._replyEventName(this.ref);
        const callback = (payload) => {
          this._cancelRefEvent();
          this._cancelTimeout();
          this.receivedResp = payload;
          this._matchReceive(payload);
        };
        this.channel._on(this.refEvent, {}, callback);
        this.timeoutTimer = setTimeout(() => {
          this.trigger("timeout", {});
        }, this.timeout);
      }
      trigger(status, response) {
        if (this.refEvent)
          this.channel._trigger(this.refEvent, { status, response });
      }
      destroy() {
        this._cancelRefEvent();
        this._cancelTimeout();
      }
      _cancelRefEvent() {
        if (!this.refEvent) {
          return;
        }
        this.channel._off(this.refEvent, {});
      }
      _cancelTimeout() {
        clearTimeout(this.timeoutTimer);
        this.timeoutTimer = void 0;
      }
      _matchReceive({ status, response }) {
        this.recHooks.filter((h) => h.status === status).forEach((h) => h.callback(response));
      }
      _hasReceived(status) {
        return this.receivedResp && this.receivedResp.status === status;
      }
    };
  }
});

// node_modules/@supabase/realtime-js/dist/module/RealtimePresence.js
var REALTIME_PRESENCE_LISTEN_EVENTS, RealtimePresence;
var init_RealtimePresence = __esm({
  "node_modules/@supabase/realtime-js/dist/module/RealtimePresence.js"() {
    (function(REALTIME_PRESENCE_LISTEN_EVENTS2) {
      REALTIME_PRESENCE_LISTEN_EVENTS2["SYNC"] = "sync";
      REALTIME_PRESENCE_LISTEN_EVENTS2["JOIN"] = "join";
      REALTIME_PRESENCE_LISTEN_EVENTS2["LEAVE"] = "leave";
    })(REALTIME_PRESENCE_LISTEN_EVENTS || (REALTIME_PRESENCE_LISTEN_EVENTS = {}));
    RealtimePresence = class _RealtimePresence {
      /**
       * Initializes the Presence.
       *
       * @param channel - The RealtimeChannel
       * @param opts - The options,
       *        for example `{events: {state: 'state', diff: 'diff'}}`
       */
      constructor(channel, opts) {
        this.channel = channel;
        this.state = {};
        this.pendingDiffs = [];
        this.joinRef = null;
        this.caller = {
          onJoin: () => {
          },
          onLeave: () => {
          },
          onSync: () => {
          }
        };
        const events = (opts === null || opts === void 0 ? void 0 : opts.events) || {
          state: "presence_state",
          diff: "presence_diff"
        };
        this.channel._on(events.state, {}, (newState) => {
          const { onJoin, onLeave, onSync } = this.caller;
          this.joinRef = this.channel._joinRef();
          this.state = _RealtimePresence.syncState(this.state, newState, onJoin, onLeave);
          this.pendingDiffs.forEach((diff) => {
            this.state = _RealtimePresence.syncDiff(this.state, diff, onJoin, onLeave);
          });
          this.pendingDiffs = [];
          onSync();
        });
        this.channel._on(events.diff, {}, (diff) => {
          const { onJoin, onLeave, onSync } = this.caller;
          if (this.inPendingSyncState()) {
            this.pendingDiffs.push(diff);
          } else {
            this.state = _RealtimePresence.syncDiff(this.state, diff, onJoin, onLeave);
            onSync();
          }
        });
        this.onJoin((key, currentPresences, newPresences) => {
          this.channel._trigger("presence", {
            event: "join",
            key,
            currentPresences,
            newPresences
          });
        });
        this.onLeave((key, currentPresences, leftPresences) => {
          this.channel._trigger("presence", {
            event: "leave",
            key,
            currentPresences,
            leftPresences
          });
        });
        this.onSync(() => {
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
      static syncState(currentState, newState, onJoin, onLeave) {
        const state = this.cloneDeep(currentState);
        const transformedState = this.transformState(newState);
        const joins = {};
        const leaves = {};
        this.map(state, (key, presences) => {
          if (!transformedState[key]) {
            leaves[key] = presences;
          }
        });
        this.map(transformedState, (key, newPresences) => {
          const currentPresences = state[key];
          if (currentPresences) {
            const newPresenceRefs = newPresences.map((m) => m.presence_ref);
            const curPresenceRefs = currentPresences.map((m) => m.presence_ref);
            const joinedPresences = newPresences.filter((m) => curPresenceRefs.indexOf(m.presence_ref) < 0);
            const leftPresences = currentPresences.filter((m) => newPresenceRefs.indexOf(m.presence_ref) < 0);
            if (joinedPresences.length > 0) {
              joins[key] = joinedPresences;
            }
            if (leftPresences.length > 0) {
              leaves[key] = leftPresences;
            }
          } else {
            joins[key] = newPresences;
          }
        });
        return this.syncDiff(state, { joins, leaves }, onJoin, onLeave);
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
      static syncDiff(state, diff, onJoin, onLeave) {
        const { joins, leaves } = {
          joins: this.transformState(diff.joins),
          leaves: this.transformState(diff.leaves)
        };
        if (!onJoin) {
          onJoin = () => {
          };
        }
        if (!onLeave) {
          onLeave = () => {
          };
        }
        this.map(joins, (key, newPresences) => {
          var _a5;
          const currentPresences = (_a5 = state[key]) !== null && _a5 !== void 0 ? _a5 : [];
          state[key] = this.cloneDeep(newPresences);
          if (currentPresences.length > 0) {
            const joinedPresenceRefs = state[key].map((m) => m.presence_ref);
            const curPresences = currentPresences.filter((m) => joinedPresenceRefs.indexOf(m.presence_ref) < 0);
            state[key].unshift(...curPresences);
          }
          onJoin(key, currentPresences, newPresences);
        });
        this.map(leaves, (key, leftPresences) => {
          let currentPresences = state[key];
          if (!currentPresences)
            return;
          const presenceRefsToRemove = leftPresences.map((m) => m.presence_ref);
          currentPresences = currentPresences.filter((m) => presenceRefsToRemove.indexOf(m.presence_ref) < 0);
          state[key] = currentPresences;
          onLeave(key, currentPresences, leftPresences);
          if (currentPresences.length === 0)
            delete state[key];
        });
        return state;
 === null || _a5 === void 0 ? void 0 : _a5.send(result);

          });
        };
        this.log("push", `${topic} ${event} (${ref})`, payload);
        if (this.isConnected()) {
          callback();
        } else {
          this.sendBuffer.push(callback);
        }

          }
          throw error;
        }
      }
      /**

          }
          throw error;
        }
      }

          }
          throw error;
        }
      }
      /**

          }
          throw error;
        }
      }
      /**

          }
          throw error;
        }
      }
      /**

          }
          throw error;
        }
      }

          }
          throw error;
        }
      }

      }
      /**
       * Acquires a global lock based on the storage key.
       */
      async _acquireLock(acquireTimeout, fn) {
        this._debug("#_acquireLock", "begin", acquireTimeout);
        try {
          if (this.lockAcquired) {
            const last = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve();
            const result = (async () => {
              await last;
              return await fn();
            })();
            this.pendingInLock.push((async () => {
              try {
                await result;
              } catch (e) {
              }
            })());
            return result;
          }
          return await this.lock(`lock:${this.storageKey}`, acquireTimeout, async () => {
            this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
            try {
              this.lockAcquired = true;
              const result = fn();
              this.pendingInLock.push((async () => {
                try {
                  await result;
                } catch (e) {
                }
              })());
              await result;
              while (this.pendingInLock.length) {
                const waitOn = [...this.pendingInLock];
                await Promise.all(waitOn);
                this.pendingInLock.splice(0, waitOn.length);
              }
              return await result;
            } finally {
              this._debug("#_acquireLock", "lock released for storage key", this.storageKey);
              this.lockAcquired = false;
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
      async _useSession(fn) {
        this._debug("#_useSession", "begin");
        try {
          const result = await this.__loadSession();
          return await fn(result);
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
        this._debug("#__loadSession()", "begin");
        if (!this.lockAcquired) {
          this._debug("#__loadSession()", "used outside of an acquired lock!", new Error().stack);
        }
        try {
          let currentSession = null;
          const maybeSession = await getItemAsync(this.storage, this.storageKey);
          this._debug("#getSession()", "session from storage", maybeSession);
          if (maybeSession !== null) {
            if (this._isValidSession(maybeSession)) {
              currentSession = maybeSession;
            } else {
              this._debug("#getSession()", "session from storage is not valid");
              await this._removeSession();
            }
          }
          if (!currentSession) {
            return { data: { session: null }, error: null };
          }
          const hasExpired = currentSession.expires_at ? currentSession.expires_at * 1e3 - Date.now() < EXPIRY_MARGIN_MS : false;
          this._debug("#__loadSession()", `session has${hasExpired ? "" : " not"} expired`, "expires_at", currentSession.expires_at);
          if (!hasExpired) {
            if (this.storage.isServer) {
              let suppressWarning = this.suppressGetSessionWarning;
              const proxySession = new Proxy(currentSession, {
                get: (target, prop, receiver) => {
                  if (!suppressWarning && prop === "user") {
                    console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server.");
                    suppressWarning = true;
                    this.suppressGetSessionWarning = true;
                  }
                  return Reflect.get(target, prop, receiver);
                }
              });
              currentSession = proxySession;
            }
            return { data: { session: currentSession }, error: null };
          }
          const { session, error } = await this._callRefreshToken(currentSession.refresh_token);
          if (error) {
            return { data: { session: null }, error };
          }
          return { data: { session }, error: null };
        } finally {
          this._debug("#__loadSession()", "end");
        }
      }

          });
        } catch (error) {
          if (isAuthError(error)) {
            return { data: null, error };
          }
          throw error;

          });
        } catch (error) {
          if (isAuthError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }

        } catch (error) {
          if (isAuthError(error)) {
            return { data: null, error };
          }
          throw error;
        }
      }
      /**

});

// storefronts/checkout/utils/computedInputStyle.js
function computedInputStyle(container) {
  if (!container || typeof window === "undefined" || typeof window.getComputedStyle !== "function") {
    return { input: {}, "::placeholder": {} };
  }
  const temp = document.createElement("input");
  temp.type = "text";
  temp.style.position = "absolute";
  temp.style.visibility = "hidden";
  temp.style.pointerEvents = "none";
  container.appendChild(temp);
  const cStyle = window.getComputedStyle(container);
  const iStyle = window.getComputedStyle(temp);
  const placeholder = window.getComputedStyle(temp, "::placeholder");
  const style = {
    input: {
      fontSize: cStyle.fontSize || iStyle.fontSize,
      fontFamily: cStyle.fontFamily || iStyle.fontFamily,
      color: cStyle.color || iStyle.color,
      backgroundColor: cStyle.backgroundColor || iStyle.backgroundColor,
      borderColor: cStyle.borderColor || iStyle.borderColor,
      borderWidth: cStyle.borderWidth || iStyle.borderWidth,
      borderStyle: cStyle.borderStyle || iStyle.borderStyle,
      padding: cStyle.padding || iStyle.padding,
      borderRadius: cStyle.borderRadius || iStyle.borderRadius,
      width: cStyle.width || iStyle.width,
      height: cStyle.height || iStyle.height,
      lineHeight: cStyle.lineHeight || iStyle.lineHeight,
      letterSpacing: cStyle.letterSpacing || iStyle.letterSpacing,
      textAlign: cStyle.textAlign || iStyle.textAlign,
      fontWeight: cStyle.fontWeight || iStyle.fontWeight,
      fontStyle: cStyle.fontStyle || iStyle.fontStyle,
      boxSizing: cStyle.boxSizing || iStyle.boxSizing
    },
    "::placeholder": {
      color: placeholder.color
    }
  };
  container.removeChild(temp);
  return style;
}
var init_computedInputStyle = __esm({
  "storefronts/checkout/utils/computedInputStyle.js"() {
  }
});

// storefronts/checkout/gateways/authorizeNet.js
var authorizeNet_exports = {};
__export(authorizeNet_exports, {
  createPaymentMethod: () => createPaymentMethod2,
  default: () => authorizeNet_default,
  getReadiness: () => getReadiness,
  isMounted: () => isMounted2,
  mountCardFields: () => mountCardFields2,
  ready: () => ready2
});
function getReadinessState() {
  return { acceptReady, authorizeNetReady, isSubmitting: submitting };
}
function updateDebug() {
  window.__SMOOTHR_DEBUG__ = {
    ...window.__SMOOTHR_DEBUG__,
    acceptReady,
    authorizeNetReady,
    isSubmitting: submitting,
    getReadinessState,
    checkAuthorizeIframeStatus,
    getAcceptCredentials,
    checkAcceptFieldPresence
  };
  if (!debugInitialized && acceptReady && authorizeNetReady) {
    debugInitialized = true;
    log2("Debug helpers ready:", window.__SMOOTHR_DEBUG__);
  }
}
function checkAuthorizeIframeStatus() {
  const num = document.querySelector("[data-smoothr-card-number] input");
  const exp = document.querySelector("[data-smoothr-card-expiry] input");
  const cvc = document.querySelector("[data-smoothr-card-cvc] input");
  return {
    acceptLoaded: !!window.Accept,
    numInput: !!num,
    expInput: !!exp,
    cvcInput: !!cvc,
    fieldsMounted: fieldsMounted2
  };
}
function checkAcceptFieldPresence() {
  const num = document.querySelector(
    '[data-smoothr-card-number] input[data-accept-name="cardNumber"]'
  );
  const exp = document.querySelector(
    '[data-smoothr-card-expiry] input[data-accept-name="expiry"]'
  );
  const cvc = document.querySelector(
    '[data-smoothr-card-cvc] input[data-accept-name="cvv"]'
  );
  return !!num && !!exp && !!cvc;
}
function applyAcceptIframeStyles() {
  if (iframeStylesApplied || typeof document === "undefined")
    return;
  let attempts = 0;
  const interval = setInterval(() => {
    const frames = [
      ["[data-smoothr-card-number] input", "iframe[data-accept-id][name=cardNumber]"],
      ["[data-smoothr-card-expiry] input", "iframe[data-accept-id][name=expiry]"],
      ["[data-smoothr-card-cvc] input", "iframe[data-accept-id][name=cvv]"]
    ];
    let styled = 0;
    frames.forEach(([inputSel, frameSel]) => {
      const input = document.querySelector(inputSel);
      const frame = document.querySelector(frameSel);
      if (input && frame && !frame.dataset.smoothrStyled) {
        const cs = window.getComputedStyle(input);
        for (const prop of cs) {
          frame.style[prop] = cs.getPropertyValue(prop);
        }
        frame.dataset.smoothrStyled = "true";
        console.log(`[Smoothr AuthorizeNet] Applied inline styles to ${frameSel}`);
      }
      if (frame == null ? void 0 : frame.dataset.smoothrStyled)
        styled++;
    });
    if (styled === frames.length || ++attempts >= 20) {
      iframeStylesApplied = styled === frames.length;
      clearInterval(interval);
    }
  }, 100);
}
function getAcceptCredentials() {
  return {
    clientKey,
    apiLoginId: apiLoginID,
    transactionKey
  };
}
function loadAcceptJs() {
  if (window.Accept)
    return Promise.resolve();
  if (scriptPromise)
    return scriptPromise;
  if (typeof process !== "undefined" && false) {
    window.Accept = { dispatchData: () => {
    } };
    return Promise.resolve();
  }
  scriptPromise = new Promise((resolve) => {
    var _a5, _b;
    let script = document.querySelector("script[data-smoothr-accept]");
    if (!script) {
      script = document.createElement("script");
      const env = (_b = (_a5 = window.SMOOTHR_CONFIG) == null ? void 0 : _a5.env) == null ? void 0 : _b.toLowerCase();
      const isProd = env === "production" || env === "prod";
      script.src = isProd ? "https://js.authorize.net/v1/Accept.js" : "https://jstest.authorize.net/v1/Accept.js";
      script.type = "text/javascript";
      script.setAttribute("data-smoothr-accept", "");
      script.addEventListener("load", () => resolve());
      document.head.appendChild(script);
    } else if (window.Accept) {
      resolve();
    } else {
      script.addEventListener("load", () => resolve());
    }
  });
  return scriptPromise;
}
async function resolveCredentials() {
  var _a5, _b, _c, _d;
  if (clientKey && apiLoginID && transactionKey !== void 0)
    return { clientKey, apiLoginID };
  const storeId = (_a5 = window.SMOOTHR_CONFIG) == null ? void 0 : _a5.storeId;
  if (!storeId)
    return { clientKey: null, apiLoginID: null };
  const cred = await getPublicCredential(storeId, "authorizeNet");
  clientKey = ((_b = cred == null ? void 0 : cred.settings) == null ? void 0 : _b.client_key) || "";
  apiLoginID = ((_c = cred == null ? void 0 : cred.settings) == null ? void 0 : _c.api_login_id) || (cred == null ? void 0 : cred.api_key) || "";
  transactionKey = ((_d = cred == null ? void 0 : cred.settings) == null ? void 0 : _d.transaction_key) || "";
  return { clientKey, apiLoginID };
}
async function mountCardFields2() {
  if (mountPromise2)
    return mountPromise2;
  if (fieldsMounted2)
    return;
  mountPromise2 = (async () => {
    log2("Mounting card fields");
    let num;
    let exp;
    let cvc;
    let delay = 100;
    let waited = 0;
    while (waited < 5e3) {
      num = document.querySelector("[data-smoothr-card-number]");
      exp = document.querySelector("[data-smoothr-card-expiry]");
      cvc = document.querySelector("[data-smoothr-card-cvc]");
      if (num && exp && cvc)
        break;
      await new Promise((res) => setTimeout(res, delay));
      waited += delay;
      delay = Math.min(delay * 2, 1e3);
    }
    if (!num || !exp || !cvc) {
      warn2("Card fields not found");
      return;
    }
    await resolveCredentials();
    await loadAcceptJs();
    log2("Accept.js injected");
    if (!acceptReady) {
      acceptReady = true;
      updateDebug();
      log2("Accept.js ready");
    }
    if (!num.querySelector("input")) {
      const input = document.createElement("input");
      input.type = "text";
      input.setAttribute("data-accept-name", "cardNumber");
      input.classList.add("smoothr-accept-field");
      input.autocomplete = "cc-number";
      input.placeholder = "Card number";
      num.appendChild(input);
    }
    if (!exp.querySelector("input")) {
      const input = document.createElement("input");
      input.type = "text";
      input.setAttribute("data-accept-name", "expiry");
      input.classList.add("smoothr-accept-field");
      input.autocomplete = "cc-exp";
      input.placeholder = "MM/YY";
      exp.appendChild(input);
    }
    if (!cvc.querySelector("input")) {
      const input = document.createElement("input");
      input.type = "text";
      input.setAttribute("data-accept-name", "cvv");
      input.classList.add("smoothr-accept-field");
      input.autocomplete = "cc-csc";
      input.placeholder = "CVC";
      cvc.appendChild(input);
    }
    const numStyle = computedInputStyle(num);
    const expStyle = computedInputStyle(exp);
    const cvcStyle = computedInputStyle(cvc);
    const numInput = num.querySelector("input");
    const expInput = exp.querySelector("input");
    const cvcInput = cvc.querySelector("input");
    if (numInput)
      Object.assign(numInput.style, numStyle.input);
    if (expInput)
      Object.assign(expInput.style, expStyle.input);
    if (cvcInput)
      Object.assign(cvcInput.style, cvcStyle.input);
    console.log("[Authorize.Net] cardNumber style", numStyle);
    console.log("[Authorize.Net] cardExpiry style", expStyle);
    console.log("[Authorize.Net] cardCVC style", cvcStyle);
    const config = {
      paymentFields: {
        cardNumber: {
          selector: "[data-smoothr-card-number] input",
          placeholder: "Card number",
          style: numStyle
        },
        expiry: {
          selector: "[data-smoothr-card-expiry] input",
          placeholder: "MM/YY",
          style: expStyle
        },
        cvv: {
          selector: "[data-smoothr-card-cvc] input",
          placeholder: "CVC",
          style: cvcStyle
        }
      }
    };
    log2("Configuring Accept.js fields", config);
    if (window.Accept && typeof window.Accept.configure === "function") {
      window.Accept.configure(config);
      console.log("[Authorize.Net] Accept.configure called with", config);
    } else {
      warn2("Accept.configure not available");
    }
    authorizeNetReady = true;
    updateDebug();
    log2("Secure card fields injected");
    let wait = 0;
    while (!checkAcceptFieldPresence() && wait < 3e3) {
      await new Promise((res) => setTimeout(res, 100));
      wait += 100;
    }
    if (!checkAcceptFieldPresence()) {
      warn2("Timed out waiting for Accept.js inputs");
      return;
    }
    fieldsMounted2 = true;
    applyAcceptIframeStyles();
    updateDebug();
    log2("Card fields mounted");
  })();
  mountPromise2 = mountPromise2.finally(() => {
    mountPromise2 = null;
  });
  return mountPromise2;
}
function isMounted2() {
  return fieldsMounted2;
}
function ready2() {
  return authorizeNetReady && !!window.Accept && !!clientKey && !!apiLoginID;
}
function getReadiness() {
  return { acceptReady, authorizeNetReady };
}
async function createPaymentMethod2() {
  var _a5, _b, _c, _d, _e, _f;
  log2("\u26A0\uFE0F createPaymentMethod started");
  if (!ready2()) {
    return { error: { message: "Authorize.Net not ready" }, payment_method: null };
  }
  const { acceptReady: acceptReady2, authorizeNetReady: authorizeNetReady2, isSubmitting } = getReadinessState();
  log2("createPaymentMethod readiness", {
    acceptReady: acceptReady2,
    authorizeNetReady: authorizeNetReady2,
    isSubmitting
  });
  if (!acceptReady2) {
    console.warn("[Smoothr AuthorizeNet] \u274C Accept.js not ready");
    alert("Payment form not ready: Accept.js not loaded");
    return { error: { message: "Accept.js not loaded" }, payment_method: null };
  }
  if (!authorizeNetReady2) {
    console.warn("[Smoothr AuthorizeNet] \u274C Card fields not mounted");
    alert("Payment form not ready: Card fields not ready");
    return { error: { message: "Card fields not ready" }, payment_method: null };
  }
  if (!checkAcceptFieldPresence()) {
    warn2("Accept.js input fields missing");
    return { error: { message: "Accept inputs missing" }, payment_method: null };
  }
  if (isSubmitting) {
    warn2("Payment already submitting");
    return { error: { message: "Already submitting" }, payment_method: null };
  }
  const cardNumberInput = document.querySelector("[data-smoothr-card-number] input");
  const expiryInput = document.querySelector("[data-smoothr-card-expiry] input");
  const cvcInput = document.querySelector("[data-smoothr-card-cvc] input");
  let cardNumber = ((_a5 = cardNumberInput == null ? void 0 : cardNumberInput.value) == null ? void 0 : _a5.replace(/\s+/g, "")) || "";
  let cardCode = ((_b = cvcInput == null ? void 0 : cvcInput.value) == null ? void 0 : _b.replace(/\D/g, "")) || "";
  let month = "";
  let year = "";
  if (expiryInput == null ? void 0 : expiryInput.value) {
    [month, year] = expiryInput.value.split("/").map((s) => s.trim());
    if (year && year.length === 2)
      year = "20" + year;
  }
  const first = ((_d = (_c = document.querySelector("[data-smoothr-bill-first-name]")) == null ? void 0 : _c.value) == null ? void 0 : _d.trim()) || "";
  const last = ((_f = (_e = document.querySelector("[data-smoothr-bill-last-name]")) == null ? void 0 : _e.value) == null ? void 0 : _f.trim()) || "";
  const fullName = `${first} ${last}`.trim();
  if (!first || !last) {
    console.warn("[Authorize.Net] \u274C Missing billing name fields \u2014 aborting tokenization");
    log2("\u274C Missing billing name");
    return { error: { message: "Missing billing name" }, payment_method: null };
  }
  if (!cardNumber || !month || !year) {
    return { error: { message: "Card details incomplete" }, payment_method: null };
  }
  const cardData = { cardNumber, month, year, cardCode, name: fullName };
  const secureData = {
    authData: { clientKey, apiLoginID },
    cardData
  };
  return new Promise((resolve) => {
    if (!window.Accept || !window.Accept.dispatchData) {
      console.warn("[Authorize.Net] \u274C dispatchData was not triggered");
      resolve({ error: { message: "Accept.js unavailable" }, payment_method: null });
      return;
    }
    submitting = true;
    updateDebug();
    log2("\u{1F9EA} Dispatching tokenization:", {
      month,
      year,
      cardCode,
      name: fullName
    });
    const timeoutId = setTimeout(() => {
      console.warn(
        "[Authorize.Net] dispatchData callback never fired \u2014 possible sandbox issue"
      );
      submitting = false;
      updateDebug();
    }, 5e3);
    try {
      window.Accept.dispatchData(secureData, (response) => {
        var _a6, _b2, _c2, _d2, _e2, _f2, _g, _h;
        clearTimeout(timeoutId);
        console.log("[AuthorizeNet] Full dispatchData response:", response);
        log2("\u{1F501} dispatchData response:", response);
        if (((_a6 = response.messages) == null ? void 0 : _a6.resultCode) === "Ok" && ((_b2 = response.opaqueData) == null ? void 0 : _b2.dataDescriptor) && ((_c2 = response.opaqueData) == null ? void 0 : _c2.dataValue)) {
          submitting = false;
          updateDebug();
          resolve({ error: null, payment_method: response.opaqueData });
        } else if (((_d2 = response.messages) == null ? void 0 : _d2.resultCode) === "Error") {
          submitting = false;
          updateDebug();
          console.error((_e2 = response.messages) == null ? void 0 : _e2.message);
          const message = ((_h = (_g = (_f2 = response.messages) == null ? void 0 : _f2.message) == null ? void 0 : _g[0]) == null ? void 0 : _h.text) || "Tokenization failed";
          resolve({ error: { message }, payment_method: null });
        } else {
          submitting = false;
          updateDebug();
          resolve({ error: { message: "Authorize.Net tokenization failed" }, payment_method: null });
        }
      });
    } catch (e) {
      submitting = false;
      updateDebug();
      console.error("[Smoothr AuthorizeNet]", "Tokenization error", e);
      resolve({ error: { message: (e == null ? void 0 : e.message) || "Tokenization failed" }, payment_method: null });
    }
  });
}
var fieldsMounted2, mountPromise2, clientKey, apiLoginID, transactionKey, scriptPromise, authorizeNetReady, acceptReady, submitting, iframeStylesApplied, debugInitialized, _a2, DEBUG, log2, warn2, authorizeNet_default;
var init_authorizeNet = __esm({
  "storefronts/checkout/gateways/authorizeNet.js"() {
    init_getPublicCredential();
    init_computedInputStyle();
    init_handleSuccessRedirect();
    fieldsMounted2 = false;
    authorizeNetReady = false;
    acceptReady = false;
    submitting = false;
    iframeStylesApplied = false;
    debugInitialized = false;
    DEBUG = !!((_a2 = window.SMOOTHR_CONFIG) == null ? void 0 : _a2.debug);
    log2 = (...a) => DEBUG && console.log("[AuthorizeNet]", ...a);
    warn2 = (...a) => DEBUG && console.warn("[AuthorizeNet]", ...a);
    authorizeNet_default = {
      mountCardFields: mountCardFields2,
      isMounted: isMounted2,
      ready: ready2,
      getReadiness,
      getReadinessState,
      createPaymentMethod: createPaymentMethod2
    };
  }
});

// storefronts/checkout/gateways/paypal.js
var paypal_exports = {};
__export(paypal_exports, {
  createPaymentMethod: () => createPaymentMethod3,
  default: () => paypal_default,
  initPayPal: () => initPayPal,
  isMounted: () => isMounted3,
  mountCardFields: () => mountCardFields3,
  ready: () => ready3
});
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", reject);
    document.head.appendChild(script);
  });
}
function initPayPal(opts) {
  console.log("[Smoothr][PayPal] initPayPal called with", opts);
  return mountCardFields3(opts);
}
async function mountCardFields3() {
  var _a5, _b, _c, _d;
  if (mounted)
    return;
  const container = document.querySelector("[data-smoothr-pay]");
  if (!container)
    return;
  mounted = true;
  container.addEventListener("click", (e) => e.stopImmediatePropagation(), true);
  const storeId = (_a5 = window.SMOOTHR_CONFIG) == null ? void 0 : _a5.storeId;
  const cred = await getPublicCredential(storeId, "paypal");
  const clientId = ((_b = cred == null ? void 0 : cred.settings) == null ? void 0 : _b.client_id) || (cred == null ? void 0 : cred.api_key) || "";
  if (!clientId) {
    console.warn("[Smoothr PayPal] Missing client_id");
    return;
  }
  await loadScript(`https://www.paypal.com/sdk/js?client-id=${clientId}`);
  const apiBase = ((_c = window.SMOOTHR_CONFIG) == null ? void 0 : _c.apiBase) || "";
  const paypalButtons = window.paypal.Buttons({
    createOrder: async () => {
      var _a6, _b2, _c2, _d2, _e;
      const q = (s) => document.querySelector(s);
      const totalEl = q("[data-smoothr-total]");
      const total = ((_c2 = (_b2 = (_a6 = window.Smoothr) == null ? void 0 : _a6.cart) == null ? void 0 : _b2.getTotal) == null ? void 0 : _c2.call(_b2)) || parseInt(((_d2 = totalEl == null ? void 0 : totalEl.textContent) == null ? void 0 : _d2.replace(/[^0-9]/g, "")) || "0", 10) || 0;
      const currency = ((_e = window.SMOOTHR_CONFIG) == null ? void 0 : _e.baseCurrency) || "USD";
      const res = await fetch(`${apiBase}/api/checkout/paypal/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency, store_id: storeId })
      });
      const data = await res.json();
      return data.id;
    },
    onApprove: async (data) => {
      var _a6, _b2, _c2, _d2, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T;
      const q = (s) => document.querySelector(s);
      const first = ((_b2 = (_a6 = q("[data-smoothr-first-name]")) == null ? void 0 : _a6.value) == null ? void 0 : _b2.trim()) || "";
      const last = ((_d2 = (_c2 = q("[data-smoothr-last-name]")) == null ? void 0 : _c2.value) == null ? void 0 : _d2.trim()) || "";
      const email = ((_f = (_e = q("[data-smoothr-email]")) == null ? void 0 : _e.value) == null ? void 0 : _f.trim()) || "";
      const shipping = {
        name: `${first} ${last}`.trim(),
        address: {
          line1: ((_h = (_g = q("[data-smoothr-ship-line1]")) == null ? void 0 : _g.value) == null ? void 0 : _h.trim()) || "",
          line2: ((_j = (_i = q("[data-smoothr-ship-line2]")) == null ? void 0 : _i.value) == null ? void 0 : _j.trim()) || "",
          city: ((_l = (_k = q("[data-smoothr-ship-city]")) == null ? void 0 : _k.value) == null ? void 0 : _l.trim()) || "",
          state: ((_n = (_m = q("[data-smoothr-ship-state]")) == null ? void 0 : _m.value) == null ? void 0 : _n.trim()) || "",
          postal_code: ((_p = (_o = q("[data-smoothr-ship-postal]")) == null ? void 0 : _o.value) == null ? void 0 : _p.trim()) || "",
          country: ((_r = (_q = q("[data-smoothr-ship-country]")) == null ? void 0 : _q.value) == null ? void 0 : _r.trim()) || ""
        }
      };
      const billing = {
        name: `${((_t = (_s = q("[data-smoothr-bill-first-name]")) == null ? void 0 : _s.value) == null ? void 0 : _t.trim()) || ""} ${((_v = (_u = q("[data-smoothr-bill-last-name]")) == null ? void 0 : _u.value) == null ? void 0 : _v.trim()) || ""}`.trim(),
        address: {
          line1: ((_x = (_w = q("[data-smoothr-bill-line1]")) == null ? void 0 : _w.value) == null ? void 0 : _x.trim()) || "",
          line2: ((_z = (_y = q("[data-smoothr-bill-line2]")) == null ? void 0 : _y.value) == null ? void 0 : _z.trim()) || "",
          city: ((_B = (_A = q("[data-smoothr-bill-city]")) == null ? void 0 : _A.value) == null ? void 0 : _B.trim()) || "",
          state: ((_D = (_C = q("[data-smoothr-bill-state]")) == null ? void 0 : _C.value) == null ? void 0 : _D.trim()) || "",
          postal_code: ((_F = (_E = q("[data-smoothr-bill-postal]")) == null ? void 0 : _E.value) == null ? void 0 : _F.trim()) || "",
          country: ((_H = (_G = q("[data-smoothr-bill-country]")) == null ? void 0 : _G.value) == null ? void 0 : _H.trim()) || ""
        }
      };
      const cart = ((_K = (_J = (_I = window.Smoothr) == null ? void 0 : _I.cart) == null ? void 0 : _J.getCart()) == null ? void 0 : _K.items) || [];
      const totalEl = q("[data-smoothr-total]");
      const total = ((_N = (_M = (_L = window.Smoothr) == null ? void 0 : _L.cart) == null ? void 0 : _M.getTotal) == null ? void 0 : _N.call(_M)) || parseInt(((_O = totalEl == null ? void 0 : totalEl.textContent) == null ? void 0 : _O.replace(/[^0-9]/g, "")) || "0", 10) || 0;
      const currency = ((_P = window.SMOOTHR_CONFIG) == null ? void 0 : _P.baseCurrency) || "USD";
      const payload = {
        orderID: data.orderID,
        store_id: storeId,
        email,
        first_name: first,
        last_name: last,
        shipping,
        billing,
        cart,
        total,
        currency,
        customer_id: ((_S = (_R = (_Q = window.smoothr) == null ? void 0 : _Q.auth) == null ? void 0 : _R.user) == null ? void 0 : _S.id) || null,
        platform: (_T = window.SMOOTHR_CONFIG) == null ? void 0 : _T.platform
      };
      const res = await fetch(`${apiBase}/api/checkout/paypal/capture-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.clone().json().catch(() => ({}));
      handleSuccessRedirect(res, result);
    },
    onError: (err) => console.error("[Smoothr PayPal]", err)
  });
  document.querySelectorAll("[data-smoothr-pay]").forEach((el) => {
    paypalButtons.render(el);
  });
  if ((_d = window.paypal) == null ? void 0 : _d.HostedFields) {
    const createOrder = (paypalButtons == null ? void 0 : paypalButtons.fundingSource) ? paypalButtons.createOrder : async () => {
      var _a6, _b2, _c2, _d2, _e;
      const q = (s) => document.querySelector(s);
      const totalEl = q("[data-smoothr-total]");
      const total = ((_c2 = (_b2 = (_a6 = window.Smoothr) == null ? void 0 : _a6.cart) == null ? void 0 : _b2.getTotal) == null ? void 0 : _c2.call(_b2)) || parseInt(((_d2 = totalEl == null ? void 0 : totalEl.textContent) == null ? void 0 : _d2.replace(/[^0-9]/g, "")) || "0", 10) || 0;
      const currency = ((_e = window.SMOOTHR_CONFIG) == null ? void 0 : _e.baseCurrency) || "USD";
      const res = await fetch(`${apiBase}/api/checkout/paypal/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency, store_id: storeId })
      });
      const data = await res.json();
      return data.id;
    };
    const selectors = {
      number: "[data-smoothr-card-number]",
      expiry: "[data-smoothr-card-expiry]",
      cvv: "[data-smoothr-card-cvc], [data-smoothr-card-cvv]"
    };
    console.log(
      "[Smoothr][PayPal] HostedFields selectors counts:",
      "number=",
      document.querySelectorAll(selectors.number).length,
      "expiry=",
      document.querySelectorAll(selectors.expiry).length,
      "cvv=",
      document.querySelectorAll(selectors.cvv).length
    );
    window.paypal.HostedFields.render({
      createOrder,
      styles: { input: { "font-size": "16px" } },
      fields: {
        number: { selector: selectors.number },
        expirationDate: { selector: selectors.expiry },
        cvv: { selector: selectors.cvv }
      }
    }).then((hostedFields) => {
      document.querySelectorAll("[data-smoothr-pay]").forEach((btn) => {
        btn.addEventListener("click", async (ev) => {
          ev.preventDefault();
          try {
            const payload = await hostedFields.submit({ contingency: "3D_SECURE" });
            const res = await fetch(`${apiBase}/api/checkout/paypal/capture-order`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ store_id: storeId, orderID: payload.orderId })
            });
            const json = await res.json();
            handleSuccessRedirect(null, json);
          } catch (err) {
            console.error("[Smoothr PayPal]", err);
          }
        });
      });
    }).catch((err) => console.error("[Smoothr PayPal]", err));
  }
}
function isMounted3() {
  return mounted;
}
function ready3() {
  return !!window.paypal;
}
async function createPaymentMethod3() {
  return { payment_method: { id: "paypal" } };
}
var mounted, paypal_default;
var init_paypal = __esm({
  "storefronts/checkout/gateways/paypal.js"() {
    init_getPublicCredential();
    init_handleSuccessRedirect();
    mounted = false;
    paypal_default = {
      initPayPal,
      mountCardFields: mountCardFields3,
      isMounted: isMounted3,
      ready: ready3,
      createPaymentMethod: createPaymentMethod3
    };
  }
});

// storefronts/checkout/providers/nmi.js
async function resolveTokenizationKey() {
  var _a5, _b, _c;
  if (cachedKey2 !== void 0)
    return cachedKey2;
  const storeId = (_a5 = window.SMOOTHR_CONFIG) == null ? void 0 : _a5.storeId;
  if (!storeId)
    return null;
  const gateway = ((_b = window.SMOOTHR_CONFIG) == null ? void 0 : _b.active_payment_gateway) || "nmi";
  try {
    const cred = await getPublicCredential(storeId, "nmi", gateway);
    cachedKey2 = ((_c = cred == null ? void 0 : cred.settings) == null ? void 0 : _c.tokenization_key) || null;
  } catch (e) {
    warn3("Integration fetch error:", (e == null ? void 0 : e.message) || e);
    cachedKey2 = null;
  }
  if (!cachedKey2) {
    warn3("No tokenization key found for gateway", gateway);
    return null;
  }
  log3("Using tokenization key resolved");
  return cachedKey2;
}
var cachedKey2, _a3, DEBUG2, log3, warn3;
var init_nmi = __esm({
  "storefronts/checkout/providers/nmi.js"() {
    init_getPublicCredential();
    DEBUG2 = !!((_a3 = window.SMOOTHR_CONFIG) == null ? void 0 : _a3.debug);
    log3 = (...a) => DEBUG2 && console.log("[NMI]", ...a);
    warn3 = (...a) => DEBUG2 && console.warn("[NMI]", ...a);
  }
});

// storefronts/checkout/gateways/nmi.js
var nmi_exports = {};
__export(nmi_exports, {
  createPaymentMethod: () => createPaymentMethod4,
  default: () => nmi_default,
  isMounted: () => isMounted4,
  mountCardFields: () => mountNMI,
  mountNMI: () => mountNMI,
  mountNMIFields: () => mountNMIFields,
  ready: () => ready4
});
function waitForCollectJsReady(callback, retries = 10) {
  if (window.CollectJS) {
    callback();
    return;
  }
  if (retries <= 0) {
    warn4("Collect.js not found");
    return;
  }
  setTimeout(() => waitForCollectJsReady(callback, retries - 1), 100);
}
function parseExpiry(val) {
  const m = val.trim().match(/^(\d{1,2})\s*\/\s*(\d{2})$/);
  if (!m)
    return [null, null];
  let [, mon, yr] = m;
  if (mon.length === 1)
    mon = "0" + mon;
  return [mon, "20" + yr];
}
function syncHiddenExpiryFields(container, mon, yr) {
  let mm = container.querySelector('input[data-collect="expMonth"]');
  let yy = container.querySelector('input[data-collect="expYear"]');
  if (!mm) {
    mm = document.createElement("input");
    mm.type = "hidden";
    mm.setAttribute("data-collect", "expMonth");
    container.appendChild(mm);
  }
  if (!yy) {
    yy = document.createElement("input");
    yy.type = "hidden";
    yy.setAttribute("data-collect", "expYear");
    container.appendChild(yy);
  }
  mm.value = mon;
  yy.value = yr;
}
async function mountNMI() {
  tokenizationKey = await resolveTokenizationKey();
  if (!tokenizationKey)
    return;
  const numEl = await waitForElement("[data-smoothr-card-number]");
  const expEl = await waitForElement("[data-smoothr-card-expiry]");
  const cvvEl = await waitForElement("[data-smoothr-card-cvc]");
  const postalEl = document.querySelector("[data-smoothr-bill-postal]");
  if (!numEl || !expEl || !cvvEl)
    return;
  [numEl, expEl, cvvEl].forEach(
    (el) => el.setAttribute("data-tokenization-key", tokenizationKey)
  );
  expEl.querySelectorAll('input[data-collect="expMonth"],input[data-collect="expYear"]').forEach((i) => i.remove());
  syncHiddenExpiryFields(expEl, "", "");
  function ensureSingleInput(el, dataCollectType) {
    let input = el.querySelector(`input[data-collect="${dataCollectType}"]`);
    if (!input) {
      input = document.createElement("input");
      input.setAttribute("type", "text");
      input.setAttribute("data-collect", dataCollectType);
      el.innerHTML = "";
      el.appendChild(input);
    }
    return input;
  }
  const cardNumberInput = ensureSingleInput(numEl, "cardNumber");
  const expiryInput = ensureSingleInput(expEl, "expiry");
  const cvcInput = ensureSingleInput(cvvEl, "cvv");
  if (postalEl && !postalEl.querySelector('input[data-collect="postal"]')) {
    const i = document.createElement("input");
    i.type = "hidden";
    i.setAttribute("data-collect", "postal");
    postalEl.appendChild(i);
  }
  expiryInput.addEventListener("keyup", (e) => {
    const [mon, yr] = parseExpiry(e.target.value);
    if (mon && yr) {
      syncHiddenExpiryFields(expEl, mon, yr);
    } else {
      expEl.querySelectorAll('input[data-collect="expMonth"],input[data-collect="expYear"]').forEach((i) => i.remove());
    }
  });
  const setupCollect = () => waitForCollectJsReady(() => {
    window.CollectJS.configure({
      tokenizationKey,
      fields: {
        cardNumber: cardNumberInput,
        expiry: expiryInput,
        cvv: cvcInput
      }
    });
  });
  if (!window.CollectJS) {
    let script = document.querySelector(
      'script[src*="secure.networkmerchants.com/token/Collect.js"],script[src*="secure.nmi.com/token/Collect.js"]'
    );
    if (!script) {
      script = document.createElement("script");
      script.src = "https://secure.nmi.com/token/Collect.js";
      script.setAttribute("data-tokenization-key", tokenizationKey);
      document.head.appendChild(script);
    }
    script.addEventListener("load", setupCollect);
  } else {
    setupCollect();
  }
}
async function mountNMIFields() {
  return mountNMI();
}
function isMounted4() {
  const numberInput = document.querySelector('input[data-collect="cardNumber"]');
  const cvcInput = document.querySelector('input[data-collect="cvv"]');
  const monthInput = document.querySelector('input[data-collect="expMonth"]');
  const yearInput = document.querySelector('input[data-collect="expYear"]');
  const numberFrame = document.querySelector("[data-smoothr-card-number] iframe");
  const expiryFrame = document.querySelector("[data-smoothr-card-expiry] iframe");
  const cvcFrame = document.querySelector("[data-smoothr-card-cvc] iframe");
  return !!window.CollectJS && !!numberInput && !!cvcInput && !!monthInput && !!yearInput && !!numberFrame && !!expiryFrame && !!cvcFrame;
