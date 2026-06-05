const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/print/final?version=fidelity-validation', { waitUntil: 'networkidle0' });

  const metrics = await page.evaluate(() => {
    const pageEl = document.querySelector('.semester-structure');
    const tableEl = document.querySelector('.semester-structure table');
    const docEl = document.querySelector('.print-document');
    return {
      windowWidth: window.innerWidth,
      bodyWidth: document.body.clientWidth,
      docWidth: docEl ? docEl.clientWidth : null,
      pageWidth: pageEl ? pageEl.clientWidth : null,
      pageComputedWidth: pageEl ? window.getComputedStyle(pageEl).width : null,
      pagePadding: pageEl ? window.getComputedStyle(pageEl).padding : null,
      pageMargin: pageEl ? window.getComputedStyle(pageEl).margin : null,
      tableWidth: tableEl ? tableEl.clientWidth : null,
      tableComputedWidth: tableEl ? window.getComputedStyle(tableEl).width : null
    };
  });

  console.log('Metrics in Screen Emulation (default):', metrics);

  // Emulate print and check again
  await page.emulateMediaType('print');
  const printMetrics = await page.evaluate(() => {
    const pageEl = document.querySelector('.semester-structure');
    const tableEl = document.querySelector('.semester-structure table');
    return {
      pageWidth: pageEl ? pageEl.clientWidth : null,
      pageComputedWidth: pageEl ? window.getComputedStyle(pageEl).width : null,
      pagePadding: pageEl ? window.getComputedStyle(pageEl).padding : null,
      pageMargin: pageEl ? window.getComputedStyle(pageEl).margin : null,
      tableWidth: tableEl ? tableEl.clientWidth : null,
      tableComputedWidth: tableEl ? window.getComputedStyle(tableEl).width : null
    };
  });

  console.log('Metrics in Print Emulation:', printMetrics);

  await browser.close();
}

main().catch(console.error);
