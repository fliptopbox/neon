import { Hono } from "hono";
import type { Env } from "../db";
import { query } from "../db";
import { authMiddleware } from "../middleware/auth";
import type { Image } from "../db/types";

const app = new Hono<{ Bindings: Env }>();

// Get images by user ID
app.get("/user/:userId", async (c) => {
  const userId = c.req.param("userId");

  const images = await query<Image>(
    c.env,
    `SELECT i.*, t.name as type_name
     FROM images i
     LEFT JOIN types t ON i.type_id = t.id
     WHERE i.user_id = $1 AND i.active = 1
     ORDER BY i.created_on DESC`,
    [userId]
  );

  return c.json(images);
});

// Upload image
app.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const data = await c.req.json();

  const [image] = await query<Image>(
    c.env,
    `INSERT INTO images (user_id, type_id, src)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [user.userId, data.type_id, data.src]
  );

  return c.json(image, 201);
});

// Delete image
app.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  await query(
    c.env,
    "UPDATE images SET active = 0 WHERE id = $1 AND user_id = $2",
    [id, user.userId]
  );

  return c.json({ message: "Image deleted" });
});

export default app;
