import { BaseRepository, parseJson } from "./base";
import type { CourseRow } from "../types";

const courseFields = [
  "semester_id", "faculty_user_id", "code", "title", "course_type", "status",
  "lecture_hours", "tutorial_hours", "practical_hours", "lecture_credits",
  "tutorial_credits", "practical_credits", "credits", "internal_marks",
  "external_marks", "duration_hours", "passing_marks", "pre_requisites",
  "objectives", "syllabus_intro", "online_resources", "section_order",
  "approved_by_user_id", "approved_at",
];

export class CoursesRepository extends BaseRepository<CourseRow> {
  constructor(db: D1Database) {
    super(db, "courses", courseFields, ["semester_id", "faculty_user_id", "course_type", "status"]);
  }

  async detail(id: string) {
    const course = await this.get(id);
    if (!course) return null;
    const [outcomes, modules, experiments, assessments, referenceBooks, comments] = await Promise.all([
      this.db.prepare("SELECT *, sort_order AS `order` FROM course_outcomes WHERE course_id = ? ORDER BY sort_order, code").bind(id).all(),
      new ModulesRepository(this.db).forCourse(id),
      this.db.prepare("SELECT *, sort_order AS `order` FROM experiments WHERE course_id = ? ORDER BY number").bind(id).all(),
      this.db.prepare("SELECT *, sort_order AS `order` FROM assessment_schemes WHERE course_id = ? ORDER BY sort_order").bind(id).all(),
      this.db.prepare("SELECT *, sort_order AS `order` FROM reference_books WHERE course_id = ? ORDER BY is_textbook, sort_order").bind(id).all(),
      this.db.prepare("SELECT rc.*, trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) AS reviewer_name FROM reviewer_comments rc LEFT JOIN profiles p ON p.id = rc.reviewer_user_id WHERE rc.course_id = ? ORDER BY rc.section_key, rc.created_at DESC").bind(id).all(),
    ]);
    return serializeCourse({
      ...course,
      outcomes: outcomes.results ?? [],
      modules,
      experiments: experiments.results ?? [],
      assessments: assessments.results ?? [],
      reference_books: referenceBooks.results ?? [],
      comments: comments.results ?? [],
    });
  }
}

export class ModulesRepository extends BaseRepository<Record<string, unknown>> {
  constructor(db: D1Database) {
    super(db, "modules", ["course_id", "number", "title", "contact_hours", "content"], ["course_id"]);
  }

  async forCourse(courseId: string) {
    const modules = (await this.db.prepare("SELECT * FROM modules WHERE course_id = ? ORDER BY number").bind(courseId).all()).results ?? [];
    return await Promise.all(modules.map(async (module) => ({
      ...module,
      topics: (await this.db.prepare("SELECT *, sort_order AS `order` FROM topics WHERE module_id = ? ORDER BY sort_order").bind(module.id).all()).results ?? [],
    })));
  }
}

export class TopicsRepository extends BaseRepository<Record<string, unknown>> {
  constructor(db: D1Database) {
    super(db, "topics", ["module_id", "title", "description", "sort_order"], ["module_id"]);
  }
}

export class OutcomesRepository extends BaseRepository<Record<string, unknown>> {
  constructor(db: D1Database) {
    super(db, "course_outcomes", ["course_id", "code", "description", "bloom_level", "sort_order"], ["course_id"]);
  }
}

export class ExperimentsRepository extends BaseRepository<Record<string, unknown>> {
  constructor(db: D1Database) {
    super(db, "experiments", ["course_id", "number", "title", "description", "hours"], ["course_id"]);
  }
}

export class AssessmentsRepository extends BaseRepository<Record<string, unknown>> {
  constructor(db: D1Database) {
    super(db, "assessment_schemes", ["course_id", "component", "marks", "description", "sort_order"], ["course_id"]);
  }
}

export class ReferenceBooksRepository extends BaseRepository<Record<string, unknown>> {
  constructor(db: D1Database) {
    super(db, "reference_books", ["course_id", "title", "authors", "publisher", "edition", "year", "is_textbook", "sort_order"], ["course_id", "is_textbook"]);
  }
}

export class ReviewerRepository extends BaseRepository<Record<string, unknown>> {
  constructor(db: D1Database) {
    super(db, "reviewer_comments", ["course_id", "reviewer_user_id", "section_key", "section_label", "body", "is_resolved", "resolved_by_user_id", "resolved_at"], ["course_id", "section_key", "is_resolved"]);
  }
}

export class WorkflowRepository extends BaseRepository<Record<string, unknown>> {
  constructor(db: D1Database) {
    super(db, "approval_workflows", ["course_id", "actor_user_id", "from_status", "to_status", "decision", "note"], ["course_id", "decision", "actor_user_id"]);
  }
}

export function serializeCourse(row: Record<string, unknown>) {
  return {
    ...row,
    faculty: row.faculty_user_id,
    approved_by: row.approved_by_user_id,
    faculty_name: row.faculty_name ?? "",
    last_modified: row.updated_at,
    total_marks: Number(row.internal_marks ?? 0) + Number(row.external_marks ?? 0),
    online_resources: parseJson(row.online_resources, []),
    section_order: parseJson(row.section_order, []),
    outcomes: row.outcomes ?? [],
    modules: row.modules ?? [],
    experiments: row.experiments ?? [],
    assessments: row.assessments ?? [],
    reference_books: row.reference_books ?? [],
  };
}
