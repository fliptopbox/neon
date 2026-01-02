

import { Hono } from "hono";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import type { Env } from "../db";

type Host = {
  id: number;
  user_id: number;
  name: string;
  description: string;
  social_handles: any;
  default_date_time: string;
  default_duration: number;
  rate_max_hour: number;
  rate_max_day: number;
  tz: string;
  host_tags: any;
};

const app = new Hono<{ Bindings: Env; Variables: { user: any } }>();

app.get("/", async (c) => {
  const hosts = await query(
    c.env,
    `SELECT h.*, up.fullname as organizer_name, up.currency_code,
     (SELECT COUNT(*) FROM calendar c JOIN events e ON c.event_id = e.id WHERE e.user_id = h.user_id) as calendar_count
     FROM hosts h
     LEFT JOIN user_profiles up ON h.user_id = up.user_id
     ORDER BY h.name`
  );
  return c.json(hosts);
});

app.get("/to-user/:userId", async (c) => {
  const userId = c.req.param("userId");
  const host = await queryOne(
    c.env,
    `SELECT h.*, up.fullname as organizer_name, up.currency_code
     FROM hosts h
     LEFT JOIN user_profiles up ON h.user_id = up.user_id
     WHERE h.user_id = $1`,
    [userId]
  );
   if (!host) return c.json({ error: "Host not found" }, 404);
   return c.json(host);
});

app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const host = await queryOne(
    c.env,
    `SELECT h.*, up.fullname as organizer_name, up.currency_code
     FROM hosts h
     LEFT JOIN user_profiles up ON h.user_id = up.user_id
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
    
    // Determine target user ID
    let targetUserId = user.userId;
    if (user.isAdmin && data.user_id) {
      targetUserId = data.user_id;
    }

    // 1. Check if already exists
    const existing = await queryOne(c.env, "SELECT id FROM hosts WHERE user_id = $1", [targetUserId]);
    if (existing) {
         return c.json({ error: "Host profile already exists." }, 409);
    }

    // 2. Insert
    const [host] = await query<Host>(
      c.env,
      `INSERT INTO hosts (
        user_id, name, description,
        rate_max_hour, rate_max_day,
        social_handles, tz, host_tags
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb)
      RETURNING *`,
      [
        targetUserId,
        data.name,
        data.description || '',
        data.rate_max_hour || 25.00,
        data.rate_max_day || 150.00,
        JSON.stringify(data.social_handles || {}),
        data.tz || 'Europe/London',
        JSON.stringify(data.host_tags || [])
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
  const existing = await queryOne<{user_id: number}>(c.env, "SELECT user_id FROM hosts WHERE id = $1", [id]);
  if (!existing) return c.json({error: "Host not found"}, 404);
   
  if (!user.isAdmin && existing.user_id !== user.userId) {
       return c.json({error: "Unauthorized"}, 403);
  }
  
  // Helper to merge fields
  const getExisting = await queryOne<Host>(c.env, "SELECT * FROM hosts WHERE id = $1", [id]);
  if (!getExisting) return c.json({ error: "Host not found" }, 404); // Should be covered above
  
  const val = (key: string) => (data[key] !== undefined ? data[key] : (getExisting as any)[key]);
  const jsonObjVal = (key: string) => {
      const v = val(key);
      return typeof v === 'string' ? v : JSON.stringify(v || {});
  };
  const jsonArrVal = (key: string) => {
      const v = val(key);
      return typeof v === 'string' ? v : JSON.stringify(v || []);
  };

  const [host] = await query(
    c.env,
    `UPDATE hosts SET 
      name = $1, description = $2,
      rate_max_hour = $3, rate_max_day = $4,
      social_handles = $5::jsonb, host_tags = $6::jsonb, tz = $7
    WHERE id = $8
    RETURNING *`,
    [
      val('name'),
      val('description'),
      val('rate_max_hour'),
      val('rate_max_day'),
      jsonObjVal('social_handles'),
      jsonArrVal('host_tags'),
      val('tz'),
      id
    ]
  );

  return c.json(host);
});

app.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
    const id = c.req.param("id");
    await query(c.env, "DELETE FROM hosts WHERE id = $1", [id]);
    return c.json({ message: "Host profile deleted" });
});

export default app;
