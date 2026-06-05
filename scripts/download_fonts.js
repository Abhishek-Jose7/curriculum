const fs = require('fs');
const path = require('path');
const https = require('https');

const fontsDir = path.resolve(__dirname, '../frontend/public/fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fonts = [
  {
    url: 'https://raw.githubusercontent.com/shantigilbert/liberation-fonts-ttf/master/LiberationSerif-Regular.ttf',
    dest: path.join(fontsDir, 'times.ttf')
  },
  {
    url: 'https://raw.githubusercontent.com/shantigilbert/liberation-fonts-ttf/master/LiberationSerif-Bold.ttf',
    dest: path.join(fontsDir, 'timesbd.ttf')
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download from ${url}: Status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${url} to ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  for (const font of fonts) {
    try {
      await downloadFile(font.url, font.dest);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
  console.log('Fonts downloaded successfully!');
}

main();
