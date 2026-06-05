const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const baselinePath = 'c:\\comps\\curriculum_docs\\pdf_fidelity\\browser_pages\\page-004.png';
const generatedPath = 'c:\\comps\\scripts\\output\\page-004.png';

if (!fs.existsSync(baselinePath) || !fs.existsSync(generatedPath)) {
  console.error('Files missing!');
  process.exit(1);
}

const baseImg = PNG.sync.read(fs.readFileSync(baselinePath));
const genImg = PNG.sync.read(fs.readFileSync(generatedPath));

// For each y from 150 to 1248, calculate "black pixel count" (pixels with luminance < 200) inside X=120 to X=830
function getLuminanceProfile(img) {
  const profile = [];
  for (let y = 150; y < 1248; y++) {
    let darkPixels = 0;
    for (let x = 120; x < 830; x++) {
      const idx = (img.width * y + x) << 2;
      const r = img.data[idx];
      const g = img.data[idx + 1];
      const b = img.data[idx + 2];
      const a = img.data[idx + 3];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 200 && a > 50) {
        darkPixels++;
      }
    }
    profile.push({ y, darkPixels });
  }
  return profile;
}

const baseProfile = getLuminanceProfile(baseImg);
const genProfile = getLuminanceProfile(genImg);

console.log('Real text line Y-coordinates in Baseline:');
const baseLines = [];
for (let i = 1; i < baseProfile.length - 1; i++) {
  if (baseProfile[i].darkPixels > 15 && baseProfile[i].darkPixels >= baseProfile[i-1].darkPixels && baseProfile[i].darkPixels >= baseProfile[i+1].darkPixels) {
    if (baseLines.length === 0 || baseProfile[i].y - baseLines[baseLines.length - 1] > 6) {
      baseLines.push(baseProfile[i].y);
    }
  }
}
console.log(baseLines.slice(0, 20));

console.log('Real text line Y-coordinates in Generated:');
const genLines = [];
for (let i = 1; i < genProfile.length - 1; i++) {
  if (genProfile[i].darkPixels > 15 && genProfile[i].darkPixels >= genProfile[i-1].darkPixels && genProfile[i].darkPixels >= genProfile[i+1].darkPixels) {
    if (genLines.length === 0 || genProfile[i].y - genLines[genLines.length - 1] > 6) {
      genLines.push(genProfile[i].y);
    }
  }
}
console.log(genLines.slice(0, 20));

console.log('\nMatched Lines and Offsets (Gen - Base):');
for (let i = 0; i < Math.min(baseLines.length, genLines.length, 20); i++) {
  const diff = genLines[i] - baseLines[i];
  console.log(`Line ${i+1}: Base Y=${baseLines[i]}, Gen Y=${genLines[i]}, Offset=${diff}px`);
}
