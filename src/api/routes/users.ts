import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import type { User, UserProfile } from "../db/types";
import { hashPassword } from "../utils/security";

const app = new Hono<{ Bindings: Env }>();

// Admin only: List all users with profile info
app.get("/", authMiddleware, adminMiddleware, async (c) => {
  const users = await query<User & UserProfile>(
    c.env,
    `SELECT u.id, u.email, u.is_global_active, u.date_created, u.date_last_seen, u.is_admin,
            up.fullname, up.handle, up.description, up.flag_emoji, up.is_profile_active,
            up.phone_number, up.currency_code, up.payment_methods
     FROM users u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     ORDER BY u.date_created DESC`
  );

  if (users.length > 0) {
      console.log('DEBUG: First raw user row:', JSON.stringify(users[0], null, 2));
  }

  const formatted = users.map((u) => ({
    id: u.id,
    email: u.email,
    is_global_active: u.is_global_active,
    date_created: u.date_created,
    date_last_seen: u.date_last_seen,
    is_admin: u.is_admin,
    profile: (u.fullname || u.handle || u.description)
      ? {
          fullname: u.fullname || '',
          handle: u.handle || '',
          description: u.description || '',
          flag_emoji: u.flag_emoji || '🏳️',
          is_profile_active: !!u.is_profile_active,
          phone_number: u.phone_number || '',
          currency_code: u.currency_code || 'GBP',
          payment_methods: typeof u.payment_methods === 'string' 
            ? JSON.parse(u.payment_methods) 
            : (u.payment_methods || null),
        }
      : null,
  }));

  return c.json(formatted);
});

// Get current user profile
app.get("/me", authMiddleware, async (c) => {
  const user = c.get("user") as { userId: number };

  const u = await queryOne<User & UserProfile & { model_id: number; host_id: number }>(
    c.env,
    `SELECT u.id, u.email, u.is_global_active, u.date_created, u.is_admin,
            up.fullname, up.handle, up.description, up.flag_emoji, up.is_profile_active,
            up.phone_number, up.currency_code, up.payment_methods,
            (SELECT id FROM models WHERE user_profile_id = up.id) as model_id,
            (SELECT id FROM hosts WHERE user_profile_id = up.id) as host_id
     FROM users u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE u.id = $1`,
    [user.userId]
  );

  if (!u) return c.json({ error: "User not found" }, 404);

  const formatted = {
    id: u.id,
    email: u.email,
    is_global_active: u.is_global_active,
    date_created: u.date_created,
    is_admin: u.is_admin,
    model_id: u.model_id,
    host_id: u.host_id,
    profile: (u.fullname || u.handle || u.description)
      ? {
          fullname: u.fullname || '',
          handle: u.handle || '',
          description: u.description || '',
          flag_emoji: u.flag_emoji || '🏳️',
          is_profile_active: !!u.is_profile_active,
          phone_number: u.phone_number || '',
          currency_code: u.currency_code || 'GBP',
          payment_methods: typeof u.payment_methods === 'string' 
            ? JSON.parse(u.payment_methods) 
            : (u.payment_methods || null),
        }
      : null,
  };

  return c.json(formatted);
});

// Update user profile (and password if provided)
app.put("/me/profile", authMiddleware, async (c) => {
  const user = c.get("user") as { userId: number; email: string };
  const data = await c.req.json();

  // 1. Update Password if provided
  if (data.password) {
      const passHash = await hashPassword({ email: user.email, password: data.password });
      await query(c.env, 'UPDATE users SET password_hash = $1 WHERE id = $2', [passHash, user.userId]);
  }

  // 2. Update Profile
  const [profile] = await query<UserProfile>(
    c.env,
    `UPDATE user_profiles SET 
      fullname = $1, handle = $2, description = $3, flag_emoji = $4
    WHERE user_id = $5
    RETURNING *`,
    [
      data.fullname,
      data.handle,
      data.description,
      data.flag_emoji || "🏳️",
      user.userId,
    ]
  );

  return c.json(profile);
});

// Admin: Full Update User (User + Profile)
app.put("/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();

    console.log('Update User Data:', JSON.stringify(data, null, 2));

    // Support both nested profile object (from our UI) and flat (if any legacy)
    const profileData = data.profile || data;

    // 1. Update User Table
    await query(
      c.env,
      `UPDATE users SET 
         email = $1, is_global_active = $2, is_admin = $3
       WHERE id = $4`,
      [data.email || data.emailaddress || (await queryOne<{email:string}>(c.env, 'SELECT email FROM users WHERE id=$1', [id]))?.email, 
       data.is_global_active ?? data.active ?? true, 
       data.is_admin || false, 
       id]
    );

    // 2. Update password if provided
    if (data.password && data.password.length >= 8) {
      // Need email for salt
      const userRecord = await queryOne<{email:string}>(c.env, 'SELECT email FROM users WHERE id = $1', [id]);
      if (userRecord) {
          const hashedPassword = await hashPassword({ email: userRecord.email, password: data.password });
          await query(c.env, `UPDATE users SET password_hash = $1 WHERE id = $2`, [hashedPassword, id]);
      }
    }

    // 3. Update or Insert User Profile
    const existingProfile = await queryOne(c.env, "SELECT id FROM user_profiles WHERE user_id = $1", [id]);

    const params = [
            profileData.fullname || "User",
            profileData.handle,
            profileData.description || "",
            profileData.flag_emoji || "🏳️",
            profileData.phone_number || "",
            profileData.currency_code || "GBP",
            JSON.stringify(profileData.payment_methods || {}),
            id,
    ];

    if (existingProfile) {
        await query(
          c.env,
          `UPDATE user_profiles SET 
            fullname = $1, handle = $2, description = $3, flag_emoji = $4,
            phone_number = $5, currency_code = $6, payment_methods = $7
          WHERE user_id = $8`,
          params
        );
    } else {
        await query(
          c.env,
          `INSERT INTO user_profiles (fullname, handle, description, flag_emoji, phone_number, currency_code, payment_methods, user_id, date_created, is_profile_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), true)`,
          params
        );
    }

    return c.json({ message: "User updated successfully" });
  } catch (err: any) {
    console.error('Update User Error:', err);
    return c.json({ error: err.message, stack: err.stack }, 500);
  }
});

// Admin: Toggle user active status
app.patch("/:id/toggle", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  await query(c.env, "UPDATE users SET is_global_active = NOT is_global_active WHERE id = $1", [
    id,
  ]);

  return c.json({ message: "User status toggled" });
});

// Admin: Toggle user admin status
app.patch("/:id/toggle-admin", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  await query(
    c.env,
    "UPDATE users SET is_admin = NOT COALESCE(is_admin, false) WHERE id = $1",
    [id]
  );

  return c.json({ message: "Admin status toggled" });
});

// Admin: Delete user (hard delete)
app.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  // First delete user_profile
  await query(c.env, "DELETE FROM user_profiles WHERE user_id = $1", [id]);

  // Then delete user
  await query(c.env, "DELETE FROM users WHERE id = $1", [id]);

  return c.json({ message: "User deleted" });
});

export default app;
