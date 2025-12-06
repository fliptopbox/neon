import { sign, verify } from "@tsndr/cloudflare-worker-jwt";
import type { Context, Next } from "hono";
import type { Env } from "../db";

export interface JWTPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
}

export async function authMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const isValid = await verify(token, c.env.JWT_SECRET);
    if (!isValid) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const { payload } = await verify(token, c.env.JWT_SECRET, {
      throwError: true,
    });
    c.set("user", payload as JWTPayload);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
}

export async function adminMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const user = c.get("user") as JWTPayload;

  if (!user?.isAdmin) {
    return c.json({ error: "Forbidden: Admin access required" }, 403);
  }

  await next();
}

export async function generateToken(
  env: Env,
  payload: JWTPayload
): Promise<string> {
  return await sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}
