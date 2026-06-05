import { Hono } from "hono";
import { BaseRepository } from "../repositories/base";
import { isAcademicAdmin } from "../middleware/auth";
import type { Env, Variables } from "../types";

export function crudRoute(table: string, columns: string[], filters: string[], adminWrite = true) {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
  app.get("/", async (c) => c.json(await new BaseRepository(c.env.DB, table, columns, filters).list(Object.fromEntries(new URL(c.req.url).searchParams))));
  app.get("/:id/", async (c) => {
    const row = await new BaseRepository(c.env.DB, table, columns, filters).get(c.req.param("id"));
    return row ? c.json(row) : c.json({ detail: "Not found." }, 404);
  });
  app.post("/", async (c) => {
    if (adminWrite && !isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
    return c.json(await new BaseRepository(c.env.DB, table, columns, filters).create(await c.req.json()), 201);
  });
  app.patch("/:id/", async (c) => {
    if (adminWrite && !isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
    return c.json(await new BaseRepository(c.env.DB, table, columns, filters).update(c.req.param("id"), await c.req.json()));
  });
  app.put("/:id/", async (c) => {
    if (adminWrite && !isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
    return c.json(await new BaseRepository(c.env.DB, table, columns, filters).update(c.req.param("id"), await c.req.json()));
  });
  app.delete("/:id/", async (c) => {
    if (adminWrite && !isAcademicAdmin(c.get("user"))) return c.json({ detail: "Permission denied." }, 403);
    await new BaseRepository(c.env.DB, table, columns, filters).delete(c.req.param("id"));
    return c.body(null, 204);
  });
  return app;
}
