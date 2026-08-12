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

  const pdfPath = 'c:\\comps\\curriculum_docs\\currirulum_SE_FrCRCE-1_CE_v5_AC_1_updated_21jun25-final (1).pdf';
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF not found!');
    await browser.close();
    return;
  }
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString('base64');

  const text = await page.evaluate(async (pdfB64) => {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    const loadingTask = pdfjsLib.getDocument({ data: atob(pdfB64) });
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    let fullText = `TOTAL PAGES: ${numPages}\n\n`;
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const tokenized = await page.getTextContent();
      const strings = tokenized.items.map(token => token.str);
      fullText += `--- PAGE ${pageNum} ---\n` + strings.join(' ') + '\n\n';
    }
    return fullText;
  }, pdfBase64);

  fs.writeFileSync('c:\\comps\\scripts\\extracted_text.txt', text);
  console.log('Successfully wrote extracted text to c:\\comps\\scripts\\extracted_text.txt. Total characters:', text.length);
  await browser.close();
}

main().catch(console.error);
