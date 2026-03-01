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
    name: 'silver',
    bodyColor: 0xc0c0c8,
    glowColor: 0xd8d8e0,
    highlightColor: 0xf0f0f8,
    orbitColors: [0xd8d8e0, 0xc0c0c8, 0xa0a0a8, 0xe8e8f0, 0xb0b0b8, 0x909098],
    shape: 'circle',
  },
  {
    name: 'smoke',
    bodyColor: 0x606068,
    glowColor: 0x808088,
    highlightColor: 0xa0a0a8,
    orbitColors: [0x808088, 0x606068, 0x484850, 0x909098, 0x707078, 0x585860],
    shape: 'hexagon',
  },
  {
    name: 'ash',
    bodyColor: 0x888890,
    glowColor: 0xa8a8b0,
    highlightColor: 0xc8c8d0,
    orbitColors: [0xa8a8b0, 0x888890, 0x686870, 0xb8b8c0, 0x989898, 0x787880],
    shape: 'diamond',
  },
  {
    name: 'pearl',
    bodyColor: 0xd8d0c8,
    glowColor: 0xe8e0d8,
    highlightColor: 0xf8f0e8,
    orbitColors: [0xe8e0d8, 0xd8d0c8, 0xc0b8b0, 0xf0e8e0, 0xe0d8d0, 0xc8c0b8],
    shape: 'star',
  },
  {
    name: 'iron',
    bodyColor: 0x505058,
    glowColor: 0x707078,
    highlightColor: 0x909098,
    orbitColors: [0x707078, 0x505058, 0x383840, 0x808088, 0x606068, 0x484850],
    shape: 'crescent',
  },
  {
    name: 'fog',
    bodyColor: 0x9898a0,
    glowColor: 0xb8b8c0,
    highlightColor: 0xd8d8e0,
    orbitColors: [0xb8b8c0, 0x9898a0, 0x787880, 0xc8c8d0, 0xa8a8b0, 0x888890],
    shape: 'diamond',
  },
  {
    name: 'pewter',
    bodyColor: 0x707880,
    glowColor: 0x909898,
    highlightColor: 0xb0b8b8,
    orbitColors: [0x909898, 0x707880, 0x586060, 0xa0a8a8, 0x808888, 0x687070],
    shape: 'star',
  },
  {
    name: 'shadow',
    bodyColor: 0x404048,
    glowColor: 0x606068,
    highlightColor: 0x808088,
    orbitColors: [0x606068, 0x404048, 0x282830, 0x707078, 0x505058, 0x383840],
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
