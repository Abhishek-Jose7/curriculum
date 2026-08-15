-- Reviewer PIN + lockout state, attached to the existing share_token mechanism
ALTER TABLE courses ADD COLUMN review_pin TEXT;
ALTER TABLE courses ADD COLUMN review_pin_failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN review_pin_locked_until TEXT;
ALTER TABLE courses ADD COLUMN review_link_generated_at TEXT;

-- Draft vs submitted state for reviewer comments (needed for the batch-submit flow)
ALTER TABLE reviewer_comments ADD COLUMN status TEXT NOT NULL DEFAULT 'SUBMITTED'
  CHECK(status IN ('DRAFT','SUBMITTED'));
ALTER TABLE reviewer_comments ADD COLUMN submitted_at TEXT;
