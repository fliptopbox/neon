
# Messaging & Workflow Architecture

This document outlines the architectural approach for handling diverse communication requirements, from direct introductions to complex hiring workflows and public broadcasts.

## Core Hierarchy
Large platforms (LinkedIn, Upwork, Airbnb) typically strictly separate **Communication** (Chat) from **Transaction** (Workflows/Jobs) and **Distribution** (Feeds).

1.  **Direct Messaging (DM):** Unstructured 1:1 or Group chat. (Intros, Ad-hoc coordination).
2.  **Workflows (Transactional):** Structured interactions with state (Open Calls, Job Offers, Applications).
3.  **Broadcasts (Feed):** One-to-many distribution (Announcements, Marketing).

---

## 1. The Open Call (Structured Workflow)
**Scenario:** "Host gets a cancellation, broadcasts an open-call with strict TTL, awards session."

This should **NOT** be built as a chat message. It is a **Job Object**. If you send it as a chat message, you lose the ability to track who applied, expire the invite automatically, or prevent "reply-all" noise.

### Architecture: The "Job Board" Pattern
*   **The Object:** An `open_call` linked to a calendar session.
*   **The Distribution:** System sends Notifications (Push/Email) to target models pointing to this object.
*   **The Interaction:** Models click "Apply" (creating an `application` record), NOT "Reply" (sending text).
*   **The Resolution:** Host clicks "Confirm" on an applicant, which updates the core `calendar` table.

#### DBML Example
```sql
Table open_calls {
  id integer [primary key]
  host_id integer [ref: > user_profiles.id]
  calendar_session_id integer [ref: > calendar.id] -- Link to the specific vacancy
  
  status enum_open_call_status [note: 'active, filled, expired']
  expires_at timestamptz [not null] -- The strict TTL
  
  requirements jsonb [note: '{"pose_style": "dynamic", "min_rating": 2}']
  created_at timestamptz
}

Table open_call_applications {
  id integer [primary key]
  open_call_id integer [ref: > open_calls.id]
  model_id integer [ref: > models.id]
  status enum_app_status [note: 'pending, accepted, rejected']
  created_at timestamptz
}
```

---

## 2. Direct Messaging (Intros & Ad-Hoc)
**Scenario:** "Host sends intro to Model" or "Model solicits work."

This is standard **Conversational Messaging**. Typically structured around "Conversations" rather than individual messages to group history correctly.

### Architecture: Conversation-Based
Do not just stick all messages in one table. Group them into "Conversations" (or "Threads"). This allows you to add features like "Archive Thread", "Mute Thread", or "Unread Count per Thread" later.

#### DBML Example
```sql
Table conversations {
  id integer [primary key]
  created_at timestamptz
  updated_at timestamptz [note: 'Used for sorting inbox']
}

Table conversation_participants {
  conversation_id integer [ref: > conversations.id]
  user_id integer [ref: > user_profiles.id]
  last_read_at timestamptz -- For unread counts
}

Table messages {
  id integer [primary key]
  conversation_id integer [ref: > conversations.id]
  sender_id integer [ref: > user_profiles.id]
  
  content text
  kind enum_msg_type [note: 'text, image, system_notification']
  created_at timestamptz
}
```

---

## 3. Public Broadcasts (The "Megaphone")
**Scenario:** "Host announces a generic Zoom session to followers & visitors."

This is a **Marketing Feed**. It is essentially "Social Media Pattern". Using Direct Messages here is spamming; using Workflows is too heavy.

### Architecture: Activity Feed / Posts
This data should live in a `posts` or `announcements` table and be surfaced via:
1.  **Profile Page:** "Pinned" or "Latest News" section.
2.  **Follower Feed:** Distributed to the "Home" feed of users following this Host (using the `follows` graph).

#### DBML Example
```sql
Table posts {
  id integer [primary key]
  author_id integer [ref: > user_profiles.id]
  content text
  
  visibility enum_visibility [note: 'public, followers_only']
  link_url text [note: 'Link to Zoom or external booking']
  
  is_pinned boolean
  expires_at timestamptz -- Optional: Auto-hide after event
  created_at timestamptz
}
```

---

## Summary of Logic

| Scenario | System | Why? |
| :--- | :--- | :--- |
| **Urgent Cancellation** | **Open Call (Workflow)** | Needs state, expiration, and structured "Accept" button. Chat cannot handle "Expiration". |
| **Introductions** | **Direct Message (Chat)** | Needs history, back-and-forth dialogue, privacy. |
| **Public News** | **Post (Feed)** | One-to-many, non-urgent, informational. |

### How they connect
Start with **Workflows**. If a Model applies for an Open Call, the system can *auto-generate* a system message in a new **Conversation** between them: *"System: Jane applied for your Tuesday Session."*
This bridges the Transactional world with the Communicative world, allowing the Host to then chat: *"Thanks for applying, can you bring red drapes?"*
