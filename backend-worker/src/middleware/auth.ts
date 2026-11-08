import type { Context, Next } from "hono";
import type { AuthUser, Env, Role, Variables } from "../types";

const encoder = new TextEncoder();

interface CacheEntry {
  user: AuthUser;
  expiresAt: number;
}

// In-memory cache for authenticated user profiles to eliminate repeated D1 queries on every request.
// Cache TTL: 60 seconds; capacity-capped to prevent isolate memory leaks.
const USER_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;

export function invalidateUserCache(userId?: string) {
  if (userId) {
    USER_CACHE.delete(userId);
  } else {
    USER_CACHE.clear();
  }
}

export async function requireAuth(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const path = c.req.path;
  // Token endpoints and public print/download endpoints are reachable without an access token.
  if (
    path === "/api/auth/token/" ||
    path === "/api/auth/token/refresh/" ||
    path === "/api/auth/token/revoke/" ||
    path === "/api/auth/logout/" ||
    (path.startsWith("/api/published-curricula/") && path.endsWith("/download/")) ||
    path.includes("/booklet-data")
  ) {
    await next();
    return;
  }
  const header = c.req.header("authorization") ?? "";
  const cookieHeader = c.req.header("cookie") ?? "";
  const cookieToken = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("curriculum_access="))
    ?.slice("curriculum_access=".length) ?? "";
  const token = (header.startsWith("Bearer ") ? header.slice(7) : "") || cookieToken;
  if (!token) return c.json({ detail: "Authentication credentials were not provided." }, 401);
  const payload = await verifyJwt(token, c.env.AUTH_JWT_SECRET);
  if (!payload?.sub) return c.json({ detail: "Invalid token." }, 401);
  const now = Date.now();
  const cached = USER_CACHE.get(payload.sub);
  let user: AuthUser | null = null;

  if (cached && cached.expiresAt > now) {
    user = cached.user;
  } else {
    user = await c.env.DB.prepare(
      "SELECT id, email, role, department_id, first_name, last_name, is_superuser FROM profiles WHERE id = ? AND is_active = 1"
    ).bind(payload.sub).first<AuthUser>();
    if (!user) {
      USER_CACHE.delete(payload.sub);
      return c.json({ detail: "User not found or inactive." }, 401);
    }
    if (USER_CACHE.size > 500) {
      const oldestKey = USER_CACHE.keys().next().value;
      if (oldestKey) USER_CACHE.delete(oldestKey);
    }
    USER_CACHE.set(payload.sub, { user, expiresAt: now + CACHE_TTL_MS });
  }
  c.set("user", user);
  await next();
}

export function isAcademicAdmin(user: AuthUser) {
  return user.is_superuser === 1 || user.role === "ADMIN" || user.role === "HOD";
}

export async function signJwt(payload: Record<string, unknown>, secret: string, ttlSeconds = 60 * 60) {
  if (!secret) throw new Error("AUTH_JWT_SECRET is not configured.");
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const header = { alg: "HS256", typ: "JWT" };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`;
  const signature = await hmac(unsigned, secret);
  return `${unsigned}.${signature}`;
}

export async function verifyJwt(token: string, secret: string): Promise<Record<string, any> | null> {
  try {
    if (!secret || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expected = await hmac(`${header}.${payload}`, secret);
    if (!timingSafeEqual(expected, signature)) return null;
    const decoded = JSON.parse(decodeBase64Url(payload));
    if (!decoded || typeof decoded !== "object") return null;
    const now = Math.floor(Date.now() / 1000);
    if (typeof decoded.exp !== "number" || decoded.exp <= now) return null;
    return decoded as Record<string, any>;
  } catch {
    // Malformed tokens are unauthenticated, never a server error.
    return null;
  }
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64url(signature);
}

/** Constant-time string comparison for signatures and PINs. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function base64url(value: string | ArrayBuffer) {
  const bytes = typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

export function requireRole(...roles: Role[]) {
  return async (
    c: Context<{ Bindings: Env; Variables: Variables }>,
    next: Next
  ) => {
    const user = c.get("user");
    if (!user || !roles.includes(user.role as Role)) {
      return c.json({ detail: "Permission denied." }, 403);
    }
    await next();
  };
}

export function requireSameDepartment(getCourseId: (c: Context<any>) => string) {
  return async (
    c: Context<{ Bindings: Env; Variables: Variables }>,
    next: Next
  ) => {
    const user = c.get("user");
    if (user.role === "HOD" && user.department_id) {
      const row = await c.env.DB.prepare(
        `SELECT s.department_id FROM courses co
         JOIN semesters s ON co.semester_id = s.id
         WHERE co.id = ?`
      )
        .bind(getCourseId(c))
        .first<{ department_id: string }>();
      if (!row || row.department_id !== user.department_id) {
        return c.json({ detail: "Cross-department access denied." }, 403);
      }
    }
    await next();
  };
}

/**
 * Minimal ownership/department metadata for a course. Loaded with a single
 * indexed join so authorization checks stay cheap on every course route.
 */
export type CourseScope = {
  id: string;
  status: string;
  faculty_user_id: string | null;
  department_id: string;
};

export async function loadCourseScope(db: D1Database, courseId: string): Promise<CourseScope | null> {
  return await db
    .prepare(
      `SELECT c.id, c.status, c.faculty_user_id, s.department_id
       FROM courses c
       JOIN semesters s ON s.id = c.semester_id
       WHERE c.id = ?`
    )
    .bind(courseId)
    .first<CourseScope>();
}

export function canViewCourse(user: AuthUser, scope: CourseScope): boolean {
  if (user.is_superuser === 1 || user.role === "ADMIN") return true;
  if (user.role === "HOD") return !!user.department_id && !!scope.department_id && String(user.department_id) === String(scope.department_id);
  return !!scope.faculty_user_id && scope.faculty_user_id === user.id;
}

export function canEditCourse(user: AuthUser, scope: CourseScope): boolean {
  // Editing follows the same ownership model as viewing: admins, the department
  // HOD, or the faculty member the course is assigned to.
  return canViewCourse(user, scope);
}

/** Rejects users who may not see a course they addressed directly by id. */
export async function requireCourseView(c: Context<{ Bindings: Env; Variables: Variables }>, courseId: string) {
  const scope = await loadCourseScope(c.env.DB, courseId);
  if (!scope) return { scope: null, response: c.json({ detail: "Not found." }, 404) };
  if (!canViewCourse(c.get("user"), scope)) {
    return { scope, response: c.json({ detail: "Permission denied." }, 403) };
  }
  return { scope, response: null };
}

/** Rejects users who may not modify a course they addressed directly by id. */
export async function requireCourseEdit(c: Context<{ Bindings: Env; Variables: Variables }>, courseId: string) {
  const scope = await loadCourseScope(c.env.DB, courseId);
  if (!scope) return { scope: null, response: c.json({ detail: "Not found." }, 404) };
  if (!canEditCourse(c.get("user"), scope)) {
    return { scope, response: c.json({ detail: "Permission denied." }, 403) };
  }
  return { scope, response: null };
}
