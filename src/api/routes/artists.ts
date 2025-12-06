import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import type { Artist } from "../db/types";

const app = new Hono<{ Bindings: Env }>();

// Public: List all active artists
app.get("/", async (c) => {
  const artists = await query<Artist>(
    c.env,
    `SELECT a.*, ub.fullname, ub.known_as, ub.description, ub.instagram, ub.websites
     FROM artists a
     LEFT JOIN user_bios ub ON a.user_id = ub.user_id
     WHERE a.active = 1
     ORDER BY a.created_on DESC`
  );
  return c.json(artists);
});

// Public: Get artist by ID
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const artist = await queryOne<Artist>(
    c.env,
    `SELECT a.*, ub.fullname, ub.known_as, ub.description, ub.instagram, ub.websites
     FROM artists a
     LEFT JOIN user_bios ub ON a.user_id = ub.user_id
     WHERE a.id = $1 AND a.active = 1`,
    [id]
  );

  if (!artist) {
    return c.json({ error: "Artist not found" }, 404);
  }

  return c.json(artist);
});

// Admin: Create artist
app.post("/", authMiddleware, async (c) => {
  const user = c.get("user");

  const [artist] = await query<Artist>(
    c.env,
    `INSERT INTO artists (user_id) VALUES ($1) RETURNING *`,
    [user.userId]
  );

  return c.json(artist, 201);
});

// Admin: Update artist
app.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();

  const [artist] = await query<Artist>(
    c.env,
    `UPDATE artists SET modified_on = NOW()
    WHERE id = $1
    RETURNING *`,
    [id]
  );

  if (!artist) {
    return c.json({ error: "Artist not found" }, 404);
  }

  return c.json(artist);
});

// Admin: Delete artist (soft delete)
app.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  await query(c.env, "UPDATE artists SET active = 0 WHERE id = $1", [id]);

  return c.json({ message: "Artist deleted" });
});

export default app;
