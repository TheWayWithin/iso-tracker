# Handoff Notes - Sprint 9: Landing Page Alignment

**Mission**: Realign isotracker.org and 3i-atlas.live landing pages with brand strategy
**Status**: 🔵 DESIGN COMPLETE - READY FOR DEVELOPMENT
**Date**: 2025-11-22

---

## Context: What's Happening

### Problem (From Landing Page Review)
The current isotracker.org homepage has:
- ❌ Academic positioning ("Evidence-Based Analysis") instead of wonder-driven ("Track Interstellar Visitors")
- ❌ Wrong pricing tiers (3-tier with wrong names vs. 4-tier with correct names)
- ❌ 3i-atlas.live redirects to isotracker.org instead of being standalone email capture

### Good News
The current isotracker.org homepage is **already 80% aligned** - most changes are copy refinements, not structural rewrites.

---

## DESIGN SPECIFICATIONS (COMPLETE)

### Part 1: isotracker.org Updates

#### Hero Section Changes

**Current Headline:**
"Track Interstellar Visitors in Real-Time"

**New Headline:**
"Are We Alone? Track the Answer."

**Current Subheadline:**
"Join thousands of observers tracking mysterious objects from beyond our solar system. Are we alone? The evidence is in the sky."

**New Subheadline:**
"Something is passing through our solar system. Thousands are already watching. Join them."

**Add Star Field Background:**
Add this CSS to `apps/web/app/globals.css`:

```css
.star-field {
  background-image:
    radial-gradient(2px 2px at 20px 30px, rgba(245, 247, 250, 0.15), transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(245, 247, 250, 0.1), transparent),
    radial-gradient(1px 1px at 90px 40px, rgba(245, 247, 250, 0.2), transparent),
    radial-gradient(2px 2px at 160px 120px, rgba(245, 247, 250, 0.12), transparent),
    radial-gradient(1px 1px at 230px 80px, rgba(245, 247, 250, 0.18), transparent);
  background-repeat: repeat;
  background-size: 250px 200px;
  pointer-events: none;
}
```

Then add to hero section:
```jsx
<div className="absolute inset-0 star-field opacity-60" />
```

#### Value Prop Card Copy Updates

**Card 1 - Live Sky Tracking:**
- Current: "Watch interstellar objects cross your sky in real-time with precision position data."
- New: "Watch interstellar visitors cross your sky. Real-time positions, updated every minute."

**Card 2 - Observation Planning:**
- Current: "Know exactly when and where to look. Get alerts for optimal viewing from your location."
- New: "Know exactly when and where to look tonight. Custom alerts for optimal viewing from your location."

**Card 3 - Community Debate:**
- Current: "Cast your vote: alien or natural? Join the discussion with evidence-based analysis."
- New: "Cast your vote: alien or natural? Join 12,000+ observers analyzing the evidence together."

#### 3I/ATLAS Section Enhancement

Add live data preview after the subheadline (optional enhancement):

```jsx
<div className="flex flex-wrap justify-center gap-6 mt-6 mb-8">
  <div className="flex items-center gap-2">
    <span className="text-2xl font-mono font-bold text-[#FFB84D]">2.3</span>
    <span className="text-sm text-[#94A3B8]">AU from Earth</span>
  </div>
  <div className="flex items-center gap-2">
    <span className="text-2xl font-mono font-bold text-[#FFB84D]">15.2</span>
    <span className="text-sm text-[#94A3B8]">km/s velocity</span>
  </div>
  <div className="flex items-center gap-2">
    <span className="text-2xl font-mono font-bold text-[#10B981]">847</span>
    <span className="text-sm text-[#94A3B8]">observers tracking</span>
  </div>
</div>
```

---

### Part 2: 3i-atlas.live Standalone Page (NEW)

Create new file: `apps/web/app/atlas-landing/page.tsx`

This will be a standalone email capture page that can be deployed to 3i-atlas.live domain.

#### Page Structure

```jsx
export default function AtlasLanding() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0A1628] via-[#0D1B2A] to-[#0A1628] relative overflow-hidden">
      {/* Star field overlay */}
      <div className="absolute inset-0 star-field opacity-50 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 text-center">
        {/* Urgency Badge */}
        <div className="inline-flex items-center gap-2 bg-[#FFB84D]/20 border border-[#FFB84D]/50 rounded-full px-6 py-2 mb-8 relative">
          <span className="w-3 h-3 bg-[#FFB84D] rounded-full animate-ping opacity-75 absolute" />
          <span className="w-3 h-3 bg-[#FFB84D] rounded-full relative" />
          <span className="text-sm font-bold text-[#FFB84D] uppercase tracking-widest ml-1">Approaching Now</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-[#F5F7FA] font-['Space_Grotesk'] tracking-tight mb-6">
          <span className="text-[#FFB84D]">3I/ATLAS</span>
          <br />
          Is Coming
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-[#CBD5E1] mb-10 max-w-md mx-auto leading-relaxed">
          The third known interstellar visitor is entering our solar system.
          <span className="text-[#F5F7FA] font-medium"> Be first to track it.</span>
        </p>

        {/* Email Form */}
        <form className="w-full max-w-md mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-[#0A1628]/80 border border-[#2E5BFF]/30 rounded-lg px-4 py-4 text-[#F5F7FA] placeholder-[#64748B] focus:border-[#2E5BFF] focus:outline-none focus:ring-2 focus:ring-[#2E5BFF]/20 text-base min-h-[48px]"
              required
              aria-label="Email address"
            />
            <button
              type="submit"
              className="bg-[#FFB84D] hover:bg-[#FFC978] text-[#0A1628] font-semibold px-8 py-4 rounded-lg min-h-[48px] transition-all duration-200 shadow-[0_4px_16px_rgba(255,184,77,0.3)] hover:shadow-[0_6px_20px_rgba(255,184,77,0.4)] whitespace-nowrap"
            >
              Notify Me
            </button>
          </div>
        </form>

        {/* Social Proof */}
        <p className="text-sm text-[#64748B] mb-12">
          Join <span className="text-[#F5F7FA] font-medium">12,000+</span> observers waiting for launch
        </p>

        {/* Explainer Section */}
        <div className="border-t border-[#2E5BFF]/10 pt-12 max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-[#F5F7FA] mb-4 font-['Space_Grotesk']">
            What is 3I/ATLAS?
          </h2>
          <p className="text-[#94A3B8] mb-6 leading-relaxed">
            3I/ATLAS is the third confirmed interstellar object detected in our solar system -
            an object from another star system passing through our cosmic neighborhood.
            Our platform lets you track its journey in real-time.
          </p>
          <a
            href="https://isotracker.org"
            className="inline-flex items-center gap-2 text-[#2E5BFF] hover:text-[#4B73FF] font-medium transition-colors"
          >
            Learn more at isotracker.org
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-[#2E5BFF]/10 text-center w-full">
          <p className="text-xs text-[#64748B]">
            2025 ISO Tracker. Democratizing the search for interstellar visitors.
          </p>
        </footer>
      </div>
    </main>
  );
}
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: isotracker.org Updates

File: `apps/web/app/page.tsx`

- [ ] Update hero H1 to "Are We Alone? Track the Answer."
- [ ] Update hero subheadline to new copy
- [ ] Add star field CSS to `globals.css`
- [ ] Add star field div overlay to hero section
- [ ] Update Card 1 description (Live Sky Tracking)
- [ ] Update Card 2 description (Observation Planning)
- [ ] Update Card 3 description (Community Debate)
- [ ] (Optional) Add live data preview to 3I/ATLAS section

### Phase 2: 3i-atlas.live New Page

File: `apps/web/app/atlas-landing/page.tsx`

- [ ] Create new file with full page component
- [ ] Ensure star field CSS is in globals.css
- [ ] Test on mobile (375px)
- [ ] Verify email form styling
- [ ] Test link to isotracker.org

---

## CRITICAL REQUIREMENTS

### Brand Colors
- Cosmic Deep Blue: #0A1628 (backgrounds)
- Starlight White: #F5F7FA (primary text)
- Soft White: #CBD5E1 (subheadlines)
- Nebula Blue: #2E5BFF (CTAs, interactive)
- Trajectory Gold: #FFB84D (urgency, 3I/ATLAS)
- Signal Green: #10B981 (live indicators)
- Asteroid Grey: #64748B (secondary text)
- Steel Grey: #94A3B8 (card body text)

### Typography
- Headlines: Space Grotesk Bold (font-['Space_Grotesk'])
- Body: Inter (default)
- Data: JetBrains Mono (font-mono)

### Accessibility
- Touch targets: 44x44px minimum (min-h-[44px] min-w-[44px])
- Contrast: WCAG AAA 7:1 minimum
- Focus states: visible outline

---

## NOTES FOR DEVELOPER

1. **isotracker.org is mostly aligned** - Don't over-engineer. Changes are mostly copy updates.

2. **Star field is CSS-only** - No JavaScript needed. Uses pointer-events: none.

3. **Email form backend** - For MVP, form can just be styled. Backend integration (Supabase table or ConvertKit) can be Phase 3.

4. **3i-atlas.live deployment** - The atlas-landing page can be accessed at /atlas-landing for testing. Actual domain routing handled by Vercel/DNS configuration later.

---

## NEXT STEPS

1. Developer implements isotracker.org homepage updates
2. Developer creates 3i-atlas.live page
3. Tester validates WCAG AAA compliance
4. Operator handles domain configuration (if needed)

---

*Designer handoff complete. Ready for developer implementation.*
*Date: 2025-11-22*
