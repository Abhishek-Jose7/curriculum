const fs = require('fs');
const { PNG } = require('pngjs');

const img = PNG.sync.read(fs.readFileSync('c:\\comps\\curriculum_docs\\pdf_fidelity\\browser_pages\\page-004.png'));

console.log('Baseline Page 4 ASCII Top slice (Y=0 to 120, X=100 to 600):');
for (let y = 0; y < 120; y += 4) {
  let line = '';
  for (let x = 100; x < 600; x += 6) {
    const idx = (img.width * y + x) << 2;
    const r = img.data[idx];
    const g = img.data[idx+1];
    const b = img.data[idx+2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    line += lum < 180 ? '#' : ' ';
  }
  console.log(`${y.toString().padStart(3, ' ')}: |${line}|`);
}
