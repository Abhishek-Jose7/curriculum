const fs = require('fs');
const { PNG } = require('pngjs');

const imgBase = PNG.sync.read(fs.readFileSync('c:\\comps\\curriculum_docs\\pdf_fidelity\\browser_pages\\page-004.png'));
const imgGen = PNG.sync.read(fs.readFileSync('c:\\comps\\scripts\\output\\page-004.png'));

function scanColumns(img, yStart, yEnd) {
  const xCounts = Array(img.width).fill(0);
  for (let x = 0; x < img.width; x++) {
    for (let y = yStart; y < yEnd; y++) {
      const idx = (img.width * y + x) << 2;
      const r = img.data[idx];
      const g = img.data[idx+1];
      const b = img.data[idx+2];
      const a = img.data[idx+3];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 150 && a > 200) {
        xCounts[x]++;
      }
    }
  }

  // Find peaks
  const peaks = [];
  const minHeight = (yEnd - yStart) * 0.8;
  for (let x = 1; x < img.width - 1; x++) {
    if (xCounts[x] >= minHeight && xCounts[x] >= xCounts[x-1] && xCounts[x] >= xCounts[x+1]) {
      if (peaks.length === 0 || x - peaks[peaks.length - 1] > 4) {
        peaks.push(x);
      }
    }
  }
  return peaks;
}

console.log('Baseline Page 4 table columns (Y=310-340):');
console.log(scanColumns(imgBase, 310, 340));

console.log('\nGenerated Page 4 table columns (Y=310-340):');
console.log(scanColumns(imgGen, 310, 340));
