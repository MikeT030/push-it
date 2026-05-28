## Goal

On the Daily page's "Today" progress ring, replace the centered "0%" / "Push it" text with a small badge containing today's push-up count, positioned on the top edge of the ring.

## Changes

**`src/components/ProgressRing.tsx`**
- Add an optional `centerLabel` prop (string or number) so the ring can display arbitrary content; when provided, hide the default `XX% / Push it` block.
- Add an optional `topBadge` prop (ReactNode). When set, render a small pill absolutely positioned at the top of the ring, vertically centered on the stroke (translate -50% on both axes, `top: 0`, `left: 50%`).
- Badge styling: rounded-full, compact padding (`px-2.5 py-0.5`), dark background using the existing card token, 1px border in the active progress color (teal/purple/magenta based on the same `progress` tiers already used for the stroke), bold number in white, matches the "Bold only numeric values" typography rule.
- Empty center: when the badge is used, leave the center empty (no "%" / "Push it" text), per the user's choice of "Badge on top arc".

**`src/pages/DailyPage.tsx`** (today card)
- Pass `topBadge={todayCount}` to the `ProgressRing` so it shows today's push-up count from `getEntryForDate(new Date())`.
- Leave the +/- 10 buttons and all other behavior untouched.

## Layout sketch

```text
        ┌──[ 42 ]──┐         ← badge sits on top arc
       /            \
      |              |
      |   (empty)    |
       \            /
        \__________/
```

## Out of scope

- No changes to the Total page's yearly ring (keeps "%" + "Push it").
- No changes to ring colors, sizing, glow, or game-launch behavior.
