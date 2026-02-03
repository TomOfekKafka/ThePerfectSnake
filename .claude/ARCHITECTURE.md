# Snake Game Architecture - AI Improvement Guidelines

**⚠️ CRITICAL: This game is automatically improved by AI. Follow these guidelines strictly.**

## Architecture Overview

This project uses a **two-repository architecture**:

### 1. **Game Repository** (this repo)
- **Purpose**: Pure game logic and rendering
- **Responsibilities**:
  - Snake movement logic
  - Collision detection
  - Food generation
  - Canvas rendering
  - Receive input commands via postMessage

### 2. **Platform Repository** (perfect-snake-platform)
- **Purpose**: UI controls, input handling, and game hosting
- **Responsibilities**:
  - Embed game via iframe
  - Capture keyboard/touch/mouse input
  - Send direction commands to game
  - Display score, status, start/reset buttons
  - Handle payments and AI improvement triggers

---

## postMessage API - DO NOT BREAK THIS!

### Platform → Game Messages

The game **MUST** listen for these messages and respond correctly:

```typescript
// Direction change command
{
  type: 'DIRECTION_CHANGE',
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
  timestamp: number
}

// Start new game
{
  type: 'START_GAME',
  timestamp: number
}

// Reset after game over
{
  type: 'RESET_GAME',
  timestamp: number
}
```

**Implementation location**: `src/hooks/useSnakeGame.ts` - postMessage listener

### Game → Platform Messages

The game **MUST** send these messages to keep the platform in sync:

```typescript
// Game state updates (send on every state change)
{
  type: 'GAME_STATE',
  gameStarted: boolean,
  gameOver: boolean,
  score: number,
  timestamp: number
}

// Ready notification (send once on mount when embedded)
{
  type: 'GAME_READY',
  timestamp: number
}
```

**Implementation location**: `src/hooks/useSnakeGame.ts` - state broadcasting useEffect

---

## Embedded vs Standalone Mode

The game supports two modes:

### Embedded Mode (Primary)
- Detected via: `window.parent !== window`
- **NO UI elements** (no title, score, buttons)
- **NO input handlers** (keyboard/touch handled by platform)
- **ONLY renders** the game canvas
- **MUST communicate** via postMessage

### Standalone Mode (Testing/Fallback)
- When accessed directly at game URL
- Shows basic UI (title, score, buttons)
- Has keyboard and touch input handlers
- Works without platform

**All improvements MUST support both modes.**

---

## Testing Requirements

### 1. Unit Tests (Required)

If you modify game logic, add/update tests in:
- `src/components/GameBoard.test.tsx`
- `src/hooks/useSnakeGame.test.ts` (create if needed)

Run tests: `npm test`

### 2. postMessage Integration Tests (CRITICAL)

**Test file**: `src/__tests__/postMessage.test.ts` (create if doesn't exist)

Must test:
- ✅ Game receives DIRECTION_CHANGE and moves snake
- ✅ Game receives START_GAME and starts
- ✅ Game receives RESET_GAME and resets
- ✅ Game sends GAME_STATE on state changes
- ✅ Game sends GAME_READY on mount
- ✅ Invalid messages are ignored
- ✅ Messages from unauthorized origins are rejected

### 3. Build Verification (REQUIRED)

**ALWAYS run before committing:**
```bash
npm run build
```

Build MUST succeed. TypeScript errors = deployment failure.

---

## What You Can Improve

### ✅ Safe to Modify:
- Game mechanics (speed, scoring rules)
- Visual appearance (colors, animations, effects)
- Canvas rendering (better graphics, particles)
- Collision detection improvements
- Food spawn logic
- Snake growth mechanics

### ⚠️ Modify with Caution (maintain API):
- `src/hooks/useSnakeGame.ts` - Keep postMessage listeners intact
- `src/App.tsx` - Keep embedded detection logic
- State management - Keep broadcasting to platform

### ❌ DO NOT BREAK:
- postMessage API (both receiving and sending)
- Embedded/standalone mode detection
- Origin validation logic
- Message format/structure
- TypeScript types in `src/types/messages.ts`

---

## Common Improvement Scenarios

### Adding New Visual Effects

```typescript
// ✅ GOOD - Add effects without breaking API
const drawSnake = (ctx: CanvasRenderingContext2D) => {
  // Add glow effect, gradients, animations
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#00ff00';
  // ... render snake
};
```

### Changing Game Speed

```typescript
// ✅ GOOD - Adjust game parameters
const GAME_SPEED = 100; // Faster speed

// ❌ BAD - Don't break the game loop or state management
```

### Adding New Game Features

```typescript
// ✅ GOOD - Add power-ups, obstacles, etc.
// Just make sure they update score correctly
// And state is still broadcasted to platform

// ❌ BAD - Don't add new message types without updating platform
```

---

## Debugging Embedded Mode

When testing your changes:

1. **Test standalone first**: `npm run dev` → http://localhost:5174
2. **Test embedded**: Run platform locally and embed your dev server
3. **Check console**: Look for postMessage logs
4. **Verify state sync**: Check platform UI updates with game state

---

## Commit Checklist

Before every commit:

- [ ] `npm run build` succeeds
- [ ] `npm test` passes (if you have tests)
- [ ] Tested in standalone mode (direct URL)
- [ ] Tested in embedded mode (via platform)
- [ ] postMessage communication still works
- [ ] No TypeScript errors
- [ ] No console errors in browser

---

## Emergency Rollback

If your changes break the platform integration:

1. The issue is likely in `src/hooks/useSnakeGame.ts`
2. Check postMessage listeners are still attached
3. Check state broadcasting is still happening
4. Verify message format matches the API above
5. Check origin validation isn't too restrictive

---

## Questions?

If unsure about a change:
1. Read this document again
2. Check existing postMessage implementation
3. Test thoroughly in both modes
4. When in doubt, don't break the API

**Remember: The platform depends on this API. Breaking it breaks the entire system.**
