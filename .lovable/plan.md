## Diagnosis

### 1. Splash screen circle animation lag
`src/components/SplashScreen.tsx` mounts simultaneously with the rest of the app (auth context, Supabase session, fonts, route bundle). The circles animate via CSS `stroke-dashoffset`, which **animates an SVG presentation attribute**. Browsers can't promote that to the GPU — every frame is a paint on the main thread. While the main thread is busy bootstrapping React/Supabase, those paint frames stutter.

Contributing factors:
- The background uses an inline `feTurbulence` SVG noise layer on top of a `radial-gradient`. Even though painted once, decoding the noise data-URL + compositing the full-viewport blurred background while four SVG circles re-paint adds main-thread work.
- 4 concurrent ring elements with `strokeWidth: 14` each repaint a large bounding box every frame.
- The fade/morph step uses a `transform: translateY+scale` over `MORPH_MS` *while* the auth UI is hydrating behind it.

### 2. DailySection "Push-it" card slow load
`src/components/DailySection.tsx` returns `null` until `usePushUpData` resolves both the profile and entries queries (`isLoaded`). That's two round-trips to Supabase gating the entire card.

Once it does render, first paint is expensive:
- The mini-strip renders **365 day cells** at once, each with `backdrop-filter: blur(6px) saturate(1.2)` + 5 inset/outer shadows. `backdrop-blur` re-samples on every scroll/paint — known perf killer (also flagged in our project hints).
- The action buttons (±10, share, prev/next month) each use the same heavy `backdrop-filter` recipe — ~6 more blurred layers.
- A large inline `MuscleIcon` SVG (200+ path commands) is **redefined inside the render function** on every render, busting React's reconciliation cache.
- `TotalPage.tsx` imports `MountainGoalCard` and `LineChartGoalCard` even though neither is rendered — they're shipped in the route bundle for no reason, delaying the chunk that contains `DailySection`.

## Solutions

### Splash
1. **Use `<animate>` SMIL or animate `transform: rotate` of a masking path instead of `stroke-dashoffset`** — or simpler: keep CSS but add `will-change: stroke-dashoffset` and `transform: translateZ(0)` to each circle to hint the compositor, and reduce `strokeWidth` repaint area.
2. **Defer heavy auth/Supabase work** until after the splash completes: gate `AuthProvider` initialization or lazy-load `/auth` route via `React.lazy` so the splash thread is idle.
3. **Drop the `feTurbulence` noise layer** (or pre-bake it to a small PNG with `background-repeat`) so the splash background isn't re-decoded.
4. Shorten total splash duration — last ring starts at 1.5 s + 1.8 s = 3.3 s, then 0.9 s morph + 0.5 s fade ≈ **4.7 s** before the app is interactive. Tighten to ~2 s.

### DailySection
1. **Render an instant skeleton** instead of `return null` while `isLoaded` is false (and start showing entries optimistically — entries query is independent of profile; show defaults immediately).
2. **Parallelize the two Supabase queries** in `usePushUpData` with `Promise.all` (currently sequential `await` for profile then entries).
3. **Virtualize or windowing for the 365-day mini strip** — only render the ~20 days near the viewport (use `react-window` or a manual slice driven by scroll position).
4. **Replace `backdrop-filter` with opaque tinted backgrounds + `text-shadow` / `box-shadow`** on the day cells and action buttons. The project's own perf note flags this exact issue.
5. **Hoist `MuscleIcon` and `TargetDiffIcon` to module scope** so they aren't redefined per render.
6. **Memoize the stats IIFE** (`useMemo` keyed on `entries` length + `selectedDate`) instead of recomputing on every input keystroke.
7. **Remove unused imports** `MountainGoalCard`, `LineChartGoalCard` from `TotalPage.tsx`, and code-split `DailySection` with `React.lazy` so the initial route paints faster.

## Suggested implementation order
1. Quick wins (no behavioral change): hoist icons, remove dead imports, parallelize the two queries, drop `backdrop-filter` on the 365 day cells.
2. Render skeleton instead of `null`.
3. Virtualize the mini strip.
4. Splash: remove noise layer + shorten timings + add `will-change`.

Want me to apply all of them, or start with the quick wins only?
