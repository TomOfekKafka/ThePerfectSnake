/**
 * Triple-tap immortality system.
 * Tap the screen 3 times quickly to activate immortal mode.
 * While immortal, the snake wraps through walls and passes through itself.
 */

export interface ImmortalState {
  tapTimestamps: number[];
  active: boolean;
  activatedAtTick: number;
  chargesRemaining: number;
  foodSinceLastUse: number;
}

const TAP_WINDOW_MS = 1200;
const TAPS_REQUIRED = 3;
const IMMORTAL_DURATION_TICKS = 55;
const FOOD_TO_RECHARGE = 5;
const INITIAL_CHARGES = 1;

export const createImmortalState = (): ImmortalState => ({
  tapTimestamps: [],
  active: false,
  activatedAtTick: 0,
  chargesRemaining: INITIAL_CHARGES,
  foodSinceLastUse: 0,
});

export const registerTap = (state: ImmortalState, now: number): ImmortalState => {
  const cutoff = now - TAP_WINDOW_MS;
  const recentTaps = [...state.tapTimestamps.filter(t => t > cutoff), now];

  if (recentTaps.length >= TAPS_REQUIRED && state.chargesRemaining > 0 && !state.active) {
    return {
      ...state,
      tapTimestamps: [],
      active: true,
      activatedAtTick: -1,
      chargesRemaining: state.chargesRemaining - 1,
      foodSinceLastUse: 0,
    };
  }

  return { ...state, tapTimestamps: recentTaps };
};

export const activateImmortalAtTick = (state: ImmortalState, tickCount: number): ImmortalState => {
  if (!state.active || state.activatedAtTick >= 0) return state;
  return { ...state, activatedAtTick: tickCount };
};

export const updateImmortal = (state: ImmortalState, tickCount: number): ImmortalState => {
  if (!state.active) return state;
  if (state.activatedAtTick < 0) return state;
  if (tickCount - state.activatedAtTick >= IMMORTAL_DURATION_TICKS) {
    return { ...state, active: false, activatedAtTick: 0 };
  }
  return state;
};

export const onFoodEaten = (state: ImmortalState): ImmortalState => {
  const newFoodCount = state.foodSinceLastUse + 1;
  if (state.chargesRemaining < 1 && newFoodCount >= FOOD_TO_RECHARGE) {
    return { ...state, foodSinceLastUse: 0, chargesRemaining: 1 };
  }
  return { ...state, foodSinceLastUse: newFoodCount };
};

export const isImmortal = (state: ImmortalState): boolean => state.active;

export const immortalRemainingTicks = (state: ImmortalState, tickCount: number): number => {
  if (!state.active || state.activatedAtTick < 0) return 0;
  return Math.max(0, IMMORTAL_DURATION_TICKS - (tickCount - state.activatedAtTick));
};

export const immortalProgress = (state: ImmortalState, tickCount: number): number => {
  if (!state.active || state.activatedAtTick < 0) return 0;
  const elapsed = tickCount - state.activatedAtTick;
  return Math.min(1, elapsed / IMMORTAL_DURATION_TICKS);
};

export const IMMORTAL_DURATION = IMMORTAL_DURATION_TICKS;
export const RECHARGE_FOOD_COUNT = FOOD_TO_RECHARGE;
