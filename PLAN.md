# Office Management / Workspace Planning Tool — Implementation Plan

## Context

Build a multi-user office management tool for team allocation, space management, desk booking, and management oversight. Uses **Supabase as database only** (Postgres + Realtime) with **custom username/password auth** and admin-managed recovery — no email required. The admin creates users and issues temporary passwords; users must change password on first login. The interactive floor plan visualization will be architected now but rendered later when the user provides an office plan image.

## Tech Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **Supabase** (Postgres database + Realtime subscriptions — **NOT** Supabase Auth)
- **Custom Auth**: Username/password with bcrypt hashing, HTTP-only session cookies
- **TypeScript**, **Tailwind CSS**, **shadcn/ui**
- **Zod** (validation), **date-fns** (dates), **recharts** (charts), **TanStack Table** (data tables)
- **bcrypt** (password hashing), **zxcvbn** (password strength)

## Auth Architecture

Since we're NOT using Supabase Auth, we:
- Use the **Supabase service role key** server-side to bypass RLS (all DB access is server-side via Server Actions/API routes)
- Enforce **all authorization in the application layer** (middleware + server actions check session + role)
- **No client-side Supabase client** for mutations — all writes go through Server Actions
- Client-side Supabase client only used for **Realtime subscriptions** (read-only, using anon key with RLS SELECT policies)

### Auth Flow
1. Admin creates user → generates temp password → gives to user
2. User logs in with username + temp password → forced to change password
3. Session stored as HTTP-only cookie → validated on every request via middleware
4. Password recovery: admin generates new temp password, all sessions invalidated

### Security Features
- bcrypt hashing (12 salt rounds)
- Account lockout after 10 failed attempts (30 min)
- Rate limiting on login (5/15min), password change (3/hr)
- Password strength via zxcvbn (min 12 chars, can't contain username)
- Session invalidation on password change
- Temp passwords expire in 24 hours
- Comprehensive audit logging

## Database Schema

9 tables (auth + office management):

| Table | Purpose | Key Constraints |
|-------|---------|-----------------|
| `users` | User accounts with password hashes | `UNIQUE(username)`, lockout fields |
| `sessions` | Active user sessions | `UNIQUE(token_hash)`, expiry |
| `temp_passwords` | Admin-issued temporary passwords | Expires in 24h |
| `auth_audit_log` | All auth events | Indexed by user + action |
| `teams` | Office teams | Admin-only CRUD |
| `team_members` | User-team join with role | `UNIQUE(team_id, user_id)` |
| `zones` | Office areas allocated to teams | Stores `boundary_path` for floor plan |
| `desks` | Individual desks with position metadata | `pos_x`, `pos_y`, `rotation` for floor plan |
| `bookings` | Desk reservations | `UNIQUE(desk_id, date, time_slot)` + partial index |

**Double-booking prevention**: Postgres unique constraint + partial unique index for full-day bookings. Server Action catches error code `23505`.

**Authorization** (application layer — enforced in every Server Action):
- **Admins**: full access to all operations
- **Team leads**: manage their team's members, desks, bookings
- **Members**: view everything, book desks only in their team's zones
- Every Server Action validates session → checks role → executes query

## File Structure

```
office-management/
├── middleware.ts                        # Session validation + route protection
├── supabase/migrations/                 # SQL schema + seed data
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx           # Username/password login
│   │   │   └── change-password/page.tsx # Forced password change
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx               # Sidebar + header (protected)
│   │   │   ├── dashboard/page.tsx       # Management overview
│   │   │   ├── teams/                   # Team CRUD + members
│   │   │   ├── spaces/                  # Zone management + desk grids
│   │   │   ├── desks/                   # All desks data table
│   │   │   ├── bookings/               # Calendar + my bookings
│   │   │   ├── floor-plan/             # Interactive view (placeholder)
│   │   │   ├── admin/                  # Admin panel (user mgmt, audit log)
│   │   │   └── settings/              # User profile + change password
│   │   └── api/
│   │       └── auth/                   # Auth API routes (login, logout)
│   ├── actions/                        # Server Actions
│   │   ├── auth.ts                     # login, changePassword, admin user creation
│   │   ├── admin.ts                    # createUser, resetPassword, unlock, disable
│   │   ├── teams.ts                    # CRUD teams
│   │   ├── team-members.ts            # add/remove members, change roles
│   │   ├── zones.ts                    # CRUD zones, team allocation
│   │   ├── desks.ts                    # CRUD desks
│   │   └── bookings.ts               # bookDesk, cancelBooking
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── password.ts            # bcrypt hash/verify + validation (zxcvbn)
│   │   │   ├── session.ts             # Create/validate/revoke sessions
│   │   │   ├── middleware.ts           # getSession() helper for middleware
│   │   │   └── rate-limit.ts          # In-memory rate limiter
│   │   ├── db/
│   │   │   ├── client.ts              # Supabase service-role client (server only)
│   │   │   ├── realtime.ts            # Supabase anon client (client, read-only)
│   │   │   └── types.ts               # DB type definitions
│   │   ├── validators/                 # Zod schemas per entity
│   │   ├── utils.ts                    # cn(), date formatters
│   │   ├── constants.ts               # Time slots, roles
│   │   └── hooks/
│   │       ├── use-realtime-bookings.ts
│   │       ├── use-session.ts         # Client-side session context
│   │       └── use-permissions.ts
│   └── components/
│       ├── ui/                         # shadcn/ui primitives
│       ├── layout/                     # Sidebar, Header, Breadcrumbs
│       ├── auth/                       # LoginForm, ChangePasswordForm, UserMenu
│       ├── admin/                      # UserList, CreateUserDialog, ResetPasswordDialog, AuditLog
│       ├── dashboard/                  # StatsCards, Charts, RecentBookings
│       ├── teams/                      # TeamCard, TeamForm, MemberList
│       ├── spaces/                     # ZoneCard, ZoneForm, DeskGrid
│       ├── desks/                      # DeskCard, DeskTable, StatusBadge
│       ├── bookings/                   # BookingCalendar, BookingDialog, TimeSlotPicker
│       └── floor-plan/                # Placeholder + future Canvas/SVG components
```

## Implementation Phases

### Phase 1: Foundation + Auth System
- Initialize Next.js 15 + Tailwind + shadcn/ui
- Set up Supabase service-role client (server) + anon client (realtime)
- Create SQL migrations (all 9 tables, indexes, triggers)
- Implement bcrypt password hashing + zxcvbn validation
- Implement session management (create, validate, revoke via HTTP-only cookies)
- Build middleware for session validation + route protection
- Build login page, forced password change page
- Build dashboard shell layout (sidebar, header)
- **Seed an initial admin user** via SQL migration

### Phase 2: Admin Panel
- Server Actions for user management (create user, reset password, unlock, disable/enable)
- Pages: `/admin/users` (list), create user dialog, reset password dialog
- Audit log viewer: `/admin/audit-log`
- Rate limiting on auth endpoints

### Phase 3: Team Management
- Server Actions for team CRUD + member management
- Pages: `/teams` (list), `/teams/[teamId]` (detail with members)
- Components: TeamCard, TeamForm, TeamMemberList, AddMemberDialog

### Phase 4: Spaces & Desks
- Server Actions for zone CRUD (with team allocation) + desk CRUD
- Pages: `/spaces`, `/spaces/[zoneId]`, `/desks`
- Components: ZoneCard, ZoneForm, DeskGrid, DeskTable
- Desk form includes position metadata for future floor plan

### Phase 5: Booking System
- Server Action `bookDesk` with unique constraint conflict handling + role checks
- Real-time subscription hook for live booking updates
- Pages: `/bookings` (calendar), `/bookings/my` (personal bookings)
- Components: BookingCalendar (week/day), BookingDialog, TimeSlotPicker
- Color-codes: available (green), my booking (blue), others (gray), unavailable (red)

### Phase 6: Management Dashboard
- Aggregate queries for occupancy stats
- Components: StatsCards, OccupancyChart, RecentBookings, TeamDistribution
- Role-based rendering

### Phase 7: Floor Plan Placeholder & Polish
- FloorPlanPlaceholder with instructions
- SVG skeleton for future FloorPlanCanvas
- Responsive design pass, error/loading/empty states, accessibility

## Verification

1. **Auth**: Admin creates user → user logs in with temp password → forced to change → can access dashboard
2. **Lockout**: 10 failed attempts → account locked → admin unlocks → user can login
3. **Session**: Login in two browsers → change password → both sessions invalidated
4. **Permissions**: Member tries admin action → rejected. Team lead manages own team only.
5. **Booking**: Book desk → attempt same desk/date → DB rejects duplicate
6. **Realtime**: Two tabs open → book in one → other updates instantly
7. **Responsive**: Test at mobile/tablet/desktop widths
8. Run `npm run build` to verify no errors

## Prerequisites (User Action Required)

1. Create a Supabase project at https://supabase.com
2. Provide `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run the SQL migrations in the Supabase SQL editor
4. The initial admin account will be seeded via migration (username: `admin`, temp password displayed in console)
