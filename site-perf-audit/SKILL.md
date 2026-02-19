# Site Performance Audit & Fix

> Systematic diagnosis and optimization of Next.js / React websites.

**Trigger**: "audit performance", "site is slow", "optimize the website", "performance check"
**Potency**: 0.88 | **Type**: Skill (High)

---

## When to Use

- Website loading slowly (reported by user or measured)
- Before production launch (preventive audit)
- After major feature additions (regression check)
- Periodic health check on deployed sites

---

## Phase 1: Diagnosis

Run ALL checks in parallel. Categorize findings by severity (CRITICAL > HIGH > MEDIUM > LOW).

### 1A: Bundle Analysis

```bash
# Check total JS bundle size
npm run build 2>&1 | tail -30

# Find the largest chunks
# Look for any chunk > 200KB — investigate what's in it

# Check node_modules for heavy packages
du -sh node_modules/ | sort -rh | head -20

# Check package.json for known offenders
```

**Known heavy packages to flag**:

| Package | Typical Size | Lightweight Alternative |
|---------|-------------|------------------------|
| three.js / shaders | 150KB+ | CSS gradients, SVG, CSS 3D |
| lodash (full) | 70KB | es-toolkit (~3KB) or native ES6 |
| moment.js | 67KB | date-fns or Day.js (~2KB) |
| framer-motion (full) | 32KB | CSS transitions / WAAPI |
| axios | 13KB | Native fetch() |
| jQuery | 87KB | Native DOM APIs |

### 1B: Asset Audit

```bash
# Find large assets in public/
find public/ -type f -size +500k -exec ls -lh {} \;

# Check video sizes specifically
ls -lh public/videos/

# Check image formats (should be AVIF/WebP, not PNG/JPEG for photos)
find public/ -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | head -20
```

**Thresholds**:
- Videos: compress to < 2MB each (720p, CRF 28-32, muted)
- Images: use next/image with AVIF/WebP auto-conversion
- Hero image/video: must be optimized (it's the LCP element)

### 1C: Component Analysis

```bash
# Count "use client" directives
grep -r '"use client"' src/ --include="*.tsx" --include="*.ts" -l

# Check for ResizeObserver, IntersectionObserver usage
grep -r 'ResizeObserver\|IntersectionObserver' src/ --include="*.tsx" -l

# Check for SVG filter complexity (feDisplacementMap, feTurbulence, etc.)
grep -r 'feDisplacement\|feTurbulence\|feColorMatrix' src/ --include="*.tsx" -l

# Check for will-change in CSS
grep -r 'will-change' src/ --include="*.css"
```

**Red flags**:
- `"use client"` on components that don't use useState/useEffect/onClick
- ResizeObserver on many instances (30+ = severe)
- SVG filters (feDisplacementMap, feTurbulence) = CPU-heavy, replace with CSS
- Permanent `will-change` declarations = GPU memory waste

### 1D: Configuration Check

```bash
# Check next.config.ts for cache headers
cat next.config.ts

# Check font loading in layout.tsx
grep -A5 'font\|Font' src/app/layout.tsx

# Check for preload settings on videos/images
grep -r 'preload' src/ --include="*.tsx"
```

**Should have**:
- Cache-Control headers for static assets (`max-age=31536000, immutable`)
- `font-display: swap` on all fonts
- Minimal font weights (only what's used)
- `preload="none"` on below-fold videos
- `priority` on LCP image only (not all images)

### 1E: Dead Code

```bash
# Check for unused exports
# Look for files imported nowhere
grep -rL 'import.*from' src/components/ --include="*.tsx" 2>/dev/null

# Check for boilerplate files (Next.js defaults)
ls public/next.svg public/vercel.svg public/globe.svg 2>/dev/null
```

---

## Phase 2: Triage Report

Present findings as a table:

```markdown
| # | Severity | Issue | Impact | Fix |
|---|----------|-------|--------|-----|
| 1 | CRITICAL | [package] ships [X]MB JS | +[X]s LCP | Replace with CSS/native |
| 2 | CRITICAL | Hero video [X]MB | +[X]s load | ffmpeg compress to <2MB |
| 3 | HIGH | [N] unnecessary client components | +[X]KB JS | Convert to server components |
| 4 | HIGH | SVG filters x[N] instances | CPU thrash | Replace with CSS backdrop-filter |
| 5 | MEDIUM | No cache headers on assets | Repeat downloads | Add Cache-Control |
| 6 | MEDIUM | [N] unused font weights | +[X]KB | Trim to used weights only |
| 7 | LOW | Dead code / boilerplate files | Clutter | Delete |
```

**Get user approval before proceeding to fixes.**

---

## Phase 3: Fix (Top-Down by Impact)

### Fix Pattern A: Replace Heavy JS with CSS

The most common and highest-impact fix. AI-generated code especially tends to pull in heavy JS libraries for effects achievable with CSS.

**Decision tree**:
- Animated gradient? -> CSS `@keyframes` + `background-size`
- Frosted glass? -> CSS `backdrop-filter: blur()`
- Scroll animations? -> CSS `animation-timeline: view()` or IntersectionObserver
- Parallax? -> CSS `transform: translateZ()` with `perspective`
- Simple transitions? -> CSS `transition` property
- Complex orchestrated animation? -> Keep JS library (Framer Motion / GSAP)

After replacing: `npm uninstall [package]` and verify it's gone from bundle.

### Fix Pattern B: Compress Media

**Video compression (ffmpeg)**:
```bash
# H.264 (MP4) — broad compatibility
ffmpeg -i input.mp4 -vf "scale=-2:720" -c:v libx264 -crf 28 \
  -preset slow -an -movflags +faststart -t 15 output.mp4

# VP9 (WebM) — smaller, modern browsers
ffmpeg -i input.mp4 -vf "scale=-2:720" -c:v libvpx-vp9 -crf 32 \
  -b:v 0 -an -t 15 output.webm
```

Parameters explained:
- `-crf 28/32`: Quality (higher = smaller, 28-32 good for backgrounds)
- `scale=-2:720`: 720p height, preserve aspect ratio
- `-an`: Strip audio (background videos don't need it)
- `-t 15`: Limit to 15 seconds for loops
- `+faststart`: Move metadata to front for streaming

**Image optimization**: Use `next/image` component, let Vercel auto-optimize.

### Fix Pattern C: Client → Server Components

1. Check if component uses: `useState`, `useEffect`, `useRef`, `onClick`, browser APIs
2. If NO: remove `"use client"`, convert to server component
3. If YES but only in a small part: split into server wrapper + client leaf
4. Push `"use client"` boundary as low in the tree as possible

### Fix Pattern D: Lazy Loading

```tsx
// For below-fold videos
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) { load(); observer.disconnect(); } },
    { rootMargin: "200px" }
  );
  observer.observe(ref.current);
  return () => observer.disconnect();
}, []);
```

```tsx
// For heavy components
import dynamic from 'next/dynamic'
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

### Fix Pattern E: Cache Headers

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: "/videos/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
    {
      source: "/images/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
  ];
},
```

### Fix Pattern F: Font Optimization

- Use `next/font` (self-hosts, eliminates external requests)
- Only include weights actually used in the design
- Add `display: "swap"` (shows system font immediately)
- Consider variable fonts if using 3+ weights

---

## Phase 4: Verify

After ALL fixes:

```bash
# 1. Build must pass
npm run build

# 2. Compare bundle size (before vs after)
# Note the "First Load JS" numbers from build output

# 3. Check no regressions
# Open in browser, verify visual appearance is maintained
```

**Success metrics**:
- JS bundle reduction: target 30%+ for sites with heavy dependencies
- Asset reduction: target 50%+ for uncompressed videos
- Build time: should decrease (less to compile)
- All pages building clean (no warnings)

---

## Phase 5: Ship

```bash
git add [specific files]
git commit -m "perf: [summary of changes and metrics]"
git push
```

Include before/after metrics in the commit message.

---

## AI Code Review Checklist

When reviewing any AI-generated website code, check:

- [ ] Any `"use client"` that doesn't need useState/useEffect/onClick?
- [ ] Any npm package > 50KB that could be CSS or native API?
- [ ] Any SVG filters that could be CSS `backdrop-filter` or `filter`?
- [ ] Any animation library where CSS `@keyframes` would work?
- [ ] Any `preload="auto"` on below-fold media?
- [ ] Any permanent `will-change` declarations?
- [ ] Any ResizeObserver that could be a CSS container query?
- [ ] Any inline object/function creation in JSX props?
- [ ] Any dead code or boilerplate files from project scaffolding?
- [ ] Font weights trimmed to only what's used?

---

## Reference

For the full research backing this skill, see:
`PERFORMANCE-REFERENCE.md` in the project root (692 lines, 30+ sources).

**Key numbers to remember**:
- LCP target: < 2.5s
- INP target: < 200ms
- CLS target: < 0.1
- JS chunk warning threshold: > 200KB
- Video target: < 2MB each
- Potency threshold for this skill: refine until metrics improve 30%+

---

*Distilled from BioGenesis optimization session (Feb 2026)*
*JS: 2.0MB -> 817KB (59%) | Video: 13.5MB -> 3.0MB (77%) | Build: 6.6s -> 4.0s*
