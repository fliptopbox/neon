import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import type { JWTPayload } from "../middleware/auth";
import type { Model } from "../db/types";

const app = new Hono<{ Bindings: Env; Variables: { user: JWTPayload } }>();

// Public: List all active models
app.get("/", async (c) => {
  const models = await query(
    c.env,
    `SELECT m.*, up.fullname, up.handle, up.flag_emoji, up.user_id, up.currency_code, up.phone_number, u.email,
     (SELECT COUNT(*) FROM calendar c WHERE c.user_id = m.user_id) as calendar_count
     FROM models m
     LEFT JOIN user_profiles up ON m.user_id = up.user_id
     LEFT JOIN users u ON m.user_id = u.id
     WHERE up.is_profile_active = true
     ORDER BY m.id DESC`
  );
  return c.json(models);
});

// Public: Get model by user_id
app.get("/by-user/:userId", async (c) => {
  const userId = c.req.param("userId");
  const model = await queryOne(
    c.env,
    `SELECT m.*, up.fullname, up.handle, up.flag_emoji, up.currency_code
     FROM models m
     JOIN user_profiles up ON m.user_id = up.user_id
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
  const model = await queryOne(
    c.env,
    `SELECT m.*, up.fullname, up.handle, up.flag_emoji, up.user_id, up.currency_code
     FROM models m
     LEFT JOIN user_profiles up ON m.user_id = up.user_id
     WHERE m.id = $1`,
    [id]
  );

  if (!model) {
    return c.json({ error: "Model not found" }, 404);
  }

  return c.json(model);
});

// Create Model (Admin or Self)
app.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const data = await c.req.json();
    
    // Determine target user ID
    let targetUserId = user.userId;
    if (user.isAdmin && data.user_id) {
      targetUserId = data.user_id;
    }

    // 1. Check if model already exists for this user
    const existingModel = await queryOne(
      c.env,
      `SELECT id FROM models WHERE user_id = $1`,
      [targetUserId]
    );

    if (existingModel) {
      return c.json({ error: "Model profile already exists for this user." }, 409);
    }
    
    // 2. Insert Model
    const [newModel] = await query<Model>(
      c.env,
      `INSERT INTO models (
        user_id,
        display_name, description,
        rate_min_hour, rate_min_day,
        tz, work_inperson, work_online, work_photography,
        work_seeks, social_handles, website_urls,
        date_birthday, date_experience,
        sex, pronouns, date_created
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13, $14, $15, $16, NOW()
      ) RETURNING *`,
      [
        targetUserId,
        data.display_name,
        data.description,
        data.rate_min_hour || 20.0,
        data.rate_min_day || 120.0,
        data.tz || 'Europe/London',
        data.work_inperson ?? true,
        data.work_online ?? false,
        data.work_photography ?? false,
        JSON.stringify(data.work_seeks || []),
        JSON.stringify(data.social_handles || {}),
        JSON.stringify(data.website_urls || []),
        data.date_birthday || null,
        data.date_experience || null,
        data.sex || 'unspecified',
        data.pronouns || ''
      ]
    );

    return c.json(newModel, 201);
  } catch (err: any) {
    console.error("Error creating model:", err);
    return c.json({ error: "Caught in Handler: " + err.message, stack: err.stack, name: err.name }, 500);
  }
});

// Update Model
app.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const data = await c.req.json();

  // Fetch full existing model to check ownership
  const existingModel = await queryOne<Model>(
    c.env,
    `SELECT * FROM models WHERE id = $1`,
    [id]
  );

  if (!existingModel) {
    return c.json({ error: "Model not found" }, 404);
  }

  if (!user.isAdmin && existingModel.user_id !== user.userId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Helper to merge fields
  const val = (key: string) => (data[key] !== undefined ? data[key] : (existingModel as any)[key]);
  const jsonVal = (key: string) => {
      const v = val(key);
      return typeof v === 'string' ? v : JSON.stringify(v || []);
  };
  const jsonObjVal = (key: string) => {
      const v = val(key);
      return typeof v === 'string' ? v : JSON.stringify(v || {});
  };

  try {
    // Update models table
    // Note: currency_code, phone_number, product_urls removed as they are not in schema for models table?
    // Checking schema: phone_number is in user_profiles. currency_code is in user_profiles.
    // product_urls? Not in models schema. website_urls IS. social_handles IS.
    
    const [updatedModel] = await query<Model>(
      c.env,
      `UPDATE models SET 
        display_name = $1, description = $2,
        rate_min_hour = $3, rate_min_day = $4,
        tz = $5, work_inperson = $6, work_online = $7, work_photography = $8,
        work_seeks = $9::jsonb, social_handles = $10::jsonb, website_urls = $11::jsonb,
        date_birthday = $12, date_experience = $13,
        sex = $14, pronouns = $15
       WHERE id = $16
       RETURNING *`,
      [
        val('display_name'),
        val('description'),
        val('rate_min_hour'),
        val('rate_min_day'),
        val('tz'),
        val('work_inperson'),
        val('work_online'),
        val('work_photography'),
        jsonVal('work_seeks'),
        jsonObjVal('social_handles'),
        jsonVal('website_urls'),
        val('date_birthday'), 
        val('date_experience'),
        val('sex'),
        val('pronouns'),
        id
      ]
    );

    return c.json(updatedModel);
  } catch (err: any) {
    console.error("Error updating model:", err);
    return c.json({ error: err.message }, 500);
  }
});

app.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
    const id = c.req.param("id");
    await query(c.env, "DELETE FROM models WHERE id = $1", [id]);
    return c.json({ message: "Model profile deleted" });
});

export default app;
