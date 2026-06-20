## Plan: Reduce Weekly Bar Chart Bar Width by 30%

### Context
The `WeeklyBarChart` component is used by both the personal weekly overview and the group "Weekly We Push" card. The bars currently have a maximum width of `28px`.

### Change
In `src/components/WeeklyBarChart.tsx`, update both occurrences of `max-w-[28px]` to `max-w-[20px]`:
- Line 143: Track background bar
- Line 149: Animated bar element

This reduces the bar width by ~30% (from 28px to 20px), affecting both the personal and group weekly charts since they share this component.

### Verification
- Build passes.
- Visual check confirms bars are narrower in both weekly chart instances.