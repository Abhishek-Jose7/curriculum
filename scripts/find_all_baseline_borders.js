const fs = require('fs');
const { PNG } = require('pngjs');

const imgBase = PNG.sync.read(fs.readFileSync('c:\\comps\\curriculum_docs\\pdf_fidelity\\browser_pages\\page-004.png'));

function scanRow(y) {
  const darkXs = [];
  for (let x = 54; x < 899; x++) {
    const idx = (imgBase.width * y + x) << 2;
    const r = imgBase.data[idx];
    const g = imgBase.data[idx+1];
    const b = imgBase.data[idx+2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 180) {
      darkXs.push(x);
    }
  }

  function groupConsecutive(arr) {
    if (arr.length === 0) return [];
    const groups = [];
    let currentGroup = [arr[0]];
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] === arr[i-1] + 1 || arr[i] === arr[i-1] + 2) {
        currentGroup.push(arr[i]);
      } else {
        groups.push(currentGroup);
        currentGroup = [arr[i]];
      }
    }
    groups.push(currentGroup);
    return groups.map(g => Math.round(g.reduce((a, b) => a + b, 0) / g.length));
  }

  return groupConsecutive(darkXs);
}

for (let y = 350; y < 650; y += 15) {
  console.log(`Y=${y}:`, scanRow(y));
}
