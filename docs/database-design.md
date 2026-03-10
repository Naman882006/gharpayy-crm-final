# Database Design

## Leads

Stores customer inquiries.

Fields:

* id
* name
* phone
* email
* source
* budget
* preferred_location
* assigned_agent_id
* status
* created_at

---

## Visits

Tracks property visits.

Fields:

* id
* lead_id
* property_id
* assigned_staff_id
* scheduled_at
* outcome
* confirmed

---

## Bookings

Stores confirmed property reservations.

Fields:

* id
* lead_id
* property_id
* status
* created_at

---

## Lead Activity

Logs CRM events.

Fields:

* id
* lead_id
* type
* message
* created_by
* created_at
