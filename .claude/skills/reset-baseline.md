# Reset to Baseline - Skill

**Trigger phrases:**
- "Reset to baseline"
- "Go back to boring version"
- "Restore v0"
- "Revert to baseline"
- "Make it boring again"

**Purpose:** Restore the game to the boring baseline (v0) - white board, black snake, no effects.

---

## What This Skill Does

Restores the game to its simplest, most boring state:
- ⬜ White canvas background
- ⬛ Black squares for snake
- 🟥 Red square for food
- Plain gray/white UI
- No gradients, glows, shadows, or visual effects

This is the v0 baseline that AI improvements evolve from.

---

## Steps to Execute

### 1. Restore Baseline Files
```bash
npm run reset-to-baseline
```

This copies frozen baseline files:
- `.baseline/App.css` → `src/App.css`
- `.baseline/GameBoard.css` → `src/components/GameBoard.css`
- `.baseline/GameBoard.tsx` → `src/components/GameBoard.tsx`

### 2. Reset Version to 0
Edit `src/version.ts`:
```typescript
export const GAME_VERSION = 0;
```

### 3. Verify Build and Tests
```bash
npm run build
npm test
```

Both must pass before proceeding.

### 4. Commit and Push
```bash
git add src/App.css src/components/GameBoard.css src/components/GameBoard.tsx src/version.ts
git commit -m "Reset to boring baseline v0

Restored from .baseline/ directory:
- Plain white board, black snake, red food
- No visual effects or enhancements
- Version reset to 0

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin main
```

### 5. Deploy
```bash
npx vercel --prod --yes
```

Wait for deployment to complete, then confirm the boring baseline is live.

---

## Verification

After deployment, check:
- [ ] Game shows **v0** in platform UI
- [ ] Canvas has white background
- [ ] Snake is solid black squares
- [ ] Food is solid red square
- [ ] No glows, gradients, or effects
- [ ] UI is plain gray/white

---

## Important Notes

- **Never modify `.baseline/` files** - they are the frozen reference
- Always reset version to 0 when restoring baseline
- Always test before pushing
- This completely overwrites any AI improvements
- User typically does this to restart the evolution process

---

## Example Usage

**User says:** "Let's go back to the boring version"

**You do:**
1. Run `npm run reset-to-baseline`
2. Set `GAME_VERSION = 0` in `src/version.ts`
3. Build & test
4. Commit with message above
5. Push and deploy
6. Confirm: "✅ Reset to boring baseline v0!"

---

## When NOT to Use This

- User asks for a "simple" improvement (that's not a reset, that's a new improvement)
- User wants to undo just the latest change (use git revert instead)
- User wants to see the baseline (just show them the files, don't restore)

Only use this skill when the user explicitly wants to **reset to the boring starting point**.
