# Handoff Notes - Sprint 14: Stripe Payments

**Mission**: Complete Stripe subscription integration for ISO Tracker
**Status**: 🔵 Phase 14.3 READY - Webhook Handler
**Date**: 2025-12-19

---

## Context: Current State

### What's Complete (Phase 14.1 + 14.2)
- ✅ Stripe TEST products created (4 price IDs)
- ✅ `/api/stripe/checkout` endpoint working
- ✅ Success/cancel pages functional
- ✅ `AuthModal` component with email/password + Google OAuth button
- ✅ Landing page pricing buttons wired to auth-first flow
- ✅ Post-auth redirect to Stripe checkout

### Known Issues
- ⚠️ **Hardcoded Stripe keys**: `apps/web/app/api/stripe/checkout/route.ts` line 10 has hardcoded TEST key
- ⚠️ **Env vars not loading**: Next.js not loading `.env.local` correctly in monorepo
- ⚠️ **Google OAuth**: Provider needs enabling in Supabase dashboard

---

## Next Up: Phase 14.3 - Webhook Handler

### Goal
Create `/api/stripe/webhook` to process Stripe subscription events and update database.

### Required Events to Handle
1. `checkout.session.completed` → Create/update subscription record
2. `customer.subscription.updated` → Update tier on plan change
3. `customer.subscription.deleted` → Downgrade to free tier
4. `invoice.payment_failed` → Flag for follow-up

### Database Context
- `subscriptions` table exists with: `user_id`, `tier`, `status`, `stripe_customer_id`
- May need to add: `stripe_subscription_id`, `current_period_end`, `billing_interval`

### Critical Requirements
- Must verify Stripe webhook signature (security)
- Must be idempotent (same event may be sent multiple times)
- Must handle TEST vs LIVE mode appropriately

---

## After Phase 14.3: Phase 14.4 - Subscription Management

### Goal
Allow users to manage their subscriptions via Stripe Customer Portal.

### Required
- `/settings/subscription` page showing current tier
- `/api/stripe/portal` endpoint to generate portal session
- Display billing date, tier, and manage button

---

## File Locations

### Stripe Integration
- Checkout: `apps/web/app/api/stripe/checkout/route.ts`
- Webhook: `apps/web/app/api/stripe/webhook/route.ts` (TO CREATE)
- Portal: `apps/web/app/api/stripe/portal/route.ts` (TO CREATE)

### Auth Components
- AuthModal: `apps/web/components/auth/AuthModal.tsx`
- Auth actions: `apps/web/app/auth/actions.ts`
- OAuth callback: `apps/web/app/auth/callback/route.ts`

### Database
- Supabase client: `apps/web/lib/supabase/`
- Migrations: `supabase/migrations/`

---

*Ready for Phase 14.3 implementation.*
*Updated: 2025-12-19*
