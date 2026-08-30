import { Hono } from "hono";
import type { Context, Next } from "hono";
import { cors } from "hono/cors";
import { BaseRepository, normalizeValue } from "./repositories/base";
import { CoursesRepository, ReviewerRepository, WorkflowRepository } from "./repositories/curriculum";
import { schemesRoutes } from "./routes/schemes";
import { generateCourseCode, findPreviousMatches, copyDetailedContent } from "./services/courseCode";
import { PreamblesRepository, TeachingComponentsRepository, CompileOrderRepository, SchemesRepository } from "./repositories/schemes";
import { VERTICAL_SUBVERTICALS, type Vertical, type SubVertical, type TeachingComponentInput, PAIR_SEMESTERS, type YearOfStudy } from "./types/scheme";
import { requireAuth, signJwt, isAcademicAdmin, verifyJwt, requireRole } from "./middleware/auth";
import { verifyPassword, hashPassword } from "./services/auth";
import { createCourseVersion, diffSnapshots } from "./services/courseVersions";
import { generatePin, generateReviewLinkIfMissing, isLocked, lockoutSecondsRemaining, signReviewSession, verifyReviewSession, REVIEW_PIN_CONSTANTS } from "./services/reviewSession";
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

  const cookieBase = "HttpOnly; Path=/; SameSite=None; Secure";

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
  const clearBase = "HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure";
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

const handleListFaculty = async (c: any) => {
  const roleFilter = c.req.query("role");
  const deptFilter = c.req.query("department_id");
  let query = "SELECT id, email, first_name, last_name, role, department_id FROM profiles WHERE role IN ('FACULTY', 'HOD', 'ADMIN') AND is_active = 1";
  const params: any[] = [];
  if (roleFilter) {
    query += " AND role = ?";
    params.push(roleFilter);
  }
  if (deptFilter) {
    query += " AND department_id = ?";
    params.push(deptFilter);
  }
  query += " ORDER BY first_name, last_name";
  const rows = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(rows.results ?? []);
};

api.get("/profiles/faculty", requireRole("ADMIN", "HOD"), handleListFaculty);
api.get("/profiles/faculty/", requireRole("ADMIN", "HOD"), handleListFaculty);

api.post("/teachers/", requireRole("ADMIN", "HOD"), async (c) => {
  const user = c.get("user");
  const { name, email, password, department_id } = await c.req.json<any>();
  if (!name || !email || !password) return c.json({ error: "TEACHER_FIELDS_REQUIRED" }, 400);
  if (password.length < 8) return c.json({ error: "PASSWORD_TOO_SHORT" }, 400);

  const targetDeptId = user.role === "HOD" ? user.department_id : department_id;
  if (!targetDeptId) return c.json({ error: "TEACHER_FIELDS_REQUIRED" }, 400);

  const existing = await c.env.DB.prepare("SELECT id FROM profiles WHERE email = ?").bind(email).first();
  if (existing) return c.json({ error: "EMAIL_EXISTS" }, 400);

  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  // Split full name into first_name + last_name (last word → last_name, rest → first_name)
  const nameTrimmed = name.trim();
  const spaceIdx = nameTrimmed.lastIndexOf(" ");
  const firstName = spaceIdx >= 0 ? nameTrimmed.slice(0, spaceIdx) : nameTrimmed;
  const lastName = spaceIdx >= 0 ? nameTrimmed.slice(spaceIdx + 1) : "";
  await c.env.DB.prepare(
    `INSERT INTO profiles (id, email, username, password_hash, role, department_id, first_name, last_name, is_active, created_at)
     VALUES (?, ?, ?, ?, 'FACULTY', ?, ?, ?, 1, ?)`
  ).bind(id, email, email, passwordHash, targetDeptId, firstName, lastName, new Date().toISOString()).run();

  return c.json({ id, name, email, department_id: targetDeptId, is_active: true }, 201);
});

api.patch("/teachers/:id/status/", requireRole("ADMIN", "HOD"), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const { is_active } = await c.req.json<any>();
  const teacher = await c.env.DB.prepare("SELECT department_id FROM profiles WHERE id = ? AND role = 'FACULTY'").bind(id).first<any>();
  if (!teacher) return c.json({ detail: "Not found" }, 404);
  if (user.role === "HOD" && teacher.department_id !== user.department_id) {
    return c.json({ detail: "Forbidden" }, 403);
  }
  await c.env.DB.prepare("UPDATE profiles SET is_active = ? WHERE id = ?").bind(is_active ? 1 : 0, id).run();
  return c.json({ id, is_active });
});

const deptsRoute = crudRoute("departments", ["code", "name", "college_name", "university_name", "logo_url"], ["code"], true);
api.route("/departments", deptsRoute);
api.route("/departments/", deptsRoute);

api.get("/departments/:id/preamble", async (c) => {
  const id = c.req.param("id");
  const content = await PreamblesRepository.get(c.env.DB, id);
  return c.json({ department_id: id, content });
});
api.get("/departments/:id/preamble/", async (c) => {
  const id = c.req.param("id");
  const content = await PreamblesRepository.get(c.env.DB, id);
  return c.json({ department_id: id, content });
});
api.put("/departments/:id/preamble", async (c) => handleSetPreamble(c));
api.put("/departments/:id/preamble/", async (c) => handleSetPreamble(c));

async function handleSetPreamble(c: Context<{ Bindings: Env; Variables: Variables }>) {
  const id = c.req.param("id") as string;
  const user = c.get("user");
  if (user.role !== "ADMIN" && (user.role !== "HOD" || user.department_id !== id)) {
    return c.json({ error: "DEPARTMENT_MISMATCH", detail: "Permission denied." }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as { content?: string };
  const content = body.content ?? "";
  await PreamblesRepository.set(c.env.DB, id, content, user.id);
  return c.json({ department_id: id, content });
}

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

api.route("/curriculum-schemes", schemesRoutes);
api.route("/curriculum-schemes/", schemesRoutes);

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
  const user = c.get("user");
  const body = await c.req.json<any>();

  // Scheme-based shell creation (Phase 2)
  if (body.scheme_id) {
    if (user.role !== "ADMIN" && user.role !== "HOD") {
      return c.json({ detail: "Permission denied." }, 403);
    }
    const scheme = await SchemesRepository.get(c.env.DB, body.scheme_id);
    if (!scheme) return c.json({ detail: "Scheme not found." }, 404);
    if (user.role === "HOD" && user.department_id && user.department_id !== scheme.department_id) {
      return c.json({ error: "DEPARTMENT_MISMATCH", detail: "Department mismatch." }, 403);
    }

    const vertical = body.vertical as Vertical;
    const subVertical = body.sub_vertical as SubVertical;
    if (!vertical || !VERTICAL_SUBVERTICALS[vertical] || !subVertical || !VERTICAL_SUBVERTICALS[vertical].includes(subVertical)) {
      return c.json({ error: "INVALID_SUBVERTICAL", detail: "Invalid vertical or sub_vertical selection." }, 400);
    }

    const semesterNumber = Number(body.semester_number);
    const semester = await c.env.DB
      .prepare("SELECT * FROM semesters WHERE scheme_id = ? AND number = ?")
      .bind(body.scheme_id, semesterNumber)
      .first<any>();
    if (!semester) return c.json({ detail: "Semester not found." }, 404);

    const components = body.components as TeachingComponentInput[];
    if (!components || !Array.isArray(components) || components.length === 0) {
      return c.json({ error: "NO_COMPONENTS", detail: "At least one teaching component is required." }, 400);
    }

    const dept = await c.env.DB
      .prepare("SELECT code FROM departments WHERE id = ?")
      .bind(scheme.department_id)
      .first<{ code: string }>();
    const programCode = dept?.code || "EC";

    let code = body.code ? String(body.code).trim() : "";
    let codeIsCustom = 0;
    if (code) {
      codeIsCustom = 1;
    } else {
      code = await generateCourseCode(c.env.DB, {
        scheme_id: body.scheme_id,
        scheme_year_code: scheme.scheme_year_code,
        sub_vertical: subVertical,
        semester_number: semesterNumber,
        program_code: programCode,
      });
    }

    const collision = await c.env.DB
      .prepare("SELECT 1 FROM courses c JOIN semesters s ON c.semester_id = s.id WHERE s.scheme_id = ? AND c.code = ?")
      .bind(body.scheme_id, code)
      .first();
    if (collision) {
      return c.json({ error: "CODE_TAKEN", detail: "Course code already exists in this scheme." }, 409);
    }

    const totalCredits = components.reduce((acc, comp) => acc + (Number(comp.credit_points) || 0), 0);
    const newCourseId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB
      .prepare(
        `INSERT INTO courses (
          id, semester_id, code, code_is_custom, title, course_type, status,
          faculty_user_id, vertical, sub_vertical, total_credits, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', NULL, ?, ?, ?, ?, ?)`
      )
      .bind(
        newCourseId,
        semester.id,
        code,
        codeIsCustom,
        body.title || "Untitled Course",
        body.course_type || "THEORY",
        vertical,
        subVertical,
        totalCredits,
        now,
        now
      )
      .run();

    await TeachingComponentsRepository.replaceForCourse(c.env.DB, newCourseId, components);
    await generateReviewLinkIfMissing(c.env.DB, newCourseId);
    await createCourseVersion(c.env.DB, newCourseId, user, "Course shell created");

    const createdCourse = await new CoursesRepository(c.env.DB).detail(newCourseId);
    return c.json(createdCourse, 201);
  }

  // Legacy fallback creation
  if (!isAcademicAdmin(user)) return c.json({ detail: "Permission denied." }, 403);
  if (!body.faculty_user_id) return c.json({ error: "TEACHER_REQUIRED" }, 400);
  const semester = await c.env.DB.prepare("SELECT department_id FROM semesters WHERE id = ?").bind(body.semester_id ?? body.semester).first<any>();
  const teacher = await c.env.DB.prepare("SELECT department_id, role, is_active FROM profiles WHERE id = ?").bind(body.faculty_user_id).first<any>();
  if (!teacher || teacher.role !== "FACULTY" || !teacher.is_active) return c.json({ error: "TEACHER_INVALID" }, 400);
  if (!semester || teacher.department_id !== semester.department_id) return c.json({ error: "TEACHER_DEPARTMENT_MISMATCH" }, 400);
  const course = await new CoursesRepository(c.env.DB).create(body);
  await generateReviewLinkIfMissing(c.env.DB, course.id);
  await createCourseVersion(c.env.DB, course.id, user, "Course created");
  return c.json(course, 201);
});

api.get("/courses/:id", async (c) => handleGetCourse(c));
api.get("/courses/:id/", async (c) => handleGetCourse(c));

async function handleGetCourse(c: any) {
  const course = await new CoursesRepository(c.env.DB).detail(c.req.param("id"));
  return course ? c.json(course) : c.json({ detail: "Not found." }, 404);
}

api.patch("/courses/:id/shell", requireRole("ADMIN", "HOD"), async (c) => {
  const user = c.get("user");
  const courseId = c.req.param("id") as string;
  const body = (await c.req.json()) as any;

  const course = await c.env.DB
    .prepare(
      `SELECT c.*, s.scheme_id, s.department_id
       FROM courses c
       JOIN semesters s ON c.semester_id = s.id
       WHERE c.id = ?`
    )
    .bind(courseId)
    .first<any>();

  if (!course) return c.json({ detail: "Course not found." }, 404);

  if (user.role === "HOD" && user.department_id && user.department_id !== course.department_id) {
    return c.json({ error: "DEPARTMENT_MISMATCH", detail: "Department mismatch." }, 403);
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (body.title !== undefined) {
    updates.push("title = ?");
    params.push(body.title);
  }
  if (body.vertical !== undefined) {
    updates.push("vertical = ?");
    params.push(body.vertical);
  }
  if (body.sub_vertical !== undefined) {
    updates.push("sub_vertical = ?");
    params.push(body.sub_vertical);
  }
  if (body.code !== undefined && (course.code_is_custom === 1 || body.code_is_custom === 1)) {
    updates.push("code = ?");
    params.push(body.code);
    updates.push("code_is_custom = 1");
  }

  if (body.components && Array.isArray(body.components)) {
    await TeachingComponentsRepository.replaceForCourse(c.env.DB, courseId, body.components);
    const totalCredits = (body.components as TeachingComponentInput[]).reduce((sum, comp) => sum + (Number(comp.credit_points) || 0), 0);
    updates.push("total_credits = ?");
    params.push(totalCredits);
  }

  if (course.status !== "DRAFT") {
    try {
      await c.env.DB
        .prepare(
          `INSERT INTO audit_logs (user_id, method, path, status_code, user_agent, created_at)
           VALUES (?, 'PATCH', ?, 200, ?, ?)`
        )
        .bind(
          user.id,
          `/courses/${courseId}/shell`,
          `Shell edited on ${course.status} course`,
          new Date().toISOString()
        )
        .run();
    } catch (e) {
      console.warn("Audit log insert failed:", e);
    }
  }

  const now = new Date().toISOString();
  updates.push("updated_at = ?");
  params.push(now);

  if (updates.length > 0) {
    await c.env.DB
      .prepare(`UPDATE courses SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...params, courseId)
      .run();
  }

  await createCourseVersion(c.env.DB, courseId, user, "Course shell updated");
  const detail = await new CoursesRepository(c.env.DB).detail(courseId);
  return c.json(detail);
});

api.put("/courses/:id/", async (c) => updateCourse(c));
api.patch("/courses/:id/", async (c) => updateCourse(c));

const handleAssignFaculty = async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  const body = ((await c.req.json().catch(() => ({}))) || {}) as any;
  const facultyUserId = body.faculty_user_id !== undefined ? body.faculty_user_id : null;
  const courseId = c.req.param("id") as string;

  const courseRow = await c.env.DB
    .prepare("SELECT c.semester_id, s.department_id, s.is_unlocked FROM courses c JOIN semesters s ON c.semester_id = s.id WHERE c.id = ?")
    .bind(courseId)
    .first<any>();

  if (!courseRow) {
    return c.json({ detail: "Course not found." }, 404);
  }

  if (courseRow.is_unlocked === 0) {
    return c.json({ error: "SEMESTER_LOCKED", detail: "This semester isn't unlocked yet." }, 400);
  }

  if (facultyUserId) {
    const teacher = await c.env.DB.prepare("SELECT department_id, role, is_active FROM profiles WHERE id = ?").bind(facultyUserId).first<any>();
    if (!teacher || teacher.role !== "FACULTY" || !teacher.is_active) return c.json({ error: "TEACHER_INVALID" }, 400);
    if (teacher.department_id !== courseRow.department_id) return c.json({ error: "TEACHER_DEPARTMENT_MISMATCH" }, 400);
  }

  const course = (await c.env.DB
    .prepare("UPDATE courses SET faculty_user_id = ? WHERE id = ? RETURNING *")
    .bind(facultyUserId, courseId)
    .first()) as any;

  await generateReviewLinkIfMissing(c.env.DB, course.id);
  return c.json(course);
};

api.patch("/courses/:id/assign-faculty", requireRole("ADMIN", "HOD"), handleAssignFaculty);
api.patch("/courses/:id/assign-faculty/", requireRole("ADMIN", "HOD"), handleAssignFaculty);

api.get("/courses/:id/previous-matches", async (c) => {
  const matches = await findPreviousMatches(c.env.DB, c.req.param("id") as string);
  return c.json({ matches });
});
api.get("/courses/:id/previous-matches/", async (c) => {
  const matches = await findPreviousMatches(c.env.DB, c.req.param("id") as string);
  return c.json({ matches });
});

api.post("/courses/:id/copy-from/:previousCourseId", async (c) => handleCopyFrom(c));
api.post("/courses/:id/copy-from/:previousCourseId/", async (c) => handleCopyFrom(c));

async function handleCopyFrom(c: Context<{ Bindings: Env; Variables: Variables }>) {
  const user = c.get("user");
  const targetCourseId = c.req.param("id") as string;
  const previousCourseId = c.req.param("previousCourseId") as string;

  const targetCourse = await c.env.DB
    .prepare("SELECT c.*, s.department_id FROM courses c JOIN semesters s ON c.semester_id = s.id WHERE c.id = ?")
    .bind(targetCourseId)
    .first<any>();

  if (!targetCourse) return c.json({ detail: "Course not found." }, 404);

  const canCopy =
    user.role === "ADMIN" ||
    (user.role === "HOD" && user.department_id === targetCourse.department_id) ||
    (targetCourse.faculty_user_id && targetCourse.faculty_user_id === user.id);

  if (!canCopy) {
    return c.json({ error: "NOT_ASSIGNED", detail: "You are not assigned to author this course." }, 403);
  }

  const matches = await findPreviousMatches(c.env.DB, targetCourseId);
  const isValidMatch = matches.some((m) => m.course_id === previousCourseId);
  if (!isValidMatch) {
    return c.json({ error: "NOT_A_VALID_MATCH", detail: "Target course cannot be copied from this source course." }, 400);
  }

  if (targetCourse.status !== "DRAFT") {
    return c.json({ error: "ALREADY_STARTED", detail: "Cannot copy into a course that has progressed beyond DRAFT." }, 409);
  }

  await copyDetailedContent(c.env.DB, targetCourseId, previousCourseId, user.id);
  const updated = await new CoursesRepository(c.env.DB).detail(targetCourseId);
  return c.json(updated);
}

const PREVIOUS_SUBJECTS: Record<string, Array<{ code: string; title: string; course_type: string; credits: number; semester: number }>> = {
  "COMP": [
    { code: "25BSC12CE05", title: "Discrete Mathematics and Graph Theory", course_type: "THEORY", credits: 2, semester: 3 },
    { code: "25PCC12CE05", title: "Computer Organization and Architecture", course_type: "THEORY_LAB", credits: 3, semester: 3 },
    { code: "25PCC12CE06", title: "Data Structures", course_type: "THEORY_LAB", credits: 4, semester: 3 },
    { code: "25PCC12CE07", title: "Object Oriented Programming with JAVA", course_type: "LAB", credits: 1, semester: 3 },
    { code: "25OE13CE11", title: "Law for Engineers", course_type: "THEORY", credits: 2, semester: 3 },
    { code: "25OE13CE12", title: "Financial Planning, Taxation and Investment", course_type: "THEORY", credits: 2, semester: 3 },
    { code: "25VEC12CE01", title: "Human Values and Professional Ethics", course_type: "THEORY", credits: 2, semester: 3 },
    { code: "25CEP12CE01", title: "Community Engagement Project", course_type: "PROJECT", credits: 2, semester: 3 },
    { code: "25BSC12CE06", title: "Linear Algebra and Business Statistics", course_type: "THEORY", credits: 2, semester: 4 },
    { code: "25PCC12CE08", title: "Database Management Systems", course_type: "THEORY_LAB", credits: 3, semester: 4 },
    { code: "25PCC12CE09", title: "Analysis of Algorithm", course_type: "THEORY_LAB", credits: 4, semester: 4 },
    { code: "25PCC12CE010", title: "Operating Systems", course_type: "THEORY_LAB", credits: 3, semester: 4 },
    { code: "25OE13CE21", title: "Emerging Technology and Law", course_type: "THEORY", credits: 2, semester: 4 },
    { code: "25OE13CE22", title: "Principles of Management", course_type: "THEORY", credits: 2, semester: 4 },
    { code: "25VSE12CE03", title: "Full Stack Development", course_type: "LAB", credits: 2, semester: 4 },
    { code: "25EEM12CE02", title: "Technology Entrepreneurship", course_type: "THEORY", credits: 2, semester: 4 },
    { code: "25VEC12CE02", title: "Technology Innovation for Sustainable Development", course_type: "THEORY", credits: 2, semester: 4 },
    { code: "25PCC13CE11", title: "Cryptography and System Security", course_type: "THEORY_LAB", credits: 3, semester: 5 },
    { code: "25PCC13CE12", title: "Theory of Computer Science", course_type: "THEORY_LAB", credits: 3, semester: 5 },
    { code: "25PCC13CE13", title: "System Programming and Compiler construction", course_type: "THEORY_LAB", credits: 3, semester: 5 },
    { code: "25PCC13CE14", title: "Data Warehousing and Mining", course_type: "THEORY_LAB", credits: 3, semester: 5 },
    { code: "25VSE13CE04", title: "Cloud Computing Lab", course_type: "LAB", credits: 2, semester: 5 },
    { code: "25PCC13CE15", title: "Distributed Computing", course_type: "THEORY_LAB", credits: 3, semester: 6 },
    { code: "25PCC13CE16", title: "Software Engineering", course_type: "THEORY_LAB", credits: 3, semester: 6 },
    { code: "25PCC13CE17", title: "Artificial Intelligence Lab", course_type: "LAB", credits: 1, semester: 6 },
    { code: "25PCC13CE18", title: "Mini Project", course_type: "PROJECT", credits: 1, semester: 6 },
    { code: "25PCC13CE19", title: "Mobile App development", course_type: "LAB", credits: 1, semester: 6 },
    { code: "25PCC13CE20", title: "DevOps Lab", course_type: "LAB", credits: 1, semester: 6 },
    { code: "25PCC13CE21", title: "Advanced Microprocessors", course_type: "THEORY_LAB", credits: 3, semester: 6 }
  ],
  "CSE": [
    { code: "25CS301", title: "Mathematical Foundations of Computer Science", course_type: "THEORY", credits: 4, semester: 3 },
    { code: "25CS302", title: "Design and Analysis of Algorithms", course_type: "THEORY_LAB", credits: 4, semester: 3 },
    { code: "25CS303", title: "Software Engineering Principles", course_type: "THEORY", credits: 3, semester: 3 },
    { code: "25CS401", title: "Database Systems and Applications", course_type: "THEORY_LAB", credits: 4, semester: 4 },
    { code: "25CS402", title: "Computer Networks", course_type: "THEORY_LAB", credits: 4, semester: 4 }
  ],
  "ECS": [
    { code: "25EC301", title: "Electronic Devices and Circuits", course_type: "THEORY_LAB", credits: 4, semester: 3 },
    { code: "25EC302", title: "Digital System Design", course_type: "THEORY_LAB", credits: 3, semester: 3 },
    { code: "25EC401", title: "Microcontrollers and Embedded Systems", course_type: "THEORY_LAB", credits: 4, semester: 4 },
    { code: "25EC402", title: "Signals and Systems", course_type: "THEORY", credits: 3, semester: 4 }
  ],
  "MECH": [
    { code: "25ME301", title: "Thermodynamics", course_type: "THEORY", credits: 3, semester: 3 },
    { code: "25ME302", title: "Strength of Materials", course_type: "THEORY_LAB", credits: 4, semester: 3 },
    { code: "25ME401", title: "Fluid Mechanics and Machinery", course_type: "THEORY_LAB", credits: 4, semester: 4 },
    { code: "25ME402", title: "Manufacturing Processes", course_type: "THEORY_LAB", credits: 3, semester: 4 }
  ]
};


api.get("/departments/:id/previous-subjects/", async (c) => {
  const deptId = c.req.param("id");
  const dept = await c.env.DB.prepare("SELECT code FROM departments WHERE id = ?").bind(deptId).first<any>();
  if (!dept) return c.json({ detail: "Department not found." }, 404);

  const subjects = PREVIOUS_SUBJECTS[dept.code] || [];
  return c.json(subjects);
});

api.post("/semesters/initialize-year/", requireRole("ADMIN", "HOD"), async (c) => {
  const { department_id, academic_year_id, year_of_study } = await c.req.json<{ department_id: string, academic_year_id: string, year_of_study: string }>();
  
  const YEAR_SEM_MAP: Record<string, number[]> = {
    "FE": [1, 2],
    "SE": [3, 4],
    "TE": [5, 6],
    "BE": [7, 8]
  };
  const semNumbers = YEAR_SEM_MAP[year_of_study] || [];
  const createdSems = [];

  for (const num of semNumbers) {
    const semTitle = `Semester ${["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][num - 1]}`;
    let existing = await c.env.DB.prepare("SELECT * FROM semesters WHERE department_id = ? AND academic_year_id = ? AND number = ?")
      .bind(department_id, academic_year_id, num)
      .first<any>();

    if (!existing) {
      const id = crypto.randomUUID();
      existing = await c.env.DB.prepare(`
        INSERT INTO semesters (id, department_id, academic_year_id, number, title, ordinance)
        VALUES (?, ?, ?, ?, ?, '') RETURNING *
      `).bind(id, department_id, academic_year_id, num, semTitle).first<any>();
    }
    createdSems.push(existing);
  }

  return c.json({ semesters: createdSems });
});

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

api.get("/courses/:id/review-link/", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const course = await c.env.DB.prepare(
    "SELECT share_token, review_pin, review_link_generated_at, faculty_user_id, semester_id FROM courses WHERE id = ?"
  ).bind(id).first<any>();
  if (!course) return c.json({ detail: "Not found" }, 404);
  // Only ADMIN, HOD (same department), or the course's assigned faculty may see the review link + PIN
  if (user.role === "FACULTY" && course.faculty_user_id !== user.id) {
    return c.json({ detail: "Permission denied." }, 403);
  }
  if (user.role === "HOD") {
    const sem = await c.env.DB.prepare("SELECT department_id FROM semesters WHERE id = ?").bind(course.semester_id).first<any>();
    if (sem && user.department_id && String(sem.department_id) !== String(user.department_id)) {
      return c.json({ detail: "Permission denied." }, 403);
    }
  }
  if (!course.share_token) return c.json({ detail: "NO_REVIEW_LINK" }, 400);
  const frontendUrl = c.env.FRONTEND_URL ?? "http://localhost:3000";
  const url = `${frontendUrl}/public/review/${course.share_token}`;
  return c.json({ url, pin: course.review_pin, generatedAt: course.review_link_generated_at });
});

api.post("/courses/:id/review-pin/reset/", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const course = await c.env.DB.prepare("SELECT share_token, faculty_user_id, semester_id FROM courses WHERE id = ?").bind(id).first<any>();
  if (!course) return c.json({ detail: "Not found" }, 404);
  // Only ADMIN, HOD (same department), or the course's assigned faculty may reset the PIN
  if (user.role === "FACULTY" && course.faculty_user_id !== user.id) {
    return c.json({ detail: "Permission denied." }, 403);
  }
  if (user.role === "HOD") {
    const sem = await c.env.DB.prepare("SELECT department_id FROM semesters WHERE id = ?").bind(course.semester_id).first<any>();
    if (sem && user.department_id && String(sem.department_id) !== String(user.department_id)) {
      return c.json({ detail: "Permission denied." }, 403);
    }
  }
  if (!course.share_token) return c.json({ detail: "NO_REVIEW_LINK" }, 400);
  const pin = generatePin();
  await c.env.DB.prepare(
    `UPDATE courses SET review_pin = ?, review_pin_failed_attempts = 0,
     review_pin_locked_until = NULL WHERE id = ?`
  ).bind(pin, id).run();
  return c.json({ pin });
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

api.get("/reviewer-comments/", async (c) => {
  const query = Object.fromEntries(new URL(c.req.url).searchParams);
  const rows = await new ReviewerRepository(c.env.DB).list(query);
  // Unsubmitted external-review drafts are only visible through the PIN-gated public link.
  const visible = query.status ? rows : rows.filter((r: any) => r.status !== "DRAFT");
  return c.json(visible);
});
api.post("/reviewer-comments/", async (c) => {
  if (!isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
  const row = await new ReviewerRepository(c.env.DB).create({ ...(await c.req.json()), reviewer_user_id: c.get("user").id });
  return c.json(row, 201);
});
api.post("/reviewer-comments/:id/resolve/", async (c) => c.json(await new ReviewerRepository(c.env.DB).update(c.req.param("id"), { is_resolved: 1, resolved_by_user_id: c.get("user").id, resolved_at: new Date().toISOString() })));

api.get("/approval-workflows/", async (c) => c.json(await new WorkflowRepository(c.env.DB).list(Object.fromEntries(new URL(c.req.url).searchParams))));
api.post("/approval-workflows/", async (c) => {
  if (!isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
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

api.get("/published-curricula/", async (c) => c.json(await new BaseRepository(c.env.DB, "published_curricula", [], ["department_id", "academic_year_id", "scheme_id", "is_public", "year_of_study"]).list(Object.fromEntries(new URL(c.req.url).searchParams))));

api.get("/published-curricula/archive/", requireRole('HOD', 'ADMIN'), async (c) => {
  const user = c.get('user');
  const url = new URL(c.req.url);
  const schemeId = url.searchParams.get("scheme_id");
  const academicYearId = url.searchParams.get("academic_year_id");
  
  let query = `
    SELECT 
      pc.*,
      ay.name as academic_year_name,
      cs.entering_year as scheme_entering_year,
      d.name as department_name,
      d.code as department_code
    FROM published_curricula pc
    LEFT JOIN academic_years ay ON pc.academic_year_id = ay.id
    LEFT JOIN curriculum_schemes cs ON pc.scheme_id = cs.id
    JOIN departments d ON pc.department_id = d.id
  `;
  
  const clauses: string[] = [];
  const params: any[] = [];
  
  if (user.role === 'HOD' && user.department_id) {
    clauses.push('pc.department_id = ?');
    params.push(user.department_id);
  }
  if (schemeId) {
    clauses.push('pc.scheme_id = ?');
    params.push(schemeId);
  } else if (academicYearId) {
    clauses.push('pc.academic_year_id = ?');
    params.push(academicYearId);
  }
  
  if (clauses.length > 0) {
    query += ` WHERE ${clauses.join(' AND ')}`;
  }
  
  query += ' ORDER BY pc.created_at DESC';
  
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

  if (body.scheme_id) {
    const count = await c.env.DB.prepare(
      "SELECT count(*) AS n FROM courses c JOIN semesters s ON s.id = c.semester_id WHERE s.scheme_id = ? AND s.number IN (?,?) AND c.status IN ('APPROVED','PUBLISHED')"
    ).bind(body.scheme_id, sems[0], sems[1]).first<any>();

    const printUrl = `/print/final?department=${encodeURIComponent(body.department)}&scheme_id=${encodeURIComponent(body.scheme_id)}&year_of_study=${encodeURIComponent(body.year_of_study)}&version=${encodeURIComponent(body.version_label ?? "v1")}`;

    const published = await c.env.DB.prepare(`
      INSERT INTO published_curricula (department_id, academic_year_id, scheme_id, template_id, published_by_user_id, print_url, pdf_url, version_label, template_snapshot, render_metrics, year_of_study)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
    `).bind(
      body.department,
      body.academic_year || null,
      body.scheme_id,
      body.template,
      c.get("user").id,
      printUrl,
      "",
      body.version_label ?? "v1",
      JSON.stringify({ css: template.css, html_template: template.html_template, name: template.name }),
      JSON.stringify({ status: "queued", course_count: count?.n ?? 0, export: "pdf-render" }),
      body.year_of_study
    ).first<any>();

    await c.env.DB.prepare(
      "UPDATE courses SET status = 'PUBLISHED' WHERE id IN (SELECT c.id FROM courses c JOIN semesters s ON s.id = c.semester_id WHERE s.scheme_id = ? AND s.number IN (?,?) AND c.status IN ('APPROVED','PUBLISHED'))"
    ).bind(body.scheme_id, sems[0], sems[1]).run();

    await c.env.DB.prepare("UPDATE curriculum_templates SET is_locked = 1 WHERE id = ?").bind(body.template).run();

    c.executionCtx.waitUntil(
      generatePdfTask(c.env, published.id, body.department, body.academic_year ?? "", body.version_label ?? "v1", body.year_of_study, body.scheme_id)
    );

    return c.json(published, 202);
  }

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

async function requireReviewSession(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const token = c.req.param("token") as string;
  const auth = c.req.header("Authorization") || "";
  const sessionToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const course = await c.env.DB.prepare("SELECT id, share_token FROM courses WHERE share_token = ?")
    .bind(token).first<any>();
  if (!course) return c.json({ error: "TOKEN_INVALID" }, 404);
  if (!sessionToken || !(await verifyReviewSession(c.env.AUTH_JWT_SECRET, sessionToken, course.id, course.share_token))) {
    return c.json({ error: "SESSION_INVALID" }, 401);
  }
  c.set("reviewCourseId", course.id);
  await next();
}

app.post("/public/review/:token/verify/", async (c) => {
  const token = c.req.param("token");
  const { pin } = await c.req.json<any>();
  const course = await c.env.DB.prepare(
    `SELECT id, code, title, review_pin, review_pin_failed_attempts, review_pin_locked_until
     FROM courses WHERE share_token = ?`
  ).bind(token).first<any>();
  if (!course) return c.json({ error: "TOKEN_INVALID" }, 404);

  if (isLocked(course)) {
    return c.json({ error: "LOCKED", retryAfterSeconds: lockoutSecondsRemaining(course) }, 429);
  }

  if (pin !== course.review_pin) {
    const attempts = (course.review_pin_failed_attempts ?? 0) + 1;
    const lockedUntil =
      attempts >= REVIEW_PIN_CONSTANTS.MAX_ATTEMPTS
        ? new Date(Date.now() + REVIEW_PIN_CONSTANTS.LOCKOUT_MINUTES * 60000).toISOString()
        : null;
    await c.env.DB.prepare(
      "UPDATE courses SET review_pin_failed_attempts = ?, review_pin_locked_until = ? WHERE id = ?"
    ).bind(attempts, lockedUntil, course.id).run();
    if (lockedUntil) return c.json({ error: "LOCKED", retryAfterSeconds: REVIEW_PIN_CONSTANTS.LOCKOUT_MINUTES * 60 }, 429);
    return c.json({ error: "PIN_INVALID", attemptsRemaining: REVIEW_PIN_CONSTANTS.MAX_ATTEMPTS - attempts }, 401);
  }

  await c.env.DB.prepare(
    "UPDATE courses SET review_pin_failed_attempts = 0, review_pin_locked_until = NULL WHERE id = ?"
  ).bind(course.id).run();

  const sessionToken = await signReviewSession(c.env.AUTH_JWT_SECRET, course.id, token);
  return c.json({
    sessionToken,
    expiresAt: new Date(Date.now() + 4 * 3600_000).toISOString(),
    course: { code: course.code, title: course.title },
  });
});

app.get("/public/review/:token/", requireReviewSession, async (c) => {
  const course = await new CoursesRepository(c.env.DB).detail(c.get("reviewCourseId") as string);
  if (!course) return c.json({ detail: "Not found" }, 404);
  return c.json(course);
});

app.get("/public/review/:token/comments/", requireReviewSession, async (c) => {
  const comments = await c.env.DB.prepare(
    "SELECT * FROM reviewer_comments WHERE course_id = ? ORDER BY created_at DESC"
  ).bind(c.get("reviewCourseId") as string).all();
  return c.json(comments.results ?? []);
});

const VALID_SECTION_KEYS = new Set(["overview", "outcomes", "modules", "experiments", "assessment_references"]);

app.post("/public/review/:token/comments/", requireReviewSession, async (c) => {
  const courseId = c.get("reviewCourseId") as string;
  const body = await c.req.json<any>();
  if (!body.reviewer_name || !body.body) {
    return c.json({ detail: "Name and comments are required.", code: "FEEDBACK_INVALID" }, 400);
  }
  const sectionKey = body.section_key && VALID_SECTION_KEYS.has(body.section_key) ? body.section_key : null;
  if (!sectionKey) {
    return c.json({ detail: "Invalid or missing section_key.", code: "FEEDBACK_INVALID" }, 400);
  }
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO reviewer_comments (id, course_id, section_key, section_label, body, is_external, status, reviewer_name, reviewer_email, created_at)
    VALUES (?, ?, ?, ?, ?, 1, 'DRAFT', ?, ?, ?)
  `).bind(
    id, courseId, sectionKey, body.section_label || sectionKey, body.body, body.reviewer_name, body.reviewer_email ?? null, new Date().toISOString()
  ).run();
  const created = await c.env.DB.prepare("SELECT * FROM reviewer_comments WHERE id = ?").bind(id).first();
  return c.json(created, 201);
});

app.patch("/public/review/:token/comments/:commentId/", requireReviewSession, async (c) => {
  const courseId = c.get("reviewCourseId") as string;
  const commentId = c.req.param("commentId");
  const { body } = await c.req.json<any>();
  const existing = await c.env.DB.prepare(
    "SELECT * FROM reviewer_comments WHERE id = ? AND course_id = ?"
  ).bind(commentId, courseId).first<any>();
  if (!existing) return c.json({ detail: "Not found" }, 404);
  if (existing.status !== "DRAFT") return c.json({ error: "COMMENT_LOCKED" }, 400);
  await c.env.DB.prepare("UPDATE reviewer_comments SET body = ? WHERE id = ?").bind(body, commentId).run();
  return c.json({ ...existing, body });
});

app.delete("/public/review/:token/comments/:commentId/", requireReviewSession, async (c) => {
  const courseId = c.get("reviewCourseId") as string;
  const commentId = c.req.param("commentId");
  const existing = await c.env.DB.prepare(
    "SELECT * FROM reviewer_comments WHERE id = ? AND course_id = ?"
  ).bind(commentId, courseId).first<any>();
  if (!existing) return c.json({ detail: "Not found" }, 404);
  if (existing.status !== "DRAFT") return c.json({ error: "COMMENT_LOCKED" }, 400);
  await c.env.DB.prepare("DELETE FROM reviewer_comments WHERE id = ?").bind(commentId).run();
  return c.json({ deleted: true });
});

app.post("/public/review/:token/submit/", requireReviewSession, async (c) => {
  const courseId = c.get("reviewCourseId") as string;
  const drafts = await c.env.DB.prepare(
    "SELECT id FROM reviewer_comments WHERE course_id = ? AND status = 'DRAFT'"
  ).bind(courseId).all();
  if (!drafts.results.length) return c.json({ error: "NOTHING_TO_SUBMIT" }, 400);

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    "UPDATE reviewer_comments SET status = 'SUBMITTED', submitted_at = ? WHERE course_id = ? AND status = 'DRAFT'"
  ).bind(now, courseId).run();

  const course = await c.env.DB.prepare(
    `SELECT c.code, c.title, c.faculty_user_id, s.department_id
     FROM courses c JOIN semesters s ON s.id = c.semester_id WHERE c.id = ?`
  ).bind(courseId).first<any>();

  const notifyUserIds: string[] = [];
  if (course?.faculty_user_id) notifyUserIds.push(course.faculty_user_id);
  const hods = await c.env.DB.prepare(
    "SELECT id FROM profiles WHERE role = 'HOD' AND department_id = ? AND is_active = 1"
  ).bind(course?.department_id).all<any>();
  for (const h of hods.results ?? []) notifyUserIds.push(h.id);

  const title = `New reviewer comments on ${course?.code ?? ""} — ${course?.title ?? ""}`;
  const bodyText = `${drafts.results.length} review comment(s) submitted.`;
  for (const userId of new Set(notifyUserIds)) {
    await c.env.DB.prepare(`
      INSERT INTO notifications (id, user_id, title, body, link, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).bind(
      crypto.randomUUID(), userId, title, bodyText, `/courses/${courseId}`, now
    ).run();
  }

  return c.json({ submittedCount: drafts.results.length });
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

  const statements: D1PreparedStatement[] = [];

  const collectSyncStatements = async (
    table: string,
    parentColumn: string,
    parentId: string,
    items: any[] | undefined,
    fields: string[],
    mapItem = (item: any, _i: number) => item
  ) => {
    if (!items) return;
    const existing = await db.prepare(`SELECT id FROM ${table} WHERE ${parentColumn} = ?`).bind(parentId).all<any>();
    const existingIds = new Set((existing.results ?? []).map((r) => String(r.id)));
    const seen = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const item = mapItem({ ...items[i] }, i);
      item.id = item.id || crypto.randomUUID();
      seen.add(String(item.id));

      const columns = [parentColumn, ...fields].filter((field) => field === parentColumn || item[field] !== undefined);
      const values = columns.map((field) => field === parentColumn ? parentId : normalizeValue(item[field]));

      if (existingIds.has(String(item.id))) {
        const assignments = columns.filter((field) => field !== parentColumn).map((field) => `"${field}" = ?`).join(", ");
        statements.push(db.prepare(`UPDATE ${table} SET ${assignments} WHERE id = ?`).bind(...values.slice(1), item.id));
      } else {
        const quotedCols = columns.map((c) => `"${c}"`).join(", ");
        const placeholders = columns.map(() => "?").join(", ");
        statements.push(db.prepare(`INSERT INTO ${table} (id, ${quotedCols}) VALUES (?, ${placeholders})`).bind(item.id, ...values));
      }
    }

    for (const id of existingIds) {
      if (!seen.has(id)) {
        statements.push(db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id));
      }
    }
  };

  await collectSyncStatements("course_outcomes", "course_id", courseId, data.outcomes, ["code", "description", "bloom_level", "sort_order", "po_map"], (item, i) => ({ ...item, sort_order: item.sort_order ?? item.order ?? i + 1 }));
  await collectSyncStatements("experiments", "course_id", courseId, data.experiments, ["number", "title", "description", "hours"]);
  await collectSyncStatements("assessment_schemes", "course_id", courseId, data.assessments, ["component", "marks", "description", "sort_order"], (item, i) => ({ ...item, sort_order: item.sort_order ?? item.order ?? i + 1 }));
  await collectSyncStatements("reference_books", "course_id", courseId, data.reference_books ?? data.references, ["title", "authors", "publisher", "edition", "year", "is_textbook", "sort_order"], (item, i) => ({ ...item, sort_order: item.sort_order ?? item.order ?? i + 1 }));

  if (data.modules) {
    const table = "modules";
    const parentColumn = "course_id";
    const parentId = courseId;
    const items = data.modules;
    const fields = ["number", "title", "contact_hours", "content", "references"];

    const existing = await db.prepare(`SELECT id FROM ${table} WHERE ${parentColumn} = ?`).bind(parentId).all<any>();
    const existingIds = new Set((existing.results ?? []).map((r) => String(r.id)));
    const seen = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const item = { ...items[i] };
      item.id = item.id || crypto.randomUUID();
      seen.add(String(item.id));

      const columns = [parentColumn, ...fields].filter((field) => field === parentColumn || item[field] !== undefined);
      const values = columns.map((field) => field === parentColumn ? parentId : normalizeValue(item[field]));

      if (existingIds.has(String(item.id))) {
        const assignments = columns.filter((field) => field !== parentColumn).map((field) => `"${field}" = ?`).join(", ");
        statements.push(db.prepare(`UPDATE ${table} SET ${assignments} WHERE id = ?`).bind(...values.slice(1), item.id));
      } else {
        const quotedCols = columns.map((c) => `"${c}"`).join(", ");
        const placeholders = columns.map(() => "?").join(", ");
        statements.push(db.prepare(`INSERT INTO ${table} (id, ${quotedCols}) VALUES (?, ${placeholders})`).bind(item.id, ...values));
      }

      if (item.topics) {
        await collectSyncStatements("topics", "module_id", item.id, item.topics, ["title", "description", "sort_order"], (topic, tIdx) => ({ ...topic, sort_order: topic.sort_order ?? topic.order ?? tIdx + 1 }));
      }
    }

    for (const id of existingIds) {
      if (!seen.has(id)) {
        statements.push(db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id));
      }
    }
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }
}

async function generatePdfTask(env: Env, publishedId: string, departmentId: string, academicYearId: string, versionLabel: string, yearOfStudy?: string, schemeId?: string) {
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
    const targetUrl = schemeId
      ? `${frontendUrl}/print/final?department=${encodeURIComponent(departmentId)}&scheme_id=${encodeURIComponent(schemeId)}&year_of_study=${encodeURIComponent(yearOfStudy || "FE")}&version=${encodeURIComponent(versionLabel)}`
      : yearOfStudy 
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
        const { publishedId, departmentId, academicYearId, versionLabel, yearOfStudy, schemeId } = message.body || {};
        if (publishedId) {
          await generatePdfTask(env, publishedId, departmentId, academicYearId, versionLabel, yearOfStudy, schemeId);
        }
        message.ack();
      } catch (e) {
        console.error("Queue message processing error:", e);
        message.retry();
      }
    }
  }
};
