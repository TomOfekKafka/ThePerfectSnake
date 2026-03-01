import { describe, it, expect } from 'vitest';
import {
  createSpaceBackgroundState,
  createWarpStar,
  createNebulaBlob,
  initSpaceBackground,
  updateWarpStars,
  updateNebulae,
  updateCosmicDust,
  updateSpaceBackground,
} from '../components/spaceBackground';

describe('spaceBackground', () => {
  describe('createSpaceBackgroundState', () => {
    it('creates empty state', () => {
      const state = createSpaceBackgroundState();
      expect(state.warpStars).toEqual([]);
      expect(state.nebulae).toEqual([]);
      expect(state.dust).toEqual([]);
      expect(state.warpSpeed).toBe(1.0);
      expect(state.frameCount).toBe(0);
    });
  });

  describe('createWarpStar', () => {
    it('creates a star with valid depth', () => {
      const star = createWarpStar(400, 400);
      expect(star.z).toBeGreaterThan(0);
      expect(star.z).toBeLessThanOrEqual(410);
      expect(star.speed).toBeGreaterThan(0);
      expect(star.brightness).toBeGreaterThan(0);
    });
  });

  describe('createNebulaBlob', () => {
    it('creates a nebula within bounds', () => {
      const neb = createNebulaBlob(400, 400);
      expect(neb.x).toBeGreaterThanOrEqual(0);
      expect(neb.x).toBeLessThanOrEqual(400);
      expect(neb.y).toBeGreaterThanOrEqual(0);
      expect(neb.y).toBeLessThanOrEqual(400);
      expect(neb.radius).toBeGreaterThan(0);
      expect(neb.alpha).toBeGreaterThan(0);
    });
  });

  describe('initSpaceBackground', () => {
    it('populates all particle arrays', () => {
      const state = createSpaceBackgroundState();
      initSpaceBackground(state, 400, 400);
      expect(state.warpStars.length).toBe(60);
      expect(state.nebulae.length).toBe(5);
      expect(state.dust.length).toBe(25);
    });
  });

  describe('updateWarpStars', () => {
    it('moves stars closer (decreases z)', () => {
      const state = createSpaceBackgroundState();
      initSpaceBackground(state, 400, 400);
      state.warpStars[0].x = 10;
      state.warpStars[0].y = 10;
      state.warpStars[0].z = 200;
      state.warpStars[0].speed = 2;
      const initialZ = state.warpStars[0].z;
      updateWarpStars(state, 400, 400);
      expect(state.warpStars[0].z).toBeLessThan(initialZ);
    });

    it('resets stars that reach z <= 1', () => {
      const state = createSpaceBackgroundState();
      initSpaceBackground(state, 400, 400);
      state.warpStars[0].z = 1;
      updateWarpStars(state, 400, 400);
      expect(state.warpStars[0].z).toBeGreaterThan(100);
    });
  });

  describe('updateNebulae', () => {
    it('drifts nebulae by their velocity', () => {
      const state = createSpaceBackgroundState();
      initSpaceBackground(state, 400, 400);
      const initialX = state.nebulae[0].x;
      const driftX = state.nebulae[0].driftX;
      updateNebulae(state, 400, 400);
      expect(state.nebulae[0].x).toBeCloseTo(initialX + driftX, 5);
    });

    it('advances pulse phase', () => {
      const state = createSpaceBackgroundState();
      initSpaceBackground(state, 400, 400);
      const initialPhase = state.nebulae[0].pulsePhase;
      const speed = state.nebulae[0].pulseSpeed;
      updateNebulae(state, 400, 400);
      expect(state.nebulae[0].pulsePhase).toBeCloseTo(initialPhase + speed, 5);
    });

    it('wraps nebulae around edges', () => {
      const state = createSpaceBackgroundState();
      initSpaceBackground(state, 400, 400);
      state.nebulae[0].x = 500;
      state.nebulae[0].driftX = 1;
      state.nebulae[0].radius = 50;
      updateNebulae(state, 400, 400);
      expect(state.nebulae[0].x).toBe(-50);
    });
  });

  describe('updateCosmicDust', () => {
    it('moves dust by velocity', () => {
      const state = createSpaceBackgroundState();
      initSpaceBackground(state, 400, 400);
      const initialX = state.dust[0].x;
      const vx = state.dust[0].vx;
      updateCosmicDust(state, 400, 400);
      expect(state.dust[0].x).toBeCloseTo(initialX + vx, 5);
    });

    it('wraps dust around edges', () => {
      const state = createSpaceBackgroundState();
      initSpaceBackground(state, 400, 400);
      state.dust[0].x = -1;
      state.dust[0].vx = -1;
      updateCosmicDust(state, 400, 400);
      expect(state.dust[0].x).toBe(400);
    });
  });

  describe('updateSpaceBackground', () => {
    it('increments frame count', () => {
      const state = createSpaceBackgroundState();
      initSpaceBackground(state, 400, 400);
      updateSpaceBackground(state, 400, 400);
      expect(state.frameCount).toBe(1);
    });

    it('updates all subsystems', () => {
      const state = createSpaceBackgroundState();
      initSpaceBackground(state, 400, 400);
      const starZ = state.warpStars[0].z;
      const nebX = state.nebulae[0].x;
      const dustX = state.dust[0].x;
      updateSpaceBackground(state, 400, 400);
      expect(state.warpStars[0].z).not.toBe(starZ);
      expect(state.nebulae[0].x).not.toBe(nebX);
      expect(state.dust[0].x).not.toBe(dustX);
    });
  });
});
