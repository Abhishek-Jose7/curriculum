-- Migration: Add po_map column to course_outcomes
ALTER TABLE course_outcomes ADD COLUMN po_map TEXT NOT NULL DEFAULT '{}';
