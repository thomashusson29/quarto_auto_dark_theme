#!/usr/bin/env bash
# tests/run-tests.sh
#
# Render all test documents for the auto-dark Quarto extension and report results.
#
# Usage:
#   cd /path/to/quarto_auto_dark_theme
#   bash tests/run-tests.sh
#
# Requirements:
#   - quarto (>= 1.7)
#   - R with: knitr, magick, ggplot2, gt
#   - Optional: gtsummary (Tests 5 will be skipped gracefully if absent)
#
# Output:
#   tests/test-html.html         — HTML test document
#   tests/test-revealjs.html     — RevealJS test presentation
#
# After rendering, open both files in a browser and follow the visual
# checklist in TESTING.md.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo ""
echo "════════════════════════════════════════════════════════"
echo " Auto Dark Extension — Local Test Suite"
echo "════════════════════════════════════════════════════════"
echo ""

# ── Render test-html.qmd ──────────────────────────────────────────────────
echo "▶ Rendering tests/test-html.qmd ..."
if quarto render tests/test-html.qmd --to auto-dark-html 2>&1; then
  echo "  ✓ tests/test-html.html rendered successfully"
else
  echo "  ✗ tests/test-html.qmd FAILED — check the output above"
  exit 1
fi

echo ""

# ── Render test-revealjs.qmd ──────────────────────────────────────────────
echo "▶ Rendering tests/test-revealjs.qmd ..."
if quarto render tests/test-revealjs.qmd --to auto-dark-clean-revealjs 2>&1; then
  echo "  ✓ tests/test-revealjs.html rendered successfully"
else
  echo "  ✗ tests/test-revealjs.qmd FAILED — check the output above"
  exit 1
fi

echo ""

# ── R syntax check ────────────────────────────────────────────────────────
echo "▶ R syntax check ..."
if Rscript --vanilla \
     -e "parse(file='_extensions/auto-dark/auto-dark-setup.R')" \
     -e "cat('  ✓ R syntax OK\n')" 2>&1; then
  :
else
  echo "  ✗ R syntax FAILED"
  exit 1
fi

echo ""

# ── Check for large one-line blocks ──────────────────────────────────────
echo "▶ Checking for large one-line blocks (>300 chars) ..."
BAD=$(grep -rn '.\{300,\}' \
  _extensions/auto-dark/auto-dark-setup.R \
  _extensions/auto-dark/auto-dark.css \
  _extensions/auto-dark/auto-dark-plot-filter.css \
  _extensions/auto-dark/auto-dark-reveal.css \
  _extensions/auto-dark/auto-dark-reveal.js \
  _extensions/auto-dark/auto-dark-system.js \
  _extensions/auto-dark/auto-dark-renderings.js \
  2>/dev/null || true)

if [ -n "$BAD" ]; then
  echo "  ✗ Large one-liners found:"
  echo "$BAD"
  exit 1
else
  echo "  ✓ No large one-line blocks found"
fi

echo ""

# ── Companion image check ─────────────────────────────────────────────────
echo "▶ Checking for *-auto-dark.* companion images ..."
COMPANIONS=$(find tests -name "*-auto-dark.*" 2>/dev/null | head -5)
if [ -n "$COMPANIONS" ]; then
  echo "  ✓ Companion images generated:"
  echo "$COMPANIONS" | sed 's/^/    /'
else
  echo "  ⚠ No companion images found in tests/ — verify magick is installed"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo " All automated checks passed."
echo ""
echo " Now open the following in your browser and follow TESTING.md:"
echo "   tests/test-html.html"
echo "   tests/test-revealjs.html"
echo "════════════════════════════════════════════════════════"
echo ""
