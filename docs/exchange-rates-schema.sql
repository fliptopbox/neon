
CREATE TABLE IF NOT EXISTS "exchange_rates" (
    "currency_code" CHAR(3) PRIMARY KEY,
    "rate_to_usd" DECIMAL(10, 6) NOT NULL, -- How many USD is 1 unit of this currency worth?
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed with initial approximate values (USD base) as of late 2025/2026 era assumptions or current real data
-- 1 Unit = X USD
INSERT INTO exchange_rates (currency_code, rate_to_usd) VALUES
('USD', 1.000000), -- Base
('EUR', 1.050000), -- Euro
('GBP', 1.250000), -- British Pound
('JPY', 0.006800), -- Japanese Yen
('AUD', 0.650000), -- Australian Dollar
('CAD', 0.720000), -- Canadian Dollar
('CHF', 1.120000), -- Swiss Franc
('CNY', 0.140000), -- Chinese Yuan
('SEK', 0.091000), -- Swedish Krona
('NZD', 0.590000)  -- New Zealand Dollar
ON CONFLICT (currency_code) DO NOTHING;
