const fs = require('fs');
const { PNG } = require('pngjs');

const imgGen = PNG.sync.read(fs.readFileSync('c:\\comps\\scripts\\output\\page-004.png'));

const y = 300;
const darkXs = [];
for (let x = 0; x < imgGen.width; x++) {
  const idx = (imgGen.width * y + x) << 2;
  const lum = 0.299 * imgGen.data[idx] + 0.587 * imgGen.data[idx+1] + 0.114 * imgGen.data[idx+2];
  if (lum < 180) {
    darkXs.push(x);
  }
}

// Group consecutive Xs to find line centers
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

console.log('All vertical line centers at Y=300 in Generated:', groupConsecutive(darkXs));
