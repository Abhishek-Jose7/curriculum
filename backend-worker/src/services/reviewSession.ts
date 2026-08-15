import { signJwt, verifyJwt } from "../middleware/auth";

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_TTL_SECONDS = 60 * 60 * 4; // 4 hours

export function generatePin(): string {
  // 2 random bytes -> 0..65535, mapped to 0000-9999 (zero-padded).
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  const n = ((bytes[0] << 8) | bytes[1]) % 10000;
  return n.toString().padStart(PIN_LENGTH, "0");
}

export function isLocked(course: { review_pin_locked_until: string | null }): boolean {
  if (!course.review_pin_locked_until) return false;
  return new Date(course.review_pin_locked_until).getTime() > Date.now();
}

export function lockoutSecondsRemaining(course: { review_pin_locked_until: string | null }): number {
  if (!course.review_pin_locked_until) return 0;
  const ms = new Date(course.review_pin_locked_until).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 1000));
}

export async function signReviewSession(
  secret: string,
  courseId: string,
  shareToken: string
): Promise<string> {
  return signJwt(
    { typ: "review_session", course_id: courseId, share_token: shareToken },
    secret,
    SESSION_TTL_SECONDS
  );
}

export async function verifyReviewSession(
  secret: string,
  token: string,
  courseId: string,
  currentShareToken: string
): Promise<boolean> {
  try {
    const payload = await verifyJwt(token, secret);
    return (
      payload?.typ === "review_session" &&
      payload.course_id === courseId &&
      payload.share_token === currentShareToken
    );
  } catch {
    return false;
  }
}

export async function generateReviewLinkIfMissing(db: D1Database, courseId: string): Promise<void> {
  const course = await db.prepare("SELECT share_token FROM courses WHERE id = ?").bind(courseId).first<{ share_token: string | null }>();
  if (course && !course.share_token) {
    const shareToken = crypto.randomUUID();
    const pin = generatePin();
    await db.prepare(
      `UPDATE courses SET share_token = ?, review_pin = ?, review_link_generated_at = ?,
       review_pin_failed_attempts = 0, review_pin_locked_until = NULL WHERE id = ?`
    ).bind(shareToken, pin, new Date().toISOString(), courseId).run();
  }
}

export const REVIEW_PIN_CONSTANTS = { MAX_ATTEMPTS, LOCKOUT_MINUTES };
