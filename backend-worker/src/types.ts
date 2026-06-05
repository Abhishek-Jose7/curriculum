export type Role = "ADMIN" | "HOD" | "FACULTY" | "REVIEWER" | "PUBLIC";
export type CourseStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "PUBLISHED" | "LOCKED";
export type WorkflowDecision = "REQUEST_CHANGES" | "APPROVE" | "REJECT" | "PUBLISH";

export type Env = {
  DB: D1Database;
  BUCKET: R2Bucket;
  AUTH_JWT_SECRET: string;
  FRONTEND_URL?: string;
  BROWSER: any;
  PUBLISH_QUEUE: Queue<any>;
  CORS_ALLOWED_ORIGINS?: string;
  ENVIRONMENT?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  department_id?: string | null;
  first_name?: string;
  last_name?: string;
  is_superuser?: number;
};

export type Variables = {
  user: AuthUser;
};

export type CourseRow = {
  id: string;
  semester_id: string;
  faculty_user_id: string | null;
  code: string;
  title: string;
  course_type: string;
  status: CourseStatus;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  lecture_credits: number;
  tutorial_credits: number;
  practical_credits: number;
  credits: number;
  internal_marks: number;
  external_marks: number;
  duration_hours: number;
  pre_requisites: string;
  objectives: string;
  syllabus_intro: string;
  online_resources: string;
  section_order: string;
  approved_by_user_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};
