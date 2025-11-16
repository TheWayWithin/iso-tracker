# Sprint 6 Completion Prompt

**Date**: 2025-11-16
**Site**: https://isotracker.org (LIVE)
**Goal**: Complete remaining Sprint 6 tasks with PRD alignment

---

## WHAT'S DONE

### Infrastructure ✅
- Domain configured (isotracker.org)
- Vercel environment variables set (Supabase, JWT_SECRET, CRON_SECRET, RESEND_API_KEY, PostHog, Sentry)
- Redirects working (3i-atlas.live → isotracker.org/3i-atlas, isotrack.org → isotracker.org)
- Analytics (PostHog) and error monitoring (Sentry) configured

### Content ✅
- Main landing page with marketing content (`apps/web/app/page.tsx`)
- /3i-atlas viral landing page (`apps/web/app/3i-atlas/page.tsx`)
- Build fixed (Resend lazy-loading in `apps/web/lib/emails/send.ts`)

---

## WHAT REMAINS (Priority Order)

### 1. ICONS (Phase 6.4) - REQUIRES EXTERNAL TOOL
Current icons are ASCII text placeholders, not real PNGs:
- `apps/web/public/icons/icon-192x192.png` - ASCII placeholder
- `apps/web/public/icons/icon-512x512.png` - ASCII placeholder
- Need: favicon.ico (32x32), OG image (1200x630)
- **Action**: Use external image generation tool to create actual PNG files

### 2. DATABASE MIGRATIONS (Phase 6.5) - P0
Two migrations created but NOT deployed to production:

**Migration 013** - `database/migrations/013_fix_evidence_tier_permissions.sql`
- Restricts evidence submission to Evidence Analyst tier ONLY
- Event Pass gets VIEW-ONLY access (core monetization strategy)

**Migration 014** - `database/migrations/014_fix_evidence_assessment_schema.sql`
- Adds new columns: chain_of_custody_score, witness_credibility_score, technical_analysis_score
- Adds verdict (alien/natural/uncertain) and confidence (1-10)
- Removes old fields: expertise_score, methodology_score, peer_review_score

**Action**: Run `supabase db push` or apply migrations manually in Supabase dashboard

### 3. UPDATE UI FOR NEW SCHEMA (Phase 6.5) - P0
After migrations, update the assessment form:

**File to Update**: Search for EvidenceAssessmentForm or similar in `apps/web/components/`

Current (OLD) schema fields:
- expertise_score (1-5)
- methodology_score (1-5)
- peer_review_score (1-5)

New (PRD-aligned) schema fields:
- chain_of_custody_score (1-5)
- witness_credibility_score (1-5)
- technical_analysis_score (1-5)
- verdict (enum: 'alien' | 'natural' | 'uncertain')
- confidence (1-10)

Two-step assessment process:
1. Quality Rubric: Score the 3 dimensions
2. Personal Verdict: Cast your verdict with confidence level

### 4. COMMUNITY SENTIMENT VISUALIZATION (Phase 6.5) - P0 CORE DIFFERENTIATOR
This is THE key feature that differentiates ISO Tracker. Shows:
- % alien verdicts
- % natural verdicts
- % uncertain verdicts
- Displayed with progress bars alongside Scientific Consensus

**Tasks**:
1. Update `consensus_snapshot` view to aggregate verdict percentages
2. Create `CommunitySentiment` UI component
3. Display on Evidence Dashboard (ISO detail page)

### 5. QA TESTING (Phase 6.6)
- [ ] Run Lighthouse audit (target: Performance >90, Accessibility >90)
- [ ] Test PWA install on iOS Safari
- [ ] Test PWA install on Android Chrome
- [ ] Test all user flows (signup, login, evidence submission)
- [ ] Verify email notifications work in production
- [ ] Test admin moderation workflow
- [ ] Security scan (OWASP headers, CSP validation)

---

## CRITICAL CONTEXT

### Tier Permissions (PRD Aligned)
```
Spectator (Free):
- View ISOs, evidence, assessments
- Follow ISOs
- NO evidence submission
- NO assessments

Event Pass ($4.99/mo):
- Everything in Spectator
- Email alerts
- Priority support
- VIEW-ONLY for evidence (NO submission)

Evidence Analyst ($19/mo):
- Everything in Event Pass
- Submit evidence
- Assess evidence (quality rubric + verdict)
- Cast verdicts with confidence
```

### Evidence Framework (Two-Step Process)
1. **Quality Rubric** (Objective):
   - Chain of Custody: How well-documented is the evidence trail?
   - Witness Credibility: How reliable is the source?
   - Technical Analysis: How sound is the methodology?

2. **Personal Verdict** (Subjective):
   - Verdict: alien | natural | uncertain
   - Confidence: 1-10 scale

### Key Files to Reference
- `project-plan.md` - Current sprint status and remaining tasks
- `architecture.md` - Technical design and tier permissions
- `product-description.md` - Product features and monetization
- `foundation/prds/Product-Requirements-Document.md` - Source of truth
- `database/migrations/` - Schema changes (013, 014)
- `apps/web/app/iso-objects/[id]/page.tsx` - ISO detail page (where sentiment goes)
- `apps/web/lib/supabase/` - Database client setup

### Database Tables (Current State)
- `profiles` - User profiles with tier field
- `subscriptions` - Stripe subscription tracking
- `evidence` - Evidence submissions (submitter_id, iso_id, etc.)
- `evidence_assessments` - Quality scores + verdicts
- `iso_objects` - Interstellar objects
- `consensus_snapshot` - Aggregated consensus (needs verdict aggregation)

---

## INSTRUCTIONS FOR NEXT SESSION

1. **Read these files first**:
   - `/project-plan.md` (line 85-132 for Phase 6.4-6.6)
   - `/architecture.md` (especially tier permissions and evidence schema)
   - `/database/migrations/013_fix_evidence_tier_permissions.sql`
   - `/database/migrations/014_fix_evidence_assessment_schema.sql`

2. **Prioritize**:
   - Icons require external tool (ask user)
   - Database migrations need user action (Supabase dashboard or CLI)
   - UI updates can proceed after migrations
   - Community Sentiment is P0 differentiator

3. **Test everything**:
   - Build locally: `pnpm build` in apps/web
   - Vercel auto-deploys on push
   - Verify tier permissions work correctly
   - Test evidence submission flow end-to-end

4. **Communication style**:
   - User has ADHD - brief context, specific steps, checkpoint after each task
   - One thing at a time
   - Don't overwhelm with information

---

## SUCCESS CRITERIA (Sprint 6 Complete)

- [x] Custom domain configured with SSL
- [x] All environment variables set in production
- [x] Main landing page with marketing content
- [x] /3i-atlas viral landing page
- [ ] Real PNG icons (not ASCII placeholders)
- [ ] Database migrations deployed
- [ ] Evidence assessment form uses new schema
- [ ] Community Sentiment visualization working
- [ ] Lighthouse Performance >90
- [ ] PWA installable on iOS and Android
- [ ] Email notifications working in production
- [ ] No critical bugs in QA testing

**When all checked, Sprint 6 is COMPLETE and site is ready for public launch.**

---

*Created 2025-11-16 for context preservation across sessions*
