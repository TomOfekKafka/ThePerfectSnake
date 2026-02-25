import Phaser from 'phaser';

const BLUE = 0x0038b8;
const WHITE = 0xffffff;

function drawStarOfDavid(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number
): void {
  g.lineStyle(1.5, BLUE, 1);

  for (let t = 0; t < 2; t++) {
    const offset = t === 0 ? -Math.PI / 2 : Math.PI / 2;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const angle = offset + (i * Math.PI * 2) / 3;
      pts.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      });
    }
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    g.lineTo(pts[1].x, pts[1].y);
    g.lineTo(pts[2].x, pts[2].y);
    g.closePath();
    g.strokePath();
  }
}

export function drawIsraelFlagFood(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  cellSize: number,
  frameCount: number
): void {
  const hover = Math.sin(frameCount * 0.08) * 3;
  const floatY = y + hover;
  const pulse = 1.0 + Math.sin(frameCount * 0.12) * 0.08;
  const flagW = cellSize * 1.4 * pulse;
  const flagH = cellSize * 0.95 * pulse;
  const left = x - flagW / 2;
  const top = floatY - flagH / 2;

  const shadowScale = 1.0 - hover / 20;
  const shadowAlpha = 0.3 * Math.max(0.3, shadowScale);
  g.fillStyle(0x000000, shadowAlpha);
  g.fillEllipse(x + 2, y + 6, flagW * shadowScale, flagH * 0.3 * shadowScale);

  const glowAlpha = 0.15 + Math.sin(frameCount * 0.1) * 0.08;
  g.fillStyle(0x4488ff, glowAlpha);
  g.fillCircle(x, floatY, cellSize * 1.5);

  g.fillStyle(WHITE, 1);
  g.fillRect(left, top, flagW, flagH);

  const stripeH = flagH * 0.15;
  g.fillStyle(BLUE, 1);
  g.fillRect(left, top + stripeH * 0.5, flagW, stripeH);
  g.fillRect(left, top + flagH - stripeH * 1.5, flagW, stripeH);

  const starRadius = flagH * 0.22;
  drawStarOfDavid(g, x, floatY, starRadius);

  g.lineStyle(1, 0xcccccc, 0.4);
  g.strokeRect(left, top, flagW, flagH);

  const waveOffset = Math.sin(frameCount * 0.06) * 1.5;
  g.fillStyle(WHITE, 0.1 + Math.abs(waveOffset) * 0.02);
  g.fillRect(left + flagW * 0.25, top, flagW * 0.15, flagH);

  g.fillStyle(WHITE, 0.25);
  g.fillCircle(left + flagW * 0.12, top + flagH * 0.15, 1.5);
}

export function drawFlagFoodLabel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  cellSize: number,
  frameCount: number,
  drawText: (
    g: Phaser.GameObjects.Graphics,
    text: string,
    x: number,
    y: number,
    size: number,
    color: number,
    alpha: number
  ) => void
): void {
  const hover = Math.sin(frameCount * 0.08) * 3;
  const floatY = y + hover;
  const labelY = floatY - cellSize * 0.85;
  const text = '5X';
  const charWidth = 5 * 0.8;
  const labelWidth = text.length * charWidth;
  const labelX = x - labelWidth / 2;

  const bgPulse = 0.7 + Math.sin(frameCount * 0.1) * 0.15;
  g.fillStyle(0x0038b8, bgPulse * 0.8);
  g.fillRoundedRect(labelX - 4, labelY - 5, labelWidth + 8, 12, 3);
  g.lineStyle(1, 0xffd700, bgPulse);
  g.strokeRoundedRect(labelX - 4, labelY - 5, labelWidth + 8, 12, 3);

  drawText(g, text, labelX, labelY, 5, 0xffd700, bgPulse);
}

export function drawFlagFoodTimer(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  cellSize: number,
  frameCount: number,
  remainingRatio: number
): void {
  const hover = Math.sin(frameCount * 0.08) * 3;
  const floatY = y + hover;
  const barWidth = cellSize * 1.2;
  const barHeight = 2;
  const barY = floatY + cellSize * 0.6;
  const barX = x - barWidth / 2;

  g.fillStyle(0x333333, 0.5);
  g.fillRect(barX, barY, barWidth, barHeight);

  const fillColor = remainingRatio > 0.3 ? 0x0038b8 : 0xff4444;
  g.fillStyle(fillColor, 0.8);
  g.fillRect(barX, barY, barWidth * remainingRatio, barHeight);
}
