
# Neon Admin

## Acceptance Criteria

### Login / Authentication
- [ ] Users must authenticate with email and password.
- [ ] Only authenticated `is_admin` users can access the Admin Dashboard.
- [ ] Users (Host/Model/Artist/Admin) have specific roles and permissions.

### Dashboard
- [ ] Admin users can see a high-level overview of system statistics (total users, hosts, models, sessions).

### Hosts
- [ ] Start with the **Host ↔ Model** relationship (booking).
- [ ] Hosts can create and manage their profile (name, description, location, timezone).
- [ ] Hosts can be identified as "Individual" or "Commercial" (running multiple events per week).
- [ ] Commercial hosts have events randomly filtered on public listings unless they subscribe.
- [ ] Hosts can create multiple events/sessions.
- [ ] Hosts can like/follow models to see notifications when a model updates their profile.
- [ ] Hosts can message models (email form, MVP: Instagram link).
- [ ] Hosts can send open-calls to multiple models or closed-calls to specific models.
- [ ] Hosts can commit to a minimum hourly rate for model employment.

### Venues (Locations)
- [ ] Hosts can manage multiple locations (e.g., Library, Community Center).
- [ ] Locations must have physical address, postcode, and geo-location (Google Maps / What3Words).
- [ ] Locations have specific attributes: wheelchair access, car park, central heating, etc.

### Sessions
- [ ] Sessions are linked to a Host and a Venue (Location).
- [ ] Sessions have a start time, duration, and timezone.
- [ ] Sessions can be In-Person, Online, or Hybrid.
- [ ] Sessions have pricing for In-Person and Online attendees.
- [ ] Sessions include a breakdown of activities (e.g., short poses, long poses).
- [ ] Sessions list amenities (materials provided, snacks, lighting, heating).
- [ ] Sessions can be recurring (e.g., weekly) or ad-hoc.
- [ ] Public users can only see one event for Commercial hosts unless the user pays (Phase 4).

### Models
- [ ] Models can create a profile with:
    - [ ] Biography description
    - [ ] Profile photograph
    - [ ] Social links (Instagram, Facebook)
    - [ ] External URLs (Linktree, website)
    - [ ] Private contact details (Email, Phone)
    - [ ] Date of Birth and Sex (M/F)
    - [ ] Geographic location and Timezone
    - [ ] Minimum hourly rate (local currency)
- [ ] Models can indicate job preferences (nude, clothed, portrait, sculpture).
- [ ] Models can message, follow, like, and rate hosts.
- [ ] Models can subscribe to work announcements.
- [ ] **Professional Models** (Paid Tier) can:
    - [ ] Run online sessions.
    - [ ] Sell reference sets (upload sample images, link to external sales platforms).

### Users (Artists) - *Phase 2/Later*
- [ ] Artists can browse events.
- [ ] Artists can follow models/hosts.

### Calendar / Bookings
- [ ] The calendar tracks which model is booked for which session.
- [ ] Only Paying Hosts (or Admin) can use the calendar/booking feature.
- [ ] **Booking Workflow**:
    - [ ] Host selects a model and sends an invitation (Open-call or Closed-call).
    - [ ] **Open-Call**: Many-to-one. Expires if a model accepts and host confirms, or if cancelled.
    - [ ] **Closed-Call**: One-to-one (specific date range). Expires in 48h, or if accepted, or if cancelled.
    - [ ] Invitation email contains work details (rate, location, date, time) and a unique link.
    - [ ] Model confirms or rejects availability.
    - [ ] Host confirms the booking -> Model receives confirmation.

### Ratings & Reviews
- [ ] Hosts can rate Models (Private: visible to other hosts only).
- [ ] Models can rate Hosts (Private: visible to other models only).
- [ ] Ratings can be thumbs up/down or standard star rating.

### Monetization
- [ ] **Hosts**: Monthly subscription (flat fee).
- [ ] **Professional Models**: Monthly subscription (flat fee).
- [ ] Free Host limitations:
    - [ ] Can they create sessions? (To be clarified: likely yes but limited visibility).
    - [ ] Can they book models via calendar? (No, paying feature).

### Data & Privacy
- [ ] If a Host deletes their account:
    - [ ] Can request CSV export of future session data.
    - [ ] Related data is archived for 1 year, then deleted.
- [ ] Email communications must not expose personal email addresses (unless explicitly shared).