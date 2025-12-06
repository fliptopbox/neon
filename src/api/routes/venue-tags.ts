import { Hono } from "hono";
import type { Env } from "../db";
import { query } from "../db";
import { neon } from "@neondatabase/serverless";

const app = new Hono<{ Bindings: Env }>();

// GET all venue tags
app.get("/", async (c) => {
  try {
    const sql = neon(c.env.DATABASE_URL);
    const tags = await sql`
      SELECT id, description 
      FROM venue_tags 
      ORDER BY id ASC
    `;
    return c.json(tags);
  } catch (error) {
    console.error("Error fetching venue tags:", error);
    return c.json({ error: "Failed to fetch venue tags" }, 500);
  }
});

// POST create new venue tag
app.post("/", async (c) => {
  try {
    const { id, description } = await c.req.json();

    if (!id || !description) {
      return c.json({ error: "Tag ID and description are required" }, 400);
    }

    // Validate id format (lowercase, no spaces)
    if (!/^[a-z]+$/.test(id)) {
      return c.json({ error: "Tag ID must be lowercase letters only" }, 400);
    }

    const sql = neon(c.env.DATABASE_URL);

    await sql`
      INSERT INTO venue_tags (id, description)
      VALUES (${id.toLowerCase().trim()}, ${description.trim()})
    `;

    return c.json({ message: "Tag created successfully" }, 201);
  } catch (error: any) {
    console.error("Error creating venue tag:", error);
    if (error.message?.includes("duplicate key")) {
      return c.json({ error: "Tag ID already exists" }, 409);
    }
    return c.json({ error: "Failed to create venue tag" }, 500);
  }
});

// PUT update venue tag
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { description } = await c.req.json();

    if (!description) {
      return c.json({ error: "Description is required" }, 400);
    }

    const sql = neon(c.env.DATABASE_URL);

    const result = await sql`
      UPDATE venue_tags 
      SET description = ${description.trim()}
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      return c.json({ error: "Tag not found" }, 404);
    }

    return c.json({ message: "Tag updated successfully" });
  } catch (error) {
    console.error("Error updating venue tag:", error);
    return c.json({ error: "Failed to update venue tag" }, 500);
  }
});

// DELETE venue tag
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const sql = neon(c.env.DATABASE_URL);

    const result = await sql`
      DELETE FROM venue_tags 
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      return c.json({ error: "Tag not found" }, 404);
    }

    return c.json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Error deleting venue tag:", error);
    return c.json({ error: "Failed to delete venue tag" }, 500);
  }
});

export default app;
