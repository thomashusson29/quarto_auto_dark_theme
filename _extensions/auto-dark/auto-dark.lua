-- auto-dark.lua
--
-- Adds OS-level prefers-color-scheme dark mode support for HTML output.
-- When a user's operating system is set to dark mode, the One Dark palette
-- is applied automatically on first page load — no manual switch needed.
--
-- Adapted from gadenbuie/quarto-auto-dark (MIT License).
-- Source: https://github.com/gadenbuie/quarto-auto-dark
-- Credit: Garrick Aden-Buie
--
-- Note: only the Lua filter mechanism is borrowed. The CSS inversion approach
-- from the original extension is NOT used here — we apply the full One Dark
-- palette instead.

function Pandoc()
  if quarto.doc.is_format("html:js") then
    quarto.doc.add_html_dependency({
      name        = "auto-dark-os-detect",
      version     = "1.0.0",
      stylesheets = { "auto-dark-os-detect.css" },
    })
  end
end
