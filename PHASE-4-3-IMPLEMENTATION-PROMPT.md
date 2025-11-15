# Phase 4.3: Email Notifications - Complete Implementation

**Mission**: Implement complete email notification system for ISO Tracker with 3 notification types: reply notifications, evidence notifications, and observation window alerts.

**Critical Context**: Previous session documented implementation as complete but files were NEVER created due to system crash. This is a fresh implementation from scratch.

---

## Pre-Flight Checklist

**Before starting, verify current state**:

```bash
# 1. Check what actually exists
ls -la vercel.json  # Should exist ✅
ls -la docs/deployment/vercel-cron-setup.md  # Should exist ✅
ls -la docs/testing/phase-4-3-testing.md  # Should exist ✅

# 2. Check Phase 4.3.1 partial completion
cat apps/web/package.json | grep -E "(resend|react-email|jsonwebtoken)"  # Should show all 3 ✅
grep "RESEND_API_KEY" apps/web/.env.local  # Should NOT exist yet ❌
ls -la database/migrations/007_email_notifications.sql  # Should NOT exist ❌

# 3. Check what does NOT exist (should all return "No such file")
find apps/web/lib/emails -type f  # Should return nothing ❌
ls -la apps/web/lib/notifications/helpers.ts  # Should NOT exist ❌
ls -la apps/web/components/isos/FollowButton.tsx  # Should NOT exist ❌

# 4. Confirm working directory
pwd  # Should be /Users/jamiewatters/DevProjects/ISOTracker
```

**Expected Output**:
- Documentation exists ✅
- Dependencies installed ✅
- Resend account created (ISOTracker Dev) ✅
- Environment variables NOT added yet ❌
- Migration 007 does NOT exist ❌
- Implementation files do NOT exist ❌

---

## Implementation Plan (6 Phases, ~27 hours remaining)

### Phase 4.3.1: Database + Resend Setup (~1.5h remaining) - 25% COMPLETE
- ✅ Dependencies installed (resend, @react-email/components, jsonwebtoken)
- ✅ Resend account created (ISOTracker Dev, API key obtained)
- ❌ Environment variables need to be added
- ❌ Migration 007 needs to be created
- ❌ Migration needs to be deployed

### Phase 4.3.2: Email Templates (6h) - NOT STARTED
### Phase 4.3.3: Core API (8h) - NOT STARTED
### Phase 4.3.4: Notification Triggers (4h) - NOT STARTED
### Phase 4.3.5: UI Components (6h) - NOT STARTED
### Phase 4.3.6: Testing & Documentation (3h) - NOT STARTED

---

## CRITICAL GUARDRAILS (Read First)

### Guardrail #1: File Existence Verification

**MANDATORY AFTER EVERY FILE CREATION**:

```bash
# After using Write tool to create ANY file, immediately verify:
ls -la <path-to-file>

# If "No such file or directory" → File was NOT created
# → STOP and try again before proceeding
```

**Example**:
```bash
# After creating apps/web/lib/emails/send.ts
ls -la apps/web/lib/emails/send.ts
# Expected: "-rw-r--r-- 1 ... send.ts"
# If "No such file": CREATE FAILED, retry Write tool
```

### Guardrail #2: Phase Completion Verification

**After EACH phase, run verification commands**:

```bash
# Phase 4.3.1 complete when:
ls -la database/migrations/007_email_notifications.sql
# Must show file size > 5000 bytes (not empty)

# Phase 4.3.2 complete when:
find apps/web/lib/emails -type f | wc -l
# Must show "5" (5 files created)

# Phase 4.3.3 complete when:
find apps/web/app/api/notifications -type f | wc -l
# Must show "2" (2 route files)
ls -la apps/web/lib/notifications/helpers.ts
# Must exist

# Phase 4.3.4 complete when:
ls -la apps/web/app/api/comments/route.ts
ls -la apps/web/app/api/cron/observation-windows/route.ts
# Both must exist

# Phase 4.3.5 complete when:
ls -la apps/web/components/isos/FollowButton.tsx
ls -la apps/web/app/settings/notifications/page.tsx
# Both must exist
```

**DO NOT proceed to next phase unless all files verified to exist.**

### Guardrail #3: Architecture Alignment

**CRITICAL**: Use existing table names and patterns:

**Database Tables** (check `/database/schema.sql`):
- ✅ Use `iso_objects` (NOT `isos`)
- ✅ Use `subscriptions.tier` (NOT `profiles.tier`)
- ✅ Use `profiles.id` for user foreign keys

**API Patterns** (check existing files in `apps/web/app/api/`):
- ✅ Import Supabase client: `import { createClient } from '@/lib/supabase/server'`
- ✅ Return format: `NextResponse.json({ success: true, data })`
- ✅ Error format: `NextResponse.json({ error: 'message' }, { status: 400 })`

**Component Patterns** (check existing files in `apps/web/components/`):
- ✅ Use existing UI components from `@/components/ui/*`
- ✅ Tailwind CSS for styling (no inline styles)
- ✅ TypeScript with proper types (no `any`)

### Guardrail #4: Security-First (NEVER Compromise)

Per CLAUDE.md Critical Software Development Principles:

**MANDATORY Security Requirements**:
- ✅ RLS policies on ALL new tables (notification_preferences, notification_log, iso_follows)
- ✅ Triple-layer tier validation: Database RLS + API check + UI disabled state
- ✅ JWT tokens for unsubscribe (30-day expiry, purpose claim)
- ✅ Rate limiting at database level (get_user_daily_email_count function)
- ✅ CRON_SECRET authentication for cron endpoint
- ✅ HTML sanitization for email content (use existing lib/validation.ts patterns)

**NEVER**:
- ❌ Store plain user IDs in URLs (use JWT tokens)
- ❌ Skip RLS policies ("we'll add later")
- ❌ Use `any` types to bypass TypeScript errors
- ❌ Expose internal IDs in API responses without authorization
- ❌ Skip input validation ("trust the frontend")

### Guardrail #5: Tier Boundary Enforcement

**Event Pass ($4.99/mo)** can:
- ✅ Enable reply notifications
- ❌ Enable evidence notifications (show upgrade CTA)
- ❌ Enable observation window alerts (show upgrade CTA)
- ❌ Follow ISOs (redirect to /pricing)

**Evidence Analyst ($19/mo)** can:
- ✅ Enable all 3 notification types
- ✅ Follow ISOs (unlimited)

**Implementation**: Query `subscriptions.tier` in:
1. Database RLS policies (WITH CHECK clause)
2. API routes (before operations)
3. UI components (disabled state with badge)

### Guardrail #6: Progress Tracking

**After EACH phase**:
1. ✅ Verify files exist (ls commands above)
2. ✅ Update project-plan.md (mark phase [x])
3. ✅ Update progress.md (add deliverable entries)
4. ✅ Update handoff-notes.md (document findings)

**NEVER mark task [x] unless**:
- Files exist at specified paths
- Files contain actual implementation (not empty)
- Basic syntax check passes (no obvious TypeScript errors)

---

## Phase 4.3.1: Database + Resend Setup

**Goal**: Create database migration, set up Resend account, install dependencies

**CURRENT STATUS**: ✅ Partially Complete
- ✅ Dependencies installed (resend 6.4.2, @react-email/components 1.0.0, jsonwebtoken 9.0.2)
- ✅ Resend account created (Name: "ISOTracker Dev", Key: re_NWcCUq7P_6v5He92YNSsv8vx8BszyNUdo)
- ❌ Environment variables NOT added to .env.local yet
- ❌ Migration 007 NOT created yet
- ❌ Migration NOT deployed yet

**REMAINING WORK**: Steps 1, 2, 4 only (Step 3 already done)

### Step 1: Create Migration File

**File**: `database/migrations/007_email_notifications.sql`

**Requirements**:

1. **Create 3 new tables**:
   - `notification_preferences` (user_id, reply_notifications, evidence_notifications, observation_window_alerts)
   - `notification_log` (id, user_id, notification_type, email_subject, resend_email_id, sent_at)
   - `iso_follows` (user_id, iso_object_id, followed_at)

2. **Add columns to iso_objects table**:
   - `observation_window_start TIMESTAMPTZ`
   - `observation_window_end TIMESTAMPTZ`
   - `visibility_notes TEXT`

3. **RLS Policies** on all 3 new tables:
   - SELECT: Users can read own records
   - INSERT: Users can insert own records (WITH tier check for evidence/observation)
   - UPDATE: Users can update own records
   - DELETE: Users can delete own records

4. **Rate Limiting Function**:
   ```sql
   CREATE OR REPLACE FUNCTION get_user_daily_email_count(user_id UUID)
   RETURNS INTEGER AS $$
   BEGIN
     RETURN (
       SELECT COUNT(*)
       FROM notification_log
       WHERE user_id = user_id
         AND sent_at > NOW() - INTERVAL '24 hours'
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

5. **Tier Check Function** (if not exists):
   ```sql
   CREATE OR REPLACE FUNCTION check_tier(user_id UUID)
   RETURNS TEXT AS $$
   BEGIN
     RETURN (
       SELECT tier
       FROM subscriptions
       WHERE user_id = user_id
       LIMIT 1
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

**After creating file**:
```bash
ls -la database/migrations/007_email_notifications.sql
# Verify file exists and size > 5000 bytes
```

### Step 2: Deploy Migration

```bash
# Use Supabase CLI to deploy
cd /Users/jamiewatters/DevProjects/ISOTracker
supabase db push --db-url "postgresql://postgres.vdgbmadrkbaxepwnqpda:N%7EVdZKx7%2AP%2BgHY@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

**Verify deployment**:
- Check Supabase dashboard → Table Editor
- Should see 3 new tables: notification_preferences, notification_log, iso_follows
- Should see new columns in iso_objects

### Step 3: Install Dependencies ✅ ALREADY COMPLETE

**Status**: ✅ Dependencies already installed
- resend: 6.4.2 ✅
- @react-email/components: 1.0.0 ✅
- jsonwebtoken: 9.0.2 ✅
- @types/jsonwebtoken: 9.0.10 ✅

**Verification**:
```bash
cat apps/web/package.json | grep -E "(resend|react-email|jsonwebtoken)"
# Should show all 3 packages - VERIFIED ✅
```

**SKIP THIS STEP - Already complete**

### Step 4: Add Environment Variables

**File**: `apps/web/.env.local` (add to existing file)

**IMPORTANT**: User has already created Resend account:
- Name: "ISOTracker Dev"
- API Key: `re_NWcCUq7P_6v5He92YNSsv8vx8BszyNUdo`

**Add these lines to the END of apps/web/.env.local**:

```bash
# =============================================================================
# EMAIL NOTIFICATIONS (Phase 4.3)
# =============================================================================
# Resend API Key - from "ISOTracker Dev" account
RESEND_API_KEY=re_NWcCUq7P_6v5He92YNSsv8vx8BszyNUdo

# JWT Secret for unsubscribe tokens (generate with command below)
JWT_SECRET=<GENERATE_WITH_COMMAND_BELOW>

# Cron Secret for observation window endpoint (generate with command below)
CRON_SECRET=<GENERATE_WITH_COMMAND_BELOW>

# App URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

**Generate secrets** (run these commands and paste results):
```bash
# JWT Secret (64 bytes) - paste result into JWT_SECRET=
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Cron Secret (32 bytes) - paste result into CRON_SECRET=
openssl rand -hex 32
```

**Example**:
```bash
# After running commands, your .env.local should have:
JWT_SECRET=cfafeab0e70b268ec8cd2bd0f7c65c4e3f735ffcc2ab122372ba2f1e8678fbb0231d688ac5937d30646a4036e34daded85bb1e5c4b384b32f3013e560ef0f490
CRON_SECRET=769493324a46b342285d7093b946fd146287d9414a3333456fcabdca82a95b31
```

**Phase 4.3.1 Complete When**:
- [ ] Migration file exists: `ls -la database/migrations/007_email_notifications.sql`
- [ ] Migration deployed to Supabase dev database
- [x] Dependencies installed: `pnpm list resend @react-email/components jsonwebtoken` ✅ VERIFIED
- [ ] Environment variables added to .env.local (verify with: `grep "RESEND_API_KEY" apps/web/.env.local`)
- [ ] Update project-plan.md: Mark Phase 4.3.1 [x]
- [ ] Update progress.md: Add deliverable entry

**SUMMARY**: Phase 4.3.1 is 25% complete (1 of 4 remaining steps done - dependencies installed)

---

## Phase 4.3.2: Email Templates

**Goal**: Create React Email templates for 3 notification types

### Step 1: Create Shared Email Layout

**File**: `apps/web/lib/emails/components/EmailLayout.tsx`

**Requirements**:
- Accept `children` prop
- ISO Tracker branding header (use Tailwind classes)
- Unsubscribe footer with JWT token link
- Mobile-responsive design (max-width: 600px)
- Use `@react-email/components` primitives

**Template Structure**:
```tsx
import { Html, Head, Body, Container, Section, Text, Link } from '@react-email/components';

interface EmailLayoutProps {
  children: React.ReactNode;
  unsubscribeUrl: string;
}

export default function EmailLayout({ children, unsubscribeUrl }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          {/* ISO Tracker Header */}
          <Section style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>ISO Tracker</Text>
          </Section>

          {/* Email Content */}
          {children}

          {/* Unsubscribe Footer */}
          <Section style={{ marginTop: '40px', borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
            <Text style={{ fontSize: '12px', color: '#888' }}>
              You're receiving this because you enabled notifications in ISO Tracker.
            </Text>
            <Link href={unsubscribeUrl} style={{ fontSize: '12px', color: '#888' }}>
              Unsubscribe from this notification type
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

**After creating**:
```bash
ls -la apps/web/lib/emails/components/EmailLayout.tsx
```

### Step 2: Create Reply Notification Template

**File**: `apps/web/lib/emails/templates/ReplyNotification.tsx`

**Requirements**:
- Show replier's name
- Show original comment excerpt (max 100 chars)
- Show reply excerpt (max 200 chars)
- Link to discussion thread
- Use EmailLayout wrapper

**After creating**:
```bash
ls -la apps/web/lib/emails/templates/ReplyNotification.tsx
```

### Step 3: Create Evidence Notification Template

**File**: `apps/web/lib/emails/templates/EvidenceNotification.tsx`

**Requirements**:
- Show ISO name
- Show evidence type
- Show submitter name
- Link to evidence detail
- Use EmailLayout wrapper

**After creating**:
```bash
ls -la apps/web/lib/emails/templates/EvidenceNotification.tsx
```

### Step 4: Create Observation Window Alert Template

**File**: `apps/web/lib/emails/templates/ObservationWindowAlert.tsx`

**Requirements**:
- Show ISO name
- Show window start/end dates
- Show visibility notes
- Link to ISO detail page
- Use EmailLayout wrapper

**After creating**:
```bash
ls -la apps/web/lib/emails/templates/ObservationWindowAlert.tsx
```

### Step 5: Create Resend Client Wrapper

**File**: `apps/web/lib/emails/send.ts`

**Requirements**:
- Initialize Resend client with API key
- Export `sendEmail` function
- Accept template props and render to HTML
- Return Resend response (email ID)

**Template**:
```typescript
import { Resend } from 'resend';
import { render } from '@react-email/components';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  template,
  props
}: {
  to: string;
  subject: string;
  template: React.ComponentType<any>;
  props: any;
}) {
  const html = render(template(props));

  const { data, error } = await resend.emails.send({
    from: 'ISO Tracker <notifications@isotracker.app>',
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
```

**After creating**:
```bash
ls -la apps/web/lib/emails/send.ts
```

**Phase 4.3.2 Complete When**:
- [x] All 5 files exist: `find apps/web/lib/emails -type f | wc -l` shows "5"
- [x] No TypeScript errors: `cd apps/web && pnpm tsc --noEmit`
- [x] Update project-plan.md: Mark Phase 4.3.2 [x]
- [x] Update progress.md: Add deliverable entries (5 files)

---

## Phase 4.3.3: Core API

**Goal**: Create notification helper functions and API routes

### Step 1: Create Notification Helpers

**File**: `apps/web/lib/notifications/helpers.ts`

**Requirements**:

1. **checkRateLimit(userId: string): Promise<boolean>**
   - Query notification_log for user's emails in last 24h
   - Return false if count >= 5, true otherwise

2. **canEnableNotification(userId: string, type: string): Promise<boolean>**
   - Query subscriptions.tier for user
   - Return true for reply (all tiers)
   - Return true for evidence/observation only if tier = 'evidence_analyst'

3. **generateUnsubscribeToken(userId: string, type: string): string**
   - Use jsonwebtoken.sign()
   - Payload: { userId, notificationType: type, purpose: 'unsubscribe' }
   - Secret: process.env.JWT_SECRET
   - Expiry: 30 days

4. **verifyUnsubscribeToken(token: string): { userId: string, notificationType: string }**
   - Use jsonwebtoken.verify()
   - Verify purpose === 'unsubscribe'
   - Return decoded payload

**After creating**:
```bash
ls -la apps/web/lib/notifications/helpers.ts
```

### Step 2: Create Preferences API Route

**File**: `apps/web/app/api/notifications/preferences/route.ts`

**Requirements**:

**GET /api/notifications/preferences**:
- Fetch user's notification_preferences from database
- Return: `{ reply_notifications, evidence_notifications, observation_window_alerts }`

**POST /api/notifications/preferences**:
- Accept body: `{ reply_notifications?, evidence_notifications?, observation_window_alerts? }`
- Validate tier before allowing evidence/observation enables (use canEnableNotification)
- Upsert into notification_preferences table
- Return: `{ success: true }`

**After creating**:
```bash
ls -la apps/web/app/api/notifications/preferences/route.ts
```

### Step 3: Create Unsubscribe API Route

**File**: `apps/web/app/api/notifications/unsubscribe/route.ts`

**Requirements**:

**GET /api/notifications/unsubscribe?token=xxx**:
- Verify JWT token (use verifyUnsubscribeToken helper)
- Disable notification in notification_preferences (set to false)
- Return: `{ success: true, message: 'Unsubscribed from [type]' }`

**After creating**:
```bash
ls -la apps/web/app/api/notifications/unsubscribe/route.ts
```

**Phase 4.3.3 Complete When**:
- [x] helpers.ts exists: `ls -la apps/web/lib/notifications/helpers.ts`
- [x] 2 API routes exist: `find apps/web/app/api/notifications -type f | wc -l` shows "2"
- [x] No TypeScript errors: `cd apps/web && pnpm tsc --noEmit`
- [x] Update project-plan.md: Mark Phase 4.3.3 [x]
- [x] Update progress.md: Add deliverable entries (3 files)

---

## Phase 4.3.4: Notification Triggers

**Goal**: Create API routes that trigger email notifications

### Step 1: Create Comments API Route

**File**: `apps/web/app/api/comments/route.ts`

**Requirements**:

**POST /api/comments**:
- Accept body: `{ parent_comment_id?, debate_thread_id, iso_object_id, content }`
- Insert comment into database
- **IF parent_comment_id exists**:
  - Find parent comment author
  - Check if author has reply_notifications enabled
  - Check rate limit (use checkRateLimit helper)
  - If both pass: Send reply notification (non-blocking Promise.catch)
- Return: `{ success: true, comment }`

**Non-blocking pattern**:
```typescript
if (parentComment && shouldNotify) {
  sendEmail({
    to: parentAuthor.email,
    subject: `${currentUser.name} replied to your comment`,
    template: ReplyNotification,
    props: { ... }
  }).catch(error => {
    console.error('Reply notification failed:', error);
  });
}

return NextResponse.json({ success: true, comment: newComment });
```

**After creating**:
```bash
ls -la apps/web/app/api/comments/route.ts
```

### Step 2: Create Cron Observation Windows Route

**File**: `apps/web/app/api/cron/observation-windows/route.ts`

**Requirements**:

**GET /api/cron/observation-windows**:
- Check Authorization header: `Bearer ${CRON_SECRET}`
- If incorrect: Return 401 Unauthorized
- Find ISOs where observation_window_start is in 7 days (±1 day tolerance)
- For each ISO:
  - Find users following the ISO
  - Check if user has observation_window_alerts enabled
  - Check rate limit
  - If both pass: Send observation window alert
- Return: `{ success: true, processed: count }`

**After creating**:
```bash
ls -la apps/web/app/api/cron/observation-windows/route.ts
```

### Step 3: Modify Evidence API Route

**Note**: Evidence API route likely already exists from Sprint 3

**File**: `apps/web/app/api/evidence/route.ts` (MODIFY existing)

**Add after evidence insert**:
```typescript
// After successfully inserting evidence
const { data: evidence } = await supabase.from('evidence').insert(...).single();

// Find followers of this ISO
const { data: followers } = await supabase
  .from('iso_follows')
  .select('user_id, profiles!inner(email)')
  .eq('iso_object_id', evidence.iso_object_id);

// Send evidence notifications (batch, max 50)
const emailPromises = followers
  .slice(0, 50)
  .map(async (follower) => {
    const canSend = await checkRateLimit(follower.user_id);
    if (!canSend) return null;

    return sendEmail({
      to: follower.profiles.email,
      subject: `New evidence for ${isoName}`,
      template: EvidenceNotification,
      props: { ... }
    });
  });

await Promise.allSettled(emailPromises);

return NextResponse.json({ success: true, evidence });
```

**After modifying**:
```bash
ls -la apps/web/app/api/evidence/route.ts
# File should already exist from Sprint 3, just verify modification
```

**Phase 4.3.4 Complete When**:
- [x] comments route exists: `ls -la apps/web/app/api/comments/route.ts`
- [x] cron route exists: `ls -la apps/web/app/api/cron/observation-windows/route.ts`
- [x] evidence route modified (verify with Read tool)
- [x] No TypeScript errors: `cd apps/web && pnpm tsc --noEmit`
- [x] Update project-plan.md: Mark Phase 4.3.4 [x]
- [x] Update progress.md: Add deliverable entries

---

## Phase 4.3.5: UI Components

**Goal**: Create Follow button and Notification preferences page

### Step 1: Create Follow Button Component

**File**: `apps/web/components/isos/FollowButton.tsx`

**Requirements**:
- Check user authentication (redirect to /auth/signin if logged out)
- Check user tier (query subscriptions.tier)
- If NOT evidence_analyst: Show badge "Evidence Analyst Required" + redirect to /pricing on click
- If evidence_analyst: Show "Follow" or "Unfollow" button
- On click: Insert/delete from iso_follows table
- Optimistic UI updates (immediate state change, rollback on error)
- Loading state during async operation

**Pattern**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function FollowButton({ isoObjectId }: { isoObjectId: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tier, setTier] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Check tier and follow status on mount
  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check tier
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      setTier(subscription?.tier || null);

      // Check follow status
      const { data: follow } = await supabase
        .from('iso_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('iso_object_id', isoObjectId)
        .single();

      setIsFollowing(!!follow);
    }

    checkStatus();
  }, [isoObjectId]);

  async function handleToggleFollow() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/signin');
      return;
    }

    if (tier !== 'evidence_analyst') {
      router.push('/pricing');
      return;
    }

    setIsLoading(true);
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      if (isFollowing) {
        await supabase.from('iso_follows').delete()
          .eq('user_id', user.id)
          .eq('iso_object_id', isoObjectId);
      } else {
        await supabase.from('iso_follows').insert({
          user_id: user.id,
          iso_object_id: isoObjectId
        });
      }
    } catch (error) {
      setIsFollowing(previousState);
      alert('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  }

  // Show tier badge for non-EA users
  if (tier && tier !== 'evidence_analyst') {
    return (
      <div className="flex items-center gap-2">
        <Button disabled variant="outline">
          Follow ISO
        </Button>
        <span className="text-xs text-gray-500">
          Evidence Analyst Required
        </span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={isLoading}
      variant={isFollowing ? 'outline' : 'default'}
    >
      {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow ISO'}
    </Button>
  );
}
```

**After creating**:
```bash
ls -la apps/web/components/isos/FollowButton.tsx
```

### Step 2: Add Follow Button to ISO Detail Page

**File**: `apps/web/app/iso/[id]/page.tsx` (MODIFY existing)

**Add to page header**:
```typescript
import { FollowButton } from '@/components/isos/FollowButton';

// In the page component, add to header section:
<div className="flex items-center justify-between mb-4">
  <h1 className="text-3xl font-bold">{iso.name}</h1>
  <FollowButton isoObjectId={iso.id} />
</div>
```

**After modifying**:
```bash
ls -la apps/web/app/iso/[id]/page.tsx
# File should already exist, verify modification
```

### Step 3: Create Notification Preferences Page

**File**: `apps/web/app/settings/notifications/page.tsx`

**Requirements**:
- Fetch user's notification preferences from API
- Show 3 toggle switches (reply, evidence, observation)
- Show tier badges for each (Event Pass vs Evidence Analyst)
- Disable evidence/observation toggles for non-EA users
- Show upgrade CTA for disabled toggles
- On toggle change: Call POST /api/notifications/preferences
- Loading states during fetch and save
- WCAG 2.1 AA accessible (keyboard navigation, ARIA labels)

**Pattern**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState({
    reply_notifications: true,
    evidence_notifications: false,
    observation_window_alerts: false,
  });
  const [tier, setTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPreferences() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch tier
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      setTier(subscription?.tier || null);

      // Fetch preferences
      const response = await fetch('/api/notifications/preferences');
      const data = await response.json();
      setPreferences(data);
      setIsLoading(false);
    }

    fetchPreferences();
  }, []);

  async function handleToggle(type: string, value: boolean) {
    setIsSaving(true);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [type]: value }),
      });

      if (response.ok) {
        setPreferences(prev => ({ ...prev, [type]: value }));
      } else {
        alert('Failed to update preferences');
      }
    } catch (error) {
      alert('Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Notification Preferences</h1>

      {/* Reply Notifications */}
      <div className="flex items-center justify-between mb-4 p-4 border rounded">
        <div>
          <h3 className="font-semibold">Reply Notifications</h3>
          <p className="text-sm text-gray-500">
            Get notified when someone replies to your comment
          </p>
          <span className="text-xs text-gray-400">Available: All Tiers</span>
        </div>
        <Switch
          checked={preferences.reply_notifications}
          onCheckedChange={(value) => handleToggle('reply_notifications', value)}
          disabled={isSaving}
        />
      </div>

      {/* Evidence Notifications */}
      <div className="flex items-center justify-between mb-4 p-4 border rounded">
        <div>
          <h3 className="font-semibold">Evidence Notifications</h3>
          <p className="text-sm text-gray-500">
            Get notified when new evidence is submitted for ISOs you follow
          </p>
          {tier !== 'evidence_analyst' ? (
            <span className="text-xs text-amber-600">
              Evidence Analyst Required - <a href="/pricing" className="underline">Upgrade</a>
            </span>
          ) : (
            <span className="text-xs text-gray-400">Available: Evidence Analyst</span>
          )}
        </div>
        <Switch
          checked={preferences.evidence_notifications}
          onCheckedChange={(value) => handleToggle('evidence_notifications', value)}
          disabled={isSaving || tier !== 'evidence_analyst'}
        />
      </div>

      {/* Observation Window Alerts */}
      <div className="flex items-center justify-between mb-4 p-4 border rounded">
        <div>
          <h3 className="font-semibold">Observation Window Alerts</h3>
          <p className="text-sm text-gray-500">
            Get notified 7 days before observation windows open
          </p>
          {tier !== 'evidence_analyst' ? (
            <span className="text-xs text-amber-600">
              Evidence Analyst Required - <a href="/pricing" className="underline">Upgrade</a>
            </span>
          ) : (
            <span className="text-xs text-gray-400">Available: Evidence Analyst</span>
          )}
        </div>
        <Switch
          checked={preferences.observation_window_alerts}
          onCheckedChange={(value) => handleToggle('observation_window_alerts', value)}
          disabled={isSaving || tier !== 'evidence_analyst'}
        />
      </div>
    </div>
  );
}
```

**After creating**:
```bash
ls -la apps/web/app/settings/notifications/page.tsx
```

### Step 4: Add Notifications Link to Navigation

**File**: Modify navigation component (likely `apps/web/components/ui/navigation.tsx` or similar)

**Add link**:
```typescript
<Link href="/settings/notifications">
  Notifications
</Link>
```

**Phase 4.3.5 Complete When**:
- [x] FollowButton exists: `ls -la apps/web/components/isos/FollowButton.tsx`
- [x] NotificationsPage exists: `ls -la apps/web/app/settings/notifications/page.tsx`
- [x] ISO detail page modified (verify with Read tool)
- [x] Navigation modified (verify with Read tool)
- [x] Dev server runs: `cd apps/web && pnpm dev`
- [x] No TypeScript errors: `cd apps/web && pnpm tsc --noEmit`
- [x] Update project-plan.md: Mark Phase 4.3.5 [x]
- [x] Update progress.md: Add deliverable entries

---

## Phase 4.3.6: Testing & Documentation

**Goal**: Update documentation with actual completion status

### Step 1: Final File Verification

**Run all verification commands**:

```bash
# Database migration
ls -la database/migrations/007_email_notifications.sql

# Email system (5 files)
find apps/web/lib/emails -type f

# Notification helpers
ls -la apps/web/lib/notifications/helpers.ts

# API routes (4 files)
ls -la apps/web/app/api/notifications/preferences/route.ts
ls -la apps/web/app/api/notifications/unsubscribe/route.ts
ls -la apps/web/app/api/cron/observation-windows/route.ts
ls -la apps/web/app/api/comments/route.ts

# UI components (2 files)
ls -la apps/web/components/isos/FollowButton.tsx
ls -la apps/web/app/settings/notifications/page.tsx
```

**Expected**: ALL files exist (no "No such file" errors)

### Step 2: Update project-plan.md

**Mark ALL Phase 4.3 tasks as complete**:
- Phase 4.3.1: [x] (all subtasks)
- Phase 4.3.2: [x] (all subtasks)
- Phase 4.3.3: [x] (all subtasks)
- Phase 4.3.4: [x] (all subtasks)
- Phase 4.3.5: [x] (all subtasks)
- Phase 4.3.6: [x] (documentation tasks)

**Update status**:
```markdown
#### **Phase 4.3: Email Notifications** [Status: ✅ COMPLETE]
**Completed**: 2025-01-12
**Actual Time**: 29 hours
```

### Step 3: Update progress.md

**Add deliverable entry**:

```markdown
### 2025-01-12 - Phase 4.3 Email Notifications Implementation COMPLETE ✅
**Created by**: @developer (full-stack implementation)
**Type**: Feature Development (P1 - User Engagement & Retention)
**Files**: 15 new files + 4 modified files

**Description**:
Completed Phase 4.3 (Email Notifications) implementation - comprehensive notification system with reply alerts, evidence notifications, and observation window alerts. Built with Resend integration, React Email templates, triple-layer tier validation, and GDPR-compliant unsubscribe functionality.

**Files Created**:
1. `/database/migrations/007_email_notifications.sql` - Database schema
2. `/apps/web/lib/emails/send.ts` - Resend client wrapper
3. `/apps/web/lib/emails/components/EmailLayout.tsx` - Shared layout
4. `/apps/web/lib/emails/templates/ReplyNotification.tsx` - Reply template
5. `/apps/web/lib/emails/templates/EvidenceNotification.tsx` - Evidence template
6. `/apps/web/lib/emails/templates/ObservationWindowAlert.tsx` - Observation template
7. `/apps/web/lib/notifications/helpers.ts` - Rate limiting, tier validation, JWT
8. `/apps/web/app/api/notifications/preferences/route.ts` - Preferences API
9. `/apps/web/app/api/notifications/unsubscribe/route.ts` - Unsubscribe API
10. `/apps/web/app/api/cron/observation-windows/route.ts` - Cron job
11. `/apps/web/app/api/comments/route.ts` - Comment submission + reply notifications
12. `/apps/web/components/isos/FollowButton.tsx` - Follow button
13. `/apps/web/app/settings/notifications/page.tsx` - Preferences page

**Files Modified**:
1. `/apps/web/app/api/evidence/route.ts` - Added evidence notifications
2. `/apps/web/app/iso/[id]/page.tsx` - Added Follow button
3. `/apps/web/components/ui/navigation.tsx` - Added Notifications link
4. `/apps/web/.env.local` - Added environment variables

**Impact**:
- ✅ User Retention: Email notifications keep users engaged between ISO events
- ✅ Community Building: Reply notifications drive debate participation
- ✅ Evidence Discovery: Evidence notifications encourage follow-up analysis
- ✅ Observation Planning: 7-day advance alerts enable telescope preparation
- ✅ GDPR-Safe: Explicit consent model reduces legal risk

**Next Steps**:
1. User testing (29-test checklist in `/docs/testing/phase-4-3-testing.md`)
2. Deploy to production (database migration + Vercel deploy)
3. Monitor email delivery for Week 1
```

### Step 4: Update handoff-notes.md

**Replace entire file with completion summary**:

```markdown
# Phase 4.3 - Email Notifications COMPLETE ✅

**Status**: ✅ COMPLETE (2025-01-12)
**Duration**: 29 hours
**Files Created**: 15 new files + 4 modified files

## Implementation Summary

All Phase 4.3 email notification functionality has been implemented and verified:

✅ Database migration (3 tables, RLS policies, rate limiting)
✅ Email templates (React Email with Resend)
✅ Core API (preferences, unsubscribe, cron)
✅ Notification triggers (reply, evidence, observation)
✅ UI components (Follow button, preferences page)
✅ Documentation updated (project-plan, progress)

## Next Steps

### 1. User Testing (3-4 hours)
Follow testing checklist: `/docs/testing/phase-4-3-testing.md` (29 test cases)

### 2. Production Deployment (30 minutes)
- Deploy database migration to production Supabase
- Verify Resend domain authentication
- Monitor email delivery (Week 1)

### 3. Sprint 4 Continuation
- Phase 4.4: Community Guidelines & Moderation
- Phase 4.5: Testing & Polish

## Verification Commands

All files exist (run to verify):
```bash
ls -la database/migrations/007_email_notifications.sql
find apps/web/lib/emails -type f
ls -la apps/web/lib/notifications/helpers.ts
find apps/web/app/api/notifications -type f
ls -la apps/web/app/api/cron/observation-windows/route.ts
ls -la apps/web/components/isos/FollowButton.tsx
ls -la apps/web/app/settings/notifications/page.tsx
```
```

**Phase 4.3.6 Complete When**:
- [x] All files verified to exist
- [x] project-plan.md updated with [x] marks
- [x] progress.md has deliverable entry
- [x] handoff-notes.md updated with completion summary

---

## Final Completion Checklist

**Before declaring Phase 4.3 complete, verify ALL items**:

### File Existence (CRITICAL)
- [ ] `database/migrations/007_email_notifications.sql` exists (>5000 bytes)
- [ ] 5 files in `apps/web/lib/emails/` exist
- [ ] `apps/web/lib/notifications/helpers.ts` exists
- [ ] 4 API routes exist (notifications/*, cron/*, comments)
- [ ] 2 UI components exist (FollowButton, NotificationsPage)

### Functional Verification
- [ ] Database migration deploys without errors
- [ ] Dev server runs: `cd apps/web && pnpm dev`
- [ ] No TypeScript errors: `cd apps/web && pnpm tsc --noEmit`
- [ ] Follow button visible on ISO detail pages (visual check)
- [ ] Preferences page accessible at http://localhost:3003/settings/notifications

### Documentation Verification
- [ ] project-plan.md: All Phase 4.3 tasks marked [x]
- [ ] project-plan.md: Phase 4.3 status = ✅ COMPLETE
- [ ] progress.md: Deliverable entry added with all 15+ files listed
- [ ] handoff-notes.md: Updated with completion summary

### Security Verification (Spot Check)
- [ ] RLS policies exist on 3 new tables (check Supabase dashboard)
- [ ] Tier validation in API routes (check 1-2 route files)
- [ ] JWT tokens used for unsubscribe (not plain user IDs)
- [ ] CRON_SECRET authentication in cron route

**If ALL items checked**: Phase 4.3 is COMPLETE ✅

**If ANY item unchecked**: STOP, complete that item before declaring complete

---

## Emergency Recovery (If Implementation Fails)

**If files are not being created**:

1. **Check Write tool parameters**:
   - file_path must be absolute path (start with `/Users/jamiewatters/...`)
   - content must be non-empty string

2. **Verify immediately after each Write**:
   ```bash
   ls -la <file-path>
   ```
   If "No such file or directory": Write FAILED

3. **Try alternative approach**:
   - Use Bash tool with heredoc:
   ```bash
   cat > /absolute/path/to/file.ts <<'EOF'
   [file content here]
   EOF
   ```
   - Verify: `ls -la /absolute/path/to/file.ts`

4. **If all else fails**:
   - Document which files could NOT be created
   - Update handoff-notes.md with blocked status
   - User can create files manually from specifications

---

## Success Criteria Summary

**Phase 4.3 COMPLETE when**:

1. ✅ All 15+ files exist (verified with ls commands)
2. ✅ Database migration deployed to dev Supabase
3. ✅ Dev server runs without TypeScript errors
4. ✅ Follow button and preferences page accessible in browser
5. ✅ project-plan.md, progress.md, handoff-notes.md all updated
6. ✅ Security requirements met (RLS, tier validation, JWT, rate limiting)

**Then and ONLY then**: Mark Phase 4.3 as ✅ COMPLETE

---

**END OF IMPLEMENTATION PROMPT**

**Next Action**: Begin Phase 4.3.1 (Database + Resend Setup)
**Estimated Total Time**: 29 hours
**Critical Reminder**: VERIFY FILE EXISTENCE AFTER EVERY WRITE OPERATION
