# REVERSE — Collection Booking & Operations Dashboard

Full-stack assignment submission built with **Next.js 14** (frontend) and **NestJS** (backend), backed by **MongoDB** via Mongoose.

---

## Table of Contents

1. [Setup Instructions](#1-setup-instructions)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Database Design](#3-database-design)
4. [Trade-offs & What I Would Improve](#4-trade-offs--what-i-would-improve)
5. [AI Usage Declaration](#5-ai-usage-declaration)

---

## 1. Setup Instructions

### Prerequisites

- Node.js 18+
- A MongoDB connection string (MongoDB Atlas free tier works)

### Step 1 — Clone and configure

```bash
git clone https://github.com/Vanshgg33/Reverse_dashboard.git
cd vansh
```

Create `backend/.env` by copying the example:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and paste your MongoDB connection string:

```
DATABASE_URL="mongodb+srv://hariguptax1_db_user:yaJKUDWTmdFjvNY7@cluster0.xsfv7e3.mongodb.net/whatsapp-store?retryWrites=true&w=majority"
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Step 2 — Install and start the backend

```bash
cd backend
npm install
npm run start     # starts on http://localhost:3001
```

Swagger API docs available at: **http://localhost:3001/api/docs**

### Step 3 — Install and start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev           # starts on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

### Available npm scripts

| Directory | Script | What it does |
|-----------|--------|--------------|
| `backend` | `npm run start` | Start API in watch mode |
| `backend` | `npm run build` | Compile TypeScript to `dist/` |
| `frontend` | `npm run dev` | Start Next.js dev server |
| `frontend` | `npm run build` | Build for production |
| `frontend` | `npm run start` | Serve production build |

---

## 2. Architecture Decisions

### Project Structure

```
vansh/
├── backend/                   NestJS REST API (port 3001)
│   ├── src/
│   │   ├── bookings/
│   │   │   ├── schemas/       Mongoose schemas — source of truth for types and enums
│   │   │   ├── dto/           Request validation (class-validator)
│   │   │   ├── bookings.service.ts     All DB operations and business logic
│   │   │   └── bookings.controller.ts  HTTP routing only — no logic
│   │   ├── dashboard/
│   │   │   ├── dashboard.service.ts    Aggregation queries
│   │   │   └── dashboard.controller.ts
│   │   ├── common/filters/    Global HTTP exception filter
│   │   ├── app.module.ts      Root module — registers MongoDB connection
│   │   └── main.ts            Bootstrap — CORS, validation pipe, Swagger
│   └── seed.ts                Standalone seed script (plain Mongoose)
└── frontend/                  Next.js 14 App Router (port 3000)
    └── src/
        ├── app/               File-system routing
        │   ├── page.tsx               → /
        │   ├── bookings/new/page.tsx  → /bookings/new
        │   └── bookings/[id]/page.tsx → /bookings/:id
        ├── components/
        │   ├── dashboard/     MetricsCard, BookingsTable, StatusBadge, DashboardPage
        │   ├── bookings/      BookingForm, BookingDetail, ActivityTimeline, AssignModal
        │   ├── layout/        Sidebar
        │   └── providers/     React Query provider
        ├── lib/api.ts         Centralised fetch client — only file that calls the backend
        └── types/index.ts     TypeScript types mirroring the backend shapes
```

### Why NestJS

NestJS enforces a module-controller-service separation by design. Controllers handle routing only; services own all business logic and database access. This makes it easy to test the service in isolation, and easy for anyone reading the code to know exactly where to look for any piece of logic.

### Why Mongoose

Mongoose works on any MongoDB deployment without configuration — `Promise.all` for parallel reads and `.save()` for individual writes covers all the use cases in this project. Mongoose schemas also serve as the TypeScript type source directly, with no code-generation step required.

### Why Next.js App Router

The App Router allows co-locating server and client concerns cleanly. `layout.tsx` mounts the sidebar and React Query provider once — navigation between pages is instant because the shell never re-renders. Dynamic routes (`[id]`) pass params directly to components without additional routing config.

### Why React Query

Server state (data from the API) is fundamentally different from local UI state. React Query manages caching, background refetching, loading states, and cache invalidation after mutations — all without manual `useState + useEffect + fetch` boilerplate. After any mutation (create, assign, status update), the relevant caches are invalidated so the UI updates automatically.

### Separation of Concerns

The frontend and backend share no code. Types are duplicated in `frontend/src/types/index.ts`. This is intentional — it allows the two services to be deployed and versioned independently. If the API response shape changes, the TypeScript compiler flags the mismatch in the frontend immediately.

### API Design Decisions

- Global prefix `/api` on all routes — clean separation from any future static assets
- `ValidationPipe` with `whitelist: true` strips unknown fields; `forbidNonWhitelisted: true` rejects requests with extra fields
- All errors go through `HttpExceptionFilter`, which normalises them to `{ statusCode, timestamp, path, method, message }` regardless of where they were thrown
- `Promise.all` used for all parallel reads — avoids the replica-set requirement for transactions
- Status transitions enforced server-side as an explicit state machine — the client cannot set an arbitrary status

---

## 3. Database Design

### Collections

#### `bookings`

Stores every collection request. One document per booking.

```
{
  _id:                     ObjectId   (auto-generated, exposed as "id" string in API)
  customerName:            String     required
  phoneNumber:             String     required
  email:                   String     required
  address:                 String     required
  collectionType:          String     enum: HOUSEHOLD | APARTMENT | OFFICE | RETAIL_STORE | RESTAURANT_CAFE
  estimatedPackageCount:   Number     required, 1–10000
  preferredCollectionDate: Date       required
  notes:                   String     optional
  status:                  String     enum: PENDING | ASSIGNED | COLLECTED | CANCELLED  default: PENDING
  isHighPriority:          Boolean    auto-set to true if estimatedPackageCount > 100
  agentName:               String     null until assigned
  vehicleId:               String     null until assigned
  createdAt:               Date       auto (timestamps: true)
  updatedAt:               Date       auto (timestamps: true)
}
```

**Indexes:**
- `{ status: 1 }` — fast filtering by status (dashboard counts, table filter)
- `{ collectionType: 1 }` — fast filtering by type (table filter, breakdown chart)
- `{ isHighPriority: 1 }` — fast isolation of priority queue
- `{ createdAt: -1 }` — default sort (newest first)

#### `bookingactivities`

Append-only audit log. One document per event. Never updated or deleted.

```
{
  _id:       ObjectId   auto
  bookingId: ObjectId   reference to bookings._id, indexed
  event:     String     BOOKING_CREATED | ASSIGNED_TO_AGENT | STATUS_UPDATED | BOOKING_CANCELLED
  description: String   human-readable sentence
  metadata:  Object     arbitrary context (e.g. { agentName, vehicleId } or { from, to })
  createdAt: Date       auto (timestamps: { createdAt: true, updatedAt: false })
}
```

**Index:**
- `{ bookingId: 1 }` — fast lookup of all events for a booking

### Why activities are a separate collection

Embedding activities inside the booking document would cause the document to grow unboundedly. MongoDB reads the entire document even if you only need the booking fields. Keeping activities separate means:

1. Booking documents stay small and fast to read in list queries
2. Activity history can be queried independently
3. The booking record is the current state; the activity collection is the full history

Activities are only fetched when a user opens a booking detail page (`GET /bookings/:id`). The list endpoint (`GET /bookings`) does not load activities.

### Schema Relationships

```
bookings (1) ──────────────── (many) bookingactivities
              bookingactivities.bookingId → bookings._id
```

This is a one-to-many reference relationship. There are no joins — when the detail page loads, two queries run in parallel: one for the booking, one for its activities, merged in the service layer before the response is sent.

### Status State Machine

```
PENDING ──► ASSIGNED ──► COLLECTED  (terminal)
   │            │
   └────────────┴──────► CANCELLED  (terminal)
```

COLLECTED and CANCELLED are terminal — no further transitions are allowed. Enforced in `bookings.service.ts` via a transition map checked before every status update.

---

## 4. Trade-offs & What I Would Improve

### Decisions made to stay within scope

**No authentication.** The dashboard is fully open. In production, operations staff would authenticate (JWT or session-based), and booking creation could be public-facing or rate-limited. Adding auth would require an `auth` module, guards on dashboard/assign routes, and a `users` collection.

**No file uploads.** Real collections might include photos of packaging. That would require object storage (S3 or similar) and a field on the booking document for the URL.

**No real-time updates.** The dashboard polls every 30 seconds via React Query's `refetchInterval`. In production, WebSockets or Server-Sent Events would push updates to all operations staff simultaneously, which is important when multiple agents are working concurrently.

**Simple search.** The current `$regex` search works but is not indexed — on a large collection it would do a full scan. A proper implementation would use MongoDB Atlas Search (built on Lucene) for full-text indexing with relevance ranking.

**No soft deletes.** Cancelled bookings remain in the collection. A production system might want to archive them to a separate collection after a retention period.

### What I would improve with more time

1. **Authentication & RBAC** — separate roles for delivery agents (can view and update their assigned bookings only), operations staff (can assign/update all bookings), and admin (can see all reports and manage users)
2. **Customer notifications** — no email or SMS is sent when a booking status changes. A real system would notify the customer at each step (assigned, out for collection, collected), requiring an integration with a service like SendGrid or Twilio
3. **Optimistic updates** — update the UI immediately on mutation and roll back on error, rather than waiting for the server round-trip
4. **End-to-end tests** — Playwright tests covering the critical paths (create booking, assign, mark collected)
5. **Unit tests on the service layer** — mock the Mongoose models to test status transition logic and high-priority detection in isolation
6. **Rate limiting** — `@nestjs/throttler` on the create booking endpoint to prevent abuse
7. **Pagination on activities** — for very active bookings with many status changes, the timeline should paginate

---

## 5. AI Usage Declaration

### Tools used

- **Anti-gravity** — primary AI tool used throughout the assignment

### Where AI assistance was used

AI assistance was used across the project, most notably for the **frontend components** — scaffolding the initial structure of each component, writing Tailwind classes, and wiring up React Query hooks.

On the **backend**, the API endpoints were written with AI assistance for structure and syntax, but the logic behind each endpoint — the business rules, service methods, status state machine, aggregation queries, and error handling — was manually designed and written. AI served as a syntax aid, not a logic author.

### What was investigated and solved manually

Three significant problems required independent investigation and were not resolved by AI assistance:

#### 1. Dashboard loading performance

The dashboard was initially loading very slowly. The root cause was that aggregation queries for metrics (total bookings, status counts, type breakdown) were running sequentially — each query waited for the previous one to finish before starting. This was fixed by converting the dashboard service to use `Promise.all` so all aggregation queries execute in parallel, reducing response time from several seconds to a single round-trip.

#### 2. Booking screen update delay after creation

After creating a new booking, the booking list screen was taking 4–5 seconds to reflect the new entry. This was tracked down to React Query's cache not being invalidated promptly after the mutation completed — the query was stale but the refetch interval had not yet fired. The fix required explicitly calling `queryClient.invalidateQueries` with the correct query key immediately on mutation success, so the UI updates without waiting for the background polling interval.

#### 3. Activity timeline not showing (MongoDB v8 compatibility issue)

The booking detail page was rendering an empty activity timeline even when activities existed in the database. After debugging, the root cause was a breaking change in **MongoDB version 8**: the aggregation pipeline operator used to look up activities by `bookingId` was not matching documents correctly because of a change in how MongoDB 8 handles ObjectId comparisons in `$lookup` / `$match` stages.

The fix required explicitly casting the `bookingId` field using `new Types.ObjectId(id)` before passing it to the query, rather than relying on Mongoose's implicit coercion — which worked in earlier MongoDB versions but no longer behaves the same way in version 8. Once the cast was made explicit, the activity timeline populated correctly.
