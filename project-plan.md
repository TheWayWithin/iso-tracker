# ISO Tracker MVP - Project Implementation Plan

**Mission**: ISO Tracker Development - Evidence-Based Analysis Platform
**Started**: 2025-11-09
**Status**: 🟢 Active - Sprint 9 IN PROGRESS
**Last Updated**: 2025-11-22

---

## 🚀 CURRENT STATUS

**Site URL**: https://www.isotracker.org
**Current Sprint**: Sprint 9 (Landing Page Realignment)
**Previous Sprint**: Sprint 8 COMPLETE ✅ (Nov 22, 2025)
**MVP Status**: Core features complete, landing page realignment in progress

### Recent Deliverables:
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
- 🔵 **Sprint 9** (Started Nov 22): Landing Page Realignment
  - Redesign isotracker.org homepage with wonder-driven messaging
  - Fix pricing tiers to match 4-tier strategy
  - Showcase live tracking features in hero
  - Create standalone 3i-atlas.live email capture page
  - Align with brand style guide colors and typography

### Archive:
- See `completed-project-plan.md` for Sprints 1-6 (MVP foundation complete)

---

## 🎯 SPRINT 9: Landing Page Realignment

**PRD References**: Brand Style Guide, Landing Page Analysis
**Status**: 🔵 IN PROGRESS (Started 2025-11-22)
**Dependencies**: Sprint 8 complete ✅
**Estimated Time**: 6-8 hours
**Priority**: HIGH - Critical for launch and conversion

### Mission Objective

Realign both landing pages (isotracker.org and 3i-atlas.live) with the brand strategy. Current pages have wrong positioning ("Evidence-Based Analysis" vs. "Track Interstellar Visitors"), wrong pricing tiers, and missing showcase of core tracking features.

### Gap Analysis (From Landing Page Review)

**Current Problems:**
| Issue | Current State | Required State |
|-------|---------------|----------------|
| Positioning | Academic "Evidence-Based Analysis" | Wonder-driven "Track Interstellar Visitors" |
| Hero | Text-only, no visualization | Live 2D sky map/tracker preview |
| Pricing | 3 tiers: Free/$4.99/$19 (wrong names) | 4 tiers: Free/$4.99/$9.99/$19.99 |
| Features | Evidence evaluation focus | Tracking + observation planning focus |
| 3i-atlas.live | Redirects to isotracker.org subpage | Standalone email capture page |
| Colors | slate-* Tailwind defaults | Brand colors (#0A1628, #2E5BFF, #FFB84D) |

### Phase 9.1: Design & Strategy Alignment
**Goal**: Create wireframes and confirm messaging strategy

- [ ] Review brand style guide requirements
  - Colors: Cosmic Deep Blue (#0A1628), Nebula Blue (#2E5BFF), Trajectory Gold (#FFB84D)
  - Typography: Space Grotesk (headlines), Inter (body), JetBrains Mono (data)
  - Mobile-first: 375px primary target
- [ ] Create isotracker.org homepage wireframe
  - Hero with live tracker preview component
  - Wonder-driven headline and copy
  - 4-tier pricing section
  - Feature showcase (tracking, observation planning, community)
- [ ] Create 3i-atlas.live wireframe
  - Single-page email capture focus
  - Urgency messaging ("3I/ATLAS Is Coming")
  - Simple form: email input + "Notify Me" CTA
  - Link to main platform
- [ ] Confirm pricing tier structure
  - Free: Basic tracking, ads
  - Explorer ($4.99/mo): Ad-free, real-time tracking
  - Analyst ($9.99/mo): Debate Dashboard, advanced community
  - Professional ($19.99/mo): Expert content, raw data exports

### Phase 9.2: isotracker.org Homepage Redesign
**Goal**: Transform homepage from academic to wonder-driven

**Hero Section**:
- [ ] New headline: "Track Interstellar Visitors" or similar wonder-driven copy
- [ ] New subheadline: Focus on discovery and the "are we alone?" question
- [ ] Add live tracker preview/sky map component
- [ ] Update CTAs: "Start Tracking Free" (primary), "Explore 3I/ATLAS" (secondary)

**Value Proposition Section**:
- [ ] Reframe from "Scientific Rigor" to tracking features
  - "Live Sky Tracking" - Real-time position in your sky
  - "Observation Planning" - Best times to observe from your location
  - "Community Debate" - Cast your vote: alien or natural?
- [ ] Add visual icons/illustrations (brand-aligned)

**Featured ISO Section**:
- [ ] Maintain 3I/ATLAS callout with urgency
- [ ] Add live data preview (current distance, velocity)
- [ ] Update copy to focus on tracking opportunity

**Pricing Section**:
- [ ] Implement 4-tier structure:
  - Free (Spectator): View tracking data, read community analysis
  - Explorer ($4.99): Ad-free, real-time alerts, observation planning
  - Analyst ($9.99): Debate dashboard, submit evidence, cast verdicts
  - Professional ($19.99): Expert analysis, raw data exports, API access
- [ ] Update tier names and feature lists
- [ ] Mark "Analyst" as POPULAR (monetizes debate feature)

**Footer & CTA**:
- [ ] Update final CTA copy to match wonder-driven tone
- [ ] Add social links if available
- [ ] Ensure mobile-optimized layout

**Brand Alignment**:
- [ ] Replace slate-* colors with brand colors
- [ ] Add Space Grotesk for headlines
- [ ] Ensure WCAG AAA contrast (7:1 minimum)
- [ ] Add Trajectory Gold accents for CTAs/highlights

### Phase 9.3: 3i-atlas.live Standalone Page
**Goal**: Create dedicated email capture landing page

**Requirements**:
- [ ] Create new standalone page (NOT a redirect)
- [ ] Hero section:
  - Headline: "3I/ATLAS Is Coming"
  - Subheadline: "The third interstellar visitor enters our solar system in 2025"
  - Urgency badge: "OBSERVATION WINDOW APPROACHING"
- [ ] Email capture form:
  - Single email input field
  - CTA button: "Notify Me" or "Get Alerts"
  - Privacy note: "We'll only email you about 3I/ATLAS updates"
- [ ] Brief info section:
  - What is 3I/ATLAS? (1-2 sentences)
  - Why it matters (1-2 sentences)
- [ ] Link to main platform:
  - "Want full tracking features? Visit ISO Tracker"
- [ ] Mobile-optimized (single column)
- [ ] Brand colors and typography

**Technical Options**:
- Option A: Separate Next.js app deployed to 3i-atlas.live
- Option B: Subdomain/path on isotracker.org with different layout
- Option C: Static HTML page deployed separately

### Phase 9.4: Testing & QA
**Goal**: Validate changes before production deployment

- [ ] Mobile responsiveness testing (375px, 768px, 1024px)
- [ ] Accessibility audit (WCAG AAA per brand guide)
  - Text contrast 7:1 minimum
  - Touch targets 44×44px minimum
  - Proper heading hierarchy
  - Alt text on images
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Link validation (all CTAs work)
- [ ] Form validation (email capture on 3i-atlas.live)
- [ ] Performance check (<3s page load)

### Success Criteria

**Positioning**:
- [ ] Headline conveys wonder/discovery, not academic analysis
- [ ] Features section showcases tracking/observation, not just evidence evaluation
- [ ] Tone is accessible and engaging

**Pricing**:
- [ ] 4-tier structure implemented
- [ ] Analyst tier ($9.99) marked as POPULAR
- [ ] Clear benefit differentiation between tiers

**Brand Alignment**:
- [ ] All colors match brand guide
- [ ] Typography system implemented (Space Grotesk, Inter)
- [ ] WCAG AAA compliance verified

**3i-atlas.live**:
- [ ] Standalone page (no redirect)
- [ ] Email capture functional
- [ ] Links to main platform work

---

## 📋 SPRINT 7: Orbital Visualization & NASA API Integration (COMPLETE)

**Status**: ✅ COMPLETE (Nov 19, 2025)
[Details preserved in completed-project-plan.md]

---

## 📋 SPRINT 8: Observation Planning & Visibility Features (COMPLETE)

**Status**: ✅ COMPLETE (Nov 22, 2025)
[Full details in previous project-plan.md version]

---

**Last Updated**: 2025-11-22
**Next Review**: When Sprint 9 phases complete
