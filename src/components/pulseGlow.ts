const MAX_PULSES = 8;

export interface PulseGlow {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  hue: number;
  intensity: number;
}

export interface PulseGlowState {
  pulses: PulseGlow[];
}

export function createPulseGlowState(): PulseGlowState {
  return { pulses: [] };
}

export function spawnPulseGlow(
  state: PulseGlowState,
  x: number,
  y: number,
  intensity: number,
  hue: number
): void {
  if (state.pulses.length >= MAX_PULSES) {
    state.pulses.shift();
  }
  state.pulses.push({
    x,
    y,
    radius: 4,
    maxRadius: 50 + intensity * 30,
    life: 1.0,
    hue,
    intensity: Math.min(intensity, 1.5),
  });
}

export function updatePulseGlows(state: PulseGlowState): void {
  for (let i = state.pulses.length - 1; i >= 0; i--) {
    const pulse = state.pulses[i];
    const speed = 2.5 + (1 - pulse.life) * 3;
    pulse.radius += speed;
    pulse.life -= 0.035;

    if (pulse.life <= 0 || pulse.radius > pulse.maxRadius) {
      state.pulses.splice(i, 1);
    }
  }
}

function hueToRgb(hue: number): number {
  const h = ((hue % 360) + 360) % 360;
  const s = 0.9;
  const l = 0.6;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);

  return (ri << 16) | (gi << 8) | bi;
}

export function drawPulseGlows(
  g: Phaser.GameObjects.Graphics,
  state: PulseGlowState
): void {
  for (const pulse of state.pulses) {
    const eased = pulse.life * pulse.life;
    const color = hueToRgb(pulse.hue);
    const ringCount = 3;

    for (let r = 0; r < ringCount; r++) {
      const offset = r * 6;
      const ringRadius = pulse.radius + offset;
      const alpha = eased * pulse.intensity * 0.35 * (1 - r * 0.25);
      const thickness = (3 - r * 0.8) * eased;

      if (alpha > 0.01 && thickness > 0.1) {
        g.lineStyle(thickness, color, alpha);
        g.strokeCircle(pulse.x, pulse.y, ringRadius);
      }
    }

    const coreAlpha = eased * pulse.intensity * 0.15;
    if (coreAlpha > 0.01) {
      g.fillStyle(color, coreAlpha);
      g.fillCircle(pulse.x, pulse.y, pulse.radius * 0.6);
    }
  }
}
