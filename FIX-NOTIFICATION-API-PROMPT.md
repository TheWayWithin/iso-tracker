# Fix: Notification Preferences API 500 Error

**Quick Context**: The `/api/notifications/preferences` endpoint returns 500 error when loading user notification settings. UI works but can't fetch data from database.

---

## The Issue

**What's broken**: `GET /api/notifications/preferences` → 500 Internal Server Error

**User affected**: `jamie-test@example.com` (test user, logged in)

**Error location**: Browser console shows error at `page.tsx:43:31`

**What works**:
- ✅ User signup/login
- ✅ Notification settings page UI (displays with defaults)
- ✅ User has database records in `profiles` and `subscriptions`

**What doesn't work**:
- ❌ API fails to load user's notification preferences from database
- ❌ Page shows default values instead of saved preferences

---

## Recent Important Change

User signup was just fixed (Issue #002). Signup now creates `notification_preferences` record in application code (`apps/web/app/auth/actions.ts` lines 72-79), not via database triggers.

Test user `jamie-test@example.com` was created AFTER this fix, so should have the record.

---

## Your Task

**Fix the 500 error** so the notification preferences API loads correctly.

**Steps**:
1. Check if `notification_preferences` record exists for user (use Supabase dashboard or SQL query)
2. Read `/apps/web/app/api/notifications/preferences/route.ts` - find the bug
3. Check server logs in `/tmp/iso-dev.log` for actual error message
4. Fix the bug (likely database query error or missing record)
5. Test: reload `/settings/notifications` page - should load without 500 error

---

## Files to Check

**Priority 1**:
- `/apps/web/app/api/notifications/preferences/route.ts` (API code)
- Database: `notification_preferences` table (check record exists)
- `/tmp/iso-dev.log` (server error logs)

**Priority 2** (if needed):
- `/database/migrations/007_email_notifications.sql` (RLS policies)
- `/apps/web/app/settings/notifications/page.tsx:42-51` (error source)

---

## Success Criteria

- [ ] GET `/api/notifications/preferences` returns 200 OK
- [ ] Page loads without 500 error
- [ ] User sees their actual saved preferences (not defaults)
- [ ] No errors in console or server logs

---

## Environment

- Dev server: `http://localhost:3001`
- Test user: `jamie-test@example.com` / password: `testpass123`
- Database: Supabase (connection details in `.env.local`)

---

**Full details**: See `ISSUE-003-NOTIFICATION-API-500.md` for complete debugging guide.
