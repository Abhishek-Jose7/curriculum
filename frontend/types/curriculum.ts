export type CourseStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "PUBLISHED" | "LOCKED";

export type Course = {
  id: string | number;
  code: string;
  title: string;
  status: CourseStatus;
  course_type: string;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  self_learning_hours: number;
  lecture_credits: number;
  tutorial_credits: number;
  practical_credits: number;
  credits: string | number;
  internal_marks: number;
  external_marks: number;
  passing_marks?: number;
  objectives: string;
  outcomes: CourseOutcome[];
  modules: CourseModule[];
  bloom_level?: string;
};



export type CourseOutcome = {
  id?: string | number;
  code: string;
  description: string;
  bloom_level: string;
  order: number;
  po_map?: Record<string, number | string | null | undefined>;
};

export type CourseModule = {
  id?: string | number;
  number: number;
  title: string;
  contact_hours: number;
  content: string;
  references?: string;
  topics?: CourseTopic[];
};

export type CourseTopic = {
  id?: string | number;
  title: string;
  description: string;
};

export type Experiment = {
  id?: string | number;
  number: number;
  title: string;
  description: string;
  hours: number;
};

export type Assessment = {
  id?: string | number;
  component: string;
  marks: number;
  description: string;
};

export type ReferenceBook = {
  id?: string | number;
  title: string;
  authors: string;
  publisher: string;
  edition: string;
  year: string;
  is_textbook: boolean;
};

export type ReviewerComment = {
  id: string | number;
  section_key: string;
  section_label: string;
  body: string;
  reviewer_name: string;
  reviewer_email?: string;
  is_external?: boolean;
  is_resolved: boolean;
  status?: "DRAFT" | "SUBMITTED";
  submitted_at?: string;
};

export type CourseDraft = {
  id: string | number;
  code: string;
  title: string;
  course_type: "THEORY" | "LAB" | "THEORY_LAB" | "PROJECT" | "ELECTIVE" | "INTERDISCIPLINARY";
  status: CourseStatus;
  faculty_name: string;
  faculty_user_id?: string | null;
  last_modified: string;
  objectives: string;
  pre_requisites: string;
  syllabus_intro: string;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  self_learning_hours: number;
  lecture_credits: number;
  tutorial_credits: number;
  practical_credits: number;
  credits: string | number;
  internal_marks: number;
  external_marks: number;
  passing_marks?: number;
  duration_hours: string | number;
  outcomes: CourseOutcome[];
  modules: CourseModule[];
  experiments: Experiment[];
  assessments: Assessment[];
  reference_books: ReferenceBook[];
  comments: ReviewerComment[];
  online_resources: string[];
  bloom_level?: string;
};
