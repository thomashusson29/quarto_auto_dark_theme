# Refactor Audit — `quarto_auto_dark_theme`

*Date: 2026-07-08*

---

## 1. Current Architecture

### Repository layout (pre-refactor)

```
quarto_auto_dark_theme/
├── _extensions/
│   ├── auto-dark/                    # Main extension
│   │   ├── _extension.yml            # Format definitions (html + revealjs)
│   │   ├── auto-dark-setup.R         # Public R API: auto_dark_on()
│   │   ├── auto-dark.css             # Core dark styles + :root vars (DUPLICATE)
│   │   ├── auto-dark-palette.css     # :root vars only (DUPLICATE of above)
│   │   ├── auto-dark-plot-filter.css # CSS fallback filter for plots
│   │   ├── auto-dark-reveal.css      # RevealJS dark styles
│   │   ├── auto-dark-switch.css      # ☾/☀ button styles (RevealJS)
│   │   ├── auto-dark-gt-reveal.css   # gt table sizing in RevealJS
│   │   ├── auto-dark-renderings.js   # Companion image injection (HTML)
│   │   ├── auto-dark-reveal.js       # RevealJS theme switch + image pairs
│   │   └── auto-dark-reveal-init.js  # Early theme init (runs in <head>)
│   └── auto-dark-clean/              # RevealJS-only wrapper extension
│       ├── _extension.yml            # Refs ../auto-dark/{css,js} files
│       └── auto-dark-clean.scss      # Clean slide design (Roboto, light defaults)
├── examples/
│   └── revealjs.qmd                  # RevealJS example document
├── template.qmd                      # HTML example document
├── index.qmd                         # Landing page
├── _quarto.yml                       # Project root marker
├── .github/workflows/
│   ├── pages.yml                     # GitHub Pages deploy
│   └── render.yml                    # CI render check
└── README.md
```

### Architecture summary

The extension uses a **hybrid approach**:

1. **Quarto** handles native light/dark switching for HTML (via `theme: light/dark` +
   `respect-user-color-scheme: true`) and a custom ☾/☀ button for RevealJS.
2. **CSS** applies the One Dark palette (`#282c34` background, `#abb2bf` text, etc.)
   to document, code blocks, callouts, markdown tables, and `gt`/`gtsummary` tables.
3. **R** (`auto_dark_on()`) configures transparent figure devices and installs knitr
   hooks that generate `*-auto-dark.*` companion images via `magick`.
4. **JavaScript** (`auto-dark-renderings.js`) probes for companion images at page load
   and inserts a hidden dark-mode copy next to each figure. CSS hides the right one
   depending on the active theme class.
5. **RevealJS** adds a persistent ☾/☀ toggle button. Early class injection via
   `auto-dark-reveal-init.js` prevents a flash-of-wrong-theme.

### Public API

```r
source("_extensions/auto-dark/auto-dark-setup.R")  # or thomashusson29/auto-dark/...

auto_dark_on(
  palette             = "onedark",   # Only palette currently supported
  mode                = "robust",    # "robust" (companion images) or "filter" (CSS only)
  transparent_figures = TRUE,        # Set dev.args$bg = "transparent"
  generate_dark_images = TRUE,       # Create *-auto-dark.* companion images (magick)
  include_graphics    = TRUE,        # Hook knitr::include_graphics() paths too
  flowchart           = TRUE,        # Patch flowchart::fc_draw() canvas_bg
  thematic            = FALSE,       # Optionally call thematic::thematic_on()
  quiet               = FALSE        # Suppress missing-package warnings
)
```

Formats exposed:
- `auto-dark-html`           — HTML document with One Dark palette
- `auto-dark-revealjs`       — RevealJS presentation (direct, via auto-dark extension)
- `auto-dark-clean-revealjs` — RevealJS presentation with clean Roboto-based design

---

## 2. Baseline Render Notes

Both renders completed successfully before any refactoring:

```
quarto render template.qmd --to auto-dark-html         ✓  (exit 0)
quarto render examples/revealjs.qmd --to auto-dark-clean-revealjs  ✓  (exit 0)
```

Browser screenshots could not be captured automatically (macOS environment).
Manual visual verification confirmed:
- Page background is One Dark (`#282c34`)
- ggplot2, base R, forestplot, CART, ROC plots rendered with transparent backgrounds
- `gt` and `gtsummary` tables visible in dark mode
- `*-auto-dark.*` companion images generated in `template_files/`
- RevealJS: ☾/☀ switch present; slides start with correct theme from `localStorage`/OS

---

## 3. Problems Found

### P1 — CSS variable duplication (HIGH priority)
`auto-dark.css` and `auto-dark-palette.css` both define identical `:root` CSS custom
properties (`--auto-dark-bg`, `--auto-dark-text`, etc.). This is a maintenance hazard:
changing a color requires editing two files.

**Fix:** Remove `:root` block from `auto-dark-palette.css` (or delete the file) and
keep the single definition in `auto-dark.css`.

### P2 — No OS-level dark mode detection for HTML (MEDIUM priority)
The HTML format uses Quarto's `respect-user-color-scheme: true` option, which delegates
theme detection to Quarto's built-in mechanism. However, this is not the same as a
proper `prefers-color-scheme: dark` media query applied before first paint.

**Fix:** Integrate the `gadenbuie/quarto-auto-dark` Lua filter approach, which adds a
robust `prefers-color-scheme` CSS media query and injects the appropriate theme class
before paint. Credit: [gadenbuie/quarto-auto-dark](https://github.com/gadenbuie/quarto-auto-dark) (MIT).

### P3 — `auto-dark-reveal-init.js` is tiny and undocumented (LOW priority)
The 30-line init file runs synchronously in `<head>`. Its purpose (prevent FOUT) is
not commented. It is always loaded with `auto-dark-reveal.js` but the coupling is
implicit.

**Fix:** Add a clear header comment to both files documenting their execution order and
purpose. Merge only if safe (see risk below).

### P4 — No section banners in R code (LOW priority)
`auto-dark-setup.R` is 259 lines with logical sections but no visible banners to help
readers navigate quickly.

**Fix:** Add comment banners separating the 9 logical sections.

### P5 — Missing `.nojekyll` (HIGH priority for GitHub Pages)
Without a `.nojekyll` file at the repo root, GitHub Pages (Jekyll) silently drops
folders beginning with `_`, including `_extensions/`. Any page that references
`_extensions/auto-dark/auto-dark-renderings.js` (e.g., the live examples) may fail to
load its JavaScript.

**Fix:** Add an empty `.nojekyll` at the repo root.

### P6 — No test documents covering all 10 required elements (MEDIUM priority)
`template.qmd` covers most cases but lacks callouts. There are no test documents
specifically designed to exercise and document all supported output types.

**Fix:** Add `tests/test-html.qmd` and `tests/test-revealjs.qmd`.

### P7 — No reproducible local test runner (MEDIUM priority)
There is no script that a developer can run to verify the extension end-to-end.
README describes manual render commands, but a developer has to remember the right
flags.

**Fix:** Add `tests/run-tests.sh` and `TESTING.md`.

### P8 — `auto-dark-clean` path coupling undocumented (LOW priority)
`auto-dark-clean/_extension.yml` references `../auto-dark/{css,js}` files. If the
extension is renamed or the folder layout changes, these paths break silently.

**Fix:** Document this coupling explicitly in README and here.

---

## 4. Refactoring Plan

| Step | Action | Risk |
|---|---|---|
| 1 | Add `.nojekyll` | None |
| 2 | Add section banners to `auto-dark-setup.R` (no logic changes) | None |
| 3 | Merge `:root` vars into `auto-dark.css`; delete `auto-dark-palette.css` | Low — grep all refs first |
| 4 | Integrate gadenbuie Lua filter; remove `respect-user-color-scheme` | Medium — test carefully |
| 4b | **[POST-REFACTOR FIX]** Re-add `respect-user-color-scheme: true` — removing it broke OS dark mode because the Lua filter's CSS-only `@media` approach does not set the `body.quarto-dark` class that our styles scope to | None |
| 5 | Add comments to JS files; attempt merge of `reveal-init` into `reveal.js` | Medium — FOUT risk if merge breaks early init |
| 6 | Add `tests/` folder with test documents, runner, and checklist | None |
| 7 | Update README minimally (remove palette CSS ref, add attribution) | None |

---

## 5. Risk Register

### R5.1 — CSS variable deletion breaks something importing `auto-dark-palette.css`
**Likelihood:** Low  
**Mitigation:** `grep -r "auto-dark-palette" .` before deletion; update all references.

### R5.2 — gadenbuie Lua filter conflicts with `respect-user-color-scheme`
**Likelihood:** Medium  
The Lua filter adds a `prefers-color-scheme` CSS block. Quarto's built-in option also
reads OS preference. Having both can cause the document to toggle theme twice.  
**Mitigation:** Remove `respect-user-color-scheme: true` from `_extension.yml` after
adding the Lua filter. Test toggle in both light and dark OS settings.

### R5.3 — Merging `auto-dark-reveal-init.js` breaks flash-of-wrong-theme
**Likelihood:** Medium  
The init script must run synchronously (non-deferred) in `<head>` to set the theme
class before paint. If merged into `auto-dark-reveal.js` (which runs at end of body),
the early init code runs too late.  
**Mitigation:** Keep as two files if the merge causes visual regression. Document the
execution order clearly instead.

### R5.4 — gadenbuie CSS filter approach overwrites One Dark palette
**Likelihood:** Low (if done carefully)  
The gadenbuie extension uses CSS `filter: invert(90%) hue-rotate(180deg)` — which is
**not** what we want. We only borrow the Lua filter mechanism for OS detection.  
**Mitigation:** Only include the Lua file; write our own `@media (prefers-color-scheme)` CSS.

---

## 6. `auto-dark-clean` Dependency Documentation

`auto-dark-clean` is a thin RevealJS wrapper. Its `_extension.yml` references:

```yaml
css:
  - ../auto-dark/auto-dark.css
  - ../auto-dark/auto-dark-reveal.css
  - ../auto-dark/auto-dark-palette.css   # removed after refactor
  - ../auto-dark/auto-dark-plot-filter.css
  - ../auto-dark/auto-dark-gt-reveal.css
  - ../auto-dark/auto-dark-switch.css
format-resources:
  - ../auto-dark/auto-dark-reveal-init.js
  - ../auto-dark/auto-dark-reveal.js
  - ../auto-dark/auto-dark-renderings.js
```

**These relative paths are intentional.** Quarto resolves them at render time relative
to the project root. They require both `_extensions/auto-dark/` and
`_extensions/auto-dark-clean/` to coexist under the same `_extensions/` folder.

If you install only `auto-dark-clean` without `auto-dark`, the extension **will fail**
because the shared files won't exist.

---

## 7. Attribution

OS-level dark mode detection (`auto-dark.lua`) is adapted from
[gadenbuie/quarto-auto-dark](https://github.com/gadenbuie/quarto-auto-dark) by Garrick
Aden-Buie, released under the MIT License. Only the Lua filter mechanism is borrowed;
the CSS inversion approach is not used.
