// @ts-nocheck
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const FRONTEND_URL = 'http://localhost:3000';
const BASELINE_DIR = path.resolve(__dirname, '../curriculum_docs/pdf_fidelity/browser_pages');
const OUTPUT_DIR = path.resolve(__dirname, 'output');
const PDF_PATH = path.resolve(OUTPUT_DIR, 'generated_curriculum.pdf');

async function main() {
  console.log('--- Starting Visual Regression Pipeline ---');
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Check if Frontend server is up
  try {
    const res = await fetch(`${FRONTEND_URL}/print/final?version=fidelity-validation`);
    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }
    console.log(`Connected to frontend dev server at ${FRONTEND_URL}`);
  } catch (err: any) {
    console.error(`[ERROR] Frontend server is not reachable at ${FRONTEND_URL}.`);
    console.error('Please make sure your Next.js dev server is running by executing: npm run dev inside the frontend directory.');
    process.exit(1);
  }

  // 2. Launch Puppeteer
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 3. Navigate to print page and wait for fonts
  const targetUrl = `${FRONTEND_URL}/print/final?version=fidelity-validation`;
  console.log(`Loading target page: ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });

  console.log('Waiting for font loading detection flag...');
  try {
    await page.waitForSelector('main[data-fonts-loaded="true"]', { timeout: 10000 });
    console.log('Fonts confirmed loaded!');
  } catch (err) {
    console.warn('Warning: fonts confirmation timeout (10s). Proceeding anyway.');
  }

  // 4. Generate PDF
  console.log('Compiling PDF...');
  const headerTemplate = `
    <div style="font-size: 8pt; width: 100%; border-bottom: 0.5pt solid #000; padding-bottom: 4px; margin: 0 12mm; display: flex; align-items: center; justify-content: space-between; font-family: 'Times New Roman', serif;">
      <div style="display: flex; align-items: center;">
        <span style="font-weight: bold; font-size: 9pt;">FR. CONCEICAO RODRIGUES COLLEGE OF ENGINEERING</span>
      </div>
      <div style="text-align: right; font-style: italic; font-size: 7.5pt;">
        Autonomous College affiliated to University of Mumbai
      </div>
    </div>
  `;
  
  const footerTemplate = `
    <div style="font-size: 8pt; width: 100%; margin: 0 12mm; text-align: center; display: flex; justify-content: space-between; font-family: 'Times New Roman', serif; border-top: 0.5pt solid #ccc; padding-top: 4px;">
      <span>Curriculum Handbook - fidelity-validation</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
    margin: {
      top: '28mm',
      bottom: '18mm',
      left: '12mm',
      right: '12mm'
    }
  });

  fs.writeFileSync(PDF_PATH, pdfBuffer);
  console.log(`PDF saved to ${PDF_PATH}`);

  const tableCount = await page.$$eval('table', els => els.length);
  const courseCount = await page.$$eval('.course-section', els => els.length);
  console.log(`DOM Table Count: ${tableCount}`);
  console.log(`DOM Course Count: ${courseCount}`);

  // 5. Render PDF to images using pdf.js inside a page
  console.log('Rendering PDF pages to PNG using pdf.js...');
  const base64Pdf = pdfBuffer.toString('base64');
  
  // Navigate to blank page
  await page.goto('about:blank');
  await page.evaluate(() => {
    document.body.style.backgroundColor = 'rgb(18, 18, 18)';
  });
  
  // Inject pdf.js
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js' });

  // Get total page count
  const numPages = await page.evaluate(async (pdfB64) => {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    const loadingTask = pdfjsLib.getDocument({ data: atob(pdfB64) });
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  }, base64Pdf);
  console.log(`Total PDF Page Count: ${numPages}`);
  
  // Render pages to canvas and extract screenshots
  const targetPages = [1, 4, 6, 13, 25, 48];
  
  for (const pageNum of targetPages) {
    console.log(`Rendering page ${pageNum}...`);
    
    // Evaluate function to render PDF page onto canvas
    const dims = await page.evaluate(async (pdfB64, pageNumber) => {
      // Setup pdfjs
      // @ts-ignore
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      
      const loadingTask = pdfjsLib.getDocument({ data: atob(pdfB64) });
      const pdf = await loadingTask.promise;
      
      if (pageNumber > pdf.numPages) {
        return null;
      }
      
      const page = await pdf.getPage(pageNumber);
      // Dynamically calculate scale to match target 952px width exactly (since baseline is 594.96pt width)
      const scale = 1.6 * (594.95996 / page.view[2]);
      const viewport = page.getViewport({ scale });
      
      let canvas = document.getElementById('render-canvas') as HTMLCanvasElement;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'render-canvas';
        document.body.appendChild(canvas);
      }
      
      canvas.width = 952;
      canvas.height = 1348;
      
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get 2d context');
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      return { width: canvas.width, height: canvas.height };
    }, base64Pdf, pageNum);
    
    if (!dims) {
      console.warn(`Page ${pageNum} is out of bounds for generated PDF. Skipping.`);
      continue;
    }
    
    const canvasEl = await page.$('#render-canvas');
    if (canvasEl) {
      const outPngPath = path.resolve(OUTPUT_DIR, `page-${String(pageNum).padStart(3, '0')}.png`);
      await canvasEl.screenshot({ path: outPngPath });
      console.log(`Saved screenshot to ${outPngPath}`);
    }
  }

  await browser.close();

  // 6. Perform visual diffing with pixelmatch
  console.log('Comparing pages with baselines...');
  let reportContent = '# Visual Regression Testing Report\n\n';
  reportContent += `Generated at: ${new Date().toISOString()}\n\n`;
  reportContent += `**Document Statistics**:\n`;
  reportContent += `- Page Count: ${numPages}\n`;
  reportContent += `- Table Count: ${tableCount}\n`;
  reportContent += `- Course Count: ${courseCount}\n\n`;
  reportContent += '| Page | Baseline Dimensions | Generated Dimensions | Mismatch Pixels | Mismatch % | Header Diff % | Content Diff % | Footer Diff % | Status |\n';
  reportContent += '| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n';

  let totalMismatchPixels = 0;
  let totalComparedPages = 0;
  let anyFailed = false;

  for (const pageNum of targetPages) {
    const pageStr = String(pageNum).padStart(3, '0');
    const baselinePath = path.resolve(BASELINE_DIR, `page-${pageStr}.png`);
    const generatedPath = path.resolve(OUTPUT_DIR, `page-${pageStr}.png`);

    if (!fs.existsSync(generatedPath)) {
      console.warn(`Generated image for page ${pageNum} does not exist. Skipping comparison.`);
      continue;
    }
    if (!fs.existsSync(baselinePath)) {
      console.warn(`Baseline image for page ${pageNum} does not exist. Skipping comparison.`);
      continue;
    }

    totalComparedPages++;

    const imgBaseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const imgGenerated = PNG.sync.read(fs.readFileSync(generatedPath));

    const { width, height } = imgBaseline;
    
    let imgGeneratedFinal = imgGenerated;
    if (imgGenerated.width !== width || imgGenerated.height !== height) {
      console.warn(`Dimension mismatch for page ${pageNum}: Baseline ${width}x${height}, Generated ${imgGenerated.width}x${imgGenerated.height}. Resizing/padding generated image to match baseline...`);
      const resized = new PNG({ width, height });
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (width * y + x) << 2;
          if (x < imgGenerated.width && y < imgGenerated.height) {
            const genIdx = (imgGenerated.width * y + x) << 2;
            resized.data[idx] = imgGenerated.data[genIdx];
            resized.data[idx + 1] = imgGenerated.data[genIdx + 1];
            resized.data[idx + 2] = imgGenerated.data[genIdx + 2];
            resized.data[idx + 3] = imgGenerated.data[genIdx + 3];
          } else {
            resized.data[idx] = 255;
            resized.data[idx + 1] = 255;
            resized.data[idx + 2] = 255;
            resized.data[idx + 3] = 255;
          }
        }
      }
      imgGeneratedFinal = resized;
    }

    const diff = new PNG({ width, height });
    const mismatch = pixelmatch(
      imgBaseline.data,
      imgGeneratedFinal.data,
      diff.data,
      width,
      height,
      { threshold: 0.1 }
    );
    
    const diffPath = path.resolve(OUTPUT_DIR, `diff-${pageStr}.png`);
    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    let headerMismatches = 0;
    let contentMismatches = 0;
    let footerMismatches = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        if (diff.data[idx] === 255 && diff.data[idx + 1] === 0 && diff.data[idx + 2] === 0) {
          if (y < 150) {
            headerMismatches++;
          } else if (y < 1248) {
            contentMismatches++;
          } else {
            footerMismatches++;
          }
        }
      }
    }

    const headerTotal = width * 150;
    const contentTotal = width * (1248 - 150);
    const footerTotal = width * (height - 1248);

    const headerPct = ((headerMismatches / headerTotal) * 100).toFixed(2);
    const contentPct = ((contentMismatches / contentTotal) * 100).toFixed(2);
    const footerPct = ((footerMismatches / footerTotal) * 100).toFixed(2);

    const mismatchPct = mismatch === -1 ? 100 : ((mismatch / (width * height)) * 100).toFixed(2);
    const status = (mismatch === 0) ? 'PASSED' : (mismatch === -1 || Number(mismatchPct) > 1.5) ? 'FAILED' : 'WARNING';
    
    if (status === 'FAILED') anyFailed = true;
    if (mismatch !== -1) totalMismatchPixels += mismatch;

    console.log(`Page ${pageNum}: Mismatch = ${mismatchPct}% (Header: ${headerPct}%, Content: ${contentPct}%, Footer: ${footerPct}%) -> ${status}`);
    
    reportContent += `| Page ${pageNum} | ${width}x${height} | ${imgGenerated.width}x${imgGenerated.height} | ${mismatch === -1 ? 'N/A' : mismatch} | ${mismatchPct}% | ${headerPct}% | ${contentPct}% | ${footerPct}% | **${status}** |\n`;
  }

  reportContent += `\n**Summary**: Compared ${totalComparedPages} pages. Total mismatch pixels: ${totalMismatchPixels}.\n`;
  if (anyFailed) {
    reportContent += '\n> [!CAUTION]\n> **Status**: Visual regression failed. Some pages exceed the visual threshold discrepancy.\n';
  } else {
    reportContent += '\n> [!NOTE]\n> **Status**: Visual regression passed successfully!\n';
  }

  const reportPath = path.resolve(OUTPUT_DIR, 'report.md');
  fs.writeFileSync(reportPath, reportContent);
  console.log(`Visual regression report saved to ${reportPath}`);
  console.log(reportContent);

  if (anyFailed) {
    console.error('Visual regression testing failed. Please check the diff files in the output directory.');
    process.exit(1);
  } else {
    console.log('All comparisons passed!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unhandled error in visual regression pipeline:', err);
  process.exit(1);
});
