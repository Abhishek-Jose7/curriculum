import type { Context, Next } from "hono";
import type { AuthUser, Env, Role, Variables } from "../types";

const encoder = new TextEncoder();

export async function requireAuth(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const path = c.req.path;
  if (path.includes("/auth/token") || path.includes("/auth/logout")) {
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
  const user = await c.env.DB.prepare("SELECT id, email, role, department_id, first_name, last_name, is_superuser FROM profiles WHERE id = ? AND is_active = 1").bind(payload.sub).first<AuthUser>();
  if (!user) return c.json({ detail: "User not found or inactive." }, 401);
  c.set("user", user);
  await next();
}

export function isAcademicAdmin(user: AuthUser) {
  return user.is_superuser === 1 || user.role === "ADMIN" || user.role === "HOD";
}

export async function signJwt(payload: Record<string, unknown>, secret: string, ttlSeconds = 60 * 60) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const header = { alg: "HS256", typ: "JWT" };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`;
  const signature = await hmac(unsigned, secret);
  return `${unsigned}.${signature}`;
}

export async function verifyJwt(token: string, secret: string): Promise<Record<string, any> | null> {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  const expected = await hmac(`${header}.${payload}`, secret);
  if (expected !== signature) return null;
  const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
  return decoded;
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64url(signature);
}

function base64url(value: string | ArrayBuffer) {
  const bytes = typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

export function requireCourseAccessForReview(getCourseId: (c: Context<any>) => string) {
  return async (
    c: Context<{ Bindings: Env; Variables: Variables }>,
    next: Next
  ) => {
    const user = c.get("user");
    if (user.role === "ADMIN" || user.role === "HOD") {
      await next();
      return;
    }
    const row = await c.env.DB.prepare(
      "SELECT faculty_user_id FROM courses WHERE id = ?"
    )
      .bind(getCourseId(c))
      .first<{ faculty_user_id: string | null }>();
    if (!row || row.faculty_user_id !== user.id) {
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

