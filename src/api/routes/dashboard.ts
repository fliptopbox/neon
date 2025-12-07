import { Hono } from "hono";
import type { Env } from "../db";
import { neon } from "@neondatabase/serverless";

const app = new Hono<{ Bindings: Env }>();

// GET dashboard statistics
app.get("/stats", async (c) => {
  try {
    const sql = neon(c.env.DATABASE_URL);

    // Venues stats
    const venuesTotal = await sql`SELECT COUNT(*) as count FROM venues`;
    const venuesActive =
      await sql`SELECT COUNT(*) as count FROM venues WHERE active = 1`;
    const venuesRecent = await sql`
      SELECT id, name, week_day as day, start_time as time, active as is_active, created_on as created_at
      FROM venues 
      ORDER BY created_on DESC 
      LIMIT 5
    `;

    // Models stats
    const modelsTotal = await sql`SELECT COUNT(*) as count FROM models`;
    const modelsActive =
      await sql`SELECT COUNT(*) as count FROM models WHERE active = 1`;
    const modelsNotBooked = await sql`
      SELECT COUNT(*) as count 
      FROM models m
      WHERE NOT EXISTS (
        SELECT 1 FROM calendar c WHERE c.user_id = m.user_id
      )
    `;
    const modelsRecent = await sql`
      SELECT 
        m.id,
        m.user_id,
        ub.fullname,
        ub.fullname as firstname,
        ub.known_as,
        ub.description,
        m.sex, 
        m.active as is_active, 
        m.created_on as created_at,
        ub.instagram,
        u.emailaddress,
        m.portrait as avatar,
        (SELECT COUNT(*) FROM calendar c WHERE c.user_id = m.user_id) as booking_count
      FROM models m
      LEFT JOIN user_bios ub ON m.user_id = ub.user_id
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.created_on DESC
      LIMIT 8
    `;

    // Calendar stats
    const calendarTotal = await sql`SELECT COUNT(*) as count FROM calendar`;
    const calendarUpcoming = await sql`
      SELECT COUNT(*) as count 
      FROM calendar 
      WHERE date >= CURRENT_DATE
    `;
    const calendarTbc = await sql`
      SELECT COUNT(*) as count 
      FROM calendar 
      WHERE date >= CURRENT_DATE AND tbc = 1
    `;
    const calendarRecent = await sql`
      SELECT c.id, c.date, c.start, c.tbc, ub.fullname, v.name as venue_name
      FROM calendar c
      LEFT JOIN user_bios ub ON c.user_id = ub.user_id
      LEFT JOIN venues v ON c.venue_id = v.id
      ORDER BY c.date DESC
      LIMIT 5
    `;

    // Artists stats
    const artistsTotal = await sql`SELECT COUNT(*) as count FROM artists`;
    const artistsRecent = await sql`
      SELECT a.id, ub.fullname, a.created_on as created_at
      FROM artists a
      LEFT JOIN user_bios ub ON a.user_id = ub.user_id
      ORDER BY a.created_on DESC
      LIMIT 5
    `;

    // Users stats
    const usersTotal = await sql`SELECT COUNT(*) as count FROM users`;
    const usersAdmin =
      await sql`SELECT COUNT(*) as count FROM users WHERE is_admin = true`;
    const usersRecent = await sql`
      SELECT id, emailaddress as email, is_admin, created_on as created_at
      FROM users
      ORDER BY created_on DESC
      LIMIT 5
    `;

    // Venue Tags stats
    const tagsTotal = await sql`SELECT COUNT(*) as count FROM venue_tags`;
    const tagsRecent = await sql`
      SELECT id, description
      FROM venue_tags
      ORDER BY id ASC
      LIMIT 5
    `;

    return c.json({
      venues: {
        total: parseInt(venuesTotal[0].count),
        active: parseInt(venuesActive[0].count),
        recent: venuesRecent,
      },
      models: {
        total: parseInt(modelsTotal[0].count),
        active: parseInt(modelsActive[0].count),
        notBooked: parseInt(modelsNotBooked[0].count),
        recent: modelsRecent,
      },
      calendar: {
        total: parseInt(calendarTotal[0].count),
        upcoming: parseInt(calendarUpcoming[0].count),
        tbc: parseInt(calendarTbc[0].count),
        recent: calendarRecent,
      },
      artists: {
        total: parseInt(artistsTotal[0].count),
        recent: artistsRecent,
      },
      users: {
        total: parseInt(usersTotal[0].count),
        admin: parseInt(usersAdmin[0].count),
        recent: usersRecent,
      },
      venueTags: {
        total: parseInt(tagsTotal[0].count),
        recent: tagsRecent,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return c.json({ error: "Failed to fetch dashboard statistics" }, 500);
  }
});

export default app;
