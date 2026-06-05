import type { Context, Next } from "hono";
import type { AuthUser, Env, Variables } from "../types";

const encoder = new TextEncoder();

export async function requireAuth(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
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

export function isReviewerOrAdmin(user: AuthUser) {
  return isAcademicAdmin(user) || user.role === "REVIEWER";
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
