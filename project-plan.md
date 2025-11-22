# ISO Tracker MVP - Project Implementation Plan

**Mission**: ISO Tracker Development - Evidence-Based Analysis Platform
**Started**: 2025-11-09
**Status**: 🟢 Active - Sprint 10 COMPLETE ✅
**Last Updated**: 2025-11-22

---

## 🚀 CURRENT STATUS

**Site URL**: https://www.isotracker.org
**Current Sprint**: Sprint 10 COMPLETE ✅ (Nov 22, 2025)
**Previous Sprint**: Sprint 9 COMPLETE ✅ (Nov 22, 2025)
**MVP Status**: Core features complete, Loeb Scale assessment engine COMPLETE

### Recent Deliverables:
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
