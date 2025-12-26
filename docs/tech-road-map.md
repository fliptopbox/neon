# LifeDrawing.art - Technical Development Roadmap
**Version:** 1.0
**Strategic Goal:** Pivot from static directory to Vertical SaaS + Media Platform.
**Core Architecture:** Hybrid "Two-Lane" System (Hyper-Local Physical + Global Digital).

---

## 🏗 Phase 1: The Foundation & Data Structure (Weeks 1-4)
**Objective:** Transform static pages into a dynamic, relational database. Enable "Model Self-Onboarding" and differentiate between Local and Global talent.

### 1.1 Database Schema (The "Source of Truth")
Implement a relational structure with the following objects and attributes:
* **Users (Base):** Email, Auth Token, Role (Model, Host, Artist).
* **Profile_Model:**
    * `Display_Name`, `Bio`, `Photos[]`.
    * `Home_Metro_Area` (e.g., "London") -> *Crucial for Local Search.*
    * `Is_Online_Available` (Boolean) -> *Crucial for Global Search.*
    * `Travel_Radius_Km` (Integer).
    * `External_Store_Link` (URL for Gumroad/Patreon).
    * `Status` (Pending, Verified, Featured).
* **Profile_Host:**
    * `Venue_Name`, `Address`, `Geo_Coordinates`.
    * `Subscription_Tier` (Free, Pro).
    * `Verified_Safe_Space` (Boolean).

### 1.2 The Ingestion Engine (Onboarding)
* [ ] **Model Onboarding Flow:** Create a multi-step form (or Typeform integration) that maps directly to the `Profile_Model` schema.
* [ ] **Tagging System:** Mandatory tags: *Nude, Costume, Portrait, Long-Pose, Dynamic*.
* [ ] **The "Digital Toggle":** Explicit UI checkbox: *"I offer online/Zoom sessions"* (This creates the "Two-Lane" logic).

### 1.3 The "Link Cloaker" (Analytics Asset)
* [ ] Do not render raw external links.
* [ ] Build a redirect controller: `lifedrawing.art/out/[model_id]/store`.
* [ ] **Logger:** Record every click with `{timestamp, user_ip, target_url}` before redirecting to Gumroad/Patreon.

### ✅ Phase 1 Definition of Done:
* Database is live.
* 50 Models can sign up and edit their own profiles.
* Admin can see a dashboard of "New Signups" to vet.
* Outbound clicks to model stores are being counted in the backend.

---

## 🔒 Phase 2: The Gate & The Search (Weeks 5-8)
**Objective:** Build the Host interface and the "Paywall" logic. Implement the "Two-Lane" search experience.

### 2.1 The "Two-Lane" Search UI
* [ ] **The Global Toggle:** A prominent switch in the UI header: `[ In-Person ]` <-> `[ Online ]`.
* [ ] **Lane 1 (In-Person):**
    * Logic: Filter by `Home_Metro_Area` OR `Geo_Coordinates` (Radius).
    * UI: List view sorted by "Distance from me."
* [ ] **Lane 2 (Online):**
    * Logic: Filter by `Is_Online_Available = True`.
    * **Timezone Magic:** Display availability converted to the *User's* local time (e.g., "Starting at 19:00 GMT").

### 2.2 Host Dashboard & "The Gate"
* [ ] **Host Claim Flow:** Allow Hosts to "Claim" an existing static listing (verify via email domain).
* [ ] **The Paywall Logic:**
    * Allow Hosts to *search* and *view* Model cards (Photos + Bio).
    * **The Blur:** When Host clicks "View Contact Info" or "Book Model":
        * IF `Subscription_Tier == Pro` -> Reveal Data.
        * IF `Subscription_Tier == Free` -> Trigger "Upgrade to Pro" Modal.

### 2.3 The "Concierge" Booking Button
* [ ] Instead of a full booking engine, add a "Request Booking" button on Model profiles.
* [ ] Action: Triggers an internal notification to Admin (You) with the Host's request details. (Manual fulfillment for now).

### ✅ Phase 2 Definition of Done:
* Search filters correctly separate "London Models" from "New York Zoom Models."
* Timezones are accurate for online users.
* Hosts encounter a "Soft Paywall" when trying to access premium data.

---

## 🚀 Phase 3: Traffic & Value Loop (Weeks 9+)
**Objective:** Scale traffic and automate the Artist experience (The "Media" Play).

### 3.1 Artist "Follow" Logic
* [ ] **Follow Button:** Artists can "Heart" a model.
* [ ] **Notification Engine:**
    * Trigger: When `Event` is created linked to `Model_A`.
    * Action: Email all Users following `Model_A`: *"Gabi is posing at [Venue] tomorrow."*

### 3.2 Automated Events
* [ ] **Calendar Integration:** Allow Models to sync a Google Calendar (Read-Only) to show "Busy/Free" slots on their profile.
* [ ] **"Live Now" Badge:** Logic to highlight Online Models whose session start time is < 30 mins from `Current_Time`.

### ✅ Phase 3 Definition of Done:
* Artists are receiving automated emails about their favorite models.
* Models have "Busy" slots visible on their calendar.
* System handles 100+ concurrent users without latency.

---

## 🛠 Technical Non-Negotiables (Antigravity Constraints)
1.  **Mobile First:** 80% of Artists will access this via phone in a studio. UI must be touch-optimized.
2.  **Image Optimization:** Model portfolios are heavy. Implement auto-compression and lazy loading (Cloudinary or similar) to ensure site speed.
3.  **Security:** Host contact details and Model real names must be encrypted at rest.