
import { Hono } from "hono";
// Trigger reload
import { cors } from "hono/cors";
import type { Env } from "./db";
import authRoutes from "./routes/auth";
import venuesRoutes from "./routes/venues";
import hostsRoutes from "./routes/hosts";
import eventsRoutes from "./routes/events";
import modelsRoutes from "./routes/models";
import artistsRoutes from "./routes/artists";
import usersRoutes from "./routes/users";
import imagesRoutes from "./routes/images";
import venueTagsRoutes from "./routes/venue-tags";
import calendarRoutes from "./routes/calendar";
import dashboardRoutes from "./routes/dashboard";
import exchangeRatesRoutes from "./routes/exchange-rates";

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return origin;
      }
      if (
        origin.endsWith(".neon-admin.pages.dev") ||
        origin === "https://neon-admin.pages.dev"
      ) {
        return origin;
      }
      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/hosts", hostsRoutes);
app.route("/api/venues", venuesRoutes);
app.route("/api/events", eventsRoutes);
app.route("/api/venue-tags", venueTagsRoutes);
app.route("/api/calendar", calendarRoutes);
app.route("/api/models", modelsRoutes);
app.route("/api/artists", artistsRoutes);
app.route("/api/users", usersRoutes);
app.route("/api/images", imagesRoutes);
app.route("/api/exchange-rates", exchangeRatesRoutes);

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: "Internal server error", details: String(err) }, 500);
});

export default app;
