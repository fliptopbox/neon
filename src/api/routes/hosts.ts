import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Env }>();

// Public: List all active hosts
app.get("/", async (c) => {
  const hosts = await query(
    c.env,
    `SELECT h.*, ub.fullname as organizer_name 
     FROM hosts h
     LEFT JOIN user_bios ub ON h.user_id = ub.user_id
     WHERE h.active = 1
     ORDER BY h.name`
  );
  return c.json(hosts);
});

// Public: Get host by ID with venues and sessions
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  
  const host = await queryOne(
    c.env,
    `SELECT h.*, ub.fullname as organizer_name 
     FROM hosts h
     LEFT JOIN user_bios ub ON h.user_id = ub.user_id
     WHERE h.id = $1 AND h.active = 1`,
    [id]
  );

  if (!host) {
    return c.json({ error: "Host not found" }, 404);
  }

  // Get venues for this host
  const venues = await query(
    c.env,
    `SELECT v.*, s.id as session_id, s.week_day, s.start_time, s.duration, 
            s.frequency, s.price_inperson, s.price_online, s.tags, s.active as session_active
     FROM venues v
     LEFT JOIN sessions s ON v.id = s.venue_id
     WHERE v.host_id = $1 AND v.active = 1
     ORDER BY v.area, s.week_day, s.start_time`,
    [id]
  );

  // Group sessions by venue
  const venueMap = new Map();
  for (const row of venues) {
    if (!venueMap.has(row.id)) {
      venueMap.set(row.id, {
        id: row.id,
        address: row.address,
        postcode: row.postcode,
        area: row.area,
        timezone: row.timezone,
        active: row.active,
        sessions: []
      });
    }
    
    if (row.session_id) {
      venueMap.get(row.id).sessions.push({
        id: row.session_id,
        week_day: row.week_day,
        start_time: row.start_time,
        duration: row.duration,
        frequency: row.frequency,
        price_inperson: row.price_inperson,
        price_online: row.price_online,
        tags: row.tags,
        active: row.session_active
      });
    }
  }

  return c.json({
    ...host,
    venues: Array.from(venueMap.values())
  });
});

// Admin: Create host
app.post("/", authMiddleware, async (c) => {
  const user = c.get("user") as { userId: number };
  const data = await c.req.json();

  const [host] = await query(
    c.env,
    `INSERT INTO hosts (
      user_id, name, description, instagram, website
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      user.userId,
      data.name,
      data.description || null,
      data.instagram || null,
      data.website || null
    ]
  );

  return c.json(host, 201);
});

// Admin: Update host
app.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();

  const [host] = await query(
    c.env,
    `UPDATE hosts SET 
      name = $1, description = $2, instagram = $3, website = $4, modified_on = NOW()
    WHERE id = $5
    RETURNING *`,
    [
      data.name,
      data.description,
      data.instagram,
      data.website,
      id
    ]
  );

  if (!host) {
    return c.json({ error: "Host not found" }, 404);
  }

  return c.json(host);
});

// Admin: Delete host (soft delete)
app.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  await query(c.env, "UPDATE hosts SET active = 0 WHERE id = $1", [id]);

  return c.json({ message: "Host deleted" });
});

export default app;
