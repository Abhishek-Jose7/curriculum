var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-53eUsX/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        if (opts.credentials) {
          return (origin) => origin || null;
        }
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*" || opts.credentials) {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*" || opts.credentials) {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// src/repositories/base.ts
var BaseRepository = class {
  constructor(db, table, writableColumns, filterColumns = []) {
    this.db = db;
    this.table = table;
    this.writableColumns = writableColumns;
    this.filterColumns = filterColumns;
  }
  db;
  table;
  writableColumns;
  filterColumns;
  static {
    __name(this, "BaseRepository");
  }
  async list(query = {}) {
    const clauses = [];
    const values = [];
    for (const column of this.filterColumns) {
      const value = query[column];
      if (value !== void 0 && value !== "") {
        clauses.push(`${column} = ?`);
        values.push(value);
      }
    }
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
    const result = await this.db.prepare(`SELECT * FROM ${this.table}${where}`).bind(...values).all();
    return result.results ?? [];
  }
  async get(id) {
    return await this.db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).bind(id).first();
  }
  async create(data) {
    const payload = { ...data };
    if (payload.department !== void 0 && payload.department_id === void 0) {
      payload.department_id = payload.department;
    }
    if (payload.academic_year !== void 0 && payload.academic_year_id === void 0) {
      payload.academic_year_id = payload.academic_year;
    }
    if (payload.semester !== void 0 && payload.semester_id === void 0) {
      payload.semester_id = payload.semester;
    }
    if (!payload.id && !this.writableColumns.includes("id")) {
      payload.id = crypto.randomUUID();
    }
    const cols = Array.from(/* @__PURE__ */ new Set([...payload.id ? ["id"] : [], ...this.writableColumns]));
    const columns = cols.filter((column) => payload[column] !== void 0);
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((column) => normalizeValue(payload[column]));
    const quotedCols = columns.map((c) => `"${c}"`).join(", ");
    const row = await this.db.prepare(`INSERT INTO ${this.table} (${quotedCols}) VALUES (${placeholders}) RETURNING *`).bind(...values).first();
    if (!row) throw new Error(`Failed to create ${this.table} row`);
    return row;
  }
  async update(id, data) {
    const payload = { ...data };
    if (payload.department !== void 0 && payload.department_id === void 0) {
      payload.department_id = payload.department;
    }
    if (payload.semester !== void 0 && payload.semester_id === void 0) {
      payload.semester_id = payload.semester;
    }
    const columns = this.writableColumns.filter((column) => payload[column] !== void 0);
    if (!columns.length) {
      const existing = await this.get(id);
      if (!existing) throw new Error(`${this.table} row not found`);
      return existing;
    }
    const assignments = columns.map((column) => `"${column}" = ?`).join(", ");
    const values = columns.map((column) => normalizeValue(payload[column]));
    const row = await this.db.prepare(`UPDATE ${this.table} SET ${assignments} WHERE id = ? RETURNING *`).bind(...values, id).first();
    if (!row) throw new Error(`${this.table} row not found`);
    return row;
  }
  async delete(id) {
    await this.db.prepare(`DELETE FROM ${this.table} WHERE id = ?`).bind(id).run();
  }
};
function normalizeValue(value) {
  if (Array.isArray(value) || value && typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}
__name(normalizeValue, "normalizeValue");
function parseJson(value, fallback) {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
__name(parseJson, "parseJson");

// src/repositories/curriculum.ts
var courseFields = [
  "semester_id",
  "faculty_user_id",
  "code",
  "title",
  "course_type",
  "status",
  "lecture_hours",
  "tutorial_hours",
  "practical_hours",
  "self_learning_hours",
  "lecture_credits",
  "tutorial_credits",
  "practical_credits",
  "credits",
  "internal_marks",
  "external_marks",
  "duration_hours",
  "passing_marks",
  "pre_requisites",
  "objectives",
  "syllabus_intro",
  "online_resources",
  "section_order",
  "approved_by_user_id",
  "approved_at"
];
var CoursesRepository = class extends BaseRepository {
  static {
    __name(this, "CoursesRepository");
  }
  constructor(db) {
    super(db, "courses", courseFields, ["semester_id", "faculty_user_id", "course_type", "status"]);
  }
  async detail(id) {
    const course = await this.get(id);
    if (!course) return null;
    const [outcomes, modules, experiments, assessments, referenceBooks, comments] = await Promise.all([
      this.db.prepare("SELECT *, sort_order AS `order` FROM course_outcomes WHERE course_id = ? ORDER BY sort_order, code").bind(id).all(),
      new ModulesRepository(this.db).forCourse(id),
      this.db.prepare("SELECT *, number AS `order` FROM experiments WHERE course_id = ? ORDER BY number").bind(id).all(),
      this.db.prepare("SELECT *, sort_order AS `order` FROM assessment_schemes WHERE course_id = ? ORDER BY sort_order").bind(id).all(),
      this.db.prepare("SELECT *, sort_order AS `order` FROM reference_books WHERE course_id = ? ORDER BY is_textbook, sort_order").bind(id).all(),
      this.db.prepare("SELECT rc.*, trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) AS reviewer_name FROM reviewer_comments rc LEFT JOIN profiles p ON p.id = rc.reviewer_user_id WHERE rc.course_id = ? ORDER BY rc.section_key, rc.created_at DESC").bind(id).all()
    ]);
    return serializeCourse({
      ...course,
      outcomes: outcomes.results ?? [],
      modules,
      experiments: experiments.results ?? [],
      assessments: assessments.results ?? [],
      reference_books: referenceBooks.results ?? [],
      comments: comments.results ?? []
    });
  }
};
var ModulesRepository = class extends BaseRepository {
  static {
    __name(this, "ModulesRepository");
  }
  constructor(db) {
    super(db, "modules", ["course_id", "number", "title", "contact_hours", "content", "references"], ["course_id"]);
  }
  async forCourse(courseId) {
    const modules = (await this.db.prepare("SELECT * FROM modules WHERE course_id = ? ORDER BY number").bind(courseId).all()).results ?? [];
    return await Promise.all(modules.map(async (module) => ({
      ...module,
      topics: (await this.db.prepare("SELECT *, sort_order AS `order` FROM topics WHERE module_id = ? ORDER BY sort_order").bind(module.id).all()).results ?? []
    })));
  }
};
var ReviewerRepository = class extends BaseRepository {
  static {
    __name(this, "ReviewerRepository");
  }
  constructor(db) {
    super(db, "reviewer_comments", ["course_id", "reviewer_user_id", "section_key", "section_label", "body", "is_resolved", "resolved_by_user_id", "resolved_at"], ["course_id", "section_key", "is_resolved"]);
  }
};
var WorkflowRepository = class extends BaseRepository {
  static {
    __name(this, "WorkflowRepository");
  }
  constructor(db) {
    super(db, "approval_workflows", ["course_id", "actor_user_id", "from_status", "to_status", "decision", "note"], ["course_id", "decision", "actor_user_id"]);
  }
};
function serializeCourse(row) {
  return {
    ...row,
    faculty: row.faculty_user_id,
    approved_by: row.approved_by_user_id,
    faculty_name: row.faculty_name ?? "",
    last_modified: row.updated_at,
    total_marks: Number(row.internal_marks ?? 0) + Number(row.external_marks ?? 0),
    online_resources: parseJson(row.online_resources, []),
    section_order: parseJson(row.section_order, []),
    outcomes: row.outcomes ?? [],
    modules: row.modules ?? [],
    experiments: row.experiments ?? [],
    assessments: row.assessments ?? [],
    reference_books: row.reference_books ?? []
  };
}
__name(serializeCourse, "serializeCourse");

// src/middleware/auth.ts
var encoder = new TextEncoder();
async function requireAuth(c, next) {
  const path = c.req.path;
  if (path.includes("/auth/token") || path.includes("/auth/logout")) {
    await next();
    return;
  }
  const header = c.req.header("authorization") ?? "";
  const cookieHeader = c.req.header("cookie") ?? "";
  const cookieToken = cookieHeader.split(";").map((s) => s.trim()).find((s) => s.startsWith("curriculum_access="))?.slice("curriculum_access=".length) ?? "";
  const token = (header.startsWith("Bearer ") ? header.slice(7) : "") || cookieToken;
  if (!token) return c.json({ detail: "Authentication credentials were not provided." }, 401);
  const payload = await verifyJwt(token, c.env.AUTH_JWT_SECRET);
  if (!payload?.sub) return c.json({ detail: "Invalid token." }, 401);
  const user = await c.env.DB.prepare("SELECT id, email, role, department_id, first_name, last_name, is_superuser FROM profiles WHERE id = ? AND is_active = 1").bind(payload.sub).first();
  if (!user) return c.json({ detail: "User not found or inactive." }, 401);
  c.set("user", user);
  await next();
}
__name(requireAuth, "requireAuth");
function isAcademicAdmin(user) {
  return user.is_superuser === 1 || user.role === "ADMIN" || user.role === "HOD";
}
__name(isAcademicAdmin, "isAcademicAdmin");
function isReviewerOrAdmin(user) {
  return isAcademicAdmin(user) || user.role === "REVIEWER";
}
__name(isReviewerOrAdmin, "isReviewerOrAdmin");
async function signJwt(payload, secret, ttlSeconds = 60 * 60) {
  const now = Math.floor(Date.now() / 1e3);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const header = { alg: "HS256", typ: "JWT" };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`;
  const signature = await hmac(unsigned, secret);
  return `${unsigned}.${signature}`;
}
__name(signJwt, "signJwt");
async function verifyJwt(token, secret) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  const expected = await hmac(`${header}.${payload}`, secret);
  if (expected !== signature) return null;
  const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1e3)) return null;
  return decoded;
}
__name(verifyJwt, "verifyJwt");
async function hmac(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64url(signature);
}
__name(hmac, "hmac");
function base64url(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64url, "base64url");
function requireRole(...roles) {
  return async (c, next) => {
    const user = c.get("user");
    if (!user || !roles.includes(user.role)) {
      return c.json({ detail: "Permission denied." }, 403);
    }
    await next();
  };
}
__name(requireRole, "requireRole");

// src/services/auth.ts
var encoder2 = new TextEncoder();
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
__name(arrayBufferToBase64, "arrayBufferToBase64");
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
__name(base64ToArrayBuffer, "base64ToArrayBuffer");
async function hashPassword(password, iterations = 1e5) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder2.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations,
      hash: "SHA-256"
    },
    passwordKey,
    256
  );
  const saltB64 = arrayBufferToBase64(saltBytes.buffer);
  const hashB64 = arrayBufferToBase64(derivedBits);
  return `pbkdf2_sha256$${iterations}$${saltB64}$${hashB64}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  if (!storedHash.startsWith("pbkdf2_sha256$")) {
    return password === storedHash;
  }
  const parts = storedHash.split("$");
  if (parts.length !== 4) return false;
  const iterations = parseInt(parts[1], 10);
  const saltB64 = parts[2];
  const hashB64 = parts[3];
  try {
    const saltBytes = new Uint8Array(base64ToArrayBuffer(saltB64));
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder2.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations,
        hash: "SHA-256"
      },
      passwordKey,
      256
    );
    const computedHashB64 = arrayBufferToBase64(derivedBits);
    return computedHashB64 === hashB64;
  } catch (err) {
    console.error("Failed to verify password hash:", err);
    return false;
  }
}
__name(verifyPassword, "verifyPassword");

// src/services/courseVersions.ts
async function createCourseVersion(db, courseId, user, changeSummary) {
  const latest = await db.prepare("SELECT id, version_number FROM course_versions WHERE course_id = ? ORDER BY version_number DESC LIMIT 1").bind(courseId).first();
  const snapshot = await new CoursesRepository(db).detail(courseId);
  const row = await db.prepare(`
    INSERT INTO course_versions (course_id, version_number, edited_by_user_id, previous_version_id, snapshot, change_summary)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(courseId, (latest?.version_number ?? 0) + 1, user?.id ?? null, latest?.id ?? null, JSON.stringify(snapshot), changeSummary).first();
  return row;
}
__name(createCourseVersion, "createCourseVersion");
function diffSnapshots(left, right) {
  const changes = [];
  const leftCourse = left?.course ?? left ?? {};
  const rightCourse = right?.course ?? right ?? {};
  const skip = /* @__PURE__ */ new Set(["id", "semester_id", "semester", "created_at", "updated_at", "approved_at"]);
  for (const key of /* @__PURE__ */ new Set([...Object.keys(leftCourse), ...Object.keys(rightCourse)])) {
    if (!skip.has(key) && JSON.stringify(leftCourse[key]) !== JSON.stringify(rightCourse[key])) {
      changes.push({ section: "course", field: key, old: leftCourse[key], new: rightCourse[key] });
    }
  }
  for (const section of ["outcomes", "modules", "experiments", "assessments", "reference_books"]) {
    if (JSON.stringify(left?.[section] ?? []) !== JSON.stringify(right?.[section] ?? [])) {
      changes.push({ section, field: "items", old: left?.[section] ?? [], new: right?.[section] ?? [] });
    }
  }
  return changes;
}
__name(diffSnapshots, "diffSnapshots");

// src/routes/generic.ts
function crudRoute(table, columns, filters, adminWrite = true) {
  const app2 = new Hono2();
  app2.get("/", async (c) => c.json(await new BaseRepository(c.env.DB, table, columns, filters).list(Object.fromEntries(new URL(c.req.url).searchParams))));
  app2.get("/:id/", async (c) => {
    const row = await new BaseRepository(c.env.DB, table, columns, filters).get(c.req.param("id"));
    return row ? c.json(row) : c.json({ detail: "Not found." }, 404);
  });
  app2.post("/", async (c) => {
    if (adminWrite && !isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
    try {
      const created = await new BaseRepository(c.env.DB, table, columns, filters).create(await c.req.json());
      return c.json(created, 201);
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes("UNIQUE constraint failed") || msg.includes("SQLITE_CONSTRAINT")) {
        return c.json({ detail: "A record with this identifier or semester number already exists for this selection." }, 400);
      }
      return c.json({ detail: msg }, 400);
    }
  });
  app2.patch("/:id/", async (c) => {
    if (adminWrite && !isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
    try {
      const updated = await new BaseRepository(c.env.DB, table, columns, filters).update(c.req.param("id"), await c.req.json());
      return c.json(updated);
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes("UNIQUE constraint failed") || msg.includes("SQLITE_CONSTRAINT")) {
        return c.json({ detail: "A record with this identifier or semester number already exists." }, 400);
      }
      return c.json({ detail: msg }, 400);
    }
  });
  app2.put("/:id/", async (c) => {
    if (adminWrite && !isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
    try {
      const updated = await new BaseRepository(c.env.DB, table, columns, filters).update(c.req.param("id"), await c.req.json());
      return c.json(updated);
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes("UNIQUE constraint failed") || msg.includes("SQLITE_CONSTRAINT")) {
        return c.json({ detail: "A record with this identifier or semester number already exists." }, 400);
      }
      return c.json({ detail: msg }, 400);
    }
  });
  app2.delete("/:id/", async (c) => {
    if (adminWrite && !isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
    await new BaseRepository(c.env.DB, table, columns, filters).delete(c.req.param("id"));
    return c.body(null, 204);
  });
  return app2;
}
__name(crudRoute, "crudRoute");

// src/index.ts
var app = new Hono2();
var api = new Hono2();
app.use(
  "*",
  cors({
    origin: /* @__PURE__ */ __name((origin, c) => {
      const allowed = c.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:3000";
      const origins = allowed.split(",").map((o) => o.trim());
      if (origins.includes(origin)) {
        return origin;
      }
      if (origin && (origin.endsWith(".vercel.app") || origin.startsWith("http://localhost:"))) {
        return origin;
      }
      if (!origin && c.env.ENVIRONMENT === "development") {
        return "*";
      }
      return origins[0];
    }, "origin"),
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true
  })
);
app.get("/api/fonts/:name", async (c) => serveFont(c));
app.get("/fonts/:name", async (c) => serveFont(c));
async function serveFont(c) {
  const name = c.req.param("name");
  if (!name.endsWith(".ttf")) {
    return c.text("Invalid font format", 400);
  }
  const cacheKey = `fonts/${name}`;
  let fontBuffer = null;
  try {
    if (c.env.BUCKET) {
      const fontObject = await c.env.BUCKET.get(cacheKey);
      if (fontObject) {
        fontBuffer = await fontObject.arrayBuffer();
      }
    }
  } catch (e) {
    console.error("Failed to read from R2:", e);
  }
  if (!fontBuffer) {
    let fontName = name;
    if (name === "times.ttf") {
      fontName = "LiberationSerif-Regular.ttf";
    } else if (name === "timesbd.ttf") {
      fontName = "LiberationSerif-Bold.ttf";
    }
    const urls2 = [
      `https://raw.githubusercontent.com/shantigilbert/liberation-fonts-ttf/master/${fontName}`,
      `https://raw.githubusercontent.com/shantigilbert/liberation-fonts-ttf/main/${fontName}`,
      `https://raw.githubusercontent.com/liberationfonts/liberation-fonts/main/src/${fontName}`
    ];
    for (const url of urls2) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          fontBuffer = await response.arrayBuffer();
          if (c.env.BUCKET && fontBuffer) {
            await c.env.BUCKET.put(cacheKey, fontBuffer.slice(0), {
              httpMetadata: { contentType: "font/ttf" }
            });
          }
          break;
        }
      } catch (err) {
        console.error(`Failed to fetch from ${url}:`, err);
      }
    }
  }
  if (!fontBuffer) {
    return c.text("Font not found", 404);
  }
  return new Response(fontBuffer, {
    headers: {
      "Content-Type": "font/ttf",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "public, max-age=31536000"
    }
  });
}
__name(serveFont, "serveFont");
async function ensureRefreshTokensTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      token_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      is_revoked INTEGER NOT NULL DEFAULT 0 CHECK (is_revoked IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}
__name(ensureRefreshTokensTable, "ensureRefreshTokensTable");
api.post("/auth/token/", async (c) => {
  const body = await c.req.json();
  const login = body.username ?? body.email ?? "";
  const user = await c.env.DB.prepare("SELECT * FROM profiles WHERE (email = ? OR username = ?) AND is_active = 1").bind(login, login).first();
  if (!user) return c.json({ detail: "No active account found with the given credentials." }, 401);
  const verified = await verifyPassword(body.password ?? "", user.password_hash ?? "");
  if (!verified) return c.json({ detail: "No active account found with the given credentials." }, 401);
  if (user.password_hash && !user.password_hash.startsWith("pbkdf2_sha256$")) {
    const newHash = await hashPassword(body.password ?? "");
    await c.env.DB.prepare("UPDATE profiles SET password_hash = ? WHERE id = ?").bind(newHash, user.id).run();
  }
  await ensureRefreshTokensTable(c.env.DB);
  const tokenJti = crypto.randomUUID();
  const refreshExpires = new Date(Date.now() + 1e3 * 60 * 60 * 24 * 7);
  const refreshExpiresStr = refreshExpires.toISOString();
  await c.env.DB.prepare(`
    INSERT INTO refresh_tokens (id, token_id, user_id, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(crypto.randomUUID(), tokenJti, user.id, refreshExpiresStr).run();
  const accessToken = await signJwt(
    { sub: user.id, role: user.role, email: user.email },
    c.env.AUTH_JWT_SECRET,
    60 * 15
  );
  const refreshToken = await signJwt(
    { sub: user.id, typ: "refresh", jti: tokenJti },
    c.env.AUTH_JWT_SECRET,
    60 * 60 * 24 * 7
  );
  const cookieBase = "HttpOnly; Path=/; SameSite=None; Secure";
  return new Response(
    JSON.stringify({ access: accessToken, refresh: refreshToken }),
    {
      status: 200,
      headers: new Headers([
        ["Content-Type", "application/json"],
        ["Set-Cookie", `curriculum_access=${accessToken}; Max-Age=900; ${cookieBase}`],
        ["Set-Cookie", `curriculum_refresh=${refreshToken}; Max-Age=604800; ${cookieBase}`]
      ])
    }
  );
});
api.post("/auth/token/refresh/", async (c) => {
  const body = await c.req.json();
  const token = body.refresh;
  if (!token) return c.json({ detail: "Refresh token is required." }, 400);
  const payload = await verifyJwt(token, c.env.AUTH_JWT_SECRET);
  if (!payload?.sub || payload.typ !== "refresh" || !payload.jti) {
    return c.json({ detail: "Invalid or expired refresh token." }, 401);
  }
  await ensureRefreshTokensTable(c.env.DB);
  const stored = await c.env.DB.prepare("SELECT * FROM refresh_tokens WHERE token_id = ?").bind(payload.jti).first();
  if (!stored) return c.json({ detail: "Invalid refresh token." }, 401);
  if (stored.is_revoked === 1) {
    await c.env.DB.prepare("UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?").bind(stored.user_id).run();
    return c.json({ detail: "Refresh token has been revoked." }, 401);
  }
  if (new Date(stored.expires_at) < /* @__PURE__ */ new Date()) {
    return c.json({ detail: "Refresh token has expired." }, 401);
  }
  const user = await c.env.DB.prepare("SELECT * FROM profiles WHERE id = ? AND is_active = 1").bind(stored.user_id).first();
  if (!user) return c.json({ detail: "User not found or inactive." }, 401);
  await c.env.DB.prepare("UPDATE refresh_tokens SET is_revoked = 1 WHERE token_id = ?").bind(payload.jti).run();
  const tokenJti = crypto.randomUUID();
  const refreshExpires = new Date(Date.now() + 1e3 * 60 * 60 * 24 * 7);
  const refreshExpiresStr = refreshExpires.toISOString();
  await c.env.DB.prepare(`
    INSERT INTO refresh_tokens (id, token_id, user_id, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(crypto.randomUUID(), tokenJti, user.id, refreshExpiresStr).run();
  return c.json({
    access: await signJwt({ sub: user.id, role: user.role, email: user.email }, c.env.AUTH_JWT_SECRET, 60 * 15),
    // 15 mins
    refresh: await signJwt({ sub: user.id, typ: "refresh", jti: tokenJti }, c.env.AUTH_JWT_SECRET, 60 * 60 * 24 * 7)
    // 7 days
  });
});
api.post("/auth/token/revoke/", async (c) => {
  const body = await c.req.json();
  const token = body.refresh_token;
  if (!token) return c.json({ detail: "Refresh token is required." }, 400);
  const payload = await verifyJwt(token, c.env.AUTH_JWT_SECRET);
  if (!payload?.jti) return c.json({ detail: "Invalid token." }, 401);
  await ensureRefreshTokensTable(c.env.DB);
  await c.env.DB.prepare("UPDATE refresh_tokens SET is_revoked = 1 WHERE token_id = ?").bind(payload.jti).run();
  return c.json({ status: "revoked" });
});
api.post("/auth/logout/", async (c) => {
  const clearBase = "HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure";
  return new Response(JSON.stringify({ status: "logged_out" }), {
    status: 200,
    headers: new Headers([
      ["Content-Type", "application/json"],
      ["Set-Cookie", `curriculum_access=; ${clearBase}`],
      ["Set-Cookie", `curriculum_refresh=; ${clearBase}`]
    ])
  });
});
api.use("*", requireAuth);
api.get("/auth/me/", (c) => c.json(c.get("user")));
api.get("/profiles/faculty", requireRole("ADMIN", "HOD"), async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, email, first_name, last_name, role, department_id FROM profiles WHERE role IN ('FACULTY', 'HOD', 'ADMIN') AND is_active = 1 ORDER BY first_name, last_name"
  ).all();
  return c.json(rows.results ?? []);
});
api.get("/profiles/faculty/", requireRole("ADMIN", "HOD"), async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, email, first_name, last_name, role, department_id FROM profiles WHERE role IN ('FACULTY', 'HOD', 'ADMIN') AND is_active = 1 ORDER BY first_name, last_name"
  ).all();
  return c.json(rows.results ?? []);
});
var deptsRoute = crudRoute("departments", ["code", "name", "college_name", "university_name", "logo_url"], ["code"], true);
api.route("/departments", deptsRoute);
api.route("/departments/", deptsRoute);
var handleCreateAcademicYear = /* @__PURE__ */ __name(async (c) => {
  if (!isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  try {
    const body = await c.req.json();
    const newAy = await new BaseRepository(
      c.env.DB,
      "academic_years",
      ["name", "starts_on", "ends_on", "is_active"],
      ["is_active"]
    ).create(body);
    const countRes = await c.env.DB.prepare(
      "SELECT COUNT(*) AS count FROM academic_years WHERE id != ?"
    ).bind(newAy.id).first();
    const count = countRes?.count ?? 0;
    if (count === 0) {
      const depts = await c.env.DB.prepare("SELECT id FROM departments").all();
      for (const dept of depts.results ?? []) {
        const stmts = [];
        for (let semNumber = 1; semNumber <= 8; semNumber++) {
          const semId = crypto.randomUUID();
          stmts.push(
            c.env.DB.prepare(
              "INSERT INTO semesters (id, department_id, academic_year_id, number, title, ordinance) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(semId, dept.id, newAy.id, semNumber, `Semester ${semNumber}`, "")
          );
          const c1Id = crypto.randomUUID();
          stmts.push(
            c.env.DB.prepare(
              `INSERT INTO courses (id, semester_id, code, title, course_type, credits, lecture_hours, tutorial_hours, status)
               VALUES (?, ?, ?, ?, 'THEORY', 4, 3, 1, 'DRAFT')`
            ).bind(c1Id, semId, `SUB${semNumber}01`, `Subject ${semNumber}.1`)
          );
          const c2Id = crypto.randomUUID();
          stmts.push(
            c.env.DB.prepare(
              `INSERT INTO courses (id, semester_id, code, title, course_type, credits, practical_hours, status)
               VALUES (?, ?, ?, ?, 'LAB', 2, 4, 'DRAFT')`
            ).bind(c2Id, semId, `SUB${semNumber}02`, `Subject ${semNumber}.2 Lab`)
          );
        }
        await c.env.DB.batch(stmts);
      }
    }
    return c.json(newAy, 201);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes("UNIQUE constraint failed") || msg.includes("SQLITE_CONSTRAINT")) {
      return c.json({ detail: "A record with this identifier or semester number already exists for this selection." }, 400);
    }
    return c.json({ detail: msg }, 400);
  }
}, "handleCreateAcademicYear");
api.post("/academic-years", handleCreateAcademicYear);
api.post("/academic-years/", handleCreateAcademicYear);
var ayRoute = crudRoute("academic_years", ["name", "starts_on", "ends_on", "is_active"], ["is_active"], true);
api.route("/academic-years", ayRoute);
api.route("/academic-years/", ayRoute);
api.post("/academic-years/:id/rollover/", requireRole("ADMIN"), async (c) => {
  const targetAyId = c.req.param("id");
  try {
    const targetAy = await c.env.DB.prepare("SELECT * FROM academic_years WHERE id = ?").bind(targetAyId).first();
    if (!targetAy) return c.json({ detail: "Not found." }, 404);
    const priorYear = await c.env.DB.prepare("SELECT * FROM academic_years WHERE id != ? ORDER BY starts_on DESC LIMIT 1").bind(targetAyId).first();
    if (!priorYear) {
      return c.json({ message: "No prior academic year to clone from", semesters_cloned: 0, courses_cloned: 0 });
    }
    const priorSemesters = await c.env.DB.prepare("SELECT * FROM semesters WHERE academic_year_id = ?").bind(priorYear.id).all();
    let semestersCloned = 0;
    let coursesCloned = 0;
    for (const priorSem of priorSemesters.results ?? []) {
      const newSemId = crypto.randomUUID();
      const semResult = await c.env.DB.prepare(`
        INSERT INTO semesters (id, department_id, academic_year_id, number, title, ordinance)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(department_id, academic_year_id, number) DO NOTHING
        RETURNING *
      `).bind(newSemId, priorSem.department_id, targetAy.id, priorSem.number, priorSem.title, priorSem.ordinance).first();
      if (!semResult) continue;
      const insertedSemId = semResult.id;
      semestersCloned++;
      const priorCourses = await c.env.DB.prepare("SELECT * FROM courses WHERE semester_id = ?").bind(priorSem.id).all();
      for (const origCourse of priorCourses.results ?? []) {
        const newCourseId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO courses (
            id, semester_id, code, title, course_type,
            lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
            lecture_credits, tutorial_credits, practical_credits, credits,
            internal_marks, external_marks, duration_hours, passing_marks,
            objectives, pre_requisites, syllabus_intro, online_resources, section_order,
            status, faculty_user_id, approved_by_user_id
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            'DRAFT', NULL, NULL
          )
        `).bind(
          newCourseId,
          insertedSemId,
          origCourse.code,
          origCourse.title,
          origCourse.course_type,
          origCourse.lecture_hours,
          origCourse.tutorial_hours,
          origCourse.practical_hours,
          origCourse.self_learning_hours,
          origCourse.lecture_credits,
          origCourse.tutorial_credits,
          origCourse.practical_credits,
          origCourse.credits,
          origCourse.internal_marks,
          origCourse.external_marks,
          origCourse.duration_hours,
          origCourse.passing_marks,
          origCourse.objectives,
          origCourse.pre_requisites,
          origCourse.syllabus_intro,
          origCourse.online_resources,
          origCourse.section_order
        ).run();
        coursesCloned++;
        const cloneChild = /* @__PURE__ */ __name(async (table, parentCol, origParentId, newParentId, fields) => {
          const rows = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE ${parentCol} = ?`).bind(origParentId).all();
          if (!rows.results?.length) return;
          const stmts = rows.results.map((row) => {
            const newId = crypto.randomUUID();
            const cols = ["id", parentCol, ...fields];
            const vals = [newId, newParentId, ...fields.map((f) => row[f])];
            const qs = cols.map(() => "?").join(", ");
            return c.env.DB.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${qs})`).bind(...vals);
          });
          await c.env.DB.batch(stmts);
        }, "cloneChild");
        await cloneChild("course_outcomes", "course_id", origCourse.id, newCourseId, ["code", "description", "bloom_level", "sort_order"]);
        await cloneChild("assessment_schemes", "course_id", origCourse.id, newCourseId, ["component", "marks", "description", "sort_order"]);
        await cloneChild("reference_books", "course_id", origCourse.id, newCourseId, ["title", "authors", "publisher", "edition", "year", "is_textbook", "sort_order"]);
        const oldModules = await c.env.DB.prepare("SELECT * FROM modules WHERE course_id = ?").bind(origCourse.id).all();
        if (oldModules.results?.length) {
          const modStmts = [];
          const modMap = /* @__PURE__ */ new Map();
          for (const m of oldModules.results) {
            const nmId = crypto.randomUUID();
            modMap.set(m.id, nmId);
            modStmts.push(c.env.DB.prepare(`INSERT INTO modules (id, course_id, number, title, contact_hours, content, references) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(nmId, newCourseId, m.number, m.title, m.contact_hours, m.content, m.references));
          }
          await c.env.DB.batch(modStmts);
          const topicStmts = [];
          for (const m of oldModules.results) {
            const nModId = modMap.get(m.id);
            const oldTopics = await c.env.DB.prepare("SELECT * FROM topics WHERE module_id = ?").bind(m.id).all();
            for (const t of oldTopics.results ?? []) {
              topicStmts.push(c.env.DB.prepare(`INSERT INTO topics (id, module_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), nModId, t.title, t.description, t.sort_order));
            }
          }
          if (topicStmts.length > 0) {
            const batches = [];
            for (let i = 0; i < topicStmts.length; i += 100) batches.push(topicStmts.slice(i, i + 100));
            for (const b of batches) await c.env.DB.batch(b);
          }
        }
      }
    }
    return c.json({
      message: "Rollover complete",
      source_academic_year: priorYear.name,
      target_academic_year: targetAy.name,
      semesters_cloned: semestersCloned,
      courses_cloned: coursesCloned
    });
  } catch (e) {
    console.error("Rollover failed", e);
    return c.json({ detail: "Rollover failed: " + e.message }, 500);
  }
});
var semestersRoute = crudRoute("semesters", ["department_id", "academic_year_id", "number", "title", "ordinance"], ["department_id", "academic_year_id", "number"], true);
api.route("/semesters", semestersRoute);
api.route("/semesters/", semestersRoute);
var templatesRoute = crudRoute("curriculum_templates", ["department_id", "name", "html_template", "css", "template_pdf_url", "is_active"], ["department_id", "is_active"], true);
api.route("/curriculum-templates", templatesRoute);
api.route("/curriculum-templates/", templatesRoute);
api.get("/notifications/", async (c) => {
  const user = c.get("user");
  const rows = await c.env.DB.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC").bind(user.id).all();
  return c.json(rows.results ?? []);
});
api.get("/notifications/:id/", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM notifications WHERE id = ?").bind(id).first();
  if (!row) return c.json({ detail: "Not found." }, 404);
  if (row.user_id !== user.id) return c.json({ detail: "Permission denied." }, 403);
  return c.json(row);
});
api.post("/notifications/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const targetUserId = body.user_id ?? user.id;
  if (targetUserId !== user.id && !isAcademicAdmin(user)) {
    return c.json({ detail: "Permission denied." }, 403);
  }
  const id = crypto.randomUUID();
  const row = await c.env.DB.prepare(`
    INSERT INTO notifications (id, user_id, title, body, link, is_read)
    VALUES (?, ?, ?, ?, ?, 0) RETURNING *
  `).bind(id, targetUserId, body.title ?? "", body.body ?? "", body.link ?? "").first();
  return c.json(row, 201);
});
api.patch("/notifications/:id/", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM notifications WHERE id = ?").bind(id).first();
  if (!row) return c.json({ detail: "Not found." }, 404);
  if (row.user_id !== user.id) return c.json({ detail: "Permission denied." }, 403);
  const body = await c.req.json();
  const isRead = body.is_read !== void 0 ? body.is_read ? 1 : 0 : row.is_read;
  const updated = await c.env.DB.prepare(`
    UPDATE notifications
    SET is_read = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? RETURNING *
  `).bind(isRead, id).first();
  return c.json(updated);
});
api.put("/notifications/:id/", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM notifications WHERE id = ?").bind(id).first();
  if (!row) return c.json({ detail: "Not found." }, 404);
  if (row.user_id !== user.id) return c.json({ detail: "Permission denied." }, 403);
  const body = await c.req.json();
  const isRead = body.is_read !== void 0 ? body.is_read ? 1 : 0 : row.is_read;
  const title = body.title !== void 0 ? body.title : row.title;
  const bodyText = body.body !== void 0 ? body.body : row.body;
  const link = body.link !== void 0 ? body.link : row.link;
  const updated = await c.env.DB.prepare(`
    UPDATE notifications
    SET is_read = ?, title = ?, body = ?, link = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? RETURNING *
  `).bind(isRead, title, bodyText, link, id).first();
  return c.json(updated);
});
api.delete("/notifications/:id/", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM notifications WHERE id = ?").bind(id).first();
  if (!row) return c.json({ detail: "Not found." }, 404);
  if (row.user_id !== user.id) return c.json({ detail: "Permission denied." }, 403);
  await c.env.DB.prepare("DELETE FROM notifications WHERE id = ?").bind(id).run();
  return c.body(null, 204);
});
api.get("/courses/", async (c) => c.json(await new CoursesRepository(c.env.DB).list(Object.fromEntries(new URL(c.req.url).searchParams))));
api.post("/courses/", async (c) => {
  if (!isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  const course = await new CoursesRepository(c.env.DB).create(await c.req.json());
  await createCourseVersion(c.env.DB, course.id, c.get("user"), "Course created");
  return c.json(course, 201);
});
api.get("/courses/:id/", async (c) => {
  const course = await new CoursesRepository(c.env.DB).detail(c.req.param("id"));
  return course ? c.json(course) : c.json({ detail: "Not found." }, 404);
});
api.put("/courses/:id/", async (c) => updateCourse(c));
api.patch("/courses/:id/", async (c) => updateCourse(c));
var handleAssignFaculty = /* @__PURE__ */ __name(async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const facultyUserId = body.faculty_user_id !== void 0 ? body.faculty_user_id : null;
  const course = await c.env.DB.prepare("UPDATE courses SET faculty_user_id = ? WHERE id = ? RETURNING *").bind(facultyUserId, c.req.param("id")).first();
  if (!course) {
    return c.json({ detail: "Course not found." }, 404);
  }
  return c.json(course);
}, "handleAssignFaculty");
api.patch("/courses/:id/assign-faculty", requireRole("ADMIN", "HOD"), handleAssignFaculty);
api.patch("/courses/:id/assign-faculty/", requireRole("ADMIN", "HOD"), handleAssignFaculty);
api.post("/courses/:id/submit/", async (c) => {
  const course = await c.env.DB.prepare("UPDATE courses SET status = 'SUBMITTED' WHERE id = ? RETURNING *").bind(c.req.param("id")).first();
  if (!course) return c.json({ detail: "Not found." }, 404);
  await createCourseVersion(c.env.DB, course.id, c.get("user"), "Submitted for review");
  return c.json(await new CoursesRepository(c.env.DB).detail(course.id));
});
api.post("/courses/:id/reopen/", async (c) => {
  if (!isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  const course = await c.env.DB.prepare("UPDATE courses SET status = 'CHANGES_REQUESTED', approved_by_user_id = NULL, approved_at = NULL WHERE id = ? RETURNING *").bind(c.req.param("id")).first();
  if (!course) return c.json({ detail: "Not found." }, 404);
  await createCourseVersion(c.env.DB, course.id, c.get("user"), "Reopened by administrator");
  return c.json(await new CoursesRepository(c.env.DB).detail(course.id));
});
api.post("/courses/:id/share/", async (c) => {
  if (!isReviewerOrAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  const token = crypto.randomUUID();
  const course = await c.env.DB.prepare("UPDATE courses SET share_token = ? WHERE id = ? RETURNING *").bind(token, c.req.param("id")).first();
  if (!course) return c.json({ detail: "Not found." }, 404);
  return c.json({ share_token: course.share_token });
});
api.get("/courses/:id/versions/", async (c) => {
  const rows = await c.env.DB.prepare("SELECT cv.*, trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) AS edited_by_name FROM course_versions cv LEFT JOIN profiles p ON p.id = cv.edited_by_user_id WHERE cv.course_id = ? ORDER BY cv.version_number DESC").bind(c.req.param("id")).all();
  return c.json(rows.results ?? []);
});
api.post("/courses/:id/compare_versions/", async (c) => {
  const body = await c.req.json();
  const a = await c.env.DB.prepare("SELECT * FROM course_versions WHERE course_id = ? AND id = ?").bind(c.req.param("id"), body.version_a).first();
  const b = await c.env.DB.prepare("SELECT * FROM course_versions WHERE course_id = ? AND id = ?").bind(c.req.param("id"), body.version_b).first();
  if (!a || !b) return c.json({ detail: "Version not found." }, 404);
  const left = JSON.parse(a.snapshot);
  const right = JSON.parse(b.snapshot);
  return c.json({ version_a: { id: a.id, number: a.version_number, summary: a.change_summary }, version_b: { id: b.id, number: b.version_number, summary: b.change_summary }, changes: diffSnapshots(left, right), left, right });
});
api.get("/courses/:id/compare_previous_year/", async (c) => {
  const courseId = c.req.param("id");
  const db = c.env.DB;
  const courseRepo = new CoursesRepository(db);
  const currentCourse = await courseRepo.detail(courseId);
  if (!currentCourse) {
    return c.json({ detail: "Course not found." }, 404);
  }
  const currentSemester = await db.prepare("SELECT * FROM semesters WHERE id = ?").bind(currentCourse.semester_id).first();
  if (!currentSemester) {
    return c.json({ detail: "Current semester not found." }, 404);
  }
  const currentAy = await db.prepare("SELECT * FROM academic_years WHERE id = ?").bind(currentSemester.academic_year_id).first();
  if (!currentAy) {
    return c.json({ detail: "Current academic year not found." }, 404);
  }
  const priorCourses = await db.prepare(`
    SELECT c.id, ay.name as academic_year_name, ay.starts_on
    FROM courses c
    JOIN semesters s ON s.id = c.semester_id
    JOIN academic_years ay ON ay.id = s.academic_year_id
    WHERE c.code = ?
      AND s.department_id = ?
      AND ay.starts_on < ?
    ORDER BY ay.starts_on DESC
  `).bind(currentCourse.code, currentSemester.department_id, currentAy.starts_on).all();
  const results = priorCourses.results ?? [];
  if (results.length === 0) {
    return c.json({ detail: "No previous year's syllabus found for this course code." }, 404);
  }
  const prevCourseRow = results[0];
  const prevCourse = await courseRepo.detail(prevCourseRow.id);
  if (!prevCourse) {
    return c.json({ detail: "Failed to load previous year's course details." }, 500);
  }
  const changes = diffSnapshots(prevCourse, currentCourse);
  return c.json({
    current: currentCourse,
    previous: prevCourse,
    previous_academic_year_name: prevCourseRow.academic_year_name,
    changes
  });
});
api.post("/courses/:id/rollback/", async (c) => {
  if (!isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  const body = await c.req.json();
  const version = await c.env.DB.prepare("SELECT * FROM course_versions WHERE course_id = ? AND id = ?").bind(c.req.param("id"), body.version_id).first();
  if (!version) return c.json({ detail: "Version not found." }, 404);
  const snapshot = JSON.parse(version.snapshot);
  await new CoursesRepository(c.env.DB).update(c.req.param("id"), snapshot.course ?? snapshot);
  await createCourseVersion(c.env.DB, c.req.param("id"), c.get("user"), `Rolled back to version ${version.version_number}`);
  return c.json(await new CoursesRepository(c.env.DB).detail(c.req.param("id")));
});
api.post("/courses/:id/autosave/", async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();
  await syncCourse(c.env.DB, id, data);
  await createCourseVersion(c.env.DB, id, c.get("user"), data.change_summary ?? "Autosaved draft");
  return c.json({ status: "saved", course: await new CoursesRepository(c.env.DB).detail(id) });
});
api.get("/reviewer-comments/", async (c) => c.json(await new ReviewerRepository(c.env.DB).list(Object.fromEntries(new URL(c.req.url).searchParams))));
api.post("/reviewer-comments/", async (c) => {
  if (!isReviewerOrAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  const row = await new ReviewerRepository(c.env.DB).create({ ...await c.req.json(), reviewer_user_id: c.get("user").id });
  return c.json(row, 201);
});
api.post("/reviewer-comments/:id/resolve/", async (c) => c.json(await new ReviewerRepository(c.env.DB).update(c.req.param("id"), { is_resolved: 1, resolved_by_user_id: c.get("user").id, resolved_at: (/* @__PURE__ */ new Date()).toISOString() })));
api.get("/approval-workflows/", async (c) => c.json(await new WorkflowRepository(c.env.DB).list(Object.fromEntries(new URL(c.req.url).searchParams))));
api.post("/approval-workflows/", async (c) => {
  if (!isReviewerOrAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  const body = await c.req.json();
  const transitions = { REQUEST_CHANGES: "CHANGES_REQUESTED", APPROVE: "APPROVED", REJECT: "CHANGES_REQUESTED", PUBLISH: "PUBLISHED" };
  const course = await c.env.DB.prepare("SELECT * FROM courses WHERE id = ?").bind(body.course).first();
  if (!course) return c.json({ detail: "Course not found." }, 404);
  const to = transitions[body.decision];
  await c.env.DB.prepare("UPDATE courses SET status = ?, approved_by_user_id = CASE WHEN ? = 'APPROVED' THEN ? ELSE approved_by_user_id END, approved_at = CASE WHEN ? = 'APPROVED' THEN CURRENT_TIMESTAMP ELSE approved_at END WHERE id = ?").bind(to, to, c.get("user").id, to, body.course).run();
  const workflow = await new WorkflowRepository(c.env.DB).create({ course_id: body.course, actor_user_id: c.get("user").id, from_status: course.status, to_status: to, decision: body.decision, note: body.note ?? "" });
  await createCourseVersion(c.env.DB, body.course, c.get("user"), `Workflow decision: ${body.decision}`);
  return c.json(workflow, 201);
});
api.get("/published-curricula/", async (c) => c.json(await new BaseRepository(c.env.DB, "published_curricula", [], ["department_id", "academic_year_id", "is_public", "year_of_study"]).list(Object.fromEntries(new URL(c.req.url).searchParams))));
api.get("/published-curricula/archive/", requireRole("HOD", "ADMIN"), async (c) => {
  const user = c.get("user");
  let query = `
    SELECT 
      pc.*,
      ay.name as academic_year_name,
      d.name as department_name,
      d.code as department_code
    FROM published_curricula pc
    JOIN academic_years ay ON pc.academic_year_id = ay.id
    JOIN departments d ON pc.department_id = d.id
  `;
  const params = [];
  if (user.role === "HOD" && user.department_id) {
    query += " WHERE pc.department_id = ?";
    params.push(user.department_id);
  }
  query += " ORDER BY ay.starts_on DESC, pc.year_of_study ASC";
  const rows = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(rows.results ?? []);
});
api.get("/published-curricula/:id/download/", async (c) => {
  const id = c.req.param("id");
  const key = `published/${id}.pdf`;
  if (!c.env.BUCKET) {
    return c.text("Bucket not bound", 500);
  }
  const object = await c.env.BUCKET.get(key);
  if (!object) {
    return c.text("PDF not found", 404);
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", `attachment; filename="curriculum-${id}.pdf"`);
  return new Response(object.body, { headers });
});
api.post("/published-curricula/publish/", async (c) => {
  if (!isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  const body = await c.req.json();
  const YEAR_SEM_MAP = {
    FE: [1, 2],
    SE: [3, 4],
    TE: [5, 6],
    BE: [7, 8]
  };
  if (!body.year_of_study || !YEAR_SEM_MAP[body.year_of_study]) {
    return c.json({ detail: "Invalid or missing year_of_study" }, 400);
  }
  const sems = YEAR_SEM_MAP[body.year_of_study];
  const template = await c.env.DB.prepare("SELECT * FROM curriculum_templates WHERE id = ?").bind(body.template).first();
  if (!template) return c.json({ detail: "Template not found." }, 404);
  const count = await c.env.DB.prepare("SELECT count(*) AS n FROM courses c JOIN semesters s ON s.id = c.semester_id WHERE s.department_id = ? AND s.academic_year_id = ? AND s.number IN (?,?) AND c.status IN ('APPROVED','PUBLISHED')").bind(body.department, body.academic_year, sems[0], sems[1]).first();
  const printUrl = `/print/final?department=${encodeURIComponent(body.department)}&academic_year=${encodeURIComponent(body.academic_year)}&year_of_study=${encodeURIComponent(body.year_of_study)}&version=${encodeURIComponent(body.version_label ?? "v1")}`;
  const published = await c.env.DB.prepare(`
    INSERT INTO published_curricula (department_id, academic_year_id, template_id, published_by_user_id, print_url, pdf_url, version_label, template_snapshot, render_metrics, year_of_study)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
  `).bind(
    body.department,
    body.academic_year,
    body.template,
    c.get("user").id,
    printUrl,
    "",
    body.version_label ?? "v1",
    JSON.stringify({ css: template.css, html_template: template.html_template, name: template.name }),
    JSON.stringify({ status: "queued", course_count: count?.n ?? 0, export: "pdf-render" }),
    body.year_of_study
  ).first();
  await c.env.DB.prepare("UPDATE courses SET status = 'PUBLISHED' WHERE id IN (SELECT c.id FROM courses c JOIN semesters s ON s.id = c.semester_id WHERE s.department_id = ? AND s.academic_year_id = ? AND s.number IN (?,?) AND c.status IN ('APPROVED','PUBLISHED'))").bind(body.department, body.academic_year, sems[0], sems[1]).run();
  await c.env.DB.prepare("UPDATE curriculum_templates SET is_locked = 1 WHERE id = ?").bind(body.template).run();
  c.executionCtx.waitUntil(
    generatePdfTask(c.env, published.id, body.department, body.academic_year, body.version_label ?? "v1", body.year_of_study)
  );
  return c.json(published, 202);
});
api.post("/published-curricula/:id/hod-approve/", requireRole("HOD", "ADMIN"), async (c) => {
  const { id } = c.req.param();
  const user = c.get("user");
  const curriculum = await c.env.DB.prepare(
    "SELECT * FROM published_curricula WHERE id = ?"
  ).bind(id).first();
  if (!curriculum) return c.json({ detail: "Not found." }, 404);
  if (user.role === "HOD" && curriculum.department_id !== user.department_id) {
    return c.json({ detail: "Permission denied." }, 403);
  }
  await c.env.DB.prepare(
    "UPDATE published_curricula SET hod_approved_at = ?, hod_approved_by = ? WHERE id = ?"
  ).bind((/* @__PURE__ */ new Date()).toISOString(), user.id, id).run();
  return c.json({ status: "approved" });
});
app.get("/public/review/:token/", async (c) => {
  const row = await c.env.DB.prepare("SELECT id, status FROM courses WHERE share_token = ?").bind(c.req.param("token")).first();
  if (!row) return c.json({ detail: "This review link is invalid or has expired.", code: "TOKEN_INVALID" }, 404);
  if (row.status === "DRAFT") return c.json({ detail: "This syllabus is not yet ready for review.", code: "SYLLABUS_DRAFT" }, 400);
  const course = await new CoursesRepository(c.env.DB).detail(row.id);
  return c.json(course);
});
app.get("/public/review/:token/comments/", async (c) => {
  const row = await c.env.DB.prepare("SELECT id, status FROM courses WHERE share_token = ?").bind(c.req.param("token")).first();
  if (!row) return c.json({ detail: "This review link is invalid or has expired.", code: "TOKEN_INVALID" }, 404);
  const comments = await c.env.DB.prepare("SELECT * FROM reviewer_comments WHERE course_id = ? ORDER BY created_at DESC").bind(row.id).all();
  return c.json(comments.results ?? []);
});
app.post("/public/review/:token/comments/", async (c) => {
  const body = await c.req.json();
  const row = await c.env.DB.prepare("SELECT id, status FROM courses WHERE share_token = ?").bind(c.req.param("token")).first();
  if (!row) return c.json({ detail: "This review link is invalid or has expired.", code: "TOKEN_INVALID" }, 404);
  if (row.status === "DRAFT") return c.json({ detail: "This syllabus is not yet ready for review.", code: "SYLLABUS_DRAFT" }, 400);
  if (!body.reviewer_name || !body.body) return c.json({ detail: "Name and comments are required.", code: "FEEDBACK_INVALID" }, 400);
  const comment = await c.env.DB.prepare(`
    INSERT INTO reviewer_comments (id, course_id, section_key, section_label, body, is_external, reviewer_name, reviewer_email)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?) RETURNING *
  `).bind(
    crypto.randomUUID(),
    row.id,
    body.section_key || "General",
    body.section_label || "General",
    body.body,
    body.reviewer_name,
    body.reviewer_email ?? null
  ).first();
  return c.json(comment, 201);
});
app.onError((err, c) => {
  console.error("Backend error:", err);
  const message = err.message || "An unexpected server error occurred.";
  if (message.includes("UNIQUE constraint failed") || message.includes("SQLITE_CONSTRAINT")) {
    return c.json({ detail: "A record with this number/code already exists for this selection." }, 400);
  }
  return c.json({ detail: message }, 400);
});
app.route("/api", api);
async function updateCourse(c) {
  const body = await c.req.json();
  const course = await new CoursesRepository(c.env.DB).update(c.req.param("id"), body);
  await createCourseVersion(c.env.DB, course.id, c.get("user"), body.change_summary ?? "Course updated");
  return c.json(await new CoursesRepository(c.env.DB).detail(course.id));
}
__name(updateCourse, "updateCourse");
async function syncCourse(db, courseId, data) {
  await new CoursesRepository(db).update(courseId, data);
  await syncChildren(db, "course_outcomes", "course_id", courseId, data.outcomes, ["code", "description", "bloom_level", "sort_order"], (item, i) => ({ ...item, sort_order: item.sort_order ?? item.order ?? i + 1 }));
  await syncChildren(db, "experiments", "course_id", courseId, data.experiments, ["number", "title", "description", "hours"]);
  await syncChildren(db, "assessment_schemes", "course_id", courseId, data.assessments, ["component", "marks", "description", "sort_order"], (item, i) => ({ ...item, sort_order: item.sort_order ?? item.order ?? i + 1 }));
  await syncChildren(db, "reference_books", "course_id", courseId, data.reference_books ?? data.references, ["title", "authors", "publisher", "edition", "year", "is_textbook", "sort_order"], (item, i) => ({ ...item, sort_order: item.sort_order ?? item.order ?? i + 1 }));
  if (data.modules) {
    await syncChildren(db, "modules", "course_id", courseId, data.modules, ["number", "title", "contact_hours", "content", "references"], void 0, async (module, row) => {
      await syncChildren(db, "topics", "module_id", String(row.id), module.topics, ["title", "description", "sort_order"], (item, i) => ({ ...item, sort_order: item.sort_order ?? item.order ?? i + 1 }));
    });
  }
}
__name(syncCourse, "syncCourse");
async function syncChildren(db, table, parentColumn, parentId, items, fields, mapItem = (item, _i) => item, afterUpsert) {
  if (!items) return;
  const existing = await db.prepare(`SELECT id FROM ${table} WHERE ${parentColumn} = ?`).bind(parentId).all();
  const seen = /* @__PURE__ */ new Set();
  for (let i = 0; i < items.length; i++) {
    const item = mapItem(items[i], i);
    const columns = [parentColumn, ...fields].filter((field) => field === parentColumn || item[field] !== void 0);
    const values = columns.map((field) => field === parentColumn ? parentId : normalizeValue(item[field]));
    let row;
    if (item.id) {
      const assignments = columns.filter((field) => field !== parentColumn).map((field) => `"${field}" = ?`).join(", ");
      row = await db.prepare(`UPDATE ${table} SET ${assignments} WHERE id = ? RETURNING *`).bind(...values.slice(1), item.id).first();
    } else {
      const quotedCols = columns.map((c) => `"${c}"`).join(", ");
      row = await db.prepare(`INSERT INTO ${table} (${quotedCols}) VALUES (${columns.map(() => "?").join(", ")}) RETURNING *`).bind(...values).first();
    }
    if (row?.id) seen.add(String(row.id));
    if (afterUpsert && row) await afterUpsert(item, row);
  }
  for (const row of existing.results ?? []) {
    if (!seen.has(String(row.id))) await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(row.id).run();
  }
}
__name(syncChildren, "syncChildren");
async function generatePdfTask(env, publishedId, departmentId, academicYearId, versionLabel, yearOfStudy) {
  console.log(`Processing background PDF generation for publishedId: ${publishedId}`);
  try {
    await env.DB.prepare(`
      UPDATE published_curricula
      SET render_metrics = json_patch(render_metrics, ?)
      WHERE id = ?
    `).bind(JSON.stringify({ status: "processing", started_at: (/* @__PURE__ */ new Date()).toISOString() }), publishedId).run();
    if (!env.BROWSERLESS_API_TOKEN) {
      throw new Error("BROWSERLESS_API_TOKEN is not configured.");
    }
    const frontendUrl = env.FRONTEND_URL ?? "http://localhost:3000";
    const targetUrl = yearOfStudy ? `${frontendUrl}/print/final?department=${encodeURIComponent(departmentId)}&academic_year=${encodeURIComponent(academicYearId)}&year_of_study=${encodeURIComponent(yearOfStudy)}&version=${encodeURIComponent(versionLabel)}` : `${frontendUrl}/print/final?department=${encodeURIComponent(departmentId)}&academic_year=${encodeURIComponent(academicYearId)}&version=${encodeURIComponent(versionLabel)}`;
    console.log(`Requesting PDF from Browserless for URL: ${targetUrl}`);
    const headerTemplate = `
      <div style="font-size: 8pt; width: 100%; border-bottom: 0.5pt solid #000; padding-bottom: 4px; margin: 0 12mm; display: flex; align-items: center; justify-content: space-between; font-family: 'Times New Roman', serif;">
        <div style="display: flex; align-items: center;">
          <span style="font-weight: bold; font-size: 9pt;">FR. CONCEICAO RODRIGUES COLLEGE OF ENGINEERING</span>
        </div>
        <div style="text-align: right; font-style: italic; font-size: 7.5pt;">
          Autonomous College affiliated to University of Mumbai
        </div>
      </div>
    `;
    const footerTemplate = `
      <div style="font-size: 8pt; width: 100%; margin: 0 12mm; text-align: center; display: flex; justify-content: space-between; font-family: 'Times New Roman', serif; border-top: 0.5pt solid #ccc; padding-top: 4px;">
        <span>Curriculum Handbook - ${versionLabel}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;
    const browserlessReq = {
      url: targetUrl,
      options: {
        format: "A4",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate,
        footerTemplate,
        margin: {
          top: "28mm",
          bottom: "18mm",
          left: "12mm",
          right: "12mm"
        }
      },
      gotoOptions: {
        waitUntil: "networkidle0"
      },
      waitFor: 'main[data-fonts-loaded="true"]'
    };
    const response = await fetch(`https://chrome.browserless.io/pdf?token=${env.BROWSERLESS_API_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(browserlessReq)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Browserless API failed with status ${response.status}: ${errorText}`);
    }
    const pdfBuffer = await response.arrayBuffer();
    const pdfKey = `published/${publishedId}.pdf`;
    await env.BUCKET.put(pdfKey, pdfBuffer, {
      httpMetadata: { contentType: "application/pdf" }
    });
    const pdfUrl = `/api/published-curricula/${publishedId}/download/`;
    await env.DB.prepare(`
      UPDATE published_curricula
      SET pdf_url = ?, render_metrics = json_patch(render_metrics, ?)
      WHERE id = ?
    `).bind(pdfUrl, JSON.stringify({ status: "completed", completed_at: (/* @__PURE__ */ new Date()).toISOString() }), publishedId).run();
    console.log(`Publishing completed successfully for publishedId: ${publishedId}`);
  } catch (err) {
    console.error(`Error rendering PDF in background task: ${err.message}`);
    await env.DB.prepare(`
      UPDATE published_curricula
      SET render_metrics = json_patch(render_metrics, ?)
      WHERE id = ?
    `).bind(JSON.stringify({ status: "failed", error: err.message, failed_at: (/* @__PURE__ */ new Date()).toISOString() }), publishedId).run();
  }
}
__name(generatePdfTask, "generatePdfTask");
var src_default = {
  fetch: app.fetch,
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      try {
        const { publishedId, departmentId, academicYearId, versionLabel, yearOfStudy } = message.body || {};
        if (publishedId) {
          await generatePdfTask(env, publishedId, departmentId, academicYearId, versionLabel, yearOfStudy);
        }
        message.ack();
      } catch (e) {
        console.error("Queue message processing error:", e);
        message.retry();
      }
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-53eUsX/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-53eUsX/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
