import { Context, MiddlewareHandler } from "hono";

// Layer 1: In-Memory cache for super static constants (per isolate)
const memCache = new Map<string, { data: any; expiresAt: number }>();

export function memGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    if (entry) memCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function memSet(key: string, data: any, ttlSeconds: number) {
  memCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  if (memCache.size > 200) {
    const oldest = memCache.keys().next().value;
    if (oldest) memCache.delete(oldest);
  }
}

export function memClear(prefix?: string) {
  if (!prefix) {
    memCache.clear();
    return;
  }
  for (const k of memCache.keys()) {
    if (k.startsWith(prefix)) {
      memCache.delete(k);
    }
  }
}

// Layer 2: Cloudflare Edge Cache API middleware
export function cacheMiddleware(ttlSeconds: number = 60): MiddlewareHandler {
  return async (c: Context, next) => {
    // Only cache GET requests
    if (c.req.method !== "GET") {
      return next();
    }

    const cache = (caches as any).default;
    const cacheUrl = new URL(c.req.url);
    // Standardize URL to edge cache key
    const cacheKey = new Request(cacheUrl.toString(), {
      method: "GET",
      headers: {
        "Accept": c.req.header("Accept") || "application/json"
      }
    });

    try {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        const res = new Response(cachedResponse.body, cachedResponse);
        res.headers.set("X-CF-Cache-Status", "HIT");
        return res;
      }
    } catch (e) {
      // Ignore cache match error and proceed
    }

    await next();

    // Only cache successful 200 responses
    if (c.res.status === 200) {
      try {
        const responseToCache = c.res.clone();
        responseToCache.headers.set("Cache-Control", `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}`);
        c.executionCtx.waitUntil(cache.put(cacheKey, responseToCache));
        c.res.headers.set("X-CF-Cache-Status", "MISS");
      } catch (e) {
        // Ignore cache put error
      }
    }
  };
}

// Purge specific cache keys or URLs
export async function purgeEdgeCache(urls: string[], c?: Context) {
  try {
    const cache = (caches as any).default;
    const promises = urls.map(url => cache.delete(new Request(url, { method: "GET" })));
    if (c) {
      c.executionCtx.waitUntil(Promise.all(promises));
    } else {
      await Promise.all(promises);
    }
  } catch (e) {
    // Ignore cache purge error
  }
}
