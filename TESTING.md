# TESTING.md — Visual Checklist for `quarto_auto_dark_theme`

## How to run the tests locally

```bash
cd /path/to/quarto_auto_dark_theme
bash tests/run-tests.sh
```

This renders `tests/test-html.html` and `tests/test-revealjs.html`, runs R syntax
checks, and verifies companion image generation.

> [!IMPORTANT]
> **Always test via HTTP, not by opening files directly.**
>
> Quarto's OS dark mode detection uses `localStorage` to persist the color scheme
> preference. Browsers block `localStorage` access when using the `file://` protocol.
> As a result, **OS dark mode does NOT work when opening `test-html.html` directly
> from your filesystem** (i.e., via double-click or drag-and-drop into the browser).
>
> Use `quarto preview` or `python3 -m http.server` to serve the files locally:
>
> ```bash
> # Option 1 — Quarto preview (re-renders on save)
> quarto preview tests/test-html.qmd --to auto-dark-html --port 4848
> # Open: http://localhost:4848/tests/test-html.html
>
> # Option 2 — Quick static server (no re-render)
> python3 -m http.server 4848
> # Open: http://localhost:4848/tests/test-html.html
> ```
>
> On a deployed site (GitHub Pages, Netlify, etc.) this works automatically because
> the protocol is `https://`.

---

## Visual checklist

After running the test suite, open both output files in a browser and complete the
following checklist.

### Prerequisites

- Your OS dark mode is **on** for checking the "OS auto-detect" items.
- Use your browser's developer tools (Inspect → Elements) to confirm CSS classes on
  `<html>` and `<body>`.

---

### HTML document (`tests/test-html.html`)

#### Page appearance

| # | Item | Expected | ✓/✗ | Notes |
|---|------|----------|-----|-------|
| H1 | Page background (dark mode) | `#282c34` (One Dark) | | |
| H2 | Page background (light mode) | Off-white / Cosmo theme | | |
| H3 | Body text (dark mode) | `#abb2bf` | | |
| H4 | Link colour (dark mode) | `#61afef` (blue) | | |

#### OS dark mode detection

| # | Item | Expected | ✓/✗ | Notes |
|---|------|----------|-----|-------|
| H5 | OS set to dark, first load | Page loads in dark mode automatically | | |
| H6 | OS set to light, first load | Page loads in light mode | | |
| H7 | Manual toggle in Quarto header | Switches between modes | | |
| H8 | Reload after toggle | Persists last chosen mode | | |

#### Figures

| # | Item | Expected | ✓/✗ | Notes |
|---|------|----------|-----|-------|
| H9  | ggplot2 (Test 1) | Transparent background; page colour behind plot | | |
| H10 | Base R (Test 2) | Dark companion shown in dark mode | | |
| H11 | Transparent curve (Test 3) | Page colour visible through axes | | |
| H12 | include_graphics PNG (Test 6) | Dark companion (`*-auto-dark.png`) shown | | |
| H13 | `*-auto-dark.*` files exist | `find tests -name "*-auto-dark.*"` returns results | | |

#### Tables

| # | Item | Expected | ✓/✗ | Notes |
|---|------|----------|-----|-------|
| H14 | gt table (Test 4) | Dark background; light text; legible borders | | |
| H15 | gtsummary table (Test 5) | Same as gt | | |
| H16 | Markdown table (Test 9) | Border `#3e4451`; text `#abb2bf` | | |

#### Typography

| # | Item | Expected | ✓/✗ | Notes |
|---|------|----------|-----|-------|
| H17 | Code block (Test 7) | Panel bg `#21252b`; text `#e6edf3` | | |
| H18 | Callout note (Test 8) | Panel bg `#21252b`; coloured border | | |
| H19 | Callout warning (Test 8) | Warning border colour visible | | |
| H20 | Callout tip (Test 8) | Tip border colour visible | | |

---

### RevealJS presentation (`tests/test-revealjs.html`)

#### Slide appearance

| # | Item | Expected | ✓/✗ | Notes |
|---|------|----------|-----|-------|
| R1 | Slide background (dark mode) | `#282c34` | | |
| R2 | Slide background (light mode) | White | | |
| R3 | ☾/☀ button location | Top-right corner | | |
| R4 | ☾/☀ toggle works | Switches between modes | | |
| R5 | Reload after toggle | Persists last chosen mode | | |
| R6 | First load (OS dark) | Starts in dark mode | | |

#### Figures

| # | Item | Expected | ✓/✗ | Notes |
|---|------|----------|-----|-------|
| R7  | ggplot2 (Test 1) | Transparent; slide bg visible | | |
| R8  | Base R (Test 2) | Dark companion shown | | |
| R9  | Transparent curve (Test 3) | Slide bg visible through axes | | |
| R10 | include_graphics PNG (Test 6) | Dark companion shown | | |

#### Tables & typography

| # | Item | Expected | ✓/✗ | Notes |
|---|------|----------|-----|-------|
| R11 | gt table (Test 4) | Readable in dark mode | | |
| R12 | gtsummary table (Test 5) | Same as gt | | |
| R13 | Code block (Test 7) | Panel bg `#21252b` | | |
| R14 | Callout note (Test 8) | Panel bg visible | | |
| R15 | Markdown table (Test 9) | Legible borders and text | | |

---

## Known limitations

- Interactive widgets (`plotly`, `htmlwidgets`) are **not** re-themed. They may need
  their own package-specific dark theme options.
- SVGs are affected by the CSS fallback filter but not by the companion-image workflow.
- PDF output is unchanged by this extension.
- Screenshot comparison is not automated on macOS (browser subagent requires Linux).
  Visual verification is manual.

---

## Companion image verification

After running the test suite:

```bash
find tests -name "*-auto-dark.*"
```

Expected output: at least 3–4 `*-auto-dark.png` files (one per rendered figure).

If no companions appear, check that `magick` is installed:

```r
requireNamespace("magick")
```

If `magick` is missing, the extension falls back to CSS filtering (less precise,
but functional).
