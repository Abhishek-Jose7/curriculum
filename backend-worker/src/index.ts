import { Hono } from "hono";
import { cors } from "hono/cors";
import { BaseRepository, normalizeValue } from "./repositories/base";
import { CoursesRepository, ReviewerRepository, WorkflowRepository } from "./repositories/curriculum";
import { requireAuth, signJwt, isAcademicAdmin, isReviewerOrAdmin, verifyJwt, requireRole } from "./middleware/auth";
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
      if (origin && (origin.endsWith(".vercel.app") || origin.startsWith("http://localhost:"))) {
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
  
  const accessToken = await signJwt(
    { sub: user.id, role: user.role, email: user.email },
    c.env.AUTH_JWT_SECRET,
    60 * 15
  );
  const refreshToken = await signJwt(
    { sub: user.id, typ: "refresh", jti: tokenJti },
    c.env.AUTH_JWT_SECRET,
    60 * 60 * 24 * 7
  );

  const isProduction = c.env.ENVIRONMENT === "production";
  const cookieBase = `HttpOnly; Path=/; SameSite=Lax${isProduction ? "; Secure" : ""}`;

  return new Response(
    JSON.stringify({ access: accessToken, refresh: refreshToken }),
    {
      status: 200,
      headers: new Headers([
        ["Content-Type", "application/json"],
        ["Set-Cookie", `curriculum_access=${accessToken}; Max-Age=900; ${cookieBase}`],
        ["Set-Cookie", `curriculum_refresh=${refreshToken}; Max-Age=604800; ${cookieBase}`],
      ]),
    }
  );
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

api.post("/auth/logout/", async (c) => {
  const isProduction = c.env.ENVIRONMENT === "production";
  const clearBase = `HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isProduction ? "; Secure" : ""}`;
  return new Response(JSON.stringify({ status: "logged_out" }), {
    status: 200,
    headers: new Headers([
      ["Content-Type", "application/json"],
      ["Set-Cookie", `curriculum_access=; ${clearBase}`],
      ["Set-Cookie", `curriculum_refresh=; ${clearBase}`],
    ]),
  });
});


api.use("*", requireAuth);

api.get("/auth/me/", (c) => c.json(c.get("user")));

api.get("/profiles/faculty", requireRole("ADMIN", "HOD"), async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, email, first_name, last_name, role, department_id FROM profiles WHERE role IN ('FACULTY', 'HOD', 'ADMIN') AND is_active = 1 ORDER BY first_name, last_name"
  ).all();
  return c.json(rows.results ?? []);
});
api.get("/profiles/faculty/", requireRole("ADMIN", "HOD"), async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, email, first_name, last_name, role, department_id FROM profiles WHERE role IN ('FACULTY', 'HOD', 'ADMIN') AND is_active = 1 ORDER BY first_name, last_name"
  ).all();
  return c.json(rows.results ?? []);
});

const deptsRoute = crudRoute("departments", ["code", "name", "college_name", "university_name", "logo_url"], ["code"], true);
api.route("/departments", deptsRoute);
api.route("/departments/", deptsRoute);

const handleCreateAcademicYear = async (c: any) => {
  if (!isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  try {
    const body = await c.req.json();
    const newAy = await new BaseRepository(
      c.env.DB,
      "academic_years",
      ["name", "starts_on", "ends_on", "is_active"],
      ["is_active"]
    ).create(body);

    const countRes = (await c.env.DB.prepare(
      "SELECT COUNT(*) AS count FROM academic_years WHERE id != ?"
    ).bind((newAy as any).id).first()) as any;
    const count = countRes?.count ?? 0;

    if (count === 0) {
      const depts = await c.env.DB.prepare("SELECT id FROM departments").all();
      for (const dept of (depts.results ?? []) as any[]) {
        const stmts: any[] = [];
        for (let semNumber = 1; semNumber <= 8; semNumber++) {
          const semId = crypto.randomUUID();
          stmts.push(
            c.env.DB.prepare(
              "INSERT INTO semesters (id, department_id, academic_year_id, number, title, ordinance) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(semId, dept.id, (newAy as any).id, semNumber, `Semester ${semNumber}`, "")
          );
          const c1Id = crypto.randomUUID();
          stmts.push(
            c.env.DB.prepare(
              `INSERT INTO courses (id, semester_id, code, title, course_type, credits, lecture_hours, tutorial_hours, status)
               VALUES (?, ?, ?, ?, 'THEORY', 4, 3, 1, 'DRAFT')`
            ).bind(c1Id, semId, `SUB${semNumber}01`, `Subject ${semNumber}.1`)
          );
          const c2Id = crypto.randomUUID();
          stmts.push(
            c.env.DB.prepare(
              `INSERT INTO courses (id, semester_id, code, title, course_type, credits, practical_hours, status)
               VALUES (?, ?, ?, ?, 'LAB', 2, 4, 'DRAFT')`
            ).bind(c2Id, semId, `SUB${semNumber}02`, `Subject ${semNumber}.2 Lab`)
          );
        }
        await c.env.DB.batch(stmts);
      }
    }

    return c.json(newAy, 201);
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes("UNIQUE constraint failed") || msg.includes("SQLITE_CONSTRAINT")) {
      return c.json({ detail: "A record with this identifier or semester number already exists for this selection." }, 400);
    }
    return c.json({ detail: msg }, 400);
  }
};

api.post("/academic-years", handleCreateAcademicYear);
api.post("/academic-years/", handleCreateAcademicYear);

const ayRoute = crudRoute("academic_years", ["name", "starts_on", "ends_on", "is_active"], ["is_active"], true);
api.route("/academic-years", ayRoute);
api.route("/academic-years/", ayRoute);

api.post("/academic-years/:id/rollover/", requireRole("ADMIN"), async (c) => {
  const targetAyId = c.req.param("id");
  try {
    const targetAy = await c.env.DB.prepare("SELECT * FROM academic_years WHERE id = ?").bind(targetAyId).first<any>();
    if (!targetAy) return c.json({ detail: "Not found." }, 404);

    const priorYear = await c.env.DB.prepare("SELECT * FROM academic_years WHERE id != ? ORDER BY starts_on DESC LIMIT 1").bind(targetAyId).first<any>();
    if (!priorYear) {
      return c.json({ message: "No prior academic year to clone from", semesters_cloned: 0, courses_cloned: 0 });
    }

    const priorSemesters = await c.env.DB.prepare("SELECT * FROM semesters WHERE academic_year_id = ?").bind(priorYear.id).all<any>();
    
    let semestersCloned = 0;
    let coursesCloned = 0;

    for (const priorSem of priorSemesters.results ?? []) {
      const newSemId = crypto.randomUUID();
      const semResult = await c.env.DB.prepare(`
        INSERT INTO semesters (id, department_id, academic_year_id, number, title, ordinance)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(department_id, academic_year_id, number) DO NOTHING
        RETURNING *
      `).bind(newSemId, priorSem.department_id, targetAy.id, priorSem.number, priorSem.title, priorSem.ordinance).first<any>();

      if (!semResult) continue; // Skip if conflict
      const insertedSemId = semResult.id;
      semestersCloned++;

      const priorCourses = await c.env.DB.prepare("SELECT * FROM courses WHERE semester_id = ?").bind(priorSem.id).all<any>();
      
      for (const origCourse of priorCourses.results ?? []) {
        const newCourseId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO courses (
            id, semester_id, code, title, course_type,
            lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
            lecture_credits, tutorial_credits, practical_credits, credits,
            internal_marks, external_marks, duration_hours, passing_marks,
            objectives, pre_requisites, syllabus_intro, online_resources, section_order,
            status, faculty_user_id, approved_by_user_id
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            'DRAFT', NULL, NULL
          )
        `).bind(
          newCourseId, insertedSemId, origCourse.code, origCourse.title, origCourse.course_type,
          origCourse.lecture_hours, origCourse.tutorial_hours, origCourse.practical_hours, origCourse.self_learning_hours,
          origCourse.lecture_credits, origCourse.tutorial_credits, origCourse.practical_credits, origCourse.credits,
          origCourse.internal_marks, origCourse.external_marks, origCourse.duration_hours, origCourse.passing_marks,
          origCourse.objectives, origCourse.pre_requisites, origCourse.syllabus_intro, origCourse.online_resources, origCourse.section_order
        ).run();
        
        coursesCloned++;

        const cloneChild = async (table: string, parentCol: string, origParentId: string, newParentId: string, fields: string[]) => {
          const rows = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE ${parentCol} = ?`).bind(origParentId).all<any>();
          if (!rows.results?.length) return;
          const stmts = rows.results.map(row => {
            const newId = crypto.randomUUID();
            const cols = ["id", parentCol, ...fields];
            const vals = [newId, newParentId, ...fields.map(f => row[f])];
            const qs = cols.map(() => "?").join(", ");
            return c.env.DB.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${qs})`).bind(...vals);
          });
          await c.env.DB.batch(stmts);
        };

        await cloneChild("course_outcomes", "course_id", origCourse.id, newCourseId, ["code", "description", "bloom_level", "sort_order"]);
        await cloneChild("assessment_schemes", "course_id", origCourse.id, newCourseId, ["component", "marks", "description", "sort_order"]);
        await cloneChild("reference_books", "course_id", origCourse.id, newCourseId, ["title", "authors", "publisher", "edition", "year", "is_textbook", "sort_order"]);
        
        const oldModules = await c.env.DB.prepare("SELECT * FROM modules WHERE course_id = ?").bind(origCourse.id).all<any>();
        if (oldModules.results?.length) {
          const modStmts: any[] = [];
          const modMap = new Map();
          for (const m of oldModules.results) {
            const nmId = crypto.randomUUID();
            modMap.set(m.id, nmId);
            modStmts.push(c.env.DB.prepare(`INSERT INTO modules (id, course_id, number, title, contact_hours, content, references) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(nmId, newCourseId, m.number, m.title, m.contact_hours, m.content, m.references));
          }
          await c.env.DB.batch(modStmts);

          const topicStmts: any[] = [];
          for (const m of oldModules.results) {
            const nModId = modMap.get(m.id);
            const oldTopics = await c.env.DB.prepare("SELECT * FROM topics WHERE module_id = ?").bind(m.id).all<any>();
            for (const t of oldTopics.results ?? []) {
              topicStmts.push(c.env.DB.prepare(`INSERT INTO topics (id, module_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), nModId, t.title, t.description, t.sort_order));
            }
          }
          if (topicStmts.length > 0) {
            const batches = [];
            for (let i = 0; i < topicStmts.length; i += 100) batches.push(topicStmts.slice(i, i + 100));
            for (const b of batches) await c.env.DB.batch(b);
          }
        }
      }
    }

    return c.json({
      message: "Rollover complete",
      source_academic_year: priorYear.name,
      target_academic_year: targetAy.name,
      semesters_cloned: semestersCloned,
      courses_cloned: coursesCloned
    });
  } catch (e: any) {
    console.error("Rollover failed", e);
    return c.json({ detail: "Rollover failed: " + e.message }, 500);
  }
});

const semestersRoute = crudRoute("semesters", ["department_id", "academic_year_id", "number", "title", "ordinance"], ["department_id", "academic_year_id", "number"], true);
api.route("/semesters", semestersRoute);
api.route("/semesters/", semestersRoute);

const templatesRoute = crudRoute("curriculum_templates", ["department_id", "name", "html_template", "css", "template_pdf_url", "is_active"], ["department_id", "is_active"], true);
api.route("/curriculum-templates", templatesRoute);
api.route("/curriculum-templates/", templatesRoute);

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

const handleAssignFaculty = async (c: any) => {
  const body = await c.req.json().catch(() => ({}));
  const facultyUserId = body.faculty_user_id !== undefined ? body.faculty_user_id : null;
  const course = (await c.env.DB
    .prepare("UPDATE courses SET faculty_user_id = ? WHERE id = ? RETURNING *")
    .bind(facultyUserId, c.req.param("id"))
    .first()) as any;
  if (!course) {
    return c.json({ detail: "Course not found." }, 404);
  }
  return c.json(course);
};

api.patch("/courses/:id/assign-faculty", requireRole("ADMIN", "HOD"), handleAssignFaculty);
api.patch("/courses/:id/assign-faculty/", requireRole("ADMIN", "HOD"), handleAssignFaculty);

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

api.post("/courses/:id/share/", async (c) => {
  if (!isReviewerOrAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  const token = crypto.randomUUID();
  const course = await c.env.DB.prepare("UPDATE courses SET share_token = ? WHERE id = ? RETURNING *").bind(token, c.req.param("id")).first<any>();
  if (!course) return c.json({ detail: "Not found." }, 404);
  return c.json({ share_token: course.share_token });
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

api.get("/published-curricula/", async (c) => c.json(await new BaseRepository(c.env.DB, "published_curricula", [], ["department_id", "academic_year_id", "is_public", "year_of_study"]).list(Object.fromEntries(new URL(c.req.url).searchParams))));

api.get("/published-curricula/archive/", requireRole('HOD', 'ADMIN'), async (c) => {
  const user = c.get('user');
  
  let query = `
    SELECT 
      pc.*,
      ay.name as academic_year_name,
      d.name as department_name,
      d.code as department_code
    FROM published_curricula pc
    JOIN academic_years ay ON pc.academic_year_id = ay.id
    JOIN departments d ON pc.department_id = d.id
  `;
  
  const params: any[] = [];
  
  // HOD only sees their department
  if (user.role === 'HOD' && user.department_id) {
    query += ' WHERE pc.department_id = ?';
    params.push(user.department_id);
  }
  
  query += ' ORDER BY ay.starts_on DESC, pc.year_of_study ASC';
  
  const rows = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(rows.results ?? []);
});

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
  
  const YEAR_SEM_MAP: Record<string, number[]> = {
    FE: [1, 2], SE: [3, 4], TE: [5, 6], BE: [7, 8]
  };
  if (!body.year_of_study || !YEAR_SEM_MAP[body.year_of_study]) {
    return c.json({ detail: "Invalid or missing year_of_study" }, 400);
  }
  const sems = YEAR_SEM_MAP[body.year_of_study];

  const template = await c.env.DB.prepare("SELECT * FROM curriculum_templates WHERE id = ?").bind(body.template).first<any>();
  if (!template) return c.json({ detail: "Template not found." }, 404);
  const count = await c.env.DB.prepare("SELECT count(*) AS n FROM courses c JOIN semesters s ON s.id = c.semester_id WHERE s.department_id = ? AND s.academic_year_id = ? AND s.number IN (?,?) AND c.status IN ('APPROVED','PUBLISHED')").bind(body.department, body.academic_year, sems[0], sems[1]).first<any>();
  const printUrl = `/print/final?department=${encodeURIComponent(body.department)}&academic_year=${encodeURIComponent(body.academic_year)}&year_of_study=${encodeURIComponent(body.year_of_study)}&version=${encodeURIComponent(body.version_label ?? "v1")}`;
  
  const published = await c.env.DB.prepare(`
    INSERT INTO published_curricula (department_id, academic_year_id, template_id, published_by_user_id, print_url, pdf_url, version_label, template_snapshot, render_metrics, year_of_study)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
  `).bind(
    body.department,
    body.academic_year,
    body.template,
    c.get("user").id,
    printUrl,
    "",
    body.version_label ?? "v1",
    JSON.stringify({ css: template.css, html_template: template.html_template, name: template.name }),
    JSON.stringify({ status: "queued", course_count: count?.n ?? 0, export: "pdf-render" }),
    body.year_of_study
  ).first<any>();

  await c.env.DB.prepare("UPDATE courses SET status = 'PUBLISHED' WHERE id IN (SELECT c.id FROM courses c JOIN semesters s ON s.id = c.semester_id WHERE s.department_id = ? AND s.academic_year_id = ? AND s.number IN (?,?) AND c.status IN ('APPROVED','PUBLISHED'))").bind(body.department, body.academic_year, sems[0], sems[1]).run();
  await c.env.DB.prepare("UPDATE curriculum_templates SET is_locked = 1 WHERE id = ?").bind(body.template).run();

  c.executionCtx.waitUntil(
    generatePdfTask(c.env, published.id, body.department, body.academic_year, body.version_label ?? "v1", body.year_of_study)
  );

  return c.json(published, 202);
});

api.post('/published-curricula/:id/hod-approve/', requireRole('HOD', 'ADMIN'), async (c) => {
  const { id } = c.req.param();
  const user = c.get('user');
  
  // Find the published curriculum
  const curriculum = await c.env.DB.prepare(
    'SELECT * FROM published_curricula WHERE id = ?'
  ).bind(id).first<any>();
  
  if (!curriculum) return c.json({ detail: 'Not found.' }, 404);
  
  // HOD can only approve their own department
  if (user.role === 'HOD' && curriculum.department_id !== user.department_id) {
    return c.json({ detail: 'Permission denied.' }, 403);
  }
  
  await c.env.DB.prepare(
    'UPDATE published_curricula SET hod_approved_at = ?, hod_approved_by = ? WHERE id = ?'
  ).bind(new Date().toISOString(), user.id, id).run();
  
  return c.json({ status: 'approved' });
});

app.get("/public/review/:token/", async (c) => {
  const row = await c.env.DB.prepare("SELECT id, status FROM courses WHERE share_token = ?").bind(c.req.param("token")).first<{ id: string, status: string }>();
  if (!row) return c.json({ detail: "This review link is invalid or has expired.", code: "TOKEN_INVALID" }, 404);
  if (row.status === "DRAFT") return c.json({ detail: "This syllabus is not yet ready for review.", code: "SYLLABUS_DRAFT" }, 400);
  const course = await new CoursesRepository(c.env.DB).detail(row.id);
  return c.json(course);
});

app.get("/public/review/:token/comments/", async (c) => {
  const row = await c.env.DB.prepare("SELECT id, status FROM courses WHERE share_token = ?").bind(c.req.param("token")).first<{ id: string, status: string }>();
  if (!row) return c.json({ detail: "This review link is invalid or has expired.", code: "TOKEN_INVALID" }, 404);
  const comments = await c.env.DB.prepare("SELECT * FROM reviewer_comments WHERE course_id = ? ORDER BY created_at DESC").bind(row.id).all();
  return c.json(comments.results ?? []);
});

app.post("/public/review/:token/comments/", async (c) => {
  const body = await c.req.json<{ section_key: string, section_label: string, body: string, reviewer_name: string, reviewer_email?: string }>();
  const row = await c.env.DB.prepare("SELECT id, status FROM courses WHERE share_token = ?").bind(c.req.param("token")).first<{ id: string, status: string }>();
  if (!row) return c.json({ detail: "This review link is invalid or has expired.", code: "TOKEN_INVALID" }, 404);
  if (row.status === "DRAFT") return c.json({ detail: "This syllabus is not yet ready for review.", code: "SYLLABUS_DRAFT" }, 400);
  if (!body.reviewer_name || !body.body) return c.json({ detail: "Name and comments are required.", code: "FEEDBACK_INVALID" }, 400);
  
  const comment = await c.env.DB.prepare(`
    INSERT INTO reviewer_comments (id, course_id, section_key, section_label, body, is_external, reviewer_name, reviewer_email)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?) RETURNING *
  `).bind(
    crypto.randomUUID(), row.id, body.section_key || "General", body.section_label || "General", body.body, body.reviewer_name, body.reviewer_email ?? null
  ).first();
  return c.json(comment, 201);
});

app.onError((err, c) => {
  console.error("Backend error:", err);
  const message = err.message || "An unexpected server error occurred.";
  if (message.includes("UNIQUE constraint failed") || message.includes("SQLITE_CONSTRAINT")) {
    return c.json({ detail: "A record with this number/code already exists for this selection." }, 400);
  }
  return c.json({ detail: message }, 400);
});

app.route("/api", api);

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
    await syncChildren(db, "modules", "course_id", courseId, data.modules, ["number", "title", "contact_hours", "content", "references"], undefined, async (module, row) => {
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
      const assignments = columns.filter((field) => field !== parentColumn).map((field) => `"${field}" = ?`).join(", ");
      row = await db.prepare(`UPDATE ${table} SET ${assignments} WHERE id = ? RETURNING *`).bind(...values.slice(1), item.id).first();
    } else {
      const quotedCols = columns.map((c) => `"${c}"`).join(", ");
      row = await db.prepare(`INSERT INTO ${table} (${quotedCols}) VALUES (${columns.map(() => "?").join(", ")}) RETURNING *`).bind(...values).first();
    }
    if (row?.id) seen.add(String(row.id));
    if (afterUpsert && row) await afterUpsert(item, row);
  }
  for (const row of existing.results ?? []) {
    if (!seen.has(String(row.id))) await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(row.id).run();
  }
}

async function generatePdfTask(env: Env, publishedId: string, departmentId: string, academicYearId: string, versionLabel: string, yearOfStudy?: string) {
  console.log(`Processing background PDF generation for publishedId: ${publishedId}`);
  
  try {
    await env.DB.prepare(`
      UPDATE published_curricula
      SET render_metrics = json_patch(render_metrics, ?)
      WHERE id = ?
    `).bind(JSON.stringify({ status: "processing", started_at: new Date().toISOString() }), publishedId).run();

    if (!env.BROWSERLESS_API_TOKEN) {
      throw new Error("BROWSERLESS_API_TOKEN is not configured.");
    }

    const frontendUrl = env.FRONTEND_URL ?? "http://localhost:3000";
    const targetUrl = yearOfStudy 
      ? `${frontendUrl}/print/final?department=${encodeURIComponent(departmentId)}&academic_year=${encodeURIComponent(academicYearId)}&year_of_study=${encodeURIComponent(yearOfStudy)}&version=${encodeURIComponent(versionLabel)}`
      : `${frontendUrl}/print/final?department=${encodeURIComponent(departmentId)}&academic_year=${encodeURIComponent(academicYearId)}&version=${encodeURIComponent(versionLabel)}`;
    
    console.log(`Requesting PDF from Browserless for URL: ${targetUrl}`);

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

    const browserlessReq = {
      url: targetUrl,
      options: {
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
      },
      gotoOptions: {
        waitUntil: "networkidle0"
      },
      waitFor: "main[data-fonts-loaded=\"true\"]"
    };

    const response = await fetch(`https://chrome.browserless.io/pdf?token=${env.BROWSERLESS_API_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(browserlessReq)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Browserless API failed with status ${response.status}: ${errorText}`);
    }

    const pdfBuffer = await response.arrayBuffer();

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
    console.error(`Error rendering PDF in background task: ${err.message}`);
    
    await env.DB.prepare(`
      UPDATE published_curricula
      SET render_metrics = json_patch(render_metrics, ?)
      WHERE id = ?
    `).bind(JSON.stringify({ status: "failed", error: err.message, failed_at: new Date().toISOString() }), publishedId).run();
  }
}

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<any>, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      try {
        const { publishedId, departmentId, academicYearId, versionLabel, yearOfStudy } = message.body || {};
        if (publishedId) {
          await generatePdfTask(env, publishedId, departmentId, academicYearId, versionLabel, yearOfStudy);
        }
        message.ack();
      } catch (e) {
        console.error("Queue message processing error:", e);
        message.retry();
      }
    }
  }
};
