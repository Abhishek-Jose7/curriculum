import { CoursesRepository } from "../repositories/curriculum";
import type { AuthUser } from "../types";

export async function createCourseVersion(db: D1Database, courseId: string, user: AuthUser | null, changeSummary: string) {
  const latest = await db.prepare("SELECT id, version_number FROM course_versions WHERE course_id = ? ORDER BY version_number DESC LIMIT 1").bind(courseId).first<{ id: string; version_number: number }>();
  const snapshot = await new CoursesRepository(db).detail(courseId);
  const row = await db.prepare(`
    INSERT INTO course_versions (course_id, version_number, edited_by_user_id, previous_version_id, snapshot, change_summary)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(courseId, (latest?.version_number ?? 0) + 1, user?.id ?? null, latest?.id ?? null, JSON.stringify(snapshot), changeSummary).first();
  return row;
}

export function diffSnapshots(left: any, right: any) {
  const changes: Array<Record<string, unknown>> = [];
  const leftCourse = left?.course ?? left ?? {};
  const rightCourse = right?.course ?? right ?? {};
  const skip = new Set(["id", "semester_id", "semester", "created_at", "updated_at", "approved_at"]);
  for (const key of new Set([...Object.keys(leftCourse), ...Object.keys(rightCourse)])) {
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
