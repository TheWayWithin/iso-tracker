# ISO Tracker MVP - Project Implementation Plan

**Mission**: ISO Tracker Development - Evidence-Based Analysis Platform
**Started**: 2025-11-09
**Status**: 🟢 Active - Sprint 14 COMPLETE, Sprint 15 NEXT
**Last Updated**: 2025-12-19

---

## 🚀 CURRENT STATUS

**Site URL**: https://www.isotracker.org
**Current Sprint**: Sprint 14 COMPLETE - Sprint 15 NEXT
**MVP Status**: Stripe integration complete in TEST mode, ready for production setup

### What's Done (Sprint 14):
- ✅ Stripe TEST products created (4 price IDs)
- ✅ Checkout session API working
- ✅ Success/cancel pages functional
- ✅ Landing page pricing with annual toggle
- ✅ Mobile fixes (Nov 28): tabs, dates, input contrast, orbital visualization
- ✅ AuthModal component with email/password + Google OAuth button
- ✅ Pricing buttons wired to show auth modal before checkout
- ✅ Post-auth redirect to Stripe checkout
- ✅ Webhook handler for subscription events
- ✅ Subscription management page with Stripe Portal

### Before Production Launch:
- ⚠️ **Enable Google OAuth** in Supabase dashboard (user action)
- ⚠️ **Fix env vars** - Remove hardcoded Stripe keys, fix Next.js env loading
- ⚠️ **Create LIVE Stripe products** - Switch from TEST to LIVE mode
- ⚠️ **Configure webhook URL** in Stripe dashboard

### What's Next:
- ⏳ **Sprint 15**: User Profile & Polish
- ⏳ **Sprint 16**: Loeb Scale Content & Evidence Population

### Completed Sprints (Archived):
- ✅ Sprint 7-13: See `completed-project-plan.md`
- ✅ Sprint 14a: Landing page alignment, email capture backend

---

## 📋 COMPLETED SPRINTS (Summary)

| Sprint | Focus | Completed |
|--------|-------|-----------|
| 9 | Landing Page Realignment | Nov 22 |
| 10 | Loeb Scale Assessment Engine | Nov 22 |
| 11 | Community Arguments & Voting | Nov 23 |
| 12 | Evidence Tab & Threaded Comments | Nov 23 |
| 13 | ISO Following & Notifications | Nov 23 |
| 14a | Landing Page Alignment & Email Capture | Nov 23 |

**Full details**: See `completed-project-plan.md`

---

## 📋 SPRINT 14: Payments & Tier Upgrades (Stripe)

**PRD References**: Section 7 "Pricing Tiers"
**Status**: 🟡 IN PROGRESS
**Dependencies**: Sprint 14a complete ✅
**Priority**: CRITICAL - Monetization
**Estimated Phases**: 5

### Mission Objective

Integrate Stripe for subscription payments, enabling users to upgrade to paid tiers. Handle checkout, webhooks, and subscription management.

### Background

**Final Pricing Structure** (Nov 24, 2025):
- **Spectator**: Free (view-only access)
- **Event Pass**: $4.99/mo or $49.95/year ("2 months free" - 17% off)
- **Evidence Analyst**: $9.95/mo or $79.95/year ("4 months free" - 33% off)

**Pricing Strategy**:
- Event Pass annual: Modest savings (8% off) to keep users considering upgrade
- Evidence Analyst annual: Strong value (33% off) to drive annual conversions
- Gap between annual tiers: Only $30/year ($2.50/mo) makes upselling easy

**Existing DB**:
- `subscriptions` table exists with `tier`, `status`, `stripe_customer_id`
- May need: `stripe_subscription_id`, `current_period_end`, `billing_interval`

### Phase 14.0: Update Landing Page Pricing ✅ COMPLETE
**Goal**: Update isotracker.org with new pricing before Stripe setup

- [x] Update Event Pass pricing card:
  - Monthly: $4.99/mo
  - Annual: $49.95/year with "2 MONTHS FREE" badge
  - Toggle or tabs to switch between monthly/annual view

- [x] Update Evidence Analyst pricing card:
  - Monthly: $9.95/mo (was $19/mo)
  - Annual: $79.95/year with "4 MONTHS FREE" badge
  - Keep "POPULAR" badge

- [x] Update feature descriptions if needed
- [x] Test responsive layout with annual pricing toggle
- [x] Commit changes before moving to Stripe

### Phase 14.1: Stripe Configuration ✅
**Goal**: Set up Stripe products and prices

- [x] Create Stripe products in dashboard:
  - Event Pass Monthly ($4.99/mo recurring) - price_1SXKwiIiC84gpR8HwTjbwBct
  - Event Pass Annual ($49.95/year recurring) - price_1SXKwiIiC84gpR8HOdkFFchm
  - Evidence Analyst Monthly ($9.95/mo recurring) - price_1SXKzxIiC84gpR8HYQXRjUZp
  - Evidence Analyst Annual ($79.95/year recurring) - price_1SXKzxIiC84gpR8H5dJFNv7p
- [x] Store price IDs in environment variables (4 price IDs)
- [ ] Install `stripe` and `@stripe/stripe-js` packages
- [ ] Configure Stripe webhook endpoint URL

### Phase 14.2: Authentication Before Checkout ✅ COMPLETE
**Goal**: Require authentication before Stripe checkout
**Status**: Auth modal and pricing flow implemented

#### Completed:
- [x] Create `/api/stripe/checkout` endpoint
- [x] TEST Stripe price IDs configured
- [x] Checkout redirects to Stripe successfully
- [x] Success/cancel pages working

**Task 1: Auth Modal Component** ✅
- [x] Create `AuthModal` component in `components/auth/`
- [x] Reuse existing sign-in/sign-up form logic
- [x] Modal overlay (not full page redirect)
- [x] Close button and click-outside-to-close (Escape key too)
- [x] Loading states during auth

**Task 2: Wire Pricing Buttons** ✅
- [x] Update "Join Now" buttons on landing page
- [x] On click: Check if authenticated (via checkout API response)
- [x] If NOT authenticated → Open AuthModal
- [x] If authenticated → Redirect to Stripe checkout
- [x] Pass selected tier/price to checkout after auth

**Task 3: Google OAuth** ✅
- [ ] Enable Google provider in Supabase dashboard (USER ACTION NEEDED)
- [x] Add "Continue with Google" button to AuthModal
- [x] Handle OAuth callback → redirect to Stripe
- [ ] Test full flow: Google → Stripe → Success (NEEDS TESTING)

**Task 4: Post-Auth Checkout Redirect** ✅
- [x] Store selected tier in component state before auth
- [x] After successful auth, retrieve plan and redirect to Stripe via `handleAuthSuccess()`
- [x] Implemented in both `page.tsx` and `PricingCard.tsx`

#### Known Issues (to fix before production):
- ⚠️ Hardcoded Stripe TEST keys in checkout route (env vars not loading)
- ⚠️ Google OAuth needs enabling in Supabase dashboard

#### Existing Auth Components (reuse these):
- `/app/auth/sign-up/page.tsx` - Sign-up form logic
- `/app/auth/sign-in/page.tsx` - Sign-in form logic
- `/app/auth/actions.ts` - `signUp()`, `signIn()` server actions
- `/app/auth/callback/route.ts` - OAuth callback (ready for Google)

#### Design Decision:
Auth BEFORE payment is the standard SaaS pattern:
- User has account immediately
- Stripe subscription links to existing user
- No webhook complexity for account creation

### Phase 14.3: Webhook Handler ✅ COMPLETE
**Goal**: Process Stripe events

- [x] Create `/api/stripe/webhook` endpoint
- [x] Verify webhook signature (with fallback for dev)
- [x] Handle events:
  - `checkout.session.completed` → Create/update subscription
  - `customer.subscription.updated` → Update tier
  - `customer.subscription.deleted` → Downgrade to free
  - `invoice.payment_failed` → Flag for follow-up

- [x] Database already has required columns (stripe_subscription_id, current_period_end)

### Phase 14.4: Subscription Management ✅ COMPLETE
**Goal**: Users can manage subscriptions

- [x] Create `/settings/subscription` page
- [x] Show current tier and billing date
- [x] "Manage Subscription" → Stripe Customer Portal
- [x] Create `/api/stripe/portal` endpoint
- [x] Handle tier changes and cancellations (via portal)

### Success Criteria
- [x] Users can upgrade to Event Pass/Evidence Analyst
- [x] Stripe webhooks update subscriptions in DB
- [x] Tier-gated features activate immediately (via webhook)
- [x] Users can manage/cancel via Stripe Portal

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
  - [ ] Create LIVE Stripe price IDs (switch Stripe to Live mode, recreate 4 products)
  - [ ] Set LIVE Stripe keys in Vercel/Railway environment variables
  - [ ] Update production env vars with LIVE price IDs
- [ ] Error monitoring configured (Sentry or similar)
- [ ] Backup strategy confirmed
- [ ] Domain/DNS final configuration

---

## 📋 SPRINT SUMMARY - Remaining Work

| Sprint | Focus | Status | Priority |
|--------|-------|--------|----------|
| **14** | **Stripe Payments + Auth Modal** | ⏳ IN PROGRESS | **CRITICAL** |
| 15 | User Profile & Polish | 🔲 Planned | MEDIUM |
| **16** | **Loeb Scale Content & Evidence** | 🔲 Planned | **P1 - CRITICAL** |

**Current Focus**: Sprint 14 Phase 14.2 - Auth Modal before Stripe checkout

**Next Tasks**:
1. Create AuthModal component
2. Wire "Join Now" buttons to show modal
3. Add Google OAuth (optional)
4. Complete checkout flow

**After Sprint 14**: Sprint 16 (Content) recommended before Sprint 15 (Polish) - content is the core differentiator

---

## 📋 SPRINT 16: Loeb Scale Content & Evidence Population

**PRD References**: Section 4.3.1 (Loeb Scale Assessment Dashboard), 4.3.2 (Evidence Tracking), 4.7 (Data Visualization)
**Status**: 🔲 PLANNED
**Dependencies**: Sprint 14 complete (Loeb Scale components exist)
**Priority**: P1 - CRITICAL - Core scientific content that differentiates platform
**Estimated Phases**: 5

### Mission Objective

Populate the ISO Tracker platform with comprehensive, scientifically-sourced evidence content for all three known interstellar objects. Transform the existing Loeb Scale framework from empty scaffolding into a rich, interactive evidence repository that enables meaningful community assessment and debate.

### Background

The Loeb Scale components and Evidence framework exist but contain minimal seed data. This sprint focuses entirely on content population and UI refinement to display that content effectively. Research has been completed on:

- **1I/'Oumuamua**: 6 major evidence categories, Level 4 assessment
- **2I/Borisov**: Control case with standard comet behavior, Level 0 assessment
- **3I/ATLAS (C/2025 N1)**: 8 anomalies identified, Level 4 assessment

**Evidence Card Structure** (per research):
- **Claim**: Clear statement of the finding
- **Source**: Primary scientific paper or data source (clickable link)
- **The Data**: Summary of quantitative data
- **Natural Interpretation**: How this can be explained naturally
- **Anomalous Interpretation**: Why this is unusual or suggestive of technology
- **Community Vote**: Natural / Anomalous / Uncertain (Analyst tier)

**Loeb Scale Reference**:
| Zone | Levels | Classification |
|------|--------|----------------|
| Green | 0-1 | Natural Objects |
| Yellow | 2-4 | Anomalous Objects |
| Orange | 5-7 | Suspected Technology |
| Red | 8-10 | Confirmed Technology |

---

### Phase 16.0: Database Schema Extension & Seed Infrastructure
**Goal**: Extend evidence schema for dual-interpretation content, then seed comprehensive data

**Architecture Alignment Note**:
- Existing `evidence` table has: evidence_type, title, description, methodology, source_url, quality_score
- Need to add new columns for Natural/Anomalous interpretation format from research
- Existing `loeb_scale_assessments` already has: official_level, official_zone, criteria_met, evidence_links
- The 0-10 Loeb Scale levels complement the existing 9-category rubric (100pt system)

**Schema Migration** (create `supabase/migrations/019_evidence_interpretations.sql`):
- [ ] Add `natural_interpretation` TEXT column to `evidence` table
- [ ] Add `anomalous_interpretation` TEXT column to `evidence` table
- [ ] Add `anomaly_rating` ENUM ('none', 'low', 'medium', 'high') to `evidence` table
- [ ] Add `evidence_category` TEXT column for grouping (Orbital, Composition, Morphology, etc.)
- [ ] Add `is_seed_content` BOOLEAN DEFAULT false to distinguish admin-seeded vs user-submitted
- [ ] Create index on `evidence_category` for filtering
- [ ] Update RLS policies to allow public read of seed content

**Seed Data** (create `supabase/migrations/020_loeb_evidence_seed.sql`):
- [ ] Seed official `loeb_scale_assessments` for all 3 ISOs with:
  - official_level, official_zone, official_reasoning, official_source
  - criteria_met JSONB arrays
  - evidence_links JSONB arrays with source citations
- [ ] Seed evidence records for all three ISOs (35+ total items)
- [ ] Ensure idempotent with ON CONFLICT DO UPDATE
- [ ] Test migration against local Supabase
- [ ] Document seeding process in `/docs/SEED-DATA.md`

---

### Phase 16.1: 1I/'Oumuamua Evidence Population
**Goal**: Seed comprehensive evidence cards for 'Oumuamua (~15 individual evidence items across 6 categories)

**Official Assessment**: Level 4 (Highly Anomalous - Yellow Zone)

**Category 1: Non-Gravitational Acceleration**
- [ ] Evidence: 30σ acceleration deviation from gravitational trajectory
  - Source: [Micheli et al. 2018, Nature](https://www.nature.com/articles/s41586-018-0254-4)
  - Natural: Comet-like outgassing of invisible material
  - Anomalous: Propulsion or solar sail effect
  - Anomaly Rating: HIGH (most significant finding)

- [ ] Evidence: No visible outgassing despite acceleration magnitude
  - Source: Spitzer Space Telescope observations
  - Natural: Dark carbonaceous crust trapping volatiles
  - Anomalous: Non-volatile propulsion mechanism

- [ ] Evidence: Acceleration scales exactly as r⁻² from Sun
  - Source: Micheli et al. 2018
  - Natural: Consistent with radiation pressure physics
  - Anomalous: Matches light sail design predictions

**Category 2: Physical Morphology**
- [ ] Evidence: Extreme aspect ratio (6:1 to 10:1 elongation)
  - Source: Light curve analysis, Meech et al. 2017 (Nature)
  - Natural: Rare but possible natural fracture/formation
  - Anomalous: Optimized geometry for solar sailing

- [ ] Evidence: Tumbling rotation (8.1-hour period)
  - Source: Photometric observations from multiple observatories
  - Natural: Impact-induced non-principal axis rotation
  - Anomalous: Damaged or derelict craft

- [ ] Evidence: Unusually high reflectivity for asteroid
  - Source: Albedo measurements
  - Natural: Metallic surface composition
  - Anomalous: Artificial metallic construction

**Category 3: Spectroscopic Anomalies**
- [ ] Evidence: No emission lines detected (unlike any known comet)
  - Source: Multiple observatory spectroscopy
  - Natural: Extinct comet or metallic asteroid
  - Anomalous: Non-volatile artificial material

- [ ] Evidence: Reddish color from cosmic ray exposure
  - Source: Color photometry
  - Natural: Long interstellar journey (>100 Myr exposure)
  - Anomalous: Aged material (neutral - both possibilities)

**Category 4: Orbital Characteristics**
- [ ] Evidence: Hyperbolic orbit (e=1.2) confirming interstellar origin
  - Source: JPL orbit determination
  - Natural: Ejected from another star system
  - Anomalous: Deliberate interstellar trajectory

- [ ] Evidence: Approached from solar apex direction
  - Source: Orbital analysis
  - Natural: Statistical coincidence (~1-2%)
  - Anomalous: Potential reconnaissance trajectory

- [ ] Evidence: V∞ (26.3 km/s) matches Local Standard of Rest
  - Source: Orbital mechanics analysis
  - Natural: Coincidence within velocity distribution
  - Anomalous: "Parked" probe or buoy at LSR

**Category 5: Size & Thermal Constraints**
- [ ] Evidence: No thermal emission detected by Spitzer
  - Source: Spitzer Space Telescope infrared observations
  - Natural: Very small or very highly reflective
  - Anomalous: Thin, low-mass structure (sail-like)

- [ ] Evidence: Size estimates range 100m to 1km (10x uncertainty)
  - Source: Brightness-albedo degeneracy calculations
  - Natural: Uncertainty in surface reflectivity
  - Anomalous: Shape/structure affects standard calculations

**Category 6: Hydrogen Outgassing Hypothesis**
- [ ] Evidence: H₂ ice sublimation proposed as explanation
  - Source: Seligman & Laughlin 2020
  - Natural: Would explain acceleration without visible coma
  - Status: Debated - requires unusual formation conditions

- [ ] Create 'Oumuamua assessment record: Level 4 (Yellow Zone)
- [ ] Assessment justification: "Multiple significant anomalies (acceleration, shape, no outgassing) challenge conventional comet/asteroid models. Natural explanations require multiple unlikely coincidences."

---

### Phase 16.2: 2I/Borisov Evidence Population (Control Case)
**Goal**: Seed evidence demonstrating normal cometary behavior for baseline comparison

**Official Assessment**: Level 0 (Confirmed Natural - Green Zone)

**Category 1: Cometary Activity (Normal)**
- [ ] Evidence: Visible coma detected at 3 AU from Sun
  - Source: Multiple ground-based observations
  - Interpretation: Standard cometary outgassing confirms natural origin
  - Anomaly Rating: NONE

- [ ] Evidence: Dust tail matching typical comet morphology
  - Source: Imaging observations worldwide
  - Interpretation: Normal sublimation-driven activity
  - Anomaly Rating: NONE

**Category 2: Composition (Familiar)**
- [ ] Evidence: Water, CO, CO₂ detected in spectrum
  - Source: Spectroscopic analysis from multiple observatories
  - Interpretation: Composition matches Solar System comets
  - Anomaly Rating: NONE

- [ ] Evidence: High CO/H₂O ratio (>173%, 3x Solar System average)
  - Source: ALMA observations
  - Interpretation: Formed in colder region of parent system
  - Anomaly Rating: LOW (within natural variation)

- [ ] Evidence: C₂-depleted compared to most Solar System comets
  - Source: Optical spectroscopy
  - Interpretation: Different formation environment (red dwarf?)
  - Anomaly Rating: LOW

**Category 3: Physical Properties**
- [ ] Evidence: Nucleus size ~1 km (975 meters)
  - Source: Size estimates from brightness
  - Interpretation: Typical comet dimensions
  - Anomaly Rating: NONE

- [ ] Evidence: Fragment broke off in March 2020
  - Source: Hubble Space Telescope observations
  - Interpretation: Normal cometary fragmentation behavior
  - Anomaly Rating: NONE

**Category 4: Orbital (Interstellar Confirmed)**
- [ ] Evidence: Hyperbolic orbit (e=3.36) confirming interstellar origin
  - Source: JPL orbit determination
  - Interpretation: Ejected from another planetary system
  - Anomaly Rating: NONE (expected for interstellar object)

- [ ] Create Borisov assessment record: Level 0 (Green Zone)
- [ ] Assessment justification: "Classic cometary behavior with visible coma, standard spectroscopy, and predictable trajectory. Represents baseline for 'normal' interstellar comet."

---

### Phase 16.3: 3I/ATLAS Evidence Population
**Goal**: Seed comprehensive evidence for ATLAS with 8 identified anomalies

**Official Assessment**: Level 4 (Highly Anomalous - Yellow Zone)

**Anomaly 1: Ecliptic Alignment (0.2% probability)**
- [ ] Evidence: Trajectory aligned within 5° of ecliptic plane
  - Source: ATLAS survey trajectory determination
  - Natural: Statistical outlier (1 in 500)
  - Anomalous: Deliberate Solar System approach angle
  - Anomaly Rating: HIGH

**Anomaly 2: Sunward Jet/Anti-tail**
- [ ] Evidence: Unusual sunward jet observed July-August 2025
  - Source: Ground-based imaging
  - Natural: Complex outgassing geometry (possible)
  - Anomalous: Not typical optical illusion anti-tail
  - Anomaly Rating: MEDIUM

**Anomaly 3: Extreme Size/Speed (<0.1% probability)**
- [ ] Evidence: ~1 million times more massive than 'Oumuamua
  - Source: Size estimates from photometry
  - Natural: Large objects can be ejected (rare)
  - Anomalous: Unusual among detected ISOs
  - Anomaly Rating: MEDIUM

- [ ] Evidence: Moving faster than both previous ISOs
  - Source: Velocity measurements
  - Natural: Wide velocity distribution possible
  - Anomalous: Combined with size is statistically unusual
  - Anomaly Rating: MEDIUM

**Anomaly 4: Fine-tuned Arrival Timing (0.005% probability)**
- [ ] Evidence: Close approaches to Mars, Venus, and Jupiter
  - Source: Trajectory analysis
  - Natural: Coincidental geometry
  - Anomalous: Planetary reconnaissance trajectory
  - Anomaly Rating: MEDIUM

- [ ] Evidence: Unobservable from Earth at perihelion (behind Sun)
  - Source: Visibility calculations
  - Natural: ~30% of objects pass during solar conjunction
  - Anomalous: Evasion of observation (speculative)
  - Anomaly Rating: LOW

**Anomaly 5: Industrial-like Composition (<1% probability)**
- [ ] Evidence: Nickel-to-Iron ratio orders of magnitude higher than comets
  - Source: Hibberd et al., arXiv:2510.11779
  - Natural: Unknown natural formation process
  - Anomalous: Resembles industrial nickel alloys
  - Anomaly Rating: HIGH (unprecedented)

- [ ] Evidence: Ni/CN ratio unlike all known comets including Borisov
  - Source: Spectroscopic comparison studies
  - Natural: Novel cometary type from metal-rich region
  - Anomalous: Processed metallic material
  - Anomaly Rating: HIGH

**Anomaly 6: Low Water Content**
- [ ] Evidence: Only 4% water by mass
  - Source: Spectroscopic analysis
  - Natural: Formed in water-poor region
  - Anomalous: Not typical icy body composition
  - Anomaly Rating: MEDIUM

**Anomaly 7: Extreme Negative Polarization (<1% probability)**
- [ ] Evidence: Unprecedented polarization signature
  - Source: Polarimetric observations
  - Natural: Unknown dust properties
  - Anomalous: Artificial surface structure
  - Anomaly Rating: HIGH

- [ ] Evidence: Outside range of all known asteroids and comets
  - Source: Comparative polarimetry database
  - Natural: New class of surface material
  - Anomalous: Non-natural material properties
  - Anomaly Rating: HIGH

**Anomaly 8: Wow! Signal Alignment (0.6% probability)**
- [ ] Evidence: Arrived from direction of 1977 Wow! Signal within 9°
  - Source: Trajectory vs historical signal comparison
  - Natural: Coincidence given search area
  - Anomalous: Possible connection to Wow! source
  - Anomaly Rating: LOW (speculative but notable)

**Cumulative Probability Calculation**:
- [ ] Evidence: Combined probability less than 1 in 10^16
  - Source: Avi Loeb analysis (Medium, October 2025)
  - Natural: Extremely rare natural object
  - Anomalous: Statistical anomalies suggest non-random origin
  - Anomaly Rating: SYNTHESIS

- [ ] Create ATLAS assessment record: Level 4 (Yellow Zone)
- [ ] Assessment justification: "Eight statistical anomalies with cumulative probability <10^-16. Individual anomalies each unusual; combination highly improbable for random natural object. Ongoing monitoring may revise assessment."

---

### Phase 16.4: UI Enhancements for Evidence Display
**Goal**: Extend existing components to display new dual-interpretation content

**Architecture Alignment Note**:
- Extend existing `EvidenceCard` component (`apps/web/components/evidence/EvidenceCard.tsx`)
- Extend existing `LoebScaleDashboard` component (`apps/web/components/loeb-scale/LoebScaleDashboard.tsx`)
- Extend existing `EvidenceList` component (`apps/web/components/evidence/EvidenceList.tsx`)
- Use existing API routes: `/api/evidence`, `/api/iso/[id]/loeb-scale`

**EvidenceCard Component Extensions** (`components/evidence/EvidenceCard.tsx`):
- [ ] Add "Source Citation" display with formatted DOI/arXiv links (use existing `source_url`)
- [ ] Add "Dual Interpretation" panel showing `natural_interpretation` vs `anomalous_interpretation`
- [ ] Add anomaly severity badge using new `anomaly_rating` field (none/low/medium/high)
- [ ] Style anomaly badges: none=gray, low=blue, medium=yellow, high=orange
- [ ] Add copy citation button for researchers

**LoebScaleDashboard Extensions** (`components/loeb-scale/LoebScaleDashboard.tsx`):
- [ ] Add "Key Anomalies" section pulling top 3 HIGH-rated evidence items per ISO
- [ ] Add evidence category breakdown using new `evidence_category` field
- [ ] Ensure official (0-10 level) vs community score comparison displays correctly
- [ ] Add "Based on X evidence items" count

**EvidenceList Extensions** (`components/evidence/EvidenceList.tsx`):
- [ ] Add category filter dropdown using `evidence_category` (Orbital, Composition, Morphology, etc.)
- [ ] Add anomaly rating filter using `anomaly_rating` (None/Low/Medium/High)
- [ ] Add source type filter using `evidence_type` (existing field)
- [ ] Add sort options: Date added, Anomaly rating, Vote count

**ISODetailTabs Integration** (`components/visualization/ISODetailTabs.tsx`):
- [ ] Ensure Loeb Scale tab shows official level badge prominently
- [ ] Add "Quick Stats" summary: Total evidence count, Anomaly breakdown by rating
- [ ] Update empty states to reference seed content availability

---

### Phase 16.5: Community Engagement Features
**Goal**: Enable tier-gated community participation per architecture tier system

**Architecture Alignment Note**:
- Tier hierarchy: Guest (free) → Event Pass ($4.99/mo) → Evidence Analyst ($9.95/mo)
- Use existing tier check functions in `lib/supabase/`
- Leverage existing APIs: `/api/arguments/[id]/vote`, `/api/iso/[id]/loeb-scale`
- Evidence votes table already exists from Sprint 12

**Evidence Voting System (Event Pass+ tier)**:
- [ ] Verify `evidence_votes` table accepts votes (may need schema check)
- [ ] Add vote count display to EvidenceCard (visible to all tiers)
- [ ] Add vote buttons with tier-gate check (use `check_tier()` function)
- [ ] Show "Upgrade to Event Pass to vote" CTA for Guest/Spectator tier
- [ ] Calculate and display community consensus percentage per evidence item
- [ ] Add "What the community thinks" summary (% Natural / Anomalous / Uncertain)

**Evidence Submission (Evidence Analyst tier only)**:
- [ ] Extend `EvidenceSubmissionForm` to include new fields:
  - natural_interpretation, anomalous_interpretation, anomaly_rating, evidence_category
- [ ] Implement source URL/DOI validation (regex for arxiv, doi, nature, etc.)
- [ ] Use existing moderation queue from Sprint 8 admin moderation
- [ ] Trigger notification on approval (existing notification system)
- [ ] Show "Upgrade to Evidence Analyst to submit" CTA for lower tiers

**Loeb Scale Voting (Evidence Analyst tier only)**:
- [ ] Use existing `/api/iso/[id]/loeb-scale` POST for user assessments
- [ ] Leverage existing `loeb_scale_votes` table (from migration 016)
- [ ] Display user rating distribution histogram on LoebScaleDashboard
- [ ] Auto-calculate community_level from votes (existing trigger handles this)
- [ ] Show Official vs Community comparison prominently

---

### Success Criteria

**Content Population**:
- [ ] 1I/'Oumuamua has 15+ evidence cards across 6 categories
- [ ] 2I/Borisov has 8+ evidence cards as natural control case
- [ ] 3I/ATLAS has 12+ evidence cards covering 8 anomalies
- [ ] Each evidence card has: Source URL, Natural interpretation, Anomalous interpretation, Anomaly rating
- [ ] Official Loeb Scale assessments exist for all three objects with justifications

**User Experience**:
- [ ] Evidence cards render correctly on desktop and mobile
- [ ] Loeb Scale dashboard shows meaningful data (not empty states)
- [ ] Filtering and sorting work correctly
- [ ] Source links open in new tab and are valid

**Community Features**:
- [ ] Voting works for Event Pass+ holders
- [ ] Vote counts display for all users
- [ ] Tier-gating shows appropriate upgrade prompts
- [ ] Community vs Official comparison visible on dashboard

---

**Last Updated**: 2025-12-01
**Next Review**: After Sprint 14 Auth Modal complete, then begin Sprint 16
