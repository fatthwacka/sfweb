#!/bin/bash

echo "=== CSS FILE STRUCTURE ANALYSIS ==="
echo ""
echo "Total Lines: $(wc -l < client/src/index.css)"
echo ""

echo "=== MAJOR SECTIONS ==="
echo "Lines 1-186: Global styles, animations, admin styles"
echo "Lines 187-439: @layer base (Typography, form elements)"
echo "Lines 440-1777: @layer components (Component-specific styles)"
echo "Lines 1778-1806: @layer utilities (Utility classes)"
echo "Lines 1807-4323: Feature-specific styles (galleries, sections, pages)"
echo ""

echo "=== DETAILED BREAKDOWN ==="
echo ""

echo "1. PRE-LAYER SECTION (1-186):"
grep -n "^/\*" client/src/index.css | head -20 | awk -F: '{print "  Line " $1 ": " substr($0, index($0,$2))}'
echo ""

echo "2. COMPONENT LAYER (440-1777) - Major components:"
sed -n '440,1777p' client/src/index.css | grep "^\." | grep -v ":" | head -20
echo ""

echo "3. POST-LAYERS (1807+) - Major sections:"
sed -n '1807,$p' client/src/index.css | grep "^/\*.*===" | head -20
echo ""

echo "4. PAGE-SPECIFIC STYLES:"
grep -n "Page.*Text Colors\|Page.*Sections" client/src/index.css | head -20
echo ""

echo "5. GALLERY & SLIDER COMPONENTS:"
grep -n "gallery\|Gallery\|slider\|Slider" client/src/index.css | grep "^[0-9]*:/\*" | head -10
