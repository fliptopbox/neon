# Admin UI Implementation Plan

> **Created:** 2025-12-27
> **Tech Stack:** Plain HTML/CSS/JS + Tailwind CDN
> **Design System:** Material Design 3 (Mobile-First)
> **Location:** `/src/admin/`

---

## 🎨 Design System (from Stitch Mockups)

### Color Tokens
```css
--primary: #1313ec;
--background-light: #f6f6f8;
--background-dark: #101022;
```

### Typography
- **Font Family:** Inter (Google Fonts)
- **Weights:** 400, 500, 600, 700

### Border Radius
- Default: `0.25rem`
- Large: `0.5rem`
- XL: `0.75rem`
- Full: `9999px` (pills)

### Component Patterns
1. **Sticky Header** - Title + optional action button
2. **Search Bar** - Rounded, with icon, ring focus state
3. **Filter Chips** - Horizontal scrollable pills
4. **List Items** - Avatar + status indicator + name/email + overflow menu
5. **Bottom Navigation** - 4-5 tabs with active state
6. **Cards** - White bg, subtle shadow, border
7. **Modals** - Bottom sheet style on mobile

---

## 📁 File Structure

```
/src/admin/
├── index.html          # Entry point, app shell
├── styles.css          # Global styles + Tailwind config overrides
├── app.js              # Main app, routing, state management
├── api.js              # API client helper functions
├── components/
│   ├── nav.js          # Bottom navigation component
│   ├── header.js       # Sticky header component
│   ├── modal.js        # Modal/bottom sheet component
│   ├── list-item.js    # Reusable list item component
│   └── search.js       # Search bar component
└── views/
    ├── login.js        # Login view
    ├── users.js        # User management view
    ├── hosts.js        # Host management view
    ├── models.js       # Model management view
    ├── calendar.js     # Calendar/sessions view
    └── dashboard.js    # Admin dashboard (last)
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation
**Goal:** Basic app shell with login and navigation

- [ ] Create `index.html` with Tailwind CDN, Inter font
- [ ] Create `styles.css` with design tokens
- [ ] Create `app.js` with routing and state management
- [ ] Create `api.js` with fetch wrapper (auth headers)
- [ ] Build `login.js` view
- [ ] Build `nav.js` (bottom navigation)
- [ ] Build `header.js` (sticky header)

### Phase 2: User Management
**Goal:** Full CRUD for users (auth foundation)

- [ ] Build `users.js` list view (matches user_management_1 mockup)
- [ ] Add user detail/edit modal (matches user_management_2 mockup)
- [ ] Connect to `/api/users` endpoints
- [ ] Add search and filter functionality

### Phase 3: Host Management
**Goal:** Host profiles, venues, events

- [ ] Build `hosts.js` list view
- [ ] Build host detail view with tabs:
  - Profile info
  - Venues (sub-list)
  - Events (sub-list)
- [ ] Connect to `/api/hosts`, `/api/venues`, `/api/events` endpoints

### Phase 4: Model Management
**Goal:** Model profiles and availability

- [ ] Build `models.js` list view (matches model_profile_management mockups)
- [ ] Build model detail view (matches model_details mockup)
- [ ] Add portfolio preview (horizontal scroll)
- [ ] Connect to `/api/models` endpoints

### Phase 5: Calendar & Sessions
**Goal:** Session scheduling and model assignment

- [ ] Build `calendar.js` calendar view (matches calendar_management mockups)
- [ ] Build session booking modal (matches session_booking mockups)
- [ ] Build model assignment flow (matches book_model_for_session mockups)
- [ ] Connect to `/api/calendar` endpoints

### Phase 6: Dashboard
**Goal:** Admin overview (build last with real data)

- [ ] Build `dashboard.js` (matches admin_dashboard_overview mockup)
- [ ] Stats cards (Artists, Hosts, Models)
- [ ] Recent activity feed
- [ ] Quick actions

---

## 🔌 API Endpoints Required

### Auth
- `POST /api/auth/login` ✅ exists
- `POST /api/auth/register` ✅ exists

### Users
- `GET /api/users` ✅ exists (admin only)
- `GET /api/users/me` ✅ exists
- `PUT /api/users/:id` ✅ exists
- `DELETE /api/users/:id` ✅ exists
- `PATCH /api/users/:id/toggle` ✅ exists
- `PATCH /api/users/:id/toggle-admin` ✅ exists

### Hosts
- `GET /api/hosts` ✅ exists
- `GET /api/hosts/:id` (need to verify)
- `PUT /api/hosts/:id` (need to verify)

### Models
- `GET /api/models` ✅ exists
- `GET /api/models/:id` (need to verify)
- `PUT /api/models/:id` (need to verify)

### Calendar
- `GET /api/calendar` ✅ exists
- `POST /api/calendar` (need to verify)
- `PUT /api/calendar/:id` (need to verify)

### Venues
- `GET /api/venues` ✅ exists

---

## 📱 Mobile-First Breakpoints

```css
/* Mobile first (default) */
/* Tablet: 768px */
/* Desktop: 1024px */
```

The UI will be optimized for mobile portrait (375px - 414px width).
Desktop will use a max-width container (~448px) centered on screen.

---

## ✅ Ready to Start

Shall we begin with **Phase 1: Foundation**?
