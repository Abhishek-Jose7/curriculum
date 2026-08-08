ALTER TABLE courses ADD COLUMN share_token TEXT;

ALTER TABLE reviewer_comments ADD COLUMN is_external INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reviewer_comments ADD COLUMN reviewer_name TEXT;
ALTER TABLE reviewer_comments ADD COLUMN reviewer_email TEXT;
