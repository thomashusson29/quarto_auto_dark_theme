(function () {
  function source(image) {
    return image.getAttribute("data-src") || image.getAttribute("src") || "";
  }

  function sourceAttribute(image) {
    return image.getAttribute("data-src") ? "data-src" : "src";
  }

  function companionUrls(url) {
    if (!url || /^data:/i.test(url)) return [];
    var autoDark = url.replace(/(\.(?:png|jpe?g|webp|svg))(?:([?#].*)?)$/i, "-auto-dark$1$2");
    var numbered = url.replace(/-1(\.(?:png|jpe?g|webp|svg))(?:([?#].*)?)$/i, "-2$1$2");
    var urls = [];
    if (autoDark && autoDark !== url) urls.push(autoDark);
    if (numbered && numbered !== url && !urls.includes(numbered)) urls.push(numbered);
    return urls;
  }

  function matchesSource(image, url) {
    if (!image || !url) return false;
    return source(image) === url || image.getAttribute("src") === url;
  }

  function layoutReveal() {
    if (window.Reveal && typeof window.Reveal.layout === "function") {
      window.setTimeout(function () {
        window.Reveal.layout();
      }, 60);
    }
  }

  function insertPair(image, darkSource) {
    if (!image.isConnected || image.classList.contains("auto-dark-render-light")) return;
    if (image.classList.contains("auto-dark-render-dark")) return;
    if (image.classList.contains("auto-dark-no-filter")) return;

    var attr = sourceAttribute(image);
    var darkImage = image.cloneNode(true);

    image.classList.add("auto-dark-render-light");
    darkImage.classList.remove("auto-dark-render-light");
    darkImage.classList.add("auto-dark-render-dark");
    darkImage.setAttribute(attr, darkSource);
    if (darkImage.hasAttribute("src")) darkImage.setAttribute("src", darkSource);
    if (darkImage.hasAttribute("data-src")) darkImage.setAttribute("data-src", darkSource);
    darkImage.setAttribute("aria-label", "Dark rendering");

    image.insertAdjacentElement("afterend", darkImage);
    layoutReveal();
  }

  function probeCompanions(image, urls, index) {
    if (index >= urls.length) return;

    var darkSource = urls[index];
    var probe = new Image();
    probe.onload = function () {
      insertPair(image, darkSource);
    };
    probe.onerror = function () {
      probeCompanions(image, urls, index + 1);
    };
    probe.src = new URL(darkSource, document.baseURI).href;
  }

  function installPairForImage(image) {
    if (image.dataset.autoDarkRenderingChecked === "true") return;
    if (image.classList.contains("auto-dark-render-light") || image.classList.contains("auto-dark-render-dark")) return;
    if (image.classList.contains("auto-dark-no-filter")) return;

    var lightSource = source(image);
    var candidates = companionUrls(lightSource);
    if (!candidates.length) return;

    image.dataset.autoDarkRenderingChecked = "true";

    var next = image.nextElementSibling;
    if (candidates.some(function (candidate) { return matchesSource(next, candidate); })) return;
    if (image.parentElement && Array.prototype.some.call(image.parentElement.querySelectorAll("img"), function (candidate) {
      return candidate !== image && candidates.some(function (url) { return matchesSource(candidate, url); });
    })) return;

    probeCompanions(image, candidates, 0);
  }

  function boot() {
    document.querySelectorAll("img[src], img[data-src]").forEach(installPairForImage);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  window.addEventListener("load", boot);
  window.addEventListener("auto-dark-change", boot);
})();
