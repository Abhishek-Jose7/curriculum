const fs = require('fs');
const { PNG } = require('pngjs');

const imgBase = PNG.sync.read(fs.readFileSync('c:\\comps\\curriculum_docs\\pdf_fidelity\\browser_pages\\page-004.png'));
const imgGen = PNG.sync.read(fs.readFileSync('c:\\comps\\scripts\\output\\page-004.png'));

// We check y=350 for Baseline and y=300 for Generated, and look for vertical border lines (columns).
// Let's find all X coordinates where there is a dark vertical line segment (more than 10 consecutive dark pixels vertically).
function findVerticalBorders(img, yStart, yEnd) {
  const borderXs = [];
  for (let x = 0; x < img.width; x++) {
    let darkCount = 0;
    for (let y = yStart; y < yEnd; y++) {
      const idx = (img.width * y + x) << 2;
      const r = img.data[idx];
      const g = img.data[idx+1];
      const b = img.data[idx+2];
      const a = img.data[idx+3];
      if (r < 180 && g < 180 && b < 180 && a > 200) {
        darkCount++;
      }
    }
    if (darkCount > (yEnd - yStart) * 0.8) {
      borderXs.push(x);
    }
  }
  return borderXs;
}

console.log('Baseline vertical borders X coordinates (Y=300 to 450):');
console.log(findVerticalBorders(imgBase, 300, 450));

console.log('\nGenerated vertical borders X coordinates (Y=210 to 360):');
console.log(findVerticalBorders(imgGen, 210, 360));
