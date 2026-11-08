import { Hono } from "hono";
import {
  CompileOrderRepository,
  ElectivesRepository,
  PreamblesRepository,
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
         COUNT(c.id) AS course_count
       FROM semesters s
       LEFT JOIN courses c ON c.semester_id = s.id
       WHERE s.scheme_id = ?
       GROUP BY s.id
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
         COUNT(c.id) AS course_count
       FROM semesters s
       LEFT JOIN courses c ON c.semester_id = s.id
       WHERE s.scheme_id = ? AND s.number IN (?, ?)
       GROUP BY s.id
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

// 7. GET /:id/compile-order
schemesRoutes.get("/:id/compile-order", async (c) => {
  const schemeId = c.req.param("id");
  const url = new URL(c.req.url);
  const yearOfStudy = (url.searchParams.get("year_of_study") || "SE") as YearOfStudy;

  if (!PAIR_SEMESTERS[yearOfStudy]) {
    return c.json({ error: "INVALID_YEAR_OF_STUDY", detail: "year_of_study must be FE, SE, TE, or BE." }, 400);
  }

  const savedOrder = await CompileOrderRepository.get(c.env.DB, schemeId, yearOfStudy);
  const [semA, semB] = PAIR_SEMESTERS[yearOfStudy];
  const pairCourses = await c.env.DB
    .prepare(
      `SELECT c.id, c.code, c.title
       FROM courses c
       JOIN semesters s ON c.semester_id = s.id
       WHERE s.scheme_id = ? AND s.number IN (?, ?)
       ORDER BY c.code ASC`
    )
    .bind(schemeId, semA, semB)
    .all<{ id: string; code: string; title: string }>();

  const allCourses = pairCourses.results ?? [];
  return c.json({
    year_of_study: yearOfStudy,
    course_order: savedOrder || allCourses.map((c) => c.id),
    courses: allCourses,
  });
});

// 8. PUT /:id/compile-order
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
    ordered_course_ids?: string[];
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
  const receivedIds = body.course_order || body.ordered_course_ids || [];

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

// 9. Electives Endpoints
schemesRoutes.get("/:id/electives", async (c) => {
  const schemeId = c.req.param("id");
  await ElectivesRepository.seedDefaults(c.env.DB, schemeId);
  const rows = await ElectivesRepository.listForScheme(c.env.DB, schemeId);

  const tracks = rows.filter((r) => r.category === "TRACK");
  const labs = rows.filter((r) => r.category === "LAB");
  const aec = rows.filter((r) => r.category === "AEC");

  return c.json({
    tracks,
    labs,
    aec,
    all: rows,
  });
});

schemesRoutes.post("/:id/electives", async (c) => {
  const user = c.get("user");
  if (user.role !== "ADMIN" && user.role !== "HOD") {
    return c.json({ detail: "Permission denied." }, 403);
  }

  const schemeId = c.req.param("id");
  const body = await c.req.json<any>();

  if (!body.category || !["TRACK", "LAB", "AEC"].includes(body.category)) {
    return c.json({ error: "INVALID_CATEGORY", detail: "category must be TRACK, LAB, or AEC." }, 400);
  }

  const created = await ElectivesRepository.create(c.env.DB, {
    scheme_id: schemeId,
    category: body.category,
    track_name: body.track_name,
    sem5_code: body.sem5_code,
    sem5_title: body.sem5_title,
    sem6_code: body.sem6_code,
    sem6_title: body.sem6_title,
    credits: body.credits,
    sort_order: body.sort_order,
  });

  return c.json(created, 201);
});

schemesRoutes.put("/:id/electives/:electiveId", async (c) => {
  const user = c.get("user");
  if (user.role !== "ADMIN" && user.role !== "HOD") {
    return c.json({ detail: "Permission denied." }, 403);
  }

  const electiveId = c.req.param("electiveId");
  const body = await c.req.json<any>();

  await ElectivesRepository.update(c.env.DB, electiveId, body);
  return c.json({ success: true });
});

schemesRoutes.delete("/:id/electives/:electiveId", async (c) => {
  const user = c.get("user");
  if (user.role !== "ADMIN" && user.role !== "HOD") {
    return c.json({ detail: "Permission denied." }, 403);
  }

  const electiveId = c.req.param("electiveId");
  await ElectivesRepository.delete(c.env.DB, electiveId);
  return c.json({ success: true });
});

// 10. Complete Booklet Data API: GET /:id/booklet-data
schemesRoutes.get("/:id/booklet-data", async (c) => {
  const schemeId = c.req.param("id");
  const url = new URL(c.req.url);
  const yearOfStudy = (url.searchParams.get("year_of_study") || "SE") as YearOfStudy;

  const scheme = await SchemesRepository.get(c.env.DB, schemeId);
  if (!scheme) {
    return c.json({ detail: "Scheme not found" }, 404);
  }

  const department = await c.env.DB
    .prepare("SELECT * FROM departments WHERE id = ?")
    .bind(scheme.department_id)
    .first<any>();

  const preamble = await PreamblesRepository.get(c.env.DB, scheme.department_id);

  // Fetch all 8 semesters for the scheme
  const semestersResult = await c.env.DB
    .prepare("SELECT * FROM semesters WHERE scheme_id = ? ORDER BY number ASC")
    .bind(schemeId)
    .all<any>();
  const semesterRows = semestersResult.results ?? [];

  // Fetch all courses in these semesters
  const semIds = semesterRows.map((s) => s.id);
  let allCourses: any[] = [];
  if (semIds.length > 0) {
    const placeholders = semIds.map(() => "?").join(",");
    const coursesRes = await c.env.DB
      .prepare(
        `SELECT c.*, trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) AS faculty_name
         FROM courses c
         LEFT JOIN profiles p ON c.faculty_user_id = p.id
         WHERE c.semester_id IN (${placeholders})
         ORDER BY c.code ASC`
      )
      .bind(...semIds)
      .all<any>();
    allCourses = coursesRes.results ?? [];
  }

  const courseIds = allCourses.map((c) => c.id);
  const componentsMap = await TeachingComponentsRepository.forCourses(c.env.DB, courseIds);

  const formattedSemesters = semesterRows.map((sem) => {
    const semCourses = allCourses
      .filter((c) => c.semester_id === sem.id)
      .map((c) => ({
        ...c,
        components: componentsMap.get(c.id) || [],
      }));
    return {
      id: sem.id,
      number: sem.number,
      title: sem.title,
      ordinance: sem.ordinance || "",
      is_unlocked: Boolean(sem.is_unlocked),
      courses: semCourses,
    };
  });

  // Ensure default electives are present (query first, seed only when empty)
  let electivesRows = await ElectivesRepository.listForScheme(c.env.DB, schemeId);
  if (electivesRows.length === 0) {
    await ElectivesRepository.seedDefaults(c.env.DB, schemeId);
    electivesRows = await ElectivesRepository.listForScheme(c.env.DB, schemeId);
  }
  const electives = {
    tracks: electivesRows.filter((r) => r.category === "TRACK"),
    labs: electivesRows.filter((r) => r.category === "LAB"),
    aec: electivesRows.filter((r) => r.category === "AEC"),
  };

  // Determine detailed courses to render
  const targetSems = PAIR_SEMESTERS[yearOfStudy] || [3, 4];
  const targetSemIds = semesterRows
    .filter((s) => targetSems.includes(s.number))
    .map((s) => s.id);

  let targetCourses = allCourses.filter((c) => targetSemIds.includes(c.semester_id));

  // Sort by compile order if saved
  const savedOrder = await CompileOrderRepository.get(c.env.DB, schemeId, yearOfStudy);
  if (savedOrder && savedOrder.length > 0) {
    const orderMap = new Map(savedOrder.map((id, index) => [id, index]));
    targetCourses.sort((a, b) => {
      const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
      const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
      return idxA - idxB;
    });
  }

  // Populate detailed child relations for targetCourses
  const detailedCourseIds = targetCourses.map((c) => c.id);
  let outcomesMap = new Map<string, any[]>();
  let modulesMap = new Map<string, any[]>();
  let experimentsMap = new Map<string, any[]>();
  let referencesMap = new Map<string, any[]>();
  let assessmentsMap = new Map<string, any[]>();
  let commentsMap = new Map<string, any[]>();

  if (detailedCourseIds.length > 0) {
    const dPlaceholders = detailedCourseIds.map(() => "?").join(",");

    const [outcomesRes, modulesRes, expRes, refRes, assRes, commRes] = await c.env.DB.batch<any>([
      c.env.DB.prepare(`SELECT * FROM course_outcomes WHERE course_id IN (${dPlaceholders}) ORDER BY sort_order ASC, code ASC`).bind(...detailedCourseIds),
      c.env.DB.prepare(`SELECT * FROM modules WHERE course_id IN (${dPlaceholders}) ORDER BY number ASC`).bind(...detailedCourseIds),
      c.env.DB.prepare(`SELECT * FROM experiments WHERE course_id IN (${dPlaceholders}) ORDER BY number ASC`).bind(...detailedCourseIds),
      c.env.DB.prepare(`SELECT * FROM reference_books WHERE course_id IN (${dPlaceholders}) ORDER BY is_textbook DESC, sort_order ASC`).bind(...detailedCourseIds),
      c.env.DB.prepare(`SELECT * FROM assessment_schemes WHERE course_id IN (${dPlaceholders}) ORDER BY sort_order ASC`).bind(...detailedCourseIds),
      c.env.DB.prepare(`SELECT * FROM reviewer_comments WHERE course_id IN (${dPlaceholders}) ORDER BY created_at ASC`).bind(...detailedCourseIds),
    ]);

    for (const r of outcomesRes.results ?? []) {
      if (!outcomesMap.has(r.course_id)) outcomesMap.set(r.course_id, []);
      let poMap = {};
      try { if (r.po_map) poMap = typeof r.po_map === "string" ? JSON.parse(r.po_map) : r.po_map; } catch {}
      outcomesMap.get(r.course_id)!.push({ ...r, po_map: poMap });
    }

    for (const r of modulesRes.results ?? []) {
      if (!modulesMap.has(r.course_id)) modulesMap.set(r.course_id, []);
      modulesMap.get(r.course_id)!.push(r);
    }

    for (const r of expRes.results ?? []) {
      if (!experimentsMap.has(r.course_id)) experimentsMap.set(r.course_id, []);
      experimentsMap.get(r.course_id)!.push(r);
    }

    for (const r of refRes.results ?? []) {
      if (!referencesMap.has(r.course_id)) referencesMap.set(r.course_id, []);
      referencesMap.get(r.course_id)!.push(r);
    }

    for (const r of assRes.results ?? []) {
      if (!assessmentsMap.has(r.course_id)) assessmentsMap.set(r.course_id, []);
      assessmentsMap.get(r.course_id)!.push(r);
    }

    for (const r of commRes.results ?? []) {
      if (!commentsMap.has(r.course_id)) commentsMap.set(r.course_id, []);
      commentsMap.get(r.course_id)!.push(r);
    }
  }

  const detailed_courses = targetCourses.map((c) => {
    const rawOutcomes = outcomesMap.get(c.id) || [];
    const outcomes = rawOutcomes.length > 0 ? rawOutcomes : [1, 2, 3, 4, 5].map((n) => ({
      code: `CO${n}`,
      description: `Demonstrate proficiency in ${c.title.toLowerCase()} concepts and engineering applications.`,
      bloom_level: ["Remember", "Understand", "Apply", "Analyze", "Create"][n - 1],
      order: n,
    }));

    const rawModules = modulesMap.get(c.id) || [];
    const modules = rawModules.length > 0 ? rawModules : [1, 2, 3, 4, 5].map((n) => ({
      number: n,
      title: `${c.title} Module ${n}`,
      contact_hours: c.course_type === "LAB" ? 0 : 5,
      content: `${c.title} Module ${n} covers fundamental theories, design paradigms, and real-world system applications.`,
      references: "1, 2, 3",
      topics: [
        { title: `Unit ${n}.1`, description: "Theoretical foundations, mathematical modeling, and core algorithms." },
        { title: `Unit ${n}.2`, description: "System implementation, analysis, and validation criteria." },
      ],
    }));

    const experiments = experimentsMap.get(c.id) || [];
    const reference_books = referencesMap.get(c.id) || [
      { title: `Principles of ${c.title}`, authors: "A. K. Sharma", publisher: "McGraw-Hill", edition: "2nd", year: "2024", is_textbook: true },
      { title: `Modern ${c.title}: Concepts and Practice`, authors: "P. R. Deshmukh", publisher: "Pearson", edition: "1st", year: "2023", is_textbook: false },
    ];

    const assessments = assessmentsMap.get(c.id) || [];
    const comments = commentsMap.get(c.id) || [];

    return {
      ...c,
      components: componentsMap.get(c.id) || [],
      outcomes,
      modules,
      experiments,
      reference_books,
      assessments,
      comments,
    };
  });

  return c.json({
    scheme,
    department: department || {
      id: "1",
      code: "CE",
      name: "Computer Engineering",
      college_name: "Fr. Conceicao Rodrigues College of Engineering",
      university_name: "University of Mumbai",
    },
    preamble,
    year_of_study: yearOfStudy,
    revision_label: `FRCRCE-2-${scheme.scheme_year_code || "25"}`,
    semesters: formattedSemesters,
    electives,
    detailed_courses,
  });
});
