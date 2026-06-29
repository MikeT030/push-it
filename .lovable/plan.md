## Task
Update the text link styles on the `/auth` page.

## Scope
File: `src/pages/AuthPage.tsx`

## Changes
1. **"New here? Create an account"** button (line ~191):
   - Default text color: white (`text-white`).
   - Always underlined in white (`underline decoration-white`).
   - On hover: keep existing primary/teal color shift (`hover:text-primary`).
   - Remove `text-muted-foreground` from default state.

2. **"Forgot password?"** Link (line ~178):
   - Apply the same style: white text, white underline, teal on hover.

## Why
The user wants both auth links to default to white with a white underline for better visibility on the dark background, while retaining the teal hover accent.