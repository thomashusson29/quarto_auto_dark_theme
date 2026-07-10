# Quarto Auto Dark Theme

Quarto extension for One Dark–style documents and RevealJS presentations.

Applies automatically when the user's OS is in dark mode. Includes transparent plot
backgrounds, dark companion images for all figure types, and styled `gt`/`gtsummary`
tables — with no extra configuration beyond `auto_dark_on()`.

OS-level dark mode detection is adapted from
[gadenbuie/quarto-auto-dark](https://github.com/gadenbuie/quarto-auto-dark) by Garrick
Aden-Buie (MIT). Only the Lua filter mechanism is borrowed; the One Dark palette and
companion-image workflow are original.

Live examples:

- [HTML document](https://thomashusson29.github.io/quarto_auto_dark_theme/template.html)
- [RevealJS presentation](https://thomashusson29.github.io/quarto_auto_dark_theme/examples/revealjs.html)

---

## Quickstart

### 1 — Install

```bash
quarto add thomashusson29/quarto_auto_dark_theme
```

This creates two folders in your project:

```
_extensions/
  thomashusson29/
    auto-dark/          ← core extension (CSS, JS, R, Lua)
    auto-dark-clean/    ← thin RevealJS wrapper
```

### 2 — Set up your document

Add the format and a setup chunk:

````qmd
---
title: "My report"
format: auto-dark-html
---

```{r}
#| include: false
source("_extensions/thomashusson29/auto-dark/auto-dark-setup.R")
auto_dark_on()
```
````

### 3 — Render

```bash
quarto render my-report.qmd
```

That's it. Your document now has:

- One Dark background (`#282c34`) in dark mode, Cosmo theme in light mode
- Automatic OS-level dark mode on first load and while the page is open
- No persistent HTML light/dark toggle to block OS changes
- Transparent plot backgrounds
- Dark companion images for every figure
- Styled `gt`/`gtsummary` tables

---

## GitHub Pages (with `/docs` output)

This is the recommended setup for publishing on GitHub Pages from a `/docs` folder.

### Project layout

```
my-project/
├── _quarto.yml          ← project config
├── _extensions/         ← installed by quarto add
├── .nojekyll            ← required (see below)
├── docs/
│   └── .nojekyll        ← also required in docs/
├── report.qmd
└── index.qmd
```

### `_quarto.yml`

```yaml
project:
  type: default
  output-dir: docs

format:
  auto-dark-html:
    toc: true
```

### Why two `.nojekyll` files?

GitHub Pages runs Jekyll by default. Jekyll silently drops any folder whose name starts
with `_`, including `_extensions/`. The extension's JavaScript (`auto-dark-renderings.js`)
needs to be served — without it, dark companion images are never swapped in.

- `.nojekyll` at the **repo root** — disables Jekyll for the whole repo.
- `docs/.nojekyll` — disables Jekyll specifically for the `docs/` output folder
  (required when using `output-dir: docs` or when GitHub Pages is configured to serve
  from `docs/`).

```bash
touch .nojekyll docs/.nojekyll
```

You only need to do this once. Commit both files.

### GitHub Pages settings

In your repository → Settings → Pages:

- **Source**: Deploy from a branch
- **Branch**: `main` (or your default branch)
- **Folder**: `/docs`

### Full workflow

```bash
# 1. Create docs/ output folder and .nojekyll files (once)
mkdir -p docs
touch .nojekyll docs/.nojekyll

# 2. Render your project
quarto render

# 3. Commit and push
git add .
git commit -m "Render"
git push
```

GitHub Actions will pick up the push and deploy from `docs/`.

> **Note**: OS dark mode detection requires `https://`. It will not work if you open
> an HTML file directly from your filesystem (`file://`). On GitHub Pages it works
> automatically.

---

## Usage details

### HTML document

```yaml
---
title: "My report"
format:
  auto-dark-html:
    toc: true
    toc-depth: 2
---
```

Setup chunk (hidden, runs once):

```r
#| label: setup
#| include: false
source("_extensions/thomashusson29/auto-dark/auto-dark-setup.R")
auto_dark_on()
```

### RevealJS presentation

```yaml
---
title: "My slides"
format:
  auto-dark-clean-revealjs:
    slide-number: true
---
```

Same setup chunk, same path.

### Document in a subfolder

If your `.qmd` is in a subfolder (e.g. `reports/my-report.qmd`), go up one level:

```r
source("../_extensions/thomashusson29/auto-dark/auto-dark-setup.R")
auto_dark_on()
```

The rule: the path must reach `_extensions/` relative to the `.qmd` file's location.

### Installed from a local checkout

When using `quarto add /path/to/local/repo`, Quarto installs the extension as
`_extensions/auto-dark` (no owner prefix). Use:

```r
source("_extensions/auto-dark/auto-dark-setup.R")
auto_dark_on()
```

---

## How it works

No single R package can make every Quarto figure, table, and image respond to a
browser-side theme switch. This extension uses a hybrid approach:

| Layer | Responsibility |
|---|---|
| **Quarto** | Uses light/dark Bootstrap stylesheets and reads OS preference via `respect-user-color-scheme` |
| **System JS** | Clears Quarto's saved manual colour-scheme override so HTML pages keep following OS changes |
| **Lua filter** | Injects a `prefers-color-scheme` CSS layer on first load (adapted from gadenbuie/quarto-auto-dark) |
| **CSS** | One Dark palette for body, code, callouts, markdown tables, `gt`/`gtsummary` tables |
| **R (`auto_dark_on()`)** | Sets `bg = "transparent"` on the graphics device; installs knitr plot hook |
| **Plot hook** | Generates a `*-auto-dark.*` companion image for every rendered PNG/JPEG/WebP via `magick` |
| **include_graphics adapter** | Same companion generation for files inserted with `knitr::include_graphics()` |
| **JavaScript** | On page load, probes for companion images and inserts hidden dark copies; CSS shows the right one |
| **RevealJS** | `☾/☀` toggle button; early theme-class injection to prevent flash-of-wrong-theme |

### One Dark palette

| Role | CSS variable | Color |
|---|---|---|
| Background | `--auto-dark-bg` | `#282c34` |
| Soft background | `--auto-dark-bg-soft` | `#2c313a` |
| Panel (code blocks) | `--auto-dark-panel` | `#21252b` |
| Border | `--auto-dark-border` | `#3e4451` |
| Text | `--auto-dark-text` | `#abb2bf` |
| Strong text | `--auto-dark-text-strong` | `#e6edf3` |
| Blue (links) | `--auto-dark-link` | `#61afef` |
| Green | `--auto-dark-green` | `#98c379` |
| Red | `--auto-dark-red` | `#e06c75` |
| Purple | `--auto-dark-accent` | `#c678dd` |

Defined once in `_extensions/auto-dark/auto-dark.css`.

---

## R packages

Required for the robust image workflow:

| Package | Why |
|---|---|
| `knitr` | Plot hook and include_graphics adapter |
| `magick` | Dark companion image generation |

Without `magick`, the extension falls back to CSS filter inversion (less precise but
functional). A warning is shown at render time.

Used by the examples (not required by the extension itself):

`ggplot2`, `dplyr`, `gt`, `gtsummary`, `flowchart`, `forestplot`, `rpart`,
`rpart.plot`, `pROC`

Optional:

- `thematic` — only when calling `auto_dark_on(thematic = TRUE)`

---

## API

```r
auto_dark_on(
  palette             = "onedark",  # Only "onedark" is currently supported
  mode                = "robust",   # "robust" = companion images; "filter" = CSS only
  transparent_figures = TRUE,       # Set bg = "transparent" on graphics device
  generate_dark_images = TRUE,      # Create *-auto-dark.* companion images via magick
  include_graphics    = TRUE,       # Hook knitr::include_graphics() too
  flowchart           = TRUE,       # Patch flowchart::fc_draw() canvas_bg
  thematic            = FALSE,      # Call thematic::thematic_on() with One Dark palette
  quiet               = FALSE       # Suppress warnings about missing packages
)
```

To opt a specific chunk out of CSS filtering:

```r
#| class.output: auto-dark-no-filter
```

---

## Limits

- **PDF**: unchanged.
- **Interactive widgets** (`plotly`, `htmlwidgets`): not re-themed. Use their own dark
  theme options.
- **SVGs**: affected by CSS fallback filter only; not by the companion-image workflow.
- **Re-run**: the browser switch does not re-run R code. Dark images are generated at
  render time.
- **`file://` protocol**: OS dark mode detection requires `http://` or `https://`.
  Open files via `quarto preview` or a static server for local testing.

---

## Examples

The examples are published on GitHub Pages:

- <https://thomashusson29.github.io/quarto_auto_dark_theme/>

Render locally:

```bash
quarto render template.qmd --to auto-dark-html
quarto render examples/revealjs.qmd --to auto-dark-clean-revealjs
```

---

## Development

Run the automated test suite (render + R syntax check + companion image check):

```bash
bash tests/run-tests.sh
```

Then open `tests/test-html.html` and `tests/test-revealjs.html` via `quarto preview`
(not `file://`) and verify visually.
