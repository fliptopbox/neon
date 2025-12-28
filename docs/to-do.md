
# Neon Platform: Admin & API Roadmap

This document tracks the development tasks for the Neon Admin Interface and its underlying API endpoints.

## 📋 To-Do List

### Phase 1: Foundation (Users & Profiles)
**Goal:** Establish control over the core identity layer (The "Pinnacle" Tables).
- [ ] **API: Users Management**
    - `GET /api/admin/users`: List all users (filtering by active/admin).
    - `POST /api/admin/users`: Create a new user (with generated password or invite).
    - `PATCH /api/admin/users/:id`: Toggle `is_global_active`, `is_admin`.
- [ ] **API: Profiles Management**
    - `GET /api/admin/profiles`: View enriched profile data (Fullname, Handle, Flags).
    - `PATCH /api/admin/profiles/:id`: Update internal notes or profile status.

### Phase 2: Supply Side (Hosts & Venues)
**Goal:** Manage the entities that create inventory (Sessions).
- [ ] **API: Venues**
    - `GET /api/admin/venues`: Master list of locations.
    - `POST /api/admin/venues`: Add curated venues.
- [ ] **API: Hosts**
    - `GET /api/admin/hosts`: List hosts with their new Description & Summary fields.
    - `PATCH /api/admin/hosts/:id`: Edit public summaries (utilizing our recent enrichment work).

### Phase 3: The Product (Events & Calendar)
**Goal:** Manage the actual schedule and "Open Calls".
- [ ] **API: Event Templates**
    - `GET /api/admin/events`: List the recurring event definitions.
- [ ] **API: Calendar (The Scheduler)**
    - `GET /api/admin/calendar`: Master view of all sessions (filtering by status: `confirmed`, `opencall`, `closed`).
    - `POST /api/admin/calendar`: Create new sessions from Event Templates.
    - `PATCH /api/admin/calendar/:id`: Assign Models to Sessions (The Booking Action).

### Phase 4: Talent (Models)
**Goal:** Manage the talent pool and verification.
- [ ] **API: Models**
    - `GET /api/admin/models`: Talent directory.
    - `PATCH /api/admin/models/:id`: Update verification status or internal notes.

---

## 📝 Changelog

### 2025-12-26
- **Architecture**: Documented Social Features (Likes/Follows) and Messaging Workflows (Open Calls vs Chat).
- **Data**: Enriched Seed Data with:
    - Host Descriptions & Tweet-sized Summaries (Web-sourced).
    - Host Contact Emails (Web-sourced).
    - Preserved manual User Profile name changes.
- **Migration**: Finalized Schema 3.0 in `etl_platform_migration.js` including new `summary` columns.
