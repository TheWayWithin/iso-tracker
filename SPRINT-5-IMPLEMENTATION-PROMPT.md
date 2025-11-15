# Sprint 5: PWA & Polish - Implementation Prompt

**Sprint Duration**: Weeks 9-10
**Target Completion**: January 2025
**Status**: Ready to Start (Sprint 4 Complete)

---

## MISSION OBJECTIVE

Transform ISO Tracker into a production-ready Progressive Web App (PWA) with:
- App installable on iOS/Android
- Offline evidence viewing
- Page load <3s on 3G connection
- Lighthouse Performance score >90
- Analytics and error monitoring for launch

---

## PRE-IMPLEMENTATION REQUIREMENTS

### MANDATORY: Read These Files First

Before writing ANY code, you MUST read:

1. **Architecture**: `/architecture.md` (35,000+ words)
   - Understand existing patterns (CSP with nonces, RLS policies, Server Components)
   - Follow established security-first principles
   - Use existing utility patterns

2. **PRD**: `/foundation/prds/Product-Requirements-Document.md`
   - Section 5.6: Performance Requirements (<3s load, Lighthouse >90)
   - Section 5.7: Offline Requirements (7-day cache, IndexedDB)
   - Section 6.3: Launch Checklist (PWA deployment)
   - Verify all features align with stated requirements

3. **Project Plan**: `/project-plan.md`
   - Sprint 5 scope (lines 781-805)
   - Success criteria
   - Dependencies on Sprint 4

4. **Existing Codebase**: `/apps/web/` structure
   - Current Next.js 14 App Router setup
   - Existing layouts, components, and API routes
   - Supabase client patterns

5. **CLAUDE.md**: `/CLAUDE.md`
   - Critical Software Development Principles (NEVER compromise security)
   - ADHD-friendly communication protocol
   - Context preservation requirements

---

## EXISTING CODEBASE STRUCTURE

**Do NOT recreate these - they already exist:**

```
/apps/web/
├── app/
│   ├── layout.tsx           # Root layout (includes Header component)
│   ├── page.tsx             # Homepage
│   ├── dashboard/page.tsx   # User dashboard
│   ├── auth/                # Sign-in, sign-up, callback
│   ├── settings/notifications/page.tsx
│   ├── iso-objects/         # ISO list and detail pages
│   ├── guidelines/page.tsx  # Community guidelines
│   ├── admin/               # Moderation, users pages
│   └── api/                 # API routes (notifications, evidence, comments, etc.)
├── components/
│   ├── header.tsx           # Global header with user menu
│   ├── admin/AdminGuard.tsx # Admin role protection
│   └── isos/FollowButton.tsx
├── lib/
│   ├── supabase/client.ts   # Browser Supabase client
│   ├── supabase/server.ts   # Server Supabase client
│   ├── emails/              # Resend email templates
│   └── notifications/       # Notification helpers
└── public/                  # Static assets
```

**Database Tables (already exist in Supabase):**
- `profiles` - User profiles with role, subscription info
- `subscriptions` - Tier management
- `iso_objects` - Interstellar object data
- `evidence` - Evidence submissions
- `notification_preferences` - User notification settings
- `iso_follows` - Follow relationships
- `moderation_flags`, `moderation_actions` - Admin tools

---

## SPRINT 5 PHASES

### Phase 5.1: PWA Foundation (4-6 hours)
**Create Progressive Web App infrastructure**

**Files to Create:**
- `/apps/web/public/manifest.json` - PWA manifest
- `/apps/web/public/sw.js` - Service Worker (or use next-pwa)
- `/apps/web/public/icons/` - App icons (192x192, 512x512, maskable)
- Update `/apps/web/app/layout.tsx` - Add manifest link and PWA meta tags

**Requirements:**
- App name: "ISO Tracker"
- Theme color: Match existing design (check globals.css)
- Start URL: `/dashboard`
- Display: `standalone`
- Orientation: `any`
- Background color: Match existing design

**Install next-pwa** (if using):
```bash
cd apps/web
pnpm add next-pwa
```

**Update next.config.js** for PWA:
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  // existing config
})
```

**Success Criteria:**
- [ ] Install prompt appears on mobile browsers
- [ ] App launches in standalone mode when installed
- [ ] App icon appears correctly on home screen
- [ ] Splash screen displays properly

---

### Phase 5.2: Offline Caching Strategy (6-8 hours)
**Implement intelligent caching for offline access**

**Caching Strategy** (per PRD Section 5.7):
- **Static Assets**: Cache-first (CSS, JS, images)
- **API Data**: Network-first with cache fallback
- **ISO Objects**: Cache for 7 days (offline viewing)
- **Evidence**: Cache for 7 days
- **User Data**: Cache for 24 hours

**Service Worker Patterns:**

```javascript
// Cache names with versioning
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DATA_CACHE = `data-${CACHE_VERSION}`;

// Pre-cache static assets
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/offline.html',
  '/icons/icon-192x192.png',
];

// Cache API routes for offline
const API_CACHE_ROUTES = [
  '/api/iso-objects',
  '/api/evidence',
];
```

**Files to Create:**
- `/apps/web/public/offline.html` - Offline fallback page
- Update service worker for route caching

**IndexedDB for Large Data** (optional):
```typescript
// /apps/web/lib/offline/storage.ts
export const saveToOfflineStorage = async (key: string, data: any) => {
  // IndexedDB implementation for large datasets
};
```

**Success Criteria:**
- [ ] App shows cached content when offline
- [ ] "You're offline" indicator appears
- [ ] ISO objects viewable offline after initial load
- [ ] App gracefully degrades without network

---

### Phase 5.3: Performance Optimization (8-10 hours)
**Achieve <3s load time and Lighthouse >90**

**Optimization Targets** (per PRD Section 5.6):
- First Contentful Paint: <1.8s
- Time to Interactive: <3.9s
- Total Blocking Time: <200ms
- Cumulative Layout Shift: <0.1
- Largest Contentful Paint: <2.5s

**Optimizations to Implement:**

1. **Image Optimization**
   - Use `next/image` for all images
   - Implement lazy loading
   - Use WebP format with fallbacks
   - Add proper width/height to prevent CLS

2. **Bundle Optimization**
   ```typescript
   // next.config.js
   module.exports = {
     experimental: {
       optimizeCss: true,
     },
     images: {
       formats: ['image/avif', 'image/webp'],
     },
   }
   ```

3. **Code Splitting**
   - Dynamic imports for heavy components
   - Route-based code splitting (already handled by App Router)
   ```typescript
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Skeleton />,
   });
   ```

4. **React Server Components** (existing pattern)
   - Keep data fetching on server side
   - Minimize client-side JavaScript
   - Use Suspense boundaries

5. **Font Optimization**
   ```typescript
   // app/layout.tsx
   import { Inter } from 'next/font/google';
   const inter = Inter({ subsets: ['latin'], display: 'swap' });
   ```

6. **Database Query Optimization**
   - Use Supabase indexes (already in migrations)
   - Limit SELECT to required columns
   - Implement pagination for large datasets

**Measurement:**
```bash
# Run Lighthouse audit
npx lighthouse http://localhost:3001 --view
```

**Success Criteria:**
- [ ] Lighthouse Performance score >90
- [ ] Page load <3s on simulated 3G
- [ ] No layout shifts (CLS <0.1)
- [ ] All images optimized with next/image

---

### Phase 5.4: Analytics & Error Monitoring (4-6 hours)
**Set up observability for production launch**

**Analytics (PostHog or Mixpanel):**

Install:
```bash
cd apps/web
pnpm add posthog-js
```

Create provider:
```typescript
// /apps/web/lib/analytics/posthog.ts
import posthog from 'posthog-js';

export const initAnalytics = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      loaded: () => {
        if (process.env.NODE_ENV === 'development') {
          posthog.opt_out_capturing();
        }
      },
    });
  }
};

export const trackEvent = (event: string, properties?: Record<string, any>) => {
  posthog.capture(event, properties);
};
```

**Key Events to Track** (per PRD):
- `user_signup` - New user registration
- `subscription_upgrade` - Tier change
- `evidence_submit` - Evidence submission
- `iso_follow` - Follow an ISO
- `notification_toggle` - Change notification preference
- `page_view` - Track key pages (dashboard, ISO detail)

**Error Monitoring (Sentry):**

Install:
```bash
cd apps/web
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configure:
- `/apps/web/sentry.client.config.ts`
- `/apps/web/sentry.server.config.ts`
- `/apps/web/sentry.edge.config.ts`

**Environment Variables** (add to `.env.local`):
```bash
NEXT_PUBLIC_POSTHOG_KEY=<your-key>
NEXT_PUBLIC_SENTRY_DSN=<your-dsn>
SENTRY_AUTH_TOKEN=<your-token>
```

**Success Criteria:**
- [ ] Analytics captures key user events
- [ ] Errors automatically reported to Sentry
- [ ] Source maps uploaded for debugging
- [ ] No PII leaked to analytics (user IDs only)

---

### Phase 5.5: Production Deployment Preparation (4-6 hours)
**Final checks before Q4 2025 launch**

**Files to Create/Update:**

1. **Environment Configuration**
   - `/apps/web/.env.production` template
   - Verify all env vars documented

2. **Security Headers** (already have CSP, verify):
   ```typescript
   // next.config.js
   const securityHeaders = [
     {
       key: 'X-Frame-Options',
       value: 'DENY',
     },
     {
       key: 'X-Content-Type-Options',
       value: 'nosniff',
     },
     {
       key: 'Referrer-Policy',
       value: 'strict-origin-when-cross-origin',
     },
   ];
   ```

3. **robots.txt and sitemap.xml**
   - `/apps/web/public/robots.txt`
   - Dynamic sitemap generation for ISOs

4. **Error Pages**
   - `/apps/web/app/not-found.tsx` (404)
   - `/apps/web/app/error.tsx` (global error boundary)
   - `/apps/web/app/global-error.tsx` (root error boundary)

5. **Meta Tags and SEO**
   ```typescript
   // app/layout.tsx
   export const metadata: Metadata = {
     title: {
       default: 'ISO Tracker - Evidence-Based Interstellar Object Analysis',
       template: '%s | ISO Tracker',
     },
     description: 'Track and analyze interstellar objects with evidence-based methodology.',
     openGraph: {
       type: 'website',
       siteName: 'ISO Tracker',
       // ... more OG tags
     },
   };
   ```

**Vercel Configuration:**
- Review `/vercel.json` (already exists)
- Ensure cron jobs configured
- Set up custom domain (iso-tracker.app)

**Success Criteria:**
- [ ] All security headers configured
- [ ] SEO meta tags on all pages
- [ ] Error pages user-friendly
- [ ] robots.txt allows crawling
- [ ] Environment variables documented

---

## CRITICAL GUARDRAILS

### DO NOT:

1. **Remove or weaken security features**
   - Never disable CSP policies
   - Never remove RLS policies from database
   - Never skip authentication checks
   - Never expose sensitive data in client bundles

2. **Deviate from existing architecture patterns**
   - Use `createClient()` from existing lib files
   - Follow Server/Client component patterns
   - Maintain TypeScript strict mode
   - Keep existing file structure

3. **Break existing functionality**
   - Test each phase before moving to next
   - Run TypeScript checks: `pnpm exec tsc --noEmit`
   - Verify dev server runs: `pnpm dev`
   - Check for console errors

4. **Skip PRD alignment**
   - Every feature must map to PRD section
   - Performance targets are NON-NEGOTIABLE (<3s, >90 Lighthouse)
   - Offline requirements must be met (7-day cache)

5. **Ignore ADHD-friendly communication**
   - Always provide clear, numbered steps
   - Checkpoint after each phase
   - Start from current state, not assumptions

---

## FILE VERIFICATION PROTOCOL

After creating EACH file, immediately verify:

```bash
# Verify file exists
ls -la <path-to-file>

# Verify file has content
wc -l <path-to-file>

# If TypeScript, check compilation
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep <filename>
```

**NEVER mark a task complete unless:**
- File exists on disk (verified with `ls`)
- File has non-zero content (verified with `wc -l`)
- No TypeScript errors (verified with `tsc`)
- Dev server runs without crashing

---

## TESTING CHECKLIST

### Phase 5.1: PWA Foundation
- [ ] Install banner appears on Android Chrome
- [ ] Add to home screen works on iOS Safari
- [ ] App opens in standalone mode
- [ ] Icons display correctly
- [ ] manifest.json validates (no errors in DevTools)

### Phase 5.2: Offline Caching
- [ ] Turn off network in DevTools → app still loads
- [ ] ISO objects accessible offline after viewing
- [ ] Offline indicator shown to user
- [ ] Cache clears on version update
- [ ] Storage usage reasonable (<50MB)

### Phase 5.3: Performance
- [ ] Lighthouse Performance >90
- [ ] FCP <1.8s
- [ ] LCP <2.5s
- [ ] CLS <0.1
- [ ] Page loads <3s on throttled 3G

### Phase 5.4: Analytics
- [ ] PostHog receives events
- [ ] Sentry captures errors
- [ ] No PII in analytics data
- [ ] Events trigger on user actions

### Phase 5.5: Production
- [ ] Security headers present (check with securityheaders.com)
- [ ] SEO meta tags on all pages
- [ ] 404/500 pages work
- [ ] Environment vars documented
- [ ] Deployment to Vercel succeeds

---

## DOCUMENTATION REQUIREMENTS

Update these files after each phase:

1. **project-plan.md**
   - Mark completed tasks [x]
   - Add actual completion time
   - Note any deviations

2. **progress.md**
   - Log each deliverable created
   - Document any issues encountered
   - Record lessons learned

3. **handoff-notes.md**
   - Update with current state
   - List what works and what doesn't
   - Provide context for next session

4. **architecture.md** (if significant changes)
   - Document PWA architecture decisions
   - Add caching strategy details
   - Update deployment notes

---

## SUCCESS CRITERIA (Sprint 5 Complete When)

**All of these must be TRUE:**

- [ ] PWA installable on iOS and Android
- [ ] App works offline (shows cached content)
- [ ] Lighthouse Performance score >90
- [ ] Page load <3s on 3G connection
- [ ] Analytics tracking key events
- [ ] Error monitoring capturing issues
- [ ] Security headers configured
- [ ] SEO meta tags on all pages
- [ ] Error pages user-friendly
- [ ] All files verified to exist on disk
- [ ] No TypeScript errors
- [ ] Dev server runs without issues
- [ ] PRD alignment verified (Sections 5.6, 5.7, 6.3)
- [ ] project-plan.md updated
- [ ] progress.md updated

---

## ESTIMATED TIME

| Phase | Estimated | Description |
|-------|-----------|-------------|
| 5.1   | 4-6 hours | PWA Foundation |
| 5.2   | 6-8 hours | Offline Caching |
| 5.3   | 8-10 hours | Performance Optimization |
| 5.4   | 4-6 hours | Analytics & Monitoring |
| 5.5   | 4-6 hours | Production Preparation |
| **Total** | **26-36 hours** | |

---

## HOW TO USE THIS PROMPT

1. **Start a new Claude Code session** with `/clear`
2. **Run**: `/coord build SPRINT-5-IMPLEMENTATION-PROMPT.md`
3. **Or**: Provide this file directly to Claude Code
4. **Monitor**: Check that each file is created and verified
5. **Checkpoint**: After each phase, verify success criteria before proceeding
6. **Document**: Update tracking files after each phase

---

## FINAL NOTES

- **Security-first**: Never compromise security for convenience
- **PRD alignment**: Every feature maps to PRD requirements
- **Existing patterns**: Follow what's already in the codebase
- **Verify everything**: Don't trust Task tool file persistence
- **Checkpoint often**: Ask user to verify before moving forward
- **ADHD-friendly**: Clear steps, starting from current state

**Sprint 5 transforms ISO Tracker from a functional web app into a production-ready PWA optimized for the Q4 2025 launch.**

---

*This prompt was generated on 2025-01-15 after successful completion of Sprint 4 (Notification System, Admin Moderation, Community Guidelines).*
