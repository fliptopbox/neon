import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import type { User, UserBio } from "../db/types";

const app = new Hono<{ Bindings: Env }>();

// Admin only: List all users - Updated to include full bio info
app.get("/", authMiddleware, adminMiddleware, async (c) => {
  const users = await query<User & UserBio>(
    c.env,
    `SELECT u.id, u.emailaddress, u.active, u.created_on, u.login_on, u.is_admin,
            ub.fullname, ub.known_as, ub.description, ub.instagram, ub.websites
     FROM users u
     LEFT JOIN user_bios ub ON u.id = ub.user_id
     ORDER BY u.created_on DESC`
  );
  return c.json(users);
});

// Get current user profile
app.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");

  const profile = await queryOne(
    c.env,
    `SELECT u.id, u.emailaddress, u.active, u.created_on,
            ub.fullname, ub.known_as, ub.description, ub.instagram, ub.websites
     FROM users u
     LEFT JOIN user_bios ub ON u.id = ub.user_id
     WHERE u.id = $1`,
    [user.userId]
  );

  return c.json(profile);
});

// Update user bio
app.put("/me/bio", authMiddleware, async (c) => {
  const user = c.get("user");
  const data = await c.req.json();

  const [bio] = await query<UserBio>(
    c.env,
    `UPDATE user_bios SET 
      fullname = $1, known_as = $2, description = $3,
      instagram = $4, websites = $5, modified_on = NOW()
    WHERE user_id = $6
    RETURNING *`,
    [
      data.fullname,
      data.known_as,
      data.description,
      data.instagram,
      JSON.stringify(data.websites || []),
      user.userId,
    ]
  );

  return c.json(bio);
});

// Admin: Full Update User (User + Bio)
app.put("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();

  // 1. Update User Table
  await query(
    c.env,
    `UPDATE users SET 
       emailaddress = $1, active = $2, is_admin = $3
     WHERE id = $4`,
    [data.emailaddress, data.active, data.is_admin ? 1 : 0, id]
  );

  // 2. Update or Insert User Bio
  // Check if bio exists
  const existingBio = await queryOne(c.env, "SELECT id FROM user_bios WHERE user_id = $1", [id]);
  
  if (existingBio) {
      await query(
        c.env,
        `UPDATE user_bios SET 
          fullname = $1, known_as = $2, description = $3,
          instagram = $4, websites = $5, modified_on = NOW()
        WHERE user_id = $6`,
        [
          data.fullname,
          data.known_as,
          data.description,
          data.instagram,
          JSON.stringify(data.websites || []),
          id,
        ]
      );
  } else {
      await query(
        c.env,
        `INSERT INTO user_bios (user_id, fullname, known_as, description, instagram, websites, created_on, modified_on)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          id,
          data.fullname,
          data.known_as,
          data.description,
          data.instagram,
          JSON.stringify(data.websites || [])
        ]
      );
  }

  return c.json({ message: "User updated successfully" });
});

// Admin: Toggle user active status
app.patch("/:id/toggle", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");

  await query(c.env, "UPDATE users SET active = 1 - active WHERE id = $1", [
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

  // First delete user_bio
  await query(c.env, "DELETE FROM user_bios WHERE user_id = $1", [id]);

  // Then delete user
  await query(c.env, "DELETE FROM users WHERE id = $1", [id]);

  return c.json({ message: "User deleted" });
});

export default app;
