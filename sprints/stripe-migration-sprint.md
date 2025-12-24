# Sprint: Stripe Account Migration

**Goal**: Migrate from aisearchmastery Stripe account to dedicated ISO Tracker Stripe account

**Duration**: 1-2 hours (mostly manual Stripe setup)

**Prerequisites**:
- Email address for new Stripe account (isotracker-specific)
- Business details ready for Stripe onboarding
- Bank account for payouts

---

## Overview

### What We're Migrating

| Component | Current (aisearchmastery) | New (ISO Tracker) |
|-----------|---------------------------|-------------------|
| Products | 4 price IDs | New price IDs needed |
| Webhooks | TEST + LIVE | New TEST + LIVE webhooks |
| API Keys | sk_, pk_, whsec_ | All new keys |

### Products to Recreate

| Product | Price | Stripe Price ID (Current) |
|---------|-------|---------------------------|
| Event Pass Monthly | $4.99/mo | `price_1SXqsOIiC84gpR8HysaVrxgV` |
| Event Pass Annual | $49.95/year | `price_1SXqsOIiC84gpR8HovvfZEQ5` |
| Evidence Analyst Monthly | $9.95/mo | `price_1SXqxFIiC84gpR8H7Woz8a48` |
| Evidence Analyst Annual | $79.95/year | `price_1SXqxFIiC84gpR8HRZivV2bA` |

### Files That Need Code Updates (Price IDs)

1. `apps/web/app/page.tsx` - lines 12-17
2. `apps/web/app/api/stripe/checkout/route.ts` - lines 74-77
3. `apps/web/app/api/stripe/webhook/route.ts` - lines 16-24
4. `apps/web/app/(marketing)/pricing/page.tsx` - lines 131-170

### Environment Files to Update

| File | Keys Needed |
|------|-------------|
| `.env.local` | TEST: sk_test_, pk_test_, whsec_ |
| `apps/web/.env.local` | TEST: (same as above) |
| Vercel Production | LIVE: sk_live_, pk_live_, whsec_ |
| `.env.example` | Templates only |

---

## Phase 1: Create New Stripe Account

### Task 1.1: Create Account (Manual - Jamie or Comet)

**Instructions for Comet**:
1. Go to https://dashboard.stripe.com/register
2. Create account with ISO Tracker business email
3. Business name: "ISO Tracker" or "Interstellar Object Tracker"
4. Business type: Software/SaaS
5. Complete verification steps as prompted

**Checkpoint**: Account created and dashboard accessible

### Task 1.2: Complete Business Verification

1. Add business details when prompted
2. Set up bank account for payouts (can do later if testing first)
3. Verify email address

**Checkpoint**: Account is active (not restricted)

---

## Phase 2: Create Products in Stripe

### Task 2.1: Switch to TEST Mode First

**Instructions**:
1. In Stripe dashboard, top-right corner
2. Toggle ON "Test mode" (orange banner appears)
3. All products created now will be TEST products

### Task 2.2: Create Event Pass Product

**Instructions**:
1. Go to **Products** → **Add Product**
2. Name: `Event Pass`
3. Description: `Access to basic ISO tracking features`
4. Click **Add Product**

**Add Monthly Price**:
1. Click **Add Price**
2. Pricing model: **Standard pricing**
3. Price: `$4.99`
4. Billing period: **Monthly** (Recurring)
5. Click **Add Price**
6. **COPY the price_xxxxx ID** → Record as "Event Pass Monthly TEST"

**Add Annual Price**:
1. Click **Add another price**
2. Price: `$49.95`
3. Billing period: **Yearly** (Recurring)
4. Click **Add Price**
5. **COPY the price_xxxxx ID** → Record as "Event Pass Annual TEST"

### Task 2.3: Create Evidence Analyst Product

**Instructions**:
1. Go to **Products** → **Add Product**
2. Name: `Evidence Analyst`
3. Description: `Full access to all ISO analysis features and evidence library`
4. Click **Add Product**

**Add Monthly Price**:
1. Click **Add Price**
2. Price: `$9.95`
3. Billing period: **Monthly** (Recurring)
4. Click **Add Price**
5. **COPY the price_xxxxx ID** → Record as "Evidence Analyst Monthly TEST"

**Add Annual Price**:
1. Click **Add another price**
2. Price: `$79.95`
3. Billing period: **Yearly** (Recurring)
4. Click **Add Price**
5. **COPY the price_xxxxx ID** → Record as "Evidence Analyst Annual TEST"

**Checkpoint**: 4 TEST price IDs recorded

---

## Phase 3: Create Webhooks

### Task 3.1: Create TEST Webhook

**Stay in TEST mode**:
1. Go to **Developers** → **Webhooks**
2. Click **+ Add destination**
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Click **Continue**
5. Choose **Webhook endpoint**
6. Click **Continue**
7. Destination name: `ISO Tracker`
8. Endpoint URL: `https://www.isotracker.org/api/stripe/webhook`
9. Click **Create destination**
10. **COPY the whsec_xxxxx** → Record as "Webhook Secret TEST"

### Task 3.2: Create LIVE Webhook

**Switch to LIVE mode**:
1. Toggle OFF "Test mode" (no orange banner)
2. Go to **Developers** → **Webhooks**
3. Click **+ Add destination**
4. Select same 4 events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Continue**
6. Choose **Webhook endpoint**
7. Click **Continue**
8. Destination name: `ISO Tracker`
9. Endpoint URL: `https://www.isotracker.org/api/stripe/webhook`
10. Click **Create destination**
11. **COPY the whsec_xxxxx** → Record as "Webhook Secret LIVE"

**Checkpoint**: 2 webhook secrets recorded (TEST and LIVE)

---

## Phase 4: Get API Keys

### Task 4.1: Get TEST API Keys

1. Switch to **TEST mode**
2. Go to **Developers** → **API keys**
3. Copy **Publishable key** (pk_test_...) → Record as "Publishable Key TEST"
4. Click **Reveal** on Secret key
5. Copy **Secret key** (sk_test_...) → Record as "Secret Key TEST"

### Task 4.2: Get LIVE API Keys

1. Switch to **LIVE mode**
2. Go to **Developers** → **API keys**
3. Copy **Publishable key** (pk_live_...) → Record as "Publishable Key LIVE"
4. Click **Reveal** on Secret key
5. Copy **Secret key** (sk_live_...) → Record as "Secret Key LIVE"

**Checkpoint**: 4 API keys recorded (2 TEST, 2 LIVE)

---

## Phase 5: Record All New Keys

### Master Key Record (SAVE SECURELY)

Create a secure note with ALL new keys:

```
=== ISO TRACKER STRIPE KEYS (NEW ACCOUNT) ===

--- TEST MODE ---
Publishable Key: pk_test_xxxxxxxxxxxxx
Secret Key: sk_test_xxxxxxxxxxxxx
Webhook Secret: whsec_xxxxxxxxxxxxx

Price IDs:
- Event Pass Monthly: price_xxxxxxxxxxxxx
- Event Pass Annual: price_xxxxxxxxxxxxx
- Evidence Analyst Monthly: price_xxxxxxxxxxxxx
- Evidence Analyst Annual: price_xxxxxxxxxxxxx

--- LIVE MODE ---
Publishable Key: pk_live_xxxxxxxxxxxxx
Secret Key: sk_live_xxxxxxxxxxxxx
Webhook Secret: whsec_xxxxxxxxxxxxx

Price IDs:
- Event Pass Monthly: price_xxxxxxxxxxxxx
- Event Pass Annual: price_xxxxxxxxxxxxx
- Evidence Analyst Monthly: price_xxxxxxxxxxxxx
- Evidence Analyst Annual: price_xxxxxxxxxxxxx
```

**Checkpoint**: All keys securely recorded

---

## Phase 6: Update Local Environment

### Task 6.1: Update .env.local (Root)

**Open**: `/Users/jamiewatters/DevProjects/ISOTracker/.env.local`

**Update these values with TEST keys**:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[NEW]
STRIPE_SECRET_KEY=sk_test_[NEW]
STRIPE_WEBHOOK_SECRET=whsec_[NEW_TEST]
```

### Task 6.2: Update apps/web/.env.local

**Check if this file exists and has Stripe keys - update if so**

**Checkpoint**: Local environment updated with TEST keys

---

## Phase 7: Update Vercel Environment

### Task 7.1: Update Production Keys

1. Go to https://vercel.com → ISO Tracker project
2. Settings → Environment Variables

**Update these (Production only)**:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = pk_live_[NEW]
- `STRIPE_SECRET_KEY` = sk_live_[NEW]
- `STRIPE_WEBHOOK_SECRET` = whsec_[NEW_LIVE]

**Checkpoint**: Vercel Production updated with LIVE keys

---

## Phase 8: Update Code (Price IDs)

**IMPORTANT**: This requires Claude Code to update 4 files with new price IDs.

### Files to Update

**1. apps/web/app/page.tsx** (lines 12-17):
```typescript
const PRICE_IDS = {
  event_pass: {
    monthly: 'price_[NEW_EVENT_PASS_MONTHLY_TEST]',
    annual: 'price_[NEW_EVENT_PASS_ANNUAL_TEST]',
  },
  evidence_analyst: {
    monthly: 'price_[NEW_EVIDENCE_ANALYST_MONTHLY_TEST]',
    annual: 'price_[NEW_EVIDENCE_ANALYST_ANNUAL_TEST]',
  },
}
```

**2. apps/web/app/api/stripe/checkout/route.ts** (lines 74-77):
```typescript
const VALID_PRICE_IDS = [
  'price_[NEW_EVENT_PASS_MONTHLY_TEST]',
  'price_[NEW_EVENT_PASS_ANNUAL_TEST]',
  'price_[NEW_EVIDENCE_ANALYST_MONTHLY_TEST]',
  'price_[NEW_EVIDENCE_ANALYST_ANNUAL_TEST]',
]
```

**3. apps/web/app/api/stripe/webhook/route.ts** (lines 16-24):
```typescript
const PRICE_TO_TIER: Record<string, string> = {
  'price_[NEW_EVENT_PASS_MONTHLY_TEST]': 'event_pass',
  'price_[NEW_EVENT_PASS_ANNUAL_TEST]': 'event_pass',
  'price_[NEW_EVIDENCE_ANALYST_MONTHLY_TEST]': 'evidence_analyst',
  'price_[NEW_EVIDENCE_ANALYST_ANNUAL_TEST]': 'evidence_analyst',
}
```

**4. apps/web/app/(marketing)/pricing/page.tsx** (lines 131-170):
Update both price ID locations in this file.

**Checkpoint**: All 4 files updated with new price IDs

---

## Phase 9: Deploy and Test

### Task 9.1: Redeploy to Vercel

After code changes are pushed:
1. Vercel will auto-deploy
2. Wait for deployment to complete

### Task 9.2: Test Purchase (TEST Mode)

1. Go to https://www.isotracker.org/pricing
2. Click on a subscription plan
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete purchase
5. Check:
   - Redirect works
   - Webhook received (check Stripe dashboard)
   - Subscription tier updated in database

**Checkpoint**: Test purchase successful

---

## Phase 10: Create LIVE Products (Production)

### Task 10.1: Recreate Products in LIVE Mode

**Switch to LIVE mode in Stripe** and repeat Phase 2:
- Create Event Pass (Monthly + Annual)
- Create Evidence Analyst (Monthly + Annual)
- Record all 4 LIVE price IDs

### Task 10.2: Update Code for Production

**OPTION A (Recommended)**: Use environment variables for price IDs
- Add price IDs to Vercel env vars
- Update code to read from env vars

**OPTION B**: Hardcode LIVE price IDs
- Update the 4 code files with LIVE price IDs
- This means TEST mode won't work on production

**Checkpoint**: Production ready for real payments

---

## Database Considerations

### Existing Subscriptions

**Impact**: Any existing `stripe_customer_id` and `stripe_subscription_id` in the database will be invalid (they reference the old Stripe account).

**Options**:
1. **Clear existing test data**: Delete rows in `subscriptions` table
2. **Leave orphaned**: Old records stay but don't work (won't cause errors, just won't validate)
3. **Mark as migrated**: Add a flag or note

**Recommendation**: If only test data exists, clear the subscriptions table before going live.

### No Resend Changes Needed

Resend (email) is separate from Stripe. No changes required unless you want to update email templates that mention subscriptions.

---

## Summary Checklist

- [ ] Phase 1: New Stripe account created
- [ ] Phase 2: 4 TEST products created, price IDs recorded
- [ ] Phase 3: TEST + LIVE webhooks created, secrets recorded
- [ ] Phase 4: TEST + LIVE API keys recorded
- [ ] Phase 5: All keys saved securely
- [ ] Phase 6: .env.local updated with TEST keys
- [ ] Phase 7: Vercel updated with LIVE keys
- [ ] Phase 8: Code updated with new price IDs
- [ ] Phase 9: Test purchase verified
- [ ] Phase 10: LIVE products created (when ready)

---

## Quick Reference: Old vs New IDs

| Description | OLD (aisearchmastery) | NEW (isotracker) |
|-------------|----------------------|------------------|
| Event Pass Monthly TEST | `price_1SXqsOIiC84gpR8HysaVrxgV` | `price_[TBD]` |
| Event Pass Annual TEST | `price_1SXqsOIiC84gpR8HovvfZEQ5` | `price_[TBD]` |
| Evidence Analyst Monthly TEST | `price_1SXqxFIiC84gpR8H7Woz8a48` | `price_[TBD]` |
| Evidence Analyst Annual TEST | `price_1SXqxFIiC84gpR8HRZivV2bA` | `price_[TBD]` |
