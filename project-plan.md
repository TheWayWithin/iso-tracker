# ISO Tracker MVP - Project Implementation Plan

**Mission**: ISO Tracker MVP Development - Evidence-Based Analysis Platform
**Commander**: coordinator
**Started**: 2025-11-09
**Status**: 🟢 Active
**Last Updated**: 2025-11-09 10:30

---

## 📋 Executive Summary

**Mission Objective**:
Launch ISO Tracker MVP as the world's first evidence-based analysis platform for interstellar objects, enabling users to evaluate "alien vs natural" claims with scientific rigor. Ship Phase 1 MVP during Q4 2025 3I/ATLAS observation window to capitalize on viral event-driven acquisition.

**Success Criteria**:
- [ ] 1,000 Event Pass subscriptions within 3 months of launch
- [ ] 10% Spectator → Evidence Analyst conversion (100 paid tier subscribers)
- [ ] <3 second load time (Lighthouse Performance score >90)
- [ ] 50:1 LTV/CAC ratio validated through first cohort
- [ ] Launch on schedule: October 2025 (Q4 2025)

**Current Status**:
Phase 0 in progress - environment setup and technical foundation establishment. Context preservation system initialized. Ready for environment setup and architecture design delegation.

---

## 🎯 Mission Objectives

### Primary Objectives (Must Have - P0)
1. **Evidence Framework Dashboard** - Deploy amateur-accessible analysis system comparing Community Sentiment vs Scientific Consensus (THE core differentiator, not just tracking)
2. **Event Pass Monetization** - Stripe-integrated subscription system ($4.99/mo Event Pass + $19/mo Evidence Analyst tiers) with 10% conversion funnel
3. **Real-Time ISO Tracking** - 2D sky map with NASA Horizons API integration, location-based visibility, and offline PWA capability
4. **Production Launch** - Deploy to production (iso-tracker.app) with monitoring, security, and 99.9% uptime target

### Secondary Objectives (Should Have - P1)
1. **Educational Content Library** - 20+ modules across 4 content pillars (Science, Evidence, Observation, Community) to drive retention
2. **Historical ISO Database** - Complete documentation of 1I/'Oumuamua and 2I/Borisov for evergreen engagement
3. **Community Platform** - In-app discussions (migrate from Discord) with peer validation framework

### Stretch Goals (Nice to Have - P2)
1. **AR Overlay** - Web-based AR for smartphone sky positioning (Phase 4)
2. **API Access** - Research API for institutional partnerships (Phase 4)
3. **Advanced 3D Visualization** - Three.js solar system with multi-ISO comparison (Phase 4)

---

## 🏗️ Technical Architecture

**Tech Stack** (Decisions Finalized):
- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS (PWA architecture)
- **Backend**: **Supabase** (PostgreSQL + Auth + Realtime + Storage)
  - **Decision Rationale**: Complex evidence queries need PostgreSQL, Row-Level Security perfect for tier-based access, predictable pricing fits $500/mo budget
- **Payments**: **Stripe Checkout + Billing**
  - **Decision Rationale**: 2-tier subscription model needs sophisticated management, lower fees at scale (2.9% vs Gumroad 10%)
- **Hosting**: Vercel (Next.js optimized, automatic HTTPS/CDN, GitHub integration)
- **Data Source**: NASA JPL Horizons API (authoritative ephemeris data)
- **Community**: Discord API (Phase 1-2) → In-app (Phase 3 migration)
- **AR**: A-Frame + AR.js (web-based, Phase 4)

**Architecture Decisions**:
- **Monorepo Structure**: Single repo with `/apps/web`, `/packages/database`, `/packages/ui` for solo developer efficiency and shared TypeScript types
- **Security-First**: CSP with nonces (no 'unsafe-inline'), Supabase RLS policies, Row-Level Security for tier-based features, Stripe for PCI compliance
- **PWA Strategy**: Service workers for 7-day offline capability, IndexedDB for trajectory caching, Background Sync for offline submissions
- **Performance Targets**: <3s load (SSG + Edge CDN), <500ms calculations (Web Workers + materialized views), 60 FPS UI (debounced updates)

**Integration Points**:
- **NASA JPL Horizons**: Daily trajectory fetch, 6-hour cache, coordinate conversion (RA/Dec → Alt/Az)
- **Stripe Webhooks**: Subscription lifecycle sync (checkout.session.completed, customer.subscription.updated/deleted)
- **Discord Bot**: Role assignment based on tier (Event Pass vs Evidence Analyst)
- **Supabase Realtime**: Live consensus updates via PostgreSQL change subscriptions

**Reference**: architecture.md to be created by architect in Phase 0

---

## 📅 Milestone Timeline

### Milestone 0: Environment & Repository Setup - Target: Week 1 (Nov 11-15, 2025)
**Objective**: Establish development, staging, and production environments with CI/CD pipeline
**Status**: 🔵 In Progress

**Key Deliverables**:
- [ ] GitHub repository created with monorepo structure
- [ ] Supabase projects created (dev, staging, production)
- [ ] Vercel deployments configured (staging + production)
- [ ] CI/CD pipeline functional (lint/test/build on PR, auto-deploy on merge)
- [ ] Local development environment validated (can run `pnpm dev` successfully)

### Milestone 1: Phase 1 MVP Launch - Target: Month 3 (January 2026)
**Objective**: Ship core Evidence Framework + tracking + monetization for 3I/ATLAS event
**Status**: 🟢 Not Started (dependencies: Milestone 0)

**Key Deliverables**:
- [ ] Evidence Framework Dashboard (Community Sentiment vs Scientific Consensus)
- [ ] Real-Time ISO Tracking (2D sky map, NASA API integration)
- [ ] Stripe Subscription System (Event Pass + Evidence Analyst tiers)
- [ ] Discord Community Integration (tier-based access)
- [ ] News Feed (curated ISO articles)
- [ ] PWA Deployed (installable, <3s load, 7-day offline)

**Success Criteria**:
- 1,000 Event Pass signups
- 10% conversion to Evidence Analyst (100 subscribers)
- 30%+ DAU/MAU during event
- 50:1 LTV/CAC ratio

### Milestone 2: Phase 2 Educational Content - Target: Month 6 (April 2026)
**Objective**: Build retention value between ISO events via educational library
**Status**: 🟢 Not Started (dependencies: Milestone 1)

**Key Deliverables**:
- [ ] 20+ educational modules (4 content pillars)
- [ ] Historical ISO database (1I, 2I fully documented)
- [ ] Expert analysis articles (10+ published)
- [ ] Peer validation framework (Evidence Analyst feature)
- [ ] Embeddable widget for backlinks

**Success Criteria**:
- 40%+ monthly educational engagement
- 75%+ Debater retention at 3 months
- 8+ average monthly active days

### Milestone 3: Phase 3 Community Platform - Target: Month 9 (July 2026)
**Objective**: Migrate from Discord to in-app community for deeper engagement
**Status**: 🟢 Not Started (dependencies: Milestone 2)

**Key Deliverables**:
- [ ] In-app discussion threads (category feeds, nested replies)
- [ ] Observation logging (image uploads, photometry data)
- [ ] Quality contribution leaderboards
- [ ] Expert Q&A integration
- [ ] Discord sunset complete (redirect to in-app)

**Success Criteria**:
- 30%+ community participation rate
- 70%+ peer-validated contributions
- 75%+ Debater retention at 6 months

### Milestone 4: Phase 4 Advanced Features - Target: Month 12 (October 2026)
**Objective**: Differentiate with AR, 3D visualization, API access
**Status**: 🟢 Not Started (dependencies: Milestone 3)

**Key Deliverables**:
- [ ] AR overlay (web-based, mobile camera + overlays)
- [ ] 3D solar system visualization (Three.js)
- [ ] Observation planning automation (iCal export, weather integration)
- [ ] API access for researchers (rate-limited, documented)

**Success Criteria**:
- 10,000+ total users
- 15%+ Spectator → Debater conversion
- 75%+ Debater retention at 12 months

---

## ✅ Task Breakdown

### TASK COMPLETION VERIFICATION PROTOCOL

**CRITICAL RULES** (Mandatory for all task updates):

1. **ONLY mark [x] after specialist CONFIRMATION**
   - Receive actual Task tool response with deliverables
   - Verify specialist updated handoff-notes.md with findings
   - Confirm deliverable exists and meets requirements
   - ❌ NEVER mark [x] based on assumption or plan
   - ❌ NEVER mark [x] before specialist completes work

2. **VERIFICATION CHECKLIST** (Before marking ANY task [x]):
   - [ ] Task tool returned actual response (not timeout/error)
   - [ ] Specialist provided specific deliverables or status
   - [ ] Specialist updated handoff-notes.md
   - [ ] Deliverable files exist at specified paths
   - [ ] Quality spot-check passed (code runs, docs readable, tests pass)
   - [ ] No blockers preventing next dependent task

3. **CROSS-FILE SYNCHRONIZATION** (Mandatory after task [x]):
   - Update progress.md with deliverable entry
   - Merge specialist findings into agent-context.md
   - Verify handoff-notes.md ready for next specialist
   - Update milestone status if phase complete

---

### Phase 0: Environment Setup & GitHub Repository - [Status: 🔵 In Progress]

**Phase Objective**: Establish development infrastructure (Dev, Staging, Production environments) and GitHub repository with CI/CD pipeline before writing any application code.

**Dependencies**: None (first phase)

**Tasks**:

- [ ] **Create GitHub Repository with Monorepo Structure** (operator)
  - **Requirements**: Repository name `iso-tracker`, public visibility, MIT license
  - **Deliverables**:
    - GitHub repo at `github.com/[username]/iso-tracker`
    - Monorepo structure: `/apps/web`, `/packages/database`, `/packages/ui`, `/packages/utils`
    - `.gitignore` configured (exclude `.env.local`, `node_modules`, `.next`)
    - `README.md` with quickstart instructions
    - `package.json` with workspace configuration (pnpm workspaces)
  - **Acceptance Criteria**: Can clone repo, run `pnpm install`, see workspace structure
  - **Status**: Not Started

- [ ] **Set Up Supabase Projects** (operator)
  - **Requirements**: Create 3 separate Supabase projects (dev, staging, production)
  - **Deliverables**:
    - Supabase dev project with URL + anon key
    - Supabase staging project with URL + anon key
    - Supabase production project with URL + anon key
    - `.env.example` file with all required environment variables documented
    - Environment variables configured in Vercel (staging + production)
  - **Acceptance Criteria**: Can connect to each Supabase project from local dev environment
  - **Status**: Not Started
  - **Dependencies**: GitHub repository must exist first

- [ ] **Configure Vercel Deployments** (operator)
  - **Requirements**: Connect GitHub repo to Vercel, configure staging + production deployments
  - **Deliverables**:
    - Vercel project linked to GitHub repo
    - Staging deployment auto-deploys from `staging` branch → `staging.iso-tracker.app`
    - Production deployment auto-deploys from `main` branch → `iso-tracker.app`
    - Environment variables configured (Supabase keys, Stripe keys)
    - Custom domains configured (if purchased)
  - **Acceptance Criteria**: Push to `staging` branch triggers deploy, can view staging site
  - **Status**: Not Started
  - **Dependencies**: GitHub repo + Supabase projects must exist

- [ ] **Set Up CI/CD Pipeline** (operator)
  - **Requirements**: GitHub Actions workflows for lint, test, build on every PR
  - **Deliverables**:
    - `.github/workflows/ci.yml` - Runs lint, type-check, test, build on push/PR
    - `.github/workflows/deploy-staging.yml` - Auto-deploy staging on merge to `staging`
    - `.github/workflows/deploy-production.yml` - Auto-deploy production on merge to `main`
    - Branch protection rules: Require CI pass before merge to `main`
  - **Acceptance Criteria**: Create test PR, see CI checks run and pass
  - **Status**: Not Started
  - **Dependencies**: GitHub repo must exist

- [ ] **Validate Local Development Environment** (operator)
  - **Requirements**: Document and test complete local dev setup on Mac
  - **Deliverables**:
    - `docs/setup.md` with step-by-step Mac setup instructions
    - Verification: Can run `pnpm dev`, see "Ready on http://localhost:3000"
    - Verification: Can connect to Supabase dev database
    - Verification: `.env.local` configured with all required keys
  - **Acceptance Criteria**: Follow docs/setup.md from scratch, achieve working dev environment in <30 minutes
  - **Status**: Not Started
  - **Dependencies**: All previous Phase 0 tasks complete

**Phase Exit Criteria**:
- [ ] All 5 tasks verified complete (not just marked [x])
- [ ] Can deploy to staging environment successfully
- [ ] Can run application locally on Mac
- [ ] progress.md updated with Phase 0 lessons
- [ ] agent-context.md updated with environment URLs, credentials (secure)
- [ ] handoff-notes.md prepared for architect (technical architecture design)
- [ ] No critical blockers preventing Phase 1

---

### Phase 1: Core MVP Development - [Status: 🟢 Not Started]

**Phase Objective**: Ship Evidence Framework Dashboard + ISO Tracking + Stripe Monetization + PWA Deployment for Q4 2025 3I/ATLAS launch.

**Dependencies**: Phase 0 must be complete (environments functional)

**Tasks**:

#### 1.1 Technical Architecture Design

- [ ] **Design Database Schema** (architect)
  - **Requirements**: PostgreSQL schema for ISOs, evidence, assessments, users, subscriptions
  - **Deliverables**:
    - `packages/database/schema.sql` with all tables, indexes, RLS policies
    - ERD diagram (Mermaid or diagram tool export)
    - Migration scripts in `packages/database/migrations/`
  - **Acceptance Criteria**: Can run migrations on dev database, all tables created
  - **Status**: Not Started

- [ ] **Design API Architecture** (architect)
  - **Requirements**: Next.js API routes + Supabase Edge Functions architecture
  - **Deliverables**:
    - `docs/api-design.md` with endpoint specifications
    - Authentication flow diagram (JWT tokens, RLS)
    - Rate limiting strategy (prevent abuse)
  - **Acceptance Criteria**: Developer can implement APIs from spec without questions
  - **Status**: Not Started

- [ ] **Design Security Architecture** (architect)
  - **Requirements**: CSP policies, RLS policies, Stripe webhook verification, input sanitization
  - **Deliverables**:
    - `docs/security.md` with CSP headers, RLS examples, threat model
    - Stripe webhook signature verification spec
    - Content Security Policy configuration
  - **Acceptance Criteria**: Security review passes (no 'unsafe-inline', no SQL injection vectors)
  - **Status**: Not Started

#### 1.2 Evidence Framework Dashboard (PRIMARY FEATURE)

- [ ] **Implement Evidence Database Schema** (developer)
  - **Requirements**: Tables for evidence, evidence_assessments, consensus_snapshot materialized view
  - **Deliverables**:
    - Tables: `evidence`, `evidence_assessments`, `isos`
    - Materialized view: `consensus_snapshot` (refreshed every 5 minutes)
    - RLS policies: Evidence Analysts can submit, everyone can view
  - **Acceptance Criteria**: Can insert evidence, assessments; query consensus view returns correct aggregates
  - **Status**: Not Started
  - **Dependencies**: Database schema design complete

- [ ] **Build Community Sentiment vs Scientific Consensus Chart** (developer)
  - **Requirements**: D3.js or Recharts bar chart comparing community vs analyst sentiment
  - **Deliverables**:
    - React component: `<SentimentConsensusChart />`
    - Fetches data from `/api/evidence/consensus/[isoId]`
    - Updates in real-time via Supabase Realtime subscription
  - **Acceptance Criteria**: Chart displays, updates live when new assessment submitted
  - **Status**: Not Started
  - **Dependencies**: Evidence database schema implemented

- [ ] **Implement Evidence Timeline** (developer)
  - **Requirements**: Chronological feed of evidence entries, filterable by type (observation/hypothesis/theory)
  - **Deliverables**:
    - React component: `<EvidenceTimeline />`
    - API route: `/api/evidence/[isoId]` with pagination
    - Filter UI: Checkboxes for evidence types
  - **Acceptance Criteria**: Timeline loads 20 entries, filters work, pagination functional
  - **Status**: Not Started
  - **Dependencies**: Evidence database schema implemented

- [ ] **Build Evidence Assessment Submission** (developer)
  - **Requirements**: Form for Evidence Analysts to submit assessments (5-point scale, confidence, reasoning)
  - **Deliverables**:
    - React component: `<AssessmentForm />` with paywall for Spectators
    - API route: `/api/evidence/assessments` (POST)
    - Optimistic updates: UI updates immediately, rollback on error
  - **Acceptance Criteria**: Evidence Analyst can submit, Spectator sees paywall modal
  - **Status**: Not Started
  - **Dependencies**: Evidence database schema + Stripe tier checking implemented

#### 1.3 Real-Time ISO Tracking

- [ ] **Integrate NASA Horizons API** (developer)
  - **Requirements**: Fetch trajectory data for 3I/ATLAS (±30 days from current date)
  - **Deliverables**:
    - API route: `/api/nasa/trajectory/[isoId]` (server-side fetch from NASA)
    - Caching: Store in Supabase `iso_trajectories` table (24-hour TTL)
    - Coordinate conversion: RA/Dec → Azimuth/Altitude based on user location
  - **Acceptance Criteria**: Can fetch trajectory for 3I/ATLAS, cached data reduces API calls
  - **Status**: Not Started

- [ ] **Build 2D Sky Map** (developer)
  - **Requirements**: Canvas-based or Leaflet sky map with ISO position, trajectory line, stars
  - **Deliverables**:
    - React component: `<SkyMap2D />`
    - Timeline slider: Adjust date ±30 days
    - Location input: City search or GPS
  - **Acceptance Criteria**: Map displays ISO position, updates when slider moved, responsive on mobile
  - **Status**: Not Started
  - **Dependencies**: NASA API integration complete

#### 1.4 Stripe Monetization

- [ ] **Set Up Stripe Products** (operator)
  - **Requirements**: Create 2 subscription products in Stripe Dashboard
  - **Deliverables**:
    - Event Pass product: $4.99/month recurring
    - Evidence Analyst product: $19/month recurring + $199/year recurring
    - Test mode products for staging, live mode for production
  - **Acceptance Criteria**: Products visible in Stripe Dashboard with correct pricing
  - **Status**: Not Started

- [ ] **Implement Stripe Checkout** (developer)
  - **Requirements**: Redirect to Stripe Checkout for Event Pass and Evidence Analyst signups
  - **Deliverables**:
    - API route: `/api/stripe/create-checkout-session` (creates session, redirects to Stripe)
    - Success page: `/onboarding?session_id={CHECKOUT_SESSION_ID}` (verify payment, create user)
    - Cancel page: `/pricing` (user can retry)
  - **Acceptance Criteria**: Can complete test payment, redirected to onboarding, user created in database
  - **Status**: Not Started
  - **Dependencies**: Stripe products created

- [ ] **Implement Stripe Webhooks** (developer)
  - **Requirements**: Handle subscription lifecycle events (created, updated, canceled)
  - **Deliverables**:
    - API route: `/api/webhooks/stripe` (signature verification, event handling)
    - Handlers for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
    - Database sync: Update `subscriptions` table with tier, status
  - **Acceptance Criteria**: Test webhook events (Stripe CLI), verify database updates correctly
  - **Status**: Not Started
  - **Dependencies**: Stripe Checkout implemented

- [ ] **Build Subscription Management** (developer)
  - **Requirements**: Stripe Customer Portal for self-service (update payment, cancel, download invoices)
  - **Deliverables**:
    - API route: `/api/stripe/create-portal-session` (redirects to Stripe Portal)
    - Account settings page: Link to "Manage Subscription"
  - **Acceptance Criteria**: User can access portal, update payment method, cancel subscription
  - **Status**: Not Started
  - **Dependencies**: Stripe webhooks implemented

#### 1.5 Community Integration (Discord)

- [ ] **Set Up Discord Bot** (operator)
  - **Requirements**: Create Discord bot, add to server, configure role-based permissions
  - **Deliverables**:
    - Discord bot created in Developer Portal
    - Bot added to ISO Tracker server with Manage Roles permission
    - Roles created: Event Pass, Evidence Analyst
    - Channel structure: General (public), Event Pass channels, Evidence Analyst channels
  - **Acceptance Criteria**: Bot can assign roles, channels have correct permissions
  - **Status**: Not Started

- [ ] **Implement Discord Integration** (developer)
  - **Requirements**: Generate Discord invite links, sync user tier to Discord roles
  - **Deliverables**:
    - API route: `/api/discord/invite` (generates single-use invite)
    - Discord bot listener: On member join, check tier in database, assign role
    - Database: `discord_integrations` table linking user_id to discord_user_id
  - **Acceptance Criteria**: User clicks "Join Community", gets invite, joins server, assigned correct role
  - **Status**: Not Started
  - **Dependencies**: Discord bot set up

#### 1.6 News Feed

- [ ] **Implement News CMS** (developer)
  - **Requirements**: Simple CMS using Supabase (manual entry initially)
  - **Deliverables**:
    - Table: `news_articles` (headline, source, URL, category, thumbnail)
    - API route: `/api/news` (list articles with pagination)
    - Admin panel: `/admin/news` (create, edit, publish articles)
  - **Acceptance Criteria**: Can create news article, appears in feed
  - **Status**: Not Started

- [ ] **Build News Feed UI** (developer)
  - **Requirements**: Card grid displaying latest 20 news articles, filterable by category
  - **Deliverables**:
    - React component: `<NewsFeed />`
    - Filters: Discovery, Research, Observation, Media Coverage
    - External link: Opens article in new tab
  - **Acceptance Criteria**: Feed displays, filters work, links open correctly
  - **Status**: Not Started
  - **Dependencies**: News CMS implemented

#### 1.7 PWA Deployment

- [ ] **Configure Service Worker** (developer)
  - **Requirements**: Cache app shell, 7-day offline capability, Background Sync
  - **Deliverables**:
    - Service worker using `next-pwa` package
    - Cache strategies: App shell (cache-first), API (network-first with fallback)
    - Background Sync: Queue evidence assessments when offline
  - **Acceptance Criteria**: Can use app offline for 7 days, offline banner displays, queued actions sync when online
  - **Status**: Not Started

- [ ] **Optimize Performance** (developer)
  - **Requirements**: <3s load time (Lighthouse Performance score >90)
  - **Deliverables**:
    - Next.js SSG for static pages (landing, about, pricing)
    - Code splitting: Dynamic imports for non-critical components
    - Image optimization: Next.js Image component (WebP, lazy loading)
    - Font optimization: `next/font` with font-display: swap
  - **Acceptance Criteria**: Lighthouse audit on staging passes (Performance >90, Accessibility >90)
  - **Status**: Not Started

- [ ] **Deploy PWA to Production** (operator)
  - **Requirements**: Deploy to Vercel production, configure custom domain, enable monitoring
  - **Deliverables**:
    - Production deployment at `iso-tracker.app`
    - SSL certificate active (Vercel automatic)
    - Monitoring: Sentry error tracking, Vercel Analytics web vitals
    - Legal pages: Privacy Policy, Terms of Service, Refund Policy
  - **Acceptance Criteria**: Can access https://iso-tracker.app, PWA installable, monitoring active
  - **Status**: Not Started
  - **Dependencies**: All Phase 1 features complete

**Phase Exit Criteria**:
- [ ] All Phase 1 tasks verified complete
- [ ] Evidence Framework Dashboard functional (sentiment chart, timeline, assessments)
- [ ] Stripe subscriptions working (can sign up, upgrade, cancel)
- [ ] ISO tracking live (2D map, NASA data, timeline slider)
- [ ] PWA deployed to production (<3s load, 7-day offline)
- [ ] Lighthouse audit passes (Performance/Accessibility/Best Practices >90)
- [ ] progress.md updated with Phase 1 lessons
- [ ] agent-context.md updated with launch findings
- [ ] handoff-notes.md prepared for Phase 2 (educational content creation)
- [ ] Launch announcement ready (email, social media)

---

### Phase 2: Educational Content + Retention - [Status: 🟢 Not Started]

**Phase Objective**: Build educational module library and historical ISO database to drive retention between observation events.

**Dependencies**: Phase 1 complete (MVP launched)

**Tasks** (High-Level - Detailed breakdown when Phase 1 complete):

- [ ] Create Educational Module CMS (developer + documenter)
- [ ] Write 20+ Educational Modules (documenter with AI assistance)
  - 5 modules per pillar: Science, Evidence, Observation, Community
  - Interactive quizzes, badges, progress tracking
- [ ] Build Historical ISO Database (developer + documenter)
  - 1I/'Oumuamua full documentation
  - 2I/Borisov full documentation
  - Comparison tools
- [ ] Implement Peer Validation Framework (developer)
  - Review queue for Evidence Analyst submissions
  - Consensus-based validation (3+ approvals)
  - Reputation scoring system
- [ ] Create Embeddable Widget (developer)
  - "Current ISO Position" widget for partner sites
  - Analytics tracking for backlinks

**Phase Exit Criteria**:
- [ ] 40%+ users engage with educational content monthly
- [ ] 75%+ Evidence Analyst retention at 3 months
- [ ] 8+ average monthly active days for Evidence Analysts

---

### Phase 3: Community Platform - [Status: 🟢 Not Started]

**Phase Objective**: Migrate from Discord to in-app community for deeper engagement and ownership.

**Dependencies**: Phase 2 complete (educational content live)

**Tasks** (High-Level):

- [ ] Build In-App Discussion Threads (developer)
- [ ] Implement Observation Logging (developer)
- [ ] Create Quality Contribution Leaderboards (developer)
- [ ] Integrate Expert Q&A (developer + support)
- [ ] Migrate Users from Discord (operator)
- [ ] Sunset Discord (operator)

**Phase Exit Criteria**:
- [ ] 30%+ community participation rate
- [ ] 70%+ peer-validated contributions
- [ ] 75%+ Evidence Analyst retention at 6 months

---

### Phase 4: Advanced Features - [Status: 🟢 Not Started]

**Phase Objective**: Differentiate with AR overlay, 3D visualization, and API access.

**Dependencies**: Phase 3 complete (community platform live)

**Tasks** (High-Level):

- [ ] Implement AR Overlay (developer)
- [ ] Build 3D Solar System Visualization (developer)
- [ ] Create Observation Planning Automation (developer)
- [ ] Launch API Access for Researchers (developer + operator)

**Phase Exit Criteria**:
- [ ] 10,000+ total users
- [ ] 15%+ Spectator → Evidence Analyst conversion
- [ ] 75%+ Evidence Analyst retention at 12 months

---

## 📊 Success Metrics

### Key Performance Indicators

**Lifecycle Conversion (Make-or-Break)**:
- **Target**: 10% Spectator → Evidence Analyst conversion
- **Measurement**: Cohort analysis in Supabase, tracked monthly
- **Red Flag**: <8% for 2+ consecutive weeks → Launch optimization campaign

**Development Velocity**:
- **Target**: Phase 1 complete in 3 months (12 weeks)
- **Current**: Week 1 in progress
- **Trend**: On track

**Quality Metrics**:
- **Lighthouse Performance**: Target >90, Current: Not yet measured
- **Test Coverage**: Target >80%, Current: 0% (no tests yet)
- **Uptime**: Target 99.9%, Current: Not yet deployed

**Revenue Metrics**:
- **MRR Goal**: $6,890 by end of Phase 1 (1,000 Event Pass + 100 Evidence Analyst)
- **LTV/CAC Target**: 50:1 ratio
- **Churn Target**: <10% monthly for Evidence Analysts

---

## 🚧 Risks & Mitigation

### Active Risks

#### Risk #1: Spectator → Debater Conversion <10%
**Probability**: Medium (30-40%)
**Impact**: High (business model fails)
**Status**: 🟡 Monitoring

**Description**:
If conversion rate falls below 10%, unit economics break down (revenue can't sustain operations).

**Mitigation Strategy**:
- A/B test upgrade prompts (messaging, placement, timing)
- Educational content demonstrates Evidence Analyst value before paywall
- Survey non-converters: "What would make you upgrade?"
- Time-limited offers: First 100 subscribers get 20% off lifetime

**Contingency Plan**:
- Adjust pricing (test $14.99/mo vs $19/mo for Evidence Analyst)
- Add mid-tier option: Debater Lite at $9.99/mo with limited features
- Extend Event Pass free trial to 14 days (from 0) to increase engagement

#### Risk #2: Solo Founder Burnout
**Probability**: High (40-50%)
**Impact**: Critical (project failure)
**Status**: 🟢 Mitigated

**Description**:
Solo development over 12 months risks burnout, especially with aggressive timeline.

**Mitigation Strategy**:
- Ruthless prioritization: P0 only in Phase 1, defer P2 features
- AI-assisted development: Use agents extensively for code generation, testing
- Sustainable pace: Plan 20-hour work weeks, not 80-hour death marches
- Schedule downtime: 1 week off every 3 months

**Contingency Plan**:
- Hire freelance developer ($50/hour) if Phase 1 slips >2 weeks
- Open-source non-core components, accept community PRs
- Reduce scope: Cut Discord integration, use Gumroad instead of Stripe (simpler)

#### Risk #3: 3I/ATLAS Observation Window Closes Early
**Probability**: Low (15-20%)
**Impact**: Medium (lose launch timing)
**Status**: 🟢 Mitigated

**Description**:
If 3I/ATLAS becomes unobservable before Q4 2025, lose event-driven acquisition opportunity.

**Mitigation Strategy**:
- Monitor 3I/ATLAS trajectory weekly (NASA Horizons updates)
- Flexible launch date: Can launch in Q3 2025 if needed
- Backup plan: Launch with 1I/'Oumuamua and 2I/Borisov historical data only

**Contingency Plan**:
- Pivot to "next ISO" whenever discovered (Vera Rubin launching 2025 = more ISOs)
- Focus on historical ISOs for initial traction, wait for next event

---

## 🔗 Dependencies & Blockers

### External Dependencies

- **NASA JPL Horizons API**: Required for trajectory data
  - **Owner**: NASA (public API, no SLA)
  - **Required By**: Phase 1 (ISO tracking)
  - **Status**: 🟢 On Track (API stable, no known issues)
  - **Impact if Delayed**: Cannot launch ISO tracking, must find alternative data source

- **Stripe API**: Required for subscription management
  - **Owner**: Stripe (99.99% uptime SLA)
  - **Required By**: Phase 1 (monetization)
  - **Status**: 🟢 On Track
  - **Impact if Delayed**: Cannot monetize, must use Gumroad fallback

- **Supabase Stability**: Required for database, auth, realtime
  - **Owner**: Supabase (99.9% uptime SLA on paid tier)
  - **Required By**: All phases
  - **Status**: 🟢 On Track
  - **Impact if Delayed**: Complete blocker, no alternative

### Current Blockers

No blockers currently - Phase 0 just started.

### Resolved Blockers (Reference)

None yet.

---

## 🎓 Lessons Learned (In-Flight)

### What's Working Well
- Context preservation system initialized successfully
- PRD and foundation documents provide clear guidance
- Technology decisions made efficiently (Supabase, Stripe, Monorepo)

### What Needs Improvement
- Strategist Task delegation didn't produce deliverable (coordinator created directly instead)
- Need to test Task tool reliability before critical path tasks

### Key Insights
- Direct coordinator action faster than Task delegation for documentation tasks
- Template-based approach (project-plan-template.md) accelerates deliverable creation

**Note**: Detailed lessons with root causes documented in `progress.md`

---

## 📦 Deliverables Status

### Completed Deliverables
- ✅ agent-context.md - 2025-11-09 10:00 - `/Users/jamiewatters/DevProjects/ISOTracker/`
- ✅ handoff-notes.md - 2025-11-09 10:00 - `/Users/jamiewatters/DevProjects/ISOTracker/`
- ✅ progress.md - 2025-11-09 10:00 - `/Users/jamiewatters/DevProjects/ISOTracker/`
- ✅ project-plan.md - 2025-11-09 10:30 - `/Users/jamiewatters/DevProjects/ISOTracker/` (this file)

### In Progress Deliverables
- 🔵 GitHub repository setup - operator - Target: Week 1
- 🔵 Supabase environment setup - operator - Target: Week 1
- 🔵 Vercel deployment configuration - operator - Target: Week 1

### Pending Deliverables
- ⏳ Database schema design - Blocked by: Phase 0 completion
- ⏳ Evidence Framework implementation - Blocked by: Database schema
- ⏳ Stripe integration - Blocked by: Phase 0 completion

---

## 👥 Team & Responsibilities

### Specialist Assignments

**coordinator** (Mission Commander):
- Overall mission orchestration: All phases
- Task delegation and verification: Ongoing
- Context preservation and handoffs: Real-time
- Progress tracking and reporting: Daily

**operator** (DevOps & Infrastructure):
- Environment setup: Phase 0
- GitHub repository configuration: Phase 0
- CI/CD pipeline setup: Phase 0
- Production deployment: Phase 1, 2, 3, 4
- Monitoring setup: Phase 1

**architect** (Technical Design):
- Database schema design: Phase 1
- API architecture: Phase 1
- Security architecture: Phase 1
- Performance optimization strategy: Phase 1

**developer** (Implementation):
- Evidence Framework: Phase 1
- ISO Tracking: Phase 1
- Stripe integration: Phase 1
- PWA features: Phase 1
- Educational CMS: Phase 2
- Community platform: Phase 3
- AR overlay: Phase 4

**documenter** (Content Creation):
- Educational modules: Phase 2 (20+ modules)
- Historical ISO documentation: Phase 2
- Expert analysis articles: Phase 2
- User guides: All phases

**tester** (Quality Assurance):
- Test planning: Phase 1
- Integration testing: Phase 1
- Performance testing: Phase 1 (Lighthouse audits)
- Security testing: Phase 1

**designer** (UI/UX):
- Design system: Phase 1
- Evidence Framework UI: Phase 1
- Community platform UI: Phase 3
- AR overlay UI: Phase 4

---

## 📚 Documentation References

### Core Documentation
- **project-plan.md** - This file (forward-looking task tracking)
- **progress.md** - Chronological changelog and learnings (backward-looking)
- **agent-context.md** - Mission-wide accumulated context
- **handoff-notes.md** - Current specialist context for next agent
- **architecture.md** - Technical design and decisions (to be created by architect)

### Supporting Documentation
- **foundation/prds/Product-Requirements-Document.md** - PRIMARY SOURCE OF TRUTH
- **foundation/vision-and-mission.md** - Strategic alignment
- **foundation/executive-summary.md** - Business context
- **CLAUDE.md** - Critical Software Development Principles (MUST FOLLOW)

### Setup Documentation (To Be Created)
- **docs/setup.md** - Local development setup guide
- **docs/api-design.md** - API architecture specification
- **docs/security.md** - Security architecture and policies

---

## 🔄 Update Protocol

### When to Update This File

**MANDATORY Updates** (Real-time):
1. **Phase Start**: Add all phase tasks BEFORE work begins
2. **Task Verification**: Mark [x] ONLY after specialist confirmation AND deliverable exists
3. **Blocker Discovered**: Add to Dependencies & Blockers immediately
4. **Milestone Complete**: Update milestone status, add next milestone tasks

**SYNCHRONIZED Updates** (Cross-file):
- When marking task [x] → Update progress.md with deliverable entry
- After specialist completion → Merge findings to agent-context.md
- After task [x] → Verify handoff-notes.md ready for next specialist
- After phase → Extract lessons to progress.md

---

**Mission Status**: Phase 0 in progress - environment setup initiated.

**Last Verification**: 2025-11-09 10:30 by coordinator

**Next Actions**: Delegate to operator for GitHub repository and environment setup.
