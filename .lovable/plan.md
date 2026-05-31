## Plan

Replace the current mini-game controller icon (`src/assets/controller.svg`) on the Today card with the newly uploaded PNG, rendered in white.

### Steps

1. Copy the uploaded image to `src/assets/game-controller.png`.
2. In `src/components/DailySection.tsx`:
   - Replace the import on line 12:
     `import controllerIcon from "@/assets/game-controller.png";`
   - On line 197, add a white filter so the PNG renders white:
     `<img src={controllerIcon} alt="Game" className="w-6 h-6 brightness-0 invert" />`

### Notes

The uploaded PNG is dark on transparent background. Using Tailwind's `brightness-0 invert` turns any non-transparent pixels pure white while preserving transparency — no need to recolor the asset itself.
