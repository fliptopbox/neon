import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { generateToken } from "../middleware/auth";
import type { User } from "../db/types";
import { hashPassword, verifyPassword } from "../utils/security";

const app = new Hono<{ Bindings: Env }>();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullname: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
app.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const data = registerSchema.parse(body);

    // Check if user exists
    const existing = await queryOne<User>(
      c.env,
      "SELECT id FROM users WHERE email = $1",
      [data.email]
    );

    if (existing) {
      return c.json({ error: "Email already registered" }, 400);
    }

    // Check if this is the first user (will be admin)
    const userCount = await queryOne<{ count: string }>(
      c.env,
      "SELECT COUNT(*) as count FROM users",
      []
    );
    const isFirstUser = parseInt(userCount?.count || "0") === 0;

    // Hash password
    const hashedPassword = await hashPassword(data);

    // Create user (first user becomes admin)
    const [user] = await query<User>(
      c.env,
      `INSERT INTO users (email, password_hash, is_global_active, is_admin, date_created) 
       VALUES ($1, $2, true, $3, NOW()) 
       RETURNING id, email, is_admin, date_created`,
      [data.email, hashedPassword, isFirstUser]
    );

    // Create user profile
    const handle = data.fullname.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await query(
      c.env,
      `INSERT INTO user_profiles (user_id, fullname, handle, date_created) VALUES ($1, $2, $3, NOW())`,
      [user.id, data.fullname, handle]
    );

    const token = await generateToken(c.env, {
      userId: user.id,
      email: user.email,
      isAdmin: isFirstUser,
    });

    return c.json({ 
      token, 
      user: { id: user.id, email: user.email, isAdmin: isFirstUser },
      message: isFirstUser ? "Admin account created" : "Account created"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    throw error;
  }
});

// Login
app.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const data = loginSchema.parse(body);

    const user = await queryOne<User>(
      c.env,
      "SELECT * FROM users WHERE email = $1 AND is_global_active = true",
      [data.email]
    );

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const valid = await verifyPassword(data, user.password_hash);
    if (!valid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Update last seen time
    await query(c.env, "UPDATE users SET date_last_seen = NOW() WHERE id = $1", [
      user.id,
    ]);

    const token = await generateToken(c.env, {
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin || false,
    });

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin || false,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    throw error;
  }
});

export default app;
