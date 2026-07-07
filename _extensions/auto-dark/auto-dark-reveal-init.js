(function () {
  var storageKey = "quarto-auto-dark-theme";
  var root = document.documentElement;

  function preferredTheme() {
    try {
      var params = new URLSearchParams(window.location.search);
      var queryTheme = params.get("theme");
      if (queryTheme === "dark" || queryTheme === "light") {
        return queryTheme;
      }

      var saved = window.localStorage.getItem(storageKey);
      if (saved === "dark" || saved === "light") {
        return saved;
      }

      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch (error) {}

    return "light";
  }

  var theme = preferredTheme();
  root.classList.add(theme === "dark" ? "auto-dark-theme-dark" : "auto-dark-theme-light");
  root.setAttribute("data-auto-dark-theme", theme);
})();
