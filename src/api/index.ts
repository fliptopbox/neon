import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./db";
import authRoutes from "./routes/auth";
import venuesRoutes from "./routes/venues";
import modelsRoutes from "./routes/models";
import artistsRoutes from "./routes/artists";
import usersRoutes from "./routes/users";
import imagesRoutes from "./routes/images";
import venueTagsRoutes from "./routes/venue-tags";
import calendarRoutes from "./routes/calendar";
import dashboardRoutes from "./routes/dashboard";

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("/*", cors());

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/venues", venuesRoutes);
app.route("/api/venue-tags", venueTagsRoutes);
app.route("/api/calendar", calendarRoutes);
app.route("/api/models", modelsRoutes);
app.route("/api/artists", artistsRoutes);
app.route("/api/users", usersRoutes);
app.route("/api/images", imagesRoutes);

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
