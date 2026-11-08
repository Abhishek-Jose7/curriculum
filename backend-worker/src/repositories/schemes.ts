import type {
  CurriculumScheme,
  SchemeStatus,
  TeachingComponentInput,
  TeachingComponentRow,
  TeachingComponentType,
  YearOfStudy,
} from "../types/scheme";

const ROMAN_NUMERALS: Record<number, string> = {
  1: "Semester I",
  2: "Semester II",
  3: "Semester III",
  4: "Semester IV",
  5: "Semester V",
  6: "Semester VI",
  7: "Semester VII",
  8: "Semester VIII",
};

const COMPONENT_SORT_ORDER: Record<TeachingComponentType, number> = {
  TH: 1,
  TU: 2,
  PR: 3,
  SL: 4,
};

export const SchemesRepository = {
  async create(
    db: D1Database,
    input: {
      department_id: string;
      entering_year: string;
      created_by_user_id: string;
      duplicate_from_scheme_id?: string;
    }
  ): Promise<CurriculumScheme> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const parts = input.entering_year.split("-");
    const leadingYear = parts[0]?.trim();
    if (!leadingYear || leadingYear.length !== 4 || isNaN(Number(leadingYear))) {
      throw new Error("INVALID_ENTERING_YEAR");
    }
    const scheme_year_code = leadingYear.slice(2);

    const statements: D1PreparedStatement[] = [];

    // 1. Insert curriculum_schemes
    statements.push(
      db
        .prepare(
          `INSERT INTO curriculum_schemes (id, department_id, entering_year, scheme_year_code, status, created_by_user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'draft_setup', ?, ?, ?)`
        )
        .bind(
          id,
          input.department_id,
          input.entering_year,
          scheme_year_code,
          input.created_by_user_id,
          now,
          now
        )
    );

    // 2. Insert 8 semesters
    const semesterIdMap = new Map<number, string>();
    for (let semNum = 1; semNum <= 8; semNum++) {
      const semesterId = crypto.randomUUID();
      semesterIdMap.set(semNum, semesterId);
      const title = ROMAN_NUMERALS[semNum] || `Semester ${semNum}`;
      statements.push(
        db
          .prepare(
            `INSERT INTO semesters (id, scheme_id, department_id, number, title, is_unlocked, shell_completed_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 0, NULL, ?, ?)`
          )
          .bind(
            semesterId,
            id,
            input.department_id,
            semNum,
            title,
            now,
            now
          )
      );
    }

    // 3. If duplicate_from_scheme_id is present, duplicate course shells + teaching components
    if (input.duplicate_from_scheme_id) {
      const sourceCourses = await db
        .prepare(
          `SELECT c.*, s.number as semester_number
           FROM courses c
           JOIN semesters s ON c.semester_id = s.id
           WHERE s.scheme_id = ?
           ORDER BY s.number ASC, c.created_at ASC`
        )
        .bind(input.duplicate_from_scheme_id)
        .all<any>();

      const sourceCourseList = sourceCourses.results ?? [];
      const sourceCourseIds = sourceCourseList.map((c) => c.id);

      const componentsMap = await TeachingComponentsRepository.forCourses(
        db,
        sourceCourseIds
      );

      for (const sourceCourse of sourceCourseList) {
        const targetSemesterId = semesterIdMap.get(Number(sourceCourse.semester_number));
        if (!targetSemesterId) continue;

        const newCourseId = crypto.randomUUID();
        const oldCode = sourceCourse.code || "";
        const newCode =
          oldCode.length >= 2
            ? scheme_year_code + oldCode.slice(2)
            : scheme_year_code + oldCode;

        statements.push(
          db
            .prepare(
              `INSERT INTO courses (
                id, semester_id, code, code_is_custom, title, course_type,
                status, faculty_user_id, vertical, sub_vertical, total_credits,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', NULL, ?, ?, ?, ?, ?)`
            )
            .bind(
              newCourseId,
              targetSemesterId,
              newCode,
              sourceCourse.code_is_custom ?? 0,
              sourceCourse.title,
              sourceCourse.course_type || "THEORY",
              sourceCourse.vertical || null,
              sourceCourse.sub_vertical || null,
              sourceCourse.total_credits ?? null,
              now,
              now
            )
        );

        const sourceComps = componentsMap.get(sourceCourse.id) || [];
        for (const comp of sourceComps) {
          const compId = crypto.randomUUID();
          statements.push(
            db
              .prepare(
                `INSERT INTO course_teaching_components (
                  id, course_id, component_type, hours, ise_marks, mse_marks,
                  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              )
              .bind(
                compId,
                newCourseId,
                comp.component_type,
                comp.hours,
                comp.ise_marks ?? null,
                comp.mse_marks ?? null,
                comp.ese_min_marks ?? null,
                comp.ese_max_marks ?? null,
                comp.total_marks ?? null,
                comp.credit_points ?? null,
                comp.sort_order ?? COMPONENT_SORT_ORDER[comp.component_type] ?? 1
              )
          );
        }
      }
    }

    if (statements.length > 0) {
      const BATCH_SIZE = 80;
      for (let i = 0; i < statements.length; i += BATCH_SIZE) {
        await db.batch(statements.slice(i, i + BATCH_SIZE));
      }
    }

    const created = await SchemesRepository.get(db, id);
    if (!created) throw new Error("Failed to create curriculum scheme");
    return created;
  },

  async get(db: D1Database, id: string): Promise<CurriculumScheme | null> {
    return await db
      .prepare("SELECT * FROM curriculum_schemes WHERE id = ?")
      .bind(id)
      .first<CurriculumScheme>();
  },

  async listByDepartment(db: D1Database, department_id: string): Promise<CurriculumScheme[]> {
    const result = await db
      .prepare("SELECT * FROM curriculum_schemes WHERE department_id = ? ORDER BY entering_year DESC")
      .bind(department_id)
      .all<CurriculumScheme>();
    return result.results ?? [];
  },

  async existsForYear(db: D1Database, department_id: string, entering_year: string): Promise<boolean> {
    const row = await db
      .prepare("SELECT 1 FROM curriculum_schemes WHERE department_id = ? AND entering_year = ?")
      .bind(department_id, entering_year)
      .first();
    return !!row;
  },

  async setStatus(db: D1Database, id: string, status: SchemeStatus): Promise<void> {
    const now = new Date().toISOString();
    await db
      .prepare("UPDATE curriculum_schemes SET status = ?, updated_at = ? WHERE id = ?")
      .bind(status, now, id)
      .run();
  },
};

export const TeachingComponentsRepository = {
  async forCourse(db: D1Database, course_id: string): Promise<TeachingComponentRow[]> {
    const result = await db
      .prepare(
        "SELECT * FROM course_teaching_components WHERE course_id = ? ORDER BY sort_order ASC"
      )
      .bind(course_id)
      .all<TeachingComponentRow>();
    return result.results ?? [];
  },

  async forCourses(
    db: D1Database,
    course_ids: string[]
  ): Promise<Map<string, TeachingComponentRow[]>> {
    const map = new Map<string, TeachingComponentRow[]>();
    if (!course_ids.length) return map;

    const placeholders = course_ids.map(() => "?").join(",");
    const result = await db
      .prepare(
        `SELECT * FROM course_teaching_components WHERE course_id IN (${placeholders}) ORDER BY sort_order ASC`
      )
      .bind(...course_ids)
      .all<TeachingComponentRow>();

    for (const row of result.results ?? []) {
      if (!map.has(row.course_id)) {
        map.set(row.course_id, []);
      }
      map.get(row.course_id)!.push(row);
    }
    return map;
  },

  async replaceForCourse(
    db: D1Database,
    course_id: string,
    components: TeachingComponentInput[]
  ): Promise<void> {
    const statements: D1PreparedStatement[] = [
      db.prepare("DELETE FROM course_teaching_components WHERE course_id = ?").bind(course_id),
    ];

    for (const c of components) {
      const id = crypto.randomUUID();
      const sortOrder = COMPONENT_SORT_ORDER[c.component_type] ?? 1;
      statements.push(
        db
          .prepare(
            `INSERT INTO course_teaching_components (
              id, course_id, component_type, hours, ise_marks, mse_marks,
              ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            id,
            course_id,
            c.component_type,
            c.hours,
            c.ise_marks ?? null,
            c.mse_marks ?? null,
            c.ese_min_marks ?? null,
            c.ese_max_marks ?? null,
            c.total_marks ?? null,
            c.credit_points ?? null,
            sortOrder
          )
      );
    }

    if (statements.length > 0) {
      const BATCH_SIZE = 80;
      for (let i = 0; i < statements.length; i += BATCH_SIZE) {
        await db.batch(statements.slice(i, i + BATCH_SIZE));
      }
    }
  },
};

export const CompileOrderRepository = {
  async get(db: D1Database, scheme_id: string, year_of_study: YearOfStudy): Promise<string[] | null> {
    const row = await db
      .prepare(
        "SELECT course_order FROM curriculum_compile_order WHERE scheme_id = ? AND year_of_study = ?"
      )
      .bind(scheme_id, year_of_study)
      .first<{ course_order: string }>();

    if (!row || !row.course_order) return null;
    try {
      return JSON.parse(row.course_order) as string[];
    } catch {
      return null;
    }
  },

  async upsert(
    db: D1Database,
    scheme_id: string,
    year_of_study: YearOfStudy,
    course_order: string[],
    updated_by_user_id: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const orderJson = JSON.stringify(course_order);

    await db
      .prepare(
        `INSERT INTO curriculum_compile_order (id, scheme_id, year_of_study, course_order, updated_by_user_id, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(scheme_id, year_of_study) DO UPDATE SET
           course_order = excluded.course_order,
           updated_by_user_id = excluded.updated_by_user_id,
           updated_at = excluded.updated_at`
      )
      .bind(id, scheme_id, year_of_study, orderJson, updated_by_user_id, now)
      .run();
  },
};

export const PreamblesRepository = {
  async get(db: D1Database, department_id: string): Promise<string> {
    const row = await db
      .prepare("SELECT content FROM department_preambles WHERE department_id = ?")
      .bind(department_id)
      .first<{ content: string }>();
    return row?.content ?? "";
  },

  async set(
    db: D1Database,
    department_id: string,
    content: string,
    updated_by_user_id: string
  ): Promise<void> {
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO department_preambles (department_id, content, updated_by_user_id, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(department_id) DO UPDATE SET
           content = excluded.content,
           updated_by_user_id = excluded.updated_by_user_id,
           updated_at = excluded.updated_at`
      )
      .bind(department_id, content, updated_by_user_id, now)
      .run();
  },
};

export interface SchemeElectiveRow {
  id: string;
  scheme_id: string;
  category: "TRACK" | "LAB" | "AEC";
  track_name: string;
  sem5_code: string;
  sem5_title: string;
  sem6_code: string;
  sem6_title: string;
  credits: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const ElectivesRepository = {
  async listForScheme(db: D1Database, scheme_id: string): Promise<SchemeElectiveRow[]> {
    const result = await db
      .prepare(
        "SELECT * FROM scheme_electives WHERE scheme_id = ? ORDER BY category ASC, sort_order ASC, created_at ASC"
      )
      .bind(scheme_id)
      .all<SchemeElectiveRow>();
    return result.results ?? [];
  },

  async create(db: D1Database, input: {
    scheme_id: string;
    category: "TRACK" | "LAB" | "AEC";
    track_name?: string;
    sem5_code?: string;
    sem5_title?: string;
    sem6_code?: string;
    sem6_title?: string;
    credits?: number;
    sort_order?: number;
  }): Promise<SchemeElectiveRow> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO scheme_electives (id, scheme_id, category, track_name, sem5_code, sem5_title, sem6_code, sem6_title, credits, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      input.scheme_id,
      input.category,
      input.track_name || "",
      input.sem5_code || "",
      input.sem5_title || "",
      input.sem6_code || "",
      input.sem6_title || "",
      input.credits ?? 3,
      input.sort_order ?? 0,
      now,
      now
    ).run();

    const row = await db.prepare("SELECT * FROM scheme_electives WHERE id = ?").bind(id).first<SchemeElectiveRow>();
    return row!;
  },

  async update(db: D1Database, id: string, input: Partial<SchemeElectiveRow>): Promise<void> {
    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE scheme_electives SET
        category = COALESCE(?, category),
        track_name = COALESCE(?, track_name),
        sem5_code = COALESCE(?, sem5_code),
        sem5_title = COALESCE(?, sem5_title),
        sem6_code = COALESCE(?, sem6_code),
        sem6_title = COALESCE(?, sem6_title),
        credits = COALESCE(?, credits),
        sort_order = COALESCE(?, sort_order),
        updated_at = ?
      WHERE id = ?
    `).bind(
      input.category ?? null,
      input.track_name ?? null,
      input.sem5_code ?? null,
      input.sem5_title ?? null,
      input.sem6_code ?? null,
      input.sem6_title ?? null,
      input.credits ?? null,
      input.sort_order ?? null,
      now,
      id
    ).run();
  },

  async delete(db: D1Database, id: string): Promise<void> {
    await db.prepare("DELETE FROM scheme_electives WHERE id = ?").bind(id).run();
  },

  async seedDefaults(db: D1Database, scheme_id: string): Promise<void> {
    const existing = await db.prepare("SELECT count(*) as count FROM scheme_electives WHERE scheme_id = ?").bind(scheme_id).first<{ count: number }>();
    if (existing && existing.count > 0) return;

    const now = new Date().toISOString();
    const stmts: D1PreparedStatement[] = [];

    const tracks = [
      { track: "Block chain", s5_code: "25PEC13CE11", s5_title: "Block chain Technology", s6_code: "25PEC13CE21", s6_title: "Decentralized finance" },
      { track: "AIML", s5_code: "25PEC13CE12", s5_title: "Deep Learning and Reinforcement Learning", s6_code: "25PEC13CE22", s6_title: "LLM and GenAI" },
      { track: "Security", s5_code: "25PEC13CE13", s5_title: "Cyber Security", s6_code: "25PEC13CE23", s6_title: "Digital Forensic" },
      { track: "Data science", s5_code: "25PEC13CE14", s5_title: "Big data analytics", s6_code: "25PEC13CE24", s6_title: "Business Intelligence" },
      { track: "ARVR", s5_code: "25PEC13CE15", s5_title: "Computer Graphics", s6_code: "25PEC13CE25", s6_title: "ARVR" },
      { track: "UI", s5_code: "25PEC13CE16", s5_title: "HMI", s6_code: "25PEC13CE26", s6_title: "UX/UI Design" },
      { track: "Computing", s5_code: "25PEC13CE17", s5_title: "Geographical Information Systems", s6_code: "25PEC13CE27", s6_title: "Quantum Computing" },
      { track: "Networking", s5_code: "25PEC13CE18", s5_title: "Computer Network", s6_code: "25PEC13CE28", s6_title: "Advanced Network Communication" },
    ];

    tracks.forEach((t, i) => {
      stmts.push(db.prepare(`
        INSERT INTO scheme_electives (id, scheme_id, category, track_name, sem5_code, sem5_title, sem6_code, sem6_title, credits, sort_order, created_at, updated_at)
        VALUES (?, ?, 'TRACK', ?, ?, ?, ?, ?, 3, ?, ?, ?)
      `).bind(crypto.randomUUID(), scheme_id, t.track, t.s5_code, t.s5_title, t.s6_code, t.s6_title, i + 1, now, now));
    });

    const labs = [
      { s5_code: "25PECL13CE11", s5_title: "Image processing Lab", s6_code: "25PECL13CE21", s6_title: "Social Media Analytics Lab" },
      { s5_code: "25PECL13CE12", s5_title: "Natural Language Processing Lab", s6_code: "25PECL13CE22", s6_title: "Ethical Hacking Lab" },
      { s5_code: "25PECL13CE13", s5_title: "IIOT lab", s6_code: "25PECL13CE23", s6_title: "Advance Java Lab" },
      { s5_code: "25PECL13CE14", s5_title: "Innovative Product Development Lab-Phase1 (Start-up)", s6_code: "25PECL13CE24", s6_title: "Innovative Product Development Lab-Phase2 (Start-up)" },
      { s5_code: "25PECL13CE15", s5_title: "Open-Source Intelligence and Threat Intelligence lab", s6_code: "25PECL13CE25", s6_title: "Explainable AI Lab" },
      { s5_code: "", s5_title: "", s6_code: "25PECL13CE26", s6_title: "Software testing and Quality Assurance" },
    ];

    labs.forEach((l, i) => {
      stmts.push(db.prepare(`
        INSERT INTO scheme_electives (id, scheme_id, category, track_name, sem5_code, sem5_title, sem6_code, sem6_title, credits, sort_order, created_at, updated_at)
        VALUES (?, ?, 'LAB', '', ?, ?, ?, ?, 1, ?, ?, ?)
      `).bind(crypto.randomUUID(), scheme_id, l.s5_code, l.s5_title, l.s6_code, l.s6_title, i + 1, now, now));
    });

    const aec = [
      { code: "25AEC12CE021", title: "Sanskrit for Beginners" },
      { code: "25AEC12CE022", title: "Telugu for Beginners" },
      { code: "25AEC12CE023", title: "Kannada for Beginners" },
      { code: "25AEC12CE024", title: "Tamil for Beginners" },
    ];

    aec.forEach((a, i) => {
      stmts.push(db.prepare(`
        INSERT INTO scheme_electives (id, scheme_id, category, track_name, sem5_code, sem5_title, sem6_code, sem6_title, credits, sort_order, created_at, updated_at)
        VALUES (?, ?, 'AEC', '', ?, ?, '', '', 2, ?, ?, ?)
      `).bind(crypto.randomUUID(), scheme_id, a.code, a.title, i + 1, now, now));
    });

    if (stmts.length > 0) {
      await db.batch(stmts);
    }
  }
};
