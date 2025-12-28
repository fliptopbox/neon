1. **Tech Stack**: **Plain HTML/CSS/JS** (simplest, like your prototypes)

2. **Location**:  /src/admin/

3. **API Integration**: connect to **actual API endpoints** as we build them?

4. **Priority Order**: Which screens should we build first?
   
   - User Management (generic user for login auth)
   - HOST management. (profile, settings, venues, events, calendar)
   - MODEL management.  (profile, settings)
   - Calendar/Sessions (using an event to create a session, and assign a model)
   - ADMIN user's Dashboard (overview/home) when everything is done

5. **Tailwind**: Continue with **Tailwind CDN** (quick, matches prototypes)



**Workflow Questions for Your Review:**

I've broken these down by role to focus on specific user journeys:

**For the Host (Admin Dashboard):**

1. **Event Creation Flow:**
   
   - requires a "Event Creation" screen. 
   - the host assigns a venue either by creating the venue, or by selecting from known venues in the system

2. **Model Booking & Management:**
   
   - After a Host awards a booking  a confirmation is sent to the elected model, the open-call is marked as resolved, and the model is assigned to the session.
   - How does a Host track the status of an Open Call via the in-app messaging inbox. (similar to the model in-app messages)
   - If a Host wants to book a specific model *directly* from the "Session Booking", the cycle is: 
     - host invites (with TTL deadline) > model accepts > host confirms (done)
     - host invites > model declines > host invites a new model (loop)
     - host invites > model declines with alternative date > host accepts proposition and confirms new date OR declines. host returns to original objective for available session and invites a different model
     - NOTE: if both model and host use the calendar the host will be warned if the invited model is already booked for another known event.
   - The other workflow is regarding event cancellation. Sometimes the HOST is forced to issue a cancellation due to known or unexpected factors. The booked model is notified the moment an event OR booking is cancelled.

3. **Revenue & Financials (Admin Overview):**
   
   - The "Admin Dashboard Overview" shows key metrics. Do Hosts need to see financial data related to their events (e.g., artist payments, model fees, venue costs, net profit)? If so, where would this information be displayed or managed? No, not yet.
   
   - Payment and invoicing is NOT done in this system, however a model can send a payment request, in the form of a payment link (like PayPal) or monzo or bank details. These details are stored on the models private profile. The host will receive the request, and have a button to 'Request Receipt for N USD (which includes the agreed rate, plus any donations to the model)
     
     - the payment methods between HOST & MODEL would be added when the MODEL & HOST setup their profiles. 
       
       - when the model requests payment they would only be able to see common denominator between both HOST and MODEL.
       
       - for example: the HOST my have REVOLUT and PayPal, while the MODEL has Monzon, PayPal. The MODEL would then have the MONZO option removed from the payment request page.
       
       - The bank transfer option is always shown

**For the Model (Model Application):**

4. **Responding to Invitations:**
   
   - Beyond "Accept" or "Decline," are there other responses?
     - Yes a model can decline "Propose Alternative Date,
   - If a Model declines an invitation? No reason is required. It is simply transactional.

5. **Session & Calendar Management:**
   
   - Once Jane Doe accepts a session, how does she view all her *confirmed* upcoming sessions? 
     - Her work schedule is within her Profile dashboard (upcoming session) 
     - and on her a booking calendar which has colored dots for booked session.
   - How does a Model manage their *general availability* that Hosts can see when considering them for a booking? This part of "Model Profile Management" or their calendar tool
   - Also a model can set a general availabilty over a period of time. For example a model from London visits Paris for two weeks. She can set availabilty for her visit in Paris, and become an available model for hosts in Paris.

6. **Purchasable Reference Sets Workflow:**
   
   - Once a Model creates a "Reference Set," how do Artists/Users discover and purchase these? There a "Store" or "Marketplace" for artists (on the public website) and on the models public profile page (like Reddit, eg u/jane-doe)
   - How does the Model track sales or earnings from their reference sets? This is entirely the models responsibility. Until there is a market place feature the model will need to use external platforms like Gumroad.

**General UI/UX Considerations:**

7. **Notifications:**
   
   - How are Hosts notified of new Open Call responses? via Host dashboard (in-app message) and potentially SMS or email (they choose which carriers to get notified on eg. email ONLY)
   - How are Models notified of new Open Calls, job awards, or status changes? similare to host notifications. in-app messages plus prefered message carrier
   - Are there in-app notifications, push notifications, or solely email/SMS/internal messages? I would like push notifications but not sure of the operational cost. in general there will be in-app messages/notifications plus SMS & email.

8. **User Roles & Permissions:**
   
   - The "User" navigation item was renamed.
     - This was a mistake. User management is the global user register, and only available to System Administraors. Hosts, Models and Artists are all Users
     - ONLY Administrators have access to all models, hosts and artist account.
     - A registered User can be a HOST, MODEL and ARTIST (unlikely but possible) these users would have a dashboard divied into those three parts.
   - HOSTS have access to:
     - their events, and session calendars, and messages
     - all model public profiles and model availabilty calendar
     - HOSTS can like, and follow MODELS and ARTISTS
     - HOSTS can rate a MODEL after a booking has been accepted
   - MODELS have access:
     - all their bookings, images and messages
     - to all HOSTS, but can not see who the HOST has booked
     - MODELS can like and follow HOSTs and ARTISTS
     - MODELS can rate a HOST after a booking has been accepted
   - ARTISTS have access:
     - all MODEL and HOST public profiles, they can like and follow them
     - can upload artwork and tag (aka mention) HOST and MODEL
     - if an artist mentions a MODEL with upload artwork, that model can add that image to the MODEL artwork gallery.
