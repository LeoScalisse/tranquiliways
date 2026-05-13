The user wants a clean, minimal layout matching the uploaded reference:

- Blue gradient background fading to lighter blue/white at bottom
- Centered title animation (TranquiliWays → Ways), with "Ways" centered when collapsed
- Clean prompt box centered below
- Cloud button (top-left) only — remove the "Abrir Ways" button on the right
- Remove all extra text: header pill, paragraph descriptions, feature chips, footer

## Plan

### 1. Simplify `src/routes/index.tsx`

- Remove: header pill ("Jornada calma..."), "Abrir Ways" button, uppercase eyebrow, descriptive paragraph, feature chips row, footer with Android/iOS pills, glass panel wrapping prompt, capture header above prompt
- Keep: cloud button (top-left), centered TranquiliWays title, prompt box
- Layout: vertical stack centered — cloud button absolute top-left, title centered vertically in upper portion, prompt box below title
- Remove unused imports (Sparkles, Waves, HeartHandshake, motion, LiquidGlassButton's "Abrir Ways" usage)

### 2. Verify TranquiliWays title centers "Ways"

- Need to check `tranquili-ways-title.tsx` to ensure when collapsed to just "Ways", it appears centered (not left-aligned where "Tranquili" used to start)

### 3. Background gradient

- Check `src/styles.css` for `.safe-screen` — verify it produces the blue→white gradient like the reference. If not, adjust.

### 4. Cloud button

- Keep current liquid-glass cloud button at top-left, linking to `/ways`

### Files to edit

- `src/routes/index.tsx` — strip down to cloud button + centered title + prompt
- Possibly `src/components/ui/tranquili-ways-title.tsx` — ensure collapsed "Ways" centers
- Possibly `src/styles.css` — confirm gradient matches reference

### Out of scope

- No changes to `/ways` page
- No changes to prompt box internals or cloud button styling
