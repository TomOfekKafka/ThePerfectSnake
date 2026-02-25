export interface FoodType {
  name: string;
  bodyColor: number;
  glowColor: number;
  highlightColor: number;
  orbitColors: number[];
  shape: 'circle' | 'diamond' | 'star' | 'hexagon' | 'crescent';
}

const FOOD_TYPES: FoodType[] = [
  {
    name: 'ember',
    bodyColor: 0xff6600,
    glowColor: 0xff8800,
    highlightColor: 0xffcc44,
    orbitColors: [0xff4444, 0xff6633, 0xcc0000, 0xff2222, 0xdd3311, 0xaa0000],
    shape: 'circle',
  },
  {
    name: 'sapphire',
    bodyColor: 0x2266ff,
    glowColor: 0x4488ff,
    highlightColor: 0x88ccff,
    orbitColors: [0x4488ff, 0x2266dd, 0x0044cc, 0x66aaff, 0x3366ee, 0x1155bb],
    shape: 'diamond',
  },
  {
    name: 'emerald',
    bodyColor: 0x22cc44,
    glowColor: 0x44ee66,
    highlightColor: 0x88ffaa,
    orbitColors: [0x44ee66, 0x22cc44, 0x00aa22, 0x66ff88, 0x33dd55, 0x11bb33],
    shape: 'hexagon',
  },
  {
    name: 'amethyst',
    bodyColor: 0xaa44ff,
    glowColor: 0xcc66ff,
    highlightColor: 0xddaaff,
    orbitColors: [0xcc66ff, 0xaa44dd, 0x8822cc, 0xdd88ff, 0xbb55ee, 0x9933bb],
    shape: 'star',
  },
  {
    name: 'ruby',
    bodyColor: 0xff2244,
    glowColor: 0xff4466,
    highlightColor: 0xff88aa,
    orbitColors: [0xff4466, 0xdd2244, 0xcc0033, 0xff6688, 0xee3355, 0xbb1133],
    shape: 'crescent',
  },
  {
    name: 'gold',
    bodyColor: 0xffcc00,
    glowColor: 0xffdd44,
    highlightColor: 0xffeeaa,
    orbitColors: [0xffdd44, 0xeebb00, 0xddaa00, 0xffee66, 0xffcc22, 0xcc9900],
    shape: 'diamond',
  },
  {
    name: 'cyan',
    bodyColor: 0x00cccc,
    glowColor: 0x22eeee,
    highlightColor: 0x88ffff,
    orbitColors: [0x22eeee, 0x00cccc, 0x00aaaa, 0x44ffff, 0x11dddd, 0x00bbbb],
    shape: 'star',
  },
  {
    name: 'rose',
    bodyColor: 0xff66aa,
    glowColor: 0xff88cc,
    highlightColor: 0xffbbdd,
    orbitColors: [0xff88cc, 0xff66aa, 0xdd4488, 0xffaadd, 0xff77bb, 0xcc3377],
    shape: 'hexagon',
  },
];

export const FOOD_TYPE_COUNT = FOOD_TYPES.length;

export function pickFoodType(foodEaten: number): FoodType {
  return FOOD_TYPES[foodEaten % FOOD_TYPES.length];
}

export function getFoodTypes(): readonly FoodType[] {
  return FOOD_TYPES;
}
