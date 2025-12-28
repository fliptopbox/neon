
import { Hono } from "hono";
import { query, queryOne } from "../db";
import { authMiddleware } from "../middleware/auth";
import type { Env } from "../db";

type Host = {
  id: number;
  user_profile_id: number;
  name: string;
  description: string;
  phone_number: string;
  social_urls: string[];
  currency_code: string;
  rate_max_hour: number;
  rate_max_day: number;
  tz: string;
};

const app = new Hono<{ Bindings: Env; Variables: { user: any } }>();

app.get("/", async (c) => {
  const hosts = await query(
    c.env,
    `SELECT h.*, up.fullname as organizer_name 
     FROM hosts h
     LEFT JOIN user_profiles up ON h.user_profile_id = up.id
     ORDER BY h.name`
  );
  return c.json(hosts);
});

app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const host = await queryOne(
    c.env,
    `SELECT h.*, up.fullname as organizer_name 
     FROM hosts h
     LEFT JOIN user_profiles up ON h.user_profile_id = up.id
     WHERE h.id = $1`,
    [id]
  );
  if (!host) return c.json({ error: "Host not found" }, 404);
  return c.json(host);
});

app.post("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    let data;
    try {
        data = await c.req.json();
    } catch(e) {
        return c.json({ error: "Invalid JSON body" }, 400);
    }

    // 1. Get User Profile ID
    const userProfile = await queryOne<{ id: number }>(
      c.env,
      "SELECT id FROM user_profiles WHERE user_id = $1",
      [user.userId]
    );
    
    if (!userProfile) {
        return c.json({ error: "User profile not found. Please complete your profile first." }, 400);
    }

    // 2. Check if already exists
    const existing = await queryOne(c.env, "SELECT id FROM hosts WHERE user_profile_id = $1", [userProfile.id]);
    if (existing) {
         return c.json({ error: "Host profile already exists." }, 409);
    }

    // 3. Insert
    const [host] = await query<Host>(
      c.env,
      `INSERT INTO hosts (
        user_profile_id, name, description, phone_number,
        currency_code, rate_max_hour, rate_max_day,
        social_urls, tz
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
      RETURNING *`,
      [
        userProfile.id,
        data.name,
        data.description || '',
        data.phone_number || '',
        data.currency_code || 'GBP',
        data.rate_max_hour || 25.00,
        data.rate_max_day || 150.00,
        JSON.stringify(data.social_urls || []),
        data.tz || 'Europe/London'
      ]
    );

    return c.json(host, 201);
  } catch (err: any) {
    console.error("Host Create Error:", err);
    return c.json({ 
        error: "Host creation failed: " + err.message, 
        stack: err.stack
    }, 500);
  }
});

app.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();
  const user = c.get("user");
  
  // Check ownership
  const existing = await queryOne<{user_profile_id: number}>(c.env, "SELECT user_profile_id FROM hosts WHERE id = $1", [id]);
  if (!existing) return c.json({error: "Host not found"}, 404);
   
  const up = await queryOne<{id: number}>(c.env, "SELECT id FROM user_profiles WHERE user_id = $1", [user.userId]);
  if (!up || existing.user_profile_id !== up.id) {
       return c.json({error: "Unauthorized"}, 403);
  }

  const [host] = await query(
    c.env,
    `UPDATE hosts SET 
      name = $1, description = $2, phone_number = $3,
      currency_code = $4, rate_max_hour = $5, rate_max_day = $6
    WHERE id = $7
    RETURNING *`,
    [
      data.name,
      data.description,
      data.phone_number,
      data.currency_code,
      data.rate_max_hour,
      data.rate_max_day,
      id
    ]
  );

  return c.json(host);
});

export default app;
