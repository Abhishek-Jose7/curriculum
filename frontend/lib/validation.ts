import { z } from "zod";

export const courseBasicSchema = z.object({
  code: z.string().min(2, "Course code is required").max(32),
  title: z.string().min(4, "Course title is required").max(220),
  course_type: z.enum(["THEORY", "LAB", "PROJECT", "ELECTIVE", "INTERDISCIPLINARY"]),
  lecture_hours: z.coerce.number().int().min(0).max(12),
  tutorial_hours: z.coerce.number().int().min(0).max(12),
  practical_hours: z.coerce.number().int().min(0).max(18),
  credits: z.coerce.number().min(0).max(30),
  internal_marks: z.coerce.number().int().min(0).max(200),
  external_marks: z.coerce.number().int().min(0).max(200),
  objectives: z.string().max(4000).optional()
});

export type CourseBasicForm = z.infer<typeof courseBasicSchema>;

export const outcomeSchema = z.object({
  code: z.string().min(2).max(16),
  description: z.string().min(12).max(1200),
  bloom_level: z.string().min(2).max(80),
  order: z.coerce.number().int().min(1)
});

export const moduleSchema = z.object({
  number: z.coerce.number().int().min(1),
  title: z.string().min(3).max(220),
  contact_hours: z.coerce.number().int().min(0).max(60),
  content: z.string().min(20).max(6000)
});

export const courseDraftSchema = courseBasicSchema.extend({
  pre_requisites: z.string().max(2000).optional(),
  syllabus_intro: z.string().max(3000).optional(),
  duration_hours: z.coerce.number().min(0).max(6),
  passing_marks: z.coerce.number().int().min(0).max(200),
  outcomes: z.array(outcomeSchema).min(1),
  modules: z.array(moduleSchema).min(1)
});
