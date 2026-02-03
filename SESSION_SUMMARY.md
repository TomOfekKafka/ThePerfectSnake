# Session Summary - The Perfect Snake Setup

**Date:** 2026-02-03
**Goal:** Set up AI-powered snake game improvement platform with PayPal integration

---

## What We Built

### Architecture Overview

**Two-repository system:**
1. **Game Repo** (`ThePerfectSnake/`) - React snake game
2. **Platform Repo** (`perfect-snake-platform/`) - Payment platform that embeds game

**Key Innovation:**
- Users pay $5 via PayPal
- Payment triggers GitHub Actions workflow
- Claude Code CLI runs automatically
- AI makes visual improvement to game
- Changes deploy automatically
- Version increments with each improvement

---

## Repository Structure

### Game Repository: `ThePerfectSnake/`

**Key Files:**
- `src/version.ts` - Version number (starts at 0)
- `src/hooks/useSnakeGame.ts` - Game logic + postMessage API
- `src/components/GameBoard.tsx` - Canvas rendering
- `src/types/messages.ts` - postMessage protocol
- `.baseline/` - Frozen v0 files for reset
- `.claude/ARCHITECTURE.md` - Full system docs
- `.claude/CLAUDE.md` - AI improvement instructions
- `.claude/skills/` - AI agent skills

**PostMessage API:**
- Platform → Game: DIRECTION_CHANGE, START_GAME, RESET_GAME
- Game → Platform: GAME_STATE (with version), GAME_READY

**Tests:**
- `src/__tests__/postMessage.test.ts` - API tests
- `src/__tests__/visual-safety.test.ts` - Visual regression tests

**Baseline System:**
```bash
npm run reset-to-baseline  # Restores boring v0
```

### Platform Repository: `perfect-snake-platform/`

**Key Files:**
- `src/hooks/useInputController.ts` - Captures keyboard/swipe input
- `src/types/messages.ts` - postMessage protocol
- `src/App.tsx` - Main UI with PayPal integration
- `.github/workflows/ai-code-improvement.yml` - Automation workflow
- `api/verify-payment.ts` - PayPal verification

**Input System:**
- Platform captures ALL input (keyboard, swipes)
- Sends commands to game via postMessage
- Transparent overlay prevents iframe focus issues

---

## Critical Design Decisions

### 1. Input Handling Architecture

**Why platform handles input:**
- Prevents iframe focus issues
- Consistent control across desktop/mobile
- Platform can display game state in sidebar

**Implementation:**
- Transparent overlay with `pointer-events: none` on iframe
- Overlay positioned above iframe with `z-index: 10`
- Platform has global keyboard listeners
- Swipe detection (30px threshold)

### 2. Direction Queue System

**Problem:** Rapid keypresses caused self-collision

**Solution:** Queue system in game
- Up to 3 directions queued
- Each validated against last queued direction
- Prevents 180° turns
- Smooth handling of rapid input

### 3. Embedded vs Standalone Mode

Game detects: `const isEmbedded = window.parent !== window`

**Embedded mode:**
- Listens for postMessage commands
- No keyboard/touch handlers
- Minimal UI (just canvas)

**Standalone mode:**
- Built-in keyboard handlers
- Touch controls (mobile)
- Full UI (title, score, buttons)

### 4. Version Tracking

- Version stored in `src/version.ts`
- Game sends version in all postMessage messages
- Platform displays version in UI
- AI MUST increment version as first step

### 5. Mobile Layout

**Final solution:**
- `flex-direction: column-reverse` on mobile
- Game appears first (top)
- Scroll down to see PayPal
- No D-pad (swipe gestures only)
- `touch-action: none` on game overlay prevents scroll conflicts

---

## Workflows

### AI Improvement Workflow

**Trigger:** PayPal payment verified

**Process:**
1. Platform webhook receives payment notification
2. Platform triggers GitHub Actions via `repository_dispatch`
3. GitHub Actions workflow runs:
   - Checkout game repo
   - Install Claude Code CLI
   - Run: `claude -p "Make a dramatic visual improvement..."`
   - AI increments version
   - AI makes visual changes
   - Tests run (`npm test`)
   - Build succeeds (`npm run build`)
   - Commit and push changes
4. Vercel auto-deploys game
5. Platform shows new version number

**Concurrency:**
```yaml
concurrency:
  group: ai-improvements
  cancel-in-progress: false
```
- Improvements run sequentially (one at a time)
- Prevents conflicts and ensures version increments correctly

### Reset to Baseline Workflow

**Trigger:** User says "reset to baseline" or similar

**Process:**
1. Run `npm run reset-to-baseline`
2. Reset `GAME_VERSION = 0` in `src/version.ts`
3. Build and test
4. Commit and push
5. Deploy

**Files restored from `.baseline/`:**
- `App.css` - Boring UI
- `GameBoard.css` - Simple border
- `GameBoard.tsx` - Black snake, white board

---

## Testing Strategy

### PostMessage API Tests
Location: `src/__tests__/postMessage.test.ts`

**Coverage:**
- Platform → Game commands
- Game → Platform state updates
- Origin validation
- Direction queue behavior
- Message format validation

### Visual Safety Tests
Location: `src/__tests__/visual-safety.test.ts`

**Purpose:** Catch UI regressions that make game unplayable

**Checks:**
- Canvas visible (not display:none)
- Canvas has reasonable size (200-2000px)
- No extreme rotation (< 10 degrees)
- No extreme scaling (0.3-3.0 range)
- No flipping transforms
- No infinite spinning animations
- Sufficient opacity (>= 0.7)
- Proper z-index (>= 0)

These are FAST smoke tests (~200ms) that catch 80% of game-breaking changes.

---

## Environment Variables

### Platform

```bash
# .env.local or Vercel env vars
VITE_GAME_URL=https://the-perfect-snake.vercel.app
VITE_PAYPAL_CLIENT_ID=<your-paypal-client-id>
```

**Important:** VITE_GAME_URL must NOT have trailing whitespace/newline!

### Game

No environment variables needed.

---

## Deployment

### Game
- **Repo:** TomOfekKafka/ThePerfectSnake
- **URL:** https://the-perfect-snake.vercel.app
- **Auto-deploy:** On push to main

### Platform
- **Repo:** TomOfekKafka/perfect-snake-platform
- **URL:** https://perfect-snake-platform.vercel.app
- **Auto-deploy:** On push to main

---

## Known Issues & Solutions

### Issue: Keyboard not working on platform
**Cause:** Iframe had focus
**Solution:** Transparent overlay with `pointer-events: none` on iframe

### Issue: Rapid keypresses caused self-collision
**Cause:** Direction changes applied immediately
**Solution:** Direction queue with validation

### Issue: Swipe gestures scrolled page on mobile
**Cause:** Touch events propagated to parent
**Solution:** `touch-action: none` on game overlay

### Issue: Deployments not going live
**Cause:** Vercel auto-deploy delays
**Solution:** Use `vercel --prod --yes` CLI to force deploy

### Issue: Environment variable had trailing newline
**Cause:** Copy-paste error
**Solution:** `.trim()` on all `VITE_GAME_URL` uses

---

## Future Considerations

### Scaling (300+ improvements/day)

**Bottlenecks:**
1. **Vercel Free:** 100 deployments/day (need Pro/Team)
2. **GitHub Actions:** Sequential processing = 15 hours for 300 improvements
3. **Concurrency:** Currently one-at-a-time prevents race conditions

**Solutions:**
- Rate limiting (100/day max)
- Queue status display for users
- Upgrade to Vercel Team tier
- Consider parallel processing (complex)

### Domain Setup (Future)

**Proposed:**
- Platform: `perfect-snake.ai`
- Game: `game.perfect-snake.ai`

**Steps:**
1. Buy domain
2. Configure DNS (CNAME to Vercel)
3. Add domains in Vercel projects
4. Update `VITE_GAME_URL` environment variable
5. Update origin validation in game code

---

## Quick Reference Commands

### Game Repo

```bash
# Development
npm run dev          # Start dev server
npm test             # Run all tests
npm run build        # Build for production

# Baseline
npm run reset-to-baseline  # Restore boring v0

# Deploy
npx vercel --prod --yes   # Force production deploy
```

### Platform Repo

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production

# Deploy
vercel --prod --yes  # Force production deploy
```

---

## AI Improvement Guidelines

**Critical rules for AI agents:**
1. FIRST step: Increment version in `src/version.ts`
2. Make ONE dramatic, obvious visual change
3. Run `npm test` before finishing (REQUIRED)
4. Run `npm run build` (REQUIRED)
5. NEVER modify `.baseline/` directory
6. NEVER modify `src/types/messages.ts` (breaks API)
7. NEVER break postMessage integration
8. CSS-only changes preferred (no tests needed)

**Location of instructions:**
- `.claude/CLAUDE.md` - Main instructions
- `.claude/skills/ai-improvement-guide.md` - Detailed guide

---

## Current State

**Game Version:** v0 (boring baseline)
**Game Design:**
- White canvas background
- Black squares for snake
- Red square for food
- Plain gray/white UI
- Zero visual effects

**Ready for:** AI improvements via payment system

**All systems operational:**
- ✅ PostMessage API working
- ✅ Input handling (keyboard + swipe)
- ✅ Tests passing (28/28)
- ✅ Builds successful
- ✅ Mobile layout optimized
- ✅ Version tracking active
- ✅ Baseline restoration system ready

---

## Contact & Resources

**Repositories:**
- Game: https://github.com/TomOfekKafka/ThePerfectSnake
- Platform: https://github.com/TomOfekKafka/perfect-snake-platform

**Live URLs:**
- Game: https://the-perfect-snake.vercel.app
- Platform: https://perfect-snake-platform.vercel.app

**Key Documentation:**
- `.claude/ARCHITECTURE.md` (game repo) - Full technical details
- `.claude/CLAUDE.md` (game repo) - AI instructions
- `.claude/skills/` (game repo) - Agent skills

---

## Next Steps (Future)

1. [ ] Buy domain `perfect-snake.ai`
2. [ ] Configure DNS and Vercel domains
3. [ ] Test first real payment
4. [ ] Monitor AI improvement quality
5. [ ] Consider rate limiting (100/day)
6. [ ] Add queue status API for users
7. [ ] Upgrade Vercel tier if needed
8. [ ] Marketing/launch!

---

**End of Session Summary**

This document captures the complete context of the setup session. Reference this when resuming work on The Perfect Snake project.
