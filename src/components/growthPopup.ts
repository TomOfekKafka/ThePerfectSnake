export interface GrowthPopup {
  x: number;
  y: number;
  amount: number;
  life: number;
  scale: number;
}

export interface GrowthPopupState {
  popups: GrowthPopup[];
}

export const createGrowthPopupState = (): GrowthPopupState => ({
  popups: [],
});

export const spawnGrowthPopup = (
  state: GrowthPopupState,
  x: number,
  y: number,
  amount: number
): void => {
  if (amount <= 1) return;
  state.popups.push({
    x,
    y,
    amount,
    life: 1.0,
    scale: 0.0,
  });
};

export const updateGrowthPopups = (state: GrowthPopupState): void => {
  for (const popup of state.popups) {
    popup.life -= 0.018;
    popup.y -= 0.8;
    popup.scale = Math.min(1.0, popup.scale + 0.12);
  }
  state.popups = state.popups.filter(p => p.life > 0);
};

const COLOR_BY_AMOUNT: Record<number, number> = {
  2: 0x44ff88,
  3: 0x44ccff,
  4: 0xff88ff,
  5: 0xffaa22,
};

const GLOW_BY_AMOUNT: Record<number, number> = {
  2: 0x22aa44,
  3: 0x2266aa,
  4: 0xaa44aa,
  5: 0xcc6600,
};

export const drawGrowthPopups = (
  g: Phaser.GameObjects.Graphics,
  state: GrowthPopupState,
  drawText: (g: Phaser.GameObjects.Graphics, text: string, x: number, y: number, size: number, color: number, alpha: number) => void
): void => {
  for (const popup of state.popups) {
    const alpha = Math.min(1.0, popup.life * 2);
    const scale = popup.scale;
    const color = COLOR_BY_AMOUNT[popup.amount] ?? 0xffffff;
    const glow = GLOW_BY_AMOUNT[popup.amount] ?? 0x888888;
    const size = 10 + popup.amount * 2;
    const scaledSize = Math.round(size * scale);

    g.fillStyle(glow, alpha * 0.4);
    g.fillCircle(popup.x, popup.y, scaledSize + 6);

    g.fillStyle(glow, alpha * 0.2);
    g.fillCircle(popup.x, popup.y, scaledSize + 14);

    const text = `+${popup.amount}`;
    drawText(g, text, popup.x - scaledSize * 0.5, popup.y - scaledSize * 0.4, scaledSize, color, alpha);
  }
};
