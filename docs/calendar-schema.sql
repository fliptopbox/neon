CREATE TABLE "calendar"(
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "venue_id" BIGINT NOT NULL,
    "date" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    "attendance_inperson" INTEGER NOT NULL DEFAULT 0,
    "attendance_online" INTEGER NOT NULL DEFAULT 0,
    "start" TIME NOT NULL,
    "duration" NUMERIC(4,2) NOT NULL,
    "notes" TEXT NULL,
    "created_on" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "modified_on" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE
    "calendar" ADD PRIMARY KEY("id");
ALTER TABLE
    "calendar" ADD CONSTRAINT "calendar_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id");
ALTER TABLE
    "calendar" ADD CONSTRAINT "calendar_venue_id_foreign" FOREIGN KEY("venue_id") REFERENCES "venues"("id");
