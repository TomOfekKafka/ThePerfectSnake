import Phaser from 'phaser';
import {
  UpgradeState,
  UpgradeId,
  UPGRADE_DEFS,
  getUpgradeLevel,
} from '../game/upgrades';
import { THEME } from './gameTheme';

export interface UpgradeHudState {
  choiceAlpha: number;
  choicePulse: number;
  selectedFlash: number;
  ownedBarAlpha: number;
  newUpgradeGlow: number;
  lastOwnedCount: number;
}

export const createUpgradeHudState = (): UpgradeHudState => ({
  choiceAlpha: 0,
  choicePulse: 0,
  selectedFlash: 0,
  ownedBarAlpha: 0,
  newUpgradeGlow: 0,
  lastOwnedCount: 0,
});

const ICON_COLORS: Record<UpgradeId, number> = {
  SCORE_BOOST: 0xffd700,
  SWIFT_SCALES: 0x44ddff,
  FOOD_MAGNET: 0xff66aa,
  THICK_SKIN: 0x88cc44,
  COMBO_MASTER: 0xff8844,
};

const CHOICE_PANEL_BG = 0x0a0e1e;
const CHOICE_BORDER = 0x334466;

export const updateUpgradeHud = (
  hud: UpgradeHudState,
  upgrades: UpgradeState
): void => {
  hud.choicePulse += 0.06;

  if (upgrades.choice && upgrades.choice.active) {
    hud.choiceAlpha = Math.min(1, hud.choiceAlpha + 0.08);
  } else {
    hud.choiceAlpha = Math.max(0, hud.choiceAlpha - 0.1);
  }

  if (hud.selectedFlash > 0) {
    hud.selectedFlash -= 0.05;
  }

  const ownedCount = upgrades.owned.reduce((sum, u) => sum + u.level, 0);
  if (ownedCount > hud.lastOwnedCount) {
    hud.newUpgradeGlow = 1;
    hud.lastOwnedCount = ownedCount;
  }
  if (hud.newUpgradeGlow > 0) {
    hud.newUpgradeGlow -= 0.02;
  }

  if (upgrades.owned.length > 0) {
    hud.ownedBarAlpha = Math.min(0.9, hud.ownedBarAlpha + 0.05);
  }
};

const drawUpgradeIcon = (
  g: Phaser.GameObjects.Graphics,
  id: UpgradeId,
  x: number,
  y: number,
  size: number,
  alpha: number
): void => {
  const color = ICON_COLORS[id];
  const half = size / 2;

  g.fillStyle(0x0a0e1e, alpha * 0.85);
  g.fillCircle(x + half, y + half, half + 2);

  g.lineStyle(1.5, color, alpha * 0.7);
  g.strokeCircle(x + half, y + half, half);

  g.fillStyle(color, alpha * 0.9);

  switch (id) {
    case 'SCORE_BOOST':
      drawStarShape(g, x + half, y + half, half * 0.6, alpha);
      break;
    case 'SWIFT_SCALES':
      drawBoltShape(g, x + half, y + half, half * 0.55, alpha);
      break;
    case 'FOOD_MAGNET':
      drawMagnetShape(g, x + half, y + half, half * 0.5, alpha);
      break;
    case 'THICK_SKIN':
      drawShieldShape(g, x + half, y + half, half * 0.55, alpha);
      break;
    case 'COMBO_MASTER':
      drawFlameShape(g, x + half, y + half, half * 0.55, alpha);
      break;
  }
};

const drawStarShape = (
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  r: number,
  _alpha: number
): void => {
  g.fillRect(cx - r * 0.15, cy - r, r * 0.3, r * 2);
  g.fillRect(cx - r, cy - r * 0.15, r * 2, r * 0.3);
  g.fillRect(cx - r * 0.6, cy - r * 0.6, r * 0.3, r * 0.3);
  g.fillRect(cx + r * 0.3, cy - r * 0.6, r * 0.3, r * 0.3);
  g.fillRect(cx - r * 0.6, cy + r * 0.3, r * 0.3, r * 0.3);
  g.fillRect(cx + r * 0.3, cy + r * 0.3, r * 0.3, r * 0.3);
};

const drawBoltShape = (
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  r: number,
  _alpha: number
): void => {
  g.fillRect(cx - r * 0.1, cy - r, r * 0.5, r * 0.8);
  g.fillRect(cx - r * 0.4, cy - r * 0.2, r * 0.8, r * 0.3);
  g.fillRect(cx - r * 0.3, cy + r * 0.1, r * 0.5, r * 0.8);
};

const drawMagnetShape = (
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  r: number,
  _alpha: number
): void => {
  g.fillRect(cx - r, cy - r, r * 0.35, r * 1.6);
  g.fillRect(cx + r * 0.65, cy - r, r * 0.35, r * 1.6);
  g.fillRect(cx - r, cy + r * 0.3, r * 2, r * 0.35);
};

const drawShieldShape = (
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  r: number,
  _alpha: number
): void => {
  g.fillRect(cx - r * 0.8, cy - r, r * 1.6, r * 0.3);
  g.fillRect(cx - r * 0.8, cy - r, r * 0.25, r * 1.4);
  g.fillRect(cx + r * 0.55, cy - r, r * 0.25, r * 1.4);
  g.fillRect(cx - r * 0.55, cy + r * 0.4, r * 1.1, r * 0.3);
  g.fillRect(cx - r * 0.15, cy + r * 0.4, r * 0.3, r * 0.6);
};

const drawFlameShape = (
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  r: number,
  _alpha: number
): void => {
  g.fillRect(cx - r * 0.3, cy - r * 0.2, r * 0.6, r * 1.1);
  g.fillRect(cx - r * 0.5, cy, r * 0.3, r * 0.6);
  g.fillRect(cx + r * 0.2, cy - r * 0.5, r * 0.3, r * 0.6);
  g.fillRect(cx - r * 0.15, cy - r * 0.8, r * 0.3, r * 0.4);
};

export const drawUpgradeChoicePanel = (
  g: Phaser.GameObjects.Graphics,
  hud: UpgradeHudState,
  upgrades: UpgradeState,
  width: number,
  height: number,
  drawText: (g: Phaser.GameObjects.Graphics, text: string, x: number, y: number, size: number, color: number, alpha: number) => void
): void => {
  if (hud.choiceAlpha <= 0 || !upgrades.choice) return;

  const alpha = hud.choiceAlpha;
  const options = upgrades.choice.options;
  const panelW = Math.min(width - 20, 180);
  const optionH = 28;
  const panelH = options.length * optionH + 30;
  const panelX = (width - panelW) / 2;
  const panelY = height * 0.35 - panelH / 2;

  g.fillStyle(CHOICE_PANEL_BG, alpha * 0.92);
  g.fillRoundedRect(panelX, panelY, panelW, panelH, 6);

  const borderPulse = 0.5 + Math.sin(hud.choicePulse) * 0.3;
  g.lineStyle(2, THEME.effects.sparkle, alpha * borderPulse);
  g.strokeRoundedRect(panelX, panelY, panelW, panelH, 6);

  drawText(g, 'UPGRADE', panelX + panelW / 2 - 24, panelY + 10, 8, THEME.hud.text, alpha * 0.9);

  for (let i = 0; i < options.length; i++) {
    const id = options[i];
    const def = UPGRADE_DEFS[id];
    const level = getUpgradeLevel(upgrades, id);
    const optY = panelY + 24 + i * optionH;

    const hoverPulse = 0.6 + Math.sin(hud.choicePulse + i * 1.2) * 0.15;

    g.fillStyle(ICON_COLORS[id], alpha * 0.08);
    g.fillRoundedRect(panelX + 4, optY, panelW - 8, optionH - 3, 4);
    g.lineStyle(1, ICON_COLORS[id], alpha * 0.3 * hoverPulse);
    g.strokeRoundedRect(panelX + 4, optY, panelW - 8, optionH - 3, 4);

    drawUpgradeIcon(g, id, panelX + 8, optY + 3, 18, alpha);

    drawText(g, def.name, panelX + 32, optY + 7, 7, ICON_COLORS[id], alpha * 0.95);

    const keyLabel = String(i + 1);
    g.fillStyle(THEME.hud.textDim, alpha * 0.5);
    g.fillRoundedRect(panelX + panelW - 24, optY + 5, 16, 16, 3);
    drawText(g, keyLabel, panelX + panelW - 20, optY + 9, 6, THEME.hud.text, alpha * 0.8);

    const lvlStr = 'L' + String(level + 1);
    drawText(g, lvlStr, panelX + panelW - 46, optY + 9, 5, THEME.hud.textDim, alpha * 0.6);
  }
};

export const drawOwnedUpgradesBar = (
  g: Phaser.GameObjects.Graphics,
  hud: UpgradeHudState,
  upgrades: UpgradeState,
  height: number,
  frameCount: number
): void => {
  if (upgrades.owned.length === 0) return;

  const alpha = hud.ownedBarAlpha;
  const iconSize = 16;
  const spacing = 4;
  const startX = 6;
  const startY = height - iconSize - 8;

  for (let i = 0; i < upgrades.owned.length; i++) {
    const owned = upgrades.owned[i];
    const x = startX + i * (iconSize + spacing);
    const y = startY;
    const color = ICON_COLORS[owned.id];
    const pulse = 0.7 + Math.sin(frameCount * 0.04 + i * 0.8) * 0.2;

    if (hud.newUpgradeGlow > 0 && i === upgrades.owned.length - 1) {
      g.fillStyle(color, hud.newUpgradeGlow * 0.3);
      g.fillCircle(x + iconSize / 2, y + iconSize / 2, iconSize);
    }

    drawUpgradeIcon(g, owned.id, x, y, iconSize, alpha * pulse);

    if (owned.level > 1) {
      const lvlX = x + iconSize - 2;
      const lvlY = y - 2;
      g.fillStyle(0x0a0e1e, alpha * 0.9);
      g.fillCircle(lvlX, lvlY, 5);
      g.fillStyle(color, alpha * 0.85);
      g.fillCircle(lvlX, lvlY, 3.5);
      g.fillStyle(0x0a0e1e, alpha * 0.8);
      g.fillCircle(lvlX, lvlY, 2);
      g.fillStyle(color, alpha * 0.9);
      g.fillRect(lvlX - 1, lvlY - 1, 2, 2);
    }
  }
};
