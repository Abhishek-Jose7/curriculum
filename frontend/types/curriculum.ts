export type CourseStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "PUBLISHED" | "LOCKED";

export type Course = {
  id: number;
  code: string;
  title: string;
  status: CourseStatus;
  course_type: string;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  credits: string;
  internal_marks: number;
  external_marks: number;
  objectives: string;
  outcomes: CourseOutcome[];
  modules: CourseModule[];
};

export type TeachingScheme = {
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  credits: number;
};

export type ExaminationScheme = {
  internal_marks: number;
  external_marks: number;
  duration_hours: number;
  passing_marks: number;
};

export type CourseOutcome = {
  id?: number;
  code: string;
  description: string;
  bloom_level: string;
  order: number;
};

export type CourseModule = {
  id?: number;
  number: number;
  title: string;
  contact_hours: number;
  content: string;
  topics?: CourseTopic[];
};

export type CourseTopic = {
  id?: number;
  title: string;
  description: string;
};

export type Experiment = {
  id?: number;
  number: number;
  title: string;
  description: string;
  hours: number;
};

export type Assessment = {
  id?: number;
  component: string;
  marks: number;
  description: string;
};

export type ReferenceBook = {
  id?: number;
  title: string;
  authors: string;
  publisher: string;
  edition: string;
  year: string;
  is_textbook: boolean;
};

export type ReviewerComment = {
  id: number;
  section_key: string;
  section_label: string;
  body: string;
  reviewer_name: string;
  is_resolved: boolean;
};

export type CourseDraft = {
  id: number;
  code: string;
  title: string;
  course_type: "THEORY" | "LAB" | "PROJECT" | "ELECTIVE" | "INTERDISCIPLINARY";
  status: CourseStatus;
  faculty_name: string;
  last_modified: string;
  objectives: string;
  pre_requisites: string;
  syllabus_intro: string;
  teaching: TeachingScheme;
  examination: ExaminationScheme;
  outcomes: CourseOutcome[];
  modules: CourseModule[];
  experiments: Experiment[];
  assessments: Assessment[];
  references: ReferenceBook[];
  comments: ReviewerComment[];
  online_resources: string[];
};
