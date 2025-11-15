# Sprint 4 Testing Checklist - Collaboration & Community Features

**Sprint**: Sprint 4 (Phases 4.1-4.4)
**Created**: 2025-01-12
**Status**: Ready for QA
**Estimated Testing Time**: 6-8 hours

---

## Overview

Sprint 4 implemented 4 major feature areas across 22 files (~3,000+ lines):
- **Phase 4.1**: Voting System (completed earlier)
- **Phase 4.2**: Debate Threads (completed earlier)
- **Phase 4.3**: Email Notifications (14 files, ~1,850 lines)
- **Phase 4.4**: Community Guidelines & Moderation (8 files, ~1,200 lines)

This checklist provides systematic testing coverage for all Sprint 4 features.

---

## Prerequisites

### Environment Setup
- [ ] Dev server running: `pnpm dev` (http://localhost:3003)
- [ ] Supabase local dev running: `supabase start`
- [ ] Migration 007 deployed (Email Notifications)
- [ ] Migration 008 deployed (Admin Moderation)
- [ ] Test accounts ready:
  - [ ] Admin user (profiles.role = 'admin')
  - [ ] Evidence Analyst user (subscriptions.tier = 'evidence_analyst')
  - [ ] Event Pass user (subscriptions.tier = 'event_pass')
  - [ ] Free user (subscriptions.tier = 'free')
  - [ ] Logged-out user (no account)

### Database Verification
- [ ] Run: `supabase db push` (deploy migrations)
- [ ] Verify tables exist in Supabase dashboard:
  - [ ] notification_preferences
  - [ ] notification_log
  - [ ] iso_follows
  - [ ] moderation_flags
  - [ ] moderation_actions
- [ ] Verify profiles columns added: suspended_until, banned_at, suspension_reason

---

## Phase 4.1: Voting System

### Upvote/Downvote Functionality
- [ ] **Test 1.1**: Can upvote comment as authenticated user
  - Navigate to ISO detail page with comments
  - Click upvote button on a comment
  - Verify vote count increments
  - Verify button changes to active state
- [ ] **Test 1.2**: Can downvote comment as authenticated user
  - Click downvote button on a comment
  - Verify vote count decrements
  - Verify button changes to active state
- [ ] **Test 1.3**: Can remove vote by clicking same button again
  - Click upvote button on already-upvoted comment
  - Verify vote is removed (count decrements)
  - Verify button returns to inactive state
- [ ] **Test 1.4**: Cannot vote as logged-out user
  - Log out
  - Try to click vote button
  - Verify redirected to /auth/signin
- [ ] **Test 1.5**: Vote persists across page refresh
  - Upvote a comment
  - Refresh page
  - Verify vote still shows as active

### Tier Boundaries
- [ ] **Test 1.6**: Free tier can vote on comments (basic feature)
- [ ] **Test 1.7**: Event Pass can vote on comments
- [ ] **Test 1.8**: Evidence Analyst can vote on comments

---

## Phase 4.2: Debate Threads

### Thread Creation
- [ ] **Test 2.1**: Evidence Analyst can create debate thread
  - Log in as Evidence Analyst
  - Navigate to ISO detail page
  - Find "Start Debate" button
  - Create thread with title and description
  - Verify thread appears in debates list
- [ ] **Test 2.2**: Event Pass cannot create debate thread
  - Log in as Event Pass user
  - Verify "Start Debate" button shows upgrade prompt
  - Click button → redirected to /pricing
- [ ] **Test 2.3**: Free tier cannot create debate thread
  - Log in as Free user
  - Verify no "Start Debate" button visible OR shows upgrade CTA

### Thread Participation
- [ ] **Test 2.4**: Evidence Analyst can post argument in thread
  - Navigate to debate thread
  - Post argument with position (pro/con/neutral)
  - Verify argument appears in thread
- [ ] **Test 2.5**: Event Pass can view but not post in thread
  - Log in as Event Pass
  - Navigate to debate thread
  - Verify can see arguments but no "Post Argument" button
- [ ] **Test 2.6**: Arguments show correct position indicator (pro/con/neutral)
- [ ] **Test 2.7**: Can vote on arguments (same as comment voting)

---

## Phase 4.3: Email Notifications

### Notification Preferences

#### Event Pass User Tests
- [ ] **Test 3.1**: Can access /settings/notifications
  - Log in as Event Pass user
  - Navigate to /settings/notifications
  - Verify page loads without errors
- [ ] **Test 3.2**: Can enable reply notifications (Event Pass feature)
  - Toggle "Reply notifications" ON
  - Click Save
  - Verify success message
  - Refresh page → verify toggle still ON
- [ ] **Test 3.3**: Cannot enable evidence notifications (Evidence Analyst only)
  - Verify "Evidence notifications" toggle shows upgrade badge
  - Try to toggle ON → shows upgrade CTA
- [ ] **Test 3.4**: Cannot enable observation window alerts (Evidence Analyst only)
  - Verify "Observation window alerts" toggle shows upgrade badge
  - Try to toggle ON → shows upgrade CTA

#### Evidence Analyst User Tests
- [ ] **Test 3.5**: Can enable all 3 notification types
  - Log in as Evidence Analyst
  - Navigate to /settings/notifications
  - Enable all 3 notification types
  - Click Save → verify success
- [ ] **Test 3.6**: Can disable notification types
  - Disable "Reply notifications"
  - Click Save → verify success
  - Verify toggle updates to OFF

#### Free Tier User Tests
- [ ] **Test 3.7**: Free tier has limited access to notification settings
  - Log in as Free user
  - Navigate to /settings/notifications
  - Verify shows upgrade CTA for all notification types

### Follow ISO Functionality
- [ ] **Test 3.8**: Evidence Analyst can follow ISO
  - Log in as Evidence Analyst
  - Navigate to ISO detail page
  - Click "Follow" button
  - Verify button changes to "Following"
  - Verify added to iso_follows table (check Supabase dashboard)
- [ ] **Test 3.9**: Event Pass cannot follow ISO
  - Log in as Event Pass
  - Navigate to ISO detail page
  - Verify Follow button shows upgrade badge
  - Click Follow → redirected to /pricing
- [ ] **Test 3.10**: Can unfollow ISO
  - As Evidence Analyst with followed ISO
  - Click "Following" button
  - Verify button changes to "Follow"
  - Verify removed from iso_follows table

### Email Delivery (Manual Testing)

#### Setup
- [ ] Configure RESEND_API_KEY in .env.local
- [ ] Configure personal email in test account profiles
- [ ] Run dev server with email debugging enabled

#### Reply Notifications
- [ ] **Test 3.11**: Reply notification email sent
  - User A posts comment on ISO
  - User B replies to User A's comment
  - Verify User A receives email with reply content
  - Verify email subject: "[User B] replied to your comment on [ISO]"
- [ ] **Test 3.12**: Reply notification respects preferences
  - User A disables reply notifications
  - User B replies to User A's comment
  - Verify User A does NOT receive email

#### Evidence Notifications
- [ ] **Test 3.13**: Evidence notification sent to followers
  - User A follows ISO X
  - User B submits evidence to ISO X
  - Verify User A receives email about new evidence
  - Verify email subject: "New evidence submitted for [ISO]"
- [ ] **Test 3.14**: Evidence notification respects tier boundaries
  - Event Pass user follows ISO (should fail at UI level)
  - Verify Event Pass user cannot enable evidence notifications

#### Observation Window Alerts
- [ ] **Test 3.15**: Observation window alert sent 7 days before
  - Set observation_window_start to 7 days from now in iso_objects table
  - Run cron endpoint: `curl http://localhost:3003/api/cron/observation-windows -H "Authorization: Bearer $CRON_SECRET"`
  - Verify followers receive email
  - Verify email subject: "Observation window opening for [ISO]"

### Rate Limiting
- [ ] **Test 3.16**: Rate limit enforced at database level
  - Send 6 reply notification emails to same user (Event Pass = 50/day limit)
  - Verify first 5 succeed
  - Verify 6th is rate-limited (should fail gracefully)
  - Check notification_log table for rate limit entries

### Unsubscribe Functionality
- [ ] **Test 3.17**: Unsubscribe link works (JWT-based)
  - Receive email notification
  - Click "Unsubscribe" link in footer
  - Verify redirected to /api/notifications/unsubscribe with token
  - Verify success message shown
  - Verify notification_preferences updated (check Supabase)
- [ ] **Test 3.18**: Cannot unsubscribe with invalid token
  - Try to access unsubscribe URL with invalid JWT
  - Verify error message shown

### Vercel Cron Setup (Production)
- [ ] **Test 3.19**: vercel.json configuration correct
  - Verify vercel.json has cron schedule: "0 12 * * *" (daily at noon UTC)
  - Verify CRON_SECRET environment variable set in Vercel dashboard
- [ ] **Test 3.20**: Cron endpoint protected by bearer token
  - Try to access /api/cron/observation-windows without Authorization header
  - Verify 401 Unauthorized returned

---

## Phase 4.4: Community Guidelines & Moderation

### Community Guidelines Page
- [ ] **Test 4.1**: Can access /guidelines as any user
  - Navigate to /guidelines (logged out)
  - Verify page loads with all sections
- [ ] **Test 4.2**: All sections render correctly
  - Verify "Core Guidelines" section visible
  - Verify "Evidence Submission Standards" section visible
  - Verify "Moderation Policy" section visible
  - Verify "Contact" section visible
- [ ] **Test 4.3**: Section anchors work
  - Click link to #evidence-standards
  - Verify page scrolls to correct section
- [ ] **Test 4.4**: Mobile responsive (375px width)
  - Resize browser to 375px width
  - Verify text readable, no horizontal scroll
  - Verify sections stack vertically

### Admin Access Control
- [ ] **Test 4.5**: Admin user can access /admin/moderation
  - Log in as admin user (profiles.role = 'admin')
  - Navigate to /admin/moderation
  - Verify page loads without errors
- [ ] **Test 4.6**: Non-admin redirected from /admin routes
  - Log in as Evidence Analyst (not admin)
  - Try to navigate to /admin/moderation
  - Verify redirected to / (home page)
  - Verify error message shown
- [ ] **Test 4.7**: Logged-out user redirected to sign-in
  - Log out
  - Try to navigate to /admin/moderation
  - Verify redirected to /auth/signin

### Moderation Queue

#### Flagging Content
- [ ] **Test 4.8**: User can flag inappropriate comment
  - Log in as any authenticated user
  - Find comment to flag
  - Click "Flag" button (need to add this UI)
  - Provide reason (min 10 chars)
  - Verify flag created in moderation_flags table
- [ ] **Test 4.9**: Cannot flag same content twice
  - Try to flag same comment again
  - Verify error message (unique constraint violation)

#### Admin Review
- [ ] **Test 4.10**: Admin sees flagged content in queue
  - Log in as admin
  - Navigate to /admin/moderation
  - Verify flagged content appears in table
  - Verify shows: content type, preview, reporter, reason, date
- [ ] **Test 4.11**: Filter by status (pending/reviewed/dismissed)
  - Select "Pending" filter
  - Verify only pending flags shown
  - Select "Reviewed" filter
  - Verify only reviewed flags shown
- [ ] **Test 4.12**: Filter by content type (comment/evidence/argument)
  - Select "Comments" filter
  - Verify only comment flags shown

#### Moderation Actions
- [ ] **Test 4.13**: Admin can approve flag (keep content)
  - Click "Review" button on flagged content
  - Enter reason (min 10 chars)
  - Click "Approve (Keep Content)"
  - Verify flag status → dismissed
  - Verify content still exists
  - Verify action logged in moderation_actions table
- [ ] **Test 4.14**: Admin can reject flag (no action)
  - Click "Review" on flagged content
  - Enter reason
  - Click "Reject (No Action)"
  - Verify flag status → dismissed
  - Verify content still exists
- [ ] **Test 4.15**: Admin can remove content
  - Click "Review" on flagged content
  - Enter reason
  - Click "Remove Content"
  - Verify confirmation modal shown
  - Confirm removal
  - Verify flag status → reviewed
  - Verify content deleted from database
  - Verify action logged

### User Management

#### User Search & Filtering
- [ ] **Test 4.16**: Admin can search users by username
  - Navigate to /admin/users
  - Enter username in search box
  - Verify filtered results shown
- [ ] **Test 4.17**: Admin can search users by email
  - Enter email in search box
  - Verify filtered results shown
- [ ] **Test 4.18**: Filter by status (active/suspended/banned)
  - Select "Active" filter
  - Verify only active users shown
- [ ] **Test 4.19**: Filter by subscription tier
  - Select "Evidence Analyst" filter
  - Verify only Evidence Analyst users shown

#### User Suspension
- [ ] **Test 4.20**: Admin can suspend user
  - Click "Suspend" button on user row
  - Select duration (7 days)
  - Enter reason (min 10 chars)
  - Confirm suspension
  - Verify user status → suspended
  - Verify suspended_until = now() + 7 days
  - Verify action logged in moderation_actions
- [ ] **Test 4.21**: Suspended user cannot submit content
  - Log in as suspended user
  - Try to submit comment/evidence
  - Verify 403 error OR UI disabled
- [ ] **Test 4.22**: Admin can unsuspend user
  - Click "Unsuspend" button on suspended user
  - Enter reason
  - Confirm
  - Verify suspended_until = null
  - Verify user can submit content again

#### User Banning
- [ ] **Test 4.23**: Admin can ban user (permanent)
  - Click "Ban" button on user row
  - Enter reason (min 10 chars)
  - Confirm ban (with warning modal)
  - Verify banned_at = now()
  - Verify user status → banned
- [ ] **Test 4.24**: Banned user cannot access platform
  - Log in as banned user
  - Verify redirected or shown banned message
- [ ] **Test 4.25**: Cannot ban other admins
  - Try to click "Ban" on another admin user row
  - Verify button disabled
  - Try API call directly → verify 403 error

### System Health Dashboard
- [ ] **Test 4.26**: Admin can view system health metrics
  - Navigate to /admin/health (if exists) OR check /admin/moderation for health widget
  - Verify shows:
    - Total users count
    - Active users (30 days)
    - Total evidence/comments
    - Pending flags count
    - Recent signups (7 days)
- [ ] **Test 4.27**: Health metrics cached for 5 minutes
  - View health metrics
  - Add new user in database
  - Refresh page immediately
  - Verify count does NOT update (cached)
  - Wait 5 minutes → verify count updates

### Audit Trail
- [ ] **Test 4.28**: All moderation actions logged
  - Perform any moderation action
  - Query moderation_actions table in Supabase
  - Verify entry exists with:
    - admin_id (correct admin)
    - action_type (correct action)
    - target_id (correct content/user)
    - reason (provided reason)
    - metadata (additional context)
    - created_at (timestamp)
- [ ] **Test 4.29**: Audit log is append-only
  - Try to UPDATE or DELETE row in moderation_actions table
  - Verify fails with permission error (RLS policy)

---

## Cross-Feature Integration Tests

### Notification + Moderation Integration
- [ ] **Test 5.1**: Flagged content notification to admins (future feature)
  - User flags content
  - Verify admin receives email notification (if implemented)

### Voting + Moderation Integration
- [ ] **Test 5.2**: Removed content votes are cleaned up
  - Admin removes flagged comment
  - Verify votes on that comment also removed (cascade delete)

### Debate + Email Integration
- [ ] **Test 5.3**: Debate participants receive notifications
  - User A posts argument in debate thread
  - User B replies to User A's argument
  - Verify User A receives reply notification (if applicable)

---

## Performance Tests

### Load Time
- [ ] **Test 6.1**: Notification preferences page loads <2s
  - Use Chrome DevTools Network tab
  - Measure time to interactive
  - Verify <2000ms
- [ ] **Test 6.2**: Admin moderation queue loads <3s with 50 flags
  - Seed 50 flags in database
  - Navigate to /admin/moderation
  - Verify loads <3000ms

### Database Query Optimization
- [ ] **Test 6.3**: Email notification queries use indexes
  - Enable Supabase query logging
  - Trigger email notification
  - Verify queries use indexes (no sequential scans on large tables)

---

## Security Tests

### Authentication & Authorization
- [ ] **Test 7.1**: API routes enforce authentication
  - Call /api/admin/moderation without auth token
  - Verify 401 Unauthorized
- [ ] **Test 7.2**: API routes enforce admin role
  - Call /api/admin/moderation with non-admin auth token
  - Verify 403 Forbidden
- [ ] **Test 7.3**: RLS policies prevent unauthorized database access
  - Use Supabase SQL editor as non-admin user
  - Try to SELECT * FROM moderation_actions
  - Verify returns empty or error

### Input Validation
- [ ] **Test 7.4**: Reason field requires min 10 characters
  - Try to submit moderation action with 5-char reason
  - Verify error message shown
- [ ] **Test 7.5**: SQL injection prevented
  - Enter `'; DROP TABLE users; --` in search box
  - Verify no database error, search fails gracefully

### XSS Prevention
- [ ] **Test 7.6**: User-generated content sanitized in emails
  - Post comment with `<script>alert('XSS')</script>`
  - Verify email renders as plain text, no script execution

---

## Edge Cases & Error Handling

### Network Errors
- [ ] **Test 8.1**: Email notification handles Resend API failure
  - Disable internet OR mock Resend API error
  - Trigger notification
  - Verify error logged, does NOT block user action
- [ ] **Test 8.2**: Rate limit exceeded shows user-friendly message
  - Exceed rate limit for notification type
  - Verify shows message: "Daily notification limit reached"

### Database Errors
- [ ] **Test 8.3**: Handle database connection loss gracefully
  - Stop Supabase service mid-request
  - Try to load /admin/moderation
  - Verify shows error message, no crash

### User Experience
- [ ] **Test 8.4**: Loading states shown during API calls
  - Click "Suspend" button
  - Verify shows loading spinner during API call
- [ ] **Test 8.5**: Success/error toasts appear for all actions
  - Perform any moderation action
  - Verify success toast shown with confirmation message

---

## Mobile Responsiveness

### All Sprint 4 Pages
- [ ] **Test 9.1**: /settings/notifications mobile responsive (375px)
- [ ] **Test 9.2**: /admin/moderation mobile responsive (375px)
  - Verify table collapses to cards on mobile
- [ ] **Test 9.3**: /admin/users mobile responsive (375px)
- [ ] **Test 9.4**: /guidelines mobile responsive (375px)

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- [ ] **Test 10.1**: Can navigate preferences page with keyboard only
  - Tab through all toggles and buttons
  - Verify focus indicators visible
  - Verify can activate with Enter/Space
- [ ] **Test 10.2**: Can navigate moderation queue with keyboard
  - Tab through all action buttons
  - Verify modals accessible with keyboard

### Screen Reader
- [ ] **Test 10.3**: Toggle switches have aria-labels
  - Use screen reader (macOS VoiceOver)
  - Navigate to notification preferences
  - Verify each toggle announced correctly
- [ ] **Test 10.4**: Admin tables have accessible headers
  - Navigate to /admin/moderation
  - Verify table headers read aloud

---

## Regression Tests (Previous Sprints)

### Sprint 3: Evidence Framework
- [ ] **Test 11.1**: Evidence submission still works
- [ ] **Test 11.2**: Evidence assessment still works
- [ ] **Test 11.3**: Consensus calculation still works

### Sprint 2: ISO Detail Pages
- [ ] **Test 11.4**: ISO detail page loads correctly
- [ ] **Test 11.5**: Can view ISO metadata
- [ ] **Test 11.6**: Can view evidence list for ISO

### Sprint 1: Auth & Database
- [ ] **Test 11.7**: Sign up still works
- [ ] **Test 11.8**: Sign in still works
- [ ] **Test 11.9**: Profile page still works

---

## Test Summary

**Total Tests**: 97 test cases
**Priority Breakdown**:
- **P0 (Critical)**: 40 tests (auth, security, core functionality)
- **P1 (High)**: 35 tests (tier boundaries, email delivery, admin features)
- **P2 (Medium)**: 22 tests (UX polish, edge cases, performance)

**Estimated Testing Time**: 6-8 hours for full manual QA

---

## Next Steps After Testing

1. **Document Bugs**: Create issues in GitHub for any failing tests
2. **Fix Critical Issues**: P0 bugs block deployment
3. **Create Automated Tests**: Convert manual tests to Playwright/Jest
4. **Deploy to Staging**: Test in production-like environment
5. **User Acceptance Testing**: Beta testers validate features
6. **Production Deployment**: After all P0/P1 tests pass

---

**Testing Completed By**: _______________
**Date**: _______________
**Pass Rate**: _____% (___/97 tests passed)
