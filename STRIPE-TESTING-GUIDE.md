# Stripe Testing Guide - ISO Tracker

**Purpose**: This guide walks you through testing the Stripe checkout flow step-by-step.

## Before You Start

**What we're doing**: Testing that users can subscribe to Event Pass and Evidence Analyst tiers using Stripe.

**Why it matters**: We need to verify the payment flow works correctly before deploying to production.

---

## Setup (One-Time)

**Where you are now**: At your terminal

**Steps**:
1. Open your terminal app
2. Type: `cd /Users/jamiewatters/DevProjects/ISOTracker/apps/web`
3. Press Enter
4. Type: `npm run dev`
5. Press Enter
6. Wait for "Local: http://localhost:3000" to appear

**Checkpoint**: Do you see "Local: http://localhost:3000" in your terminal? If yes, continue. If no, check for error messages.

---

## Test 1: View Pricing Page

**What we're doing**: Checking that the pricing page loads correctly.

**Where you are now**: Terminal is running the dev server.

**Steps**:
1. Open your web browser (Chrome, Safari, etc.)
2. Type in the address bar: `http://localhost:3000/pricing`
3. Press Enter

**Expected Result**: You should see:
- 3 pricing cards (Free, Event Pass, Evidence Analyst)
- A toggle switch labeled "Monthly / Annual"
- Social proof stats at the bottom (3 papers, 15+ universities, 98% retention)

**Checkpoint**: Do you see all 3 pricing cards? Ready to continue?

---

## Test 2: Toggle Billing Period

**What we're doing**: Verifying the Monthly/Annual toggle changes prices.

**Where you are now**: On the pricing page (http://localhost:3000/pricing)

**Steps**:
1. Look for the toggle switch near the top (between "Monthly" and "Annual")
2. Click the toggle switch
3. Watch the prices change

**Expected Result**:
- When "Monthly" is selected: Event Pass shows $4.99/month, Evidence Analyst shows $9.95/month
- When "Annual" is selected: Event Pass shows $49.95/year, Evidence Analyst shows $79.95/year
- Annual plans show "Save X%" badges

**Checkpoint**: Did the prices change when you clicked the toggle? If yes, continue.

---

## Test 3: Free Tier Signup (Not Logged In)

**What we're doing**: Testing that the "Get Started Free" button works.

**Where you are now**: On the pricing page.

**Steps**:
1. Find the "Free" pricing card (leftmost card)
2. Click the "Get Started Free" button
3. Note where it takes you

**Expected Result**: You should be redirected to `/auth/sign-up` (the signup page).

**Checkpoint**: Did you land on the signup page? If yes, go back to the pricing page and continue.

---

## Test 4: Paid Tier Checkout (Not Logged In)

**What we're doing**: Testing that clicking a paid plan button redirects to login.

**Where you are now**: On the pricing page (http://localhost:3000/pricing).

**Steps**:
1. Find the "Event Pass" pricing card (middle card)
2. Click the "Start Analyzing Events" button
3. Note where it takes you

**Expected Result**: You should be redirected to the sign-in page with a message like "You must sign in to subscribe."

**Checkpoint**: Did you land on the sign-in page? If yes, continue.

---

## Test 5: Sign In with Existing Account

**What we're doing**: Logging in so we can test the checkout flow.

**Where you are now**: On the sign-in page.

**Steps**:
1. Enter your test account email and password
2. Click "Sign In"
3. Wait for redirect

**Expected Result**: You should be redirected to `/dashboard` after signing in.

**Checkpoint**: Are you logged in and on the dashboard? If yes, continue to the next test.

---

## Test 6: Event Pass Monthly Checkout

**What we're doing**: Testing the complete checkout flow for Event Pass Monthly.

**Where you are now**: Logged in, anywhere on the site.

**Steps**:
1. Go to http://localhost:3000/pricing in your browser
2. Make sure the "Monthly" toggle is selected
3. Find the "Event Pass" card
4. Click "Start Analyzing Events"
5. **Wait for Stripe's checkout page to load** (this may take 3-5 seconds)

**Expected Result**: You should see:
- Stripe's hosted checkout page (not ISO Tracker's design)
- Product: Event Pass
- Price: $4.99/month
- Your email pre-filled in the email field

**Checkpoint**: Did Stripe's checkout page load? Do you see the correct price? If yes, continue.

---

## Test 7: Complete Test Payment (Event Pass Monthly)

**What we're doing**: Completing a test payment using Stripe's test card.

**Where you are now**: On Stripe's checkout page for Event Pass Monthly.

**Steps**:
1. **Card number field**: Type `4242 4242 4242 4242`
2. **Expiry date field**: Type any future date (e.g., `12/25`)
3. **CVC field**: Type any 3 digits (e.g., `123`)
4. **Name field**: Type any name (e.g., "Test User")
5. **Postal code**: Type any postal code (e.g., "90210")
6. Click the "Subscribe" button at the bottom
7. Wait for redirect

**Expected Result**: You should be redirected to `/upgrade/success` with:
- A green checkmark icon
- "Welcome to Evidence-Based ISO Analysis" heading
- List of what you can do now
- Buttons: "Explore Your First ISO" and "Manage Subscription"

**Checkpoint**: Did you land on the success page? If yes, great! Continue to test other plans.

---

## Test 8: Event Pass Annual Checkout

**What we're doing**: Testing Event Pass Annual plan.

**Steps**:
1. Go back to http://localhost:3000/pricing
2. Toggle to "Annual"
3. Click "Start Analyzing Events" on Event Pass card
4. On Stripe checkout page, verify:
   - Price shows $49.95/year
   - "Save 17%" badge is visible
5. Use test card `4242 4242 4242 4242` to complete payment
6. Verify success page loads

**Checkpoint**: Did the annual plan work? If yes, continue.

---

## Test 9: Evidence Analyst Monthly Checkout

**What we're doing**: Testing Evidence Analyst Monthly plan.

**Steps**:
1. Go back to http://localhost:3000/pricing
2. Toggle to "Monthly"
3. Click "Become an Analyst" on Evidence Analyst card
4. On Stripe checkout page, verify:
   - Price shows $9.95/month
   - "Recommended" badge was visible on pricing page
5. Use test card `4242 4242 4242 4242` to complete payment
6. Verify success page loads

**Checkpoint**: Did the Evidence Analyst monthly plan work? If yes, continue.

---

## Test 10: Evidence Analyst Annual Checkout

**What we're doing**: Testing Evidence Analyst Annual plan.

**Steps**:
1. Go back to http://localhost:3000/pricing
2. Toggle to "Annual"
3. Click "Become an Analyst" on Evidence Analyst card
4. On Stripe checkout page, verify:
   - Price shows $79.95/year
   - "Save 33%" badge is visible
5. Use test card `4242 4242 4242 4242` to complete payment
6. Verify success page loads

**Checkpoint**: Did the Evidence Analyst annual plan work? If yes, you've completed all tests!

---

## Test 11: Declined Card

**What we're doing**: Testing error handling when a card is declined.

**Steps**:
1. Go to http://localhost:3000/pricing
2. Click any paid plan button
3. On Stripe checkout page, use this test card: `4000 0000 0000 0002`
4. Complete other fields with any data
5. Click "Subscribe"

**Expected Result**: Stripe should show an error message: "Your card was declined."

**Checkpoint**: Did you see the declined error? If yes, test complete.

---

## Test 12: Marketing Physics Elements Check

**What we're doing**: Verifying Marketing Physics principles are visible.

**Steps**:
1. Go to http://localhost:3000/pricing
2. Look for these specific elements:

**Event Pass Card**:
- [ ] Headline mentions "Auto-Pauses Between Events"
- [ ] Features mention "30+ scientists"
- [ ] Features mention "60-second analysis summaries"
- [ ] Trust signal: "30-day money-back guarantee • Cancel anytime"

**Evidence Analyst Card**:
- [ ] Headline mentions "Permanent Record in Scientific History"
- [ ] Features mention "3 peer-reviewed papers"
- [ ] Features mention "15+ universities"
- [ ] "Recommended" badge visible
- [ ] Save percentage badge visible for annual

**Social Proof Section**:
- [ ] "3 peer-reviewed papers" stat visible
- [ ] "15+ universities" stat visible
- [ ] "98% retention" stat visible

**Checkpoint**: Did you see all Marketing Physics elements? If yes, testing complete!

---

## Common Issues

### Issue: "Failed to create checkout session"
- **Fix**: Check that STRIPE_SECRET_KEY is set in `.env.local`
- **Fix**: Make sure you're logged in before clicking paid plan buttons

### Issue: "Invalid price ID"
- **Fix**: Verify all 4 price IDs are set in `.env.local`
- **Fix**: Check that price IDs match exactly what's in Stripe Dashboard

### Issue: Checkout page doesn't load
- **Fix**: Check browser console for errors (press F12)
- **Fix**: Verify internet connection (Stripe checkout requires internet)

### Issue: Success page doesn't show after payment
- **Fix**: Check that `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`
- **Fix**: Verify success page exists at `apps/web/app/(marketing)/upgrade/success/page.tsx`

---

## What to Do After Testing

**If all tests passed**:
1. Take screenshots of the success page for documentation
2. Report back: "All Stripe tests passed ✅"
3. Ready to proceed to Phase 14.3 (Webhook implementation)

**If any tests failed**:
1. Note which test failed
2. Note the exact error message
3. Take a screenshot of the error
4. Report back with details so we can fix it

---

**Testing Complete!** 🎉

You've now verified that:
- All 4 pricing plans work (Event Pass Monthly/Annual, Evidence Analyst Monthly/Annual)
- Login is required before checkout
- Marketing Physics elements are visible
- Error handling works (declined cards)
- Success page displays correctly
