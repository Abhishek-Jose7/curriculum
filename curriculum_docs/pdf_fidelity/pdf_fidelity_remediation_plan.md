# PDF Fidelity Remediation Plan

**Status:** Proposed | **Target Phase:** PDF Fidelity Remediation | **Current Verdict:** NO-GO -> Path to GO

## Executive Summary

The curriculum publishing workflow requires **uncompromised publishing fidelity** to meet the standards of official university handbook publications. The recent PDF fidelity validation concluded with a **NO-GO** verdict because manual browser printing (Save as PDF) cannot reproduce the paged-media layouts (e.g., repeating institutional running headers, page numbers, dynamic footers) currently supported by WeasyPrint. 

This remediation plan establishes a clear, immediate technical path to transition from **NO-GO** to **GO**. 

We evaluate five technical architectures:
*   **Option A: Keep WeasyPrint** (Server-side paged CSS engine)
*   **Option B: Server-side Puppeteer/Chromium PDF Generation** (Headless browser rendering)
*   **Option C: React-PDF** (Direct binary PDF compilation)
*   **Option D: Custom Paginated Rendering Engine** (Client-side DOM division)
*   **Option E: Hybrid Approach** (Next.js + Paged.js + Puppeteer)

### Recommended Architecture
Our primary recommendation is **Option A: Keep WeasyPrint** for official publication rendering, backed by **Option B: Puppeteer/Chromium** as a secondary server-side alternative if a pure JS/Node architecture is strictly mandated. 

The initial NO-GO for WeasyPrint was driven by a developer environment setup blocker on Windows and hosting configuration concerns, rather than a failure of layout capability. By adjusting the Docker environment and adding developer integration scripts, we can preserve the existing high-fidelity paged CSS engine, avoiding weeks of layout rewrites while maintaining 100% pixel-perfect compliance.

---

## Blocker-by-Blocker Analysis

Here we break down the root cause of every critical, high, and medium blocker identified in the validation phase and provide specific technical solutions.

### 1. Repeating Institutional Headers on Every Physical Page
*   **Severity:** CRITICAL
*   **Affected Pages:** Multi-page course structures, semester schema continuations, annexures, and comments sections.
*   **Root Cause:** standard browsers (including Chromium in print mode) do not support the W3C paged media margin-box model (`@top-center`, `@top-left`) or `position: running()`. The header block (`.institutional-header`) is placed in the static HTML stream and renders *only* at the top of the first page. Continuation pages remain headless, violating official academic catalog formats.
*   **Evaluation of Solutions:**
    *   *Pure Browser CSS:* **Fail.** Standard CSS cannot repeat a complex block element on print continuation pages unless it is styled as a table `thead`, which embeds inside the table border and looks highly unprofessional.
    *   *Chromium/Puppeteer (Server-side):* **Pass.** Puppeteer supports a `headerTemplate` option. The institutional header is converted into an HTML string with inline CSS and embedded Base64 logo graphics.
    *   *React-PDF:* **Pass.** Native support via `<View fixed>` component properties.
    *   *Manual Pagination Engine:* **Pass.** Client-side JavaScript calculates heights and programmatically duplicates the header element at the top of each generated `.page` wrapper.
*   **Implementation Complexity:** 
    *   Option A (WeasyPrint): **Zero (Already implemented and working)**
    *   Option B (Puppeteer): **Medium** (Converting header to standalone string, inline styles, Base64 images)
    *   Option C (React-PDF): **High** (Template rewrite)
*   **Risk:** 
    *   WeasyPrint: **Low** (Stable)
    *   Puppeteer: **Low-Medium** (Header styling restrictions in sandbox)
    *   React-PDF: **Low** (Highly stable)

### 2. Controlled Footers and Page Numbering
*   **Severity:** CRITICAL
*   **Affected Pages:** All printed curriculum sheets.
*   **Root Cause:** Browsers do not support `@bottom-center { content: counter(page); }` or `counter(pages)`. Dynamic page counts and total page tallies (e.g., "Page 3 of 48") cannot be calculated or placed at the bottom margins by client-side browser layouts.
*   **Evaluation of Solutions:**
    *   *Pure Browser CSS:* **Fail.** No dynamic text generation or layout control exists for physical page bottom boundaries.
    *   *Chromium/Puppeteer:* **Pass.** Natively supports dynamic substitution using `<span class="pageNumber"></span>` and `<span class="totalPages"></span>` in the `footerTemplate` configuration.
    *   *React-PDF:* **Pass.** Supports dynamic render props inside `<Text>` to evaluate `{ pageNumber, totalPages }`.
    *   *Manual Pagination Engine:* **Pass.** The layout engine counts the physical page divs and appends footers manually during page splitting.
*   **Implementation Complexity:**
    *   Option A (WeasyPrint): **Zero** (Already implemented)
    *   Option B (Puppeteer): **Low** (Uses native Chromium markup placeholders)
    *   Option C (React-PDF): **Low** (Built-in callback functionality)
*   **Risk:** Low for all three valid options.

### 3. Injected Default Browser Headers/Footers
*   **Severity:** HIGH
*   **Affected Pages:** All pages in default print layouts.
*   **Root Cause:** If users invoke manual browser print (`Ctrl+P`), Chromium automatically appends browser defaults (date, time, file title, source URL, and page count) in the four corners of the page margins. This is completely unacceptable for official publications. Disabling this checkbox manually in the print dialog is highly error-prone and cannot be enforced programmatically.
*   **Evaluation of Solutions:**
    *   *Pure Browser CSS:* **Fail.** CSS cannot override or disable the print dialog's "Headers and footers" checkbox.
    *   *Chromium/Puppeteer:* **Pass.** Handled programmatically via `page.pdf({ displayHeaderFooter: true })` which overrides the browser's default browser headers and substitutes our custom templates.
    *   *React-PDF:* **Pass.** Renders a clean binary PDF byte-stream containing only our designed content.
*   **Implementation Complexity:** Low (Server-side orchestration locks the settings).
*   **Risk:** Zero (Removes human error from final assembly).

### 4. Layout Inconsistency Across Different Machines
*   **Severity:** HIGH
*   **Affected Pages:** Unified syllabus book (observed variation: 48 pages).
*   **Root Cause:** Manual browser print relies on the local client's operating system, standard screen DPI, graphics engine, system font availability (ClearType vs. CoreText), and local browser versions. Text wrapping, padding, and layout metrics differ across machines, leading to unexpected page wraps and inconsistent page counts.
*   **Evaluation of Solutions:**
    *   *Pure Browser CSS:* **Fail.** Local machine variables cannot be fully locked down.
    *   *WeasyPrint / Puppeteer / React-PDF:* **Pass.** Renders on the server in a controlled, isolated Linux Docker container. The output is 100% deterministic and identical for all users.
*   **Implementation Complexity:** Low (Move PDF generation entirely to server-side services).
*   **Risk:** Zero.

### 5. Long Semester Course Titles Wrapping into Narrow Columns
*   **Severity:** HIGH
*   **Affected Pages:** Semesterwise curriculum structure pages.
*   **Root Cause:** In the 16-column multi-level semester structure table, column widths are compressed. When a course has a long title (e.g. "Object Oriented Programming Methodology"), it wraps excessively, ballooning row heights, forcing massive empty space, and breaking clean grid layouts.
*   **Evaluation of Solutions:**
    *   *CSS Layout Rules:* **Pass.** Set strict column layout properties (`table-layout: fixed`) and define exact cell percentages. We must compress fonts (`font-size: 6.8pt; line-height: 1.0;`) inside dense tables and apply conditional condensed scaling (`.font-condensed` for strings > 25 characters).
    *   *React-PDF:* **Pass.** Standard styling sheets apply tight cell constraints and automated truncation options.
*   **Implementation Complexity:** **Medium** (Requires table styling and layout audits).
*   **Risk:** Low.

### 6. Large Whitespace Gaps Caused by Break Avoidance
*   **Severity:** MEDIUM
*   **Affected Pages:** Course continuation pages, laboratory lists, and assessment blocks.
*   **Root Cause:** Standard CSS properties like `break-inside: avoid` instruct the rendering engine that blocks (e.g., an entire module table or CO-PO mapping matrix) must stay intact on a single page. If the block is tall and does not fit in the remaining page space, the engine pushes it entirely to the next page, leaving a massive empty space at the bottom of the previous page.
*   **Evaluation of Solutions:**
    *   *Syllabus Splitting Rules:* **Pass.** Instead of avoiding breaks on the entire module container, we allow table structures to split between rows, but prevent splitting *inside* a single row (`tr { break-inside: avoid; }`). We also divide excessively long tables (e.g., long experiment lists or syllabus sections) into natural logical sections in the database.
*   **Implementation Complexity:** **Medium** (Refining CSS selectors and checking content height guidelines in the editor).
*   **Risk:** Low-Medium.

---

## Technical Options Comparison

We analyze the five architectural alternatives against our core publishing constraints:

| Constraint / Criteria | Option A: Keep WeasyPrint | Option B: Puppeteer / Chromium | Option C: React-PDF | Option D: Custom Paginator | Option E: Hybrid (Next + Paged) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Output Parity** | **100% (Perfect)** | **90-95% (Excellent)** | **98% (High)** | 80% (Fragile) | 85% (Unstable) |
| **Headers & Footers** | Native Paged CSS | Sandbox Template | Component Built-in | Manual DOM Inject | Polyfill Parsing |
| **Environment Parity** | Server (Docker) | Server (Docker) | Server / Client | Client | Server / Client |
| **Engineering Effort** | **Very Low** (1-2 days) | **Medium** (1-2 weeks) | **High** (3-4 weeks) | **High** (3-4 weeks) | **Medium** (2 weeks) |
| **Maintenance Complexity** | Low | Medium | High (Double code) | Very High | High |
| **Performance (Server)** | High speed | Heavy resource | High speed | Client side (fast) | Very slow |
| **Dependencies** | Pango, Cairo, GTK | Node.js, Chromium | Pure JS | Pure JS | Paged.js, Puppeteer |
| **Layout Flexibility** | High (CSS standard) | High (HTML/CSS) | Medium (Flexbox only)| High | Medium |
| **Verdict** | **RECOMMENDED** | **STRATEGIC ALT** | **NO-GO** | **NO-GO** | **NO-GO** |

### Detailed Evaluation

#### Option A: Keep WeasyPrint (Recommended)
*   **Description:** Retain WeasyPrint as the publishing engine on the Python/Django backend. It natively interprets standard W3C paged media properties.
*   **Why it works:** It is a professional typesetting engine built specifically for HTML-to-PDF conversion. It perfectly renders repeating headers (`position: running`), footer page counters (`counter(page)`), and table break rules. 
*   **How to solve local run constraints:** The `libgobject` OSError only occurs because the Windows developer machine is missing the GTK libraries. In Docker (our production target), we can easily package WeasyPrint dependencies in the Debian-based base image. For Windows developers, we compile a simple install script.
*   **Fidelity Level:** 100% parity with university layouts.
*   **Engineering Effort:** **Minimal** (Fixing setup scripts and Docker configuration).

#### Option B: Puppeteer / Chromium (Strategic Alternative)
*   **Description:** Spin up a headless Chrome service in our backend architecture. Navigates to a headless-only Next.js route `/print/final` and converts the page using `page.pdf()`.
*   **Why it works:** Relies on standard browser rendering. By moving print automation to the server, we eliminate client-side variables. 
*   **Fidelity Level:** 95%.
*   **Workarounds required:** 
    1.  The `headerTemplate` and `footerTemplate` options must be defined as static HTML strings inside the server-side print service script.
    2.  Logo images must be hardcoded as base64-encoded strings inside the template string.
    3.  A `@page :first { margin: 0; }` rule must be used to suppress the headers/footers on the cover page (as Puppeteer suppresses headers/footers on zero-margin pages).
*   **Engineering Effort:** **Medium** (1-2 weeks to build the Node/Python Puppeteer service and format templates).

#### Option C: React-PDF (NO-GO due to Rewrite Overhead)
*   **Description:** Uses `@react-pdf/renderer` to programmatically build the PDF inside Next.js/React.
*   **Why it is a NO-GO:** React-PDF does not parse HTML or standard CSS. It uses custom component primitives. Adopting it requires completely discarding our HTML templates (`course_detail.html`, `curriculum_book.html`, etc.) and rebuilding the entire layout code from scratch. This introduces immense maintenance overhead because faculty previews (web screen) and official publications (PDF) would run on completely separate codebases, making synchronization highly bug-prone.

#### Option D: Custom Paginated Rendering Engine (NO-GO due to Fragility)
*   **Description:** JavaScript layout calculations dividing the page on the client side.
*   **Why it is a NO-GO:** Writing a layout measurement engine that accurately accounts for font-face load times, margins, borders, nested table paddings, and dynamic row wrapping is incredibly complex. It is highly fragile and prone to frequent page-break calculation errors, resulting in text overlapping, truncated content, and infinite layout reflow loops.

---

## Recommended Architecture

We recommend a **Server-Side Publishing Pipeline** that completely decouples rendering from the user's browser settings. 

```mermaid
flowchart TD
    User["HOD / Admin clicks 'Publish'"] --> Req["POST /api/published-curricula/publish/"]
    Req --> DB["Select Approved Course Snapshots"]
    DB --> EngineSelection{Publish Engine}
    
    subgraph Option A: WeasyPrint (Primary)
        EngineSelection -->|Primary Path| WP["Django Template Loader"]
        WP --> CSS["Apply print.css & Web Fonts"]
        CSS --> WP_Compile["WeasyPrint Engine (Server-side)"]
        WP_Compile --> PDF_A["Deterministic PDF Stream"]
    end
    
    subgraph Option B: Puppeteer (Strategic Alt)
        EngineSelection -->|Alternate Path| Pup["Launch Headless Chromium"]
        Pup --> Load["Load Next.js Print Route"]
        Load --> Options["Set page.pdf() options<br>- headerTemplate (Base64 Logo)<br>- footerTemplate (Page X of Y)<br>- format: A4"]
        Options --> Pup_Compile["Chromium Print Engine"]
        Pup_Compile --> PDF_B["Deterministic PDF Stream"]
    end

    PDF_A --> Storage["Save to Supabase / S3 bucket"]
    PDF_B --> Storage
    Storage --> Download["Client downloads official PDF"]
```

### Architectural Justification

1.  **Strict Environment Control:** By locking the PDF compilation to the server side (via Docker), we completely eliminate local system variables (operating systems, screen zoom, browser flags, missing fonts). Every PDF generated is binary-identical, regardless of whether it was triggered by a phone, a Windows laptop, or a Mac.
2.  **No Code Duplication:** Under **Option A (WeasyPrint)**, the print layout utilizes the standard HTML templates and CSS files already integrated within the Django framework. This ensures that a single CSS tune immediately updates both the preview screens and the official publish output.
3.  **Low Infrastructure Overhead:** Dockerizing WeasyPrint or a minimal Puppeteer microservice is standard practice. It maintains a clean, modular publishing pipeline without introducing expensive client-side layout math.

---

## Technical Solutions & Path to Parity

To transition the validation verdict to **GO**, the following remediation steps must be executed.

### Step 1: Dockerize the Publishing Dependencies (Option A Setup)
To eliminate the `OSError: cannot load library 'libgobject-2.0-0'` block on developer environments and ensure stable staging/production deployment:

1.  Update the backend `Dockerfile` to install WeasyPrint's required C-libraries:
    ```dockerfile
    # Install WeasyPrint system dependencies
    RUN apt-get update && apt-get install -y \
        build-essential \
        python3-dev \
        python3-pip \
        python3-setuptools \
        python3-wheel \
        python3-cffi \
        libcairo2 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libgdk-pixbuf2.0-0 \
        libffi-dev \
        shared-mime-info \
        && rm -rf /var/lib/apt/lists/*
    ```
2.  Add a Windows setup guide to the `README.md` using MSYS2 or GTK3 installers so developers can easily run the server locally outside of Docker.

### Step 2: Implement Strategic Alternative (Option B Setup - If WeasyPrint is replaced)
If host constraints require removing WeasyPrint, execute the server-side Puppeteer service:

1.  **Create a serverless rendering service** or a Django-integrated Python-Puppeteer process (using `pyppeteer` or a Node service).
2.  Set up the PDF configuration:
    ```javascript
    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      margin: {
        top: '28mm',
        bottom: '18mm',
        left: '12mm',
        right: '12mm'
      },
      headerTemplate: `
        <div style="font-size: 8pt; width: 100%; font-family: 'Times New Roman', serif; border-bottom: 0.5pt solid #000; padding-bottom: 4px; margin: 0 12mm; display: flex; align-items: center;">
          <img src="data:image/jpeg;base64,/9j/4AAQSkZ..." style="width: 14mm; height: 14mm; margin-right: 4mm;" />
          <div style="flex: 1; text-align: center; line-height: 1.2;">
            <span style="font-style: italic;">Society of St. Francis Xavier, Pilar's</span><br/>
            <strong style="font-size: 9.5pt;">FR. CONCEICAO RODRIGUES COLLEGE OF ENGINEERING</strong><br/>
            <span style="font-size: 7.5pt;">Bandra (W), Mumbai - 400 050 (Autonomous College affiliated to University of Mumbai)</span>
          </div>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 8pt; width: 100%; font-family: 'Times New Roman', serif; padding-top: 4px; margin: 0 12mm; text-align: center; display: flex; justify-content: space-between;">
          <span>Official Syllabus Handbook</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });
    ```
3.  Add `@page :first { margin: 0; }` in `print.css` to remove headers and footers on the cover page.

### Step 3: Resolve Dense Table wrapping (Semester Structure)
Update the Next.js and Django print sheets to lock layouts:
1.  **Strict Table Constraints:**
    ```css
    .multi-level-table {
      table-layout: fixed !important;
      font-size: 6.8pt !important;
    }
    .multi-level-table th, 
    .multi-level-table td {
      padding: 2.5pt 1.5pt !important;
      line-height: 1.0 !important;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    ```
2.  **Condensed Text Utility:** Add a React utility to apply `.font-condensed` (reduces font-size to `6pt`) if a course title exceeds 25 characters inside the semester grid table.

### Step 4: Resolve Break Avoidance Whitespace Gaps
1.  Remove `break-inside: avoid` from the top-level table components.
2.  Apply `break-inside: avoid` to specific logical rows and sub-elements:
    ```css
    .official-table tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    tbody.module-group {
      break-inside: auto !important; /* Allow modules to split between units */
    }
    ```

---

## Estimated Implementation Effort

If we execute the recommended **Option A (Keep WeasyPrint)** path, the effort is minimal:

| Task Area | Action Details | Est. Effort | Complexity | Risk |
| :--- | :--- | :---: | :--- | :--- |
| **System Libraries** | Update Dockerfile and publish developer installation instructions | 1 Day | Low | Low |
| **Table Layout Tuning** | Fine-tune CSS table-layouts and column widths for semester structure | 2 Days | Medium | Low |
| **Break Optimization** | Adjust `page-break` and `break-inside` rules to eliminate whitespace gaps | 1 Day | Low | Low |
| **Verification & Audit** | Re-run full 48-page curriculum assembly validation in Docker | 1 Day | Low | Low |
| **Total Effort** | | **5 Days** | **Low** | **Low** |

If we execute **Option B (Server Puppeteer)** alternative path:

| Task Area | Action Details | Est. Effort | Complexity | Risk |
| :--- | :--- | :---: | :--- | :--- |
| **Server Service** | Set up Node.js Puppeteer service in the backend architecture | 4 Days | Medium | Medium |
| **Base64 Assets** | Convert institutional graphics to base64, construct template HTML | 2 Days | Low | Low |
| **Next.js Route Tuning** | Sync Next.js preview pages with headless page requirements | 3 Days | Medium | Low |
| **Table Layout Tuning** | CSS adjustments for dense table column structures | 2 Days | Medium | Low |
| **Total Effort** | | **11 Days** | **Medium** | **Medium** |

---

## Testing Strategy

To guarantee that the remediated layout meets all university standards before the final migration:

1.  **Deterministic Visual Regression Testing:** Use a headless script in the CI/CD pipeline to render the full 48-page curriculum PDF. Convert the PDF pages into PNG images and programmatically compare them against the official university baseline using pixel-matching libraries (e.g., `pixelmatch` or `resemble.js`). Zero pixel variations should be observed across commits.
2.  **Structural Validation Gates:** Implement an automated test suite verifying:
    *   **Page Count Stability:** Verify that changes to course text do not cause unexpected cascading page-breaks.
    *   **Overflow Checks:** Assert that no text wraps out of cell boundaries or is clipped at the bottom margin.
    *   **Header Presence:** Parse the output PDF structures to guarantee the institutional header exists on every page >= 2.
    *   **Footer Checks:** Confirm "Page X of Y" is successfully generated at the bottom-center of the margins.

---

## Clear GO / NO-GO Criteria

The transition to a **GO** decision is strictly governed by the following criteria:

```
[ ] CRITICAL: The institutional header with college name and logo is successfully repeated at the top of every physical page (excluding the cover page).
[ ] CRITICAL: Custom page numbering ("Page X of Y") is rendered centered at the bottom margin of every page, and all browser-default headers (date, URL, page title) are eliminated.
[ ] HIGH: PDF generation is executed entirely server-side (Docker container), ensuring identical document layouts regardless of client hardware or browser options.
[ ] HIGH: The 16-column semester structure table is perfectly aligned, with zero overlapping cell text and minimal row height expansions.
[ ] MEDIUM: Whitespace gaps at the bottom of pages are controlled, with tables splitting gracefully between rows without dividing single table rows in half.
```

When all checkboxes are marked **[x]**, the layout phase will transition to **GO**, and the final database migration and deployment phases can proceed immediately.
