-- Migration 0002: year_of_study grouping for published_curricula
-- Apply: npx wrangler d1 execute curriculum-db --local --file=./migrations/0002_year_of_study.sql

ALTER TABLE published_curricula ADD COLUMN year_of_study TEXT CHECK(year_of_study IN ('FE','SE','TE','BE'));
ALTER TABLE published_curricula ADD COLUMN hod_approved_at DATETIME;
ALTER TABLE published_curricula ADD COLUMN hod_approved_by TEXT REFERENCES profiles(id) ON DELETE SET NULL;
