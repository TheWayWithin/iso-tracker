# ISO Tracker Icon & Image Design Brief

**Project**: ISO Tracker - Interstellar Object Analysis Platform
**Purpose**: PWA icons, favicon, and social sharing assets
**Brand Alignment**: `foundation/brand-style-guide.md`
**Date**: 2025-11-16

---

## BRAND IDENTITY SUMMARY

**Tagline**: "Track interstellar visitors. Decide if we're alone."

**Core Concept**: Scientific rigor meets cosmic wonder. Evidence-based analysis of interstellar objects.

**Visual Identity**:
- Stylized orbital trajectory with tracking elements
- Geometric precision
- Technical yet accessible
- Space aesthetic with scientific credibility

---

## REQUIRED ASSETS

### 1. APP ICON (Primary Logo Mark)

**Concept**: A stylized orbital trajectory with tracking elements. Should convey:
- Interstellar journey (object path through space)
- Tracking precision (measurement/analysis)
- Cosmic scale (vastness of space)

**Design Direction**:
- Geometric, clean lines
- Orbital path/trajectory as primary element
- Possible elements: curved path, tracking nodes, star/cosmic backdrop
- NOT a literal planet or rocket - more abstract/scientific

---

### ICON-192x192.PNG
- **Dimensions**: 192 x 192 pixels
- **Format**: PNG-24
- **File Size Target**: <50KB (optimize for mobile)
- **Background**: Solid Cosmic Deep Blue (#0A1628)
- **Icon Color**: Nebula Blue (#2E5BFF) with Trajectory Gold (#FFB84D) accents
- **Usage**: PWA manifest, Android home screen, Chrome install prompt
- **Safe Zone**: Keep main design within center 160px (16px margin all sides)
- **Corner Radius**: 0px (OS applies masking)

---

### ICON-512x512.PNG
- **Dimensions**: 512 x 512 pixels
- **Format**: PNG-24
- **File Size Target**: <100KB (optimize for performance)
- **Background**: Solid Cosmic Deep Blue (#0A1628)
- **Icon Color**: Nebula Blue (#2E5BFF) with Trajectory Gold (#FFB84D) accents
- **Usage**: PWA splash screen, high-res displays, app store listings
- **Safe Zone**: Keep main design within center 430px (41px margin all sides)
- **Corner Radius**: 0px (OS applies masking)
- **Note**: Same design as 192px, scaled up with crisp lines

---

### FAVICON.ICO
- **Dimensions**: 32 x 32 pixels (multi-size ICO also acceptable: 16x16, 32x32, 48x48)
- **Format**: ICO (or PNG that converts to ICO)
- **File Size Target**: <10KB
- **Background**: Transparent OR Cosmic Deep Blue (#0A1628)
- **Icon Color**: High contrast - Starlight White (#F5F7FA) or Nebula Blue (#2E5BFF)
- **Usage**: Browser tab icon, bookmarks bar
- **Design**: SIMPLIFIED version of app icon
  - At 32x32, detail is lost - use bold, recognizable shape
  - Could be: Single orbital curve + tracking dot
  - Must be legible on both light and dark browser themes
- **Recommendation**: Transparent background with white icon for maximum compatibility

---

### APPLE-TOUCH-ICON.PNG (Bonus - recommended)
- **Dimensions**: 180 x 180 pixels
- **Format**: PNG-24
- **File Size Target**: <30KB
- **Background**: Solid Cosmic Deep Blue (#0A1628) - NO transparency
- **Usage**: iOS home screen, Safari bookmarks
- **Corner Radius**: 0px (iOS applies 17.5% radius automatically)
- **Safe Zone**: Keep design within center 150px
- **Note**: Apple requires solid background, no transparency

---

### OG-IMAGE.PNG (Open Graph / Social Sharing)
- **Dimensions**: 1200 x 630 pixels
- **Format**: PNG-24 or high-quality JPEG
- **File Size Target**: <300KB (per brand guidelines)
- **Background**: Gradient or solid Cosmic Deep Blue (#0A1628) to darker
- **Usage**: Twitter/X cards, Facebook shares, LinkedIn posts, iMessage previews

**Design Composition**:
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     [ISO TRACKER LOGO]                             │
│     Interstellar Object Analysis Platform          │
│                                                     │
│     "Track interstellar visitors.                  │
│      Decide if we're alone."                       │
│                                                     │
│     [Subtle orbital trajectory graphic]            │
│     [Star field background effect]                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Text Requirements**:
- Logo/Brand Name: Space Grotesk Bold, large (60-80px)
- Tagline: Inter Medium, readable (24-32px)
- Color: Starlight White (#F5F7FA) on dark background
- Text should be readable at thumbnail sizes (small social previews)

**Visual Elements**:
- Orbital trajectory paths (Trajectory Gold #FFB84D)
- Subtle star field (small dots, 10-20% opacity)
- Clean, professional, scientific aesthetic
- Avoid clutter - focus on brand recognition

**Safe Zones**:
- Facebook crops to 1.91:1 ratio (already correct)
- Twitter shows ~506x254px preview (text must be readable when scaled down)
- Keep critical content in center 1000x500px area

---

## COLOR PALETTE (Exact Values)

```
Primary:
- Cosmic Deep Blue: #0A1628 (RGB: 10, 22, 40)
- Starlight White: #F5F7FA (RGB: 245, 247, 250)

Accent:
- Nebula Blue: #2E5BFF (RGB: 46, 91, 255)
- Trajectory Gold: #FFB84D (RGB: 255, 184, 77)

Functional (if needed):
- Success Green: #10B981
- Warning Amber: #F59E0B
```

---

## TYPOGRAPHY (For OG Image)

**Logo Text**: Space Grotesk Bold
- Download: https://fonts.google.com/specimen/Space+Grotesk

**Body/Tagline**: Inter Medium or Semibold
- Download: https://fonts.google.com/specimen/Inter

---

## ICON DESIGN CONCEPTS (Choose One)

### Concept A: Orbital Path
- Single curved trajectory line (gold)
- Tracking point/node on the path (blue dot)
- Clean, minimal, scientific

### Concept B: Intersecting Orbits
- Multiple orbital paths crossing
- Represents multiple ISOs being tracked
- More complex, visually interesting

### Concept C: Trajectory + Star
- Curved path with star burst at end
- Represents ISO entering our system
- Dynamic, suggests movement

### Concept D: Abstract "ISO"
- Stylized letterform that suggests orbit
- "I" as vertical path, "S" as orbital curve
- Brand recognition focus

**Recommended**: Concept A or C - simple, scalable, recognizable at small sizes

---

## OPTIMIZATION REQUIREMENTS

### Performance Targets:
- favicon.ico: <10KB
- icon-192x192.png: <50KB
- icon-512x512.png: <100KB
- apple-touch-icon.png: <30KB
- og-image.png: <300KB

### Export Settings:
- PNG-24 with maximum compression
- No interlacing (smaller file size)
- Remove metadata/EXIF data
- Use tools like TinyPNG or ImageOptim for final optimization

---

## DELIVERY CHECKLIST

After creation, verify:
- [ ] All file names exactly as specified (lowercase, hyphens)
- [ ] Dimensions exactly as specified
- [ ] File sizes within targets
- [ ] Colors match hex values exactly
- [ ] No unwanted artifacts or blur
- [ ] Transparent backgrounds where specified
- [ ] Solid backgrounds where specified (PWA icons, Apple touch)
- [ ] Text readable at small sizes (OG image)
- [ ] Favicon visible on both light and dark themes
- [ ] Files placed in: `apps/web/public/icons/`
- [ ] OG image placed in: `apps/web/public/`

---

## FILE LOCATIONS

```
apps/web/public/
├── favicon.ico                    # Browser tab icon
├── og-image.png                   # Social sharing
└── icons/
    ├── icon-192x192.png           # PWA manifest
    ├── icon-512x512.png           # PWA splash
    └── apple-touch-icon.png       # iOS home screen
```

---

## MANIFEST REFERENCE

The `apps/web/public/manifest.json` expects:
```json
{
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## NEXT STEPS

1. Review this brief with Jamie
2. Choose icon concept (A, B, C, or D)
3. Generate assets using preferred tool (Figma, Canva, AI generator, designer)
4. Optimize file sizes (TinyPNG, ImageOptim)
5. Place files in correct locations
6. Test PWA install on iOS and Android
7. Test social sharing previews (Twitter Card Validator, Facebook Debugger)

---

**Created**: 2025-11-16
**For**: Sprint 6 Completion
**Reference**: brand-style-guide.md v2.0
