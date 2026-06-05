const fs = require('fs');
const { PNG } = require('pngjs');

const baseImg = PNG.sync.read(fs.readFileSync('c:\\comps\\curriculum_docs\\pdf_fidelity\\browser_pages\\page-004.png'));
const genImg = PNG.sync.read(fs.readFileSync('c:\\comps\\scripts\\output\\page-004.png'));

const points = [10, 100, 200, 500, 800, 1200, 1300];

console.log('Baseline Y profile at X=100:');
points.forEach(y => {
  const idx = (baseImg.width * y + 100) << 2;
  console.log(`Y=${y}: r=${baseImg.data[idx]}, g=${baseImg.data[idx+1]}, b=${baseImg.data[idx+2]}, a=${baseImg.data[idx+3]}`);
});

console.log('\nGenerated Y profile at X=100:');
points.forEach(y => {
  const idx = (genImg.width * y + 100) << 2;
  console.log(`Y=${y}: r=${genImg.data[idx]}, g=${genImg.data[idx+1]}, b=${genImg.data[idx+2]}, a=${genImg.data[idx+3]}`);
});
