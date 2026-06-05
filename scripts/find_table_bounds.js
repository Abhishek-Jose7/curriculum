const fs = require('fs');
const { PNG } = require('pngjs');

const imgGen = PNG.sync.read(fs.readFileSync('c:\\comps\\scripts\\output\\page-004.png'));
const imgBase = PNG.sync.read(fs.readFileSync('c:\\comps\\curriculum_docs\\pdf_fidelity\\browser_pages\\page-004.png'));

// We search for horizontal lines that span at least 200px in width, and find their X bounds.
function findHorizontalLineBounds(img, name) {
  console.log(`--- Horizontal Lines for ${name} ---`);
  for (let y = 150; y < 1248; y++) {
    let firstX = -1;
    let lastX = -1;
    let count = 0;
    for (let x = 0; x < img.width; x++) {
      const idx = (img.width * y + x) << 2;
      const r = img.data[idx];
      const g = img.data[idx+1];
      const b = img.data[idx+2];
      const a = img.data[idx+3];
      if (r < 180 && g < 180 && b < 180 && a > 200) {
        if (firstX === -1) firstX = x;
        lastX = x;
        count++;
      }
    }
    // If it's a solid line spanning at least 400 pixels
    if (count > 400 && (lastX - firstX) > 400) {
      console.log(`Y=${y}: X range [${firstX}, ${lastX}], width=${lastX - firstX + 1}px, solidCount=${count}`);
    }
  }
}

findHorizontalLineBounds(imgBase, 'Baseline');
findHorizontalLineBounds(imgGen, 'Generated');
