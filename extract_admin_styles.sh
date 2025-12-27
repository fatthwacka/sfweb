#!/bin/bash

# Extract admin styles from different sections
{
  # Admin gradient card and related styles (lines around 141-186)
  sed -n '141,186p' client/src/index.css
  
  echo ""
  echo "/* Admin gallery styles */"
  # Admin gallery styles (search for admin-specific classes)
  sed -n '471,600p' client/src/index.css | grep -A5 -B2 "admin"
  
  echo ""
  echo "/* Admin gallery container */"
  sed -n '870,900p' client/src/index.css
  
} > client/src/styles/admin.css
