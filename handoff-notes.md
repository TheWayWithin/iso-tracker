# Phase 4.3 - Email Notifications Implementation REQUIRED

**Status**: 🔴 NOT STARTED (Previous session documentation was incorrect)
**Date**: 2025-01-12
**Critical Issue**: System crash in previous session caused documentation to be written but actual implementation files were NEVER created

---

## Current Actual State (Verified)

### ✅ What Actually Exists:

1. **Documentation Only**:
   - `/docs/deployment/vercel-cron-setup.md` ✅
   - `/docs/testing/phase-4-3-testing.md` ✅
   - `/docs/testing/phase-4-3-testing-summary.md` ✅
   - `vercel.json` ✅ (pushed to GitHub in commit 5085277)

2. **Sprint 3 Files** (Evidence Framework - unrelated to Phase 4.3):
   - Evidence API routes in `app/api/evidence/` ✅
   - Evidence components in `components/evidence/` ✅
   - Validation utilities in `lib/validation.ts` ✅

### ❌ What Does NOT Exist (MUST BE CREATED):

**All Phase 4.3 implementation files are missing:**

1. **Database Migration**:
   - `database/migrations/007_email_notifications.sql` ❌

2. **Email System** (`apps/web/lib/emails/`):
   - `send.ts` - Resend client wrapper ❌
   - `components/EmailLayout.tsx` - Shared email layout ❌
   - `templates/ReplyNotification.tsx` ❌
   - `templates/EvidenceNotification.tsx` ❌
   - `templates/ObservationWindowAlert.tsx` ❌

3. **Notification Logic** (`apps/web/lib/notifications/`):
   - `helpers.ts` - Rate limiting, tier validation, JWT ❌

4. **API Routes** (`apps/web/app/api/`):
   - `notifications/preferences/route.ts` (GET/POST) ❌
   - `notifications/unsubscribe/route.ts` (GET) ❌
   - `cron/observation-windows/route.ts` (GET) ❌
   - `comments/route.ts` (POST with reply notifications) ❌

5. **UI Components**:
   - `apps/web/components/isos/FollowButton.tsx` ❌
   - `apps/web/app/settings/notifications/page.tsx` ❌

6. **Modifications Needed**:
   - Modify `apps/web/app/iso/[id]/page.tsx` to add Follow button
   - Modify navigation to add Notifications link

---

## Implementation Requirements

### Phase 4.3.1: Database + Resend Setup (2h estimate)

**Migration Schema** (`007_email_notifications.sql`):

```sql
-- 3 new tables needed:
1. notification_preferences (user settings for 3 notification types)
2. notification_log (sent email tracking, 90-day retention)
3. iso_follows (user-ISO follow relationships)

-- Add to iso_objects table:
- observation_window_start TIMESTAMPTZ
- observation_window_end TIMESTAMPTZ
- visibility_notes TEXT

-- RLS policies with tier validation
-- Rate limiting function: get_user_daily_email_count()
```

**Environment Variables Needed**:
```bash
RESEND_API_KEY=<from Resend account>
JWT_SECRET=<64-byte hex for unsubscribe tokens>
CRON_SECRET=<32-byte hex for cron authentication>
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

**Dependencies to Install**:
```bash
cd apps/web
pnpm add resend @react-email/components jsonwebtoken
pnpm add -D @types/jsonwebtoken
```

---

### Phase 4.3.2: Email Templates (6h estimate)

**Required Components**:

1. **EmailLayout.tsx** - Shared wrapper with:
   - ISO Tracker branding header
   - Unsubscribe footer (JWT-secured link)
   - Mobile-responsive design

2. **ReplyNotification.tsx**:
   - Subject: "[User] replied to your comment on [ISO]"
   - Shows: Original comment excerpt + reply + link

3. **EvidenceNotification.tsx**:
   - Subject: "New evidence submitted for [ISO]"
   - Shows: Evidence type + submitter + link

4. **ObservationWindowAlert.tsx**:
   - Subject: "Observation window opening for [ISO]"
   - Shows: Window dates + visibility notes + link

---

### Phase 4.3.3: Core API (8h estimate)

**Notification Helpers** (`lib/notifications/helpers.ts`):
- `checkRateLimit(userId)` - Enforce 5 emails/24hr
- `canEnableNotification(userId, type)` - Tier validation
- `generateUnsubscribeToken(userId, type)` - JWT with 30-day expiry
- `verifyUnsubscribeToken(token)` - JWT verification

**API Endpoints**:
1. `GET/POST /api/notifications/preferences` - Fetch/update settings
2. `GET /api/notifications/unsubscribe?token=xxx` - One-click unsubscribe
3. `GET /api/cron/observation-windows` - Daily cron (CRON_SECRET auth)

---

### Phase 4.3.4: Notification Triggers (4h estimate)

**New API Routes**:
1. `POST /api/comments` - Comment submission + reply notification trigger
2. `POST /api/evidence` - Evidence submission + follower notification trigger

**Pattern**: Non-blocking Promise handling
```typescript
// Send notification without blocking user response
if (shouldNotify) {
  sendNotification(...).catch(error => {
    console.error('Notification failed:', error);
  });
}

return NextResponse.json({ success: true });
```

---

### Phase 4.3.5: UI Components (6h estimate)

**FollowButton.tsx**:
- Location: ISO detail page header
- Tier-gated: Evidence Analyst only
- Shows badge for non-EA users
- Redirects to `/pricing` for paywall
- Redirects to `/auth/signin` for logged-out users
- Optimistic UI updates

**NotificationsPage.tsx** (`/settings/notifications`):
- 3 toggle switches (reply, evidence, observation)
- Tier badges (Event Pass vs Evidence Analyst)
- Upgrade CTA for non-EA users
- WCAG 2.1 AA accessible
- Loading states + error handling

---

### Phase 4.3.6: Testing & Deployment (3h estimate)

**Already Complete**:
- ✅ `vercel.json` configuration (pushed to GitHub)
- ✅ Vercel cron setup documentation
- ✅ 29-test comprehensive testing checklist

**Still Needed**:
- Update project-plan.md with actual completion status
- Update progress.md with deliverable entries
- Manual QA testing (after implementation)

---

## Critical Guardrails for Implementation

### 1. File Existence Verification Protocol

**MANDATORY**: After creating EVERY file, verify it exists:

```bash
# After creating a file, immediately verify:
ls -la apps/web/lib/emails/send.ts
# If "No such file or directory" → File was NOT created, try again
```

**Verification Checklist** (Run after each phase):
- Phase 4.3.1: `ls -la database/migrations/007_*.sql`
- Phase 4.3.2: `find apps/web/lib/emails -type f`
- Phase 4.3.3: `ls -la apps/web/lib/notifications/helpers.ts && find apps/web/app/api/notifications -type f`
- Phase 4.3.4: `ls -la apps/web/app/api/comments/route.ts apps/web/app/api/cron/observation-windows/route.ts`
- Phase 4.3.5: `ls -la apps/web/components/isos/FollowButton.tsx apps/web/app/settings/notifications/page.tsx`

### 2. Architecture Alignment

**CRITICAL**: Follow existing architecture patterns:

**Database Schema Alignment**:
- Use existing table names: `iso_objects` (NOT `isos`), `subscriptions.tier` (NOT `profiles.tier`)
- Reference: `/database/schema.sql` and migrations `002_*.sql`, `003_*.sql`, `004_*.sql`

**API Pattern Alignment**:
- Use Supabase client: `createClient()` from `@/lib/supabase/server`
- RLS policies: Triple-layer validation (Database + API + UI)
- Error handling: Return `NextResponse.json({ error })` with proper status codes

**Component Pattern Alignment**:
- Use existing components: `Button` from `@/components/ui/button`
- Tailwind CSS: Follow existing utility class patterns
- TypeScript: Strict mode, no `any` types

### 3. Security-First Development

**NEVER compromise security** (per CLAUDE.md Critical Software Development Principles):

- ✅ RLS policies on ALL new tables
- ✅ Tier validation at Database + API + UI layers (defense in depth)
- ✅ JWT tokens for unsubscribe (no plain user IDs in URLs)
- ✅ Rate limiting enforced at database level (5 emails/24hr/user)
- ✅ CRON_SECRET authentication for cron endpoint
- ✅ HTML sanitization for email content (prevent XSS)

### 4. Tier Boundary Enforcement

**Event Pass ($4.99/mo)**:
- ✅ Reply notifications (can enable)
- ❌ Evidence notifications (cannot enable - show upgrade CTA)
- ❌ Observation window alerts (cannot enable - show upgrade CTA)
- ❌ Follow ISOs (cannot follow - redirect to /pricing)

**Evidence Analyst ($19/mo)**:
- ✅ All notification types (can enable all 3)
- ✅ Follow ISOs (unlimited follows)

**Implementation**: Check `subscriptions.tier` in database, validate in API, disable in UI

### 5. Progress Tracking Requirements

**After EACH phase completion**:

1. **Verify files exist** (use `ls` commands above)
2. **Mark phase complete** in project-plan.md
3. **Document deliverables** in progress.md
4. **Update handoff-notes.md** with findings

**NEVER mark a task [x] unless**:
- Files exist at specified paths ✅
- Files contain actual implementation (not empty) ✅
- Basic syntax check passes (no TypeScript errors) ✅

### 6. Testing Before Moving Forward

**After Phase 4.3.4** (before UI):
- Test API endpoints with curl/Postman
- Verify database migrations deployed
- Test Resend email sending (sandbox mode)

**After Phase 4.3.5** (before declaring complete):
- Run dev server: `pnpm dev`
- Verify pages load without errors
- Test Follow button (logged out, Event Pass, Evidence Analyst)
- Test preferences page (all scenarios)

---

## Success Criteria (Phase 4.3 Complete When)

**File Verification** (ALL must exist):
- [ ] `database/migrations/007_email_notifications.sql` exists
- [ ] 5 files in `apps/web/lib/emails/` exist
- [ ] `apps/web/lib/notifications/helpers.ts` exists
- [ ] 4 files in `apps/web/app/api/` exist (notifications/*, cron/*, comments)
- [ ] `apps/web/components/isos/FollowButton.tsx` exists
- [ ] `apps/web/app/settings/notifications/page.tsx` exists

**Functional Verification**:
- [ ] Database migration deploys without errors
- [ ] Dev server runs without TypeScript errors
- [ ] Follow button appears on ISO detail pages
- [ ] Preferences page accessible at `/settings/notifications`
- [ ] Tier boundaries enforced (checked via UI inspection)

**Documentation Verification**:
- [ ] project-plan.md updated with actual completion status
- [ ] progress.md has deliverable entries for all files created
- [ ] handoff-notes.md updated with implementation findings

---

## Next Steps After Phase 4.3 Complete

1. **User Testing** (3-4 hours):
   - Follow testing checklist: `/docs/testing/phase-4-3-testing.md`
   - Send test emails to personal inbox
   - Verify mobile email rendering

2. **Production Deployment** (30 minutes):
   - Deploy database migration to production Supabase
   - Verify Resend domain authentication
   - Monitor email delivery (Week 1)

3. **Sprint 4 Continuation**:
   - Phase 4.4: Community Guidelines & Moderation
   - Phase 4.5: Testing & Polish

---

## Reference Documentation

**Architecture**:
- `/docs/architecture/phase-4-3-decisions.md` - Phase 4.3 decisions (if exists)
- `/architecture.md` - Overall system architecture
- `/database/schema.sql` - Base database schema

**Testing**:
- `/docs/testing/phase-4-3-testing.md` - 29-test comprehensive checklist

**Deployment**:
- `/docs/deployment/vercel-cron-setup.md` - Vercel cron configuration guide

**Foundation Documents**:
- `/CLAUDE.md` - Critical Software Development Principles (MUST FOLLOW)
- `/foundation/prds/Product-Requirements-Document.md` - PRD Section 4.3

---

**Current State**: Ready for Phase 4.3 implementation to begin
**Next Action**: Implement Phase 4.3.1 (Database + Resend Setup)
**Estimated Total Time**: 29 hours (39h original estimate - 10h documentation already done)
