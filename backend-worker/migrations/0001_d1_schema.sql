-- Apply with:
-- wrangler d1 execute curriculum-db --local --file=./schema.sql
-- wrangler d1 execute curriculum-db --remote --file=./schema.sql

-- This migration intentionally delegates to ../schema.sql to avoid maintaining
-- two divergent schema definitions. Use the commands above from backend-worker/.
