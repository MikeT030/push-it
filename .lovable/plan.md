
# Demo / Test Area

Goal: let anyone try the app with full functionality without polluting real stats. Test users are sandboxed from real users, and admins delete expired accounts manually from `/admin`.

## 1. Mark test accounts

Add `is_test boolean not null default false` to `profiles`. Every real signup stays `false`; only the demo entry point creates `true` accounts. A single flag drives isolation, auth restrictions, and admin cleanup.

## 2. "Try demo" entry point

On `/auth` (email step), add a secondary "Try the demo" button under the primary CTA.

Tapping it calls a new edge function `create-demo-account` that:
- Generates a random email like `demo+<uuid>@pushit.demo` and a random password.
- Creates the auth user via service role, `email_confirm: true` (no OTP).
- Sets `profiles.is_test = true`, `display_name = "Demo <4-char>"`, `onboarded = true`, `goal_set_year = current year`, `yearly_goal = 30000` so the user lands straight on `/` without the welcome gate.
- Returns the email + password to the client, which signs in with them.

Users see a persistent banner on every page: "Demo account — expires in N days. Nothing is saved to the leaderboard." (N computed from `created_at + 5`.)

## 3. Sandboxing (test users only see other test users)

Everywhere the app aggregates across users, filter by `is_test` matching the current viewer's flag. Concretely:

- `useGroupData` / `useGroupEntries`: join `profiles` and filter `is_test = <viewer.is_test>`.
- Leaderboard (`LeaderboardPodium`, `GroupPage`): same filter.
- Group goal chart, group averages, daily/weekly group overviews: same filter.
- Past challenges: same filter.
- Avatar "taken" grayscale check in `AvatarSelector`: only within the same cohort.

Real users never see demo data; demo users see a parallel leaderboard populated only by other active demo accounts.

## 4. Block real signup path for demo, and vice versa

- `check-email-exists` and normal signup keep working for real users.
- Demo emails use the `@pushit.demo` domain, which the real signup form rejects client-side to avoid confusion.
- Signed-in demo users cannot change their email (hide the field in profile).

## 5. Admin cleanup UI

On `/admin`, new card **"Demo accounts"** below the existing admin sections:
- Lists all `profiles` where `is_test = true` with columns: display name, created date, days remaining (5 - age), total push-ups logged.
- Red "Delete" button per row. Confirms, then calls new edge function `delete-demo-account` which deletes the `auth.users` row (cascades to `profiles`, `push_up_entries`, `user_roles`).
- "Delete all expired" bulk button for rows past 5 days.

No automatic cron — admin decides when.

## 6. Expiry behavior

Login is not blocked after 5 days — the account just sits there until an admin removes it. The banner keeps counting down (into negative "expired" state) so the admin sees stale accounts and the user knows.

## Technical notes

- Migration: `alter table profiles add column is_test boolean not null default false;` plus updated RLS/queries. No new tables.
- Filtering pattern: change `useGroupEntries` to fetch `profiles(is_test)` alongside entries, then filter in JS by the current user's flag (cached in `AuthContext` via a `useProfile` hook or read from the existing profile query).
- Two new edge functions: `create-demo-account` (service role, public — no JWT), `delete-demo-account` (service role, admin-only via `has_role`).
- Admin list view uses a new admin RPC or a direct query gated by `has_role(auth.uid(), 'admin')` since regular RLS on `profiles` allows all authenticated to read — that's fine, admin just needs the extra columns.
- The demo banner lives in `AppContent` above `<Routes>` and reads `is_test` from the profile cache.

## Out of scope

- Automatic cron deletion (explicitly manual per your answer).
- Rate limiting on the demo button (can add later if abused; suggest a simple IP-based limit in the edge function if you want).
- Separate demo-only tutorial overlay.
