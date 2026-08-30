import type { SubVertical } from "../types/scheme";
import { STUDY_YEAR_MARKER } from "../types/scheme";
import { createCourseVersion } from "./courseVersions";

export interface PreviousMatchSummary {
  course_id: string;
  title: string;
  entering_year: string;
  scheme_id: string;
}

export async function generateCourseCode(
  db: D1Database,
  params: {
    scheme_id: string;
    scheme_year_code: string;
    sub_vertical: SubVertical;
    semester_number: number;
    program_code: string;
  }
): Promise<string> {
  const study_year = STUDY_YEAR_MARKER[params.semester_number] || "11";
  const prefix = `${params.scheme_year_code}${params.sub_vertical}${study_year}${params.program_code}`;

  const rows = await db
    .prepare(
      `SELECT c.code
       FROM courses c
       JOIN semesters s ON c.semester_id = s.id
       WHERE s.scheme_id = ? AND c.code LIKE ? || '%'`
    )
    .bind(params.scheme_id, prefix)
    .all<{ code: string }>();

  let maxSerial = 0;
  for (const row of rows.results ?? []) {
    const code = row.code || "";
    if (code.startsWith(prefix)) {
      const serialPart = code.slice(prefix.length);
      const parsed = parseInt(serialPart, 10);
      if (!isNaN(parsed) && parsed > maxSerial) {
        maxSerial = parsed;
      }
    }
  }

  const nextSerial = maxSerial + 1;
  if (nextSerial > 99) {
    throw new Error("SERIAL_EXHAUSTED");
  }

  const paddedSerial = String(nextSerial).padStart(2, "0");
  return `${prefix}${paddedSerial}`;
}

export async function findPreviousMatches(
  db: D1Database,
  course_id: string
): Promise<PreviousMatchSummary[]> {
  const course = await db
    .prepare(
      `SELECT c.id, c.code, c.code_is_custom, s.scheme_id, cs.department_id
       FROM courses c
       JOIN semesters s ON c.semester_id = s.id
       JOIN curriculum_schemes cs ON s.scheme_id = cs.id
       WHERE c.id = ?`
    )
    .bind(course_id)
    .first<{
      id: string;
      code: string;
      code_is_custom: number;
      scheme_id: string;
      department_id: string;
    }>();

  if (!course || !course.code || course.code.length < 3) {
    return [];
  }

  if (course.code_is_custom === 1) {
    const customCodePattern = /^\d{2}([A-Z]+)(\d{2})([A-Z]{2})(\d{2})$/;
    if (!customCodePattern.test(course.code)) {
      return [];
    }
  }

  const suffix = course.code.slice(2);

  const matches = await db
    .prepare(
      `SELECT c.id AS course_id, c.title, cs.entering_year, cs.id AS scheme_id
       FROM courses c
       JOIN semesters s ON c.semester_id = s.id
       JOIN curriculum_schemes cs ON s.scheme_id = cs.id
       WHERE cs.department_id = ? AND cs.id != ? AND SUBSTR(c.code, 3) = ?
       ORDER BY cs.entering_year DESC`
    )
    .bind(course.department_id, course.scheme_id, suffix)
    .all<PreviousMatchSummary>();

  return matches.results ?? [];
}

export async function copyDetailedContent(
  db: D1Database,
  targetCourseId: string,
  sourceCourseId: string,
  actorUserId: string
): Promise<void> {
  const sourceCourse = await db
    .prepare(
      `SELECT c.*, cs.entering_year
       FROM courses c
       JOIN semesters s ON c.semester_id = s.id
       LEFT JOIN curriculum_schemes cs ON s.scheme_id = cs.id
       WHERE c.id = ?`
    )
    .bind(sourceCourseId)
    .first<any>();

  if (!sourceCourse) {
    throw new Error("Source course not found");
  }

  const [outcomes, modules, experiments, assessments, references] = await Promise.all([
    db.prepare("SELECT * FROM course_outcomes WHERE course_id = ? ORDER BY sort_order ASC").bind(sourceCourseId).all<any>(),
    db.prepare("SELECT * FROM modules WHERE course_id = ? ORDER BY number ASC").bind(sourceCourseId).all<any>(),
    db.prepare("SELECT * FROM experiments WHERE course_id = ? ORDER BY number ASC").bind(sourceCourseId).all<any>(),
    db.prepare("SELECT * FROM assessment_schemes WHERE course_id = ? ORDER BY sort_order ASC").bind(sourceCourseId).all<any>(),
    db.prepare("SELECT * FROM reference_books WHERE course_id = ? ORDER BY sort_order ASC").bind(sourceCourseId).all<any>(),
  ]);

  const sourceModules = modules.results ?? [];
  const moduleIds = sourceModules.map((m) => m.id);
  let sourceTopics: any[] = [];
  if (moduleIds.length > 0) {
    const placeholders = moduleIds.map(() => "?").join(",");
    const topicsRes = await db
      .prepare(`SELECT * FROM topics WHERE module_id IN (${placeholders}) ORDER BY sort_order ASC`)
      .bind(...moduleIds)
      .all<any>();
    sourceTopics = topicsRes.results ?? [];
  }

  const topicsByModule = new Map<string, any[]>();
  for (const t of sourceTopics) {
    if (!topicsByModule.has(t.module_id)) {
      topicsByModule.set(t.module_id, []);
    }
    topicsByModule.get(t.module_id)!.push(t);
  }

  const existingTargetModules = await db
    .prepare("SELECT id FROM modules WHERE course_id = ?")
    .bind(targetCourseId)
    .all<{ id: string }>();
  const targetModuleIds = (existingTargetModules.results ?? []).map((m) => m.id);

  const statements: D1PreparedStatement[] = [];

  // Delete existing child rows on target course
  statements.push(db.prepare("DELETE FROM course_outcomes WHERE course_id = ?").bind(targetCourseId));
  statements.push(db.prepare("DELETE FROM experiments WHERE course_id = ?").bind(targetCourseId));
  statements.push(db.prepare("DELETE FROM assessment_schemes WHERE course_id = ?").bind(targetCourseId));
  statements.push(db.prepare("DELETE FROM reference_books WHERE course_id = ?").bind(targetCourseId));

  if (targetModuleIds.length > 0) {
    const targetPlaceholders = targetModuleIds.map(() => "?").join(",");
    statements.push(
      db.prepare(`DELETE FROM topics WHERE module_id IN (${targetPlaceholders})`).bind(...targetModuleIds)
    );
  }
  statements.push(db.prepare("DELETE FROM modules WHERE course_id = ?").bind(targetCourseId));

  // Update target course content columns
  const now = new Date().toISOString();
  statements.push(
    db
      .prepare(
        `UPDATE courses SET
           pre_requisites = ?,
           objectives = ?,
           syllabus_intro = ?,
           online_resources = ?,
           section_order = ?,
           updated_at = ?
         WHERE id = ?`
      )
      .bind(
        sourceCourse.pre_requisites ?? "",
        sourceCourse.objectives ?? "",
        sourceCourse.syllabus_intro ?? "",
        sourceCourse.online_resources ?? "[]",
        sourceCourse.section_order ?? "[]",
        now,
        targetCourseId
      )
  );

  // Insert outcomes
  for (const o of outcomes.results ?? []) {
    const newId = crypto.randomUUID();
    statements.push(
      db
        .prepare(
          `INSERT INTO course_outcomes (id, course_id, code, description, bloom_level, sort_order, po_map, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          newId,
          targetCourseId,
          o.code,
          o.description,
          o.bloom_level ?? "",
          o.sort_order ?? 1,
          o.po_map ?? "{}",
          now,
          now
        )
    );
  }

  // Insert modules & topics
  for (const m of sourceModules) {
    const newModuleId = crypto.randomUUID();
    statements.push(
      db
        .prepare(
          `INSERT INTO modules (id, course_id, number, title, contact_hours, content, "references", created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          newModuleId,
          targetCourseId,
          m.number,
          m.title,
          m.contact_hours ?? m.hours ?? 0,
          m.content ?? "",
          m.references ?? "",
          now,
          now
        )
    );

    const mTopics = topicsByModule.get(m.id) || [];
    for (const t of mTopics) {
      const newTopicId = crypto.randomUUID();
      statements.push(
        db
          .prepare(
            `INSERT INTO topics (id, module_id, title, description, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            newTopicId,
            newModuleId,
            t.title || t.unit_number || "",
            t.description || t.content || "",
            t.sort_order ?? 1,
            now,
            now
          )
      );
    }
  }

  // Insert experiments
  for (const e of experiments.results ?? []) {
    const newExpId = crypto.randomUUID();
    statements.push(
      db
        .prepare(
          `INSERT INTO experiments (id, course_id, number, title, description, hours, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          newExpId,
          targetCourseId,
          e.number,
          e.title,
          e.description ?? "",
          e.hours ?? 2,
          now,
          now
        )
    );
  }

  // Insert assessment schemes
  for (const a of assessments.results ?? []) {
    const newAssId = crypto.randomUUID();
    statements.push(
      db
        .prepare(
          `INSERT INTO assessment_schemes (id, course_id, component, marks, description, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          newAssId,
          targetCourseId,
          a.component,
          a.marks,
          a.description ?? "",
          a.sort_order ?? 1,
          now,
          now
        )
    );
  }

  // Insert reference books
  for (const r of references.results ?? []) {
    const newRefId = crypto.randomUUID();
    statements.push(
      db
        .prepare(
          `INSERT INTO reference_books (id, course_id, title, authors, publisher, edition, year, is_textbook, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          newRefId,
          targetCourseId,
          r.title,
          r.authors ?? "",
          r.publisher ?? "",
          r.edition ?? "",
          r.year ?? "",
          r.is_textbook ?? 0,
          r.sort_order ?? 1,
          now,
          now
        )
    );
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }

  const sourceYear = sourceCourse.entering_year ? `${sourceCourse.entering_year} ` : "";
  await createCourseVersion(
    db,
    targetCourseId,
    { id: actorUserId } as any,
    `Copied from ${sourceYear}version`
  );
}
