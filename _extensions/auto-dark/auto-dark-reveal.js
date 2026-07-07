(function () {
  var storageKey = "quarto-auto-dark-theme";
  var root = document.documentElement;
  var buttonId = "auto-dark-switch";

  function storedTheme() {
    try {
      var saved = window.localStorage.getItem(storageKey);
      if (saved === "dark" || saved === "light") {
        return saved;
      }
    } catch (error) {}

    return root.getAttribute("data-auto-dark-theme") === "dark" ? "dark" : "light";
  }

  function setClass(element, theme) {
    if (!element) return;
    element.classList.toggle("auto-dark-theme-dark", theme === "dark");
    element.classList.toggle("auto-dark-theme-light", theme === "light");
    element.classList.toggle("quarto-dark", theme === "dark");
    element.classList.toggle("quarto-light", theme === "light");
    element.setAttribute("data-auto-dark-theme", theme);
  }

  function revealLayout() {
    if (window.Reveal && typeof window.Reveal.layout === "function") {
      window.setTimeout(function () {
        window.Reveal.layout();
      }, 60);
    }
  }

  function setTheme(theme, persist) {
    var safeTheme = theme === "dark" ? "dark" : "light";
    setClass(root, safeTheme);
    setClass(document.body, safeTheme);

    var button = document.getElementById(buttonId);
    if (button) {
      var isDark = safeTheme === "dark";
      button.dataset.autoDarkTarget = isDark ? "light" : "dark";
      button.title = isDark ? "Switch to light mode" : "Switch to dark mode";
      button.setAttribute("aria-label", button.title);
      button.setAttribute("aria-pressed", String(isDark));
    }

    if (persist) {
      try {
        window.localStorage.setItem(storageKey, safeTheme);
      } catch (error) {}
    }

    revealLayout();

    window.dispatchEvent(new CustomEvent("auto-dark-change", { detail: { theme: safeTheme } }));
  }

  function darkVariantUrl(url) {
    if (!url) return null;
    return url.replace(/-1(\.(?:png|jpe?g|svg|webp))(?:([?#].*)?)$/i, "-2$1$2");
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

  function insertDarkImage(image, darkSource) {
    var sourceAttr = imageSourceAttribute(image);

    image.classList.add("auto-dark-render-light");

    var darkImage = image.cloneNode(true);
    darkImage.classList.remove("auto-dark-render-light");
    darkImage.classList.add("auto-dark-render-dark");
    darkImage.setAttribute(sourceAttr, darkSource);
    if (darkImage.hasAttribute("src")) {
      darkImage.setAttribute("src", darkSource);
    }
    if (darkImage.hasAttribute("data-src")) {
      darkImage.setAttribute("data-src", darkSource);
    }
    darkImage.setAttribute("aria-label", "Dark rendering");

    image.insertAdjacentElement("afterend", darkImage);
    revealLayout();
  }

  function installRenderingPairs() {
    document.querySelectorAll(".cell[data-renderings]").forEach(function (cell) {
      if (cell.dataset.autoDarkPairReady === "true") return;

      var renderings = cell.getAttribute("data-renderings") || "";
      if (!renderings.includes("light") || !renderings.includes("dark")) return;

      var candidate = cell.nextElementSibling;
      if (!candidate) return;

      var image = candidate.matches("img") ? candidate : candidate.querySelector("img");
      if (!image) return;

      var sourceAttr = imageSourceAttribute(image);
      var lightSource = image.getAttribute(sourceAttr);
      var darkSource = darkVariantUrl(lightSource);
      if (!darkSource || darkSource === lightSource) return;

      insertDarkImage(image, darkSource);
      cell.dataset.autoDarkPairReady = "true";
    });
  }

  function installStandaloneRenderingPairs() {
    document.querySelectorAll(".reveal img").forEach(function (image) {
      if (image.classList.contains("auto-dark-render-light") || image.classList.contains("auto-dark-render-dark")) return;

      var lightSource = imageSource(image);
      var darkSource = darkVariantUrl(lightSource);
      if (!darkSource || darkSource === lightSource) return;

      var next = image.nextElementSibling;
      if (sourceMatches(next, darkSource)) return;
      if (image.parentElement && Array.prototype.some.call(image.parentElement.querySelectorAll("img"), function (candidate) {
        return candidate !== image && sourceMatches(candidate, darkSource);
      })) return;

      var probe = new Image();
      probe.onload = function () {
        if (!image.isConnected || image.classList.contains("auto-dark-render-light")) return;
        insertDarkImage(image, darkSource);
      };
      probe.src = new URL(darkSource, document.baseURI).href;
    });
  }

  function installButton() {
    if (!document.querySelector(".reveal") || document.getElementById(buttonId)) {
      return;
    }

    var button = document.createElement("button");
    button.id = buttonId;
    button.className = "auto-dark-switch";
    button.type = "button";
    button.innerHTML = '<span class="auto-dark-switch-icon" aria-hidden="true"></span>';
    button.addEventListener("click", function () {
      var nextTheme = root.getAttribute("data-auto-dark-theme") === "dark" ? "light" : "dark";
      setTheme(nextTheme, true);
    });
    document.body.appendChild(button);
  }

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
