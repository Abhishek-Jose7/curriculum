import { Hono } from "hono";
import {
  CompileOrderRepository,
  SchemesRepository,
  TeachingComponentsRepository,
} from "../repositories/schemes";
import type { Env, Variables } from "../types";
import type { YearOfStudy } from "../types/scheme";
import { PAIR_SEMESTERS } from "../types/scheme";

export const schemesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// 1. POST / (Create scheme)
schemesRoutes.post("/", async (c) => {
  const user = c.get("user");
  if (user.role !== "ADMIN" && user.role !== "HOD") {
    return c.json({ detail: "Permission denied." }, 403);
  }

  const body = await c.req.json<{
    department_id?: string;
    entering_year?: string;
    duplicate_from_scheme_id?: string;
  }>();

  if (!body.department_id || !body.entering_year) {
    return c.json({ error: "MISSING_REQUIRED_FIELDS", detail: "department_id and entering_year are required." }, 400);
  }

  if (user.role === "HOD" && user.department_id && user.department_id !== body.department_id) {
    return c.json({ error: "DEPARTMENT_MISMATCH", detail: "HOD cannot create scheme for another department." }, 403);
  }

  const exists = await SchemesRepository.existsForYear(c.env.DB, body.department_id, body.entering_year);
  if (exists) {
    return c.json({ error: "SCHEME_EXISTS", detail: "A scheme already exists for this department and entering year." }, 409);
  }

  const parts = body.entering_year.split("-");
  const leadingYear = parts[0]?.trim();
  if (!leadingYear || leadingYear.length !== 4 || isNaN(Number(leadingYear))) {
    return c.json({ error: "INVALID_ENTERING_YEAR", detail: "entering_year must start with a 4-digit year (e.g. 2026-27)." }, 400);
  }

  try {
    const created = await SchemesRepository.create(c.env.DB, {
      department_id: body.department_id,
      entering_year: body.entering_year,
      created_by_user_id: user.id,
      duplicate_from_scheme_id: body.duplicate_from_scheme_id,
    });
    return c.json(created, 201);
  } catch (err: any) {
    if (err.message === "INVALID_ENTERING_YEAR") {
      return c.json({ error: "INVALID_ENTERING_YEAR", detail: "Invalid entering year format." }, 400);
    }
    throw err;
  }
});

// 2. GET / (List schemes)
schemesRoutes.get("/", async (c) => {
  const url = new URL(c.req.url);
  const department_id = url.searchParams.get("department_id");

  if (department_id) {
    const schemes = await SchemesRepository.listByDepartment(c.env.DB, department_id);
    return c.json(schemes);
  }

  const allSchemes = await c.env.DB
    .prepare("SELECT * FROM curriculum_schemes ORDER BY entering_year DESC")
    .all();
  return c.json(allSchemes.results ?? []);
});

// 3. GET /:id/ (Get scheme detail with semesters)
schemesRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const scheme = await SchemesRepository.get(c.env.DB, id);
  if (!scheme) {
    return c.json({ detail: "Not found" }, 404);
  }

  const semesters = await c.env.DB
    .prepare(
      `SELECT
         s.number,
         s.is_unlocked,
         s.shell_completed_at,
         s.unlocked_at,
         (SELECT count(*) FROM courses c WHERE c.semester_id = s.id) AS course_count
       FROM semesters s
       WHERE s.scheme_id = ?
       ORDER BY s.number ASC`
    )
    .bind(id)
    .all();

  const formattedSemesters = (semesters.results ?? []).map((s: any) => ({
    number: s.number,
    is_unlocked: Boolean(s.is_unlocked),
    shell_completed_at: s.shell_completed_at,
    unlocked_at: s.unlocked_at,
    course_count: s.course_count ?? 0,
  }));

  return c.json({
    ...scheme,
    semesters: formattedSemesters,
  });
});

// 4. GET /:id/semesters/:number/courses (Courses in a semester with components)
schemesRoutes.get("/:id/semesters/:number/courses", async (c) => {
  const schemeId = c.req.param("id");
  const semNumber = parseInt(c.req.param("number"), 10);

  const semester = await c.env.DB
    .prepare("SELECT id, number FROM semesters WHERE scheme_id = ? AND number = ?")
    .bind(schemeId, semNumber)
    .first<{ id: string; number: number }>();

  if (!semester) {
    return c.json({ detail: "Semester not found" }, 404);
  }

  const coursesResult = await c.env.DB
    .prepare(
      `SELECT
         c.*,
         trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) AS faculty_name
       FROM courses c
       LEFT JOIN profiles p ON c.faculty_user_id = p.id
       WHERE c.semester_id = ?
       ORDER BY c.code ASC, c.created_at ASC`
    )
    .bind(semester.id)
    .all();

  const courses = coursesResult.results ?? [];
  const courseIds = courses.map((c: any) => c.id);
  const componentsMap = await TeachingComponentsRepository.forCourses(c.env.DB, courseIds);

  const coursesWithComponents = courses.map((course: any) => ({
    ...course,
    components: componentsMap.get(course.id) || [],
  }));

  return c.json(coursesWithComponents);
});

// 5. PATCH /:id/semesters/:number/finish-shell
schemesRoutes.patch("/:id/semesters/:number/finish-shell", async (c) => {
  const user = c.get("user");
  if (user.role !== "ADMIN" && user.role !== "HOD") {
    return c.json({ detail: "Permission denied." }, 403);
  }

  const schemeId = c.req.param("id");
  const semNumber = parseInt(c.req.param("number"), 10);

  const scheme = await SchemesRepository.get(c.env.DB, schemeId);
  if (!scheme) {
    return c.json({ detail: "Scheme not found" }, 404);
  }

  if (user.role === "HOD" && user.department_id && user.department_id !== scheme.department_id) {
    return c.json({ error: "DEPARTMENT_MISMATCH", detail: "Department mismatch." }, 403);
  }

  const semester = await c.env.DB
    .prepare("SELECT id FROM semesters WHERE scheme_id = ? AND number = ?")
    .bind(schemeId, semNumber)
    .first<{ id: string }>();

  if (!semester) {
    return c.json({ detail: "Semester not found" }, 404);
  }

  const countRow = await c.env.DB
    .prepare("SELECT count(*) AS count FROM courses WHERE semester_id = ?")
    .bind(semester.id)
    .first<{ count: number }>();

  if (!countRow || countRow.count === 0) {
    return c.json({ error: "NO_SUBJECTS", detail: "Cannot finish shell with zero subjects." }, 400);
  }

  const now = new Date().toISOString();
  await c.env.DB
    .prepare("UPDATE semesters SET shell_completed_at = ?, updated_at = ? WHERE id = ?")
    .bind(now, now, semester.id)
    .run();

  return c.json({ status: "completed", shell_completed_at: now });
});

// 6. POST /:id/unlock-pair
schemesRoutes.post("/:id/unlock-pair", async (c) => {
  const user = c.get("user");
  if (user.role !== "ADMIN" && user.role !== "HOD") {
    return c.json({ detail: "Permission denied." }, 403);
  }

  const schemeId = c.req.param("id");
  const scheme = await SchemesRepository.get(c.env.DB, schemeId);
  if (!scheme) {
    return c.json({ detail: "Scheme not found" }, 404);
  }

  if (user.role === "HOD" && user.department_id && user.department_id !== scheme.department_id) {
    return c.json({ error: "DEPARTMENT_MISMATCH", detail: "Department mismatch." }, 403);
  }

  const body = await c.req.json<{ year_of_study?: YearOfStudy }>();
  const yearOfStudy = body.year_of_study;
  if (!yearOfStudy || !PAIR_SEMESTERS[yearOfStudy]) {
    return c.json({ error: "INVALID_YEAR_OF_STUDY", detail: "year_of_study must be FE, SE, TE, or BE." }, 400);
  }

  const [semA, semB] = PAIR_SEMESTERS[yearOfStudy];
  const sems = await c.env.DB
    .prepare("SELECT * FROM semesters WHERE scheme_id = ? AND number IN (?, ?) ORDER BY number ASC")
    .bind(schemeId, semA, semB)
    .all<any>();

  const semRows = sems.results ?? [];
  if (semRows.length < 2) {
    return c.json({ detail: "Semesters not found for pair." }, 500);
  }

  const incompleteSemesters: number[] = [];
  for (const s of semRows) {
    if (!s.shell_completed_at) {
      incompleteSemesters.push(s.number);
    }
  }

  if (incompleteSemesters.length > 0) {
    return c.json({ error: "SHELL_INCOMPLETE", incomplete_semesters: incompleteSemesters }, 400);
  }

  if (semRows.every((s) => s.is_unlocked === 1)) {
    return c.json({ error: "ALREADY_UNLOCKED", detail: "Semester pair is already unlocked." }, 409);
  }

  const now = new Date().toISOString();
  await c.env.DB
    .prepare(
      "UPDATE semesters SET is_unlocked = 1, unlocked_at = ?, updated_at = ? WHERE scheme_id = ? AND number IN (?, ?)"
    )
    .bind(now, now, schemeId, semA, semB)
    .run();

  if (scheme.status === "draft_setup") {
    await SchemesRepository.setStatus(c.env.DB, schemeId, "active");
  }

  const updatedSems = await c.env.DB
    .prepare(
      `SELECT
         s.number,
         s.is_unlocked,
         s.shell_completed_at,
         s.unlocked_at,
         (SELECT count(*) FROM courses c WHERE c.semester_id = s.id) AS course_count
       FROM semesters s
       WHERE s.scheme_id = ? AND s.number IN (?, ?)
       ORDER BY s.number ASC`
    )
    .bind(schemeId, semA, semB)
    .all();

  return c.json((updatedSems.results ?? []).map((s: any) => ({
    number: s.number,
    is_unlocked: Boolean(s.is_unlocked),
    shell_completed_at: s.shell_completed_at,
    unlocked_at: s.unlocked_at,
    course_count: s.course_count ?? 0,
  })));
});

// 7. PUT /:id/compile-order
schemesRoutes.put("/:id/compile-order", async (c) => {
  const user = c.get("user");
  if (user.role !== "ADMIN" && user.role !== "HOD") {
    return c.json({ detail: "Permission denied." }, 403);
  }

  const schemeId = c.req.param("id");
  const scheme = await SchemesRepository.get(c.env.DB, schemeId);
  if (!scheme) {
    return c.json({ detail: "Scheme not found" }, 404);
  }

  if (user.role === "HOD" && user.department_id && user.department_id !== scheme.department_id) {
    return c.json({ error: "DEPARTMENT_MISMATCH", detail: "Department mismatch." }, 403);
  }

  const body = await c.req.json<{
    year_of_study?: YearOfStudy;
    course_order?: string[];
  }>();

  const yearOfStudy = body.year_of_study;
  if (!yearOfStudy || !PAIR_SEMESTERS[yearOfStudy]) {
    return c.json({ error: "INVALID_YEAR_OF_STUDY", detail: "year_of_study must be FE, SE, TE, or BE." }, 400);
  }

  const [semA, semB] = PAIR_SEMESTERS[yearOfStudy];
  const pairCourses = await c.env.DB
    .prepare(
      `SELECT c.id
       FROM courses c
       JOIN semesters s ON c.semester_id = s.id
       WHERE s.scheme_id = ? AND s.number IN (?, ?)`
    )
    .bind(schemeId, semA, semB)
    .all<{ id: string }>();

  const expectedIds = new Set((pairCourses.results ?? []).map((r) => r.id));
  const receivedIds = body.course_order ?? [];

  const isValidPermutation =
    receivedIds.length === expectedIds.size &&
    new Set(receivedIds).size === receivedIds.length &&
    receivedIds.every((id) => expectedIds.has(id));

  if (!isValidPermutation) {
    return c.json(
      {
        error: "ORDER_MISMATCH",
        detail: "course_order must be an exact permutation of all courses in this pair.",
        expected: Array.from(expectedIds),
        received: receivedIds,
      },
      400
    );
  }

  await CompileOrderRepository.upsert(c.env.DB, schemeId, yearOfStudy, receivedIds, user.id);
  return c.json({ year_of_study: yearOfStudy, course_order: receivedIds });
});
