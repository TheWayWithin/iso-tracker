# ISO Tracker MVP - Project Implementation Plan

**Mission**: ISO Tracker Development - Evidence-Based Analysis Platform
**Started**: 2025-11-09
**Status**: 🟢 Active - Sprint 13 COMPLETE ✅
**Last Updated**: 2025-11-23

---

## 🚀 CURRENT STATUS

**Site URL**: https://www.isotracker.org
**Current Sprint**: Sprint 13 COMPLETE ✅ (Nov 23, 2025)
**Previous Sprint**: Sprint 12 COMPLETE ✅ (Nov 23, 2025)
**MVP Status**: Core features complete, Notifications system COMPLETE

### Recent Deliverables:
- ✅ **Sprint 13** (Nov 23): ISO Following & Notifications
  - FollowButton component integrated into ISO detail pages
  - Follow API endpoints (POST/DELETE/GET with counts)
  - User following API endpoint
  - Notification preferences settings page (pre-existing)
  - Resend email integration (pre-existing templates)
  - Observation window cron job (pre-existing)

- ✅ **Sprint 12** (Nov 23): Evidence Tab & Threaded Comments
- ✅ **Sprint 11** (Nov 23): Community Arguments & Debate System
- ✅ **Sprint 10** (Nov 22): The Loeb Scale - Anomaly Assessment Engine
  - Database schema: loeb_scale_assessments, loeb_scale_votes, loeb_scale_criteria tables
  - API endpoints: GET/POST for assessments and voting
  - LoebScaleDashboard: Circular gauge with zone colors
  - LoebCriteriaChecklist: Expandable accordion with 11 levels
  - LoebScaleVoting: Community voting for Analyst tier
  - LoebScaleBadge: Compact badge component
  - Homepage showcase: "The Loeb Scale" section with 3 ISOs
  - ISO detail page: New "Loeb Scale" tab integrated
  - Seed data: 1I/'Oumuamua (4), 2I/Borisov (0), 3I/ATLAS (4)

- ✅ **Sprint 9** (Nov 22): Landing Page Realignment
  - Wonder-driven headline: "Are We Alone? Track the Answer."
  - 4-tier pricing: Spectator (Free), Explorer ($4.99), Analyst ($9.99), Professional ($19.99)
  - Analyst tier marked as POPULAR
  - 3i-atlas.live standalone email capture page
  - Star field background effect
  - Updated value proposition copy
  - **Visibility update**: Both 3i-atlas pages updated to "NOW VISIBLE" status
  - Timeline updated: "Peak Observation Window" now current phase

- ✅ **Sprint 8** (Nov 22): Observation Planning & Visibility Features
  - Location-based visibility calculations (GPS + manual city entry)
  - Real-time sky position (altitude/azimuth) display
  - Observation window predictions (next 30 days)
  - Sky Map visualization component
  - Educational tooltips and how-to guides
  - VisibilityBadge on ISO list page
  - Observation tab integrated into ISO detail pages
  - NASA Horizons API visibility endpoint

- ✅ **Sprint 7** (Nov 19): Orbital Visualization & NASA Horizons API Integration
  - 2D orbital trajectory visualization with time scrubber
  - NASA JPL Horizons API integration
  - Ephemeris data table with sorting and pagination
  - Performance optimizations and error boundaries

### Active Work:
- ✅ **Sprint 9** COMPLETE (Nov 22): Landing Page Realignment
  - Wonder-driven homepage messaging implemented
  - 4-tier pricing structure complete
  - 3i-atlas.live standalone page created
  - Brand color migration deferred to Phase 10

### Archive:
- See `completed-project-plan.md` for Sprints 1-6 (MVP foundation complete)

---

## 📋 SPRINT 9: Landing Page Realignment ✅ COMPLETE

**Status**: ✅ COMPLETE (Nov 22, 2025)
**Time**: ~2 hours
**Full Details**: See `progress-archive-2025-11-21.md`

### Summary
- Wonder-driven headline: "Are We Alone? Track the Answer."
- 4-tier pricing: Spectator (Free), Explorer ($4.99), Analyst ($9.99 POPULAR), Professional ($19.99)
- 3i-atlas.live standalone email capture page created
- Both 3I/ATLAS pages updated to "NOW VISIBLE" status
- QA: 38/41 checks passed

### Deferred to Future
- Full brand color migration (slate-* → brand colors)
- Space Grotesk typography

---

## 🎯 SPRINT 10: The Loeb Scale - Anomaly Assessment Engine ✅ COMPLETE

**PRD References**: Avi Loeb Research (`ideation/ISO Tracker Avi Loeb/`)
**Status**: ✅ COMPLETE (Nov 22, 2025)
**Dependencies**: Sprint 9 complete ✅
**Actual Time**: ~4 hours
**Priority**: HIGH - Core differentiation feature, monetization driver

### Mission Objective

Implement the Loeb Scale (Interstellar Object Significance Scale - IOSS), a 0-10 classification system based on Avi Loeb's framework for evaluating ISOs. This transforms ISO Tracker from a tracking utility into an engaging, habit-forming assessment platform.

### Background

The Loeb Scale is a scientific framework from arXiv:2508.09167 (Eldadi, Tenenbaum, Loeb 2025) that classifies ISOs based on anomaly indicators:

| Zone | Levels | Classification | Color |
|------|--------|----------------|-------|
| Green | 0-1 | Natural Objects | 🟢 |
| Yellow | 2-4 | Anomalous Objects | 🟡 |
| Orange | 5-7 | Suspected Technology | 🟠 |
| Red | 8-10 | Confirmed Technology | 🔴 |

**Current ISO Classifications:**
- 1I/'Oumuamua: Level 4 (Anomalous)
- 2I/Borisov: Level 0 (Natural)
- 3I/ATLAS: Level 4 (Anomalous)

### Phase 10.1: Database & API ✅
**Goal**: Store and serve Loeb Scale data

- [x] Create `loeb_scale_assessments` table
  - `iso_id`, `level` (0-10), `zone` (green/yellow/orange/red)
  - `criteria_met` (JSONB array of met criteria)
  - `evidence_links` (JSONB array of supporting evidence)
  - `official_score` (Galileo Project/scientific consensus)
  - `community_score` (user voting average)
  - `last_updated`, `updated_by`

- [x] Create `loeb_scale_votes` table (for Analyst tier)
  - `user_id`, `iso_id`, `voted_level`, `reasoning` (optional)
  - `created_at`, `updated_at`

- [x] Create `loeb_scale_criteria` reference table
  - Level definitions, criteria text, observable categories
  - Pre-populate with all 11 levels (0-10)

- [x] API endpoints:
  - `GET /api/iso/[id]/loeb-scale` - Get current assessment
  - `POST /api/iso/[id]/loeb-scale/vote` - Cast vote (Analyst+)
  - `GET /api/loeb-scale/criteria` - Get criteria definitions

### Phase 10.2: Loeb Scale Dashboard Component ✅
**Goal**: Prominent UI displaying current score

- [x] Create `LoebScaleDashboard` component
  - Large circular gauge showing 0-10 score
  - Color-coded background matching zone (green/yellow/orange/red)
  - Label showing classification (e.g., "Level 4 - Anomalous")
  - Pulsing animation for scores ≥4 (potential technosignature)

- [x] Add to ISO detail page (prominent position, above fold)
- [x] Add mini-badge version for ISO list cards (`LoebScaleBadge`)
- [x] Mobile-responsive design (375px primary)

### Phase 10.3: Criteria Checklist UI ✅
**Goal**: Interactive display of assessment criteria

- [x] Create `LoebCriteriaChecklist` component
  - Expandable accordion for each level (0-10)
  - Checkmarks for criteria met by current ISO
  - Evidence links for each criterion (NASA data, papers, etc.)
  - Tooltips explaining each criterion in plain language

- [x] Observable Categories sections:
  - Trajectory Anomalies
  - Spectroscopic Signatures
  - Geometric Properties
  - Surface Composition
  - Electromagnetic Signals
  - Operational Indicators

- [x] "Why this score?" explainer section

### Phase 10.4: Community Voting (Analyst Tier) ✅
**Goal**: Let paid users participate in assessment

- [x] Create `LoebScaleVoting` component
  - Button group for selecting level (0-10)
  - Optional reasoning text field (2000 char max)
  - Show "Your Vote" vs "Community Consensus" vs "Official Score"
  - Require Analyst tier ($9.99+) to vote

- [x] Community consensus calculation
  - Average of all user votes (via database trigger)
  - Display vote distribution histogram
  - Show total vote count

- [x] Voting restrictions:
  - One vote per user per ISO (can change)
  - Must be Analyst or Professional tier
  - Spectator/Explorer see results but can't vote (upgrade CTA shown)

### Phase 10.5: Integration & Polish ✅
**Goal**: Connect everything and add finishing touches

- [x] Add Loeb Scale tab to ISO detail pages
- [x] Homepage showcase: "The Loeb Scale" section with 3 ISOs
- [x] Zone legend with icons (●, ◐, ◉, ★)
- [ ] Push notification hooks (future): "Score changed!"

- [x] Seed initial data:
  - 1I/'Oumuamua: Level 4, criteria from research
  - 2I/Borisov: Level 0, natural comet indicators
  - 3I/ATLAS: Level 4, criteria from research

### Phase 10.6: Testing & QA ✅
**Goal**: Validate implementation

- [x] Dev server starts without errors
- [x] Homepage renders Loeb Scale showcase section
- [x] API routes configured correctly (dynamic export added)
- [x] Components compile without TypeScript errors
- [ ] E2E tests for voting flow (Analyst tier) - deferred to future sprint
- [ ] Accessibility audit - deferred to future sprint

### Success Criteria ✅

**Functionality**:
- [x] Loeb Scale score displayed for all ISOs
- [x] Criteria checklist shows evidence for each level
- [x] Community voting ready for Analyst+ tiers
- [ ] Score history/changes tracked (future)

**Monetization**:
- [x] Free users can VIEW scores
- [x] Analyst users can VOTE on scores
- [ ] Professional users get expert commentary (future)

**Engagement**:
- [x] Score visible on ISO detail pages and homepage
- [x] Color-coded zones create visual interest
- [x] "Why this score?" explainer section

### Technical Notes

**Color Palette for Zones:**
- Green (0-1): `#10B981` (existing Signal Green)
- Yellow (2-4): `#FFB84D` (existing Trajectory Gold)
- Orange (5-7): `#F97316` (Tailwind orange-500)
- Red (8-10): `#EF4444` (Tailwind red-500)

**Reference Material:**
- `ideation/ISO Tracker Avi Loeb/Analysis: Avi Loeb's Assessment Criteria (The Loeb Scale).md`
- `ideation/ISO Tracker Avi Loeb/Avi Loeb's Assessment Criteria Research.md`
- arXiv:2508.09167

---

## 📋 SPRINT 11: Community Arguments & Debate Foundation

**PRD References**: `ideation/Analysis and Recommendation_ Defining the _Debater_ User Journey.md`
**Status**: ✅ COMPLETE (Nov 23, 2025)
**Dependencies**: Sprint 10 complete ✅
**Priority**: HIGH - Core engagement & monetization feature
**Estimated Phases**: 4

### Mission Objective

Implement the community arguments system that enables the "Spectator → Debater" conversion journey. Free users can submit arguments, Event Pass users can vote (influencing Community Sentiment score).

### Background

Per PRD:
- **Free users**: Can submit basic arguments/opinions
- **Event Pass ($4.99)**: Can vote on arguments (influences Community Sentiment)
- **Evidence Analyst ($9.99)**: Can also use evidence assessment framework
- **Note**: `arguments` and `votes` tables referenced in migrations but NOT created yet

### Phase 11.1: Database Schema
**Goal**: Create arguments and votes tables

- [x] Create `arguments` table
  - `id`, `iso_object_id`, `user_id`
  - `stance` ('artificial' | 'natural' | 'uncertain')
  - `title` (varchar 200)
  - `content` (text, max 2000 chars)
  - `upvotes_count`, `downvotes_count` (denormalized)
  - RLS: All authenticated can SELECT, authenticated can INSERT
  - Indexes on iso_object_id, user_id, created_at

- [x] Create `argument_votes` table
  - `id`, `argument_id`, `user_id`
  - `vote_type` ('upvote' | 'downvote')
  - RLS: Event Pass+ can INSERT, one vote per user per argument
  - Trigger: Update argument vote counts

- [x] Update `consensus_snapshot` materialized view
  - Fix reference to `arguments` table (now exists)
  - Add community sentiment calculation

### Phase 11.2: Arguments API Endpoints
**Goal**: Backend support for argument CRUD

- [x] `GET /api/iso/[id]/arguments` - List arguments for ISO
  - Query params: sort (newest, top), stance filter
  - Returns: Arguments with vote counts, user's vote status

- [x] `POST /api/iso/[id]/arguments` - Create argument
  - Auth: Any authenticated user
  - Validation: Title 3-200 chars, content 10-2000 chars

- [x] `POST /api/arguments/[id]/vote` - Vote on argument
  - Auth: Event Pass+ tier required
  - Body: { vote_type: 'upvote' | 'downvote' | null }
  - Returns: Updated vote counts

### Phase 11.3: Arguments UI Components
**Goal**: Frontend for viewing and submitting arguments

- [x] Create `ArgumentCard` component
  - Display stance badge (color-coded)
  - Title, excerpt, author, timestamp
  - Vote buttons with counts (disabled for non-Event Pass)
  - Expand/collapse for full content

- [x] Create `ArgumentSubmissionForm` component
  - Stance selector (Artificial / Natural / Uncertain)
  - Title input with character count
  - Content textarea with character count
  - Submit button (auth required message for guests)

- [x] Create `ArgumentList` component
  - Filter by stance (all, artificial, natural, uncertain)
  - Sort by (newest, most upvoted, most discussed)
  - Pagination or infinite scroll
  - Empty state with CTA to submit first argument

### Phase 11.4: Integration & Testing
**Goal**: Wire into ISO detail pages

- [x] Add "Community Debate" tab to ISO detail pages
- [x] Show Community Sentiment chart (existing component)
- [x] Connect to argument list and submission form
- [x] Tier upgrade CTA for voting (Event Pass)
- [ ] Test RLS policies with different tiers (pending DB migration)
- [x] Mobile responsive (375px primary)

### Success Criteria
- [x] Free users can submit arguments
- [x] Event Pass users can vote on arguments
- [x] Community Sentiment shows live percentage
- [x] Vote counts update in real-time (optimistic UI)

---

## 📋 SPRINT 12: Evidence Tab & Threaded Comments

**PRD References**: Section 4.1 "Evidence-Based Analysis Framework", Section 4.3 "Debate System"
**Status**: ✅ COMPLETE (Nov 23, 2025)
**Dependencies**: Sprint 11 complete ✅
**Priority**: HIGH - Core value proposition for Analyst tier
**Actual Phases**: 4

### Mission Objective

Integrate existing evidence components into ISO detail pages and add threaded comment functionality on evidence entries. DB schema already exists (`evidence`, `evidence_assessments`, `evidence_comments`).

### Background

**Existing Database Tables** (already deployed):
- `evidence` - Scientific evidence submissions
- `evidence_assessments` - Quality scoring by Analysts
- `evidence_comments` - Threaded discussions (max 3 levels)

**Existing Components** (need integration):
- `EvidenceSubmissionForm.tsx`
- `EvidenceAssessmentForm.tsx`
- `EvidenceDashboard.tsx`
- `EvidenceTimeline.tsx`
- `CommunitySentiment.tsx`

### Phase 12.1: Evidence Tab Integration ✅
**Goal**: Add Evidence tab to ISO detail pages

- [x] Create "Evidence" tab on ISO detail page
- [x] Integrate `EvidenceList` showing ISO's evidence
- [x] List evidence entries with quality scores
- [x] Filter: By type (observation, spectroscopy, etc.)
- [x] Sort: By quality score, newest, most assessed

### Phase 12.2: Evidence Submission UI ✅
**Goal**: Allow Event Pass+ to submit evidence

- [x] Create `EvidenceSubmissionForm` component
- [x] Tier check: Event Pass+ required to submit
- [x] Form validation matching DB constraints
- [x] Success callback for refresh
- [x] Upgrade CTA for lower tiers

### Phase 12.3: Evidence Assessment UI ✅
**Goal**: Allow Analysts to score evidence

- [x] Create `EvidenceAssessmentForm` component
- [x] Tier check: Evidence Analyst required
- [x] Score sliders: Expertise (0-40), Methodology (0-30), Peer Review (0-30)
- [x] Show calculated quality score preview
- [x] One assessment per user per evidence (update existing)

### Phase 12.4: Threaded Comments on Evidence ✅
**Goal**: Discussion threads under evidence entries

- [x] Create `EvidenceComments` component
  - Display comments with nesting (max 3 levels per PRD)
  - Show "[removed]" for soft-deleted comments
  - Collapse/expand nested replies

- [x] Create inline comment form
  - Textarea with 10-10000 char validation
  - Tier check: Evidence Analyst required to comment
  - Reply-to functionality for nested comments

- [x] API endpoints:
  - `GET /api/evidence/[id]/comments`
  - `POST /api/evidence/[id]/comments`
  - `GET /api/evidence/[id]/assess`
  - `POST /api/evidence/[id]/assess`

### Success Criteria
- [x] Evidence tab visible on ISO detail pages
- [x] Event Pass+ can submit evidence
- [x] Evidence Analyst can assess evidence quality
- [x] Evidence Analyst can add threaded comments
- [x] Lower tiers see read-only view with upgrade CTA

---

## 📋 SPRINT 13: ISO Following & Notifications ✅ COMPLETE

**PRD References**: Section 4.4 "Notifications", Section 7 "Tier Features"
**Status**: ✅ COMPLETE (Nov 23, 2025)
**Dependencies**: Sprint 12 complete ✅
**Priority**: MEDIUM - Engagement & retention feature
**Actual Phases**: 4

### Mission Objective

Enable users to follow ISOs and receive notifications for observation windows, new evidence, and comment replies. DB schema exists (`iso_follows`, `notification_preferences`, `notification_queue`).

### Background

**Existing Database Tables** (already deployed):
- `iso_follows` - Track which users follow which ISOs
- `notification_preferences` - Per-user email toggles
- `notification_queue` - Batched notification processing
- `notification_rate_limits` - Tier-based rate limiting

**Tier Notification Limits** (per 24h):
- Free: 10 replies, 5 evidence, 0 observation alerts
- Event Pass: 50 replies, 25 evidence, 10 observation alerts
- Evidence Analyst: 200 replies, 100 evidence, 50 observation alerts

### Phase 13.1: ISO Following UI ✅
**Goal**: Follow/unfollow buttons on ISO pages

- [x] Add "Follow" button to ISO detail pages (`ISODetailHeader.tsx`)
- [x] Toggle state with optimistic UI
- [x] Show follow count on ISO cards (optional - `showCount` prop)
- [ ] "Following" tab on user profile (deferred to Sprint 15)
- [x] API endpoints:
  - `POST /api/iso/[id]/follow`
  - `DELETE /api/iso/[id]/follow`
  - `GET /api/iso/[id]/follow` (with follow count)
  - `GET /api/user/following`

### Phase 13.2: Notification Preferences UI ✅
**Goal**: Settings page for notification toggles

- [x] Create `/settings/notifications` page
- [x] Toggle: Reply notifications (on/off)
- [x] Toggle: Evidence notifications (on/off)
- [x] Toggle: Observation window alerts (tier-gated)
- [x] Show tier-based limits
- [x] Unsubscribe token link generation
- [x] API: `GET/PATCH /api/notifications/preferences`

### Phase 13.3: Email Notification Backend ✅
**Goal**: Resend integration for email delivery

- [x] Install Resend SDK (`lib/emails/send.ts`)
- [x] Create email templates:
  - Reply notification (`ReplyNotification.tsx`)
  - New evidence notification (`EvidenceNotification.tsx`)
  - Observation window alert (`ObservationWindowAlert.tsx`)
- [x] Email layout component (`EmailLayout.tsx`)
- [x] Notification helpers (`lib/notifications/helpers.ts`)
- [x] Rate limit enforcement per tier (via DB functions)
- [x] Unsubscribe link handling (`/api/notifications/unsubscribe`)

### Phase 13.4: Observation Window Alerts ✅
**Goal**: Alert users before ISO visibility windows

- [x] Calculate observation windows (existing visibility logic)
- [x] Cron job for notifications (`/api/cron/observation-windows`)
- [x] Schedule notifications 1, 3, 7 days before optimal viewing
- [x] Include: ISO name, window dates, days until window
- [x] Tier gate: Event Pass+ only

### Success Criteria ✅
- [x] Users can follow/unfollow ISOs
- [x] Notification preferences editable in settings
- [x] Email notifications ready via Resend (pending production env vars)
- [x] Rate limits enforced per tier
- [x] Observation alerts configured for Event Pass+

---

## 📋 SPRINT 14a: Landing Page Alignment

**PRD References**: `ideation/Landing Page Review_ isotracker.org & 3i-atlas.live.md`
**Status**: 🔲 PLANNED
**Dependencies**: Sprint 13 complete ✅
**Priority**: HIGH - Must fix before Stripe launch (wrong prices displayed)
**Estimated Time**: 4-6 hours

### Mission Objective

Align landing pages with evolved product strategy. Current pages show incorrect pricing, missing value proposition, and broken 3i-atlas.live strategy.

### Background

Per Landing Page Review document:
- isotracker.org shows wrong tier names and prices
- Missing "Evidence Framework" explanation (core differentiator)
- 3i-atlas.live is a redirect, not standalone email capture

### Phase 14a.1: Pricing Tier Correction (isotracker.org)
**Goal**: Fix pricing display to match product strategy

- [ ] Remove "Professional" tier ($19.99) - tier doesn't exist
- [ ] Rename "Explorer" → "Event Pass" ($4.99/mo)
- [ ] Rename "Analyst" → "Evidence Analyst" and fix price $9.99 → $19/mo
- [ ] Update pricing card descriptions:
  - Event Pass: "VIEW-ONLY evidence access, voting, observation alerts, auto-pauses between events"
  - Evidence Analyst: "Submit & assess evidence, cast verdicts, full year-round access"
- [ ] Update "POPULAR" badge to Evidence Analyst tier

### Phase 14a.2: Evidence Framework Section (isotracker.org)
**Goal**: Explain core value proposition clearly

- [ ] Create new section: "Go Beyond Speculation: The Evidence Framework"
- [ ] Visual explanation of two-step process:
  - Step 1: Assess Quality (Chain of Custody, Witness Credibility, Technical Analysis)
  - Step 2: Cast Your Verdict (alien | natural | uncertain + confidence)
- [ ] Show "Community Sentiment vs Scientific Consensus" concept
- [ ] Include sample visualization or mockup
- [ ] Position section above pricing for better conversion flow

### Phase 14a.3: 3i-atlas.live Standalone Page
**Goal**: Convert redirect to standalone email capture

- [ ] Create dedicated layout for 3i-atlas.live (no shared nav)
- [ ] Configure Vercel multi-domain routing (3i-atlas.live → /3i-atlas-landing)
- [ ] Design minimal page:
  - Headline: "3I/ATLAS is passing through our solar system RIGHT NOW."
  - Sub-headline: "Get real-time alerts when new evidence drops."
  - Single email input + "Notify Me" button
  - Social proof counter
  - Footer: "Powered by isotracker.org"
- [ ] Dark theme matching isotracker.org
- [ ] Mobile-first responsive design

### Phase 14a.4: Email Capture Backend
**Goal**: Store email signups from 3i-atlas.live

- [ ] Create `email_signups` table:
  - `id`, `email` (unique), `source` ('3i-atlas-live' | 'isotracker')
  - `created_at`, `converted_to_user_id` (nullable FK)
- [ ] Create `/api/email-capture` endpoint:
  - POST with email validation
  - Duplicate check (return success if already exists)
  - Store source for attribution
- [ ] Success state with confirmation message
- [ ] Optional: Welcome email via Resend

### Success Criteria
- [ ] Pricing tiers match product description (2 paid tiers, correct prices)
- [ ] Evidence Framework section explains core value prop
- [ ] 3i-atlas.live is standalone page (not redirect)
- [ ] Email captures stored in database with source tracking

---

## 📋 SPRINT 14: Payments & Tier Upgrades (Stripe)

**PRD References**: Section 7 "Pricing Tiers"
**Status**: 🔲 PLANNED
**Dependencies**: Sprint 14a complete (landing page must show correct prices first)
**Priority**: CRITICAL - Monetization
**Estimated Phases**: 4

### Mission Objective

Integrate Stripe for subscription payments, enabling users to upgrade to paid tiers. Handle checkout, webhooks, and subscription management.

### Background

**Pricing Tiers** (CORRECTED - see Landing Page Review):
- Spectator: Free (view-only access)
- Event Pass: $4.99/month (voting, observation alerts, auto-pauses between events)
- Evidence Analyst: $19/month (evidence submission, assessment, full access)

**NOTE**: Professional tier REMOVED. Landing page must be updated to match before Stripe launch.

**Existing DB** (needs updates):
- `subscriptions` table exists with `tier`, `status`, `stripe_customer_id`
- May need: `stripe_subscription_id`, `current_period_end`

### Phase 14.1: Stripe Configuration
**Goal**: Set up Stripe products and prices

- [ ] Create Stripe products in dashboard:
  - Event Pass ($4.99/mo)
  - Evidence Analyst ($19/mo)
- [ ] Store price IDs in environment variables
- [ ] Install `stripe` and `@stripe/stripe-js` packages
- [ ] Configure Stripe webhook endpoint URL

### Phase 14.2: Checkout Flow
**Goal**: Stripe Checkout for tier upgrades

- [ ] Create `/api/stripe/checkout` endpoint
  - Creates Stripe Checkout session
  - Includes user email, success/cancel URLs
  - Sets metadata: user_id, tier

- [ ] Create `PricingCard` component with "Upgrade" buttons
- [ ] Redirect to Stripe Checkout on click
- [ ] Success page: `/upgrade/success`
- [ ] Cancel page: `/pricing`

### Phase 14.3: Webhook Handler
**Goal**: Process Stripe events

- [ ] Create `/api/stripe/webhook` endpoint
- [ ] Verify webhook signature
- [ ] Handle events:
  - `checkout.session.completed` → Create/update subscription
  - `customer.subscription.updated` → Update tier
  - `customer.subscription.deleted` → Downgrade to free
  - `invoice.payment_failed` → Flag for follow-up

- [ ] Update `subscriptions` table:
  - Add `stripe_subscription_id` column if missing
  - Add `current_period_end` column if missing

### Phase 14.4: Subscription Management
**Goal**: Users can manage subscriptions

- [ ] Create `/settings/subscription` page
- [ ] Show current tier and billing date
- [ ] "Manage Subscription" → Stripe Customer Portal
- [ ] Create `/api/stripe/portal` endpoint
- [ ] Handle tier changes and cancellations

### Success Criteria
- [ ] Users can upgrade to Explorer/Analyst/Professional
- [ ] Stripe webhooks update subscriptions in DB
- [ ] Tier-gated features activate immediately
- [ ] Users can manage/cancel via Stripe Portal

---

## 📋 SPRINT 15: User Profile & Polish

**PRD References**: User profile, 3i-atlas.live email capture
**Status**: 🔲 PLANNED
**Dependencies**: Sprint 14 complete
**Priority**: MEDIUM - User experience polish
**Estimated Phases**: 4

### Mission Objective

Create user profile pages, implement 3i-atlas.live email capture backend, and final polish pass across the app.

### Phase 15.1: User Profile Page
**Goal**: `/profile/[id]` page showing user info

- [ ] Create `/profile/[id]/page.tsx`
- [ ] Display: Username, avatar, tier badge, join date
- [ ] Stats: Arguments submitted, evidence submitted, votes cast
- [ ] Activity feed: Recent arguments, evidence, comments
- [ ] "Edit Profile" for own profile

### Phase 15.2: Profile Settings
**Goal**: `/settings/profile` for editing profile

- [ ] Display name edit
- [ ] Avatar upload (optional - can defer)
- [ ] Email preferences link
- [ ] Subscription management link
- [ ] Delete account flow (optional - can defer)

### Phase 15.3: 3i-atlas.live Email Capture
**Goal**: Backend for standalone landing page

- [ ] Create `email_captures` table:
  - `id`, `email`, `source` ('3i-atlas-live' | 'isotracker')
  - `captured_at`, `converted_at`
  - Unique constraint on email

- [ ] Create `/api/email-capture` endpoint
  - POST with email validation
  - Check for existing capture
  - Optional: Send welcome email via Resend

- [ ] Connect 3i-atlas.live form to endpoint
- [ ] Success toast/redirect on capture

### Phase 15.4: Final Polish & QA
**Goal**: Production-ready polish

- [ ] Loading states across all pages
- [ ] Error boundaries for graceful failures
- [ ] Empty states with CTAs
- [ ] Mobile responsive audit (375px)
- [ ] Performance audit (Lighthouse)
- [ ] SEO: Meta tags, OG images
- [ ] Accessibility audit (WCAG 2.1 AA)

### Success Criteria
- [ ] User profile pages display correctly
- [ ] 3i-atlas.live captures emails to database
- [ ] No console errors in production
- [ ] Lighthouse performance > 80
- [ ] All tier gates working correctly

---

## 📋 PRE-LAUNCH TASKS

**Status**: 🔲 PLANNED
**Dependencies**: All sprints complete
**Priority**: CRITICAL - Required before going live with users

### Database Synchronization
- [ ] Sync staging database with production schema
  - Apply all migrations (017+) to staging
  - Verify feature parity between environments
  - Document which migrations need to be applied
- [ ] Establish post-launch workflow:
  - All migrations go to staging FIRST
  - Test on staging before production
  - Production deployment only after staging validation

### Pre-Launch Checklist
- [ ] All tier gates tested with real Stripe subscriptions
- [ ] Production environment variables verified
- [ ] Error monitoring configured (Sentry or similar)
- [ ] Backup strategy confirmed
- [ ] Domain/DNS final configuration

---

## 📋 SPRINT SUMMARY - Remaining Work

| Sprint | Focus | Status | Priority |
|--------|-------|--------|----------|
| 11 | Community Arguments & Voting | ✅ COMPLETE | HIGH |
| 12 | Evidence Tab & Comments | ✅ COMPLETE | HIGH |
| 13 | ISO Following & Notifications | ✅ COMPLETE | MEDIUM |
| **14a** | **Landing Page Alignment** | 🔲 Planned | **HIGH** |
| 14 | Stripe Payments | 🔲 Planned | CRITICAL |
| 15 | User Profile & Polish | 🔲 Planned | MEDIUM |

**Next Up**: Sprint 14a (Landing Page Alignment) - Must fix pricing before Stripe launch

**Rationale**: Landing page shows wrong tier names and prices. Must align with product strategy before enabling payments. Sprint 14a includes:
- Fix pricing tiers (remove Professional, correct names/prices)
- Add Evidence Framework explainer section
- 3i-atlas.live standalone email capture page

---

## 📋 COMPLETED SPRINTS (Archive)

### SPRINT 7: Orbital Visualization & NASA API Integration
**Status**: ✅ COMPLETE (Nov 19, 2025)
[Details preserved in completed-project-plan.md]

### SPRINT 8: Observation Planning & Visibility Features
**Status**: ✅ COMPLETE (Nov 22, 2025)
[Full details in previous project-plan.md version]

---

**Last Updated**: 2025-11-23
**Next Review**: Sprint 14a kickoff
