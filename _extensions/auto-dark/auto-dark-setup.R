`%||%` <- function(x, y) {
  if (is.null(x) || length(x) == 0 || all(is.na(x))) y else x
}

auto_dark_state <- new.env(parent = emptyenv())
auto_dark_state$active <- FALSE
auto_dark_state$plot_hook_installed <- FALSE
auto_dark_state$plot_hook_original <- NULL
auto_dark_state$include_graphics_installed <- FALSE
auto_dark_state$include_graphics_original <- NULL
auto_dark_state$flowchart_installed <- FALSE
auto_dark_state$flowchart_original <- NULL

auto_dark_palette <- function(name = "onedark") {
  if (!identical(name, "onedark")) {
    stop("Only palette = 'onedark' is currently supported.", call. = FALSE)
  }

  list(
    name = "onedark",
    bg = "#282c34",
    bg_soft = "#2c313a",
    panel = "#21252b",
    border = "#3e4451",
    text = "#abb2bf",
    text_strong = "#e6edf3",
    text_muted = "#8b949e",
    blue = "#61afef",
    green = "#98c379",
    red = "#e06c75",
    purple = "#c678dd"
  )
}

auto_dark_html_output <- function() {
  requireNamespace("knitr", quietly = TRUE) && isTRUE(knitr::is_html_output())
}

auto_dark_configure_transparent_figures <- function() {
  if (!auto_dark_html_output()) {
    return(invisible(FALSE))
  }

  auto_dark_dev_args <- knitr::opts_chunk$get("dev.args")
  if (is.null(auto_dark_dev_args)) {
    auto_dark_dev_args <- list()
  }
  auto_dark_dev_args$bg <- "transparent"

  knitr::opts_chunk$set(
    fig.bg = "transparent",
    dev.args = auto_dark_dev_args
  )

  invisible(TRUE)
}

auto_dark_companion_path <- function(path) {
  sub("(\\.[^.\\/]+)$", "-auto-dark\\1", path)
}

auto_dark_can_process_image <- function(path) {
  ext <- tolower(tools::file_ext(path))
  nzchar(ext) && ext %in% c("png", "jpg", "jpeg", "webp") && file.exists(path)
}

auto_dark_make_dark_image <- function(path, palette = auto_dark_palette()) {
  if (!auto_dark_can_process_image(path) ||
      !requireNamespace("magick", quietly = TRUE)) {
    return(invisible(NULL))
  }

  dark_path <- auto_dark_companion_path(path)
  if (file.exists(dark_path) &&
      file.info(dark_path)$mtime >= file.info(path)$mtime) {
    return(invisible(dark_path))
  }

  image <- magick::image_read(path)

  # Exact white is usually device/page background. Keep near-white plotted
  # elements intact so clinical diagrams do not lose boxes or labels.
  image <- magick::image_transparent(image, color = "white", fuzz = 0.005)
  image <- magick::image_negate(image)
  image <- magick::image_modulate(image, hue = 200)

  dir.create(dirname(dark_path), recursive = TRUE, showWarnings = FALSE)
  magick::image_write(image, path = dark_path)

  invisible(dark_path)
}

auto_dark_make_dark_images <- function(paths, options = knitr::opts_current$get()) {
  if (!isTRUE(getOption("auto_dark.generate_dark_images", TRUE)) ||
      !auto_dark_html_output()) {
    return(invisible(NULL))
  }

  class <- paste(options$class.output %||% character(), collapse = " ")
  if (grepl("auto-dark-no-filter", class, fixed = TRUE)) {
    return(invisible(NULL))
  }

  palette <- getOption("auto_dark.palette", auto_dark_palette())
  lapply(paths, auto_dark_make_dark_image, palette = palette)
  invisible(NULL)
}

auto_dark_install_plot_hook <- function() {
  if (!requireNamespace("knitr", quietly = TRUE) ||
      isTRUE(auto_dark_state$plot_hook_installed)) {
    return(invisible(FALSE))
  }

  auto_dark_state$plot_hook_original <- knitr::knit_hooks$get("plot")

  knitr::knit_hooks$set(plot = function(x, options) {
    auto_dark_make_dark_images(x, options)
    auto_dark_state$plot_hook_original(x, options)
  })

  auto_dark_state$plot_hook_installed <- TRUE
  invisible(TRUE)
}

auto_dark_install_include_graphics_adapter <- function() {
  if (!requireNamespace("knitr", quietly = TRUE) ||
      isTRUE(auto_dark_state$include_graphics_installed)) {
    return(invisible(FALSE))
  }

  original <- getS3method(
    "knit_print",
    "knit_image_paths",
    envir = asNamespace("knitr"),
    optional = TRUE
  )

  auto_dark_state$include_graphics_original <- original

  wrapper <- function(x, options, ...) {
    auto_dark_make_dark_images(as.character(x), options)

    if (!is.null(original)) {
      return(original(x, options, ...))
    }

    NextMethod()
  }

  registerS3method(
    "knit_print",
    "knit_image_paths",
    wrapper,
    envir = asNamespace("knitr")
  )

  auto_dark_state$include_graphics_installed <- TRUE
  invisible(TRUE)
}

auto_dark_install_flowchart_adapter <- function() {
  if (isTRUE(auto_dark_state$flowchart_installed) ||
      !requireNamespace("flowchart", quietly = TRUE)) {
    return(invisible(FALSE))
  }

  original <- getS3method(
    "fc_draw",
    "fc",
    envir = asNamespace("flowchart"),
    optional = TRUE
  )
  if (is.null(original)) {
    return(invisible(FALSE))
  }

  auto_dark_state$flowchart_original <- original

  wrapper <- function(object, ..., canvas_bg = "transparent") {
    original(object, ..., canvas_bg = canvas_bg)
  }

  registerS3method(
    "fc_draw",
    "fc",
    wrapper,
    envir = asNamespace("flowchart")
  )

  auto_dark_state$flowchart_installed <- TRUE
  invisible(TRUE)
}

auto_dark_on <- function(palette = "onedark",
                         mode = "robust",
                         transparent_figures = TRUE,
                         generate_dark_images = TRUE,
                         include_graphics = TRUE,
                         flowchart = TRUE,
                         thematic = FALSE,
                         quiet = FALSE) {
  if (!mode %in% c("robust", "filter")) {
    stop("mode must be 'robust' or 'filter'.", call. = FALSE)
  }

  pal <- auto_dark_palette(palette)

  options(
    auto_dark.active = TRUE,
    auto_dark.mode = mode,
    auto_dark.palette = pal,
    auto_dark.transparent_figures = transparent_figures,
    auto_dark.generate_dark_images = generate_dark_images
  )

  if (isTRUE(transparent_figures)) {
    auto_dark_configure_transparent_figures()
  }

  if (isTRUE(generate_dark_images)) {
    auto_dark_install_plot_hook()
  }

  if (isTRUE(generate_dark_images) && isTRUE(include_graphics)) {
    auto_dark_install_include_graphics_adapter()
  }

  if (isTRUE(flowchart)) {
    auto_dark_install_flowchart_adapter()
  }

  if (isTRUE(thematic)) {
    if (requireNamespace("thematic", quietly = TRUE)) {
      thematic::thematic_on(bg = pal$bg, fg = pal$text, accent = pal$blue)
    } else if (!isTRUE(quiet)) {
      warning("Package 'thematic' is not installed; R plots will use their default theme.")
    }
  }

  if (!requireNamespace("magick", quietly = TRUE) &&
      isTRUE(generate_dark_images) &&
      !isTRUE(quiet)) {
    warning("Package 'magick' is not installed; dark plot images will fall back to CSS filtering only.")
  }

  auto_dark_state$active <- TRUE
  invisible(pal)
}

auto_dark_off <- function() {
  options(
    auto_dark.active = FALSE,
    auto_dark.generate_dark_images = FALSE
  )
  auto_dark_state$active <- FALSE
  invisible(TRUE)
}
