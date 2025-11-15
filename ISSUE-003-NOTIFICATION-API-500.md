# Issue #003: Notification Preferences API Returns 500 Error

**Date**: 2025-01-12
**Severity**: P1 - High (blocks notification settings functionality)
**Status**: 🔴 OPEN
**Assignee**: TBD

---

## Problem Summary

The `/api/notifications/preferences` endpoint returns a 500 Internal Server Error when a logged-in user tries to load their notification preferences. The UI page displays correctly with default values, but fails to load actual user data from the database.

---

## Error Details

**HTTP Response**: `500 Internal Server Error`
**Endpoint**: `GET http://localhost:3001/api/notifications/preferences`
**Browser Console Error**:
```
Failed to load preferences: Error: Failed to load preferences
    at loadPreferences (page.tsx:43:31)
```

**User**: `jamie-test@example.com` (logged in)
**Page**: `/settings/notifications`

---

## What Works

✅ **UI Layer**:
- Notification settings page renders correctly
- Three notification types display with proper labels
- Tier limits show correctly (10/day, 5/day, "Upgrade" message)
- Save/Reset buttons render
- Page defaults to showing enabled checkboxes

✅ **Database**:
- User successfully signed up (fixed in Issue #002)
- User record exists in `auth.users`
- User has records in: `profiles`, `subscriptions`
- User SHOULD have record in `notification_preferences` (created during signup)

---

## What Doesn't Work

❌ **API Layer**:
- GET request to `/api/notifications/preferences` fails with 500 error
- No user-specific data loads
- Page falls back to default/placeholder values

---

## Recent Context (Important!)

**User signup was recently fixed (Issue #002)**:
- Database triggers on `auth.users` were removed (didn't work in Supabase)
- User record creation moved to application code (`apps/web/app/auth/actions.ts`)
- Signup now manually creates: profile, subscription, **notification_preferences**

**Key Signup Code** (`apps/web/app/auth/actions.ts` lines 72-79):
```typescript
// 3. Create notification preferences
const { error: prefsError } = await supabase.from('notification_preferences').insert({
  user_id: userId,
  email: email,
  unsubscribe_token: crypto.randomUUID(),
  reply_notifications: true,
  evidence_notifications: true,
  observation_window_alerts: false,
})
```

---

## Potential Causes

### Theory 1: Missing Database Record
- Notification_preferences record wasn't created during signup
- User signed up BEFORE fix was deployed
- Test user (`jamie-test@example.com`) might have orphaned records

### Theory 2: Database Query Error
- API code might have incorrect query
- RLS (Row-Level Security) policy blocking read access
- Column name mismatch between migration and API code

### Theory 3: Authentication Issue
- API can't identify logged-in user (but unlikely - other pages work)
- Session/JWT token issue

### Theory 4: API Code Error
- Exception thrown in API route handler
- Missing error handling
- Type mismatch or null reference

---

## Files to Investigate

**Priority 1 - Check These First**:
1. `/apps/web/app/api/notifications/preferences/route.ts` - API endpoint code
2. Database: Check if `notification_preferences` record exists for user
3. `/apps/web/app/settings/notifications/page.tsx:42-51` - Where error is thrown

**Priority 2 - If Above Don't Reveal Issue**:
4. `/database/migrations/007_email_notifications.sql` - RLS policies
5. `/apps/web/lib/supabase/server.ts` - Supabase client setup
6. Browser Network tab - Inspect actual 500 response body

---

## Debugging Steps

### Step 1: Check Database Record
```sql
-- Does notification_preferences record exist for this user?
SELECT * FROM notification_preferences
WHERE email = 'jamie-test@example.com';

-- Or by user_id (get from profiles first)
SELECT id FROM profiles WHERE email = 'jamie-test@example.com';
-- Then:
SELECT * FROM notification_preferences WHERE user_id = '<user-id>';
```

### Step 2: Check API Route Code
- Read `/apps/web/app/api/notifications/preferences/route.ts`
- Look for try/catch blocks - is error being caught and logged?
- Check the database query - correct table name, column names?
- Verify RLS policies allow user to read their own preferences

### Step 3: Check Server Logs
- Look at Next.js dev server output for actual error message
- 500 errors usually log stack traces server-side
- Check `/tmp/iso-dev.log` for error details

### Step 4: Test Database Query Directly
- Use Supabase dashboard SQL editor
- Run the same query the API is trying to execute
- See if it works or throws an error

---

## Expected Behavior

When a logged-in user visits `/settings/notifications`:
1. Page loads with loading state
2. GET request to `/api/notifications/preferences` succeeds (200 OK)
3. API returns user's actual preference settings from database
4. Page displays user's saved toggles (not defaults)
5. User can toggle settings and save changes

---

## Acceptance Criteria

- [ ] GET `/api/notifications/preferences` returns 200 OK
- [ ] API returns user's actual saved preferences
- [ ] Page displays correct toggle states (not defaults)
- [ ] No 500 errors in console or server logs
- [ ] User can save changes successfully

---

## Related Issues

- **Issue #002**: User Signup Failure (RESOLVED) - Signup now creates notification_preferences
- Database trigger removal might have left some users without preferences records

---

## Priority & Impact

**Priority**: P1 - High
**Impact**: Blocks notification settings feature (Sprint 4 deliverable)
**Users Affected**: All users trying to manage notification preferences
**Workaround**: None - feature completely broken

---

## Notes

- Dev server running on `http://localhost:3001`
- User `jamie-test@example.com` created AFTER signup fix
- Should have notification_preferences record
- UI works, only backend API fails
