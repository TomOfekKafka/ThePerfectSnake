export type UpgradeId =
  | 'SCORE_BOOST'
  | 'SWIFT_SCALES'
  | 'FOOD_MAGNET'
  | 'THICK_SKIN'
  | 'COMBO_MASTER';

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  maxLevel: number;
  description: string;
}

export interface OwnedUpgrade {
  id: UpgradeId;
  level: number;
}

export interface UpgradeChoice {
  options: UpgradeId[];
  active: boolean;
}

export interface UpgradeState {
  owned: OwnedUpgrade[];
  choice: UpgradeChoice | null;
  lastMilestone: number;
  totalUpgradesPicked: number;
}

const UPGRADE_MILESTONE_INTERVAL = 5;
const UPGRADE_CHOICES_COUNT = 3;

export const UPGRADE_DEFS: Record<UpgradeId, UpgradeDefinition> = {
  SCORE_BOOST: {
    id: 'SCORE_BOOST',
    name: 'SCORE+',
    maxLevel: 5,
    description: '+20% score per level',
  },
  SWIFT_SCALES: {
    id: 'SWIFT_SCALES',
    name: 'SWIFT',
    maxLevel: 3,
    description: 'Shorter power-up cooldown',
  },
  FOOD_MAGNET: {
    id: 'FOOD_MAGNET',
    name: 'MAGNET',
    maxLevel: 3,
    description: 'Food spawns closer to you',
  },
  THICK_SKIN: {
    id: 'THICK_SKIN',
    name: 'ARMOR',
    maxLevel: 2,
    description: 'Survive one wall hit',
  },
  COMBO_MASTER: {
    id: 'COMBO_MASTER',
    name: 'COMBO',
    maxLevel: 4,
    description: '+1 combo multiplier cap',
  },
};

const ALL_UPGRADE_IDS: UpgradeId[] = [
  'SCORE_BOOST',
  'SWIFT_SCALES',
  'FOOD_MAGNET',
  'THICK_SKIN',
  'COMBO_MASTER',
];

export const createUpgradeState = (): UpgradeState => ({
  owned: [],
  choice: null,
  lastMilestone: 0,
  totalUpgradesPicked: 0,
});

export const getUpgradeLevel = (state: UpgradeState, id: UpgradeId): number => {
  const found = state.owned.find(u => u.id === id);
  return found ? found.level : 0;
};

const getAvailableUpgrades = (state: UpgradeState): UpgradeId[] =>
  ALL_UPGRADE_IDS.filter(id => {
    const def = UPGRADE_DEFS[id];
    const level = getUpgradeLevel(state, id);
    return level < def.maxLevel;
  });

const pickRandomUpgrades = (available: UpgradeId[], count: number): UpgradeId[] => {
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
};

export const shouldOfferUpgrade = (foodEaten: number, lastMilestone: number): boolean => {
  if (foodEaten <= 0) return false;
  const currentMilestone = Math.floor(foodEaten / UPGRADE_MILESTONE_INTERVAL);
  return currentMilestone > lastMilestone;
};

export const createUpgradeChoice = (state: UpgradeState): UpgradeState => {
  const available = getAvailableUpgrades(state);
  if (available.length === 0) return state;

  const options = pickRandomUpgrades(available, Math.min(UPGRADE_CHOICES_COUNT, available.length));
  return {
    ...state,
    choice: { options, active: true },
  };
};

export const selectUpgrade = (state: UpgradeState, id: UpgradeId): UpgradeState => {
  if (!state.choice || !state.choice.active) return state;
  if (!state.choice.options.includes(id)) return state;

  const currentLevel = getUpgradeLevel(state, id);
  const def = UPGRADE_DEFS[id];
  if (currentLevel >= def.maxLevel) return state;

  const existingIndex = state.owned.findIndex(u => u.id === id);
  const newOwned = [...state.owned];
  if (existingIndex >= 0) {
    newOwned[existingIndex] = { ...newOwned[existingIndex], level: currentLevel + 1 };
  } else {
    newOwned.push({ id, level: 1 });
  }

  return {
    ...state,
    owned: newOwned,
    choice: null,
    totalUpgradesPicked: state.totalUpgradesPicked + 1,
  };
};

export const tickUpgrades = (state: UpgradeState, foodEaten: number): UpgradeState => {
  if (state.choice && state.choice.active) return state;

  if (shouldOfferUpgrade(foodEaten, state.lastMilestone)) {
    const milestone = Math.floor(foodEaten / UPGRADE_MILESTONE_INTERVAL);
    const withMilestone = { ...state, lastMilestone: milestone };
    return createUpgradeChoice(withMilestone);
  }

  return state;
};

export const getScoreMultiplier = (state: UpgradeState): number => {
  const level = getUpgradeLevel(state, 'SCORE_BOOST');
  return 1 + level * 0.2;
};

export const hasThickSkinCharge = (state: UpgradeState): boolean =>
  getUpgradeLevel(state, 'THICK_SKIN') > 0;
