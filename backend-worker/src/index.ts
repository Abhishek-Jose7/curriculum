import { Hono } from "hono";
import { cors } from "hono/cors";
import puppeteer from "@cloudflare/puppeteer";
import { BaseRepository, normalizeValue } from "./repositories/base";
import { CoursesRepository, ReviewerRepository, WorkflowRepository } from "./repositories/curriculum";
import { requireAuth, signJwt, isAcademicAdmin, isReviewerOrAdmin, verifyJwt } from "./middleware/auth";
import { verifyPassword, hashPassword } from "./services/auth";
import { createCourseVersion, diffSnapshots } from "./services/courseVersions";
import { crudRoute } from "./routes/generic";
import type { Env, Variables, WorkflowDecision } from "./types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
const api = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = c.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:3000";
      const origins = allowed.split(",").map((o: string) => o.trim());
      if (origins.includes(origin)) {
        return origin;
      }
      if (!origin && c.env.ENVIRONMENT === "development") {
        return "*";
      }
      return origins[0];
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.get("/api/fonts/:name", async (c) => serveFont(c));
app.get("/fonts/:name", async (c) => serveFont(c));

async function serveFont(c: any) {
  const name = c.req.param("name");
  if (!name.endsWith(".ttf")) {
    return c.text("Invalid font format", 400);
  }

  const cacheKey = `fonts/${name}`;
  let fontBuffer: ArrayBuffer | null = null;

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

    const urls = [
      `https://raw.githubusercontent.com/shantigilbert/liberation-fonts-ttf/master/${fontName}`,
      `https://raw.githubusercontent.com/shantigilbert/liberation-fonts-ttf/main/${fontName}`,
      `https://raw.githubusercontent.com/liberationfonts/liberation-fonts/main/src/${fontName}`
    ];

    for (const url of urls) {
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
      "Cache-Control": "public, max-age=31536000",
    }
  });
}

async function ensureRefreshTokensTable(db: D1Database) {
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

api.post("/auth/token/", async (c) => {
  const body = await c.req.json<{ username?: string; email?: string; password?: string }>();
  const login = body.username ?? body.email ?? "";
  const user = await c.env.DB.prepare("SELECT * FROM profiles WHERE (email = ? OR username = ?) AND is_active = 1").bind(login, login).first<any>();
  if (!user) return c.json({ detail: "No active account found with the given credentials." }, 401);
  
  const verified = await verifyPassword(body.password ?? "", user.password_hash ?? "");
  if (!verified) return c.json({ detail: "No active account found with the given credentials." }, 401);
  
  // Migration bridge: JIT hash migration
  if (user.password_hash && !user.password_hash.startsWith("pbkdf2_sha256$")) {
    const newHash = await hashPassword(body.password ?? "");
    await c.env.DB.prepare("UPDATE profiles SET password_hash = ? WHERE id = ?").bind(newHash, user.id).run();
  }
  
  await ensureRefreshTokensTable(c.env.DB);
  
  const tokenJti = crypto.randomUUID();
  const refreshExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  const refreshExpiresStr = refreshExpires.toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO refresh_tokens (id, token_id, user_id, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(crypto.randomUUID(), tokenJti, user.id, refreshExpiresStr).run();
  
  return c.json({
    access: await signJwt({ sub: user.id, role: user.role, email: user.email }, c.env.AUTH_JWT_SECRET, 60 * 15), // 15 mins
    refresh: await signJwt({ sub: user.id, typ: "refresh", jti: tokenJti }, c.env.AUTH_JWT_SECRET, 60 * 60 * 24 * 7), // 7 days
  });
});

api.post("/auth/token/refresh/", async (c) => {
  const body = await c.req.json<{ refresh?: string }>();
  const token = body.refresh;
  if (!token) return c.json({ detail: "Refresh token is required." }, 400);
  
  const payload = await verifyJwt(token, c.env.AUTH_JWT_SECRET);
  if (!payload?.sub || payload.typ !== "refresh" || !payload.jti) {
    return c.json({ detail: "Invalid or expired refresh token." }, 401);
  }
  
  await ensureRefreshTokensTable(c.env.DB);
  
  const stored = await c.env.DB.prepare("SELECT * FROM refresh_tokens WHERE token_id = ?").bind(payload.jti).first<any>();
  if (!stored) return c.json({ detail: "Invalid refresh token." }, 401);
  
  if (stored.is_revoked === 1) {
    // Reuse detected! Revoke all tokens for this user for security
    await c.env.DB.prepare("UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?").bind(stored.user_id).run();
    return c.json({ detail: "Refresh token has been revoked." }, 401);
  }
  
  // Check expiration
  if (new Date(stored.expires_at) < new Date()) {
    return c.json({ detail: "Refresh token has expired." }, 401);
  }
  
  const user = await c.env.DB.prepare("SELECT * FROM profiles WHERE id = ? AND is_active = 1").bind(stored.user_id).first<any>();
  if (!user) return c.json({ detail: "User not found or inactive." }, 401);
  
  // Mark old refresh token as revoked (used)
  await c.env.DB.prepare("UPDATE refresh_tokens SET is_revoked = 1 WHERE token_id = ?").bind(payload.jti).run();
  
  // Generate new tokens
  const tokenJti = crypto.randomUUID();
  const refreshExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  const refreshExpiresStr = refreshExpires.toISOString();
  
  await c.env.DB.prepare(`
    INSERT INTO refresh_tokens (id, token_id, user_id, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(crypto.randomUUID(), tokenJti, user.id, refreshExpiresStr).run();
  
  return c.json({
    access: await signJwt({ sub: user.id, role: user.role, email: user.email }, c.env.AUTH_JWT_SECRET, 60 * 15), // 15 mins
    refresh: await signJwt({ sub: user.id, typ: "refresh", jti: tokenJti }, c.env.AUTH_JWT_SECRET, 60 * 60 * 24 * 7), // 7 days
  });
});

api.post("/auth/token/revoke/", async (c) => {
  const body = await c.req.json<{ refresh_token?: string }>();
  const token = body.refresh_token;
  if (!token) return c.json({ detail: "Refresh token is required." }, 400);
  
  const payload = await verifyJwt(token, c.env.AUTH_JWT_SECRET);
  if (!payload?.jti) return c.json({ detail: "Invalid token." }, 401);
  
  await ensureRefreshTokensTable(c.env.DB);
  await c.env.DB.prepare("UPDATE refresh_tokens SET is_revoked = 1 WHERE token_id = ?").bind(payload.jti).run();
  return c.json({ status: "revoked" });
});

api.use("*", requireAuth);

api.get("/auth/me/", (c) => c.json(c.get("user")));

api.route("/departments", crudRoute("departments", ["code", "name", "college_name", "university_name", "logo_url"], ["code"], true));
api.route("/academic-years", crudRoute("academic_years", ["name", "starts_on", "ends_on", "is_active"], ["is_active"], true));
api.route("/semesters", crudRoute("semesters", ["department_id", "academic_year_id", "number", "title", "ordinance"], ["department_id", "academic_year_id", "number"], true));
api.route("/curriculum-templates", crudRoute("curriculum_templates", ["department_id", "name", "html_template", "css", "template_pdf_url", "is_active"], ["department_id", "is_active"], true));

api.get("/notifications/", async (c) => {
  const user = c.get("user");
  const rows = await c.env.DB.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC").bind(user.id).all();
  return c.json(rows.results ?? []);
});

api.get("/notifications/:id/", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM notifications WHERE id = ?").bind(id).first<any>();
  if (!row) return c.json({ detail: "Not found." }, 404);
  if (row.user_id !== user.id) return c.json({ detail: "Permission denied." }, 403);
  return c.json(row);
});

api.post("/notifications/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<any>();
  const targetUserId = body.user_id ?? user.id;
  
  if (targetUserId !== user.id && !isAcademicAdmin(user)) {
    return c.json({ detail: "Permission denied." }, 403);
  }
  
  const id = crypto.randomUUID();
  const row = await c.env.DB.prepare(`
    INSERT INTO notifications (id, user_id, title, body, link, is_read)
    VALUES (?, ?, ?, ?, ?, 0) RETURNING *
  `).bind(id, targetUserId, body.title ?? "", body.body ?? "", body.link ?? "").first<any>();
  
  return c.json(row, 201);
});

api.patch("/notifications/:id/", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM notifications WHERE id = ?").bind(id).first<any>();
  if (!row) return c.json({ detail: "Not found." }, 404);
  if (row.user_id !== user.id) return c.json({ detail: "Permission denied." }, 403);
  
  const body = await c.req.json<any>();
  const isRead = body.is_read !== undefined ? (body.is_read ? 1 : 0) : row.is_read;
  
  const updated = await c.env.DB.prepare(`
    UPDATE notifications
    SET is_read = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? RETURNING *
  `).bind(isRead, id).first<any>();
  
  return c.json(updated);
});

api.put("/notifications/:id/", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM notifications WHERE id = ?").bind(id).first<any>();
  if (!row) return c.json({ detail: "Not found." }, 404);
  if (row.user_id !== user.id) return c.json({ detail: "Permission denied." }, 403);
  
  const body = await c.req.json<any>();
  const isRead = body.is_read !== undefined ? (body.is_read ? 1 : 0) : row.is_read;
  const title = body.title !== undefined ? body.title : row.title;
  const bodyText = body.body !== undefined ? body.body : row.body;
  const link = body.link !== undefined ? body.link : row.link;
  
  const updated = await c.env.DB.prepare(`
    UPDATE notifications
    SET is_read = ?, title = ?, body = ?, link = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? RETURNING *
  `).bind(isRead, title, bodyText, link, id).first<any>();
  
  return c.json(updated);
});

api.delete("/notifications/:id/", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const row = await c.env.DB.prepare("SELECT * FROM notifications WHERE id = ?").bind(id).first<any>();
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

api.post("/courses/:id/submit/", async (c) => {
  const course = await c.env.DB.prepare("UPDATE courses SET status = 'SUBMITTED' WHERE id = ? RETURNING *").bind(c.req.param("id")).first<any>();
  if (!course) return c.json({ detail: "Not found." }, 404);
  await createCourseVersion(c.env.DB, course.id, c.get("user"), "Submitted for review");
  return c.json(await new CoursesRepository(c.env.DB).detail(course.id));
});

api.post("/courses/:id/reopen/", async (c) => {
  if (!isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  const course = await c.env.DB.prepare("UPDATE courses SET status = 'CHANGES_REQUESTED', approved_by_user_id = NULL, approved_at = NULL WHERE id = ? RETURNING *").bind(c.req.param("id")).first<any>();
  if (!course) return c.json({ detail: "Not found." }, 404);
  await createCourseVersion(c.env.DB, course.id, c.get("user"), "Reopened by administrator");
  return c.json(await new CoursesRepository(c.env.DB).detail(course.id));
});

api.get("/courses/:id/versions/", async (c) => {
  const rows = await c.env.DB.prepare("SELECT cv.*, trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) AS edited_by_name FROM course_versions cv LEFT JOIN profiles p ON p.id = cv.edited_by_user_id WHERE cv.course_id = ? ORDER BY cv.version_number DESC").bind(c.req.param("id")).all();
  return c.json(rows.results ?? []);
});

api.post("/courses/:id/compare_versions/", async (c) => {
  const body = await c.req.json<{ version_a: string; version_b: string }>();
  const a = await c.env.DB.prepare("SELECT * FROM course_versions WHERE course_id = ? AND id = ?").bind(c.req.param("id"), body.version_a).first<any>();
  const b = await c.env.DB.prepare("SELECT * FROM course_versions WHERE course_id = ? AND id = ?").bind(c.req.param("id"), body.version_b).first<any>();
  if (!a || !b) return c.json({ detail: "Version not found." }, 404);
  const left = JSON.parse(a.snapshot);
  const right = JSON.parse(b.snapshot);
  return c.json({ version_a: { id: a.id, number: a.version_number, summary: a.change_summary }, version_b: { id: b.id, number: b.version_number, summary: b.change_summary }, changes: diffSnapshots(left, right), left, right });
});

api.get("/courses/:id/compare_previous_year/", async (c) => {
  const courseId = c.req.param("id");
  const db = c.env.DB;
  
  // 1. Get the current course details
  const courseRepo = new CoursesRepository(db);
  const currentCourse = await courseRepo.detail(courseId) as any;
  if (!currentCourse) {
    return c.json({ detail: "Course not found." }, 404);
  }
  
  // 2. Fetch the semester details for the current course
  const currentSemester = await db.prepare("SELECT * FROM semesters WHERE id = ?").bind(currentCourse.semester_id).first<any>();
  if (!currentSemester) {
    return c.json({ detail: "Current semester not found." }, 404);
  }
  
  // 3. Fetch current academic year
  const currentAy = await db.prepare("SELECT * FROM academic_years WHERE id = ?").bind(currentSemester.academic_year_id).first<any>();
  if (!currentAy) {
    return c.json({ detail: "Current academic year not found." }, 404);
  }
  
  // 4. Find the most recent prior academic year that has a course with the same code and same department
  const priorCourses = await db.prepare(`
    SELECT c.id, ay.name as academic_year_name, ay.starts_on
    FROM courses c
    JOIN semesters s ON s.id = c.semester_id
    JOIN academic_years ay ON ay.id = s.academic_year_id
    WHERE c.code = ?
      AND s.department_id = ?
      AND ay.starts_on < ?
    ORDER BY ay.starts_on DESC
  `).bind(currentCourse.code, currentSemester.department_id, currentAy.starts_on).all<any>();
  
  const results = priorCourses.results ?? [];
  if (results.length === 0) {
    return c.json({ detail: "No previous year's syllabus found for this course code." }, 404);
  }
  
  // Pick the most recent one
  const prevCourseRow = results[0];
  const prevCourse = await courseRepo.detail(prevCourseRow.id) as any;
  if (!prevCourse) {
    return c.json({ detail: "Failed to load previous year's course details." }, 500);
  }
  
  // 5. Compare current course details with the previous year's course details
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
  const body = await c.req.json<{ version_id: string }>();
  const version = await c.env.DB.prepare("SELECT * FROM course_versions WHERE course_id = ? AND id = ?").bind(c.req.param("id"), body.version_id).first<any>();
  if (!version) return c.json({ detail: "Version not found." }, 404);
  const snapshot = JSON.parse(version.snapshot);
  await new CoursesRepository(c.env.DB).update(c.req.param("id"), snapshot.course ?? snapshot);
  await createCourseVersion(c.env.DB, c.req.param("id"), c.get("user"), `Rolled back to version ${version.version_number}`);
  return c.json(await new CoursesRepository(c.env.DB).detail(c.req.param("id")));
});

api.post("/courses/:id/autosave/", async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json<any>();
  await syncCourse(c.env.DB, id, data);
  await createCourseVersion(c.env.DB, id, c.get("user"), data.change_summary ?? "Autosaved draft");
  return c.json({ status: "saved", course: await new CoursesRepository(c.env.DB).detail(id) });
});

api.get("/reviewer-comments/", async (c) => c.json(await new ReviewerRepository(c.env.DB).list(Object.fromEntries(new URL(c.req.url).searchParams))));
api.post("/reviewer-comments/", async (c) => {
  if (!isReviewerOrAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  const row = await new ReviewerRepository(c.env.DB).create({ ...(await c.req.json()), reviewer_user_id: c.get("user").id });
  return c.json(row, 201);
});
api.post("/reviewer-comments/:id/resolve/", async (c) => c.json(await new ReviewerRepository(c.env.DB).update(c.req.param("id"), { is_resolved: 1, resolved_by_user_id: c.get("user").id, resolved_at: new Date().toISOString() })));

api.get("/approval-workflows/", async (c) => c.json(await new WorkflowRepository(c.env.DB).list(Object.fromEntries(new URL(c.req.url).searchParams))));
api.post("/approval-workflows/", async (c) => {
  if (!isReviewerOrAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  const body = await c.req.json<{ course: string; decision: WorkflowDecision; note?: string }>();
  const transitions: Record<WorkflowDecision, string> = { REQUEST_CHANGES: "CHANGES_REQUESTED", APPROVE: "APPROVED", REJECT: "CHANGES_REQUESTED", PUBLISH: "PUBLISHED" };
  const course = await c.env.DB.prepare("SELECT * FROM courses WHERE id = ?").bind(body.course).first<any>();
  if (!course) return c.json({ detail: "Course not found." }, 404);
  const to = transitions[body.decision];
  await c.env.DB.prepare("UPDATE courses SET status = ?, approved_by_user_id = CASE WHEN ? = 'APPROVED' THEN ? ELSE approved_by_user_id END, approved_at = CASE WHEN ? = 'APPROVED' THEN CURRENT_TIMESTAMP ELSE approved_at END WHERE id = ?").bind(to, to, c.get("user").id, to, body.course).run();
  const workflow = await new WorkflowRepository(c.env.DB).create({ course_id: body.course, actor_user_id: c.get("user").id, from_status: course.status, to_status: to, decision: body.decision, note: body.note ?? "" });
  await createCourseVersion(c.env.DB, body.course, c.get("user"), `Workflow decision: ${body.decision}`);
  return c.json(workflow, 201);
});

api.get("/published-curricula/", async (c) => c.json(await new BaseRepository(c.env.DB, "published_curricula", [], ["department_id", "academic_year_id", "is_public"]).list(Object.fromEntries(new URL(c.req.url).searchParams))));

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
  const body = await c.req.json<any>();
  const template = await c.env.DB.prepare("SELECT * FROM curriculum_templates WHERE id = ?").bind(body.template).first<any>();
  if (!template) return c.json({ detail: "Template not found." }, 404);
  const count = await c.env.DB.prepare("SELECT count(*) AS n FROM courses c JOIN semesters s ON s.id = c.semester_id WHERE s.department_id = ? AND s.academic_year_id = ? AND c.status IN ('APPROVED','PUBLISHED')").bind(body.department, body.academic_year).first<any>();
  const printUrl = `/print/final?department=${encodeURIComponent(body.department)}&academic_year=${encodeURIComponent(body.academic_year)}&version=${encodeURIComponent(body.version_label ?? "v1")}`;
  
  const published = await c.env.DB.prepare(`
    INSERT INTO published_curricula (department_id, academic_year_id, template_id, published_by_user_id, print_url, pdf_url, version_label, template_snapshot, render_metrics)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
  `).bind(
    body.department,
    body.academic_year,
    body.template,
    c.get("user").id,
    printUrl,
    "",
    body.version_label ?? "v1",
    JSON.stringify({ css: template.css, html_template: template.html_template, name: template.name }),
    JSON.stringify({ status: "queued", course_count: count?.n ?? 0, export: "pdf-render" })
  ).first<any>();

  await c.env.DB.prepare("UPDATE courses SET status = 'PUBLISHED' WHERE id IN (SELECT c.id FROM courses c JOIN semesters s ON s.id = c.semester_id WHERE s.department_id = ? AND s.academic_year_id = ? AND c.status IN ('APPROVED','PUBLISHED'))").bind(body.department, body.academic_year).run();
  await c.env.DB.prepare("UPDATE curriculum_templates SET is_locked = 1 WHERE id = ?").bind(body.template).run();

  if (c.env.PUBLISH_QUEUE) {
    await c.env.PUBLISH_QUEUE.send({
      publishedId: published.id,
      departmentId: body.department,
      academicYearId: body.academic_year,
      templateId: body.template,
      versionLabel: body.version_label ?? "v1"
    });
  }

  return c.json(published, 202);
});

app.route("/api", api);
app.route("/", api);

async function updateCourse(c: any) {
  const body = await c.req.json();
  const course = await new CoursesRepository(c.env.DB).update(c.req.param("id"), body);
  await createCourseVersion(c.env.DB, course.id, c.get("user"), body.change_summary ?? "Course updated");
  return c.json(await new CoursesRepository(c.env.DB).detail(course.id));
}

async function syncCourse(db: D1Database, courseId: string, data: any) {
  await new CoursesRepository(db).update(courseId, data);
  await syncChildren(db, "course_outcomes", "course_id", courseId, data.outcomes, ["code", "description", "bloom_level", "sort_order"], (item, i) => ({ ...item, sort_order: item.sort_order ?? item.order ?? i + 1 }));
  await syncChildren(db, "experiments", "course_id", courseId, data.experiments, ["number", "title", "description", "hours"]);
  await syncChildren(db, "assessment_schemes", "course_id", courseId, data.assessments, ["component", "marks", "description", "sort_order"], (item, i) => ({ ...item, sort_order: item.sort_order ?? item.order ?? i + 1 }));
  await syncChildren(db, "reference_books", "course_id", courseId, data.reference_books ?? data.references, ["title", "authors", "publisher", "edition", "year", "is_textbook", "sort_order"], (item, i) => ({ ...item, sort_order: item.sort_order ?? item.order ?? i + 1 }));
  if (data.modules) {
    await syncChildren(db, "modules", "course_id", courseId, data.modules, ["number", "title", "contact_hours", "content"], undefined, async (module, row) => {
      await syncChildren(db, "topics", "module_id", String(row.id), module.topics, ["title", "description", "sort_order"], (item, i) => ({ ...item, sort_order: item.sort_order ?? item.order ?? i + 1 }));
    });
  }
}

async function syncChildren(db: D1Database, table: string, parentColumn: string, parentId: string, items: any[] | undefined, fields: string[], mapItem = (item: any, _i: number) => item, afterUpsert?: (item: any, row: any) => Promise<void>) {
  if (!items) return;
  const existing = await db.prepare(`SELECT id FROM ${table} WHERE ${parentColumn} = ?`).bind(parentId).all<any>();
  const seen = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    const item = mapItem(items[i], i);
    const columns = [parentColumn, ...fields].filter((field) => field === parentColumn || item[field] !== undefined);
    const values = columns.map((field) => field === parentColumn ? parentId : normalizeValue(item[field]));
    let row: any;
    if (item.id) {
      const assignments = columns.filter((field) => field !== parentColumn).map((field) => `${field} = ?`).join(", ");
      row = await db.prepare(`UPDATE ${table} SET ${assignments} WHERE id = ? RETURNING *`).bind(...values.slice(1), item.id).first();
    } else {
      row = await db.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")}) RETURNING *`).bind(...values).first();
    }
    if (row?.id) seen.add(String(row.id));
    if (afterUpsert && row) await afterUpsert(item, row);
  }
  for (const row of existing.results ?? []) {
    if (!seen.has(String(row.id))) await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(row.id).run();
  }
}

export default {
  fetch: app.fetch,
  async queue(batch: any, env: Env, ctx: any) {
    for (const message of batch.messages) {
      const payload = message.body;
      const { publishedId, departmentId, academicYearId, templateId, versionLabel } = payload;
      
      console.log(`Processing queue message for publishedId: ${publishedId}`);
      
      try {
        await env.DB.prepare(`
          UPDATE published_curricula
          SET render_metrics = json_patch(render_metrics, ?)
          WHERE id = ?
        `).bind(JSON.stringify({ status: "processing", started_at: new Date().toISOString() }), publishedId).run();

        let browser;
        try {
          browser = await puppeteer.launch(env.BROWSER);
        } catch (launchErr: any) {
          console.error("Puppeteer launch failed:", launchErr);
          throw launchErr;
        }

        const page = await browser.newPage();
        
        const frontendUrl = env.FRONTEND_URL ?? "http://localhost:3000";
        const targetUrl = `${frontendUrl}/print/final?department=${encodeURIComponent(departmentId)}&academic_year=${encodeURIComponent(academicYearId)}&version=${encodeURIComponent(versionLabel)}`;
        
        console.log(`Navigating to print page: ${targetUrl}`);
        await page.goto(targetUrl, { waitUntil: "networkidle0" });

        try {
          await page.waitForSelector('main[data-fonts-loaded="true"]', { timeout: 15000 });
        } catch (fontErr) {
          console.warn("Fonts did not confirm loading in 15s, continuing anyway:", fontErr);
        }

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

        const pdfBuffer = await page.pdf({
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
        });

        await browser.close();

        const pdfKey = `published/${publishedId}.pdf`;
        await env.BUCKET.put(pdfKey, pdfBuffer, {
          httpMetadata: { contentType: "application/pdf" }
        });

        const pdfUrl = `/api/published-curricula/${publishedId}/download/`;
        await env.DB.prepare(`
          UPDATE published_curricula
          SET pdf_url = ?, render_metrics = json_patch(render_metrics, ?)
          WHERE id = ?
        `).bind(pdfUrl, JSON.stringify({ status: "completed", completed_at: new Date().toISOString() }), publishedId).run();

        console.log(`Publishing completed successfully for publishedId: ${publishedId}`);
      } catch (err: any) {
        console.error(`Error rendering PDF in queue worker: ${err.message}`);
        
        const attempts = message.attempts ?? 1;
        if (attempts >= 3) {
          await env.DB.prepare(`
            UPDATE published_curricula
            SET render_metrics = json_patch(render_metrics, ?)
            WHERE id = ?
          `).bind(JSON.stringify({ status: "failed", error: err.message, failed_at: new Date().toISOString() }), publishedId).run();
        } else {
          throw err;
        }
      }
    }
  }
};
