import { Hono } from "hono";
import type { Env } from "../db";
import { neon } from "@neondatabase/serverless";

const app = new Hono<{ Bindings: Env }>();

// GET all calendar sessions
app.get("/", async (c) => {
  try {
    const sql = neon(c.env.DATABASE_URL);
    // Join with events to get event name, and users/profiles to get model name and host name
    const sessions = await sql`
      SELECT 
        c.id,
        c.event_id,
        c.user_id,
        c.status,
        c.attendance_inperson,
        c.attendance_online,
        c.date_time,
        c.duration,
        c.pose_format,
        e.name as event_name,
        up_model.fullname as model_name,
        u_model.email as model_email,
        e.user_id as host_user_id,
        up_host.fullname as host_name
      FROM calendar c
      LEFT JOIN events e ON c.event_id = e.id
      LEFT JOIN users u_model ON c.user_id = u_model.id
      LEFT JOIN user_profiles up_model ON u_model.id = up_model.user_id
      LEFT JOIN users u_host ON e.user_id = u_host.id
      LEFT JOIN user_profiles up_host ON u_host.id = up_host.user_id
      ORDER BY c.date_time DESC
    `;
    return c.json(sessions);
  } catch (error) {
    console.error("Error fetching calendar sessions:", error);
    return c.json({ error: "Failed to fetch calendar sessions" }, 500);
  }
});



// GET single calendar session
app.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const sql = neon(c.env.DATABASE_URL);

    const sessions = await sql`
      SELECT 
        c.id,
        c.event_id,
        c.user_id,
        c.status,
        c.attendance_inperson,
        c.attendance_online,
        c.date_time,
        c.duration,
        c.pose_format,
        e.name as event_name,
        up.fullname as model_name
      FROM calendar c
      LEFT JOIN events e ON c.event_id = e.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.id = ${id}
    `;

    if (sessions.length === 0) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json(sessions[0]);
  } catch (error) {
    console.error("Error fetching calendar session:", error);
    return c.json({ error: "Failed to fetch calendar session" }, 500);
  }
});

// POST create new calendar session
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const {
      event_id,
      user_id,
      status,
      attendance_inperson,
      attendance_online,
      date_time,
      duration,
      pose_format
    } = body;

    // Minimal validation
    if (!date_time || !duration) {
      return c.json({ error: "Missing required fields (date_time, duration)" }, 400);
    }

    const sql = neon(c.env.DATABASE_URL);

    const result = await sql`
      INSERT INTO calendar (
        event_id, 
        user_id, 
        status, 
        attendance_inperson, 
        attendance_online, 
        date_time, 
        duration, 
        pose_format
      )
      VALUES (
        ${event_id || null}, 
        ${user_id || null}, 
        ${status || 'pending'}, 
        ${attendance_inperson || 0}, 
        ${attendance_online || 0}, 
        ${date_time}, 
        ${duration}, 
        ${pose_format || ''}
      )
      RETURNING id
    `;

    return c.json(
      { message: "Session created successfully", id: result[0].id },
      201
    );
  } catch (error: any) {
    console.error("Error creating calendar session:", error);
    return c.json({ error: "Failed to create calendar session" }, 500);
  }
});

// PUT update calendar session
app.put("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const {
      event_id,
      user_id,
      status,
      attendance_inperson,
      attendance_online,
      date_time,
      duration,
      pose_format
    } = body;

    const sql = neon(c.env.DATABASE_URL);

    const result = await sql`
      UPDATE calendar 
      SET 
        event_id = ${event_id || null},
        user_id = ${user_id || null},
        status = ${status},
        attendance_inperson = ${attendance_inperson},
        attendance_online = ${attendance_online},
        date_time = ${date_time},
        duration = ${duration},
        pose_format = ${pose_format}
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json({ message: "Session updated successfully" });
  } catch (error: any) {
    console.error("Error updating calendar session:", error);
    return c.json({ error: "Failed to update calendar session" }, 500);
  }
});

// DELETE calendar session
app.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const sql = neon(c.env.DATABASE_URL);

    const result = await sql`
      DELETE FROM calendar 
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting calendar session:", error);
    return c.json({ error: "Failed to delete calendar session" }, 500);
  }
});

export default app;
