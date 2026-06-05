import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const exportDir = process.argv[2] ?? "exports";
const outputFile = process.argv[3] ?? "d1-import.sql";

const order = [
  "departments",
  "profiles",
  "academic_years",
  "semesters",
  "courses",
  "course_outcomes",
  "modules",
  "topics",
  "experiments",
  "assessment_schemes",
  "reference_books",
  "course_versions",
  "course_invitations",
  "reviewer_comments",
  "approval_workflows",
  "curriculum_templates",
  "published_curricula",
  "notifications",
  "audit_logs",
];

const aliases = {
  faculty_user_id_user_id: "faculty_user_id",
  approved_by_user_id_user_id: "approved_by_user_id",
  pdf: "pdf_url",
  docx: "docx_url",
  template_pdf: "template_pdf_url",
  order: "sort_order",
};

const files = new Set(readdirSync(exportDir));
const statements = ["PRAGMA foreign_keys = ON;", "BEGIN TRANSACTION;"];

for (const table of order) {
  const file = `${table}.ndjson`;
  if (!files.has(file)) continue;
  const lines = readFileSync(join(exportDir, file), "utf8").split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const row = normalizeRow(JSON.parse(line));
    const columns = Object.keys(row);
    const values = columns.map((column) => sqlValue(row[column]));
    statements.push(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")});`);
  }
}

statements.push("COMMIT;");
writeFileSync(outputFile, `${statements.join("\n")}\n`);
console.log(`Wrote ${outputFile}`);

function normalizeRow(input) {
  const row = {};
  for (const [key, value] of Object.entries(input)) {
    const mappedKey = aliases[key] ?? key;
    if (value === null || value === undefined) {
      row[mappedKey] = null;
    } else if (typeof value === "boolean") {
      row[mappedKey] = value ? 1 : 0;
    } else if (typeof value === "object") {
      row[mappedKey] = JSON.stringify(value);
    } else {
      row[mappedKey] = value;
    }
  }
  return row;
}

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}
