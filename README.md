# Gharpayy CRM – Lead Management System

A production-oriented CRM MVP built for Gharpayy to capture leads, manage visit scheduling, and convert leads into bookings for PG accommodations.

## 🚀 Features

* Automated Lead Capture
* Round Robin Lead Assignment
* Lead Pipeline Management
* Visit Scheduling
* Visit Outcome Tracking
* Booking Conversion Workflow
* Dashboard Analytics
* Activity Timeline
* Follow-up Reminder System

---

## 🏗 System Architecture

Frontend:

* React
* TypeScript
* Vite
* TailwindCSS
* shadcn/ui
* TanStack Query

Backend:

* Supabase
* PostgreSQL
* Row Level Security
* RPC functions

---

## 📊 CRM Workflow

Lead Created
↓
Lead Assigned to Agent
↓
Visit Scheduled
↓
Visit Confirmed
↓
Visit Outcome Recorded
↓
Lead Converted to Booking

---

## 🗄 Database Design

Main tables used:

```
leads
visits
agents
properties
bookings
lead_activity
follow_up_reminders
```

Relationships:

* One Lead → Many Visits
* One Visit → One Property
* One Visit → One Booking

---

## ⚙ Setup Instructions

Clone repo:

```
git clone https://github.com/Naman882006/gharpayy-crm-final
```

Install dependencies:

```
npm install
```

Run development server:

```
npm run dev
```

---

## 🔒 Production Notes

While testing the CRM, lead creation may fail due to Supabase Row Level Security policies.

In production environments authenticated agents should be allowed to insert leads.

Example policy:

```
create policy "agents_can_insert_leads"
on leads
for insert
to authenticated
with check (true);
```

---

## 🧠 Improvements Implemented

To move the CRM closer to production readiness the following improvements were added:

* Transactional visit outcome workflow
* Lead activity timeline
* Follow-up reminder system
* Improved error handling
* Type-safe Supabase queries

---

## 📸 Screenshots

Dashboard
Visits Pipeline
Booking Conversion Workflow

(see screenshots folder)

---

## 👨‍💻 Author

Naman Sharma
