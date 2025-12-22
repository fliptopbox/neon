import { Hono } from "hono";
import type { Env } from "../db";
import { neon } from "@neondatabase/serverless";

const app = new Hono<{ Bindings: Env }>();

// GET all calendar events
app.get("/", async (c) => {
  try {
    const sql = neon(c.env.DATABASE_URL);
    const events = await sql`
      SELECT 
        c.id,
        c.user_id,
        c.venue_id,
        c.date,
        c.attendance_inperson,
        c.attendance_online,
        c.start,
        c.duration,
        c.notes,
        c.tbc,
        ub.fullname,
        h.name as venue_name,
        v.area as venue_area
      FROM calendar c
      LEFT JOIN user_bios ub ON c.user_id = ub.user_id
      LEFT JOIN venues v ON c.venue_id = v.id
      LEFT JOIN hosts h ON v.host_id = h.id
      ORDER BY c.date DESC
    `;
    return c.json(events);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return c.json({ error: "Failed to fetch calendar events" }, 500);
  }
});

// GET single calendar event
app.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const sql = neon(c.env.DATABASE_URL);

    const events = await sql`
      SELECT 
        c.id,
        c.user_id,
        c.venue_id,
        c.date,
        c.attendance_inperson,
        c.attendance_online,
        c.start,
        c.duration,
        c.notes,
        c.tbc,
        ub.fullname,
        h.name as venue_name,
        v.area as venue_area
      FROM calendar c
      LEFT JOIN user_bios ub ON c.user_id = ub.user_id
      LEFT JOIN venues v ON c.venue_id = v.id
      LEFT JOIN hosts h ON v.host_id = h.id
      WHERE c.id = ${id}
    `;

    if (events.length === 0) {
      return c.json({ error: "Event not found" }, 404);
    }

    return c.json(events[0]);
  } catch (error) {
    console.error("Error fetching calendar event:", error);
    return c.json({ error: "Failed to fetch calendar event" }, 500);
  }
});

// POST create new calendar event
app.post("/", async (c) => {
  try {
    const {
      user_id,
      venue_id,
      date,
      attendance_inperson,
      attendance_online,
      start,
      duration,
      notes,
      tbc,
    } = await c.req.json();

    if (
      !user_id ||
      !venue_id ||
      !date ||
      attendance_inperson === undefined ||
      attendance_online === undefined ||
      !start ||
      !duration
    ) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const sql = neon(c.env.DATABASE_URL);

    const result = await sql`
      INSERT INTO calendar (user_id, venue_id, date, attendance_inperson, attendance_online, start, duration, notes, tbc)
      VALUES (${user_id}, ${venue_id}, ${date}, ${attendance_inperson}, ${attendance_online}, ${start}, ${duration}, ${
      notes || null
    }, ${tbc || 0})
      RETURNING id
    `;

    return c.json(
      { message: "Event created successfully", id: result[0].id },
      201
    );
  } catch (error: any) {
    console.error("Error creating calendar event:", error);
    if (error.message?.includes("foreign key")) {
      return c.json({ error: "Invalid user_id or venue_id" }, 400);
    }
    return c.json({ error: "Failed to create calendar event" }, 500);
  }
});

// PUT update calendar event
app.put("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const {
      user_id,
      venue_id,
      date,
      attendance_inperson,
      attendance_online,
      start,
      duration,
      notes,
      tbc,
    } = await c.req.json();

    if (
      !user_id ||
      !venue_id ||
      !date ||
      attendance_inperson === undefined ||
      attendance_online === undefined ||
      !start ||
      !duration
    ) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const sql = neon(c.env.DATABASE_URL);

    const result = await sql`
      UPDATE calendar 
      SET 
        user_id = ${user_id},
        venue_id = ${venue_id},
        date = ${date},
        attendance_inperson = ${attendance_inperson},
        attendance_online = ${attendance_online},
        start = ${start},
        duration = ${duration},
        notes = ${notes || null},
        tbc = ${tbc !== undefined ? tbc : 0}
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return c.json({ error: "Event not found" }, 404);
    }

    return c.json({ message: "Event updated successfully" });
  } catch (error: any) {
    console.error("Error updating calendar event:", error);
    if (error.message?.includes("foreign key")) {
      return c.json({ error: "Invalid user_id or venue_id" }, 400);
    }
    return c.json({ error: "Failed to update calendar event" }, 500);
  }
});

// DELETE calendar event
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
      return c.json({ error: "Event not found" }, 404);
    }

    return c.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return c.json({ error: "Failed to delete calendar event" }, 500);
  }
});

export default app;
