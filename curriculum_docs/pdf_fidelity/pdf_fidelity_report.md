# PDF Fidelity Validation Report

Date: 2026-06-02

## Decision

**NO-GO: do not replace WeasyPrint with Browser Print for the official curriculum PDF workflow yet.**

Browser print can produce readable A4 curriculum PDFs, but it does not reproduce the current official WeasyPrint layout features with acceptable fidelity. The most important blocker is lack of reliable support for generated running headers, generated footers, and page counters through the same `@page` margin-box model that the current WeasyPrint templates use.

## Scope

This phase intentionally did not continue D1, Worker, live-data migration, or Django removal work.

Implemented validation routes:

- `/print/course/[id]`
- `/print/reviewer/course/[id]`
- `/print/final?department=...&academic_year=...&version=...`

Implemented print CSS:

- `@page` A4 rules
- `@media print`
- mm-based A4 page boxes
- fixed table layouts
- stable borders
- section page breaks
- break avoidance for modules, assessments, lab tables, and CO-PO matrix blocks
- print-safe Times-based typography
- institutional header markup

Validation artifacts:

- `curriculum_docs/pdf_fidelity/browser-course-1.pdf`
- `curriculum_docs/pdf_fidelity/browser-reviewer-course-1.pdf`
- `curriculum_docs/pdf_fidelity/browser-final.pdf`
- `curriculum_docs/pdf_fidelity/browser-final-no-header.pdf`
- `curriculum_docs/pdf_fidelity/browser_no_header_pages/*.png`

## Test Data

The final curriculum validation used a large generated curriculum fixture designed to expose pagination issues:

- cover page
- preamble page
- policy / NEP alignment page
- semester structure tables
- theory courses
- laboratory courses
- elective courses
- project courses
- annexure section
- reviewer comments section
- CO-PO matrices

The print routes attempt to use API course data where available. During this local validation run, no authenticated live Django/Worker API session was used for the full curriculum route, so the large fixture was used for repeatable stress testing.

## Browser PDF Results

| Route | Browser PDF | Page count |
| --- | --- | ---: |
| `/print/course/1` | `browser-course-1.pdf` | 3 |
| `/print/reviewer/course/1` | `browser-reviewer-course-1.pdf` | 4 |
| `/print/final?...` with Chrome default headers | `browser-final.pdf` | 48 |
| `/print/final?...` best case, no Chrome headers | `browser-final-no-header.pdf` | 48 |

Important observation: Chrome's default print output injected browser headers/footers containing date, title, URL, and page number. These are unacceptable for official output unless users disable browser headers/footers. The best-case no-header run removes those browser artifacts but still cannot reproduce official generated institutional headers/footers across pages.

## WeasyPrint Baseline

The current Django templates use WeasyPrint-specific paged-media strengths:

- `@page` margin boxes
- `@top-center { content: element(running-header); }`
- `@bottom-center { content: counter(page); }`
- named pages such as `cover`, `preamble`, and `semester`
- running institutional header support
- server-controlled PDF generation without user print-dialog settings

Local direct WeasyPrint rendering could not be reproduced on this Windows host because the installed WeasyPrint package is missing native GTK/Pango dependencies:

`OSError: cannot load library 'libgobject-2.0-0'`

Therefore, this report compares the existing WeasyPrint implementation capabilities and templates against the observed Chromium PDF output from the same print-fidelity curriculum structure. This is sufficient to evaluate the architectural assumption because the failing features are browser print engine limitations, not data migration issues.

## Comparison

| Area | Current WeasyPrint behavior | Browser Print observed behavior | Result |
| --- | --- | --- | --- |
| Page count | Deterministic server render with explicit page model | Full curriculum produced 48 pages; count is dependent on Chrome settings and print scaling | Risk |
| Pagination consistency | Controlled through WeasyPrint paged media | Section page breaks work, but multi-page course sections lose official header continuity | Fail |
| Table alignment | Fixed layouts and margin boxes supported | Tables render, but narrow semester columns create poor title wrapping and tall rows | Partial |
| Merged-cell behavior | Supported in existing templates | Rowspan/colspan render mostly correctly in course and semester tables | Pass |
| Header fidelity | Running institutional header is supported | Header appears only where manually placed in DOM, not repeated on continuation pages | Fail |
| Footer fidelity | Page counters in `@page` margin boxes are supported | Custom generated footers/page counters are not reliably available; browser defaults must be disabled manually | Fail |
| Typography density | Stable Times-based rendering | Readable, but density differs and leaves large whitespace on some generated pages | Partial |
| Margin consistency | Server controlled | A4 margins work in best-case headless print; user print settings can alter output | Risk |
| Semester table rendering | Dense official table expected | Rendered, but long titles wrap into very narrow columns and reduce professional polish | Partial |
| CO-PO matrix rendering | Expected as compact fixed matrix | Rendered acceptably in sampled course pages | Pass |
| Laboratory table rendering | Expected as fixed official table | Rendered acceptably in sampled pages | Pass |
| Curriculum assembly ordering | Server template orders cover, preamble, structures, TOC, courses, annexure | Browser route orders these correctly | Pass |

## Blockers

| Severity | Issue | Affected pages | Workaround | Estimated effort |
| --- | --- | --- | --- | --- |
| CRITICAL | Browser print does not support the current WeasyPrint-style running institutional header on every physical page using `position: running()` / margin boxes. | Multi-page course bodies, semester continuations, annexure/comments continuations | Manually paginate content into fixed page components and duplicate headers per page, or keep WeasyPrint/server renderer | High |
| CRITICAL | Official generated footer/page numbering cannot be controlled reliably with Chromium browser print. | All official pages | Require users to disable browser headers and use manual DOM footers, or keep WeasyPrint | High |
| HIGH | Chrome default print injects date/title/URL/page footer unless disabled. | All pages in default browser-print workflow | User instruction/checklist or automation-only print. This is not safe for admin-driven manual export. | Medium |
| HIGH | Page count and pagination depend on browser version, scaling, header/footer checkbox, and print dialog settings. | Full curriculum | Lock to headless Chrome automation instead of Browser Print, or server-side renderer | Medium |
| HIGH | Long semester course titles wrap into very narrow columns, increasing row heights and reducing fidelity. | Semester structure pages | Redesign table widths/font compression or use WeasyPrint tuned table CSS | Medium |
| MEDIUM | Large whitespace appears on pages after forced page boxes and break avoidance. | Cover/policy/course continuation pages | Fine-tune break rules and avoid fixed min-height page wrappers | Medium |
| MEDIUM | `break-inside: avoid` cannot guarantee all complex module/table groups remain intact when content exceeds remaining page height. | Long modules, lab tables, CO-PO matrix plus references | Manual pagination algorithm or server paged-media renderer | High |
| LOW | Browser output can be readable and visually close for simple single-course pages. | Short course preview pages | Accept only for informal preview, not final official export | Low |

## Formal Recommendation

**NO-GO for replacing WeasyPrint with manual Browser Print -> Save as PDF as the final official curriculum export.**

Technical justification:

1. The current official format depends on paged-media features that WeasyPrint supports and Chromium manual print does not reproduce reliably.
2. The browser output cannot guarantee repeated institutional headers and controlled page footers on every physical page.
3. The manual print workflow is sensitive to browser UI settings, especially default headers/footers and scaling.
4. The generated browser PDF is readable but not official-format equivalent.
5. The risk is highest exactly where the curriculum format is most important: final assembled books, long course bodies, semester structure tables, and institutional header/footer fidelity.

## Acceptable Uses For Browser Print

Browser print remains acceptable for:

- informal preview
- faculty draft review
- reviewer read-only preview
- internal layout debugging

It is not acceptable as the sole final official publishing mechanism without either:

- a manual pagination engine that duplicates headers/footers per page, or
- a controlled headless browser PDF service with strict settings and acceptance tests, or
- continued WeasyPrint/server-side PDF rendering.

## Next Step

Do not proceed with further backend migration work until one of these directions is selected:

1. Keep WeasyPrint or another server-side paged-media renderer for final PDFs.
2. Build a dedicated client-side pagination engine and re-run this fidelity validation.
3. Use controlled headless Chromium generation instead of manual Browser Print, then re-run fidelity validation against the official templates.
