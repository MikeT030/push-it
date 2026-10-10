# Set a goal by end-of-year total on the Recalibrate screen

## What changes

The Recalibrate Your Goal screen gets a second custom input, directly below the existing "Your # PU / day" card. Instead of typing a daily number, the user types the total they want to reach by the end of the year (e.g. 60,000), and the card shows what that means per day.

## The new card

- Sits below the "Your # PU / day" input card, same look: rounded card, teal border when active.
- Left side: a number input (placeholder "Your goal") followed by the label **PU / EOY** (end of year).
- Right side: the live conversion, e.g. "≈ **236** PU / day" — bold number, muted label, same style as the other cards.
- Typing or focusing the input selects this card (teal highlight), just like the daily input behaves today.

## How the math works

- The screen already knows the user's push-ups logged so far and the days remaining in the year.
- Required daily rate = (typed EOY goal − push-ups already logged) ÷ days remaining, rounded up. Example: 32,000 logged, goal 60,000, 83 days left → 338 PU/day.
- If the typed goal is below what's already logged, the daily rate shows 0 and the Confirm button stays disabled — you can't set a goal you've already passed.
- Confirming saves the typed EOY number as the yearly goal exactly (no rounding drift), so the goal ring and celebration trigger at precisely 60,000.
- The existing daily-input card is untouched; whichever card was last touched is the active selection.

## Scope

- Only the Recalibrate screen (`/welcome-recalibrate`) gets the new input. The first-time welcome and the 30k celebration screens keep their current options.
- The 1,000 PU/day cap still applies: if the required daily rate would exceed 1,000, the card shows it but Confirm stays disabled with a hint.

## Technical notes

- `src/components/WelcomeShell.tsx`: add an `"eoy"` selection state and `eoyValue` input; fetch the user's current total once on mount (same query `handleConfirm` already runs) so the conversion is live; new card rendered after the custom daily card; `handleConfirm` gains a branch that saves the EOY number directly (additive path: `goal = eoyValue`, validated `> currentTotal`, `<= 999999`, and required daily `<= 1000`).
- `src/pages/WelcomeRecalibratePage.tsx`: pass a prop (e.g. `showEoyInput`) to enable the new card only on this screen.
- No database changes; the saved value is still just `profiles.yearly_goal`.
