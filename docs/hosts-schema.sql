
CREATE TABLE IF NOT EXISTS "hosts" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER DEFAULT 2013, 
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "email" VARCHAR(255),
    "socials" JSONB DEFAULT '{}',
    "logo" VARCHAR(512) DEFAULT '',
    "images" JSONB DEFAULT '[]',
    "active" BOOLEAN DEFAULT TRUE,
    "created_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "modified_on" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
