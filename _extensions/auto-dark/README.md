# Auto Dark Quarto

Reusable Quarto formats for One Dark HTML documents and RevealJS slides.

## Formats

- `auto-dark-html`: Quarto HTML with native light/dark switching, `cosmo` in
  light mode and `darkly` layered with One Dark CSS in dark mode.
- `auto-dark-revealjs`: RevealJS slides with a small icon-only switch.
- `auto-dark-clean-revealjs`: sibling format for clean RevealJS slides.

## R Setup

Use this hidden setup chunk for R documents:

```r
source("_extensions/thomashusson29/auto-dark/auto-dark-setup.R")
auto_dark_on()
```

`auto_dark_on()` is explicit by design. Sourcing the file defines the helpers;
calling the function activates the robust dark-mode behavior.

## Robust Plot Strategy

The default mode is `mode = "robust"`:

- knitr figures are rendered with transparent device backgrounds;
- every generated PNG/JPEG/WebP gets a companion `*-auto-dark.*` image;
- local PNG/JPEG/WebP files inserted with `knitr::include_graphics()` also get
  a companion dark image when possible;
- the browser switch shows the light image in light mode and the companion dark
  image in dark mode;
- if a companion cannot be generated, CSS filtering remains as a fallback;
- `flowchart::fc_draw()` defaults to `canvas_bg = "transparent"` unless the
  chunk explicitly provides another value.

This keeps Quarto's native figure handling intact: captions, numbering,
cross-references, dimensions, and RevealJS sizing remain controlled by Quarto.

## Palette

The shared One Dark palette is:

- background: `#282c34`
- soft background: `#2c313a`
- panel: `#21252b`
- border/grid: `#3e4451`
- text: `#abb2bf`
- strong text: `#e6edf3`
- accents: `#61afef`, `#98c379`, `#e06c75`, `#c678dd`

## Options

```r
auto_dark_on(
  palette = "onedark",
  mode = "robust",
  transparent_figures = TRUE,
  generate_dark_images = TRUE,
  include_graphics = TRUE,
  flowchart = TRUE,
  thematic = FALSE
)
```

Use `.auto-dark-no-filter` on a chunk or image to opt out of dark figure
processing for a specific output.

`thematic` is optional and off by default. `gt`/`gtsummary` tables are styled by
CSS, not by `thematic`.
