# Quarto Auto Dark Theme

Reusable Quarto extension for robust One Dark HTML documents and RevealJS
presentations.

The extension keeps the public format names short:

- `auto-dark-html`
- `auto-dark-revealjs`
- `auto-dark-clean-revealjs`

It is designed for broad static Quarto output: `ggplot2`, base R graphics,
`flowchart`, `forestplot`, CART plots, ROC plots, images inserted with
`knitr::include_graphics()`, and `gt`/`gtsummary` tables.

## Installation

Install from GitHub:

```bash
quarto add thomashusson29/quarto_auto_dark_theme
```

Install from a local checkout:

```bash
quarto add /path/to/quarto_auto_dark_theme --no-prompt
```

This creates `_extensions/auto-dark` and `_extensions/auto-dark-clean` in your
project.

## Usage

For an HTML document at the project root:

```yaml
---
title: "My report"
format:
  auto-dark-html:
    toc: true
---
```

Add this once in a hidden setup chunk:

```r
source("_extensions/thomashusson29/auto-dark/auto-dark-setup.R")
auto_dark_on()
```

If the `.qmd` is in a subfolder, adapt the path:

```r
source("../_extensions/thomashusson29/auto-dark/auto-dark-setup.R")
auto_dark_on()
```

When installing from a local path with `quarto add /path/to/repo`, Quarto may
install the extension as `_extensions/auto-dark` instead. In that case, use the
same path without the GitHub owner:

```r
source("_extensions/auto-dark/auto-dark-setup.R")
auto_dark_on()
```

For subfolder rendering, keep a Quarto project root next to `_extensions`:

```yaml
# _quarto.yml
project:
  type: default
```

For RevealJS:

```yaml
---
title: "My slides"
format:
  auto-dark-clean-revealjs:
    slide-number: true
---
```

Then use the same setup chunk, with the relative path adjusted to the `.qmd`
location.

## How It Works

The extension uses a hybrid approach because no single R package can make every
Quarto figure, table, and image respond perfectly to a browser-side theme
switch.

- Quarto handles the native light/dark switch for HTML output.
- CSS applies the One Dark palette to the document, code, callouts, markdown
  tables, and `gt`/`gtsummary` tables.
- `auto_dark_on()` configures transparent figure devices for HTML output.
- A knitr plot hook creates a dark companion image named `*-auto-dark.*` for
  each generated PNG/JPEG/WebP.
- A `knitr::include_graphics()` adapter creates companion images for local
  PNG/JPEG/WebP files inserted from disk.
- A small browser script swaps light images for their dark companions when the
  page switches to dark mode.
- `flowchart::fc_draw()` gets a small adapter so its canvas is transparent by
  default.
- RevealJS gets a small icon-only switch and the same image companion logic.

The shared One Dark palette is:

| Role | Color |
|---|---|
| Background | `#282c34` |
| Soft background | `#2c313a` |
| Panel | `#21252b` |
| Border/grid | `#3e4451` |
| Text | `#abb2bf` |
| Strong text | `#e6edf3` |
| Accents | `#61afef`, `#98c379`, `#e06c75`, `#c678dd` |

## R Packages

Required for the robust image workflow:

- `knitr`
- `magick`

Used by the examples:

- `ggplot2`
- `dplyr`
- `gt`
- `gtsummary`
- `flowchart`
- `forestplot`
- `rpart`
- `rpart.plot`
- `pROC`

Optional:

- `thematic`, only when calling `auto_dark_on(thematic = TRUE)`.

`gt` and `gtsummary` are intentionally styled with CSS, not `thematic`.

## API

```r
auto_dark_on(
  palette = "onedark",
  mode = "robust",
  transparent_figures = TRUE,
  generate_dark_images = TRUE,
  include_graphics = TRUE,
  flowchart = TRUE,
  thematic = FALSE,
  quiet = FALSE
)
```

Use `.auto-dark-no-filter` on an image or chunk output to opt out of fallback
CSS filtering for a specific output.

## Limits

- This extension targets HTML and RevealJS output. PDF is unchanged.
- Static plots and local image files are supported through companion images.
- Interactive widgets such as `plotly`, `htmlwidgets`, or custom JavaScript
  widgets are not re-rendered as true dark widgets. They may need their own
  package-specific theme options.
- SVGs can be affected by fallback CSS filters, but the robust companion-image
  path is for PNG/JPEG/WebP.
- The browser switch does not re-run R code. Dark images are generated at render
  time.

## Examples

Render the HTML example:

```bash
quarto render template.qmd --to auto-dark-html
```

Render the RevealJS example:

```bash
quarto render examples/revealjs.qmd --to auto-dark-clean-revealjs
```

## Development Checks

```bash
quarto render template.qmd --to auto-dark-html
quarto render examples/revealjs.qmd --to auto-dark-clean-revealjs
```

Then open the generated pages and verify that:

- the light/dark switch works;
- the background is One Dark, not black;
- `gt`/`gtsummary` tables are readable;
- generated figures use `*-auto-dark.*` companions in dark mode;
- captions are not duplicated.
