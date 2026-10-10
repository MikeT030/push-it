# Project architecture rules

- Record every reached goal as an immutable row in `completed_goal_history`; milestone snapshots must remain unchanged when later push-ups or goals are added.
- Render Past Challenges through the shared `PastChallengesContent` component so the profile layer and standalone page cannot diverge.
