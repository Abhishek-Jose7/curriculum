const fs = require('fs');
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('about:blank');
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js' });

  const genPdfPath = 'c:\\comps\\curriculum_docs\\pdf_fidelity\\browser-final-no-header.pdf';
  if (!fs.existsSync(genPdfPath)) {
    console.error('Baseline PDF not found!');
    await browser.close();
    return;
  }
  const genPdfBuffer = fs.readFileSync(genPdfPath);
  const genPdfBase64 = genPdfBuffer.toString('base64');

  const text = await page.evaluate(async (pdfB64) => {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    const loadingTask = pdfjsLib.getDocument({ data: atob(pdfB64) });
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    async function getPageText(pageNum) {
      if (pageNum > pdf.numPages) return `Page ${pageNum} out of bounds`;
      const page = await pdf.getPage(pageNum);
      const tokenized = await page.getTextContent();
      const strings = tokenized.items.map(token => token.str);
      return `--- PAGE ${pageNum} ---\n` + strings.join(' ');
    }

    const p4Text = await getPageText(4);
    const p6Text = await getPageText(6);
    return `TOTAL BASELINE PAGES: ${numPages}\n\n` + p4Text + '\n\n' + p6Text;
  }, genPdfBase64);

  console.log(text);
  await browser.close();
}

main().catch(console.error);
