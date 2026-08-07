type Query = Record<string, string | undefined>;

export class BaseRepository<T extends Record<string, unknown>> {
  constructor(
    protected readonly db: D1Database,
    protected readonly table: string,
    protected readonly writableColumns: string[],
    protected readonly filterColumns: string[] = [],
  ) {}

  async list(query: Query = {}): Promise<T[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];
    for (const column of this.filterColumns) {
      const value = query[column];
      if (value !== undefined && value !== "") {
        clauses.push(`${column} = ?`);
        values.push(value);
      }
    }
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
    const result = await this.db.prepare(`SELECT * FROM ${this.table}${where}`).bind(...values).all<T>();
    return result.results ?? [];
  }

  async get(id: string): Promise<T | null> {
    return await this.db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).bind(id).first<T>();
  }

  async create(data: Record<string, unknown>): Promise<T> {
    const payload: Record<string, unknown> = { ...data };
    if (payload.department !== undefined && payload.department_id === undefined) {
      payload.department_id = payload.department;
    }
    if (payload.academic_year !== undefined && payload.academic_year_id === undefined) {
      payload.academic_year_id = payload.academic_year;
    }
    if (payload.semester !== undefined && payload.semester_id === undefined) {
      payload.semester_id = payload.semester;
    }
    if (!payload.id && !this.writableColumns.includes("id")) {
      payload.id = crypto.randomUUID();
    }
    const cols = Array.from(new Set([...(payload.id ? ["id"] : []), ...this.writableColumns]));
    const columns = cols.filter((column) => payload[column] !== undefined);
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((column) => normalizeValue(payload[column]));
    const quotedCols = columns.map((c) => `"${c}"`).join(", ");
    const row = await this.db
      .prepare(`INSERT INTO ${this.table} (${quotedCols}) VALUES (${placeholders}) RETURNING *`)
      .bind(...values)
      .first<T>();
    if (!row) throw new Error(`Failed to create ${this.table} row`);
    return row;
  }

  async update(id: string, data: Record<string, unknown>): Promise<T> {
    const payload: Record<string, unknown> = { ...data };
    if (payload.department !== undefined && payload.department_id === undefined) {
      payload.department_id = payload.department;
    }
    if (payload.semester !== undefined && payload.semester_id === undefined) {
      payload.semester_id = payload.semester;
    }
    const columns = this.writableColumns.filter((column) => payload[column] !== undefined);
    if (!columns.length) {
      const existing = await this.get(id);
      if (!existing) throw new Error(`${this.table} row not found`);
      return existing;
    }
    const assignments = columns.map((column) => `"${column}" = ?`).join(", ");
    const values = columns.map((column) => normalizeValue(payload[column]));
    const row = await this.db
      .prepare(`UPDATE ${this.table} SET ${assignments} WHERE id = ? RETURNING *`)
      .bind(...values, id)
      .first<T>();
    if (!row) throw new Error(`${this.table} row not found`);
    return row;
  }

  async delete(id: string): Promise<void> {
    await this.db.prepare(`DELETE FROM ${this.table} WHERE id = ?`).bind(id).run();
  }
}

export function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value) || (value && typeof value === "object")) return JSON.stringify(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
