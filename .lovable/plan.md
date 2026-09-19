# Groups: from one global team to many

Today there is no notion of a team in the data — everyone who signs in is compared against every other account (the only separation is the demo/real flag). To ship this as a real app, the team has to become a thing people create, own, and invite into.

Below is a concrete proposal using sensible defaults. Say the word on any point and I'll adjust before we build.

## The defaults I'd pick

- **One active group per person, but you can belong to several.** A switcher in the header changes which team's leaderboard, group chart and overviews you see. Personal stats (You Push) stay the same no matter the team.
- **Invite link / code first.** The owner creates a group and shares a link like `push-it.app/join/AB7K2Q`. Opening it while signed in shows "Join *Morning Crew*?" and one tap joins. No approval queue for links.
- **Optional public discovery.** A group can be flagged public; new users see a short list and can send a join request the owner approves. Off by default so nobody's private team gets strangers.
- **Member limit set by the owner, default 30, hard max 100.** Keeps leaderboards readable and podium/overview screens from breaking.
- **New users must create or join a group** before reaching the app — it becomes a step in the existing welcome flow, right before picking the yearly goal.

## What changes in the app

**New: Create group screen** — name, optional member limit, then lands you in the group as owner with the invite link ready to copy/share.

**New: Join screen** — enter a code, open an invite link, or browse public groups and request to join.

**New: Group switcher** — a small control in the We Push header showing the current team name; tapping it lists your teams plus "Create" and "Join".

**New: Group settings** (owner only) — rename, change the limit, regenerate the invite code, approve/reject pending requests, remove a member, transfer ownership, delete the group.

**Changed: We Push page** — leaderboard, daily/weekly overviews, group goal chart and group averages all scope to the active group instead of everyone.

**Changed: Profile page** — lists your teams with a "Leave" action.

**Unchanged: You Push and Daily pages** — your own numbers and calendar are personal and stay as they are.

## Things worth deciding now, because they're painful later

- **Yearly goal is per person, not per group.** A group goal stays the sum of members' goals, as it works today. If you ever want "this team aims at 500k together", that's a different model — better to decide before people have history.
- **Leaving a group.** I'd keep your entries (they're yours) and simply remove you from that team's rankings, with no backfill of past weeks.
- **Joining mid-year.** You appear in the leaderboard with your full year-to-date total. The alternative — counting only from join date — makes the group chart lie about totals. I'd go with full totals.
- **The existing crowd.** Everyone currently in the app gets migrated into one group, "Push It", with you as owner, so nothing visibly breaks on release day.
- **Demo accounts.** Each demo signup gets its own throwaway group so demo users never see or pollute a real team.

## Technical notes

- New tables: `groups` (name, owner, invite_code, member_limit, is_public), `group_members` (group_id, user_id, role, joined_at), `group_join_requests` (group_id, user_id, status).
- `profiles` gets `active_group_id` so the app knows which team to render.
- Access rules: membership checked through a security-definer function (same pattern as the existing role check) to avoid recursive policy loops; group data readable only by members, writable only by the owner.
- Member-limit enforcement and invite-code redemption run in a database function / edge function so the cap can't be bypassed from the client.
- `useGroupData`, `useGroupEntries`, `useGroupProfiles`, `useGroupUserProgress` and the `user_progress` view all take the active group id instead of the demo cohort flag; the demo flag stays as a second-level guard.
- A one-off data migration creates the legacy group and adds every existing non-demo profile to it.

## Suggested build order

1. Schema, access rules, and the migration of today's users into one group.
2. Scope the We Push page and all group hooks to the active group.
3. Create / join / invite-link flows and the welcome-flow gate for new users.
4. Group switcher and group settings, including requests and member removal.
5. Public discovery and join requests (can ship after launch).

## Out of scope for now

- Group-level shared goals and group-vs-group competition.
- Chat or comments inside a group.
- Push notifications for invites and requests.
