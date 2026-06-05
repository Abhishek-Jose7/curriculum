const fs = require('fs');
const { PNG } = require('pngjs');

const imgBase = PNG.sync.read(fs.readFileSync('c:\\comps\\curriculum_docs\\pdf_fidelity\\browser_pages\\page-006.png'));
const imgGen = PNG.sync.read(fs.readFileSync('c:\\comps\\scripts\\output\\page-006.png'));

// We have the matched text line Y-coordinates on Page 6
const matchedY = [
  { base: 250, gen: 251 },
  { base: 260, gen: 261 },
  { base: 289, gen: 290 },
  { base: 299, gen: 300 },
  { base: 308, gen: 309 },
  { base: 316, gen: 317 },
  { base: 326, gen: 326 },
  { base: 334, gen: 335 }
];

console.log('Line | Base First Dark X | Gen First Dark X | Offset (Gen - Base)');
console.log('---|---|---|---');

matchedY.forEach((pair, index) => {
  // Find first dark pixel in Baseline row pair.base between X=100 and X=300
  let baseFirstX = -1;
  for (let x = 100; x < 500; x++) {
    const idx = (imgBase.width * pair.base + x) << 2;
    const lum = 0.299 * imgBase.data[idx] + 0.587 * imgBase.data[idx+1] + 0.114 * imgBase.data[idx+2];
    if (lum < 180) {
      baseFirstX = x;
      break;
    }
  }

  // Find first dark pixel in Generated row pair.gen between X=100 and X=300
  let genFirstX = -1;
  for (let x = 100; x < 500; x++) {
    const idx = (imgGen.width * pair.gen + x) << 2;
    const lum = 0.299 * imgGen.data[idx] + 0.587 * imgGen.data[idx+1] + 0.114 * imgGen.data[idx+2];
    if (lum < 180) {
      genFirstX = x;
      break;
    }
  }

  console.log(`Line ${index+1} | ${baseFirstX} | ${genFirstX} | ${genFirstX - baseFirstX}px`);
});
