import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";

const app = new Hono<{ Bindings: Env }>();

// Public: List all events with venue and host details
app.get("/", async (c) => {
  const events = await query(
    c.env,
    `SELECT 
      e.id,
      e.name,
      e.description,
      e.frequency,
      e.week_day,
      e.pose_format,
      e.pricing_text,
      e.images,
      e.pricing_tags,
      
      -- Venue Details
      v.id as venue_id,
      v.name as venue_name,
      v.address_line_1,
      v.address_city,
      v.address_postcode,
      v.address_area,
      v.tz as venue_tz,
      v.latitude,
      v.longitude,

      -- Host Details (from hosts table and user_profiles)
      h.id as host_id,
      h.name as host_name,
      up.handle as host_handle,
      up.avatar_url as host_avatar_url,
      h.experience_years as host_experience, -- Example field if exists, checking schema
      
      -- Calc fields
      e.user_id

     FROM events e
     LEFT JOIN venues v ON e.venue_id = v.id
     INNER JOIN hosts h ON e.user_id = h.user_id
     INNER JOIN user_profiles up ON e.user_id = up.user_id
     ORDER BY e.week_day, e.name`
  );

  // Parse JSON fields that Postgres returns as strings/json
  const formatted = events.map(row => ({
    ...row,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
    pricing_tags: typeof row.pricing_tags === 'string' ? JSON.parse(row.pricing_tags) : row.pricing_tags,
    venue: row.venue_id ? {
        id: row.venue_id,
        name: row.venue_name,
        address: row.address_line_1,
        city: row.address_city,
        postcode: row.address_postcode,
        area: row.address_area,
        tz: row.venue_tz,
        geo: { lat: row.latitude, lng: row.longitude }
    } : null,
    host: {
        id: row.host_id,
        name: row.host_name,
        handle: row.host_handle,
        avatar: row.host_avatar_url
    }
  }));

  return c.json(formatted);
});

// Public: Get single event
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row = await queryOne(
    c.env,
    `SELECT 
      e.*,
      v.name as venue_name,
      v.address_line_1,
      v.address_postcode,
      v.address_area,
      v.tz as venue_tz,
      h.name as host_name,
      up.handle as host_handle,
      up.avatar_url
     FROM events e
     LEFT JOIN venues v ON e.venue_id = v.id
     INNER JOIN hosts h ON e.user_id = h.user_id
     INNER JOIN user_profiles up ON e.user_id = up.user_id
     WHERE e.id = $1`,
    [id]
  );

  if (!row) {
    return c.json({ error: "Event not found" }, 404);
  }

  return c.json({
      ...row,
      images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images, 
      pricing_table: typeof row.pricing_table === 'string' ? JSON.parse(row.pricing_table) : row.pricing_table,
      pricing_tags: typeof row.pricing_tags === 'string' ? JSON.parse(row.pricing_tags) : row.pricing_tags
  });
});

export default app;
