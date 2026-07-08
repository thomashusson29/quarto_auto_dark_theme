/*
 * auto-dark-reveal.js
 *
 * Runs at end of <body> for RevealJS presentations.
 *
 * Responsibilities:
 *   1. Read the persisted theme and apply it (dark/light classes + button state).
 *   2. Install the ☾/☀ toggle button in the top-right corner.
 *   3. Persist the chosen theme to localStorage on toggle.
 *   4. Trigger Reveal.layout() after theme change to fix slide sizing.
 *   5. Install companion image pairs for slides with multiple renderings.
 *
 * Execution order:
 *   1. auto-dark-reveal-init.js  — runs synchronously in <head>
 *   2. auto-dark-reveal.js       — this file, runs at end of <body>
 *   3. auto-dark-renderings.js   — runs at end of <body>, installs companion images
 *
 * Theme classes managed:
 *   html / body:
 *     .auto-dark-theme-dark  / .auto-dark-theme-light
 *     .quarto-dark           / .quarto-light
 *   data-auto-dark-theme attribute: "dark" | "light"
 */
(function () {
  var storageKey = "quarto-auto-dark-theme";
  var root       = document.documentElement;
  var buttonId   = "auto-dark-switch";


  /* ── 1. Theme persistence helpers ───────────────────────────────────────── */

  function storedTheme() {
    try {
      var saved = window.localStorage.getItem(storageKey);
      if (saved === "dark" || saved === "light") {
        return saved;
      }
    } catch (error) {}

    // Fall back to the class already set by auto-dark-reveal-init.js.
    return root.getAttribute("data-auto-dark-theme") === "dark" ? "dark" : "light";
  }

  function persistTheme(theme) {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch (error) {}
  }


  /* ── 2. DOM class helpers ───────────────────────────────────────────────── */

  function setClass(element, theme) {
    if (!element) return;
    element.classList.toggle("auto-dark-theme-dark",  theme === "dark");
    element.classList.toggle("auto-dark-theme-light", theme === "light");
    element.classList.toggle("quarto-dark",           theme === "dark");
    element.classList.toggle("quarto-light",          theme === "light");
    element.setAttribute("data-auto-dark-theme", theme);
  }


  /* ── 3. Reveal.js layout trigger ───────────────────────────────────────── */

  // Call after theme changes that may shift slide dimensions.
  function revealLayout() {
    if (window.Reveal && typeof window.Reveal.layout === "function") {
      window.setTimeout(function () {
        window.Reveal.layout();
      }, 60);
    }
  }


  /* ── 4. Apply theme ─────────────────────────────────────────────────────── */

  function setTheme(theme, persist) {
    var safeTheme = theme === "dark" ? "dark" : "light";
    setClass(root, safeTheme);
    setClass(document.body, safeTheme);

    // Update button state.
    var button = document.getElementById(buttonId);
    if (button) {
      var isDark = safeTheme === "dark";
      button.dataset.autoDarkTarget = isDark ? "light" : "dark";
      button.title = isDark ? "Switch to light mode" : "Switch to dark mode";
      button.setAttribute("aria-label",   button.title);
      button.setAttribute("aria-pressed", String(isDark));
    }

    if (persist) {
      persistTheme(safeTheme);
    }

    revealLayout();

    // Notify auto-dark-renderings.js and any other listeners.
    window.dispatchEvent(
      new CustomEvent("auto-dark-change", { detail: { theme: safeTheme } })
    );
  }


  /* ── 5. Companion image helpers ─────────────────────────────────────────── */

  // Derive the dark-variant URL: replaces a trailing "-1.ext" with "-2.ext"
  // (Quarto multi-figure numbering convention used for rendered image pairs).
  function darkVariantUrl(url) {
    if (!url) return null;
    return url.replace(/-1(\.(png|jpe?g|svg|webp))(?:([?#].*)?)$/i, "-2$1$3");
  }

  function imageSourceAttribute(image) {
    return image.getAttribute("data-src") ? "data-src" : "src";
  }

  function imageSource(image) {
    return image.getAttribute("data-src") || image.getAttribute("src") || "";
  }

  function sourceMatches(image, source) {
    if (!image || !source) return false;
    return imageSource(image) === source || image.getAttribute("src") === source;
  }

  // Clone the image, mark it as the dark copy, and insert it after the original.
  function insertDarkImage(image, darkSource) {
    var sourceAttr = imageSourceAttribute(image);

    image.classList.add("auto-dark-render-light");

    var darkImage = image.cloneNode(true);
    darkImage.classList.remove("auto-dark-render-light");
    darkImage.classList.add("auto-dark-render-dark");
    darkImage.setAttribute(sourceAttr, darkSource);
    if (darkImage.hasAttribute("src"))      darkImage.setAttribute("src",      darkSource);
    if (darkImage.hasAttribute("data-src")) darkImage.setAttribute("data-src", darkSource);
    darkImage.setAttribute("aria-label", "Dark rendering");

    image.insertAdjacentElement("afterend", darkImage);
    revealLayout();
  }


  /* ── 6. Install rendering pairs (data-renderings attribute) ─────────────── */
  /*
   * Quarto can annotate cells with `data-renderings="light dark"` when two
   * sibling figures represent the same chart in light and dark flavours.
   * This block wires them up as a light/dark pair.
   */
  function installRenderingPairs() {
    document.querySelectorAll(".cell[data-renderings]").forEach(function (cell) {
      if (cell.dataset.autoDarkPairReady === "true") return;

      var renderings = cell.getAttribute("data-renderings") || "";
      if (!renderings.includes("light") || !renderings.includes("dark")) return;

      var candidate = cell.nextElementSibling;
      if (!candidate) return;

      var image = candidate.matches("img") ? candidate : candidate.querySelector("img");
      if (!image) return;

      var sourceAttr  = imageSourceAttribute(image);
      var lightSource = image.getAttribute(sourceAttr);
      var darkSource  = darkVariantUrl(lightSource);
      if (!darkSource || darkSource === lightSource) return;

      insertDarkImage(image, darkSource);
      cell.dataset.autoDarkPairReady = "true";
    });
  }


  /* ── 7. Install standalone rendering pairs (numbered siblings) ──────────── */
  /*
   * For slides that don't use the `data-renderings` attribute but do have
   * numbered figure variants (-1.png / -2.png), probe for the dark variant
   * and insert it if it loads.
   */
  function installStandaloneRenderingPairs() {
    document.querySelectorAll(".reveal img").forEach(function (image) {
      if (image.classList.contains("auto-dark-render-light") ||
          image.classList.contains("auto-dark-render-dark")) return;

      var lightSource = imageSource(image);
      var darkSource  = darkVariantUrl(lightSource);
      if (!darkSource || darkSource === lightSource) return;

      var next = image.nextElementSibling;
      if (sourceMatches(next, darkSource)) return;
      if (image.parentElement && Array.prototype.some.call(
        image.parentElement.querySelectorAll("img"),
        function (candidate) {
          return candidate !== image && sourceMatches(candidate, darkSource);
        }
      )) return;

      // Probe — only insert if the dark image actually exists.
      var probe = new Image();
      probe.onload = function () {
        if (!image.isConnected || image.classList.contains("auto-dark-render-light")) return;
        insertDarkImage(image, darkSource);
      };
      probe.src = new URL(darkSource, document.baseURI).href;
    });
  }


  /* ── 8. Install ☾/☀ toggle button ──────────────────────────────────────── */

  function installButton() {
    if (!document.querySelector(".reveal") || document.getElementById(buttonId)) {
      return;
    }

    var button = document.createElement("button");
    button.id        = buttonId;
    button.className = "auto-dark-switch";
    button.type      = "button";
    button.innerHTML = '<span class="auto-dark-switch-icon" aria-hidden="true"></span>';

    button.addEventListener("click", function () {
      var nextTheme = root.getAttribute("data-auto-dark-theme") === "dark" ? "light" : "dark";
      setTheme(nextTheme, true);
    });

    document.body.appendChild(button);
  }


  /* ── Boot ────────────────────────────────────────────────────────────────── */

  function boot() {
    installRenderingPairs();
    installStandaloneRenderingPairs();
    installButton();
    setTheme(storedTheme(), false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
