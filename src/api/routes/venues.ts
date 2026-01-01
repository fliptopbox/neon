import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Env }>();

// Public: List all active venues
app.get("/", async (c) => {
  const venues = await query(
    c.env,
    `SELECT 
      v.id,
      v.name,
      v.address_line_1,
      v.address_city,
      v.address_postcode,
      v.address_area,
      v.tz,
      v.active,
      v.latitude,
      v.longitude,
      v.venue_tags, 
      (SELECT COUNT(*) FROM events e WHERE e.venue_id = v.id) as event_count
     FROM venues v
     WHERE v.active = true
     ORDER BY v.name`
  );

  return c.json(venues.map(v => ({
      ...v,
      venue_tags: typeof v.venue_tags === 'string' ? JSON.parse(v.venue_tags) : v.venue_tags
  })));
});

// Public: Get venue by ID
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row = await queryOne(
    c.env,
    `SELECT * FROM venues WHERE id = $1 AND active = true`,
    [id]
  );

  if (!row) {
    return c.json({ error: "Venue not found" }, 404);
  }

  return c.json({
      ...row,
      venue_tags: typeof row.venue_tags === 'string' ? JSON.parse(row.venue_tags) : row.venue_tags
  });
});

// Admin: Create venue
app.post("/", authMiddleware, async (c) => {
  const data = await c.req.json();

  if (!data.name) {
    return c.json({ error: "Name is required" }, 400);
  }

  const [venue] = await query(
    c.env,
    `INSERT INTO venues (
      name, address_line_1, address_city, address_postcode, address_area, tz, venue_tags
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      data.name,
      data.address_line_1 || '',
      data.address_city || 'London',
      data.address_postcode || 'UNKNOWN',
      data.address_area || '',
      data.tz || 'Europe/London',
      JSON.stringify(data.venue_tags || [])
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
      name = COALESCE($1, name),
      address_line_1 = COALESCE($2, address_line_1),
      address_postcode = COALESCE($3, address_postcode),
      address_area = COALESCE($4, address_area),
      tz = COALESCE($5, tz),
      venue_tags = COALESCE($6, venue_tags),
      date_modified = NOW()
    WHERE id = $7
    RETURNING *`,
    [
      data.name,
      data.address_line_1,
      data.address_postcode,
      data.address_area,
      data.tz,
      data.venue_tags ? JSON.stringify(data.venue_tags) : null,
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
  await query(c.env, "UPDATE venues SET active = false WHERE id = $1", [id]);
  return c.json({ message: "Venue deleted" });
});

export default app;
