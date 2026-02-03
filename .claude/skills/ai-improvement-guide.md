# AI Code Improvement Guide - Skill

**Purpose**: Guide AI agents through the automated code improvement process while maintaining platform integration.

---

## Overview

This game is part of a two-repository system where users pay to have AI improve the code. **You are the AI making those improvements.**

### The System

1. **User pays** $5 via PayPal on the platform
2. **Platform triggers** GitHub Actions workflow
3. **Workflow runs Claude Code** (YOU!) on this game repository
4. **You make improvements** following constraints below
5. **Tests run** automatically
6. **Changes are committed** and deployed

---

## Critical Constraints

### ❌ DO NOT BREAK THE postMessage API

This game is embedded in a platform via iframe. The platform and game communicate via postMessage.

**If you break this API, the entire system fails!**

#### Messages You MUST Support (Game Receives)

```typescript
// Platform → Game
{
  type: 'DIRECTION_CHANGE',
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
  timestamp: number
}

{
  type: 'START_GAME',
  timestamp: number
}

{
  type: 'RESET_GAME',
  timestamp: number
}
```

#### Messages You MUST Send (Game → Platform)

```typescript
// Game → Platform
{
  type: 'GAME_STATE',
  gameStarted: boolean,
  gameOver: boolean,
  score: number,
  timestamp: number
}

{
  type: 'GAME_READY',
  timestamp: number
}
```

**Implementation**: `src/hooks/useSnakeGame.ts` (lines 140-200)

**DO NOT modify message types in `src/types/messages.ts` without updating platform!**

---

## Your Mission

Make **ONE dramatic, bold, IMMEDIATELY OBVIOUS visual improvement** to the game.

### Good Examples:
- ✅ Animated rainbow snake with gradient colors
- ✅ Glowing neon effects on snake and food
- ✅ Particle effects when eating food
- ✅ Animated background with stars or grid
- ✅ Smooth snake movement animations
- ✅ Color-shifting food or pulsing effects

### Bad Examples:
- ❌ Small shadow adjustments
- ❌ Minor spacing changes
- ❌ Subtle opacity tweaks
- ❌ Breaking the postMessage API (CRITICAL)

---

## Step-by-Step Process

### 1. Increment Version Number

**CRITICAL FIRST STEP:**
- Open `src/version.ts`
- Increment `GAME_VERSION` by 1
- Example: `export const GAME_VERSION = 0;` → `export const GAME_VERSION = 1;`

### 2. Read Architecture Documentation

**REQUIRED READING:**
- `.claude/ARCHITECTURE.md` - Full system architecture
- `.claude/CLAUDE.md` - Your specific instructions

### 3. Explore Current Design

Read these files to understand current visuals:
- `src/App.css` - Main styling
- `src/components/GameBoard.css` - Canvas styles
- `src/components/GameBoard.tsx` - Canvas rendering logic

### 4. Plan Your Improvement

Think about:
- What will be IMMEDIATELY VISIBLE and DRAMATIC?
- Can I do this with CSS only? (preferred - no tests needed)
- If I modify rendering logic, what tests do I need?
- Will this work on mobile? (check responsive design)

### 5. Implement Changes

**Preferred approach: CSS-only**
- Modify `.css` files
- Add gradients, animations, glows, transforms
- No logic changes = no tests needed

**If modifying logic:**
- Update TypeScript files
- **MUST write tests** (see Testing section below)

### 6. **CRITICAL: Run Tests**

**Before finishing, you MUST run:**

```bash
npm test
```

**Tests must pass!** If they fail, fix the issues.

The tests verify:
- ✅ postMessage API still works
- ✅ Direction changes queue properly
- ✅ Game state broadcasts to platform
- ✅ 180-degree turn prevention works
- ✅ Message format is correct
- ✅ Visual safety (canvas visible, not spinning, reasonable size)
- ✅ No UI regressions that make game unplayable

### 7. Verify Build

```bash
npm run build
```

**Build must succeed!** TypeScript errors = deployment failure.

### 8. Verify Version Was Incremented

Double-check `src/version.ts` has the NEW version number (not the old one).

### 9. Finish

When tests pass AND build succeeds, say "DONE".

---

## Testing Requirements

### When Tests Are Required

**CSS-only changes:** No tests needed
**Logic changes:** MUST write tests

### Test Files

- `src/__tests__/postMessage.test.ts` - postMessage API tests (CRITICAL)
- `src/__tests__/visual-safety.test.ts` - Visual safety smoke tests (CRITICAL)
- `src/components/GameBoard.test.tsx` - Rendering tests (if you modify GameBoard)

### Visual Safety Tests

The visual safety tests are CRITICAL smoke tests that catch UI regressions making the game unplayable:

**What they check:**
- Canvas exists, is visible (not display:none or hidden)
- Canvas has reasonable dimensions (200-2000px)
- Canvas is positioned on screen (not way off-viewport)
- No extreme CSS rotations (e.g., 180deg spin)
- No extreme scaling (scale < 0.3 or > 3.0)
- No flipping (scaleX/Y = -1)
- No infinite spinning animations
- Canvas opacity is sufficient (>= 0.7)
- Canvas isn't behind other elements (z-index >= 0)

**Examples of what they catch:**
```css
/* ❌ BAD - Would fail tests */
canvas {
  transform: rotate(180deg);  /* Fails rotation test */
  animation: spin 1s infinite; /* Fails animation test */
  opacity: 0.1;               /* Fails opacity test */
  display: none;              /* Fails visibility test */
}
```

**These tests are FAST (~100ms) and prevent game-breaking visual bugs.**

**If visual safety tests fail, you broke something critical - fix it!**

### Writing New Tests

If you add new game mechanics or modify logic:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSnakeGame } from '../hooks/useSnakeGame';

describe('Your new feature', () => {
  it('should do something', () => {
    const { result } = renderHook(() => useSnakeGame());

    act(() => {
      // Your test code
    });

    expect(result.current.gameState).toMatchObject({
      // Expected state
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with watch mode (during development)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

---

## Common Scenarios

### Adding Visual Effects (CSS)

```css
/* ✅ GOOD - No tests needed */
.snake-segment {
  background: linear-gradient(45deg, #00ff00, #00aa00);
  box-shadow: 0 0 20px #00ff00;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

### Modifying Game Logic

```typescript
// ⚠️ REQUIRES TESTS
const moveSnake = useCallback(() => {
  // Your changes here

  // MUST still broadcast state to platform!
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'GAME_STATE',
      gameStarted: gameState.gameStarted,
      gameOver: gameState.gameOver,
      score: gameState.score,
      timestamp: Date.now()
    }, '*');
  }
}, [...]);
```

### Changing Canvas Rendering

```typescript
// ⚠️ REQUIRES TESTS if you change game mechanics
// ✅ NO TESTS if just visual changes

const drawSnake = (ctx: CanvasRenderingContext2D) => {
  // Add particle effects, glows, gradients
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00ff00';
  // ... render snake
};
```

---

## Emergency Checklist

Before you finish, verify:

- [ ] **Version incremented** in `src/version.ts`
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] postMessage API still works (tests verify this)
- [ ] Visual safety tests pass (canvas visible, not spinning, playable)
- [ ] Game works when embedded (postMessage tests)
- [ ] Game works standalone (embedded mode detection intact)
- [ ] Mobile compatibility maintained
- [ ] No TypeScript errors
- [ ] No console errors

---

## What If I Break Something?

### If tests fail:

1. Read the error message carefully
2. Check what test is failing
3. If it's a postMessage test, you likely broke the API
4. Revert your changes to `src/hooks/useSnakeGame.ts`
5. Or fix the postMessage integration

### If build fails:

1. Read TypeScript error
2. Fix type errors
3. Don't use `any` types
4. Import types from `src/types/messages.ts`

### If you're unsure:

1. Stick to CSS-only changes (safer)
2. Don't modify `src/hooks/useSnakeGame.ts` unless necessary
3. Don't change `src/types/messages.ts` (breaks platform)
4. Ask yourself: "Will this work when embedded in iframe?"

---

## Budget & Limits

- **Maximum**: $15.00 budget
- **Maximum**: 25 turns/iterations
- **Be efficient**: Read only what you need
- **Focus**: One dramatic visual change

---

## Success Criteria

Your improvement is successful when:

1. ✅ Visual change is IMMEDIATELY OBVIOUS and DRAMATIC
2. ✅ Tests pass (`npm test`)
3. ✅ Build succeeds (`npm run build`)
4. ✅ postMessage API still works
5. ✅ Game works embedded and standalone
6. ✅ Mobile compatibility maintained

---

## Quick Reference

**Safe to modify:**
- `src/App.css`
- `src/components/GameBoard.css`
- Canvas rendering in `src/components/GameBoard.tsx` (visual only)

**Modify with caution (TESTS REQUIRED):**
- `src/hooks/useSnakeGame.ts` (keep postMessage intact!)
- Game mechanics/logic

**DO NOT MODIFY:**
- `src/types/messages.ts` (breaks platform)
- postMessage listeners/senders
- Embedded mode detection
- `.baseline/` directory (frozen v0 reference - NEVER TOUCH)

---

**Remember: Tests are your safety net. Run them before finishing!**

**Run tests: `npm test`**

**If tests fail, you broke something critical. Fix it before committing!**
