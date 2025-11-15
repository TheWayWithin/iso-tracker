# Phase 4.3 Email Notifications - Testing Plan

**Phase**: Testing & Quality Assurance
**Created**: 2025-01-11
**Status**: 🔴 Implementation Not Started - Testing Plan Ready
**Priority**: P1 (User Engagement & Retention)

---

## ⚠️ CRITICAL FINDING: Implementation Status Mismatch

### Documentation vs Reality

**What Documentation Says**:
- progress.md (line 11): "Phase 4.3 Email Notifications Implementation COMPLETE ✅"
- handoff-notes.md (line 1): "Sprint 4.3 - Email Notifications Implementation COMPLETE ✅"
- Listed as "18 new files + 4 modified files"

**What Actually Exists**:
- ❌ NO email-related files in `/apps/web/lib/emails/`
- ❌ NO notification-related files in `/apps/web/lib/notifications/`
- ❌ NO API routes for notifications (`/api/notifications/*`, `/api/cron/*`)
- ❌ NO FollowButton.tsx or NotificationsPage.tsx components
- ❌ NO migration file `007_email_notifications.sql`
- ✅ Only `vercel.json` exists (8 lines)

### Conclusion

**Phase 4.3 implementation has NOT been started**. The documentation describes what SHOULD be built based on `/docs/phase-4-3-implementation-prompt.md`, but no code has been written yet.

**This testing plan is ready for use AFTER implementation is complete.**

---

## Testing Overview

### Test Categories

1. **UI Component Tests** (11 tests) - Follow Button & Preferences Page
2. **API Endpoint Tests** (8 tests) - Preferences, Unsubscribe, Cron, Triggers
3. **Email Delivery Tests** (6 tests) - Templates, Rate Limiting, Unsubscribe
4. **Integration Tests** (5 tests) - End-to-end notification flows
5. **Accessibility Tests** (4 tests) - WCAG AA compliance
6. **Security Tests** (5 tests) - Tier validation, Rate limiting, JWT

**Total**: 39 test cases

---

## Test Environment Requirements

### Prerequisites

**Before Testing Can Begin**:
1. ✅ Resend account created with API key
2. ✅ Resend domain verified (DNS records propagated)
3. ✅ Environment variables configured:
   - `RESEND_API_KEY`
   - `JWT_SECRET`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL`
4. ✅ Database migration `007_email_notifications.sql` deployed
5. ✅ All implementation files created (18 new files)
6. ✅ Application running locally or in staging

### Test User Accounts Required

**Create 3 test accounts with different tiers**:
1. **Guest/Spectator** - No subscription (free tier)
2. **Event Pass** - $4.99/mo tier (reply notifications only)
3. **Evidence Analyst** - $19/mo tier (all notification types)

---

## 1. UI Component Tests (11 tests)

### Test Suite: Follow Button Component

**Location**: ISO detail page header (e.g., `/iso-objects/[id]`)

#### TEST-UI-001: Follow Button Visibility
**Priority**: HIGH
**Description**: Verify Follow button appears on ISO detail pages
**Steps**:
1. Navigate to `/iso-objects/1` (1I/'Oumuamua)
2. Look for "Follow ISO" button in page header
**Expected**: Button visible near ISO title
**Status**: ⏳ Pending Implementation

#### TEST-UI-002: Follow Button - Logged Out State
**Priority**: HIGH
**Description**: Test follow button behavior when not authenticated
**Steps**:
1. Ensure logged out (no session)
2. Navigate to any ISO detail page
3. Click "Follow ISO" button
**Expected**: Redirects to `/auth/signin` with return URL
**Status**: ⏳ Pending Implementation

#### TEST-UI-003: Follow Button - Event Pass Tier
**Priority**: CRITICAL
**Description**: Verify tier-gating for Event Pass users (should see paywall)
**Steps**:
1. Log in as Event Pass user (testuser-eventpass@example.com)
2. Navigate to any ISO detail page
3. Click "Follow ISO" button
**Expected**:
- Shows paywall modal OR redirects to `/pricing`
- Message: "Evidence Analyst subscription required"
- Clear upgrade CTA
**Status**: ⏳ Pending Implementation

#### TEST-UI-004: Follow Button - Evidence Analyst Tier
**Priority**: HIGH
**Description**: Verify follow functionality for Evidence Analyst users
**Steps**:
1. Log in as Evidence Analyst user (testuser-ea@example.com)
2. Navigate to `/iso-objects/1`
3. Click "Follow ISO" button
4. Check button state changes to "Following"
**Expected**:
- Button changes: "Follow ISO" → "Following"
- Icon changes (e.g., bell icon)
- Optimistic UI update (immediate feedback)
**Status**: ⏳ Pending Implementation

#### TEST-UI-005: Follow Button - Unfollow Action
**Priority**: HIGH
**Description**: Test unfollow functionality
**Steps**:
1. Log in as Evidence Analyst (already following ISO from TEST-UI-004)
2. Navigate to same ISO detail page
3. Click "Following" button
4. Verify button changes to "Follow ISO"
**Expected**:
- Button reverts to "Follow ISO" state
- Confirmation toast/message (optional)
- Database record deleted from `iso_follows` table
**Status**: ⏳ Pending Implementation

#### TEST-UI-006: Follow Button - Loading State
**Priority**: MEDIUM
**Description**: Verify loading indicator during async operations
**Steps**:
1. Log in as Evidence Analyst
2. Click Follow button
3. Observe button during API request
**Expected**:
- Button shows loading spinner/disabled state
- User cannot click multiple times rapidly
- Button re-enables after request completes
**Status**: ⏳ Pending Implementation

### Test Suite: Notification Preferences Page

**Location**: `/settings/notifications`

#### TEST-UI-007: Preferences Page - Accessibility
**Priority**: HIGH
**Description**: Verify preferences page is accessible from user menu
**Steps**:
1. Log in as any authenticated user
2. Click user dropdown/menu in navigation
3. Look for "Notifications" or "Notification Settings" link
4. Click link
**Expected**:
- Link visible in user menu
- Redirects to `/settings/notifications`
- Page loads successfully
**Status**: ⏳ Pending Implementation

#### TEST-UI-008: Preferences Page - Event Pass Tier
**Priority**: CRITICAL
**Description**: Test tier-gated toggles for Event Pass users
**Steps**:
1. Log in as Event Pass user
2. Navigate to `/settings/notifications`
3. Observe all 3 toggle switches:
   - Reply notifications
   - Evidence notifications
   - Observation window alerts
**Expected**:
- Reply notifications: Enabled, toggle works
- Evidence notifications: Disabled with "Evidence Analyst Only" badge
- Observation window alerts: Disabled with "Evidence Analyst Only" badge
- Upgrade CTA visible
**Status**: ⏳ Pending Implementation

#### TEST-UI-009: Preferences Page - Evidence Analyst Tier
**Priority**: HIGH
**Description**: Test all toggles enabled for Evidence Analyst users
**Steps**:
1. Log in as Evidence Analyst user
2. Navigate to `/settings/notifications`
3. Toggle each notification type on/off
4. Click "Save Preferences" button
**Expected**:
- All 3 toggles enabled (no tier restrictions)
- Changes save successfully
- Confirmation message displayed
- Page remains on `/settings/notifications` (no redirect)
**Status**: ⏳ Pending Implementation

#### TEST-UI-010: Preferences Page - Loading State
**Priority**: MEDIUM
**Description**: Verify loading skeleton while fetching preferences
**Steps**:
1. Log in as any user
2. Navigate to `/settings/notifications`
3. Observe page during initial load
**Expected**:
- Loading skeleton/spinner shown
- Once loaded, shows current preference values
- No flash of incorrect state
**Status**: ⏳ Pending Implementation

#### TEST-UI-011: Preferences Page - Error Handling
**Priority**: MEDIUM
**Description**: Test error state when API fails
**Steps**:
1. Log in as any user
2. Disconnect internet OR block API endpoint
3. Navigate to `/settings/notifications`
4. Try to save preferences
**Expected**:
- Error message displayed
- Retry button available
- User not left in broken state
**Status**: ⏳ Pending Implementation

---

## 2. API Endpoint Tests (8 tests)

### Test Suite: Preferences API

#### TEST-API-001: GET /api/notifications/preferences - Success
**Priority**: HIGH
**Description**: Fetch user's notification preferences
**Steps**:
1. Authenticate as any user
2. Send GET request to `/api/notifications/preferences`
**Expected Response**:
```json
{
  "reply_notifications": true,
  "evidence_notifications": false,
  "observation_window_alerts": false
}
```
**Status**: ⏳ Pending Implementation

#### TEST-API-002: POST /api/notifications/preferences - Event Pass Restriction
**Priority**: CRITICAL
**Description**: Verify tier enforcement on preferences update
**Steps**:
1. Authenticate as Event Pass user
2. Send POST to `/api/notifications/preferences`:
```json
{
  "reply_notifications": true,
  "evidence_notifications": true,
  "observation_window_alerts": false
}
```
**Expected Response**:
```json
{
  "error": "Evidence Analyst subscription required for evidence notifications"
}
```
**Status Code**: 403 Forbidden
**Status**: ⏳ Pending Implementation

#### TEST-API-003: POST /api/notifications/preferences - Evidence Analyst Success
**Priority**: HIGH
**Description**: Test successful preferences update for EA tier
**Steps**:
1. Authenticate as Evidence Analyst user
2. Send POST with all notifications enabled
**Expected Response**:
```json
{
  "success": true,
  "preferences": {
    "reply_notifications": true,
    "evidence_notifications": true,
    "observation_window_alerts": true
  }
}
```
**Status Code**: 200 OK
**Status**: ⏳ Pending Implementation

### Test Suite: Unsubscribe API

#### TEST-API-004: GET /api/notifications/unsubscribe - Valid Token
**Priority**: HIGH
**Description**: Test one-click unsubscribe with valid JWT
**Steps**:
1. Generate valid JWT token with:
   ```javascript
   const token = jwt.sign(
     { user_id: 'test-uuid', type: 'reply', purpose: 'unsubscribe' },
     JWT_SECRET,
     { expiresIn: '30d' }
   );
   ```
2. Send GET to `/api/notifications/unsubscribe?token={token}`
**Expected Response**:
- Success message: "You've been unsubscribed from reply notifications"
- Status Code: 200 OK
- Database updated: `reply_notifications = false`
**Status**: ⏳ Pending Implementation

#### TEST-API-005: GET /api/notifications/unsubscribe - Invalid Token
**Priority**: HIGH
**Description**: Test unsubscribe with tampered/expired token
**Steps**:
1. Send GET with expired or invalid token
**Expected Response**:
```json
{
  "error": "Invalid or expired unsubscribe token"
}
```
**Status Code**: 401 Unauthorized
**Status**: ⏳ Pending Implementation

### Test Suite: Cron Job API

#### TEST-API-006: GET /api/cron/observation-windows - Missing Auth
**Priority**: CRITICAL (Security)
**Description**: Verify cron endpoint requires authentication
**Steps**:
1. Send GET to `/api/cron/observation-windows` WITHOUT Authorization header
**Expected Response**:
```json
{
  "error": "Unauthorized"
}
```
**Status Code**: 401 Unauthorized
**Status**: ⏳ Pending Implementation

#### TEST-API-007: GET /api/cron/observation-windows - Valid Auth
**Priority**: HIGH
**Description**: Test cron job with valid CRON_SECRET
**Steps**:
1. Send GET with header: `Authorization: Bearer {CRON_SECRET}`
2. Ensure NO ISOs have observation windows in 7 days
**Expected Response**:
```json
{
  "success": true,
  "processed": 0,
  "message": "No ISOs with observation windows starting in 7 days"
}
```
**Status Code**: 200 OK
**Status**: ⏳ Pending Implementation

### Test Suite: Notification Triggers

#### TEST-API-008: POST /api/comments - Reply Notification Trigger
**Priority**: HIGH
**Description**: Verify reply notification sent when replying to comment
**Steps**:
1. User A posts a comment on ISO detail page
2. User B replies to User A's comment (include `parent_comment_id`)
3. Check that notification was sent to User A
**Expected**:
- API returns success immediately (non-blocking)
- `notification_log` table has new entry for User A
- Email sent to User A's inbox (check manually)
**Status**: ⏳ Pending Implementation

---

## 3. Email Delivery Tests (6 tests)

### Test Suite: Email Templates & Delivery

#### TEST-EMAIL-001: Reply Notification Email
**Priority**: HIGH
**Description**: Send and verify reply notification email
**Manual Test Steps**:
1. Set up: User A (your test email) posts comment
2. User B replies to User A's comment
3. Check User A's inbox for email
**Expected Email**:
- **Subject**: "User B replied to your comment on 1I/'Oumuamua"
- **Body Contains**:
  - Original comment excerpt
  - Reply excerpt
  - Link to discussion
  - Unsubscribe link in footer
- **From**: `ISO Tracker <notifications@your-domain.com>`
- **Mobile Rendering**: Test on iOS Mail and Gmail app
**Status**: ⏳ Pending Implementation

#### TEST-EMAIL-002: Evidence Notification Email
**Priority**: HIGH
**Description**: Send and verify evidence notification email
**Manual Test Steps**:
1. Follow an ISO as Evidence Analyst user
2. Submit new evidence for that ISO
3. Check email inbox
**Expected Email**:
- **Subject**: "New evidence submitted for 1I/'Oumuamua"
- **Body Contains**:
  - Evidence type (observation/hypothesis/theory)
  - Submitter name
  - Link to evidence detail
  - Unsubscribe link
**Status**: ⏳ Pending Implementation

#### TEST-EMAIL-003: Observation Window Alert Email
**Priority**: HIGH
**Description**: Test observation window 7-day advance alert
**Manual Test Steps**:
1. Manually insert ISO with observation window 7 days from now:
   ```sql
   UPDATE iso_objects
   SET observation_window_start = NOW() + INTERVAL '7 days',
       observation_window_end = NOW() + INTERVAL '14 days',
       visibility_notes = 'Best viewed from Northern Hemisphere. Peak visibility: 22:00-02:00 UTC.'
   WHERE id = 1;
   ```
2. Follow that ISO as Evidence Analyst
3. Manually trigger cron: `curl -H "Authorization: Bearer {CRON_SECRET}" https://your-app.vercel.app/api/cron/observation-windows`
4. Check inbox
**Expected Email**:
- **Subject**: "Observation window opening for 1I/'Oumuamua"
- **Body Contains**:
  - Start date: 7 days from now
  - End date: 14 days from now
  - Visibility notes
  - Link to ISO detail page
  - Unsubscribe link
**Status**: ⏳ Pending Implementation

#### TEST-EMAIL-004: Rate Limiting Enforcement
**Priority**: CRITICAL
**Description**: Verify max 5 emails per user per 24 hours
**Manual Test Steps**:
1. Create test user with email address you control
2. Trigger 6 notifications for that user within 24 hours:
   - 5 reply notifications (create 5 replies to their comment)
   - Attempt 6th reply notification
3. Check:
   - `notification_log` table has exactly 5 entries
   - 6th email was NOT sent
   - Console logs show rate limit warning
**Expected**:
- First 5 emails delivered
- 6th email silently skipped (no error thrown)
- Log entry: "Rate limit exceeded for user {id}"
**Status**: ⏳ Pending Implementation

#### TEST-EMAIL-005: Unsubscribe Link Functionality
**Priority**: HIGH
**Description**: Verify one-click unsubscribe works from email
**Manual Test Steps**:
1. Receive any test email (reply/evidence/observation)
2. Click "Unsubscribe" link in footer
3. Verify redirected to confirmation page
4. Check `notification_preferences` table updated
5. Try triggering same notification type again
**Expected**:
- Unsubscribe link in footer works (no login required)
- Confirmation page shows: "You've been unsubscribed from [type] notifications"
- Database updated correctly
- Future notifications of that type NOT sent
**Status**: ⏳ Pending Implementation

#### TEST-EMAIL-006: Batch Email Processing
**Priority**: MEDIUM
**Description**: Test evidence notification sent to multiple followers
**Manual Test Steps**:
1. Create 10 Evidence Analyst test accounts
2. All 10 accounts follow the same ISO
3. Submit new evidence for that ISO
4. Check all 10 inboxes
**Expected**:
- All 10 followers receive email (batch processing)
- Emails sent in parallel (not sequentially)
- API returns success immediately (non-blocking)
- `notification_log` has 10 entries
**Performance**: Should complete in <5 seconds
**Status**: ⏳ Pending Implementation

---

## 4. Integration Tests (5 tests)

### Test Suite: End-to-End Notification Flows

#### TEST-INT-001: Complete Reply Notification Flow
**Priority**: HIGH
**Description**: Full user journey for reply notification
**Steps**:
1. User A logs in, posts comment on ISO
2. User A enables reply notifications in preferences
3. User B logs in, replies to User A's comment
4. User A receives email
5. User A clicks link in email → goes to discussion
6. User A clicks unsubscribe → reply notifications disabled
**Expected**: Complete flow works without errors
**Status**: ⏳ Pending Implementation

#### TEST-INT-002: Complete Evidence Notification Flow
**Priority**: HIGH
**Description**: Full user journey for evidence notification
**Steps**:
1. Evidence Analyst user follows ISO
2. Enables evidence notifications in preferences
3. Another user submits evidence for that ISO
4. EA user receives email
5. EA user clicks link → goes to evidence detail page
6. EA user unfollows ISO → future evidence notifications stop
**Expected**: Complete flow works without errors
**Status**: ⏳ Pending Implementation

#### TEST-INT-003: Tier Upgrade Flow
**Priority**: HIGH
**Description**: Test notification access after tier upgrade
**Steps**:
1. Event Pass user tries to follow ISO → sees paywall
2. User upgrades to Evidence Analyst (Stripe checkout)
3. Stripe webhook updates subscription tier
4. User returns to ISO page → Follow button now enabled
5. User follows ISO → evidence notifications work
**Expected**: Tier upgrade immediately unlocks features
**Status**: ⏳ Pending Implementation

#### TEST-INT-004: Tier Downgrade Flow
**Priority**: MEDIUM
**Description**: Test notification behavior after tier downgrade
**Steps**:
1. Evidence Analyst has evidence notifications enabled
2. User cancels subscription (downgrades to Event Pass)
3. Stripe webhook updates tier
4. Check preferences page → evidence toggle now disabled
5. Try to enable evidence notifications via API
**Expected**:
- UI shows tier restrictions
- API returns 403 Forbidden
- Database RLS prevents unauthorized updates
**Status**: ⏳ Pending Implementation

#### TEST-INT-005: Cross-Browser Compatibility
**Priority**: MEDIUM
**Description**: Test UI components across browsers
**Browsers**: Chrome, Firefox, Safari, Edge
**Steps**:
1. Test Follow button in all browsers
2. Test preferences page in all browsers
3. Test email rendering in:
   - Gmail (web + app)
   - Outlook (web + app)
   - Apple Mail (macOS + iOS)
   - Android Gmail app
**Expected**: Consistent behavior across all platforms
**Status**: ⏳ Pending Implementation

---

## 5. Accessibility Tests (4 tests)

### Test Suite: WCAG 2.1 AA Compliance

#### TEST-A11Y-001: Keyboard Navigation
**Priority**: HIGH
**Description**: Verify all components accessible via keyboard
**Steps**:
1. Navigate to ISO detail page
2. Tab to Follow button → press Enter
3. Navigate to preferences page
4. Tab through all toggle switches → press Space to toggle
5. Tab to Save button → press Enter
**Expected**:
- All interactive elements reachable via Tab
- Visible focus indicators (outline/highlight)
- Space/Enter work as expected
- No keyboard traps
**Status**: ⏳ Pending Implementation

#### TEST-A11Y-002: Screen Reader Compatibility
**Priority**: HIGH
**Description**: Test with VoiceOver (macOS) or NVDA (Windows)
**Steps**:
1. Enable screen reader
2. Navigate to Follow button
3. Activate screen reader
4. Navigate to preferences page toggles
**Expected Announcements**:
- Follow button: "Follow ISO, button, requires Evidence Analyst subscription"
- Toggle switches: "Reply notifications, toggle switch, currently on"
- Tier badges: "Evidence Analyst only"
**Status**: ⏳ Pending Implementation

#### TEST-A11Y-003: Color Contrast Validation
**Priority**: MEDIUM
**Description**: Verify text meets 4.5:1 contrast ratio
**Tools**: Chrome DevTools Lighthouse or axe DevTools
**Steps**:
1. Run Lighthouse audit on:
   - ISO detail page (with Follow button)
   - Preferences page
2. Check "Accessibility" score
**Expected**:
- Score: 90+ (WCAG AA compliant)
- No contrast violations
- All images have alt text
**Status**: ⏳ Pending Implementation

#### TEST-A11Y-004: ARIA Labels & Roles
**Priority**: MEDIUM
**Description**: Verify proper ARIA attributes
**Steps**:
1. Inspect Follow button HTML
2. Inspect toggle switches HTML
**Expected Attributes**:
- Follow button: `aria-label="Follow ISO for evidence notifications"`, `aria-pressed="false"`
- Toggles: `role="switch"`, `aria-checked="true"`, `aria-labelledby="label-id"`
- Disabled toggles: `aria-disabled="true"`, `aria-describedby="tier-requirement"`
**Status**: ⏳ Pending Implementation

---

## 6. Security Tests (5 tests)

### Test Suite: Security Validation

#### TEST-SEC-001: Triple-Layer Tier Validation
**Priority**: CRITICAL
**Description**: Verify all 3 security layers enforce tier boundaries
**Layers to Test**:

**Layer 1 - Database RLS**:
```sql
-- As Event Pass user, try to enable evidence notifications
UPDATE notification_preferences
SET evidence_notifications = true
WHERE user_id = '{event-pass-user-id}';
-- Expected: PostgreSQL error "new row violates row-level security policy"
```

**Layer 2 - API Endpoint**:
```bash
# As Event Pass user, POST to preferences API
curl -X POST /api/notifications/preferences \
  -H "Authorization: Bearer {event-pass-token}" \
  -d '{"evidence_notifications": true}'
# Expected: 403 Forbidden
```

**Layer 3 - UI Component**:
- Evidence notifications toggle should be disabled
- Badge should show "Evidence Analyst Only"
- Clicking disabled toggle does nothing

**Expected**: All 3 layers independently enforce restrictions
**Status**: ⏳ Pending Implementation

#### TEST-SEC-002: JWT Token Security
**Priority**: CRITICAL
**Description**: Test unsubscribe token tampering resistance
**Steps**:
1. Generate valid unsubscribe token
2. Modify token payload (change user_id)
3. Try to use modified token
**Expected**:
- Modified token rejected (signature invalid)
- Returns 401 Unauthorized
- User NOT unsubscribed
**Status**: ⏳ Pending Implementation

#### TEST-SEC-003: Rate Limit Bypass Attempt
**Priority**: HIGH
**Description**: Try to bypass rate limiting via database manipulation
**Steps**:
1. Send 5 emails to user (hit rate limit)
2. Manually delete entries from `notification_log` table
3. Try to send 6th email
**Expected**:
- Rate limit function counts live database records
- 6th email should now send (count reset to 5)
- This is expected behavior (admin can clear logs)
**Status**: ⏳ Pending Implementation

#### TEST-SEC-004: Cron Job Authentication Bypass
**Priority**: CRITICAL
**Description**: Try to trigger cron job without secret
**Steps**:
1. Send GET to `/api/cron/observation-windows` with:
   - No Authorization header
   - Wrong secret: `Authorization: Bearer wrong-secret`
   - Expired secret (if time-based)
**Expected**:
- All requests return 401 Unauthorized
- No emails sent
- No database queries executed
**Status**: ⏳ Pending Implementation

#### TEST-SEC-005: SQL Injection in Email Templates
**Priority**: HIGH
**Description**: Test email templates sanitize user input
**Steps**:
1. Post comment with SQL injection attempt:
   ```
   Comment: "'; DROP TABLE users; --"
   ```
2. Reply to that comment (trigger reply notification)
3. Check email body
**Expected**:
- Email displays escaped text (no SQL execution)
- React Email automatically escapes JSX content
- No XSS or SQL injection possible
**Status**: ⏳ Pending Implementation

---

## Test Execution Guide

### Manual Testing Workflow

**Daily Testing Checklist** (During Implementation):
1. [ ] Run dev server: `pnpm dev`
2. [ ] Test new component in browser
3. [ ] Check console for errors
4. [ ] Test with all 3 user tiers
5. [ ] Verify database changes in Supabase
6. [ ] Check Resend dashboard for sent emails

### Automated Testing (Future)

**Unit Tests** (Jest/Vitest):
- `lib/notifications/helpers.test.ts`
  - `canEnableNotification()`
  - `checkRateLimit()`
  - `generateUnsubscribeToken()`
  - `verifyUnsubscribeToken()`

**Integration Tests** (Playwright):
- `e2e/notifications/follow-button.spec.ts`
- `e2e/notifications/preferences-page.spec.ts`
- `e2e/notifications/unsubscribe-flow.spec.ts`

**API Tests** (Supertest):
- `api/notifications/preferences.test.ts`
- `api/notifications/unsubscribe.test.ts`
- `api/cron/observation-windows.test.ts`

---

## Test Data Setup

### Database Test Data

**Create Test Users**:
```sql
-- Spectator (free)
INSERT INTO profiles (id, email, full_name) VALUES
  (gen_random_uuid(), 'spectator@test.com', 'Test Spectator');

-- Event Pass ($4.99/mo)
INSERT INTO profiles (id, email, full_name) VALUES
  (gen_random_uuid(), 'eventpass@test.com', 'Test Event Pass');
INSERT INTO subscriptions (user_id, tier, status) VALUES
  ('{event-pass-user-id}', 'event_pass', 'active');

-- Evidence Analyst ($19/mo)
INSERT INTO profiles (id, email, full_name) VALUES
  (gen_random_uuid(), 'analyst@test.com', 'Test Analyst');
INSERT INTO subscriptions (user_id, tier, status) VALUES
  ('{analyst-user-id}', 'evidence_analyst', 'active');
```

**Create Test ISO with Observation Window**:
```sql
UPDATE iso_objects
SET observation_window_start = NOW() + INTERVAL '7 days',
    observation_window_end = NOW() + INTERVAL '14 days',
    visibility_notes = 'Test: Best viewed from Northern Hemisphere. Peak visibility: 22:00-02:00 UTC.'
WHERE id = 1; -- 1I/'Oumuamua
```

### Resend Test Email Address

**For Sandbox Testing** (before domain verification):
- Use `delivered@resend.dev` as recipient
- Emails will show in Resend dashboard but not deliver to inbox
- Good for testing templates and API integration

**For Production Testing** (after domain verification):
- Use your personal email address
- Test on multiple email clients (Gmail, Outlook, Apple Mail)

---

## Bug Report Template

When issues are found during testing, use this format:

```markdown
## Bug: [Clear, concise title]

**Severity**: Critical | High | Medium | Low
**Test Case**: TEST-XXX-000
**Environment**: Development | Staging | Production

### Steps to Reproduce
1. [Exact steps from current state]
2. [Include user tier and authentication state]
3. [Include any relevant IDs or data]

### Expected Behavior
[What should happen according to PRD/design]

### Actual Behavior
[What actually happens]

### Evidence
- Screenshot: [path or link]
- Console errors: [copy exact error messages]
- Database state: [relevant table data]
- Network request: [API response body]

### Additional Context
- User tier: [Spectator/Event Pass/Evidence Analyst]
- Browser: [Chrome 120, Firefox 121, etc.]
- Device: [Desktop macOS, iPhone 15, etc.]
- Reproducibility: [Always | Sometimes | Once]

### Root Cause Analysis (if known)
[Why did this happen?]

### Suggested Fix (optional)
[Proposed solution]
```

---

## Success Criteria

### Phase 4.3 Testing Complete When:

**UI Components** (11/11 passing):
- [ ] Follow button works for all tiers
- [ ] Preferences page accessible and functional
- [ ] Tier restrictions enforced visually
- [ ] Loading states work correctly
- [ ] Error handling graceful

**API Endpoints** (8/8 passing):
- [ ] Preferences GET/POST working
- [ ] Unsubscribe endpoint functional
- [ ] Cron job authenticated and working
- [ ] Notification triggers non-blocking

**Email Delivery** (6/6 passing):
- [ ] All 3 email templates deliver successfully
- [ ] Rate limiting enforced (5/day)
- [ ] Unsubscribe links functional
- [ ] Mobile rendering verified
- [ ] Batch processing works

**Integration Tests** (5/5 passing):
- [ ] End-to-end flows complete without errors
- [ ] Tier upgrade/downgrade handled correctly
- [ ] Cross-browser compatibility verified

**Accessibility** (4/4 passing):
- [ ] Keyboard navigation functional
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] ARIA labels correct

**Security** (5/5 passing):
- [ ] Triple-layer tier validation working
- [ ] JWT tokens secure
- [ ] Rate limiting cannot be bypassed
- [ ] Cron job requires authentication
- [ ] SQL injection/XSS prevented

**Total**: 39/39 tests passing

---

## Known Issues & Limitations

### Documented in Implementation

1. **TypeScript Module Resolution Warnings** - False positives, no fix needed
2. **pnpm Workspace Package Installation** - Must install in `apps/web` directory
3. **Resend Sandbox Mode** - Emails limited until domain verified
4. **Rate Limiting Per User** - 5 emails total across all ISOs (by design)

### Testing Limitations

1. **Cron Job Testing** - Cannot easily test daily schedule (must manually trigger)
2. **Email Deliverability** - Spam filters may affect delivery in testing
3. **Stripe Integration** - Requires test mode webhooks for tier changes
4. **Multi-User Testing** - Need multiple accounts to test notifications

---

## Next Steps After Testing

### When All Tests Pass:

1. **Deploy to Production**:
   - Deploy database migration to production Supabase
   - Deploy code to Vercel (automatic via git push)
   - Verify environment variables in Vercel dashboard
   - Test with production Resend domain

2. **Monitor Week 1**:
   - Check Vercel logs for cron execution (daily 00:00 UTC)
   - Monitor Resend dashboard (delivery rates, bounces)
   - Query `notification_log` table for sent emails
   - Watch for rate limit violations
   - Monitor unsubscribe rates

3. **Proceed to Phase 4.4**:
   - Community Guidelines & Moderation
   - Admin dashboard for content moderation
   - User management tools

---

## Testing Resources

**Documentation**:
- `/docs/phase-4-3-implementation-prompt.md` - Implementation requirements
- `/handoff-notes.md` - Implementation summary and architecture
- `/docs/deployment/vercel-cron-setup.md` - Cron configuration guide
- `/database/migrations/007_email_notifications.sql` - Database schema

**External Tools**:
- Resend Dashboard: https://resend.com/emails
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- Lighthouse: Chrome DevTools → Audits
- axe DevTools: https://www.deque.com/axe/devtools/

**Test Email Services**:
- Litmus: https://litmus.com (email rendering across clients)
- Email on Acid: https://www.emailonacid.com (email testing)
- Mailtrap: https://mailtrap.io (email testing inbox)

---

**Status**: 🔴 READY FOR USE AFTER IMPLEMENTATION

**Created**: 2025-01-11 by @tester
**Last Updated**: 2025-01-11

**See**: `/docs/phase-4-3-implementation-prompt.md` for implementation guide
