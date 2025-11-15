# Phase 4.4: Community Guidelines & Moderation - Implementation Prompt

**Date**: 2025-01-12
**Phase**: Sprint 4, Phase 4.4
**Estimated Time**: 12 hours
**Implementation Method**: Direct coordinator Write tool (NO Task delegation)
**PRD Reference**: Section 5.5 (Admin Dashboard), Section 4.4 (Community Guidelines)

---

## CRITICAL INSTRUCTIONS (READ FIRST)

### File Persistence Safeguards

**⚠️ KNOWN ISSUE**: Task tool delegation has file persistence bug (see `/post-mortem-analysis.md`)

**MANDATORY PROTOCOL**:
1. ✅ **Use Write tool directly** - Coordinator implements, NO Task delegation
2. ✅ **Absolute paths only** - All paths start with `/Users/jamiewatters/DevProjects/ISOTracker/`
3. ✅ **Verify after each file** - Use `ls -lh /absolute/path/to/file.ts` after EVERY Write
4. ✅ **Document verification** - Note "[filename] verified: [timestamp]" in progress
5. ✅ **Read tool verification** - After all files created, use Read tool to verify contents

**IF FILES DON'T PERSIST**: Stop immediately, document issue, do NOT mark task complete.

---

## PRD Alignment Guardrails

### Foundation Documents (MUST REVIEW)

**Before implementing, verify alignment with**:
1. `/foundation/prds/Product-Requirements-Document.md` - Section 5.5 (Admin Dashboard)
2. `/foundation/vision-and-mission.md` - Values: Intellectual honesty, curiosity over certainty
3. `/architecture.md` - Security architecture (RLS policies, CSP)
4. `/CLAUDE.md` - Critical Software Development Principles (NEVER compromise security)

### Critical Alignment Checks

**Community Guidelines** (PRD Section 4.4):
- ✅ Encourage scientific rigor and evidence-based discourse
- ✅ Prohibit personal attacks, harassment, hate speech
- ✅ Respect intellectual property (cite sources, no plagiarism)
- ✅ Transparent moderation with appeal process
- ✅ Aligned with foundation values (intellectual honesty)

**Admin Dashboard** (PRD Section 5.5):
- ✅ Content moderation queue (flagged comments, evidence, arguments)
- ✅ User management (view profiles, suspend accounts, ban users)
- ✅ System health monitoring (database metrics, API performance)
- ✅ Role-based access (admin role required, separate from Evidence Analyst)

### Security-First Principles (NON-NEGOTIABLE)

**From CLAUDE.md** (Lines 51-78):
- ✅ **NEVER compromise security for convenience**
- ✅ **Root cause analysis before fixes** - Understand design intent
- ✅ **Row-Level Security (RLS)** - All admin tables must have RLS policies
- ✅ **Role validation** - Check `profiles.role = 'admin'` at database level
- ✅ **Audit logging** - Track all moderation actions with timestamps
- ✅ **No client-side admin checks** - Enforce in database + API, not just UI

---

## Phase 4.4 Implementation Scope

### Overview

Build admin dashboard for content moderation and user management. Enable admins to review flagged content, suspend/ban users, and monitor system health. Ensure transparent moderation aligned with community guidelines.

### Files to Create (8 files, ~1,200 lines)

**Phase 4.4.1: Database Schema** (1 file, ~180 lines)
1. `/database/migrations/008_admin_moderation.sql`
   - `moderation_flags` table (flagged content with reason, status)
   - `moderation_actions` table (audit log of admin actions)
   - `admin_roles` table (admin assignments with permissions)
   - RLS policies (admin role required)
   - Functions: `check_admin_role()`, `log_moderation_action()`

**Phase 4.4.2: Admin API Routes** (3 files, ~450 lines)
2. `/apps/web/app/api/admin/moderation/route.ts` - GET flagged content, POST moderation actions
3. `/apps/web/app/api/admin/users/route.ts` - GET users, PATCH suspend/ban
4. `/apps/web/app/api/admin/health/route.ts` - GET system metrics (DB, API, user activity)

**Phase 4.4.3: Admin UI Components** (3 files, ~480 lines)
5. `/apps/web/app/admin/moderation/page.tsx` - Moderation queue with approve/reject actions
6. `/apps/web/app/admin/users/page.tsx` - User management table with suspend/ban
7. `/apps/web/components/admin/AdminGuard.tsx` - Role check wrapper component

**Phase 4.4.4: Community Guidelines Page** (1 file, ~90 lines)
8. `/apps/web/app/guidelines/page.tsx` - Public-facing community guidelines

### Dependencies

**Required Existing Files** (verify exist):
- `/database/schema.sql` - Base schema with profiles table
- `/apps/web/lib/supabase/server.ts` - Server-side Supabase client
- `/apps/web/lib/supabase/client.ts` - Client-side Supabase client

**Required Environment Variables** (verify in .env.local):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)

---

## Detailed Specifications

### Phase 4.4.1: Database Schema

**File**: `/database/migrations/008_admin_moderation.sql`

**Requirements**:

1. **moderation_flags table**:
   - Tracks flagged content (comments, evidence, arguments)
   - Fields: id, content_type (enum), content_id (UUID), reporter_id (UUID), reason (text), status (pending/reviewed/dismissed), reviewed_by (admin UUID), reviewed_at, created_at
   - Indexes: (status, created_at), (content_type, content_id), (reporter_id)
   - RLS: Users can flag content, admins can view/update all flags

2. **moderation_actions table**:
   - Audit log of all moderation actions
   - Fields: id, admin_id, action_type (suspend_user/ban_user/remove_content/approve_content), target_type (user/comment/evidence/argument), target_id, reason, metadata (JSONB), created_at
   - Indexes: (admin_id, created_at), (target_type, target_id)
   - RLS: Admins can view all actions, no updates (append-only log)

3. **admin_roles table** (optional - may use profiles.role instead):
   - Tracks admin role assignments
   - Fields: id, user_id, role (admin/moderator/super_admin), granted_by, granted_at, revoked_at
   - Indexes: (user_id, role), (revoked_at)
   - RLS: Only super_admin can view/modify

4. **check_admin_role() function**:
   - Returns boolean if auth.uid() has admin role
   - Query: `SELECT role = 'admin' FROM profiles WHERE id = auth.uid()`
   - SECURITY DEFINER function (runs with elevated privileges)

5. **log_moderation_action() function**:
   - Inserts audit log entry
   - Parameters: action_type, target_type, target_id, reason, metadata
   - Returns: action_id (UUID)

**Security Constraints**:
- ✅ All tables have RLS enabled
- ✅ Admin role checked at database level (not just API)
- ✅ Moderation actions are append-only (no DELETE, no UPDATE)
- ✅ Reporter identity never exposed to content owner

**PRD Alignment**:
- ✅ Section 5.5: Admin Dashboard with moderation queue ✓
- ✅ Transparent moderation: All actions logged with timestamps ✓
- ✅ Appeal process: Flagged content reviewable by admins ✓

---

### Phase 4.4.2: Admin API Routes

**File 1**: `/apps/web/app/api/admin/moderation/route.ts`

**Requirements**:

1. **GET /api/admin/moderation** - Fetch flagged content queue
   - Auth: Require admin role (check profiles.role)
   - Query params: ?status=pending&type=comment&limit=50
   - Response: Array of flags with content details, reporter info (anonymized), timestamps
   - Include: Content preview (first 200 chars), link to full content

2. **POST /api/admin/moderation** - Take moderation action
   - Auth: Require admin role
   - Body: { flag_id, action (approve/reject/remove), reason }
   - Actions:
     - approve: Mark flag as dismissed, content stays
     - reject: Mark flag as dismissed, no action
     - remove: Delete content, mark flag as reviewed, log action
   - Response: { success, action_id }

**Security**:
- ✅ `profiles.role = 'admin'` check at top of handler
- ✅ Return 403 if not admin
- ✅ Log all actions to moderation_actions table
- ✅ Use SUPABASE_SERVICE_ROLE_KEY for admin operations

**File 2**: `/apps/web/app/api/admin/users/route.ts`

**Requirements**:

1. **GET /api/admin/users** - List users with moderation status
   - Auth: Require admin role
   - Query params: ?search=username&status=suspended&limit=50
   - Response: Array of users with profile info, subscription tier, suspension status, join date
   - Pagination: Offset-based with total count

2. **PATCH /api/admin/users/:userId** - Suspend or ban user
   - Auth: Require admin role
   - Body: { action (suspend/unsuspend/ban), duration_days, reason }
   - Actions:
     - suspend: Set profiles.suspended_until = now() + duration_days
     - unsuspend: Set profiles.suspended_until = null
     - ban: Set profiles.banned_at = now() (permanent)
   - Response: { success, user_id, action }
   - Side effects: Log action, send email notification to user

**Security**:
- ✅ Admin role check
- ✅ Cannot suspend/ban other admins (prevent escalation)
- ✅ Log all actions with reason and duration
- ✅ Audit trail for compliance

**File 3**: `/apps/web/app/api/admin/health/route.ts`

**Requirements**:

1. **GET /api/admin/health** - System health metrics
   - Auth: Require admin role
   - Response:
     ```json
     {
       "database": {
         "total_users": 1234,
         "active_users_30d": 456,
         "total_evidence": 789,
         "total_comments": 2345
       },
       "moderation": {
         "pending_flags": 12,
         "resolved_flags_7d": 34
       },
       "system": {
         "uptime_hours": 168,
         "last_backup": "2025-01-12T12:00:00Z"
       }
     }
     ```

**Security**:
- ✅ Admin role check
- ✅ No sensitive data (passwords, API keys) exposed
- ✅ Cache response for 5 minutes (reduce DB load)

---

### Phase 4.4.3: Admin UI Components

**File 1**: `/apps/web/app/admin/moderation/page.tsx`

**Requirements**:

1. **Layout**: Table with columns (Content Type, Preview, Reporter, Reason, Date, Actions)
2. **Filters**: Status (Pending/Reviewed/Dismissed), Type (Comment/Evidence/Argument)
3. **Actions per row**:
   - View Full Content (modal)
   - Approve (dismiss flag, keep content)
   - Remove Content (delete content, log action)
   - Reason input (required for all actions)
4. **Pagination**: 50 items per page with offset-based navigation
5. **Real-time updates**: Refresh every 30 seconds OR use Supabase Realtime

**Security**:
- ✅ Wrapped in `<AdminGuard>` component (role check)
- ✅ Client-side check + server-side enforcement
- ✅ Hide admin routes from non-admins in navigation

**UX Requirements**:
- ✅ Mobile responsive (table collapses to cards on mobile)
- ✅ Loading states (skeleton loaders)
- ✅ Error handling (toast notifications)
- ✅ Confirmation modal for destructive actions (Remove Content)

**File 2**: `/apps/web/app/admin/users/page.tsx`

**Requirements**:

1. **Layout**: Table with columns (Username, Email, Tier, Join Date, Status, Actions)
2. **Search**: By username or email (debounced input)
3. **Filters**: Status (Active/Suspended/Banned), Tier (Free/Event Pass/Evidence Analyst)
4. **Actions per row**:
   - View Profile (link to /profile/[username])
   - Suspend (modal with duration selector: 1/7/30 days)
   - Ban (confirmation modal with reason input)
   - Unsuspend (if currently suspended)
5. **Pagination**: 50 items per page

**Security**:
- ✅ Wrapped in `<AdminGuard>`
- ✅ Cannot suspend/ban other admins (UI disabled + API enforced)
- ✅ All actions require reason (min 10 characters)

**File 3**: `/apps/web/components/admin/AdminGuard.tsx`

**Requirements**:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAdminRole() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/signin');
        return;
      }

      // Check if user has admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        router.push('/'); // Redirect non-admins to home
      }
    }

    checkAdminRole();
  }, [supabase, router]);

  if (isAdmin === null) {
    return <div>Loading...</div>;
  }

  if (isAdmin === false) {
    return fallback || <div>Access denied</div>;
  }

  return <>{children}</>;
}
```

**Security**:
- ✅ Client-side role check for UX (fast redirect)
- ✅ Server-side role check in API routes (actual enforcement)
- ✅ Redirect non-admins immediately
- ✅ No admin UI visible to non-admins

---

### Phase 4.4.4: Community Guidelines Page

**File**: `/apps/web/app/guidelines/page.tsx`

**Requirements**:

**Content Structure**:
1. **Introduction**: ISO Tracker values (intellectual honesty, curiosity, scientific rigor)
2. **Core Guidelines**:
   - Be respectful and constructive
   - Cite sources and evidence
   - Distinguish opinions from facts
   - No personal attacks or harassment
   - No hate speech, discrimination, threats
   - No spam, self-promotion, or off-topic content
3. **Evidence Submission Standards**:
   - Provide methodology and sources
   - Be transparent about data limitations
   - Accept peer review and criticism
   - Update evidence if proven incorrect
4. **Moderation Policy**:
   - How content gets flagged
   - Review process (admin review within 48 hours)
   - Appeal process (email support with flag ID)
   - Consequences (warning → suspension → ban)
5. **Contact**: support@isotracker.app for questions

**Styling**:
- ✅ Simple, readable typography (max-width 800px)
- ✅ Section anchors for direct linking (#evidence-standards)
- ✅ Mobile responsive
- ✅ Link from footer ("Community Guidelines")

**PRD Alignment**:
- ✅ Section 4.4: Community guidelines emphasize evidence-based discourse ✓
- ✅ Foundation: Intellectual honesty and curiosity values reflected ✓
- ✅ Transparent: Clear rules and appeal process ✓

---

## Implementation Sequence

### Step-by-Step Execution

**Phase 4.4.1: Database (2 hours)**
1. Create `/database/migrations/008_admin_moderation.sql`
2. Verify file exists: `ls -lh /Users/jamiewatters/DevProjects/ISOTracker/database/migrations/008_admin_moderation.sql`
3. Copy to `/supabase/migrations/008_admin_moderation.sql`
4. Deploy migration: `cd /Users/jamiewatters/DevProjects/ISOTracker && echo "Y" | supabase db push`
5. Verify tables in Supabase dashboard: moderation_flags, moderation_actions

**Phase 4.4.2: Admin API (4 hours)**
6. Create `/apps/web/app/api/admin/moderation/route.ts`
7. Verify: `ls -lh /Users/jamiewatters/DevProjects/ISOTracker/apps/web/app/api/admin/moderation/route.ts`
8. Create `/apps/web/app/api/admin/users/route.ts`
9. Verify: `ls -lh /Users/jamiewatters/DevProjects/ISOTracker/apps/web/app/api/admin/users/route.ts`
10. Create `/apps/web/app/api/admin/health/route.ts`
11. Verify: `ls -lh /Users/jamiewatters/DevProjects/ISOTracker/apps/web/app/api/admin/health/route.ts`

**Phase 4.4.3: Admin UI (5 hours)**
12. Create `/apps/web/components/admin/AdminGuard.tsx`
13. Verify: `ls -lh /Users/jamiewatters/DevProjects/ISOTracker/apps/web/components/admin/AdminGuard.tsx`
14. Create `/apps/web/app/admin/moderation/page.tsx`
15. Verify: `ls -lh /Users/jamiewatters/DevProjects/ISOTracker/apps/web/app/admin/moderation/page.tsx`
16. Create `/apps/web/app/admin/users/page.tsx`
17. Verify: `ls -lh /Users/jamiewatters/DevProjects/ISOTracker/apps/web/app/admin/users/page.tsx`

**Phase 4.4.4: Guidelines Page (1 hour)**
18. Create `/apps/web/app/guidelines/page.tsx`
19. Verify: `ls -lh /Users/jamiewatters/DevProjects/ISOTracker/apps/web/app/guidelines/page.tsx`

**Final Verification** (30 minutes)
20. Count files: `find /Users/jamiewatters/DevProjects/ISOTracker -name "008_admin_moderation.sql" -o -path "*/admin/*" -o -name "guidelines" | wc -l` (should be 8+)
21. Use Read tool to verify contents of 2-3 key files
22. Update progress.md with delivery entry
23. Update project-plan.md Phase 4.4 as COMPLETE

---

## Testing Checklist

### Manual QA (Phase 4.5)

**Admin Dashboard**:
- [ ] Non-admin user cannot access /admin routes (redirected to home)
- [ ] Admin user sees moderation queue with flagged content
- [ ] Can approve/reject/remove flagged content with reason
- [ ] Moderation action logged in database (check moderation_actions table)
- [ ] User management: Can suspend user for 7 days with reason
- [ ] Suspended user cannot submit evidence/comments (403 error)
- [ ] Can unsuspend user (suspended_until = null)
- [ ] Cannot suspend/ban other admins (UI disabled, API returns 403)
- [ ] System health metrics display correctly

**Community Guidelines**:
- [ ] Guidelines page accessible at /guidelines
- [ ] All sections render correctly (Introduction, Core Guidelines, etc.)
- [ ] Mobile responsive (readable on 375px width)
- [ ] Footer link to /guidelines works
- [ ] Section anchors work (#evidence-standards)

**Security**:
- [ ] API routes return 403 for non-admin users
- [ ] RLS policies prevent non-admin DB access (test with psql)
- [ ] Moderation actions audit log is append-only (cannot UPDATE/DELETE)
- [ ] Admin role check uses database, not client-side role

---

## Success Criteria

**Phase 4.4 Complete When**:
- [x] All 8 files created and verified on filesystem
- [x] Migration 008 deployed to Supabase
- [x] Admin dashboard accessible at /admin/moderation and /admin/users
- [x] Non-admin users redirected from admin routes
- [x] Community guidelines page live at /guidelines
- [x] All moderation actions logged to audit table
- [x] Security review passed (RLS policies, role checks, audit logging)
- [x] Files verified with Read tool (spot-check 3 files)
- [ ] Manual QA complete (defer to Phase 4.5)

---

## Known Risks & Mitigation

### Risk 1: File Persistence Failure (CRITICAL)
- **Mitigation**: Use direct Write tool, verify after EVERY file, NO Task delegation
- **Detection**: `ls -lh` after each Write operation
- **Recovery**: If file missing, re-create immediately, document in progress.md

### Risk 2: Admin Privilege Escalation
- **Mitigation**: RLS policies at database level, cannot grant admin to self
- **Detection**: Try to modify profiles.role via API (should fail with 403)
- **Recovery**: If exploitable, add stricter RLS policy before deployment

### Risk 3: Audit Log Tampering
- **Mitigation**: Moderation_actions table is append-only (no UPDATE/DELETE grants)
- **Detection**: Try to UPDATE/DELETE row in moderation_actions (should fail)
- **Recovery**: Revoke UPDATE/DELETE permissions if accidentally granted

---

## Alignment Verification

### Before Implementation
- [ ] Read `/foundation/prds/Product-Requirements-Document.md` Section 5.5
- [ ] Read `/foundation/vision-and-mission.md` (values alignment)
- [ ] Read `/architecture.md` Security Architecture section
- [ ] Read `/CLAUDE.md` Critical Software Development Principles

### During Implementation
- [ ] Check every security decision against CLAUDE.md principles
- [ ] Verify RLS policies on ALL new tables
- [ ] Ensure admin role checked at database level (not just API)
- [ ] Log all moderation actions to audit table (append-only)

### After Implementation
- [ ] PRD Section 5.5 (Admin Dashboard) requirements complete
- [ ] PRD Section 4.4 (Community Guidelines) requirements complete
- [ ] Foundation values reflected in guidelines content
- [ ] Security-first principles maintained (no shortcuts taken)

---

## Documentation Updates

**After Phase 4.4 Complete**:

1. **progress.md** - Add delivery entry:
   ```markdown
   ### 2025-01-12 - Phase 4.4 Community Guidelines & Moderation COMPLETE ✅
   **Created by**: coordinator (direct Write tool implementation)
   **Type**: Feature Development (P1 - Community Management)
   **Files**: 8 files (~1,200 lines)

   **Description**: Implemented admin dashboard for content moderation and user management...
   ```

2. **project-plan.md** - Update Phase 4.4 status to COMPLETE

3. **handoff-notes.md** - Update with Phase 4.5 preparation

---

## Contact & Escalation

**If Issues Arise**:
1. File persistence failure → Stop, document, check post-mortem-analysis.md
2. Security concern → Review CLAUDE.md, do NOT compromise
3. PRD misalignment → Re-read PRD section, adjust implementation
4. Blocker → Document in progress.md, ask user for guidance

**User Approval Required For**:
- Admin role assignment process (manual vs self-service)
- Moderation action email notifications (enable/disable)
- Appeal process implementation (email vs in-app)

---

**END OF IMPLEMENTATION PROMPT**

**Next Steps**:
1. User approves this prompt (reviews for alignment)
2. Coordinator implements Phase 4.4 using direct Write tool
3. Verify all files created with filesystem checks
4. Update progress.md and project-plan.md
5. Proceed to Phase 4.5 (Testing & Polish)
