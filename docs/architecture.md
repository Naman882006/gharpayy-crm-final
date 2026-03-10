# System Architecture

The CRM follows a modern full-stack architecture.

Frontend:
React + TypeScript SPA built with Vite.

State Management:
TanStack Query for server state synchronization.

Backend:
Supabase provides database, authentication, and APIs.

Database:
PostgreSQL with relational tables for leads, visits, bookings, and agents.

Security:
Row Level Security policies restrict access to authorized users.

Workflow Logic:
Visit outcome triggers lead conversion and booking creation.
