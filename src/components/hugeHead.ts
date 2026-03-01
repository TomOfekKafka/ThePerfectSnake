export interface HugeHeadState {
  bitePhase: number;
  biteSpeed: number;
  chompTimer: number;
  isChomping: boolean;
  chompIntensity: number;
  headPulse: number;
  droolDrops: DroolDrop[];
}

interface DroolDrop {
  x: number;
  y: number;
  vy: number;
  life: number;
  size: number;
}

const MAX_DROOL = 12;
const HEAD_SCALE_MULTIPLIER = 1.6;
const CHOMP_DURATION = 18;

export function createHugeHeadState(): HugeHeadState {
  return {
    bitePhase: 0,
    biteSpeed: 0.12,
    chompTimer: 0,
    isChomping: false,
    chompIntensity: 0,
    headPulse: 0,
    droolDrops: [],
  };
}

export function computeHugeHeadScale(frameCount: number, state: HugeHeadState): number {
  const basePulse = 1.0 + Math.sin(frameCount * 0.06) * 0.06;
  const chompBulge = state.isChomping ? 1.0 + state.chompIntensity * 0.15 : 1.0;
  return HEAD_SCALE_MULTIPLIER * basePulse * chompBulge;
}

export function computeBiteAngle(frameCount: number, state: HugeHeadState): number {
  const idleBite = Math.sin(frameCount * state.biteSpeed) * 0.25;
  const chompAngle = state.isChomping ? Math.sin(state.chompTimer * 0.5) * 0.6 * state.chompIntensity : 0;
  return idleBite + chompAngle;
}

export function triggerChomp(state: HugeHeadState): HugeHeadState {
  return {
    ...state,
    isChomping: true,
    chompTimer: CHOMP_DURATION,
    chompIntensity: 1.0,
  };
}

export function updateHugeHead(state: HugeHeadState, fx: number, fy: number): HugeHeadState {
  const bitePhase = state.bitePhase + state.biteSpeed;
  let chompTimer = state.chompTimer;
  let isChomping = state.isChomping;
  let chompIntensity = state.chompIntensity;

  if (isChomping) {
    chompTimer--;
    chompIntensity *= 0.92;
    if (chompTimer <= 0) {
      isChomping = false;
      chompIntensity = 0;
    }
  }

  const droolDrops = state.droolDrops
    .map(d => ({
      ...d,
      y: d.y + d.vy,
      vy: d.vy + 0.15,
      life: d.life - 0.04,
      size: d.size * 0.97,
    }))
    .filter(d => d.life > 0);

  if (isChomping && droolDrops.length < MAX_DROOL) {
    droolDrops.push({
      x: fx + (Math.random() - 0.5) * 6,
      y: fy,
      vy: Math.random() * 1.5 + 0.5,
      life: 1.0,
      size: 1.5 + Math.random() * 2,
    });
  }

  return {
    bitePhase,
    biteSpeed: state.biteSpeed,
    chompTimer,
    isChomping,
    chompIntensity,
    headPulse: state.headPulse,
    droolDrops,
  };
}

export function getHugeHeadScaleMultiplier(): number {
  return HEAD_SCALE_MULTIPLIER;
}
