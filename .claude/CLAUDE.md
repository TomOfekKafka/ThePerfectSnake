# The Perfect Snake - AI Code Improvement Task

⚠️ **CRITICAL: Read `.claude/ARCHITECTURE.md` FIRST before making ANY changes!**

You are improving a React/TypeScript snake game that's embedded in a platform via iframe.

## Your Mission

Make ONE dramatic, bold, IMMEDIATELY OBVIOUS visual improvement to the game.

## Architecture Constraints (MUST FOLLOW)

**This game communicates with a parent platform via postMessage API.**

### DO NOT BREAK:
1. **postMessage API** - Game MUST receive commands from platform
2. **State broadcasting** - Game MUST send state updates to platform
3. **Embedded mode detection** - Game MUST work when `window.parent !== window`
4. **Message types** - DO NOT change message format in `src/types/messages.ts`

**Read `.claude/ARCHITECTURE.md` for full details on the platform integration.**

## Requirements

### Visual Impact
- Changes must be BOLD and DRAMATIC (not subtle!)
- Examples: bright color changes, gradients, animations, glows, particle effects
- BAD examples: small shadows, minor spacing, subtle opacity
- The change must be IMPOSSIBLE TO MISS when someone opens the game

### Performance Requirements (CRITICAL)
- **DO NOT slow down the browser or game performance**
- Avoid heavy animations that run continuously (e.g., complex particle systems, excessive DOM manipulation)
- Use CSS animations/transitions over JavaScript animations when possible
- Test performance: game should remain smooth and responsive
- Limit canvas operations - keep rendering efficient
- **If adding visual effects, ensure they don't cause lag or high CPU usage**
- Browser should remain responsive during gameplay

### Technical Requirements
- **CSS-only changes preferred** (no tests needed for pure CSS)
- If you modify logic/components, **MUST write Jest tests**
- **Performance-conscious implementations REQUIRED**
  - Keep rendering efficient and lightweight
  - Avoid excessive redraws or complex calculations in game loop
  - Test that game remains smooth (no lag or stuttering)
- **CRITICAL: Do NOT break postMessage integration**
  - Test that commands from platform still work
  - Verify state updates still sent to platform
- **CRITICAL: Maintain both embedded and standalone modes**
  - Test game works when embedded in platform
  - Test game works standalone (direct URL)
- Run `npm run build` to verify compilation succeeds
- Run `npm test` if you modified logic
- Build MUST pass before finishing

### Budget & Limits
- Maximum $5.00 budget
- Maximum 25 iterations
- Be selective when reading files - only read what you need

## Available Commands

- `npm run build` - Check TypeScript compilation (REQUIRED)
- `npm test` - Run Jest tests (REQUIRED if you modify logic)

## Key Files

### Visual Changes (Safe):
- `src/App.css` - Main game styling
- `src/components/GameBoard.css` - Game board styles
- `src/components/GameBoard.tsx` - Canvas rendering

### Logic Changes (Be Careful - Test Required):
- `src/App.tsx` - **Contains embedded mode detection - DON'T BREAK**
- `src/hooks/useSnakeGame.ts` - **Contains postMessage API - DON'T BREAK**
- `src/types/messages.ts` - **Message types - DON'T CHANGE**

## Workflow

1. **Increment Version** - Open `src/version.ts` and increment `GAME_VERSION` by 1 (REQUIRED FIRST STEP)
2. **Read Architecture** - Read `.claude/ARCHITECTURE.md` to understand constraints
3. **Explore** - Read key CSS files to understand current styling
4. **Plan** - Decide on a dramatic visual change that won't break API
5. **Implement** - Make bold CSS/visual changes
6. **Test** - Run `npm test` to verify visual safety and API (REQUIRED)
7. **Verify Build** - Run `npm run build` to check compilation (REQUIRED)
8. **Finish** - Say "DONE" when build and tests pass

## Testing Requirements

### Always Required (Even CSS-Only Changes):
- Run `npm test` - MUST pass (includes visual safety smoke tests)
- Run `npm run build` - MUST pass

**Visual safety tests catch game-breaking UI changes:**
- Canvas spinning/rotating
- Canvas invisible or wrong size
- Extreme transforms or animations
- Game unplayable due to visual bugs

### If You Modified Game Logic:
- Run `npm run build` - MUST pass
- Run `npm test` - MUST pass
- Write tests for new logic in `src/__tests__/`

### If You Modified postMessage Integration:
- **STOP! Read `.claude/ARCHITECTURE.md` again!**
- Create integration tests in `src/__tests__/postMessage.test.ts`
- Test all message types work
- Test origin validation works
- Test state broadcasting works

## Important Notes

- **Platform depends on postMessage API - breaking it breaks everything**
- **Performance is critical - heavy UI changes that slow the browser are unacceptable**
- Focus on visual improvements to minimize risk
- When in doubt, make CSS-only changes (they're faster and safer)
- Prefer CSS animations over JavaScript animations for performance
- Mobile compatibility is CRITICAL (but platform handles input now)
- Build must pass before you say "DONE"
- If unsure about a change, ask first

## Quick Safety Check

Before committing, verify:
- [ ] **Version number incremented** in `src/version.ts`
- [ ] `npm test` passes (including visual safety tests)
- [ ] **Game performance is smooth** (no lag, stuttering, or browser slowdown)
- [ ] Game renders in canvas and is visible
- [ ] Canvas not spinning or severely transformed
- [ ] Platform can send START_GAME command
- [ ] Platform can send DIRECTION_CHANGE commands
- [ ] Game sends GAME_STATE updates (including version)
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No console errors when embedded

Start by reading `.claude/ARCHITECTURE.md` to understand the system!
