# Phase 4.3 Email Notifications - Implementation Prompt

**Use this prompt after `/clear` to continue Phase 4.3 implementation**

---

## Mission Brief: Sprint 4 Phase 4.3 - Email Notifications

You are implementing Phase 4.3 (Email Notifications) of Sprint 4 (Collaboration & Community Features) for ISO Tracker. Phase 4.1 (Voting System) and Phase 4.2 (Debate Threads) are complete.

---

## CRITICAL GUARDRAILS (MUST FOLLOW)

### 1. Strict PRD Adherence
- **ZERO scope creep**: Only implement features explicitly defined in PRD Section 4.3
- **No assumptions**: If unclear, ask user before proceeding
- **PRD alignment checkpoint**: Verify each deliverable matches PRD requirements BEFORE implementation

### 2. Foundation Documents Authority
- **Read FIRST**: agent-context.md, handoff-notes.md, progress.md, PRD.md
- **Follow exactly**: Architecture decisions in `/docs/architecture/phase-4-3-decisions.md`
- **User decisions finalized**: All 5 design decisions confirmed (see handoff-notes.md)

### 3. Security-First Development (NON-NEGOTIABLE)
- **Defense in depth**: Database RLS + API validation + UI tier-gating
- **Never compromise security**: If convenience conflicts with security, choose security
- **Root cause analysis**: Understand WHY before implementing fixes
- **Critical Software Development Principles**: Follow CLAUDE.md guidelines

### 4. Evidence-First Workflow
- **Document everything**: Update progress.md after EACH deliverable
- **Log all attempts**: Record failed attempts, not just successes
- **Root cause analysis**: Mandatory for all errors encountered
- **Handoff documentation**: Update handoff-notes.md with findings

### 5. ADHD-Friendly Communication
- **Brief context first**: 1-2 sentences explaining what and why
- **Exact instructions**: Specific steps from current state, not general suggestions
- **Closure points**: Ask for confirmation after each major step
- **Handle overwhelm**: Offer recaps if user seems stuck

---

## Phase 4.3 Scope (From PRD Section 4.3)

### Core Features (MUST IMPLEMENT)
1. **Reply Notifications**: Email when someone replies to your comment (Event Pass tier)
2. **Evidence Notifications**: Email when new evidence submitted for followed ISOs (Evidence Analyst tier)
3. **Observation Window Alerts**: Email 7 days before ISO enters observation window (Evidence Analyst tier)
4. **Notification Preferences**: User settings page to enable/disable each type
5. **Follow ISO**: Manual button on ISO detail pages (explicit consent, GDPR)
6. **Rate Limiting**: Max 5 emails per user per 24 hours
7. **Unsubscribe**: One-click unsubscribe link in all emails (JWT token)

### Tier Boundaries (MUST ENFORCE)
- **Event Pass ($4.99/mo)**: Reply notifications ONLY
- **Evidence Analyst ($19/mo)**: All 3 notification types (reply + evidence + observation)
- **Spectators (free)**: No email notifications

### Technical Requirements (MUST MEET)
- **Delivery Latency**: <5 minutes for reply/evidence notifications
- **Email Provider**: Resend ($20/mo, React Email templates)
- **GDPR Compliance**: Explicit consent, one-click unsubscribe, 90-day data retention
- **Security**: Triple-layer validation (RLS + API + UI)

---

## User Decisions Finalized (2025-01-11)

**All 5 design decisions confirmed**:

1. ✅ **Observation Window Timing**: 7 days before (single email, not day-of reminder)
2. ✅ **Geographic Filtering**: Defer to Phase 5 (send to all followers, include visibility info in email)
3. ✅ **ISO Following**: Manual "Follow ISO" button (explicit consent, GDPR-compliant)
4. ✅ **Observation Data Source**: Manual admin entry (add fields to `isos` table, not NASA API)
5. ✅ **Notification History**: Just preferences page (no history UI, defer to Phase 5)

**See**: `/docs/architecture/phase-4-3-decisions.md` for full rationale.

---

## Implementation Overview

### Database Schema (4 Components)
1. **notification_preferences** table - User settings (3 toggle switches)
2. **notification_log** table - Sent email tracking (rate limiting + audit)
3. **iso_follows** table - Users following ISOs (for evidence notifications)
4. **isos** table additions - observation_window_start, observation_window_end, visibility_notes

### Email Provider: Resend
- **Technology**: React Email (type-safe JSX templates)
- **Cost**: $20/mo (50k emails)
- **Setup**: Account creation + domain verification required

### API Endpoints (4 Total)
1. `POST /api/notifications/preferences` - Update user settings (tier-gated)
2. `GET /api/notifications/preferences` - Fetch current settings
3. `POST /api/notifications/send` - Internal email trigger (service role only)
4. `GET /api/notifications/unsubscribe?token=JWT` - One-click unsubscribe
5. `GET /api/cron/observation-windows` - Daily cron job (Railway scheduler)

### Email Templates (3 Types)
- **ReplyNotification.tsx** - "User X replied to your comment"
- **EvidenceNotification.tsx** - "New evidence for ISO Y"
- **ObservationWindowAlert.tsx** - "ISO Z entering observation window"

### UI Components (2 New)
- **FollowButton.tsx** - "Follow ISO" button on ISO detail page header
- **NotificationsPage.tsx** - `/settings/notifications` preferences page

### Notification Triggers (3 Events)
- **Reply**: Triggered in `POST /api/evidence/[id]/comments` when parent_comment_id exists
- **Evidence**: Triggered in `POST /api/evidence` for all ISO followers
- **Observation**: Triggered by daily cron job at 00:00 UTC (7 days before window)

---

## Critical Implementation Requirements

### 1. Tier Validation (MUST ENFORCE - Triple Layer)

**Layer 1: Database RLS**
```sql
CREATE POLICY "Evidence Analyst features only"
  ON notification_preferences
  WITH CHECK (
    CASE
      WHEN evidence_notifications = true OR observation_window_alerts = true
      THEN EXISTS (
        SELECT 1 FROM subscriptions
        WHERE user_id = auth.uid()
          AND tier = 'evidence_analyst'
          AND status = 'active'
      )
      ELSE true
    END
  );
```

**Layer 2: API Endpoint**
```typescript
const tier = await getUserSubscriptionTier(user.id);
if (tier !== 'evidence_analyst' && body.evidence_notifications) {
  return NextResponse.json(
    { error: 'Evidence Analyst subscription required' },
    { status: 403 }
  );
}
```

**Layer 3: Frontend UI**
```typescript
{userTier !== 'evidence_analyst' && (
  <div className="opacity-50 cursor-not-allowed">
    <Toggle disabled />
    <Badge>Evidence Analyst Only</Badge>
  </div>
)}
```

### 2. Rate Limiting (MUST ENFORCE - Check Before Send)

```typescript
// ALWAYS check before sending
const dailyCount = await supabase.rpc('get_user_daily_email_count', {
  p_user_id: userId
});

if (dailyCount >= 5) {
  console.warn(`Rate limit exceeded: ${userId}`);
  return false; // Don't send, don't throw error
}

// Send email...

// ALWAYS log after sending
await supabase.from('notification_log').insert({
  user_id: userId,
  notification_type: type,
  email_subject: subject,
  resend_email_id: result.id,
  sent_at: new Date().toISOString()
});
```

### 3. Unsubscribe Token Security (MUST USE JWT)

```typescript
// Generate secure JWT token (30-day expiry)
const token = jwt.sign(
  {
    user_id: userId,
    type: notificationType,
    purpose: 'unsubscribe'  // Prevent token reuse
  },
  process.env.JWT_SECRET!,
  { expiresIn: '30d' }
);

// Verify token in unsubscribe endpoint
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
if (decoded.purpose !== 'unsubscribe') {
  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
}
```

### 4. Cron Job Authentication (MUST VERIFY SECRET)

```typescript
// Railway cron hits public endpoint - MUST authenticate
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... cron logic
}
```

---

## Implementation Order (Recommended)

### Phase 1: Database + Resend Setup (5h)
1. Create migration `007_email_notifications.sql` (see handoff-notes.md for full schema)
2. Deploy migration to Supabase
3. Test RLS policies with test user accounts
4. Create Resend account at resend.com
5. Install npm packages: `npm install resend @react-email/components jsonwebtoken @types/jsonwebtoken`

### Phase 2: Email Templates (6h)
6. Create `/lib/emails/templates/ReplyNotification.tsx`
7. Create `/lib/emails/templates/EvidenceNotification.tsx`
8. Create `/lib/emails/templates/ObservationWindowAlert.tsx`
9. Create `/lib/emails/components/EmailLayout.tsx` (shared wrapper with unsubscribe footer)
10. Test templates with React Email dev server (`npm run email:dev`)

### Phase 3: Core API (8h)
11. Create `/lib/emails/send.ts` (Resend client wrapper)
12. Implement rate limiting helper (`checkRateLimit()`)
13. Implement tier validation helper (`canEnableNotification()`)
14. Implement `POST /api/notifications/preferences`
15. Implement `GET /api/notifications/preferences`
16. Implement `GET /api/notifications/unsubscribe`

### Phase 4: Notification Triggers (4h)
17. Add reply notification to `POST /api/evidence/[id]/comments`
18. Add evidence notification to `POST /api/evidence` (if exists, else create endpoint)
19. Implement `GET /api/cron/observation-windows`
20. Configure Railway cron job

### Phase 5: UI Components (6h)
21. Create `/components/isos/FollowButton.tsx` (tier-gated, paywall for Event Pass)
22. Add Follow button to `/app/isos/[id]/page.tsx` header
23. Create `/app/settings/notifications/page.tsx` (3 toggle switches)
24. Add link to notifications settings in user dropdown menu

### Phase 6: Testing & Deployment (6h)
25. Write unit tests (tier validation, rate limiting, JWT tokens)
26. Write integration tests (API endpoints)
27. Manual QA: Send test emails to personal inbox (all 3 types)
28. Test mobile email rendering (iOS Mail, Gmail app)
29. Deploy to Railway
30. Update progress.md with complete deliverables list

---

## Environment Variables Required

**Add to Railway and `.env.local`**:
```bash
# Resend
RESEND_API_KEY=re_...

# JWT Secret (for unsubscribe tokens)
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-secret-key-min-32-chars

# Railway Cron Auth
# Generate: openssl rand -hex 32
CRON_SECRET=random-secret-for-cron

# Stripe (for tier validation - should already exist)
STRIPE_SECRET_KEY=sk_...
STRIPE_EVENT_PASS_PRICE_ID=price_...
STRIPE_EVIDENCE_ANALYST_PRICE_ID=price_...

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://isotracker.com
```

---

## Database Migration (007_email_notifications.sql)

**Full schema available in**: `/handoff-notes.md` (sections: "Database Schema", "Notification Triggers")

**Key Components**:
- `notification_preferences` table with RLS policies
- `notification_log` table with rate limiting function
- `iso_follows` table for evidence notifications
- `isos` table additions: observation_window_start, observation_window_end, visibility_notes
- Triggers: Auto-create preferences for new users
- Functions: `get_user_daily_email_count(user_id UUID)`

---

## Testing Checklist

### Unit Tests (Required)
- [ ] `canEnableNotification(tier, type)` - Tier validation logic
- [ ] `checkRateLimit(userId)` - Rate limiting (5/day)
- [ ] `generateUnsubscribeToken(userId, type)` - JWT generation
- [ ] `verifyUnsubscribeToken(token)` - JWT verification

### Integration Tests (Required)
- [ ] `POST /api/notifications/preferences` - Tier enforcement (403 for Event Pass trying Evidence Analyst features)
- [ ] `GET /api/notifications/preferences` - Fetch settings
- [ ] `POST /api/notifications/send` - Rate limit enforcement (6th email blocked)
- [ ] `GET /api/notifications/unsubscribe` - Token validation

### Manual QA (Required)
- [ ] Send test reply notification to personal email
- [ ] Send test evidence notification
- [ ] Send test observation window alert
- [ ] Verify mobile rendering (iOS Mail + Gmail app)
- [ ] Click unsubscribe link → verify preference updates
- [ ] Test Follow button (follow → unfollow)
- [ ] Test preferences page (save, tier validation)
- [ ] Test rate limiting (send 6 emails, expect 6th skipped)

### Resend Setup (Required Before Production)
- [ ] Create Resend account at resend.com
- [ ] Add domain verification DNS records (TXT record)
- [ ] Test with sandbox email first: `delivered@resend.dev`
- [ ] Verify production domain before launching

---

## Warnings & Gotchas

### ⚠️ Domain Verification Required
- Resend emails WON'T SEND until domain verified
- DNS propagation takes 1-2 hours
- Test with sandbox email first: `delivered@resend.dev`

### ⚠️ Tier Validation is Critical
- **NEVER** allow Evidence Analyst features for Event Pass users
- Validate tier on BOTH client (UX) and server (security)
- Check subscription `status = 'active'` (not just tier name)

### ⚠️ Rate Limiting Must Be Enforced
- Check rate limit BEFORE sending (prevent spam)
- Log email AFTER sending (accurate count)
- Don't throw errors on rate limit (silent skip + log warning)

### ⚠️ Cron Job Must Have Auth
- Railway cron hits public endpoint
- MUST verify `CRON_SECRET` in Authorization header
- Return 401 if secret missing/incorrect

### ⚠️ Unsubscribe Tokens Must Be Secure
- Use JWT with signature (not raw user IDs in URL)
- Include `purpose: 'unsubscribe'` claim (prevent token reuse)
- Verify signature before processing unsubscribe

### ⚠️ Follow Button is Evidence Analyst Only
- Check tier before allowing follow action
- Show paywall modal for Event Pass users
- Clear upgrade CTA ("Unlock evidence notifications")

### ⚠️ Next.js 15 Async Params
- Remember: `params` is `Promise<{ id: string }>` in Next.js 15
- Always `await params` before accessing properties
- See Phase 4.2 implementation for pattern

---

## Success Criteria (Phase 4.3 Complete When)

- [ ] Database migration deployed (3 new tables + isos fields)
- [ ] Resend account created and domain verified
- [ ] 3 email templates built and tested (reply, evidence, observation)
- [ ] 4 API endpoints implemented and tested
- [ ] Follow ISO button working on ISO detail pages (tier-gated)
- [ ] Preferences page accessible at `/settings/notifications`
- [ ] Cron job configured in Railway (daily 00:00 UTC)
- [ ] Rate limiting enforced (5 emails/day/user)
- [ ] Tier validation enforced (Event Pass vs Evidence Analyst)
- [ ] Unsubscribe links working in all emails
- [ ] Test emails successfully delivered to personal inbox
- [ ] Mobile email rendering verified (iOS + Android)
- [ ] progress.md updated with Phase 4.3 completion

---

## Reference Documents

**MUST READ BEFORE STARTING**:
- `/handoff-notes.md` - Complete implementation guide with code examples
- `/docs/architecture/phase-4-3-decisions.md` - User decisions and rationale
- `/agent-context.md` - Mission context and accumulated findings
- `/progress.md` - Sprint 4 progress (Phases 4.1 and 4.2 complete)
- `/foundation/prds/Product-Requirements-Document.md` - PRD Section 4.3

**Supporting Documents**:
- `/CLAUDE.md` - Critical Software Development Principles
- `/database/migrations/006_debate_threads.sql` - Pattern for RLS policies
- `/components/evidence/CommentSubmissionForm.tsx` - Pattern for tier-gated components

---

## Delegation Command

After `/clear`, use this command to start Phase 4.3 implementation:

```
/coord implement phase-4-3-implementation-prompt.md
```

**Or manual delegation**:

```
@developer

MISSION: Implement Phase 4.3 (Email Notifications) for Sprint 4.

CRITICAL: Read these files FIRST:
- /handoff-notes.md (complete implementation guide)
- /docs/architecture/phase-4-3-decisions.md (user decisions)
- /agent-context.md (mission context)
- /docs/phase-4-3-implementation-prompt.md (this file)

SCOPE: Implement ONLY features in PRD Section 4.3:
- 3 notification types (reply, evidence, observation)
- Resend integration with React Email templates
- 4 API endpoints (preferences, send, unsubscribe, cron)
- Follow ISO button (tier-gated)
- Notification preferences page
- Rate limiting (5/day)
- Triple-layer tier validation (RLS + API + UI)

GUARDRAILS:
- Zero scope creep (stick to PRD exactly)
- Security-first (never compromise for convenience)
- Triple-layer validation for all tier-gated features
- Update progress.md after EACH deliverable
- Follow implementation order in handoff-notes.md

ESTIMATE: 39 hours (5 days)

START: Phase 1 (Database migration + Resend setup)
```

---

## Post-Implementation Checklist

**Before marking Phase 4.3 complete**:
1. [ ] All 30 implementation steps complete (see handoff-notes.md)
2. [ ] All test checklists passing (unit, integration, manual)
3. [ ] Resend domain verified and emails sending
4. [ ] Railway cron job configured and tested
5. [ ] Environment variables added to Railway
6. [ ] progress.md updated with Phase 4.3 completion entry
7. [ ] handoff-notes.md updated with any issues/learnings
8. [ ] Test email sent to user's personal inbox (all 3 types)

**Then proceed to Phase 4.4** (Community Guidelines & Moderation)

---

**END OF PROMPT**

**Total Estimated Time**: 39 hours (~5 days for solo developer)
**Dependencies**: Resend account, Railway cron, domain verification
**Blocked On**: None (all user decisions finalized)
**Ready to Start**: YES ✅
