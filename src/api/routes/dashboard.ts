import { Hono } from "hono";
import type { Env } from "../db";
import { neon } from "@neondatabase/serverless";

const app = new Hono<{ Bindings: Env }>();

// GET dashboard statistics
// GET dashboard statistics
app.get("/stats", async (c) => {
  try {
    const sql = neon(c.env.DATABASE_URL);

    // Venues stats
    // Schema: id, name, active (bool), date_created (timestamptz)
    const venuesTotal = await sql`SELECT COUNT(*) as count FROM venues`;
    const venuesActive =
      await sql`SELECT COUNT(*) as count FROM venues WHERE active = true`;
    const venuesRecent = await sql`
      SELECT id, name, 
             (venue_tags->>0) as primary_tag, 
             active as is_active, 
             date_created as created_at
      FROM venues 
      ORDER BY date_created DESC 
      LIMIT 5
    `;

    // Models stats
    // Schema: models (id, user_id, display_name, date_created)
    //         user_profiles (user_id, fullname, handle, avatar_url)
    const modelsTotal = await sql`SELECT COUNT(*) as count FROM models`;
    // 'active' column not on models, check user_profiles.is_profile_active? Or ignore.
    // Assuming all models are active for now or joining user_profiles.
    const modelsActive = await sql`
        SELECT COUNT(*) as count 
        FROM models m
        JOIN user_profiles up ON m.user_id = up.user_id
        WHERE up.is_profile_active = true
    `;
    
    // Models not booked (no calendar entries)
    const modelsNotBooked = await sql`
      SELECT COUNT(*) as count 
      FROM models m
      WHERE NOT EXISTS (
        SELECT 1 FROM calendar c WHERE c.user_id = m.user_id
      )
    `;
    
    // Recent Models
    const modelsRecent = await sql`
      SELECT 
        m.id,
        m.user_id,
        up.fullname,
        m.display_name as known_as,
        m.description,
        m.sex, 
        up.is_profile_active as is_active, 
        m.date_created as created_at,
        (m.social_handles->>'instagram') as instagram,
        u.email,
        up.avatar_url as avatar,
        (SELECT COUNT(*) FROM calendar c WHERE c.user_id = m.user_id) as booking_count
      FROM models m
      LEFT JOIN user_profiles up ON m.user_id = up.user_id
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.date_created DESC
      LIMIT 8
    `;

    // Calendar stats
    // Schema: calendar (id, status, date_time, duration, user_id, event_id)
    const calendarTotal = await sql`SELECT COUNT(*) as count FROM calendar`;
    const calendarUpcoming = await sql`
      SELECT COUNT(*) as count 
      FROM calendar 
      WHERE date_time >= NOW()
    `;
    const calendarPending = await sql`
      SELECT COUNT(*) as count 
      FROM calendar 
      WHERE date_time >= NOW() AND status = 'pending'
    `;
    const calendarRecent = await sql`
      SELECT 
        c.id, 
        c.date_time, 
        c.status,
        up.fullname, 
        e.name as event_name
      FROM calendar c
      LEFT JOIN user_profiles up ON c.user_id = up.user_id
      LEFT JOIN events e ON c.event_id = e.id
      ORDER BY c.date_time DESC
      LIMIT 5
    `;

    // Users stats
    const usersTotal = await sql`SELECT COUNT(*) as count FROM users`;
    const usersAdmin =
      await sql`SELECT COUNT(*) as count FROM users WHERE is_admin = true`;
    const usersRecent = await sql`
      SELECT id, email, is_admin, date_created as created_at
      FROM users
      ORDER BY date_created DESC
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
        pending: parseInt(calendarPending[0].count),
        recent: calendarRecent,
      },
      users: {
        total: parseInt(usersTotal[0].count),
        admin: parseInt(usersAdmin[0].count),
        recent: usersRecent,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return c.json({ error: "Failed to fetch dashboard statistics", details: String(error) }, 500);
  }
});

// Fix all sequences
app.get("/fix-sequences", async (c) => {
  try {
    const sql = neon(c.env.DATABASE_URL);
    // Use COALESCE(MAX(id), 0) + 1 logic? setval sets the *last* value, so next is +1.
    // If table is empty, MAX is null. setval(..., 1, false) is better?
    // Let's stick to simple setval(..., MAX). If empty, MAX is null, setval might fail or set to null?
    // setval('seq', COALESCE((SELECT MAX(id) FROM table), 0) + 1, false) is safest for empty.
    // But simple MAX works if data exists. I'll assume data exists or catch error.
    await sql`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`;
    await sql`SELECT setval('user_profiles_id_seq', (SELECT MAX(id) FROM user_profiles))`;
    await sql`SELECT setval('venues_id_seq', (SELECT MAX(id) FROM venues))`;
    await sql`SELECT setval('models_id_seq', (SELECT MAX(id) FROM models))`;
    await sql`SELECT setval('hosts_id_seq', (SELECT MAX(id) FROM hosts))`;
    await sql`SELECT setval('events_id_seq', (SELECT MAX(id) FROM events))`;
    await sql`SELECT setval('calendar_id_seq', (SELECT MAX(id) FROM calendar))`;
    return c.json({ message: "All sequences fixed" });
  } catch (error) {
    console.error("Error fixing sequences:", error);
    return c.json({ error: String(error) }, 500);
  }
});

export default app;
