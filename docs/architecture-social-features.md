
# Social Features Architecture: Likes, Follows, and Ratings

This document captures the architectural decisions and database schema designs for implementing social features (Likes, Follows) and professional credibility ratings (Netflix-style) within the Neon platform.

## 1. Follow Structure (Relationship Graph)

**Goal:** Allow users (Hosts, Models, Artists) to follow other profiles.
**Architecture:** Use a unified "Adjacency List" table (`follows`) linked to `user_profiles`. This supports a generic graph where any user type can follow any other user type.

### Recommended Schema

```sql
Table follows {
  follower_id integer [ref: > user_profiles.id] -- Who is following
  following_id integer [ref: > user_profiles.id] -- Who is being followed
  created_at timestamptz [default: `now()`]

  indexes {
    (follower_id, following_id) [pk] -- Composite PK prevents duplicate follows
    (following_id, follower_id) -- Fast lookup for "Who follows this user?"
  }
}
```

### Performance Optimization
Avoid counting rows on every read. Store a denormalized count on the graph nodes (`user_profiles`).

```sql
Table user_profiles {
  // ... existing columns ...
  followers_count integer [default: 0] -- Updated via trigger
  following_count integer [default: 0] -- Updated via trigger
}
```

---

## 2. Like Structure (Polymorphic Interaction)

**Goal:** Allow users to "Like" various entities (Profiles, Events, Venues, etc.).
**Architecture:** Polymorphic Table pattern combined with Denormalized Counters (Trigger-based).

### Recommended Schema (Polymorphic)

```sql
Enum likeable_type_enum {
  user_profile
  event
  venue
  comment
}

Table likes {
  user_id integer [ref: > user_profiles.id] -- Who liked it
  resource_id integer [not null] -- The ID of the target (e.g., Profile ID or Event ID)
  resource_type likeable_type_enum [not null] -- Discriminator
  created_at timestamptz

  indexes {
    (user_id, resource_id, resource_type) [unique] -- Prevent double liking
    (resource_type, resource_id) -- Fast count support
  }
}
```

### Performance Strategy: "Source + Denormalized Counter"
**Why:**
*   **Pure SELECT COUNT(*):** Too slow for high-read pages (feeds).
*   **Pure Ledger (+1/-1):** Risky data integrity (allows duplicate likes).
*   **Winner:** **Source Record + Trigger.**
    *   **Source:** The `likes` table ensures one like per user.
    *   **Counter:** A `likes_received_count` integer column on the target table (e.g., `user_profiles`, `events`).
    *   **Trigger:** On INSERT/DELETE in `likes`, the database automatically increments or decrements the counter. This provides O(1) read performance.

---

## 3. Professional Rating System (Credibility)

**Goal:** A Netflix-style rating system (Dislike, Like, Super Like) for professional credibility between Hosts and Models. Must be distinct from public social likes.
**Visibility:** Private. Hosts only see their own ratings of models and aggregate scores. Models only see their own scores.

### Recommended Schema

```sql
Enum rating_score_enum {
  dislike = -1      -- "Unreliable / Unsafe"
  neutral = 0       -- Placeholder
  like = 1          -- "Good / Reliable"
  super_like = 2    -- "Exceptional / Highly Recommended"
}

Table professional_ratings {
  id integer [primary key]
  rater_id integer [ref: > user_profiles.id]  -- Who is giving the feedback
  target_id integer [ref: > user_profiles.id] -- Who is being rated
  
  -- Core Rating Data
  score rating_score_enum [not null]
  notes text [note: "Private notes just for the rater"]
  
  -- Context Enforcement
  confirmed_booking_id integer [ref: > calendar.id] -- Optional: Link to specific job to prevent abuse
  
  created_at timestamptz [default: `now()`]
  updated_at timestamptz

  indexes {
    (rater_id, target_id) [unique] -- One rating per professional relationship
  }
}
```

### Key Logic
*   **Netflix Model:** Ratings are stateful. If a relationship improves, the Rater updates their existing row from `-1` to `1`.
*   **Aggregated Score:** Never show raw negative ratings. Show a calculated "Reliability Score" (e.g., "98% Positive") or badges ("Super Reliable" if > threshold of +2 ratings).
*   **Constraint:** Strongly consider limiting ratings to users who have a confirmed interaction (e.g., a Booking) to prevent reputation bombing.
