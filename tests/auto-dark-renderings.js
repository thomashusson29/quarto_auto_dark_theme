/*
 * auto-dark-renderings.js
 *
 * Runs at end of <body> for both HTML documents and RevealJS presentations.
 *
 * Purpose:
 *   For each <img> on the page, probe for a *-auto-dark.* companion image
 *   (generated at render time by auto-dark-setup.R via the magick package).
 *   If a companion is found, clone the original image, mark it as the dark
 *   copy, and insert it immediately after the original.
 *
 *   CSS then shows the correct copy based on the active theme class:
 *     .auto-dark-render-light  — shown in light mode, hidden in dark mode
 *     .auto-dark-render-dark   — shown in dark mode, hidden in light mode
 *
 * Companion URL convention:
 *   "fig-1.png"  → "fig-1-auto-dark.png"  (primary companion path)
 *   "fig-1.png"  → "fig-2.png"             (secondary: numbered sibling)
 *
 * Opt-out:
 *   Add .auto-dark-no-filter to an image or set chunk option
 *   `class.output = "auto-dark-no-filter"` to skip companion injection.
 *
 * Re-runs on:
 *   DOMContentLoaded, window load, and the "auto-dark-change" custom event
 *   (fired by auto-dark-reveal.js when the user toggles the theme).
 */
(function () {

  /* ── 1. URL helpers ─────────────────────────────────────────────────────── */

  function source(image) {
    return image.getAttribute("data-src") || image.getAttribute("src") || "";
  }

  function sourceAttribute(image) {
    return image.getAttribute("data-src") ? "data-src" : "src";
  }

  // Build the list of candidate dark URLs for a given light image URL.
  // Returns [] for data: URLs (inline images) which cannot have companions.
  function companionUrls(url) {
    if (!url || /^data:/i.test(url)) return [];

    var autoDark = url.replace(
      /(\.(png|jpe?g|webp|svg))(?:([?#].*)?)$/i,
      "-auto-dark$1$3"
    );
    var numbered = url.replace(
      /-1(\.(png|jpe?g|webp|svg))(?:([?#].*)?)$/i,
      "-2$1$3"
    );

    var urls = [];
    if (autoDark && autoDark !== url) urls.push(autoDark);
    if (numbered && numbered !== url && !urls.includes(numbered)) urls.push(numbered);
    return urls;
  }

  function matchesSource(image, url) {
    if (!image || !url) return false;
    return source(image) === url || image.getAttribute("src") === url;
  }


  /* ── 2. Reveal.js layout trigger ───────────────────────────────────────── */

  function layoutReveal() {
    if (window.Reveal && typeof window.Reveal.layout === "function") {
      window.setTimeout(function () { window.Reveal.layout(); }, 60);
    }
  }


  /* ── 3. Companion image insertion ──────────────────────────────────────── */

  function insertPair(image, darkSource) {
    // Guard: skip images that are already part of a light/dark pair.
    if (!image.isConnected) return;
    if (image.classList.contains("auto-dark-render-light")) return;
    if (image.classList.contains("auto-dark-render-dark"))  return;
    if (image.classList.contains("auto-dark-no-filter"))    return;

    var attr      = sourceAttribute(image);
    var darkImage = image.cloneNode(true);

    image.classList.add("auto-dark-render-light");
    darkImage.classList.remove("auto-dark-render-light");
    darkImage.classList.add("auto-dark-render-dark");
    darkImage.setAttribute(attr, darkSource);
    if (darkImage.hasAttribute("src"))      darkImage.setAttribute("src",      darkSource);
    if (darkImage.hasAttribute("data-src")) darkImage.setAttribute("data-src", darkSource);
    darkImage.setAttribute("aria-label", "Dark rendering");

    image.insertAdjacentElement("afterend", darkImage);
    layoutReveal();
  }


  /* ── 4. Companion probing (waterfall) ───────────────────────────────────── */

  // Try each candidate URL in order; insert on the first successful load.
  function probeCompanions(image, urls, index) {
    if (index >= urls.length) return;

    var darkSource = urls[index];
    var probe      = new Image();

    probe.onload = function () {
      insertPair(image, darkSource);
    };
    probe.onerror = function () {
      probeCompanions(image, urls, index + 1);
    };
    probe.src = new URL(darkSource, document.baseURI).href;
  }


  /* ── 5. Per-image setup ─────────────────────────────────────────────────── */

  function installPairForImage(image) {
    // Skip images we've already checked or that are already in a pair.
    if (image.dataset.autoDarkRenderingChecked === "true") return;
    if (image.classList.contains("auto-dark-render-light") ||
        image.classList.contains("auto-dark-render-dark"))  return;
    if (image.classList.contains("auto-dark-no-filter"))    return;

    var lightSource = source(image);
    var candidates  = companionUrls(lightSource);
    if (!candidates.length) return;

    image.dataset.autoDarkRenderingChecked = "true";

    // Skip if a companion is already present as the next sibling or anywhere
    // in the parent container.
    var next = image.nextElementSibling;
    if (candidates.some(function (c) { return matchesSource(next, c); })) return;
    if (image.parentElement && Array.prototype.some.call(
      image.parentElement.querySelectorAll("img"),
      function (candidate) {
        return candidate !== image &&
               candidates.some(function (c) { return matchesSource(candidate, c); });
      }
    )) return;

    probeCompanions(image, candidates, 0);
  }


  /* ── 6. Boot ────────────────────────────────────────────────────────────── */

  function boot() {
    document.querySelectorAll("img[src], img[data-src]").forEach(installPairForImage);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  window.addEventListener("load", boot);
  // Re-run when the theme switches, in case lazy-loaded images were added.
  window.addEventListener("auto-dark-change", boot);
})();
