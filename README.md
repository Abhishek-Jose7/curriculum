# Curriculum Management and Publishing System

Production-grade edge-native monorepo for a college engineering department to author, review, approve, version, and publish official curriculum documents from structured database content.

## Architecture

The system is fully edge-native and runs entirely on serverless architectures:

- **Frontend**: Next.js App Router (deployed on Vercel or Cloudflare Pages) which queries the database API.
- **Backend**: Cloudflare Workers + Hono API framework (deployed on Cloudflare Workers) which handles authentication, curriculum details, review workflows, and version snapshots.
- **Database**: Cloudflare D1 (relational SQLite database hosted natively on Cloudflare's edge).
- **Object Storage**: Cloudflare R2 bucket storing fonts, media assets, and compiled PDF handbook artifacts.
- **Queue**: Cloudflare Queues for asynchronous browser-based PDF compilation using Headless Chromium rendering (`@cloudflare/puppeteer`).

---

## Folder Structure

```text
backend-worker/
  src/              Hono API routes, repositories, and services
  migrations/       D1 SQLite schema migrations
  schema.sql        canonical database schema
  seed.sql          seeding script for development
  tsconfig.json     TypeScript worker configuration
  wrangler.json     Cloudflare Worker and bindings configuration

frontend/
  app/              Next.js app pages (basic, teacher editing, review, print preview)
  components/       layout, UI primitives, and the curriculum editor
  hooks/            autosave hooks
  lib/              API fetch utilities
  types/            TypeScript domain types
  tests/            frontend unit tests
```

---

## Running Locally

### 1. Start the Backend Worker

Navigate to the `backend-worker` directory, install dependencies, and run wrangler dev:

```bash
cd backend-worker
npm install
npm run dev
```

This starts the local Cloudflare Worker development server (typically on `http://localhost:8787`).
To run migrations and seed data locally:

```bash
# Apply schema to local dev database
npx wrangler d1 execute curriculum-db --local --file=./schema.sql

# Seed local dev database
npx wrangler d1 execute curriculum-db --local --file=./seed.sql
```

### 2. Start the Frontend Application

Navigate to the `frontend` directory, install dependencies, and start Next.js:

```bash
cd frontend
npm install
npm run dev
```

Create/check the `.env` file in the `frontend` folder to ensure it points to the backend worker port (e.g. `http://localhost:8787/api` or `http://localhost:8787`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8787/api
```

Open `http://localhost:3000` in your browser.

---

## Deployment Guide

### Deploying the Backend on Cloudflare Workers

1. Make sure you are authenticated with wrangler:
   ```bash
   npx wrangler login
   ```

2. If the D1 database does not exist, create it:
   ```bash
   npx wrangler d1 create curriculum-db
   ```
   Take the `database_id` returned and update the `d1_databases` block in `backend-worker/wrangler.json`.

3. Initialize the D1 schema and seed data on the remote production database:
   ```bash
   # Create tables
   npx wrangler d1 execute curriculum-db --remote --file=./schema.sql --yes

   # Seed initial datasets
   npx wrangler d1 execute curriculum-db --remote --file=./seed.sql --yes
   ```

4. Create the R2 bucket for file storage:
   ```bash
   npx wrangler r2 bucket create curriculum-files
   ```

5. Deploy the Worker API:
   ```bash
   cd backend-worker
   npx wrangler deploy
   ```

Note the deployed worker endpoint (e.g., `https://curriculum-backend.<your-subdomain>.workers.dev`).

---

### Deploying the Frontend on Vercel

The frontend Next.js application is configured to deploy directly to Vercel:

1. Import your repository into Vercel.
2. In the project settings, set:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
3. Add the following **Environment Variable**:
   - `NEXT_PUBLIC_API_URL`: The HTTP endpoint of your deployed Cloudflare Worker API followed by `/api` (e.g. `https://curriculum-backend.<your-subdomain>.workers.dev/api`).
4. Click **Deploy**. Vercel will build the Next.js app and serve it edge-cached globally!

---

## Testing

Run unit tests in the frontend workspace:

```bash
cd frontend
npm test
```
