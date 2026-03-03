const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components');
const SKIP = new Set(['palette.ts', 'sparkleColor.ts']);

const SKIP_PATTERNS = [
  'scoreFlashIntensity > 0.5',
  'Math.random() > 0.5 ? 0xffffff',
  'noise > 0.9 ? 0xffffff',
];

function isDrawContext(line) {
  return line.includes('fillStyle') ||
         line.includes('lineStyle') ||
         line.includes('drawText');
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !SKIP.has(f));
const updated = [];

for (const file of files) {
  const fp = path.join(dir, file);
  const content = fs.readFileSync(fp, 'utf-8');
  if (!content.includes('0xffffff')) continue;

  const lines = content.split('\n');
  let changed = false;
  let replacements = 0;

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes('0xffffff')) continue;
    if (SKIP_PATTERNS.some(s => lines[i].includes(s))) continue;

    if (isDrawContext(lines[i])) {
      const count = (lines[i].match(/0xffffff/g) || []).length;
      lines[i] = lines[i].replace(/0xffffff/g, 'sparkle()');
      changed = true;
      replacements += count;
    }
  }

  if (!changed) continue;

  let result = lines.join('\n');

  if (!result.includes("from './sparkleColor'")) {
    const importRegex = /^import\s.*?;$/gm;
    let lastImportEnd = 0;
    let match;
    while ((match = importRegex.exec(result)) !== null) {
      lastImportEnd = match.index + match[0].length;
    }

    const multiImportRegex = /^}\s*from\s+['"].*?['"];?$/gm;
    while ((match = multiImportRegex.exec(result)) !== null) {
      if (match.index + match[0].length > lastImportEnd) {
        lastImportEnd = match.index + match[0].length;
      }
    }

    if (lastImportEnd > 0) {
      result = result.slice(0, lastImportEnd) + "\nimport { sparkle } from './sparkleColor';" + result.slice(lastImportEnd);
    } else {
      result = "import { sparkle } from './sparkleColor';\n" + result;
    }
  }

  fs.writeFileSync(fp, result);
  updated.push(`${file} (${replacements})`);
}

console.log('Updated files:');
updated.forEach(f => console.log('  ' + f));
console.log('Total files:', updated.length);
