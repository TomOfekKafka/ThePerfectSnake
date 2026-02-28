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
    name: 'violet',
    bodyColor: 0xaa44dd,
    glowColor: 0xcc66ff,
    highlightColor: 0xddaaff,
    orbitColors: [0xcc66ff, 0xaa44dd, 0x8822bb, 0xdd88ff, 0xbb55ee, 0x9933cc],
    shape: 'circle',
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
    name: 'mint',
    bodyColor: 0x33ddaa,
    glowColor: 0x55eecc,
    highlightColor: 0x99ffdd,
    orbitColors: [0x55eecc, 0x33ddaa, 0x22bb88, 0x77ffdd, 0x44eebb, 0x22cc99],
    shape: 'diamond',
  },
  {
    name: 'magenta',
    bodyColor: 0xdd44aa,
    glowColor: 0xee66cc,
    highlightColor: 0xffaadd,
    orbitColors: [0xee66cc, 0xdd44aa, 0xbb2288, 0xff88dd, 0xee55bb, 0xcc3399],
    shape: 'star',
  },
  {
    name: 'jade',
    bodyColor: 0x44aa66,
    glowColor: 0x66cc88,
    highlightColor: 0xaaeebb,
    orbitColors: [0x66cc88, 0x44aa66, 0x228844, 0x88ddaa, 0x55bb77, 0x339955],
    shape: 'crescent',
  },
  {
    name: 'orchid',
    bodyColor: 0xcc66dd,
    glowColor: 0xdd88ee,
    highlightColor: 0xeebbff,
    orbitColors: [0xdd88ee, 0xcc66dd, 0xaa44bb, 0xeeaaff, 0xdd77ee, 0xbb55cc],
    shape: 'diamond',
  },
  {
    name: 'seafoam',
    bodyColor: 0x44ccaa,
    glowColor: 0x66eebb,
    highlightColor: 0xaaffdd,
    orbitColors: [0x66eebb, 0x44ccaa, 0x22aa88, 0x88ffcc, 0x55ddbb, 0x33bbaa],
    shape: 'star',
  },
  {
    name: 'plum',
    bodyColor: 0x8833aa,
    glowColor: 0xaa55cc,
    highlightColor: 0xcc88ee,
    orbitColors: [0xaa55cc, 0x8833aa, 0x662288, 0xcc77ee, 0x9944bb, 0x773399],
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
