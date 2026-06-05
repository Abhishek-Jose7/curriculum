const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const baselinePath = 'c:\\comps\\curriculum_docs\\pdf_fidelity\\browser_pages\\page-004.png';
const generatedPath = 'c:\\comps\\scripts\\output\\page-004.png';

const baseImg = PNG.sync.read(fs.readFileSync(baselinePath));
const genImg = PNG.sync.read(fs.readFileSync(generatedPath));

function findHorizontalLines(img) {
  const lines = [];
  for (let y = 0; y < img.height; y++) {
    let darkCount = 0;
    for (let x = 0; x < img.width; x++) {
      const idx = (img.width * y + x) << 2;
      const r = img.data[idx];
      const g = img.data[idx+1];
      const b = img.data[idx+2];
      const a = img.data[idx+3];
      if (r < 180 && g < 180 && b < 180 && a > 200) {
        darkCount++;
      }
    }
    if (darkCount > img.width * 0.4) {
      lines.push(y);
    }
  }
  return lines;
}

const baseLines = findHorizontalLines(baseImg);
const genLines = findHorizontalLines(genImg);

// Group consecutive numbers
function groupConsecutive(arr) {
  if (arr.length === 0) return [];
  const groups = [];
  let currentGroup = [arr[0]];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === arr[i-1] + 1) {
      currentGroup.push(arr[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [arr[i]];
    }
  }
  groups.push(currentGroup);
  return groups.map(g => {
    return {
      start: g[0],
      end: g[g.length - 1],
      length: g.length
    };
  });
}

console.log('Baseline horizontal lines groups:');
console.log(groupConsecutive(baseLines));

console.log('\nGenerated horizontal lines groups:');
console.log(groupConsecutive(genLines));
