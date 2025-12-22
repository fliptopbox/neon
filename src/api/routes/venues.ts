import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Env }>();

// Public: List all active venues with host and session info
app.get("/", async (c) => {
  const venues = await query(
    c.env,
    `SELECT 
      v.id as venue_id,
      v.address,
      v.postcode,
      v.area,
      v.timezone,
      v.active as venue_active,
      h.id as host_id,
      h.name as host_name,
      h.description as host_description,
      h.instagram as host_instagram,
      h.website as host_website,
      h.active as host_active,
      s.id as session_id,
      s.week_day,
      s.start_time,
      s.duration,
      s.frequency,
      s.price_inperson,
      s.price_online,
      s.tags,
      s.active as session_active
     FROM venues v
     INNER JOIN hosts h ON v.host_id = h.id
     LEFT JOIN sessions s ON v.id = s.venue_id
     WHERE v.active = 1 AND h.active = 1
     ORDER BY h.name, v.area, s.week_day, s.start_time`
  );

  // Group by venue and nest sessions
  const venueMap = new Map();
  for (const row of venues) {
    if (!venueMap.has(row.venue_id)) {
      venueMap.set(row.venue_id, {
        id: row.venue_id,
        address: row.address,
        postcode: row.postcode,
        area: row.area,
        timezone: row.timezone,
        active: row.venue_active,
        host: {
          id: row.host_id,
          name: row.host_name,
          description: row.host_description,
          instagram: row.host_instagram,
          website: row.host_website,
          active: row.host_active
        },
        sessions: []
      });
    }
    
    if (row.session_id) {
      venueMap.get(row.venue_id).sessions.push({
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

  return c.json(Array.from(venueMap.values()));
});

// Public: Get venue by ID with host and sessions
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await query(
    c.env,
    `SELECT 
      v.id as venue_id,
      v.address,
      v.postcode,
      v.area,
      v.timezone,
      v.active as venue_active,
      h.id as host_id,
      h.name as host_name,
      h.description as host_description,
      h.instagram as host_instagram,
      h.website as host_website,
      h.active as host_active,
      s.id as session_id,
      s.week_day,
      s.start_time,
      s.duration,
      s.frequency,
      s.price_inperson,
      s.price_online,
      s.tags,
      s.active as session_active
     FROM venues v
     INNER JOIN hosts h ON v.host_id = h.id
     LEFT JOIN sessions s ON v.id = s.venue_id
     WHERE v.id = $1 AND v.active = 1
     ORDER BY s.week_day, s.start_time`,
    [id]
  );

  if (rows.length === 0) {
    return c.json({ error: "Venue not found" }, 404);
  }

  const venue = {
    id: rows[0].venue_id,
    address: rows[0].address,
    postcode: rows[0].postcode,
    area: rows[0].area,
    timezone: rows[0].timezone,
    active: rows[0].venue_active,
    host: {
      id: rows[0].host_id,
      name: rows[0].host_name,
      description: rows[0].host_description,
      instagram: rows[0].host_instagram,
      website: rows[0].host_website,
      active: rows[0].host_active
    },
    sessions: rows.filter(r => r.session_id).map(r => ({
      id: r.session_id,
      week_day: r.week_day,
      start_time: r.start_time,
      duration: r.duration,
      frequency: r.frequency,
      price_inperson: r.price_inperson,
      price_online: r.price_online,
      tags: r.tags,
      active: r.session_active
    }))
  };

  return c.json(venue);
});

// Admin: Create venue (simplified - creates venue only, sessions handled separately)
app.post("/", authMiddleware, async (c) => {
  const data = await c.req.json();

  // Validate required fields
  if (!data.host_id) {
    return c.json({ error: "host_id is required" }, 400);
  }

  const [venue] = await query(
    c.env,
    `INSERT INTO venues (
      host_id, address, postcode, area, timezone
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      data.host_id,
      data.address || null,
      data.postcode || null,
      data.area || null,
      data.timezone || 'GMT'
    ]
  );

  return c.json(venue, 201);
});

// Admin: Update venue
app.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();

  const [venue] = await query(
    c.env,
    `UPDATE venues SET 
      address = $1, postcode = $2, area = $3, timezone = $4, modified_on = NOW()
    WHERE id = $5
    RETURNING *`,
    [
      data.address,
      data.postcode,
      data.area,
      data.timezone,
      id
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
