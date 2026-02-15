#!/bin/bash
# =============================================================================
# Social Content Generator - Feedback Analysis Script
# =============================================================================
#
# USAGE:
#   ./scripts/social-content-feedback-analysis.sh [command]
#
# COMMANDS:
#   summary    - Quick summary stats (default)
#   issues     - Breakdown of reported issues
#   platforms  - Performance by platform
#   tones      - Performance by tone
#   low        - Show low-rated content (score <= 3)
#   high       - Show high-rated content (score >= 7)
#   raw        - Dump raw JSON for manual analysis
#   all        - Run all analyses
#
# REQUIREMENTS:
#   - Dev server running on localhost:3000
#   - jq installed (brew install jq)
#
# =============================================================================

set -e

API_URL="http://localhost:3000/api/social-content/history?onlyRated=true&limit=200"
CACHE_FILE="/tmp/social-feedback-cache.json"

# Colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

# Check dependencies
check_deps() {
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required. Install with: brew install jq${NC}"
    exit 1
  fi

  if ! curl -s --connect-timeout 2 "http://localhost:3000" > /dev/null 2>&1; then
    echo -e "${RED}Error: Dev server not running on localhost:3000${NC}"
    echo "Start with: npm run docker:dev"
    exit 1
  fi
}

# Fetch fresh data
fetch_data() {
  echo -e "${CYAN}Fetching feedback data...${NC}" >&2
  curl -s "$API_URL" > "$CACHE_FILE"

  local count=$(cat "$CACHE_FILE" | jq '.history | length')
  echo -e "${GREEN}Loaded $count rated entries${NC}" >&2
}

# Summary stats
cmd_summary() {
  echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}                    FEEDBACK SUMMARY                             ${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}\n"

  local total=$(cat "$CACHE_FILE" | jq '.history | length')
  local avg=$(cat "$CACHE_FILE" | jq '[.history[].quick_rating_score] | add / length | . * 100 | round / 100')

  echo -e "Total Rated:     ${CYAN}$total${NC}"
  echo -e "Average Score:   ${CYAN}$avg${NC} / 9"

  echo -e "\n${BLUE}Score Distribution:${NC}"
  cat "$CACHE_FILE" | jq -r '
    [.history[].quick_rating_score] | group_by(.) |
    map({score: .[0], count: length}) | sort_by(.score) |
    .[] | "  Score \(.score): \(.count) entries"
  '

  # Quality tiers
  local poor=$(cat "$CACHE_FILE" | jq '[.history[] | select(.quick_rating_score <= 3)] | length')
  local neutral=$(cat "$CACHE_FILE" | jq '[.history[] | select(.quick_rating_score >= 4 and .quick_rating_score <= 6)] | length')
  local good=$(cat "$CACHE_FILE" | jq '[.history[] | select(.quick_rating_score >= 7)] | length')

  echo -e "\n${BLUE}Quality Tiers:${NC}"
  echo -e "  ${RED}Poor (1-3):${NC}    $poor"
  echo -e "  ${YELLOW}Neutral (4-6):${NC} $neutral"
  echo -e "  ${GREEN}Good (7-9):${NC}    $good"
}

# Issues breakdown
cmd_issues() {
  echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}                    ISSUES BREAKDOWN                             ${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}\n"

  echo -e "${BLUE}Quick Issues (summary level):${NC}"
  cat "$CACHE_FILE" | jq -r '
    [.history[] | .quick_issue | select(type == "string")] |
    group_by(.) | map({issue: .[0], count: length}) | sort_by(-.count) |
    .[] | "  \(.count)x \(.issue)"
  '

  echo -e "\n${BLUE}Section-Level Issues:${NC}"
  cat "$CACHE_FILE" | jq -r '
    [.history[] | .section_issues | select(type == "object") | to_entries[] |
     select(.value | length > 0) | {section: .key, issues: .value[]}] |
    group_by(.section) |
    map({section: .[0].section, issues: [.[].issues] | group_by(.) | map({issue: .[0], count: length}) | sort_by(-.count)}) |
    .[] | "\n  \(.section | ascii_upcase):", (.issues[] | "    \(.count)x \(.issue)")
  '
}

# Platform breakdown
cmd_platforms() {
  echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}                  PLATFORM PERFORMANCE                           ${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}\n"

  cat "$CACHE_FILE" | jq -r '
    .history | group_by(.platform) |
    map({
      platform: .[0].platform,
      count: length,
      avg: (([.[].quick_rating_score] | add / length) * 100 | round / 100)
    }) | sort_by(-.count) |
    .[] | "  \(.platform): \(.count) entries, avg \(.avg)/9"
  '
}

# Tone breakdown
cmd_tones() {
  echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}                    TONE PERFORMANCE                             ${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}\n"

  cat "$CACHE_FILE" | jq -r '
    .history | group_by(.tone) |
    map({
      tone: .[0].tone,
      count: length,
      avg: (([.[].quick_rating_score] | add / length) * 100 | round / 100)
    }) | sort_by(-.count) |
    .[] | "  \(.tone): \(.count) entries, avg \(.avg)/9"
  '
}

# Low-rated content
cmd_low() {
  echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}                 LOW-RATED CONTENT (≤3)                          ${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}\n"

  cat "$CACHE_FILE" | jq -r '
    .history | map(select(.quick_rating_score <= 3)) |
    .[] |
    "─────────────────────────────────────────────────────────────────",
    "Score: \(.quick_rating_score) | Platform: \(.platform) | Tone: \(.tone)",
    "Issue: \(.quick_issue // "none")",
    "",
    "HOOK: \(.hook)",
    "",
    "BODY: \(.body[0:200])...",
    ""
  '
}

# High-rated content
cmd_high() {
  echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}                 HIGH-RATED CONTENT (≥7)                         ${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}\n"

  local count=$(cat "$CACHE_FILE" | jq '[.history[] | select(.quick_rating_score >= 7)] | length')

  if [ "$count" -eq 0 ]; then
    echo -e "${YELLOW}No high-rated content yet (score >= 7)${NC}"
    echo "Best content so far:"
    cat "$CACHE_FILE" | jq -r '
      .history | sort_by(-.quick_rating_score) | .[0:3] |
      .[] |
      "─────────────────────────────────────────────────────────────────",
      "Score: \(.quick_rating_score) | Platform: \(.platform) | Tone: \(.tone)",
      "",
      "HOOK: \(.hook)",
      ""
    '
  else
    cat "$CACHE_FILE" | jq -r '
      .history | map(select(.quick_rating_score >= 7)) |
      .[] |
      "─────────────────────────────────────────────────────────────────",
      "Score: \(.quick_rating_score) | Platform: \(.platform) | Tone: \(.tone)",
      "",
      "HOOK: \(.hook)",
      "",
      "BODY: \(.body[0:200])...",
      ""
    '
  fi
}

# Raw JSON dump
cmd_raw() {
  cat "$CACHE_FILE" | jq '.history'
}

# Run all
cmd_all() {
  cmd_summary
  cmd_issues
  cmd_platforms
  cmd_tones
  cmd_low
  cmd_high
}

# Main
main() {
  check_deps
  fetch_data

  local command="${1:-summary}"

  case "$command" in
    summary)   cmd_summary ;;
    issues)    cmd_issues ;;
    platforms) cmd_platforms ;;
    tones)     cmd_tones ;;
    low)       cmd_low ;;
    high)      cmd_high ;;
    raw)       cmd_raw ;;
    all)       cmd_all ;;
    *)
      echo "Unknown command: $command"
      echo "Available: summary, issues, platforms, tones, low, high, raw, all"
      exit 1
      ;;
  esac
}

main "$@"
