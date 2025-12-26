
-- Migration: Convert naive timestamps to TIMESTAMPTZ (UTC) for strict decoupling

-- Venues
ALTER TABLE venues
  ALTER COLUMN created_on TYPE TIMESTAMPTZ USING created_on AT TIME ZONE 'UTC',
  ALTER COLUMN modified_on TYPE TIMESTAMPTZ USING modified_on AT TIME ZONE 'UTC';

-- Hosts
ALTER TABLE hosts
  ALTER COLUMN created_on TYPE TIMESTAMPTZ USING created_on AT TIME ZONE 'UTC',
  ALTER COLUMN modified_on TYPE TIMESTAMPTZ USING modified_on AT TIME ZONE 'UTC';

-- Events
ALTER TABLE events
  ALTER COLUMN created_on TYPE TIMESTAMPTZ USING created_on AT TIME ZONE 'UTC',
  ALTER COLUMN modified_on TYPE TIMESTAMPTZ USING modified_on AT TIME ZONE 'UTC';

-- Sessions
ALTER TABLE sessions
  ALTER COLUMN starts_at TYPE TIMESTAMPTZ USING starts_at AT TIME ZONE 'UTC',
  ALTER COLUMN ends_at TYPE TIMESTAMPTZ USING ends_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_on TYPE TIMESTAMPTZ USING created_on AT TIME ZONE 'UTC',
  ALTER COLUMN modified_on TYPE TIMESTAMPTZ USING modified_on AT TIME ZONE 'UTC';
