
import { Hono } from "hono";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Env; Variables: { user: any } }>();

// GET all rates
app.get("/", async (c) => {
    const rates = await query(c.env, "SELECT * FROM exchange_rates ORDER BY currency_code");
    return c.json(rates);
});

// GET one rate
app.get("/:code", async (c) => {
    const code = c.req.param("code");
    const rate = await queryOne(c.env, "SELECT * FROM exchange_rates WHERE currency_code = $1", [code]);
    if (!rate) return c.json({ error: "Rate not found" }, 404);
    return c.json(rate);
});

// POST / Create Rate (only if not exists, though usually we preload these)
app.post("/", authMiddleware, adminMiddleware, async (c) => {
    const data = await c.req.json();
    if (!data.currency_code || !data.rate_to_usd) {
        return c.json({ error: "Missing fields" }, 400);
    }
    
    try {
        const [rate] = await query(
            c.env, 
            "INSERT INTO exchange_rates (currency_code, rate_to_usd, updated_at) VALUES ($1, $2, NOW()) RETURNING *",
            [data.currency_code, data.rate_to_usd]
        );
        return c.json(rate, 201);
    } catch (e: any) {
        return c.json({ error: e.message }, 400);
    }
});

// PUT / Update Rate
app.put("/:code", authMiddleware, adminMiddleware, async (c) => {
    const code = c.req.param("code");
    const data = await c.req.json();
    
    const [rate] = await query(
        c.env,
        "UPDATE exchange_rates SET rate_to_usd = $1, updated_at = NOW() WHERE currency_code = $2 RETURNING *",
        [data.rate_to_usd, code]
    );
    
    if (!rate) return c.json({ error: "Rate not found" }, 404);
    return c.json(rate);
});

// DELETE
app.delete("/:code", authMiddleware, adminMiddleware, async (c) => {
    const code = c.req.param("code");
    await query(c.env, "DELETE FROM exchange_rates WHERE currency_code = $1", [code]);
    return c.json({ message: "Rate deleted" });
});

export default app;
