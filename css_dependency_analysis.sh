#!/bin/bash

echo "=== CSS DEPENDENCY ANALYSIS ==="
echo ""

echo "1. ANALYZING COMPONENT IMPORTS:"
find client/src/components -name "*.tsx" -o -name "*.jsx" | while read file; do
  classes=$(grep -o 'className="[^"]*"' "$file" 2>/dev/null | sed 's/className="//g' | sed 's/"//g' | tr ' ' '\n' | sort -u | grep -v "^$")
  if [ ! -z "$classes" ]; then
    echo "$(basename $file):" 
    echo "$classes" | head -5 | sed 's/^/  /'
    class_count=$(echo "$classes" | wc -l)
    [ $class_count -gt 5 ] && echo "  ... and $((class_count - 5)) more classes"
    echo ""
  fi
done | head -50

echo ""
echo "2. ANALYZING PAGE IMPORTS:"
find client/src/pages -name "*.tsx" | while read file; do
  page_name=$(basename "$file")
  classes=$(grep -o 'className="[^"]*"' "$file" 2>/dev/null | sed 's/className="//g' | sed 's/"//g' | tr ' ' '\n' | sort -u | grep "^[a-z-]" | head -10)
  if [ ! -z "$classes" ]; then
    echo "$page_name uses:"
    echo "$classes" | sed 's/^/  /'
    echo ""
  fi
done | head -30

echo ""
echo "3. IDENTIFYING SHARED VS SPECIFIC STYLES:"
echo "Searching for most commonly used CSS classes..."
find client/src -name "*.tsx" -o -name "*.jsx" | xargs grep -h 'className=' 2>/dev/null | \
  sed 's/.*className="\([^"]*\)".*/\1/' | \
  tr ' ' '\n' | \
  grep -v "^$" | \
  sort | uniq -c | sort -rn | head -20
