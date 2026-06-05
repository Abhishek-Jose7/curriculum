const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('about:blank');
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js' });

  // Read baseline PDF
  const basePdfPath = 'c:\\comps\\curriculum_docs\\pdf_fidelity\\browser-final-no-header.pdf';
  const basePdfBuffer = fs.readFileSync(basePdfPath);
  const basePdfBase64 = basePdfBuffer.toString('base64');

  const baseDims = await page.evaluate(async (pdfB64) => {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    const loadingTask = pdfjsLib.getDocument({ data: atob(pdfB64) });
    const pdf = await loadingTask.promise;
    const p = await pdf.getPage(4);
    const view = p.view;
    return {
      width: view[2],
      height: view[3],
      view: p.view,
      userUnit: p.userUnit
    };
  }, basePdfBase64);

  console.log('Baseline PDF Page 4 Dimensions (points):', baseDims);

  // Read generated PDF
  const genPdfPath = 'c:\\comps\\scripts\\output\\generated_curriculum.pdf';
  if (fs.existsSync(genPdfPath)) {
    const genPdfBuffer = fs.readFileSync(genPdfPath);
    const genPdfBase64 = genPdfBuffer.toString('base64');
    const genDims = await page.evaluate(async (pdfB64) => {
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      const loadingTask = pdfjsLib.getDocument({ data: atob(pdfB64) });
      const pdf = await loadingTask.promise;
      const p = await pdf.getPage(4);
      const view = p.view;
      return {
        width: view[2],
        height: view[3],
        view: p.view,
        userUnit: p.userUnit
      };
    }, genPdfBase64);
    console.log('Generated PDF Page 4 Dimensions (points):', genDims);
  } else {
    console.log('Generated PDF not found.');
  }

  await browser.close();
}

main().catch(console.error);
