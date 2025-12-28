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
    `SELECT m.*, up.fullname, up.handle, up.flag_emoji, up.user_id
     FROM models m
     LEFT JOIN user_profiles up ON m.user_profile_id = up.id
     WHERE up.is_profile_active = true
     ORDER BY m.id DESC`
  );
  return c.json(models);
});

// Public: Get model by user_id
// We join user_profiles to find the model associated with this user_id
app.get("/by-user/:userId", async (c) => {
  const userId = c.req.param("userId");
  const model = await queryOne(
    c.env,
    `SELECT m.*, up.fullname, up.handle, up.flag_emoji
     FROM models m
     JOIN user_profiles up ON m.user_profile_id = up.id
     WHERE up.user_id = $1`,
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
    `SELECT m.*, up.fullname, up.handle, up.flag_emoji, up.user_id
     FROM models m
     LEFT JOIN user_profiles up ON m.user_profile_id = up.id
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
    
    // CheckPoint 1
    // return c.json({ info: "CP1", data }); 

    // Determine target user ID
    let targetUserId = user.userId;
    if (user.isAdmin && data.user_id) {
      targetUserId = data.user_id;
    }

    // 1. Get User Profile ID
    const userProfile = await queryOne(
      c.env,
      `SELECT id FROM user_profiles WHERE user_id = $1`,
      [targetUserId]
    );

    if (!userProfile) {
      return c.json({ error: "User profile not found. Please create a user profile first." }, 404);
    }
    
    // CheckPoint 2
    // return c.json({ info: "CP2", profile: userProfile });

    const userProfileId = userProfile.id;

    // 2. Check if model already exists for this profile
    const existingModel = await queryOne(
      c.env,
      `SELECT id FROM models WHERE user_profile_id = $1`,
      [userProfileId]
    );

    if (existingModel) {
      return c.json({ error: "Model profile already exists for this user." }, 409);
    }
    
    // CheckPoint 3
    // return c.json({ info: "CP3", msg: "Ready to insert" });

    // 3. Insert Model
    // Attempting insert...
    // Note: If this fails, catch block catches it.
    
    const [newModel] = await query<Model>(
      c.env,
      `INSERT INTO models (
        user_profile_id,
        display_name, phone_number, description,
        currency_code, rate_min_hour, rate_min_day,
        tz, work_inperson, work_online, work_photography,
        work_seeks, social_urls, product_urls,
        date_birthday, date_experience,
        sex, pronouns
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb, $14::jsonb, $15, $16, $17, $18
      ) RETURNING *`,
      [
        userProfileId,
        data.display_name,
        data.phone_number,
        data.description,
        data.currency_code || 'GBP',
        data.rate_min_hour || 0,
        data.rate_min_day || 0,
        data.tz || 'Europe/London',
        data.work_inperson ?? true,
        data.work_online ?? false,
        data.work_photography ?? false,
        JSON.stringify(data.work_seeks || []),
        JSON.stringify(data.social_urls || []),
        JSON.stringify(data.product_urls || []),
        data.date_birthday || null,
        data.date_experience || null,
        data.sex || 0,
        data.pronouns || ''
      ]
    );

    return c.json(newModel, 201);
  } catch (err: any) {
    // Return detailed error
    return c.json({ error: "Caught in Handler: " + err.message, stack: err.stack, name: err.name }, 500);
  }
});

// Update Model
app.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const data = await c.req.json();

  // Fetch full existing model and user_id for auth check
  const existingModel = await queryOne<Model & { user_id: number }>(
    c.env,
    `SELECT m.*, up.user_id 
     FROM models m 
     JOIN user_profiles up ON m.user_profile_id = up.id 
     WHERE m.id = $1`,
    [id]
  );

  if (!existingModel) {
    return c.json({ error: "Model not found" }, 404);
  }

  if (!user.isAdmin && existingModel.user_id !== user.userId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Helper to merge fields (undefined in data means keep existing)
  const val = (key: string) => (data[key] !== undefined ? data[key] : (existingModel as any)[key]);
  
  // Special handling for JSON fields which might come as object or string (if previously parsed)
  // But wait, existingModel fields from DB are already proper types (thanks to neon driver? or strings?)
  // Neon driver usually returns JSONB as objects.
  // So val('work_seeks') should returning object.
  // We need to stringify it for INSERT/UPDATE params? 
  // params expects string or object? Neon driver handles objects for jsonb?
  // In INSERT I used `JSON.stringify()`.
  // Let's safe-stringify.
  const jsonVal = (key: string) => {
      const v = val(key);
      return typeof v === 'string' ? v : JSON.stringify(v || []);
  };

  try {
    // Update models table
    const [updatedModel] = await query<Model>(
      c.env,
      `UPDATE models SET 
        display_name = $1, phone_number = $2, description = $3,
        currency_code = $4, rate_min_hour = $5, rate_min_day = $6,
        tz = $7, work_inperson = $8, work_online = $9, work_photography = $10,
        work_seeks = $11::jsonb, social_urls = $12::jsonb, product_urls = $13::jsonb,
        date_birthday = $14, date_experience = $15,
        sex = $16, pronouns = $17
       WHERE id = $18
       RETURNING *`,
      [
        val('display_name'),
        val('phone_number'),
        val('description'),
        val('currency_code'),
        val('rate_min_hour'),
        val('rate_min_day'),
        val('tz'),
        val('work_inperson'),
        val('work_online'),
        val('work_photography'),
        jsonVal('work_seeks'),
        jsonVal('social_urls'),
        jsonVal('product_urls'),
        val('date_birthday'), 
        val('date_experience'),
        val('sex'),
        val('pronouns'),
        id
      ]
    );

    // Update user_profiles if flag_emoji is provided
    if (data.flag_emoji) {
        await query(
            c.env,
            `UPDATE user_profiles SET flag_emoji = $1 WHERE id = $2`,
            [data.flag_emoji, existingModel.user_profile_id]
        );
        // We could fetch and merge the flag into the response, but client usually reloads or doesn't care immediately.
        // But for completeness let's pretend updatedModel has it if we extended the type.
    }

    return c.json(updatedModel);
  } catch (err: any) {
    console.error("Error updating model:", err);
    return c.json({ error: err.message }, 500);
  }
});

// Admin: Delete (Hard Delete?)
// Schema doesn't look like it has 'active' flag in models except maybe implicit?
// Check columns again: no 'active' column found in Step 670!
// Ah, step 670 output:
// - id (integer)
// - user_profile_id (integer)
// ...
// - active (MISSING from step 670 output?)
// Wait, step 670 output:
/*
- id (integer)
- user_profile_id (integer)
- work_seeks (jsonb)
...
- sex (smallint)
- rate_min_hour (numeric)
...
- pronouns (character varying)
*/
// It does NOT show 'active' column. 
// DBML said: 'active' IS MISSING in Table models definition I viewed in Step 656.
// Step 647 'models.ts' imported 'Model' type which usually had 'active'.
// But real DB has no active column.
// So delete = DELETE FROM models?
// Or maybe user_profile 'is_profile_active' controls visibility?
// "WHERE up.is_profile_active = true" in GET /.
// So I don't need to delete the model row, just rely on profile?
// Or I can delete the model row if I want to remove the "model" capability.

app.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
    const id = c.req.param("id");
    await query(c.env, "DELETE FROM models WHERE id = $1", [id]);
    return c.json({ message: "Model profile deleted" });
});

export default app;
