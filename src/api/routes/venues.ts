import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import type { Venue } from "../db/types";

const app = new Hono<{ Bindings: Env }>();

// Public: List all active venues
app.get("/", async (c) => {
  const venues = await query<Venue>(
    c.env,
    `SELECT v.*, ub.fullname as organizer_name 
     FROM venues v
     LEFT JOIN user_bios ub ON v.user_id = ub.user_id
     WHERE v.active = 1
     ORDER BY v.week_day, v.start_time`
  );
  return c.json(venues);
});

// Public: Get venue by ID
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const venue = await queryOne<Venue>(
    c.env,
    `SELECT v.*, ub.fullname as organizer_name 
     FROM venues v
     LEFT JOIN user_bios ub ON v.user_id = ub.user_id
     WHERE v.id = $1 AND v.active = 1`,
    [id]
  );

  if (!venue) {
    return c.json({ error: "Venue not found" }, 404);
  }

  return c.json(venue);
});

// Admin: Create venue
app.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const data = await c.req.json();

  const [venue] = await query<Venue>(
    c.env,
    `INSERT INTO venues (
      user_id, name, week_day, frequency, instagram, website, 
      address, timezone, start_time, duration, postcode, area,
      price_inperson, price_online, tags
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [
      user.userId,
      data.name,
      data.week_day,
      data.frequency || "weekly",
      data.instagram,
      data.website,
      data.address,
      data.timezone,
      data.start_time,
      data.duration,
      data.postcode,
      data.area,
      data.price_inperson || 0,
      data.price_online || 0,
      JSON.stringify(data.tags || []),
    ]
  );

  return c.json(venue, 201);
});

// Admin: Update venue
app.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();

  const [venue] = await query<Venue>(
    c.env,
    `UPDATE venues SET 
      name = $1, week_day = $2, frequency = $3, instagram = $4,
      website = $5, address = $6, timezone = $7, start_time = $8,
      duration = $9, postcode = $10, area = $11, price_inperson = $12,
      price_online = $13, tags = $14, modified_on = NOW()
    WHERE id = $15
    RETURNING *`,
    [
      data.name,
      data.week_day,
      data.frequency,
      data.instagram,
      data.website,
      data.address,
      data.timezone,
      data.start_time,
      data.duration,
      data.postcode,
      data.area,
      data.price_inperson,
      data.price_online,
      JSON.stringify(data.tags || []),
      id,
    ]
  );

  if (!venue) {
    return c.json({ error: "Venue not found" }, 404);
  }

  return c.json(venue);
});

// Admin: Delete venue (soft delete)
app.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  await query(c.env, "UPDATE venues SET active = 0 WHERE id = $1", [id]);

  return c.json({ message: "Venue deleted" });
});

export default app;
