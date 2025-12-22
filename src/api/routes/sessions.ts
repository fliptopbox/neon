import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Env }>();

// Public: List all active sessions with venue and host info
app.get("/", async (c) => {
  const sessions = await query(
    c.env,
    `SELECT 
      s.*,
      v.id as venue_id,
      v.address,
      v.postcode,
      v.area,
      h.id as host_id,
      h.name as host_name,
      h.description as host_description
     FROM sessions s
     INNER JOIN venues v ON s.venue_id = v.id
     INNER JOIN hosts h ON v.host_id = h.id
     WHERE s.active = 1 AND v.active = 1 AND h.active = 1
     ORDER BY s.week_day, s.start_time`
  );
  
  return c.json(sessions.map(s => ({
    id: s.id,
    week_day: s.week_day,
    start_time: s.start_time,
    duration: s.duration,
    frequency: s.frequency,
    price_inperson: s.price_inperson,
    price_online: s.price_online,
    tags: s.tags,
    active: s.active,
    venue: {
      id: s.venue_id,
      address: s.address,
      postcode: s.postcode,
      area: s.area
    },
    host: {
      id: s.host_id,
      name: s.host_name,
      description: s.host_description
    }
  })));
});

// Public: Get session by ID
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const session = await queryOne(
    c.env,
    `SELECT 
      s.*,
      v.id as venue_id,
      v.address,
      v.postcode,
      v.area,
      h.id as host_id,
      h.name as host_name,
      h.description as host_description
     FROM sessions s
     INNER JOIN venues v ON s.venue_id = v.id
     INNER JOIN hosts h ON v.host_id = h.id
     WHERE s.id = $1 AND s.active = 1`,
    [id]
  );

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  return c.json({
    id: session.id,
    week_day: session.week_day,
    start_time: session.start_time,
    duration: session.duration,
    frequency: session.frequency,
    price_inperson: session.price_inperson,
    price_online: session.price_online,
    tags: session.tags,
    active: session.active,
    venue: {
      id: session.venue_id,
      address: session.address,
      postcode: session.postcode,
      area: session.area
    },
    host: {
      id: session.host_id,
      name: session.host_name,
      description: session.host_description
    }
  });
});

// Admin: Create session
app.post("/", authMiddleware, async (c) => {
  const data = await c.req.json();

  if (!data.venue_id) {
    return c.json({ error: "venue_id is required" }, 400);
  }

  const [session] = await query(
    c.env,
    `INSERT INTO sessions (
      venue_id, week_day, start_time, duration, frequency,
      price_inperson, price_online, tags
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      data.venue_id,
      data.week_day || null,
      data.start_time,
      data.duration,
      data.frequency || 'weekly',
      data.price_inperson || 0,
      data.price_online || 0,
      data.tags || null
    ]
  );

  return c.json(session, 201);
});

// Admin: Update session
app.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();

  const [session] = await query(
    c.env,
    `UPDATE sessions SET 
      week_day = $1, start_time = $2, duration = $3, frequency = $4,
      price_inperson = $5, price_online = $6, tags = $7, modified_on = NOW()
    WHERE id = $8
    RETURNING *`,
    [
      data.week_day,
      data.start_time,
      data.duration,
      data.frequency,
      data.price_inperson,
      data.price_online,
      data.tags,
      id
    ]
  );

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  return c.json(session);
});

// Admin: Delete session (soft delete)
app.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  await query(c.env, "UPDATE sessions SET active = 0 WHERE id = $1", [id]);

  return c.json({ message: "Session deleted" });
});

export default app;
