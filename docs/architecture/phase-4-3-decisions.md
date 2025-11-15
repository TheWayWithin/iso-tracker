# Phase 4.3 Email Notifications - User Decisions

**Date**: 2025-01-11
**Status**: FINALIZED - Ready for Implementation

---

## User Decisions Summary

### 1. Observation Window Alert Timing ✅
**Decision**: Option A - 7 days before window opens (single email)

**Rationale**:
- Simpler MVP (one cron check, one email type)
- Less spam risk (one touchpoint vs two)
- Cost-efficient (half the email volume)
- Future: Can add day-of reminder in Phase 5 if requested

---

### 2. Geographic Visibility Filtering ✅
**Decision**: Defer to Phase 5 - Send to all followers with visibility info in email text

**Rationale**:
- No location data required (privacy-friendly)
- Faster to ship (no geolocation logic)
- Monitor engagement metrics first
- Future: Add optional location filtering if unsubscribe rate >15%

**Email Content Strategy**:
```
Subject: Optimal observation window for 2I/Borisov

Visibility: Best viewed from Northern Hemisphere (latitudes 30°N-60°N)
Peak brightness: Magnitude +12.5 (telescope required)
```

Users self-filter based on visibility notes.

---

### 3. ISO Following Behavior ✅
**Decision**: Option B - Manual "Follow ISO" button (explicit consent)

**Rationale**:
- GDPR-compliant (explicit consent for emails)
- Lower unsubscribe rate (clear user intent)
- Industry standard (GitHub Watch, Twitter Follow)
- Clearer UX (no surprise emails)

**Implementation**:
- Button placement: ISO detail page header (`/isos/[id]`)
- Stores record in `iso_follows` table
- Toggle state: "Follow ISO" → "Following ✓"

---

### 4. Observation Window Data Source ✅
**Decision**: Option A - Manual admin entry

**Rationale**:
- Fast to ship (2 hours vs 12-20 hours for automation)
- Only 2 known ISOs exist ('Oumuamua, Borisov)
- New ISOs discovered ~1 per year (manual is sustainable)
- Future: Migrate to NASA API automation if 5+ ISOs exist

**Database Schema**:
```sql
ALTER TABLE isos
  ADD COLUMN observation_window_start TIMESTAMPTZ,
  ADD COLUMN observation_window_end TIMESTAMPTZ,
  ADD COLUMN visibility_notes TEXT;
```

Admin can edit these fields via simple form.

---

### 5. Notification History UI ✅
**Decision**: Option B - Just preferences page (no history view)

**Rationale**:
- Core functionality: Preferences needed NOW, history is nice-to-have
- Time savings: 4 hours better spent on testing/polish
- Low expected usage (Gmail shows history anyway)
- Future: Easy to add later if users request

**MVP Scope**:
- Build: `/settings/notifications` (toggle switches for 3 types)
- Defer: `/settings/notifications/history` (to Phase 5+)
- Note: History data still logged in database (for rate limiting)

---

## Implementation Changes from Original Architecture

### Database Schema Additions
```sql
-- Add observation window fields to isos table
ALTER TABLE isos
  ADD COLUMN observation_window_start TIMESTAMPTZ,
  ADD COLUMN observation_window_end TIMESTAMPTZ,
  ADD COLUMN visibility_notes TEXT;

-- Index for cron job queries
CREATE INDEX idx_isos_observation_window
  ON isos(observation_window_start)
  WHERE observation_window_start IS NOT NULL;
```

### Cron Job Logic
```typescript
// Query ISOs with observation windows starting in 7 days
const targetDate = addDays(new Date(), 7);

const { data: upcomingWindows } = await supabase
  .from('isos')
  .select('id, name, observation_window_start, observation_window_end, visibility_notes')
  .gte('observation_window_start', startOfDay(targetDate))
  .lte('observation_window_start', endOfDay(targetDate))
  .not('observation_window_start', 'is', null);
```

### Email Template Content
```tsx
// Observation Window Alert Email
<Text>
  {isoName} will be in its optimal observation window from {formatDate(windowStart)} to {formatDate(windowEnd)}.
</Text>

<Text style={styles.visibilityNote}>
  Visibility: {visibilityNotes}
</Text>

<Button href={`https://isotracker.com/isos/${isoId}`}>
  View Detailed Ephemeris Data
</Button>
```

### UI Components Required
1. **Follow ISO Button** (`/components/isos/FollowButton.tsx`):
   - Placement: ISO detail page header
   - States: "Follow ISO", "Following ✓", Loading
   - Paywall: Evidence Analyst tier required

2. **Notification Preferences Page** (`/app/settings/notifications/page.tsx`):
   - 3 toggle switches (reply, evidence, observation)
   - Tier badges (Event Pass+ or Evidence Analyst only)
   - Save button with success toast

3. **No History Page** (deferred to Phase 5)

---

## PRD Alignment Checklist

✅ **Reply Notifications**: Email when someone replies to your comment (Event Pass+)
✅ **Evidence Notifications**: Email when new evidence submitted for followed ISOs (Evidence Analyst)
✅ **Observation Window Alerts**: Email 7 days before observation window (Evidence Analyst)
✅ **Tier-Gated**: Event Pass gets reply only, Evidence Analyst gets all
✅ **Rate Limiting**: Max 5 emails/user/day (prevents spam)
✅ **Unsubscribe**: One-click unsubscribe link in all emails (GDPR)
✅ **<5min Latency**: Reply/evidence notifications send immediately
✅ **GDPR Compliant**: Explicit consent (Follow button), unsubscribe, 90-day data retention

---

## Scope Confirmed (What's IN vs OUT)

### ✅ IN SCOPE (Phase 4.3 MVP)
- 3 notification types (reply, evidence, observation)
- Tier validation (Event Pass vs Evidence Analyst)
- Rate limiting (5/day)
- Resend integration
- React Email templates (3 types)
- Follow ISO button (manual, explicit)
- Preferences page (toggle switches)
- Unsubscribe tokens (JWT)
- Observation window manual entry
- 7-day advance alert (single email)

### ❌ OUT OF SCOPE (Deferred to Phase 5+)
- Notification history page
- Geographic visibility filtering (location-based)
- Day-of observation window reminder
- NASA API automation
- Digest emails (weekly summary)
- Push notifications (web/mobile)
- SMS notifications
- Slack/Discord integrations
- Email customization (HTML vs plain text preference)

---

## Risk Mitigation

**Risk**: Observation window alerts irrelevant to users in wrong hemisphere
**Mitigation**: Include visibility notes in email, monitor unsubscribe rate, add location filtering if >15%

**Risk**: Users forget they're following ISOs
**Mitigation**: Unsubscribe link in every email, clear "Following" indicator on ISO page

**Risk**: Manual observation window entry is error-prone
**Mitigation**: Simple admin form with date validation, can migrate to API later

**Risk**: Rate limiting too restrictive (5/day)
**Mitigation**: Monitor `notification_log` for users hitting limit, adjust if needed

---

## Success Metrics (Post-Launch)

**Email Deliverability**:
- Target: >95% delivery rate (non-bounce)
- Monitor: Resend dashboard

**User Engagement**:
- Target: >40% email open rate
- Target: >15% click-through rate

**Unsubscribe Rate**:
- Target: <10% unsubscribe rate
- Trigger: If >15%, add location filtering

**Rate Limiting**:
- Target: <1% of users hitting daily limit
- Monitor: Weekly SQL query on `notification_log`

---

**END OF DECISIONS DOCUMENT**
