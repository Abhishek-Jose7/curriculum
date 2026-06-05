const fs = require('fs');
const { PNG } = require('pngjs');

const imgGen = PNG.sync.read(fs.readFileSync('c:\\comps\\scripts\\output\\page-004.png'));
const imgBase = PNG.sync.read(fs.readFileSync('c:\\comps\\curriculum_docs\\pdf_fidelity\\browser_pages\\page-004.png'));

console.log('Baseline Row 3 Y=365 to 395, X=50 to 900:');
for (let y = 365; y < 395; y += 4) {
  let line = '';
  for (let x = 50; x < 900; x += 10) {
    const idx = (imgBase.width * y + x) << 2;
    const lum = 0.299 * imgBase.data[idx] + 0.587 * imgBase.data[idx+1] + 0.114 * imgBase.data[idx+2];
    line += lum < 180 ? '#' : ' ';
  }
  console.log(`${y.toString().padStart(3, ' ')}: |${line}|`);
}

console.log('\nGenerated Row 3 Y=310 to 350, X=50 to 900:');
for (let y = 310; y < 350; y += 4) {
  let line = '';
  for (let x = 50; x < 900; x += 10) {
    const idx = (imgGen.width * y + x) << 2;
    const lum = 0.299 * imgGen.data[idx] + 0.587 * imgGen.data[idx+1] + 0.114 * imgGen.data[idx+2];
    line += lum < 180 ? '#' : ' ';
  }
  console.log(`${y.toString().padStart(3, ' ')}: |${line}|`);
}
