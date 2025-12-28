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
            up.fullname, up.handle, up.description, up.flag_emoji, up.is_profile_active
     FROM users u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     ORDER BY u.date_created DESC`
  );
  return c.json(users);
});

// Get current user profile
app.get("/me", authMiddleware, async (c) => {
  const user = c.get("user") as { userId: number };

  const profile = await queryOne(
    c.env,
    `SELECT u.id, u.email, u.is_global_active, u.date_created,
            up.fullname, up.handle, up.description, up.flag_emoji, up.is_profile_active,
            (SELECT id FROM models WHERE user_profile_id = up.id) as model_id,
            (SELECT id FROM hosts WHERE user_profile_id = up.id) as host_id
     FROM users u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE u.id = $1`,
    [user.userId]
  );

  return c.json(profile);
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

    // 1. Update User Table
    await query(
      c.env,
      `UPDATE users SET 
         email = $1, is_global_active = $2, is_admin = $3
       WHERE id = $4`,
      [data.email || data.emailaddress, data.is_global_active ?? data.active ?? true, data.is_admin || false, id]
    );

    // 2. Update password if provided
    if (data.password && data.password.length >= 8) {
      const email = data.email || data.emailaddress;
      if (!email) {
         throw new Error("Email required for password update");
      }
      
      // Use imported hashPassword
      const hashedPassword = await hashPassword({ email, password: data.password });
      
      await query(
        c.env,
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        [hashedPassword, id]
      );
    }

    // 3. Update or Insert User Profile
    const existingProfile = await queryOne(c.env, "SELECT id FROM user_profiles WHERE user_id = $1", [id]);
    
    if (existingProfile) {
        await query(
          c.env,
          `UPDATE user_profiles SET 
            fullname = $1, handle = $2, description = $3, flag_emoji = $4
          WHERE user_id = $5`,
          [
            data.fullname,
            data.handle,
            data.description,
            data.flag_emoji || "🏳️",
            id,
          ]
        );
    } else {
        await query(
          c.env,
          `INSERT INTO user_profiles (user_id, fullname, handle, description, flag_emoji, date_created, is_profile_active)
           VALUES ($1, $2, $3, $4, $5, NOW(), true)`,
          [
            id,
            data.fullname || "User",
            data.handle || `user-${id}`,
            data.description || "",
            data.flag_emoji || "🏳️"
          ]
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
