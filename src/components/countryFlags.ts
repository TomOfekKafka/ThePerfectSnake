import Phaser from 'phaser';

export interface CountryFlag {
  country: string;
  code: string;
  fact: string;
  stripes: FlagStripe[];
  emblem?: FlagEmblem;
}

interface FlagStripe {
  color: number;
  start: number;
  end: number;
  direction: 'horizontal' | 'vertical';
}

interface FlagEmblem {
  type: 'circle' | 'crescent' | 'cross' | 'star' | 'diamond' | 'sun';
  color: number;
  x: number;
  y: number;
  size: number;
  secondaryColor?: number;
}

function hStripes(...colors: number[]): FlagStripe[] {
  const step = 1 / colors.length;
  return colors.map((color, i) => ({
    color,
    start: i * step,
    end: (i + 1) * step,
    direction: 'horizontal' as const,
  }));
}

function vStripes(...colors: number[]): FlagStripe[] {
  const step = 1 / colors.length;
  return colors.map((color, i) => ({
    color,
    start: i * step,
    end: (i + 1) * step,
    direction: 'vertical' as const,
  }));
}

const FLAGS: CountryFlag[] = [
  {
    country: 'FRANCE',
    code: 'FR',
    fact: 'FRANCE HAS 12 TIME ZONES MORE THAN ANY OTHER COUNTRY',
    stripes: vStripes(0x0055a4, 0xffffff, 0xef4135),
  },
  {
    country: 'GERMANY',
    code: 'DE',
    fact: 'GERMANY HAS OVER 1500 DIFFERENT BEERS',
    stripes: hStripes(0x000000, 0xdd0000, 0xffcc00),
  },
  {
    country: 'ITALY',
    code: 'IT',
    fact: 'ITALY HAS MORE UNESCO SITES THAN ANY COUNTRY',
    stripes: vStripes(0x009246, 0xffffff, 0xce2b37),
  },
  {
    country: 'JAPAN',
    code: 'JP',
    fact: 'JAPAN HAS OVER 6800 ISLANDS',
    stripes: hStripes(0xffffff),
    emblem: { type: 'circle', color: 0xbc002d, x: 0.5, y: 0.5, size: 0.3 },
  },
  {
    country: 'BRAZIL',
    code: 'BR',
    fact: 'BRAZIL PRODUCES ONE THIRD OF THE WORLDS COFFEE',
    stripes: hStripes(0x009c3b),
    emblem: { type: 'diamond', color: 0xffdf00, x: 0.5, y: 0.5, size: 0.4 },
  },
  {
    country: 'SWEDEN',
    code: 'SE',
    fact: 'SWEDEN HAS 267570 ISLANDS MORE THAN ANY COUNTRY',
    stripes: hStripes(0x006aa7),
    emblem: { type: 'cross', color: 0xfecc00, x: 0.36, y: 0.5, size: 0.2 },
  },
  {
    country: 'TURKEY',
    code: 'TR',
    fact: 'ISTANBUL IS THE ONLY CITY ON TWO CONTINENTS',
    stripes: hStripes(0xe30a17),
    emblem: { type: 'crescent', color: 0xffffff, x: 0.42, y: 0.5, size: 0.25 },
  },
  {
    country: 'INDIA',
    code: 'IN',
    fact: 'INDIA HAS THE WORLDS LARGEST POSTAL NETWORK',
    stripes: hStripes(0xff9933, 0xffffff, 0x138808),
    emblem: { type: 'circle', color: 0x000080, x: 0.5, y: 0.5, size: 0.12 },
  },
  {
    country: 'ARGENTINA',
    code: 'AR',
    fact: 'ARGENTINA SPANS FROM TROPICS TO ANTARCTICA',
    stripes: hStripes(0x74acdf, 0xffffff, 0x74acdf),
    emblem: { type: 'sun', color: 0xf6b40e, x: 0.5, y: 0.5, size: 0.15 },
  },
  {
    country: 'NIGERIA',
    code: 'NG',
    fact: 'NIGERIA IS HOME TO OVER 500 LANGUAGES',
    stripes: vStripes(0x008751, 0xffffff, 0x008751),
  },
  {
    country: 'THAILAND',
    code: 'TH',
    fact: 'THAILAND IS THE ONLY SE ASIAN COUNTRY NEVER COLONIZED',
    stripes: hStripes(0xed1c24, 0xffffff, 0x241d4f, 0xffffff, 0xed1c24),
  },
  {
    country: 'COLOMBIA',
    code: 'CO',
    fact: 'COLOMBIA HAS MORE BIRD SPECIES THAN ANY COUNTRY',
    stripes: [
      { color: 0xfcd116, start: 0, end: 0.5, direction: 'horizontal' },
      { color: 0x003893, start: 0.5, end: 0.75, direction: 'horizontal' },
      { color: 0xce1126, start: 0.75, end: 1, direction: 'horizontal' },
    ],
  },
  {
    country: 'UKRAINE',
    code: 'UA',
    fact: 'UKRAINE HAS THE DEEPEST METRO STATION IN THE WORLD',
    stripes: hStripes(0x005bbb, 0xffd500),
  },
  {
    country: 'POLAND',
    code: 'PL',
    fact: 'POLAND IS HOME TO 17 UNESCO WORLD HERITAGE SITES',
    stripes: hStripes(0xffffff, 0xdc143c),
  },
  {
    country: 'SOUTH KOREA',
    code: 'KR',
    fact: 'SOUTH KOREA HAS THE FASTEST INTERNET IN THE WORLD',
    stripes: hStripes(0xffffff),
    emblem: { type: 'circle', color: 0xcd2e3a, x: 0.5, y: 0.5, size: 0.25, secondaryColor: 0x0047a0 },
  },
  {
    country: 'EGYPT',
    code: 'EG',
    fact: 'ANCIENT EGYPTIANS INVENTED TOOTHPASTE',
    stripes: hStripes(0xce1126, 0xffffff, 0x000000),
  },
  {
    country: 'MEXICO',
    code: 'MX',
    fact: 'MEXICO CITY IS SINKING 10 INCHES PER YEAR',
    stripes: vStripes(0x006847, 0xffffff, 0xce1126),
  },
  {
    country: 'IRELAND',
    code: 'IE',
    fact: 'IRELAND HAS NO NATIVE SNAKES AT ALL',
    stripes: vStripes(0x169b62, 0xffffff, 0xff883e),
  },
  {
    country: 'PERU',
    code: 'PE',
    fact: 'PERU HAS 90 DIFFERENT MICROCLIMATES',
    stripes: vStripes(0xd91023, 0xffffff, 0xd91023),
  },
  {
    country: 'ICELAND',
    code: 'IS',
    fact: 'ICELAND HAS NO MOSQUITOES AT ALL',
    stripes: hStripes(0x003897),
    emblem: { type: 'cross', color: 0xd72828, x: 0.36, y: 0.5, size: 0.18, secondaryColor: 0xffffff },
  },
  {
    country: 'AUSTRALIA',
    code: 'AU',
    fact: 'AUSTRALIA IS WIDER THAN THE MOON',
    stripes: hStripes(0x00008b),
    emblem: { type: 'star', color: 0xffffff, x: 0.5, y: 0.55, size: 0.2 },
  },
  {
    country: 'CANADA',
    code: 'CA',
    fact: 'CANADA HAS MORE LAKES THAN ALL OTHER COUNTRIES COMBINED',
    stripes: [
      { color: 0xff0000, start: 0, end: 0.25, direction: 'vertical' },
      { color: 0xffffff, start: 0.25, end: 0.75, direction: 'vertical' },
      { color: 0xff0000, start: 0.75, end: 1, direction: 'vertical' },
    ],
  },
  {
    country: 'GREECE',
    code: 'GR',
    fact: 'GREECE HAS OVER 6000 ISLANDS',
    stripes: hStripes(0x0d5eaf, 0xffffff, 0x0d5eaf, 0xffffff, 0x0d5eaf),
  },
  {
    country: 'CHILE',
    code: 'CL',
    fact: 'CHILE IS THE WORLDS LONGEST COUNTRY NORTH TO SOUTH',
    stripes: [
      { color: 0xffffff, start: 0, end: 0.5, direction: 'horizontal' },
      { color: 0xd52b1e, start: 0.5, end: 1, direction: 'horizontal' },
    ],
    emblem: { type: 'star', color: 0xffffff, x: 0.17, y: 0.25, size: 0.12 },
  },
];

export const FLAG_COUNT = FLAGS.length;

export function pickFlag(foodEaten: number): CountryFlag {
  return FLAGS[foodEaten % FLAGS.length];
}

export function getFlags(): readonly CountryFlag[] {
  return FLAGS;
}

export interface FlagDisplayState {
  currentFlag: CountryFlag;
  nextIndex: number;
}

export function createFlagDisplayState(): FlagDisplayState {
  return {
    currentFlag: FLAGS[0],
    nextIndex: 1,
  };
}

export function advanceFlag(state: FlagDisplayState): void {
  state.currentFlag = FLAGS[state.nextIndex % FLAGS.length];
  state.nextIndex++;
}

function drawEmblem(
  g: Phaser.GameObjects.Graphics,
  emblem: FlagEmblem,
  flagX: number,
  flagY: number,
  flagW: number,
  flagH: number
): void {
  const ex = flagX + emblem.x * flagW;
  const ey = flagY + emblem.y * flagH;
  const eSize = emblem.size * Math.min(flagW, flagH);

  switch (emblem.type) {
    case 'circle': {
      if (emblem.secondaryColor !== undefined) {
        g.fillStyle(emblem.color, 1);
        g.fillCircle(ex, ey - eSize * 0.15, eSize);
        g.fillStyle(emblem.secondaryColor, 1);
        g.fillCircle(ex, ey + eSize * 0.15, eSize);
      } else {
        g.fillStyle(emblem.color, 1);
        g.fillCircle(ex, ey, eSize);
      }
      break;
    }
    case 'crescent': {
      g.fillStyle(emblem.color, 1);
      g.fillCircle(ex, ey, eSize);
      const bgStripe = FLAGS.find(f => f.emblem === emblem);
      const bgColor = bgStripe?.stripes[0]?.color ?? 0x000000;
      g.fillStyle(bgColor, 1);
      g.fillCircle(ex + eSize * 0.35, ey, eSize * 0.8);
      g.fillStyle(emblem.color, 1);
      const starX = ex + eSize * 0.7;
      drawSmallStar(g, starX, ey, eSize * 0.3);
      break;
    }
    case 'cross': {
      const armW = eSize * 0.7;
      const armH = flagH * 0.5;
      const crossX = flagX + emblem.x * flagW;
      if (emblem.secondaryColor !== undefined) {
        g.fillStyle(emblem.secondaryColor, 1);
        g.fillRect(crossX - armW * 0.8, flagY, armW * 1.6, flagH);
        g.fillRect(flagX, ey - armW * 0.8, flagW, armW * 1.6);
      }
      g.fillStyle(emblem.color, 1);
      g.fillRect(crossX - armW * 0.5, flagY, armW, flagH);
      g.fillRect(flagX, ey - armW * 0.5, flagW, armW);
      break;
    }
    case 'star': {
      g.fillStyle(emblem.color, 1);
      drawSmallStar(g, ex, ey, eSize);
      break;
    }
    case 'diamond': {
      g.fillStyle(emblem.color, 1);
      const dw = eSize * 2;
      const dh = eSize * 1.4;
      g.fillTriangle(ex, ey - dh, ex + dw, ey, ex, ey + dh);
      g.fillTriangle(ex, ey - dh, ex - dw, ey, ex, ey + dh);
      break;
    }
    case 'sun': {
      g.fillStyle(emblem.color, 1);
      g.fillCircle(ex, ey, eSize);
      const rays = 8;
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2;
        const rx = ex + Math.cos(angle) * eSize * 1.8;
        const ry = ey + Math.sin(angle) * eSize * 1.8;
        g.fillTriangle(
          ex + Math.cos(angle - 0.15) * eSize,
          ey + Math.sin(angle - 0.15) * eSize,
          ex + Math.cos(angle + 0.15) * eSize,
          ey + Math.sin(angle + 0.15) * eSize,
          rx, ry
        );
      }
      break;
    }
  }
}

function drawSmallStar(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number
): void {
  const points = 5;
  const innerRadius = radius * 0.45;
  for (let i = 0; i < points; i++) {
    const outerAngle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const nextAngle = ((i + 1) / points) * Math.PI * 2 - Math.PI / 2;
    const innerAngle = ((i + 0.5) / points) * Math.PI * 2 - Math.PI / 2;
    const ox = x + Math.cos(outerAngle) * radius;
    const oy = y + Math.sin(outerAngle) * radius;
    const ix = x + Math.cos(innerAngle) * innerRadius;
    const iy = y + Math.sin(innerAngle) * innerRadius;
    const nx = x + Math.cos(nextAngle) * radius;
    const ny = y + Math.sin(nextAngle) * radius;
    g.fillTriangle(ox, oy, ix, iy, x, y);
    g.fillTriangle(ix, iy, nx, ny, x, y);
  }
}

export function drawFlagFood(
  g: Phaser.GameObjects.Graphics,
  flag: CountryFlag,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number
): void {
  const hover = Math.sin(frameCount * 0.08) * 3;
  const floatY = foodY + hover;
  const flagW = cellSize * 1.2;
  const flagH = cellSize * 0.8;
  const pulse = 1.0 + Math.sin(frameCount * 0.1) * 0.05;
  const w = flagW * pulse;
  const h = flagH * pulse;
  const fx = floatY;
  const fy = foodY;

  const shadowScale = 1.0 - hover / 20;
  const shadowAlpha = 0.3 * Math.max(0.3, shadowScale);
  g.fillStyle(0x000000, shadowAlpha);
  g.fillEllipse(foodX + 2, foodY + 6, w * shadowScale, h * 0.3 * shadowScale);

  g.fillStyle(0xffdd44, 0.12);
  g.fillCircle(foodX, floatY, cellSize * 1.2);

  const left = foodX - w / 2;
  const top = floatY - h / 2;

  for (const stripe of flag.stripes) {
    g.fillStyle(stripe.color, 1);
    if (stripe.direction === 'horizontal') {
      const sy = top + stripe.start * h;
      const sh = (stripe.end - stripe.start) * h;
      g.fillRect(left, sy, w, sh);
    } else {
      const sx = left + stripe.start * w;
      const sw = (stripe.end - stripe.start) * w;
      g.fillRect(sx, top, sw, h);
    }
  }

  if (flag.emblem) {
    drawEmblem(g, flag.emblem, left, top, w, h);
  }

  g.lineStyle(1, 0xffffff, 0.5);
  g.strokeRect(left, top, w, h);

  const waveOffset = Math.sin(frameCount * 0.06) * 1.5;
  g.fillStyle(0xffffff, 0.08 + Math.abs(waveOffset) * 0.02);
  g.fillRect(left + w * 0.3, top, w * 0.15, h);

  const specX = left + w * 0.15;
  const specY = top + h * 0.2;
  g.fillStyle(0xffffff, 0.25);
  g.fillCircle(specX, specY, 2);
}

export function drawCountryLabel(
  g: Phaser.GameObjects.Graphics,
  flag: CountryFlag,
  foodX: number,
  foodY: number,
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
  const floatY = foodY + hover;
  const labelY = floatY - cellSize * 0.7;
  const charWidth = 5 * 0.7;
  const labelWidth = flag.code.length * charWidth;
  const labelX = foodX - labelWidth / 2;

  const bgAlpha = 0.5 + Math.sin(frameCount * 0.06) * 0.1;
  g.fillStyle(0x000000, bgAlpha * 0.6);
  g.fillRoundedRect(labelX - 3, labelY - 4, labelWidth + 6, 10, 2);

  drawText(g, flag.code, labelX, labelY, 5, 0xffffff, bgAlpha);
}
