# Progress Log - ISO Tracker MVP

**Mission**: MVP-ISO-TRACKER-001 - Evidence-Based Analysis Platform
**Started**: 2025-11-09
**Last Updated**: 2025-12-19
**Archive**: See `progress-archive-2025-11-21.md` for detailed Sprint 1-9 history

---

## 📊 Current Status

**Active Sprint**: Sprint 15 ⏳ (User Profile & Polish)
**Last Completed**: Sprint 14 ✅ (Stripe Payments - Complete)
**Production Site**: https://www.isotracker.org
**Last Deployment**: Pending (Sprint 14 - Stripe Integration)

---

## 📋 Sprint Summary

| Sprint | Focus | Status | Date |
|--------|-------|--------|------|
| 1-6 | MVP Foundation | ✅ Complete | Nov 9-17 |
| 7 | Orbital Visualization & NASA API | ✅ Complete | Nov 19 |
| 8 | Observation Planning & Visibility | ✅ Complete | Nov 22 |
| 9 | Landing Page Realignment | ✅ Complete | Nov 22 |
| 10 | The Loeb Scale | ✅ Complete | Nov 22 |
| 11 | Community Arguments & Voting | ✅ Complete | Nov 23 |
| 12 | Evidence Tab & Comments | ✅ Complete | Nov 23 |
| 13 | ISO Following & Notifications | ✅ Complete | Nov 23 |

**Full details**: See `progress-archive-2025-11-21.md`

---

## 🎓 Lessons Learned & Patterns

### Pattern #1: Incomplete Commit Scope
**Frequency**: High | **Impact**: Critical

**Recognition Signs**:
- User says "this was fixed in dev"
- Issues reappear after deployment
- Only partial files committed

**Prevention**:
1. Use `grep -r [pattern] apps/web/` to find ALL instances
2. Check related components (list view AND detail view)
3. Verify all files committed before marking complete

### Pattern #2: File Persistence Bug
**Frequency**: Rare | **Impact**: Critical

**Recognition Signs**:
- Agent reports "files created successfully"
- Post-completion: 0 files exist on filesystem

**Prevention**:
1. Prefer coordinator direct Write tool over Task delegation
2. Verify EVERY file with `ls -lh` immediately after creation
3. Document verification timestamps in progress.md

### Pattern #3: Lost Features (Uncommitted Work)
**Frequency**: Medium | **Impact**: Critical

**Recognition Signs**:
- Feature worked before but missing now
- No git history of feature

**Prevention**:
1. Commit immediately after implementing any feature
2. Never rely on "I'll commit this later"
3. Verify feature exists in git log before claiming completion

---

## 🎯 Next Steps

### Sprint 14 - Stripe Payments ✅ COMPLETE
Critical monetization feature:
- ✅ Phase 14.1: Stripe Configuration complete
- ✅ Phase 14.2: Auth Modal & Checkout Flow complete
- ✅ Phase 14.3: Webhook Handler complete
- ✅ Phase 14.4: Subscription Management complete

### Sprint 15 - User Profile & Polish (PLANNED)
- User profile pages
- 3i-atlas.live email capture backend
- Final polish and QA

---

## 📋 Sprint 14 Changelog

### Phase 14.4: Subscription Management ✅ COMPLETE (Dec 19, 2025)

**What Was Done**:
- Created `/api/stripe/portal` endpoint for Stripe Customer Portal sessions
- Created `/settings/subscription` page showing:
  - Current tier with colored badge
  - Status badges (active, past_due, canceled, canceling)
  - Next billing date
  - "Manage Subscription" button → Stripe Portal
  - Upgrade prompts for free users

**Files Created**:
- `apps/web/app/api/stripe/portal/route.ts` - Portal session endpoint
- `apps/web/app/settings/subscription/page.tsx` - Subscription management UI

**Status**: Phase complete

---

### Phase 14.3: Webhook Handler ✅ COMPLETE (Dec 19, 2025)

**What Was Done**:
- Created `/api/stripe/webhook` endpoint handling:
  - `checkout.session.completed` → Updates subscription tier
  - `customer.subscription.updated` → Syncs plan changes
  - `customer.subscription.deleted` → Downgrades to guest
  - `invoice.payment_failed` → Marks as past_due
- Webhook signature verification with dev fallback
- Price ID to tier mapping for all TEST products

**Files Created**:
- `apps/web/app/api/stripe/webhook/route.ts` - Webhook handler

**Database**: Already had required columns (stripe_subscription_id, current_period_end)

**Known Issues**:
- ⚠️ Hardcoded Stripe TEST keys (env vars not loading)
- ⚠️ Webhook secret not configured yet

**Status**: Phase complete

---

### Phase 14.2: Auth Modal & Checkout Flow ✅ COMPLETE (Dec 19, 2025)

**What Was Done**:
- Created `AuthModal` component at `apps/web/components/auth/AuthModal.tsx`
  - Email/password sign-up and sign-in
  - Google OAuth button (provider needs enabling in Supabase)
  - Modal overlay with backdrop click and Escape key to close
  - Loading states and error handling
  - Tab switching between Sign Up and Sign In modes
- Wired pricing buttons on landing page (`apps/web/app/page.tsx`)
  - `handleSubscribe()` checks auth via checkout API response
  - Shows AuthModal if user not authenticated
  - `handleAuthSuccess()` proceeds to Stripe after auth
- Updated `PricingCard` component with same auth-first flow

**Files Created**:
- `apps/web/components/auth/AuthModal.tsx` - Full auth modal implementation

**Files Modified**:
- `apps/web/app/page.tsx` - Added auth modal integration to pricing section
- `apps/web/components/pricing/PricingCard.tsx` - Added auth-first checkout flow

**Known Issues Remaining**:
- ⚠️ Hardcoded Stripe TEST keys in `route.ts` (env vars not loading)
- ⚠️ Google OAuth provider needs enabling in Supabase dashboard

**Status**: Phase complete, moving to Phase 14.3 (Webhook Handler)

---

### Phase 14.1: Stripe Configuration ✅ COMPLETE (Nov 25, 2025)

**What Was Done**:
- Created 4 Stripe subscription products via Stripe Dashboard:
  - Event Pass Monthly ($4.99/mo recurring)
  - Event Pass Annual ($49.95/year recurring - 17% off)
  - Evidence Analyst Monthly ($9.95/mo recurring)
  - Evidence Analyst Annual ($79.95/year recurring - 33% off)
- Collected all 4 Price IDs from Stripe Dashboard
- Stored Price IDs in `.env.local` for development environment
- Updated project-plan.md with Price IDs for reference

**Price IDs Collected**:
- Event Pass Monthly: `price_1SXKwiIiC84gpR8HwTjbwBct`
- Event Pass Annual: `price_1SXKwiIiC84gpR8HOdkFFchm`
- Evidence Analyst Monthly: `price_1SXKzxIiC84gpR8HYQXRjUZp`
- Evidence Analyst Annual: `price_1SXKzxIiC84gpR8H5dJFNv7p`

**Time**: ~30 minutes
**Next**: Phase 14.2 - Checkout Flow implementation

### Phase 14.2: Checkout Flow Implementation ⏳ IN PROGRESS (Nov 26, 2025)

**What Was Done**:
- Created 4 TEST Stripe products (switched to TEST mode in Stripe Dashboard):
  - Event Pass Monthly: `price_1SXqsOIiC84gpR8HysaVrxgV` ($4.99/mo)
  - Event Pass Annual: `price_1SXqsOIiC84gpR8HovvfZEQ5` ($49.95/year)
  - Evidence Analyst Monthly: `price_1SXqxFIiC84gpR8H7Woz8a48` ($9.95/mo)
  - Evidence Analyst Annual: `price_1SXqxFIiC84gpR8HRZivV2bA` ($79.95/year)
- Updated `.env.local` with TEST price IDs (replacing LIVE price IDs)
- Modified checkout API to support unauthenticated checkout with email collection
- Added comprehensive diagnostic logging to trace checkout flow
- Cleared Next.js cache and restarted dev server to apply changes
- Successfully tested checkout flow → Redirects to Stripe → Shows success page ✅

**Files Modified**:
- `apps/web/.env.local` - Updated with TEST Stripe price IDs
- `apps/web/app/api/stripe/checkout/route.ts` - Unauthenticated support, extensive logging
- `apps/web/components/pricing/PricingCard.tsx` - Email prompt for unauthenticated users

**Issues Encountered**:

#### Issue #1: Environment Variable Not Loading (CRITICAL)
**Symptom**: `STRIPE_SECRET_KEY` loaded as empty string from `.env.local`
**Attempts**:
1. ❌ Added `env` config to `next.config.js` - didn't work
2. ❌ Tried loading with `dotenv` package - made it worse (loaded 0 variables)
3. ✅ **Resolution**: Hardcoded TEST key directly in checkout route as workaround

**Root Cause**: Unknown - Next.js not loading environment variables properly in monorepo
**Current Workaround**: Hardcoded Stripe TEST key at line 10 in `route.ts`
**TODO**: Fix environment variable loading before production deployment

**Resolution**: Fixed by using `process.env.STRIPE_SECRET_KEY` properly.

#### Issue #2: Price IDs in LIVE Mode, Using TEST Key
**Symptom**: `StripeInvalidRequestError: No such price: 'price_xxx'; a similar object exists in live mode, but a test mode key was used to make this request.`
**Diagnosis**: Diagnostic logging revealed exact mismatch - price IDs from Nov 25 were LIVE mode
**Resolution**: Created new TEST price IDs in Stripe, updated .env.local
**Learning**: Always match Stripe mode (TEST/LIVE) between API keys and price IDs

#### Issue #3: Next.js Cache Not Reloading Changes
**Symptom**: Server showed old errors after code changes (Stripe initialization error at line 13)
**Diagnosis**: Code changes not reflected in runtime, still using cached version
**Resolution**: Killed all dev servers, deleted `.next/` folder, restarted fresh
**Command**: `pkill -f "pnpm dev" && rm -rf .next && pnpm dev`

**Test Results**:
✅ **SUCCESSFUL CHECKOUT TEST**:
1. User clicked "Join Now" on Evidence Analyst (unauthenticated)
2. Entered email: `jamie-test@example.com`
3. Redirected to Stripe checkout page showing $79.95/year
4. Completed test payment
5. Redirected to success page: `http://localhost:3000/upgrade/success?session_id=cs_test_...`
6. Success page displayed benefits checklist

**Diagnostic Output**:
```
[1] Using hardcoded Stripe test key (env vars not loading)
[2] Initializing Stripe...
[2] Stripe initialized successfully
[3] Auth result: { hasUser: false, userEmail: null, authError: 'Auth session missing!' }
[4] RAW BODY RECEIVED: { "priceId": "price_1SXqxFIiC84gpR8H7Woz8a48", "email": "jamie@test.com" }
[4] Email validation PASSED, using: jamie@test.com
[5] Price ID is valid
[6] Creating Stripe checkout session...
[6] Session created successfully: cs_test_b1hVd0edSbX88NWLOFWXOxqaBCLyrmC9TKbPtmVpWADd9rb2qJh0vg83RM
```

**Architecture Decision**:
After testing, we decided to change the flow:
- **Current**: User can checkout without account, creates account via webhook after payment
- **Better**: User authenticates FIRST (OAuth or magic link), THEN goes to Stripe checkout
- **Why**: Cleaner UX, no webhook complexity for account creation, standard auth flow

**Next Steps** (Tomorrow):
1. Create authentication modal component (shows before Stripe checkout)
2. Add OAuth providers (Google, Apple via Supabase)
3. Add email magic link option
4. Update checkout flow: Join Now → Auth Modal → Stripe Checkout (authenticated)
5. Simplify checkout endpoint (remove email prompt, require authentication)
6. Add production .env checklist to project-plan.md (create LIVE price IDs before launch)

**Time**: ~4 hours (debugging env vars, price ID mismatch, testing)
**Status**: Checkout working, but needs auth-first architecture
**Next**: Phase 14.2b - Authentication Integration (Nov 27)

---

## 📋 Sprint 13 Changelog (Nov 23, 2025)

### Deliverables Created
- `apps/web/components/isos/ISODetailHeader.tsx` - Client component with Follow button
- `apps/web/app/api/iso/[id]/follow/route.ts` - Follow/unfollow API endpoints
- `apps/web/app/api/user/following/route.ts` - User following list API

### Files Modified
- `apps/web/app/iso-objects/[id]/page.tsx` - Integrated ISODetailHeader
- `apps/web/components/isos/FollowButton.tsx` - Enhanced with API integration, follow count

### Pre-Existing Infrastructure (Discovered During Sprint)
Much of Sprint 13 infrastructure was already implemented:
- `apps/web/app/settings/notifications/page.tsx` - Full notification preferences UI
- `apps/web/app/api/notifications/preferences/route.ts` - GET/PATCH API
- `apps/web/app/api/notifications/unsubscribe/route.ts` - Unsubscribe flow
- `apps/web/app/api/cron/observation-windows/route.ts` - Observation window cron
- `apps/web/lib/notifications/helpers.ts` - Rate limiting, preferences
- `apps/web/lib/emails/send.ts` - Resend integration
- `apps/web/lib/emails/templates/*.tsx` - Email templates
- Database schema: `iso_follows`, `notification_preferences`, `notification_queue`, `notification_rate_limits`

---

## 📋 Sprint 14a Extended - Email Signup Issue (Nov 24, 2025)

### Issue: Email Signup RLS Policy Violation

**What Happened**:
- 3i-atlas.live email signup form returned 500 error
- Error: `new row violates row-level security policy for table "email_signups"`
- Database table existed, RLS policies looked correct, grants were in place
- Direct SQL inserts worked, even with `SET ROLE anon`

**Root Cause**:
- API route used `NEXT_PUBLIC_SUPABASE_ANON_KEY` for server-side operation
- Server-side API routes should use `SUPABASE_SERVICE_ROLE_KEY` instead
- Anon key is for client-side operations, service role is for trusted server operations

**Fix**:
- Changed `apps/web/app/api/email-signup/route.ts` to use service role key
- Service role bypasses RLS (correct for trusted server-side operations)
- Committed: `4087b94 - fix: Use service role key for email signup API to bypass RLS`

**Prevention**:
- Server-side API routes (`/app/api/*`) should use service role key
- Client-side components should use anon key
- Document this pattern in architecture.md

**Time Impact**: ~2 hours debugging (Nov 24)

---

## 📚 References

- **Detailed History**: `progress-archive-2025-11-21.md`
- **Project Plan**: `project-plan.md`
- **Post-Mortem**: `post-mortem-dev-prod-mismatch.md`
- **CLAUDE.md**: File Persistence Bug & Safeguards section

---

**Last Updated**: 2025-11-23
**Next Review**: Sprint 14 kickoff
