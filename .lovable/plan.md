## Lower daily push-up cap from 9,999 → 1,000

No existing entries exceed 1,000, so no data clamping is needed.

### Changes

**Database migration**
- Drop existing `count_bounds` CHECK constraint on `public.push_up_entries`.
- Re-add as `CHECK (count >= 0 AND count <= 1000)`.

**Client-side clamps (replace 9999 with 1000)**
- `src/hooks/usePushUpData.ts` (line 166) — defence-in-depth clamp.
- `src/pages/DailyPage.tsx` (lines 102, 115) — input validation and +/- buttons.
- `src/components/DailySection.tsx` (lines 171, 181) — same input/+- logic.
- `src/components/WelcomeShell.tsx` (line 235) — freeform goal input `max` stays at 9999 (this is the yearly goal input, not the daily cap) → leave untouched.

The `z-[9999]` and `border-radius: 9999px` references are unrelated styling tokens and stay as-is.

### Notes
- Users typing over 1,000 will see the input rejected (same UX as before, just a lower ceiling).
- The yearly goal freeform stays uncapped at the daily level since it's an annual total.