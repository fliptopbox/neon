This project objective is to create a global resouce for people in the life drawing scene.

The initial phase of this project will cater for hosts, models, and artists in greater London.
The priciliple trinity is the relationships between the host, life model and the artist (passive)

There are three main users to cater for:

- The host (employer) is looking for artists to attend their events, and needs to book a model for a session at that event.
- The model (employee) is looking for session work with a host
- The artist (customer) is looking for a Session to attend with a model

Start with the **Host ↔ Model** relationship (booking). Artists are passive consumers initially (they just browse events). Monetize artists last (Phase 4).

## Users

- A user is a generic entity with an email address and password
- Users can be associated as a host (when they create HOST metadata)
- Users can be associated as a model (when they create MODEL metadata)
- Users can be associated as a artist (when they create ARTISTS metadata)
- Some users are administrators (by default they are not)
- Users that authenticate can interact with hosts, models and other artists e.g. like, follow, send message, rate the host and/or model
- Users can find relative models/host that have the same geo-graphic loctation

---

## Hosts:

- A user that manages a life drawing event
- All hosts can create as many events as they wish.
- There are two types of host: individual or commercial
  - Individula hosts: is an indiviual who is passionate about drawing, they generally run a single event on a regular schedule.
  - Commercial hosts: run multiple events per week, on different days of the week.
  - Commercial hosts will have their events randomly filtered, so public users will only see one event on the 'Events listing page', unless they pay for full access.
- Hosts can like, follow and message models with offers of work
- Hosts can send an open-call to many models, announcing an open-call for work
- messaging:
  - via a simple email form. email comms must not expose any personal details.
  - or via an Instagram link (mvp)
- "Follow models" lets the host see:
  - Notifications when a model updates their profile,
  - and request for work When they're available.
- Host can have multiple locations. e.g. Monday in library, Thurs in the community center.
- Host can have multiple Sessions on the same day. e.g. 10am to 12pm and later from 2pm to 4pm
- All users can see the host details, location, and session details.
- A host should commit to a minimun hourly rate for model employment
- A host has a geographic location, and timezone

---

## Life models:

- A user who is emplyed by a host to perform at an event, for a session, with a specific day and time and for an agreed rate (hourly, daily)
- generally a model is a low waged artists, like dancers, actors, artists.
- They can create a basic profile:
  - a biography description
  - a profile photograph,
  - social links, e.g. instagram, facebook etc.
  - external website URLs: e.g. link.tree, dedicated website, hosted web page.
  - email contact details, (private)
  - phone number (private)
  - (optional) a gallery of photos
- These profile details allow hosts to find new and experienced models, and connect to models.
- some models are professional models.
  - They sometimes run online sessions (via zoom or google meet)
  - Some sell photographic "reference sets" online on platforms like gumroad or patreon.
    In this case the model gets the free biography page, and can upload sample images (to an external CDN) or link to assets for sale.
    They are charged for this.
- a model should be allowed to:
  - message, follow, like and rate a hosts & artists
  - subscribe work announcements (from hosts or authorised artists)
- A model has a geographic location, and timezone
- A model profile shows the jobs they are after. e.g. nude life modelling, clothed, portait, sculpture,
- A modle needs to list a minium hourly rate. (in their local currency)
- A model needs to have a date-of-birth and a given sex (m,f)

---

## Aritists: (second phase, ignore for now)

- who attend drawing events
- show their work to other artists
- can follow models, and support them with tips, like and follow model activity
- can follow hosts and like them, and (potentially) subscribe to announcements
- can announce private drawing sessions (sent to models)
- A artist has a geographic location, and timezone

---

## Locations

- A host runs their event in a location e.g. Homerton Library
- A location has a geographic location
- these have a physical address, post code, geo-location (google map, and what-three-words)
- a list of attributes: wheel chair access, car park, central heating etc.

---

## Sessions

- A host runs a session in a location, and timezone
- A session can be in-person, online or both
- They occur on a day, may recur (eg. weekly on Thursday), or be a single event (Ad Hoc) or monthly or bi-weekly etc.
- These have a strart time, duration, cost (online and/or inperson)
- A break down of the activities. e.g. short poses, break, long poses
- A list of other attributes. e.g. materials and snacks provided, lighting, heating etc.
- All users can visit the hosts social links, for the session. e.g. the host might use Eventbright or Meetup to managle ticket sales, or may have a dedicated website.

---

### Monetization

- for hosts: Monthly subscription (flat free)
- for professional models: Monthly subscription (flat fee)

---

### Ratings & Reviews

Users can **"rate the host and/or model"** - is this:

- Public star ratings
- thumb down (-1), no-rating (0), thumb-up (1) double thumb-up (2)

---

### Calendar / Bookings

The **calendar** tracks which model is booked for which session. Who creates these entries?

- The host can select a model and book directly or send an invitation
- Only Paying hosts (or admin users) can use the calendar feature.
- Host invites a model via email. The message contains a special URL link, and the details of the work offer, e.g. hourly rate, location, date, time.
- Model confirms or rejects availability
- The host confirms booking, the model gets the confirmation email.

---

### Model Availability

    - A model can have a specific availability e.g. Tuesday 13th evening
    - A model can make a reactive request, e.g. available today, or this month in London.

---

### Geography

- Same city/borough?
- Within X km radius?
- Same timezone?

---

### Data Ownership

    - If a host **deletes their account**,
        - they are emailed a CSV of future session data (if requested)
        - all related data is archived
        - after 1 year the archive is deleted.

---

### MVP Scope

For **Phase 1**:

- [x] Directory (hosts, locations, sessions, models)
- Social interactions:
  - [x] all users (like models and hosts) public
  - [x] for Hosts (rate the model) private to other hosts
  - [x] for Models (rate the host) private to other models
- [x] Messaging (email form)
- [ ] Payments/charging
- [ ] Open-call announcements

// ...existing code...

---

### Geography (pick one or combination)

- [x] Same city/borough?
- [x] Within X km radius?
- [x] Same timezone?

---

### Booking Workflow - Edge Cases

Invitation messages from Host to Modles:
There are two types,

- open-call (many to one, targets many models for the one Session date) eg. Angels on December 2025 Thursday 13
- closed-call (one to one, targets a sinlge model, for a specific date range ) eg. Angela for December 2025 Thursday 06, 13, 20, 27

Open-call invitations:

- expires the moment a model accepts the Session booking and the host confirms
- or if the host cancels the call
- or if the host cancels the session

Closed-call invitations:

- expire with-in 48 hours,
- or if another closed-call for the same Session is accepted and confirmed.
- or if the host cancels the call
- or if the host cancels the session

1. **Invitation expiry** - if a model doesn't respond to an invite, does it expire? After how long?

   - [ ] 24 hours
   - [ ] 48 hours
   - [ ] 7 days
   - [ ] Never (manual cancellation only)

2. **Double-booking** - can a model be invited to overlapping sessions by different hosts?

   - [ ] Allow (model decides)
   - [ ] Prevent conflicts (system blocks)

3. **Cancellation** - if a confirmed booking is cancelled (by host or model):
   - [ ] Notify the other party via email?
   - [ ] Track cancellation rate? (affects ratings?)

---

### Ratings Visibility

Hosts rate models → visible to other hosts only  
Models rate hosts → visible to other models only

**Can a host/model see their own ratings?**

- [ ] Yes - aggregate score only (e.g., "4.2 average")
- [ ] Yes - aggregate + individual reviews
- [ ] No - ratings are hidden from the rated party

---

### Subscriptions

1. **Rough price point?** (helps decide Stripe vs simpler solution)

   - Hosts: £\_\_\_/month
   - Professional models: £\_\_\_/month

2. **Free trial period?**

   - [ ] None
   - [ ] 7 days
   - [ ] 14 days
   - [ ] 30 days

3. **When subscription lapses, what happens?**
   - [ ] Lose calendar/booking access, data retained
   - [ ] Account downgraded to free tier
   - [ ] Account frozen until payment resumes

---

**Clarify:** Can a free host...

- [ ] Create sessions, but NOT book models via calendar?
- [ ] Create ONE session AND book models for it?
- [ ] Only view/browse, cannot create anything?
