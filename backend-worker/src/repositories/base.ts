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
    const columns = this.writableColumns.filter((column) => data[column] !== undefined);
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((column) => normalizeValue(data[column]));
    const row = await this.db
      .prepare(`INSERT INTO ${this.table} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`)
      .bind(...values)
      .first<T>();
    if (!row) throw new Error(`Failed to create ${this.table} row`);
    return row;
  }

  async update(id: string, data: Record<string, unknown>): Promise<T> {
    const columns = this.writableColumns.filter((column) => data[column] !== undefined);
    if (!columns.length) {
      const existing = await this.get(id);
      if (!existing) throw new Error(`${this.table} row not found`);
      return existing;
    }
    const assignments = columns.map((column) => `${column} = ?`).join(", ");
    const values = columns.map((column) => normalizeValue(data[column]));
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
