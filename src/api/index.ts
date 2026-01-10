
import { Hono } from "hono";
// Trigger reload
import { cors } from "hono/cors";
import type { Env } from "./db";
import authRoutes from "./routes/auth";
import venuesRoutes from "./routes/venues";
import hostsRoutes from "./routes/hosts";
import eventsRoutes from "./routes/events";
import modelsRoutes from "./routes/models";
import calendarRoutes from "./routes/calendar";
import usersRoutes from "./routes/users";
import dashboardRoutes from "./routes/dashboard";
import exchangeRatesRoutes from "./routes/exchange-rates";
import registerRoutes from "./routes/register";

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
app.route("/api/calendar", calendarRoutes);
app.route("/api/models", modelsRoutes);
app.route("/api/users", usersRoutes);
app.route("/api/exchange-rates", exchangeRatesRoutes);
app.route("/api/register", registerRoutes);

// Temporary schema setup
import { query } from "./db";

app.post("/api/setup-triggers", async (c) => {
  try {
    // 1. Create Function (Fixed with ::jsonb cast)
    await query(c.env, `
      CREATE OR REPLACE FUNCTION update_model_avatar() RETURNS TRIGGER AS $$
      BEGIN
          -- Cast to jsonb explicitly to avoid ambiguity if column is json
          IF NEW.portrait_urls IS NOT NULL AND jsonb_array_length(NEW.portrait_urls::jsonb) > 0 THEN
              UPDATE user_profiles
              SET avatar_url = NEW.portrait_urls->>0
              WHERE user_id = NEW.user_id;
          END IF;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `, []);

    // 2. Drop existing trigger
    await query(c.env, `DROP TRIGGER IF EXISTS trigger_model_avatar_update ON models`, []);

    // 3. Create Trigger
    await query(c.env, `
      CREATE TRIGGER trigger_model_avatar_update
      AFTER INSERT OR UPDATE OF portrait_urls ON models
      FOR EACH ROW
      EXECUTE FUNCTION update_model_avatar();
    `, []);

    return c.json({ success: true, message: "Triggers matched (v2)" });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: "Internal server error", details: String(err) }, 500);
});

export default app;
