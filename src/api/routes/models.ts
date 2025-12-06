import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import type { Model } from "../db/types";

const app = new Hono<{ Bindings: Env }>();

// Public: List all active models
app.get("/", async (c) => {
  const models = await query<Model>(
    c.env,
    `SELECT m.*, ub.fullname, ub.known_as, ub.description, ub.instagram as bio_instagram,
     ub.websites, u.emailaddress as email
     FROM models m
     LEFT JOIN user_bios ub ON m.user_id = ub.user_id
     LEFT JOIN users u ON m.user_id = u.id
     WHERE m.active = 1
     ORDER BY m.created_on DESC`
  );
  return c.json(models);
});

// Public: Get model by user_id (includes inactive models for calendar display)
app.get("/by-user/:userId", async (c) => {
  const userId = c.req.param("userId");
  const model = await queryOne<Model>(
    c.env,
    `SELECT m.*, ub.fullname, ub.known_as, ub.description, ub.instagram as bio_instagram,
     ub.websites, u.emailaddress as email
     FROM models m
     LEFT JOIN user_bios ub ON m.user_id = ub.user_id
     LEFT JOIN users u ON m.user_id = u.id
     WHERE m.user_id = $1`,
    [userId]
  );

  if (!model) {
    return c.json({ error: "Model not found" }, 404);
  }

  return c.json(model);
});

// Public: Get model by ID
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const model = await queryOne<Model>(
    c.env,
    `SELECT m.*, ub.fullname, ub.known_as, ub.description, ub.instagram as bio_instagram
     FROM models m
     LEFT JOIN user_bios ub ON m.user_id = ub.user_id
     WHERE m.id = $1 AND m.active = 1`,
    [id]
  );

  if (!model) {
    return c.json({ error: "Model not found" }, 404);
  }

  return c.json(model);
});

// Admin: Create model
app.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const data = await c.req.json();

  // Parse websites array from newline-separated string
  let websitesJson = "[]";
  if (data.websites) {
    const websitesArray = data.websites
      .split("\n")
      .filter((url: string) => url.trim());
    websitesJson = JSON.stringify(websitesArray);
  }

  // Insert or update user_bios
  const existingBio = await queryOne(
    c.env,
    `SELECT id FROM user_bios WHERE user_id = $1`,
    [user.userId]
  );

  if (existingBio) {
    await query(
      c.env,
      `UPDATE user_bios SET
         fullname = $1, known_as = $2, description = $3,
         instagram = $4, websites = $5::jsonb, modified_on = NOW()
       WHERE user_id = $6`,
      [
        data.fullname,
        data.known_as || null,
        data.description || null,
        data.bio_instagram || null,
        websitesJson,
        user.userId,
      ]
    );
  } else {
    await query(
      c.env,
      `INSERT INTO user_bios (user_id, fullname, known_as, description, instagram, websites)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        user.userId,
        data.fullname,
        data.known_as || null,
        data.description || null,
        data.bio_instagram || null,
        websitesJson,
      ]
    );
  }

  // Insert model
  const [model] = await query<Model>(
    c.env,
    `INSERT INTO models (
      user_id, sex, instagram, portrait, account_holder,
      account_number, account_sortcode, active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      user.userId,
      data.sex || 0,
      data.instagram,
      data.portrait,
      data.account_holder,
      data.account_number,
      data.account_sortcode,
      data.active !== undefined ? data.active : 1,
    ]
  );

  return c.json(model, 201);
});

// Admin: Update model
app.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();

  // Get the model to find user_id
  const existingModel = await queryOne<Model>(
    c.env,
    `SELECT user_id FROM models WHERE id = $1`,
    [id]
  );

  if (!existingModel) {
    return c.json({ error: "Model not found" }, 404);
  }

  // Parse websites array from newline-separated string
  let websitesJson = "[]";
  if (data.websites) {
    const websitesArray = data.websites
      .split("\n")
      .filter((url: string) => url.trim());
    websitesJson = JSON.stringify(websitesArray);
  }

  // Update user_bios
  const existingBio = await queryOne(
    c.env,
    `SELECT id FROM user_bios WHERE user_id = $1`,
    [existingModel.user_id]
  );

  if (existingBio) {
    await query(
      c.env,
      `UPDATE user_bios SET
         fullname = $1, known_as = $2, description = $3,
         instagram = $4, websites = $5::jsonb, modified_on = NOW()
       WHERE user_id = $6`,
      [
        data.fullname,
        data.known_as || null,
        data.description || null,
        data.bio_instagram || null,
        websitesJson,
        existingModel.user_id,
      ]
    );
  } else {
    await query(
      c.env,
      `INSERT INTO user_bios (user_id, fullname, known_as, description, instagram, websites)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        existingModel.user_id,
        data.fullname,
        data.known_as || null,
        data.description || null,
        data.bio_instagram || null,
        websitesJson,
      ]
    );
  }

  // Update model
  const [model] = await query<Model>(
    c.env,
    `UPDATE models SET 
      sex = $1, instagram = $2, portrait = $3, account_holder = $4,
      account_number = $5, account_sortcode = $6, active = $7, modified_on = NOW()
    WHERE id = $8
    RETURNING *`,
    [
      data.sex,
      data.instagram,
      data.portrait,
      data.account_holder,
      data.account_number,
      data.account_sortcode,
      data.active !== undefined ? data.active : 1,
      id,
    ]
  );

  if (!model) {
    return c.json({ error: "Model not found" }, 404);
  }

  return c.json(model);
});

// Admin: Delete model (soft delete)
app.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  await query(c.env, "UPDATE models SET active = 0 WHERE id = $1", [id]);

  return c.json({ message: "Model deleted" });
});

export default app;
