#!/bin/bash

{
  # @layer utilities section (lines 1778-1806)
  sed -n '1778,1806p' client/src/index.css
  
  echo ""
  echo "/* Theme and semantic styles */"
  # Theme colors and semantic headers (from line 3327 onwards)
  sed -n '3327,$p' client/src/index.css
  
} > client/src/styles/utilities.css
