const fs = require('fs');
const { PNG } = require('pngjs');

const img = PNG.sync.read(fs.readFileSync('c:\\comps\\scripts\\output\\page-004.png'));

console.log('Generated Page 4 ASCII slice (Y=120 to 240, X=100 to 600):');
for (let y = 120; y < 240; y += 4) {
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
