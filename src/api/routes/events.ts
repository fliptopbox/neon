import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Env; Variables: { user: any } }>();

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
      e.user_id,
      
      -- Venue Details
      v.id as venue_id,
      v.name as venue_name,
      v.address_line_1,
      v.address_city,
      v.address_postcode,
      v.address_area,
      v.tz as venue_tz,
      
      -- Host Details
      h.id as host_id,
      h.name as host_name,
      up.handle as host_handle,
      up.avatar_url as host_avatar_url

     FROM events e
     LEFT JOIN venues v ON e.venue_id = v.id
     INNER JOIN hosts h ON e.user_id = h.user_id
     INNER JOIN user_profiles up ON e.user_id = up.user_id
     ORDER BY e.week_day, e.name`
  );

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
        tz: row.venue_tz
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

// Create Event
app.post("/", authMiddleware, async (c) => {
    const user = c.get("user");
    let data;
    try {
        data = await c.req.json();
    } catch(e) {
        return c.json({ error: "Invalid JSON" }, 400);
    }

    // Determine target user_id (host)
    let targetUserId = user.userId;
    if (user.isAdmin && data.user_id) {
        targetUserId = data.user_id;
    }

    // Basic validation
    if (!data.name) return c.json({ error: "Name is required" }, 400);

    try {
        const [event] = await query(
            c.env,
            `INSERT INTO events (
                user_id, venue_id, name, description,
                frequency, week_day, pose_format,
                pricing_text, pricing_tags, images
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                targetUserId,
                data.venue_id || null,
                data.name,
                data.description || '',
                data.frequency || 'weekly',
                data.week_day || 'unknown',
                data.pose_format || 'Mixed poses',
                data.pricing_text || '',
                JSON.stringify(data.pricing_tags || []),
                JSON.stringify(data.images || [])
            ]
        );
        return c.json(event, 201);
    } catch (err: any) {
        console.error("Event Create Error", err);
        return c.json({ error: err.message }, 500);
    }
});

// Update Event
app.put("/:id", authMiddleware, async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");
    const data = await c.req.json();

    const existing = await queryOne<{user_id: number}>(c.env, "SELECT user_id FROM events WHERE id = $1", [id]);
    if (!existing) return c.json({ error: "Event not found" }, 404);

    if (!user.isAdmin && existing.user_id !== user.userId) {
        return c.json({ error: "Unauthorized" }, 403);
    }

    const [event] = await query(
        c.env,
        `UPDATE events SET
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            venue_id = COALESCE($3, venue_id),
            frequency = COALESCE($4, frequency),
            week_day = COALESCE($5, week_day),
            pose_format = COALESCE($6, pose_format),
            pricing_text = COALESCE($7, pricing_text),
            pricing_tags = COALESCE($8, pricing_tags),
            images = COALESCE($9, images)
        WHERE id = $10
        RETURNING *`,
        [
            data.name,
            data.description,
            data.venue_id,
            data.frequency,
            data.week_day,
            data.pose_format,
            data.pricing_text,
            data.pricing_tags ? JSON.stringify(data.pricing_tags) : null,
            data.images ? JSON.stringify(data.images) : null,
            id
        ]
    );

    return c.json(event);
});

// Delete Event
app.delete("/:id", authMiddleware, async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");

    const existing = await queryOne<{user_id: number}>(c.env, "SELECT user_id FROM events WHERE id = $1", [id]);
    if (!existing) return c.json({ error: "Event not found" }, 404);

    if (!user.isAdmin && existing.user_id !== user.userId) {
         return c.json({ error: "Unauthorized" }, 403);
    }

    await query(c.env, "DELETE FROM events WHERE id = $1", [id]);
    return c.json({ message: "Event deleted" });
});

export default app;
