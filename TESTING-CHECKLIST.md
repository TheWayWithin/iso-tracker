# Stripe Checkout Testing Checklist

Quick checklist format for testing all scenarios.

## Pre-Test Setup
- [ ] Dev server running (`npm run dev` in `apps/web`)
- [ ] Browser open to `http://localhost:3000/pricing`
- [ ] Have Stripe test card ready: `4242 4242 4242 4242`

---

## Test Cases

### 1. Pricing Page Display
- [ ] All 3 cards visible (Free, Event Pass, Evidence Analyst)
- [ ] Monthly/Annual toggle present
- [ ] Social proof stats visible (3 papers, 15+ universities, 98% retention)

### 2. Billing Toggle Functionality
- [ ] Toggle switches between Monthly and Annual
- [ ] Prices update correctly when toggling
- [ ] Annual shows "Save X%" badges

### 3. Free Tier (Not Logged In)
- [ ] "Get Started Free" button redirects to `/auth/sign-up`

### 4. Paid Tier (Not Logged In)
- [ ] Clicking paid plan button redirects to sign-in page
- [ ] Shows message about needing to sign in

### 5. Event Pass Monthly (Logged In)
- [ ] Button click opens Stripe checkout
- [ ] Price shows $4.99/month
- [ ] Email pre-filled
- [ ] Test card `4242 4242 4242 4242` completes payment
- [ ] Redirects to `/upgrade/success`

### 6. Event Pass Annual (Logged In)
- [ ] Button click opens Stripe checkout
- [ ] Price shows $49.95/year
- [ ] "Save 17%" visible on pricing page
- [ ] Test card completes payment
- [ ] Redirects to success page

### 7. Evidence Analyst Monthly (Logged In)
- [ ] "Recommended" badge visible on pricing page
- [ ] Button click opens Stripe checkout
- [ ] Price shows $9.95/month
- [ ] Test card completes payment
- [ ] Redirects to success page

### 8. Evidence Analyst Annual (Logged In)
- [ ] "Recommended" badge visible
- [ ] "Save 33%" badge visible
- [ ] Button click opens Stripe checkout
- [ ] Price shows $79.95/year
- [ ] Test card completes payment
- [ ] Redirects to success page

### 9. Declined Card Handling
- [ ] Use test card `4000 0000 0000 0002`
- [ ] Stripe shows "Your card was declined" error
- [ ] User remains on checkout page to retry

### 10. Marketing Physics Elements
- [ ] Event Pass headline mentions auto-pause
- [ ] Event Pass features mention "30+ scientists" and "60 seconds"
- [ ] Evidence Analyst headline mentions "Permanent Record"
- [ ] Evidence Analyst features mention "3 papers" and "15+ universities"
- [ ] All paid cards show "30-day money-back guarantee • Cancel anytime"
- [ ] Social proof section complete

---

## Post-Test Actions
- [ ] All tests passed
- [ ] Screenshots taken of success page
- [ ] Any failures documented with error messages
- [ ] Ready to proceed to Phase 14.3 or report issues
