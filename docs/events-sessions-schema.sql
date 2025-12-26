
-- Table: events (The Concept / Series)
CREATE TABLE IF NOT EXISTS "events" (
    "id" SERIAL PRIMARY KEY,
    "host_id" INTEGER NOT NULL REFERENCES "hosts"("id") ON DELETE CASCADE,
    "venue_id" INTEGER REFERENCES "venues"("id") ON DELETE SET NULL, -- Default venue
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "event_type" VARCHAR(50) NOT NULL DEFAULT 'in_person', -- 'in_person', 'online', 'hybrid'
    "price_info" VARCHAR(255), -- Simple text for MVP: "£15 In-person / £6.50 Online"
    "default_duration_mins" INTEGER DEFAULT 120,
    "recurrence" VARCHAR(255), -- Text description or RRULE: "Weekly on Thursdays"
    "active" BOOLEAN DEFAULT TRUE,
    "created_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "modified_on" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: sessions (The Specific Occurrence)
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" SERIAL PRIMARY KEY,
    "event_id" INTEGER NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
    "venue_id" INTEGER REFERENCES "venues"("id") ON DELETE SET NULL, -- Optional override
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "price_info_override" VARCHAR(255),
    "ticket_link" VARCHAR(512),
    "cancelled" BOOLEAN DEFAULT FALSE,
    "created_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "modified_on" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
