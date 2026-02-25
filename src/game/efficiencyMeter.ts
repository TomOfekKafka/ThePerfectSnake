export type EfficiencyGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface EfficiencySnapshot {
  grade: EfficiencyGrade;
  ratio: number;
  streak: number;
  perfectStreak: boolean;
}

const GRADE_THRESHOLDS: { min: number; grade: EfficiencyGrade }[] = [
  { min: 8, grade: 'S' },
  { min: 6, grade: 'A' },
  { min: 4, grade: 'B' },
  { min: 2, grade: 'C' },
  { min: 0, grade: 'D' },
];

export const computeEfficiencyRatio = (score: number, snakeLength: number): number => {
  if (snakeLength <= 1) return 0;
  return score / snakeLength;
};

export const computeGrade = (ratio: number): EfficiencyGrade => {
  for (const threshold of GRADE_THRESHOLDS) {
    if (ratio >= threshold.min) return threshold.grade;
  }
  return 'D';
};

export const computeEfficiency = (
  score: number,
  snakeLength: number,
  foodEaten: number,
  previousStreak: number
): EfficiencySnapshot => {
  const ratio = computeEfficiencyRatio(score, snakeLength);
  const grade = computeGrade(ratio);
  const isGoodGrade = grade === 'S' || grade === 'A';
  const streak = isGoodGrade ? previousStreak + 1 : 0;
  const perfectStreak = streak >= 5;
  return { grade, ratio, streak, perfectStreak };
};

export const gradeToColor = (grade: EfficiencyGrade): number => {
  switch (grade) {
    case 'S': return 0xffd700;
    case 'A': return 0x44ffaa;
    case 'B': return 0x4488ff;
    case 'C': return 0xff8844;
    case 'D': return 0xff4444;
  }
};

export const gradeToLabel = (grade: EfficiencyGrade): string => {
  switch (grade) {
    case 'S': return 'OPTIMAL';
    case 'A': return 'CLEAN';
    case 'B': return 'GOOD';
    case 'C': return 'MESSY';
    case 'D': return 'BUGGY';
  }
};
