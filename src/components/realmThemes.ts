export interface RealmColors {
  bgDeep: number;
  bgMid: number;
  bgLight: number;
  gridLine: number;
  gridDot: number;
  snakeHead: number;
  snakeBody: number;
  snakeTail: number;
  snakeGlow: number;
  foodGlow: number;
  particleA: number;
  particleB: number;
  portalCore: number;
  portalRing: number;
  name: string;
}

const REALMS: RealmColors[] = [
  {
    name: 'Emerald Sanctum',
    bgDeep: 0x040d08,
    bgMid: 0x0a1a10,
    bgLight: 0x122818,
    gridLine: 0x1a3024,
    gridDot: 0x2a4434,
    snakeHead: 0x22dd66,
    snakeBody: 0x1ab854,
    snakeTail: 0x14a044,
    snakeGlow: 0x44ffaa,
    foodGlow: 0xcc44ee,
    particleA: 0x44ffaa,
    particleB: 0xcc66ee,
    portalCore: 0x8844ff,
    portalRing: 0xaa66ff,
  },
  {
    name: 'Crystal Cavern',
    bgDeep: 0x050818,
    bgMid: 0x0c1430,
    bgLight: 0x162050,
    gridLine: 0x203060,
    gridDot: 0x304880,
    snakeHead: 0x44ddff,
    snakeBody: 0x2299cc,
    snakeTail: 0x1a77aa,
    snakeGlow: 0x66eeff,
    foodGlow: 0xff44aa,
    particleA: 0x66eeff,
    particleB: 0xaaddff,
    portalCore: 0xff6644,
    portalRing: 0xff9944,
  },
  {
    name: 'Inferno Depths',
    bgDeep: 0x180404,
    bgMid: 0x2a0808,
    bgLight: 0x3d1010,
    gridLine: 0x4d1a1a,
    gridDot: 0x662020,
    snakeHead: 0xff6622,
    snakeBody: 0xdd4411,
    snakeTail: 0xaa3308,
    snakeGlow: 0xff8844,
    foodGlow: 0xffdd22,
    particleA: 0xff6622,
    particleB: 0xffaa44,
    portalCore: 0x22ccff,
    portalRing: 0x44aaff,
  },
  {
    name: 'Void Abyss',
    bgDeep: 0x020208,
    bgMid: 0x060618,
    bgLight: 0x0c0c28,
    gridLine: 0x161640,
    gridDot: 0x222255,
    snakeHead: 0xcc44ff,
    snakeBody: 0x9933cc,
    snakeTail: 0x7722aa,
    snakeGlow: 0xdd66ff,
    foodGlow: 0x44ffcc,
    particleA: 0xcc44ff,
    particleB: 0x8866ff,
    portalCore: 0x44ff88,
    portalRing: 0x66ffaa,
  },
  {
    name: 'Neon Cityscape',
    bgDeep: 0x0a0a14,
    bgMid: 0x141428,
    bgLight: 0x1e1e3c,
    gridLine: 0x2a2a50,
    gridDot: 0x3a3a66,
    snakeHead: 0xff22aa,
    snakeBody: 0xdd1188,
    snakeTail: 0xaa0066,
    snakeGlow: 0xff44cc,
    foodGlow: 0x22ffaa,
    particleA: 0xff22aa,
    particleB: 0x22ffaa,
    portalCore: 0xffff22,
    portalRing: 0xffcc44,
  },
  {
    name: 'Frozen Tundra',
    bgDeep: 0x081018,
    bgMid: 0x101828,
    bgLight: 0x182438,
    gridLine: 0x203450,
    gridDot: 0x2a4460,
    snakeHead: 0x88ddff,
    snakeBody: 0x66bbdd,
    snakeTail: 0x4499bb,
    snakeGlow: 0xaaeeff,
    foodGlow: 0xff8844,
    particleA: 0x88ddff,
    particleB: 0xccf0ff,
    portalCore: 0xff6622,
    portalRing: 0xff8844,
  },
];

export const REALM_COUNT = REALMS.length;

export const getRealmColors = (realmIndex: number): RealmColors =>
  REALMS[realmIndex % REALMS.length];
