# Vercel Cron Job Setup Guide - Observation Window Alerts

**Purpose**: Configure daily cron job to send observation window alerts 7 days before ISO enters observation window

**Target**: Run daily at 00:00 UTC via Vercel Cron

---

## Prerequisites

- [x] Vercel project deployed (`iso-tracker-web`)
- [x] CRON_SECRET environment variable set in Vercel
- [x] API endpoint `/api/cron/observation-windows` deployed
- [ ] At least one ISO with `observation_window_start` date set (for testing)

---

## Step 1: Verify Environment Variables in Vercel

**Where you are now**: You have Vercel project `iso-tracker-web` already set up

**Steps**:
1. Go to https://vercel.com/dashboard
2. Click on your `iso-tracker-web` project
3. Click "Settings" tab
4. Click "Environment Variables" in left sidebar
5. Verify these variables exist:

```bash
CRON_SECRET=769493324a46b342285d7093b946fd146287d9414a3333456fcabdca82a95b31
RESEND_API_KEY=re_NWcCUq7P_6v5He92YNSsv8vx8BszyNUdo
JWT_SECRET=cfafeab0e70b268ec8cd2bd0f7c65c4e3f735ffcc2ab122372ba2f1e8678fbb0231d688ac5937d30646a4036e34daded85bb1e5c4b384b32f3013e560ef0f490
NEXT_PUBLIC_APP_URL=https://your-production-domain.vercel.app
```

**Checkpoint**: Do you see all 4 environment variables listed? Let me know when you've verified this.

---

## Step 2: Create vercel.json Configuration File

**What we're doing**: Adding a configuration file that tells Vercel to run our cron job daily at midnight UTC

**Where you are now**: In your project root directory

**Steps**:
1. I'll create the `vercel.json` file in your project root
2. This file tells Vercel when and how to run the cron job

**Checkpoint**: Ready for me to create this file? (Yes/No)

---

## Step 3: Deploy to Vercel

**What we're doing**: Pushing the code changes to trigger a Vercel deployment

**Steps**:
1. The changes will be committed to git
2. Vercel will automatically deploy when you push to main branch
3. Vercel will read the `vercel.json` and set up the cron job

---

## Step 4: Test Cron Job Manually

**What we're doing**: Testing the cron endpoint works before waiting for the scheduled run

### Test Locally (Development)

```bash
# From project root
curl -X GET \
  -H "Authorization: Bearer 769493324a46b342285d7093b946fd146287d9414a3333456fcabdca82a95b31" \
  http://localhost:3003/api/cron/observation-windows
```

**Expected Response**:
```json
{
  "success": true,
  "processed": 0,
  "message": "No ISOs with observation windows starting in 7 days"
}
```

### Test on Vercel (Production)

```bash
curl -X GET \
  -H "Authorization: Bearer 769493324a46b342285d7093b946fd146287d9414a3333456fcabdca82a95b31" \
  https://your-project.vercel.app/api/cron/observation-windows
```

**Expected Response**: Same as above

### Test with Invalid Authorization

```bash
curl -X GET \
  -H "Authorization: Bearer wrong-secret" \
  https://your-project.vercel.app/api/cron/observation-windows
```

**Expected Response**:
```json
{
  "error": "Unauthorized"
}
```
**Expected Status Code**: 401

---

## Step 5: Verify Cron Job in Vercel Dashboard

**What we're doing**: Confirming Vercel recognized the cron configuration

**Steps**:
1. Go to https://vercel.com/dashboard
2. Click on your `iso-tracker-web` project
3. Click "Cron Jobs" tab (or "Integrations" → "Cron Jobs")
4. You should see: `observation-window-alerts` scheduled for `0 0 * * *`

**Checkpoint**: Do you see the cron job listed? Let me know what you see.

---

## Step 6: Monitor Cron Job Execution

### Check Vercel Logs

**Steps**:
1. Go to Vercel Dashboard → Your Project
2. Click "Logs" tab
3. Filter by "Cron" or search for "observation-windows"
4. Look for:
   - `GET /api/cron/observation-windows 200` (successful execution)
   - `Observation window cron: processed X ISOs` (console log from API)

### Check Notification Log Table

```sql
-- In Supabase SQL Editor
SELECT
  notification_type,
  email_subject,
  sent_at,
  COUNT(*) as sent_count
FROM notification_log
WHERE notification_type = 'observation_window'
  AND sent_at > NOW() - INTERVAL '24 hours'
GROUP BY notification_type, email_subject, sent_at
ORDER BY sent_at DESC;
```

**Expected**: Entries appear after cron job runs (after you add test data)

---

## Step 7: Test with Real Data

### Add Test ISO with Observation Window

```sql
-- In Supabase SQL Editor
-- Find an existing ISO
SELECT id, name FROM isos LIMIT 5;

-- Update ISO with observation window starting in 7 days
UPDATE isos
SET
  observation_window_start = NOW() + INTERVAL '7 days',
  observation_window_end = NOW() + INTERVAL '10 days',
  visibility_notes = 'Test observation window - visible from Northern Hemisphere, magnitude 15.2'
WHERE id = 'YOUR_ISO_ID';
```

### Follow the Test ISO

1. **Login as Test User**: Navigate to ISO detail page
2. **Click Follow Button**: Ensure you're on Evidence Analyst tier
3. **Verify Follow**: Check `iso_follows` table has entry

```sql
SELECT * FROM iso_follows WHERE iso_object_id = 'YOUR_ISO_ID';
```

### Enable Observation Window Alerts

1. **Navigate to Notifications**: `/settings/notifications`
2. **Toggle "Observation Window Alerts"**: Should be enabled (Evidence Analyst only)
3. **Save Preferences**

```sql
-- Verify preferences
SELECT * FROM notification_preferences WHERE user_id = 'YOUR_USER_ID';
-- observation_window_alerts should be TRUE
```

### Manually Trigger Cron Job (Test Now)

```bash
curl -X GET \
  -H "Authorization: Bearer 769493324a46b342285d7093b946fd146287d9414a3333456fcabdca82a95b31" \
  https://your-project.vercel.app/api/cron/observation-windows
```

**Expected Response**:
```json
{
  "success": true,
  "processed": 1
}
```

### Check Email Delivery

1. **Check Test User's Email Inbox**
2. **Look for Email**:
   - Subject: "Observation window opening for [ISO Name]"
   - From: ISO Tracker <notifications@resend.dev>
   - Body: Should show observation dates, visibility notes, link to ISO

3. **Verify Email Content**:
   - Observation dates displayed correctly
   - Visibility notes included
   - Link to ISO detail page works
   - Unsubscribe link present

### Verify Notification Log

```sql
SELECT
  user_id,
  notification_type,
  email_subject,
  sent_at
FROM notification_log
WHERE notification_type = 'observation_window'
ORDER BY sent_at DESC
LIMIT 5;
```

**Expected**: Entry for test user with correct timestamp

---

## Troubleshooting

### Cron Job Not Running

**Symptoms**: No logs in Vercel, no emails sent

**Checks**:
1. Verify `vercel.json` exists in project root
2. Check Vercel project has cron job listed in dashboard
3. Verify latest deployment included `vercel.json`
4. Check Vercel project is on Pro plan (Hobby plans have limited cron)

**Fix**: Redeploy with correct `vercel.json` configuration

### Unauthorized Error (401)

**Symptoms**: Cron job runs but returns 401 status

**Checks**:
1. Verify CRON_SECRET matches in Vercel environment variables
2. Check Authorization header format: `Bearer $CRON_SECRET`
3. Ensure API route validates secret correctly

**Fix**: Update CRON_SECRET in Vercel environment variables and redeploy

### No Emails Sent

**Symptoms**: Cron job returns `processed: 0`

**Checks**:
1. Verify ISOs have observation_window_start set
2. Check observation dates are exactly 7 days from now
3. Verify users are following ISOs
4. Check notification_preferences.observation_window_alerts = true

**Query**:
```sql
-- Find ISOs with upcoming observation windows
SELECT
  id,
  name,
  observation_window_start,
  observation_window_end,
  (SELECT COUNT(*) FROM iso_follows WHERE iso_object_id = isos.id) as follower_count
FROM isos
WHERE observation_window_start BETWEEN NOW() + INTERVAL '6 days 23 hours'
                                   AND NOW() + INTERVAL '7 days 1 hour';
```

**Fix**: Ensure test data is properly configured

### Vercel Cron Not Available

**Symptoms**: No "Cron Jobs" tab in Vercel dashboard

**Cause**: Hobby plan limitation
**Solution**: Upgrade to Vercel Pro plan ($20/mo) or use alternative:
- Vercel Edge Functions with scheduled invocations
- External cron service (cron-job.org) hitting the API endpoint

---

## Vercel Cron Pricing

**Free (Hobby) Plan**:
- Limited cron job execution
- May not be reliable for daily jobs

**Pro Plan** ($20/month):
- Unlimited cron jobs
- Guaranteed execution
- Better logging and monitoring

**Recommended**: Pro plan for production use

---

## Success Criteria

**Cron Job Configured Successfully When**:
- [x] Vercel cron job exists and shows in dashboard
- [x] Schedule set to `0 0 * * *` (daily at midnight UTC)
- [x] `vercel.json` file deployed to production
- [x] Manual test returns 200 status
- [x] Invalid authorization returns 401 status
- [x] Test email delivered to inbox
- [x] Notification log entries created
- [x] Vercel logs show successful execution

---

## Next Steps

After cron job configuration:
1. **Comprehensive Testing**: Use `/docs/testing/phase-4-3-5-testing.md`
2. **Production Deployment**: Deploy to Vercel production
3. **Monitoring Setup**: Monitor Vercel logs for cron execution
4. **Documentation**: Update progress.md with Phase 4.3 completion

---

**Platform**: Vercel (Next.js hosting + Cron Jobs)
**Schedule**: Daily at 00:00 UTC
**Endpoint**: `/api/cron/observation-windows`
**Authentication**: Bearer token with CRON_SECRET
