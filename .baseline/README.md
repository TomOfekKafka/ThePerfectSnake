# Boring Baseline (v0)

This directory contains the **boring baseline** version of The Perfect Snake game.

## What is the baseline?

The baseline (v0) is the simplest, most boring snake game possible:
- ⬜ White canvas background
- ⬛ Black squares for snake
- 🟥 Red square for food
- Plain gray/white UI
- No gradients, glows, shadows, or effects

## Purpose

This baseline serves as:
1. **Starting point** for AI improvements
2. **Reset point** to go back to boring design
3. **Reference** for what v0 looks like

## Files Preserved

- `App.css` - Boring UI styles (gray/white, no effects)
- `GameBoard.css` - Simple gray border, white background
- `GameBoard.tsx` - Simple rendering (no glows, gradients, or effects)

## How to Restore Baseline

### Option 1: NPM Script (Recommended)
```bash
npm run reset-to-baseline
```

### Option 2: Manual Copy
```bash
cp .baseline/App.css src/App.css
cp .baseline/GameBoard.css src/components/GameBoard.css
cp .baseline/GameBoard.tsx src/components/GameBoard.tsx
```

### Option 3: Git Tag
```bash
git checkout baseline-v0 -- src/App.css src/components/GameBoard.css src/components/GameBoard.tsx
```

## After Restoring

1. Reset version to 0:
   ```bash
   # Edit src/version.ts and set GAME_VERSION = 0
   ```

2. Build and test:
   ```bash
   npm run build
   npm test
   ```

3. Commit and deploy:
   ```bash
   git add .
   git commit -m "Reset to boring baseline v0"
   git push origin main
   ```

## Important Notes

- **Never modify files in `.baseline/`** - They should remain frozen as the boring reference
- If you improve the baseline itself (e.g., fix a bug), update both `src/` and `.baseline/` files
- The baseline is committed to git for safety
- AI improvements should NEVER touch `.baseline/` files
