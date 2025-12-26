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
      "SELECT id FROM users WHERE emailaddress = $1",
      [data.email]
    );

    if (existing) {
      return c.json({ error: "Email already registered" }, 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(data);

    // Create user
    const [user] = await query<User>(
      c.env,
      `INSERT INTO users (emailaddress, password, active) 
       VALUES ($1, $2, 1) 
       RETURNING id, emailaddress, created_on`,
      [data.email, hashedPassword]
    );

    // Create user bio
    await query(
      c.env,
      `INSERT INTO user_bios (user_id, fullname) VALUES ($1, $2)`,
      [user.id, data.fullname]
    );

    const token = await generateToken(c.env, {
      userId: user.id,
      email: user.emailaddress,
      isAdmin: false,
    });

    return c.json({ token, user: { id: user.id, email: user.emailaddress } });
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
      "SELECT * FROM users WHERE emailaddress = $1 AND active = 1",
      [data.email]
    );

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const valid = await verifyPassword(data, user.password);
    if (!valid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Update login time
    await query(c.env, "UPDATE users SET login_on = NOW() WHERE id = $1", [
      user.id,
    ]);

    const token = await generateToken(c.env, {
      userId: user.id,
      email: user.emailaddress,
      isAdmin: user.is_admin || false,
    });

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.emailaddress,
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
