# ISO Tracker - System Architecture Documentation

## Executive Summary

ISO Tracker is a Progressive Web Application (PWA) for evidence-based analysis of interstellar objects. Built with Next.js 14, Supabase (PostgreSQL), and deployed on Vercel, the platform enables community-driven scientific analysis through tier-gated features and real-time collaboration.

**Core Architecture**:
- **Frontend**: Next.js 14 App Router with React Server Components
- **Backend**: Supabase (PostgreSQL + Auth + Row-Level Security)
- **Email**: Resend with React Email templates
- **Analytics**: PostHog (privacy-first, no PII)
- **Error Monitoring**: Sentry (client, server, edge)
- **Hosting**: Vercel with automatic SSL and global CDN

**Current Status**: Production Ready - Sprint 5 Complete (2025-11-15)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ISO Tracker Platform                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐         ┌──────────────────────────┐     │
│  │  Next.js 14 Frontend │◄───────►│    Supabase Backend      │     │
│  │                      │  REST   │                          │     │
│  │  - App Router (RSC)  │   +     │  - PostgreSQL + RLS      │     │
│  │  - TypeScript        │  Real   │  - Authentication (JWT)  │     │
│  │  - Tailwind CSS      │  time   │  - Edge Functions        │     │
│  │  - PWA (next-pwa)    │         │  - Storage               │     │
│  └──────────────────────┘         └──────────────────────────┘     │
│             │                                   │                   │
│             ▼                                   ▼                   │
│  ┌──────────────────────┐         ┌──────────────────────────┐     │
│  │   Vercel Edge CDN    │         │   Database Schema        │     │
│  │   - Global delivery  │         │   - profiles             │     │
│  │   - Service workers  │         │   - subscriptions        │     │
│  │   - Offline caching  │         │   - iso_objects          │     │
│  └──────────────────────┘         │   - evidence             │     │
│                                   │   - evidence_assessments │     │
│                                   │   - notification_prefs   │     │
│                                   │   - moderation_flags     │     │
│                                   └──────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘

External Services:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ NASA Horizons│  │   Resend     │  │   PostHog    │  │   Sentry     │
│ - Ephemeris  │  │ - Email API  │  │ - Analytics  │  │ - Errors     │
│ - Trajectory │  │ - Templates  │  │ - Events     │  │ - Performance│
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Database Architecture

### Core Tables

```sql
-- User Management
profiles (id, email, display_name, avatar_url, bio, created_at, updated_at)
subscriptions (id, user_id, tier, status, stripe_customer_id, created_at)

-- ISO Data
iso_objects (id, name, designation, discovery_date, discoverer, eccentricity, ...)
iso_horizons_cache (id, iso_object_id, coordinate_type, raw_data, cached_at, expires_at)

-- Evidence Framework (Core Differentiator)
evidence (id, iso_object_id, submitter_id, evidence_type, title, description, methodology, source_url, quality_score)
evidence_assessments (id, evidence_id, assessor_id, expertise_score, methodology_score, peer_review_score, overall_score)

-- Collaboration
debate_threads (id, iso_object_id, author_id, title, content, created_at)
thread_replies (id, thread_id, author_id, content, parent_reply_id, created_at)
votes (id, votable_type, votable_id, user_id, vote_type)
arguments (id, iso_object_id, user_id, title, content, position)

-- Notifications
notification_preferences (id, user_id, email, unsubscribe_token, reply_notifications, evidence_notifications, observation_window_alerts)
iso_follows (id, user_id, iso_object_id, created_at)
notification_queue (id, type, recipient_id, payload, status, created_at)
notification_rate_limits (id, user_id, notification_type, count, window_start)

-- Moderation
moderation_flags (id, content_type, content_id, reporter_id, reason, status, created_at)
moderation_actions (id, flag_id, admin_id, action_type, notes, created_at)
```

### Evidence Quality Scoring Algorithm

```sql
Quality Score = (Expertise Factor + Methodology Factor + Peer Review Factor)

Expertise Factor (0-40 points):
- Event Pass tier: 20 points (base contributor)
- Evidence Analyst tier: 40 points (expert contributor)

Methodology Factor (0-30 points):
- Average of methodology_scores from all assessments
- 0 points if no assessments yet

Peer Review Factor (0-30 points):
- Average of peer_review_scores from all assessments
- 0 points if no assessments yet

Total: 0-100 (integer, transparent algorithm)
```

### User Tier System

| Tier | Cost | Evidence Submission | Evidence Assessment | Observation Alerts | Admin Access |
|------|------|--------------------|--------------------|-------------------|--------------|
| Guest (Free) | $0 | View only | No | No | No |
| Event Pass | $4.99/mo | View only | No | Yes | No |
| Evidence Analyst | $19/mo | Unlimited | Yes | Yes | No |
| Admin | Internal | Unlimited | Yes | Yes | Yes |

### Row-Level Security (RLS)

All tables have RLS enabled with policies enforcing:
- Users can only read/write their own data (profiles, subscriptions)
- Tier-based access for evidence submission and assessment (Evidence Analyst only)
- Admin-only access for moderation actions (database-level role check)
- Public read access for ISO data, evidence, and community content

---

## Application Architecture

### Frontend Structure

```
apps/web/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx               # Root layout with metadata, PWA config
│   ├── page.tsx                 # Landing page
│   ├── auth/                    # Authentication pages
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── actions.ts          # Server actions for auth
│   ├── dashboard/page.tsx       # User dashboard
│   ├── isos/[id]/page.tsx      # ISO detail with evidence dashboard
│   ├── guidelines/page.tsx      # Community guidelines
│   ├── settings/notifications/  # Notification preferences
│   ├── admin/                   # Admin dashboard
│   │   ├── moderation/page.tsx # Content moderation queue
│   │   └── users/page.tsx      # User management
│   ├── api/                     # API Route Handlers
│   │   ├── evidence/route.ts   # Evidence CRUD
│   │   ├── comments/route.ts   # Comments + reply notifications
│   │   ├── notifications/      # Notification management
│   │   ├── admin/              # Admin APIs (role-protected)
│   │   └── cron/               # Vercel Cron jobs
│   ├── not-found.tsx           # Custom 404
│   ├── error.tsx               # Error boundary
│   ├── global-error.tsx        # Root error boundary
│   └── sitemap.ts              # Dynamic sitemap generation
│
├── components/
│   ├── admin/AdminGuard.tsx    # Role-based access control
│   ├── isos/FollowButton.tsx   # Follow ISO for alerts
│   └── header.tsx              # Main navigation
│
├── lib/
│   ├── supabase/server.ts      # Server-side Supabase client
│   ├── supabase/client.ts      # Client-side Supabase client
│   ├── analytics/posthog.ts    # PostHog tracking functions
│   ├── analytics/provider.tsx  # Analytics context provider
│   ├── notifications/helpers.ts # Rate limiting, JWT tokens
│   ├── emails/send.ts          # Resend email wrapper
│   ├── emails/templates/       # React Email templates
│   │   ├── ReplyNotification.tsx
│   │   ├── EvidenceNotification.tsx
│   │   └── ObservationWindowAlert.tsx
│   └── nasa/horizons.ts        # NASA API client (350+ lines)
│
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── offline.html            # Offline fallback page
│   ├── robots.txt              # SEO crawler config
│   └── icons/                  # App icons (192x192, 512x512)
│
├── sentry.client.config.ts     # Client error monitoring
├── sentry.server.config.ts     # Server error monitoring
├── sentry.edge.config.ts       # Edge function monitoring
├── next.config.js              # PWA + security headers + optimizations
└── tailwind.config.ts          # Design system
```

### API Routes

| Endpoint | Method | Purpose | Auth Required | Tier Restriction |
|----------|--------|---------|---------------|------------------|
| `/api/evidence` | POST | Submit new evidence | Yes | Event Pass+ |
| `/api/comments` | POST | Add comment + notify | Yes | Any |
| `/api/notifications/preferences` | GET/PATCH | Manage email preferences | Yes | Any |
| `/api/notifications/unsubscribe` | GET/POST | Token-based unsubscribe | No | Any |
| `/api/admin/moderation` | GET/POST | Content moderation | Yes | Admin |
| `/api/admin/users` | GET/PATCH | User management | Yes | Admin |
| `/api/admin/health` | GET | System health metrics | Yes | Admin |
| `/api/cron/observation-windows` | GET | Daily alert cron | CRON_SECRET | System |

### Authentication Flow

```
1. User signs up (email/password)
   │
   ├──> Supabase Auth creates user in auth.users
   │
   └──> Application creates records (apps/web/app/auth/actions.ts):
        ├──> profiles (user info, display name)
        ├──> subscriptions (default: guest tier, active status)
        └──> notification_preferences (defaults enabled, unsubscribe token)

2. User signs in
   │
   ├──> Supabase Auth issues JWT token
   │
   └──> RLS policies enforce tier-based access automatically

3. Tier upgrades (Stripe - NOT YET IMPLEMENTED)
   │
   └──> Update subscriptions.tier → RLS policies grant new access
```

**Important**: User records are created in application code, NOT database triggers. Supabase doesn't reliably support custom triggers on `auth.users` due to schema isolation.

---

## Email Notification System

### Architecture

```
Event Trigger → API Route → Email Service → User Inbox
                    │
                    ├─ Check notification_preferences
                    ├─ Check rate limits (tier-based)
                    ├─ Render React Email template
                    └─ Send via Resend API
```

### Email Types

1. **Reply Notifications**: When someone replies to user's comment
2. **Evidence Notifications**: When new evidence submitted for followed ISO
3. **Observation Window Alerts**: Daily cron for upcoming observation windows

### Rate Limits (24-hour window)

| Tier | Reply | Evidence | Observation |
|------|-------|----------|-------------|
| Guest | 10/day | 5/day | 0 (N/A) |
| Event Pass | 50/day | 25/day | 10/day |
| Evidence Analyst | 200/day | 100/day | 50/day |

### Security

- JWT unsubscribe tokens (90-day expiry)
- CRON_SECRET bearer token for scheduled jobs
- HTML sanitization on all email content
- Triple-layer tier validation (DB + API + UI)

---

## PWA & Offline Architecture

### Service Worker Strategy (next-pwa)

```javascript
// Runtime caching rules in next.config.js
{
  urlPattern: /\/api\/iso-objects.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'iso-data',
    expiration: {
      maxEntries: 16,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days per PRD Section 5.7
    },
  },
}
```

### Cache Strategy by Content Type

| Content | Strategy | TTL | Rationale |
|---------|----------|-----|-----------|
| ISO Objects | NetworkFirst | 7 days | Data changes slowly, offline viewing critical |
| Evidence | NetworkFirst | 7 days | Same as above |
| User Data | NetworkFirst | 24 hours | More dynamic, needs freshness |
| Static Assets | CacheFirst | 1 year | Immutable (versioned filenames) |
| HTML Pages | NetworkFirst | - | Always try network first |

### Offline Fallback

`/public/offline.html` provides:
- Branded offline page with ISO Tracker styling
- Auto-reconnect detection (checks connectivity every 5 seconds)
- Guidance to revisit cached content

---

## Analytics & Monitoring

### PostHog (Privacy-First Analytics)

**Configuration** (`/lib/analytics/posthog.ts`):
- No PII stored
- Session recording disabled
- User ID only (no email, no IP)
- EU hosting compliant

**Key Events Tracked**:
```typescript
trackEvent('user_signup', { source: 'organic' })
trackEvent('evidence_submit', { iso_object_id, evidence_type })
trackEvent('iso_follow', { iso_object_id })
trackEvent('tier_upgrade', { from_tier, to_tier })
trackEvent('page_view', { path })
```

### Sentry (Error Monitoring)

**Configuration**:
- Client-side: Browser errors, React error boundaries
- Server-side: API route errors, database failures
- Edge: Edge function errors

**Privacy Filtering**:
```typescript
beforeSend(event) {
  if (event.user) {
    delete event.user.email
    delete event.user.ip_address
  }
  return event
}
```

### Security Headers

```javascript
// next.config.js
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]
```

---

## Admin Moderation System

### Architecture

```
User reports content → moderation_flags table
                            │
Admin reviews queue ────────┘
                            │
Admin takes action → moderation_actions table (append-only audit log)
                            │
                      ┌─────┴─────┐
                      │           │
                  Approve      Remove/Ban
```

### Security

- `check_admin_role()` - SECURITY DEFINER function validates admin status
- `log_moderation_action()` - Audit trail helper
- RLS policies: Users flag, only admins view/update
- Append-only audit log (NO UPDATE/DELETE on moderation_actions)
- Admin protection: Cannot suspend/ban other admins

### Features

- Content moderation queue (evidence, comments, arguments)
- User management (suspend, ban, change tiers)
- System health monitoring (user growth, content stats)
- Full audit trail of all moderation actions

---

## Performance Architecture

### Targets

- **Page Load**: <3 seconds (Lighthouse Performance >90)
- **API Response**: <200ms (p95)
- **Offline Capability**: 7-day cache for core data
- **First Contentful Paint**: <1.8s
- **Cumulative Layout Shift**: <0.1

### Optimizations Implemented

**Frontend**:
- React Server Components (reduced client JS)
- Next.js Image optimization (AVIF, WebP)
- Font optimization via Tailwind (no external font loading)
- CSS performance utilities (loading skeletons, CLS prevention)
- Code splitting (automatic route-based)

**Backend**:
- PostgreSQL indexes on frequently queried columns
- Connection pooling via Supabase (PgBouncer)
- NASA API caching (24-hour TTL)
- Row-Level Security (database-level authorization, no round trips)

**Infrastructure**:
- Vercel Edge CDN (global distribution)
- Compression enabled
- Security headers (no-sniff, HSTS)
- Service worker caching

---

## Repository Structure

```
ISOTracker/
├── apps/web/                    # Next.js application
├── database/migrations/         # SQL migration files
│   ├── 002_iso_horizons_cache.sql
│   ├── 003_seed_isos.sql
│   ├── 004_evidence_framework.sql
│   ├── 006_debate_threads.sql
│   ├── 007_email_notifications.sql
│   └── 008_admin_moderation.sql
├── supabase/migrations/         # Copy for Supabase CLI
├── docs/                        # Documentation
│   ├── architecture/            # Architecture decisions
│   ├── testing/                 # Test checklists
│   └── sprints/                 # Sprint summaries
├── foundation/                  # PRD and business docs
├── .claude/                     # AGENT-11 configuration
├── CLAUDE.md                    # Development guidelines
├── architecture.md              # This file
├── project-plan.md             # Sprint roadmap
├── progress.md                  # Changelog and lessons learned
├── vercel.json                  # Vercel cron configuration
└── package.json                 # Workspace root
```

---

## Deployment Architecture

### Environments

| Environment | URL | Database | Purpose |
|-------------|-----|----------|---------|
| Development | localhost:3003 | Supabase dev | Local development |
| Production | TBD (Sprint 6) | Supabase prod | Live users |

### CI/CD Pipeline

```
Git Push → GitHub Actions → Vercel Auto-Deploy
              │
              ├─ Lint (ESLint)
              ├─ Type Check (TypeScript)
              ├─ Build (Next.js production)
              └─ Deploy to Vercel
```

### Environment Variables

**Required for Production** (Sprint 6):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email (Resend)
RESEND_API_KEY=re_...

# Security
JWT_SECRET=<64-byte-hex>
CRON_SECRET=<32-byte-hex>

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# App
NEXT_PUBLIC_APP_URL=https://iso-tracker.app
```

---

## What's NOT Built Yet

The following were in the original architecture but are NOT implemented:

1. **Stripe Integration** - Products not created, no checkout flow
2. **Discord Integration** - Bot not built, no role sync
3. **Sky Map Visualization** - No 2D/3D trajectory rendering
4. **News Feed CMS** - No article management
5. **Zustand State Management** - Using React Server Components instead
6. **Educational Content Library** - Phase 2 feature
7. **API Access for Researchers** - Phase 4 feature
8. **Rate Limiting** - Implemented for emails only, not API routes

---

## Security Architecture Summary

### Defense in Depth

1. **Database Layer**: RLS policies enforce all access control
2. **API Layer**: Authentication checks + Zod input validation
3. **Application Layer**: Role guards + tier checks in UI
4. **Infrastructure Layer**: HTTPS, security headers, CSP

### Critical Security Rules

- **NEVER** bypass RLS policies - all data access goes through Supabase client
- **NEVER** use `unsafe-inline` in CSP (nonces for inline scripts)
- **NEVER** store payment info (Stripe handles PCI compliance)
- **NEVER** create database triggers on `auth.users` (use application code)
- **ALWAYS** verify Stripe webhook signatures before processing
- **ALWAYS** validate and sanitize user input (Zod schemas, DOMPurify)

---

## Technical Debt

1. **No Test Coverage** - 0% unit tests, 0% E2E tests (need Jest + Playwright)
2. **Manual QA Only** - No automated testing in CI/CD
3. **Missing Stripe Integration** - Revenue blocked until implemented
4. **Placeholder Icons** - Need actual PNG icons for PWA
5. **No Rate Limiting on APIs** - Only email notifications rate limited
6. **Hardcoded Strings** - Some tier names hardcoded, not centralized

---

## Architecture Decisions

### ADR-001: PostgreSQL over Firestore
**Decision**: Use Supabase (PostgreSQL) instead of Firebase (Firestore)
**Rationale**: Complex JOINs for evidence framework, RLS for tier access, materialized views for consensus, predictable pricing

### ADR-002: Application-Level User Creation
**Decision**: Create user records (profile, subscription, notification_preferences) in application code, not database triggers
**Rationale**: Supabase doesn't support reliable triggers on auth.users, better error handling, explicit control flow

### ADR-003: Resend + React Email for Notifications
**Decision**: Use Resend API with React Email templates
**Rationale**: Developer-friendly API, React component templates, reliable delivery, generous free tier (100 emails/day)

### ADR-004: PostHog over Google Analytics
**Decision**: Use PostHog for analytics
**Rationale**: Privacy-first (no PII), EU compliant, open-source option, custom event tracking, no cookie consent required

### ADR-005: next-pwa for Service Workers
**Decision**: Use next-pwa package instead of manual service worker
**Rationale**: Zero-config PWA, automatic caching strategies, Workbox under the hood, maintainable

### ADR-006: Monorepo with Turborepo
**Decision**: Single repo with apps/web and database/migrations
**Rationale**: Solo developer efficiency, shared types, atomic commits, single CI workflow

---

## Future Roadmap

### Sprint 6 (Next)
- Production deployment
- Domain configuration
- Environment setup
- Analytics/monitoring activation

### Phase 2 (Future)
- Stripe payment integration
- Educational content library
- 3D trajectory visualization

### Phase 3 (Future)
- In-app community (replace Discord)
- Observation logging
- Leaderboards

### Phase 4 (Future)
- AR overlay
- API access for researchers
- Mobile native apps

---

## References

- **PRD**: `/foundation/prds/Product-Requirements-Document.md`
- **Progress Log**: `/progress.md`
- **Project Plan**: `/project-plan.md`
- **Dev Guidelines**: `/CLAUDE.md`

---

**Architecture Version**: 2.0
**Last Updated**: 2025-11-15
**Status**: Sprint 5 Complete - Production Ready
**Author**: coordinator (comprehensive rewrite from v1.0)
