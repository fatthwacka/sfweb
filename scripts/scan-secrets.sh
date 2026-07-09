#!/usr/bin/env bash
#
# Secret scanner. No external tooling required, so it cannot silently skip.
#
#   scripts/scan-secrets.sh --staged      scan the staged diff   (pre-commit)
#   scripts/scan-secrets.sh --range A..B  scan a commit range    (CI)
#   scripts/scan-secrets.sh --tree        scan all tracked files (audit)
#   scripts/scan-secrets.sh --self-test   prove the patterns fire, then exit
#
# Design rules, each learned from a bug this script actually had:
#
#   1. FAIL CLOSED, FOR REAL. sfweb's hook wrapped its scanner in
#      `if git secrets --version &>/dev/null`, so when the binary went missing
#      the scan was skipped and the commit sailed through. A guard that no-ops
#      is worse than no guard: it still reads as "protected" on the checklist.
#
#   2. NEVER DO ERROR-CRITICAL WORK IN A SUBSHELL. An earlier version called
#      `die` from inside `hits=$(grep_pattern ...)`. The `exit 1` killed only
#      the subshell; the parent printed "no secrets detected" immediately after
#      printing "aborted". Every grep below runs in the main shell, against a
#      temp file, with its exit status inspected directly.
#
#   3. DISTINGUISH "no match" FROM "grep broke". grep exits 1 for no-match and
#      >1 for error. Conflating them is how the `private-key-pem` pattern died
#      silently: its regex starts with `-----`, which grep parsed as a flag,
#      and the scan still reported clean. Patterns are passed with `-e`.
#
#   4. SELF-TEST EVERY PATTERN AGAINST ITS OWN CANARY. A shared canary lets a
#      dead pattern hide behind a live one. A scanner nobody has proven can
#      detect anything will happily report clean over zero bytes of input.
#
#   5. MATCH THE SECRETS WE ACTUALLY HOLD. The AWS-only patterns inherited from
#      git-secrets caught none of our Supabase, Cloudflare, Hostinger or
#      Postgres credentials.

set -uo pipefail

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; DIM=$'\033[2m'; NC=$'\033[0m'

TMPDIR_SCAN=$(mktemp -d)
cleanup() { rm -rf "$TMPDIR_SCAN"; }
trap cleanup EXIT

die() { printf '%s\n' "${RED}✖ $*${NC}" >&2; exit 1; }

# ─── Patterns ────────────────────────────────────────────────────────────────
# name|extended-regex.  The name is printed on a hit.
PATTERNS=(
  'supabase-secret-key|sb_secret_[A-Za-z0-9_-]{8,}'
  'supabase-publishable-key|sb_publishable_[A-Za-z0-9_-]{8,}'
  'supabase-legacy-jwt|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}'
  'cloudflare-api-token|cfat_[A-Za-z0-9_-]{20,}'
  # Cloudflare's LEGACY token format has no prefix, just 40 opaque characters.
  # A bare 40-char string is too generic to match on its own, so this is keyed
  # on the variable name. Found because sfweb's live CLOUDFLARE_API_TOKEN is
  # still legacy format and sailed straight past the `cfat_` pattern.
  'cloudflare-legacy-token|CLOUDFLARE_[A-Z_]*(TOKEN|KEY)[[:space:]]*=[[:space:]]*.?[A-Za-z0-9_-]{30,}'
  'postgres-url-with-password|postgres(ql)?://[^:[:space:]]+:[^@[:space:]]+@'
  'anthropic-key|sk-ant-[A-Za-z0-9_-]{20,}'
  'openai-key|sk-(proj|svcacct)-[A-Za-z0-9_-]{20,}'
  'google-api-key|AIza[A-Za-z0-9_-]{35}'
  'aws-access-key-id|(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}'
  'private-key-pem|BEGIN [A-Z ]*PRIVATE KEY'
  'generic-bearer-literal|Bearer [A-Za-z0-9_.=-]{30,}'
  'hostinger-token|HOSTINGER_API_(TOKEN|KEY)[[:space:]]*=[[:space:]]*[A-Za-z0-9]{30,}'
)

# ─── Path exclusions ─────────────────────────────────────────────────────────
# This repository tracks no vendored tree, so nothing is excluded. Keep it that
# way: an excluded path is a place a real key can hide. If a cache is ever
# tracked, untrack it rather than adding it here.
# sfweb tracks a 342MB `.npm-cache/` (1,602 files). npm registry metadata embeds
# credential-shaped strings in package descriptions, which drown a --tree scan.
# The real fix is to untrack it; until then it is excluded and the scan says so.
EXCLUDE_PATHS='^(\.npm-cache/|node_modules/|dist/)'

# ─── Allowlist ───────────────────────────────────────────────────────────────
# Owned by THIS repository. There is no shared allowlist and no `.secretsallow`
# escape hatch: a legitimate exception in another project is not one here.
# See CLAUDE_TEMPLATE.md section 8a.
# Lines matching these are legitimate: placeholders, format assertions, docs.
# Deliberately narrow. A broad allowlist is how a real key gets waved through.
ALLOW=(
  # .env.example placeholders
  'sb_secret_\.\.\.'
  'sb_publishable_\.\.\.'
  'cfat_\.\.\.'
  'postgres(ql)?://<'
  'postgres(ql)?://[^:[:space:]]*:<'
  'postgres(ql)?://[^[:space:]]*<password>'

  # Documentation placeholders for Postgres passwords, spelled out one by one.
  # No wildcard: a real password of any other value must still block.
  'postgres(ql)?://username:password@'
  'postgres(ql)?://[^@[:space:]]*:(postgres_password|your_postgres_password|your-password)@'

  # Documentation ellipsis for a PEM body. The ellipsis is MANDATORY: without it
  # the rule spares a real key, because a genuine PEM opens identically and then
  # continues with base64. The `[N]` stops this file tripping its own
  # private-key pattern; as an ERE, `BEGI[N]` matches `BEGIN`.
  'PRIVATE KEY-----\\n\.\.\.'
  "includes\\('BEGI[N] PRIVATE KEY'\\)"
  'Expected format: -----BEGI[N] PRIVATE KEY'

  # Zod / runtime format assertions: they assert a key's SHAPE, contain no key.
  'startsWith\(.sb_(secret|publishable)_'

  # Environment-variable references and shell interpolation, not literals
  '\$\{[A-Z_]+\}'
  'process\.env\.'
)

# ─── Canaries: one per pattern, tested in isolation ──────────────────────────
#
# Base64-encoded, not written as literals. Otherwise this file trips its own
# scanner: a canary is by construction a string that the patterns must match.
# String-splitting ("sb_" "secret_...") defeats some patterns but not others,
# such as the Postgres URL and the PEM header, whose regexes span the join.
#
# Encoding them means the repository contains no matchable secret-shaped literal
# anywhere, and the allowlist stays narrow. Widening the allowlist to excuse
# this file would have been the wrong fix: it is the one file where a real key
# could hide behind an "it's only a canary" exemption.
#
# Decode any of these to inspect:  printf %s '<b64>' | base64 -d
canary_for() {
  local b64
  case "$1" in
    supabase-secret-key)        b64='c2Jfc2VjcmV0X0FiQ2RFZkdoSWpLbE1uT3BRclN0VXZXeA==' ;;
    supabase-publishable-key)   b64='c2JfcHVibGlzaGFibGVfQWJDZEVmR2hJaktsTW5PcFFyU3Q=' ;;
    supabase-legacy-jwt)        b64='ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LkFiQ2RFZkdoSWpLbE1uT3BRclN0VXZXeFl6MDE=' ;;
    cloudflare-api-token)       b64='Y2ZhdF9BYkNkRWZHaElqS2xNbk9wUXJTdFV2V3hZejAxMjM0NTY3ODk=' ;;
    cloudflare-legacy-token)    b64='Q0xPVURGTEFSRV9BUElfVE9LRU49UGhWbGFqU0dUSFgyY1NZM2ZQOXgyeTRoSllrcllNMWdYMDVqdA==' ;;
    postgres-url-with-password) b64='cG9zdGdyZXNxbDovL3VzZXI6aHVudGVyMkBkYi5leGFtcGxlLmNvbTo1NDMyL3Bvc3RncmVz' ;;
    anthropic-key)              b64='c2stYW50LUFiQ2RFZkdoSWpLbE1uT3BRclN0VXZXeFl6MDE=' ;;
    openai-key)                 b64='c2stcHJvai1BYkNkRWZHaElqS2xNbk9wUXJTdFV2V3hZejAxMjM0NTY3ODk=' ;;
    google-api-key)             b64='QUl6YVN5QWJDZEVmR2hJaktsTW5PcFFyU3RVdld4WXowMTIzNDU2' ;;
    aws-access-key-id)          b64='QUtJQUlPU0ZPRE5ON1NBTVBMRVhY' ;;
    private-key-pem)            b64='LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQ==' ;;
    generic-bearer-literal)     b64='QmVhcmVyIEFiQ2RFZkdoSWpLbE1uT3BRclN0VXZXeFl6MDEyMzQ1Njc4OWFiY2Q=' ;;
    hostinger-token)            b64='SE9TVElOR0VSX0FQSV9UT0tFTj1BYkNkRWZHaElqS2xNbk9wUXJTdFV2V3hZejAxMjM0NTY3ODk=' ;;
    *) return 1 ;;
  esac
  printf '%s' "$b64" | base64 -d 2>/dev/null || die "canary for '$1' failed to decode"
}

# ─── Core grep, main shell only ──────────────────────────────────────────────
# Writes matches to $TMPDIR_SCAN/hits. Exits the whole script if grep errors.
HITS_FILE="$TMPDIR_SCAN/hits"

grep_into_hits() {
  local regex="$1" file="$2" rc
  # Flags matter, and `-a -I` together are a trap.
  #
  #   -a  (--binary-files=text)         treat binary input as text
  #   -I  (--binary-files=without-match) skip binary input entirely
  #
  # They contradict, and GNU grep lets the LAST one win. The original `-aInE`
  # therefore resolved to `-I` on Ubuntu, while BSD grep on macOS resolved to
  # `-a`. In --tree mode the blob concatenates every tracked file, including
  # app/favicon.ico, whose NUL bytes made GNU grep classify the whole blob as
  # binary and skip it. CI reported "no secrets detected" over a tracked,
  # planted key while the same scan failed correctly on a developer's Mac.
  #
  # Keep `-a` only. Binary files are excluded when the blob is built instead.
  grep -anE -e "$regex" "$file" > "$HITS_FILE" 2>"$TMPDIR_SCAN/err"
  rc=$?
  if [ "$rc" -gt 1 ]; then
    printf '%s\n' "${RED}✖ grep failed (exit $rc) on pattern: ${regex:0:60}${NC}" >&2
    sed 's/^/    /' "$TMPDIR_SCAN/err" >&2
    die "the scanner is broken; refusing to report a clean result"
  fi
  return 0
}

is_allowed() {
  local line="$1" a
  for a in "${ALLOW[@]}"; do
    if printf '%s' "$line" | grep -qE -e "$a" 2>/dev/null; then return 0; fi
  done
  return 1
}

# Scans $1 (a file). Returns 0 clean, 1 if any non-allowlisted hit.
scan_file() {
  local file="$1" label="$2" found=0 entry name regex hit
  for entry in "${PATTERNS[@]}"; do
    name="${entry%%|*}"; regex="${entry#*|}"
    grep_into_hits "$regex" "$file"
    [ -s "$HITS_FILE" ] || continue
    while IFS= read -r hit; do
      [ -z "$hit" ] && continue
      if is_allowed "$hit"; then continue; fi
      if [ "$found" -eq 0 ]; then
        printf '%s\n' "${RED}✖ potential secret in ${label}${NC}"
        found=1
      fi
      printf '  %s%-26s%s %s%.140s%s\n' "$YELLOW" "$name" "$NC" "$DIM" "$hit" "$NC"
    done < "$HITS_FILE"
  done
  return "$found"
}

scan_string() {  # convenience for tiny inputs
  printf '%s\n' "$2" > "$TMPDIR_SCAN/s"
  scan_file "$TMPDIR_SCAN/s" "$1"
}

# ─── Self-test ───────────────────────────────────────────────────────────────
self_test() {
  local checked=0 entry name regex canary p

  for entry in "${PATTERNS[@]}"; do
    name="${entry%%|*}"; regex="${entry#*|}"
    if ! canary=$(canary_for "$name"); then
      die "SELF-TEST FAILED: no canary defined for pattern '${name}'"
    fi
    printf '%s\n' "$canary" > "$TMPDIR_SCAN/canary"
    grep_into_hits "$regex" "$TMPDIR_SCAN/canary"
    if [ ! -s "$HITS_FILE" ]; then
      die "SELF-TEST FAILED: pattern '${name}' did not match its own canary"
    fi
    checked=$((checked + 1))
  done

  local placeholders=(
    "SUPABASE_SECRET_KEY=sb_secret_..."
    "CLOUDFLARE_API_TOKEN=cfat_..."
    "DATABASE_URL=postgresql://postgres.<project-ref>:<password>@host:6543/postgres"
  )
  for p in "${placeholders[@]}"; do
    if ! scan_string "self-test" "$p" >/dev/null 2>&1; then
      die "SELF-TEST FAILED: allowlist did not spare placeholder '${p:0:44}'"
    fi
  done

  # Regression guard: a NUL byte must not blind the scanner.
  #
  # GNU grep's `-I` skips binary input, and a blob containing one NUL from an
  # icon made it skip everything. CI passed over a planted key while macOS
  # caught it. This asserts a canary is still found alongside binary content,
  # on whichever grep is installed.
  local nul_probe="$TMPDIR_SCAN/nul_probe"
  printf 'binary junk:\000\001\002 more junk\n' > "$nul_probe"
  canary_for supabase-secret-key >> "$nul_probe"
  printf '\n' >> "$nul_probe"
  if scan_file "$nul_probe" "self-test" >/dev/null 2>&1; then
    die "SELF-TEST FAILED: a NUL byte blinded the scanner (grep -a/-I conflict)"
  fi

  printf '%s\n' "${GREEN}✓ self-test: ${checked} patterns matched their canary; ${#placeholders[@]} placeholders spared; NUL-byte guard held${NC}"
}

# ─── Diff filtering ──────────────────────────────────────────────────────────
# A diff carries both `+` (introduced) and `-` (removed) lines. Only additions
# can leak a secret; a `-` line is a credential being *taken out*. Scanning
# removals blocks the very commit that deletes a placeholder, which teaches
# people to reach for --no-verify.
#
# `+++ b/path` headers are dropped too, or a file named like a key would trip it.
# The current state of the repository is covered by --tree, so nothing is missed.
# `|| true` because grep exits 1 when a diff has no additions at all (a pure
# deletion), and `pipefail` would otherwise turn that into a scanner abort.
added_lines_only() {
  { grep -a '^+' || true; } | { grep -av '^+++' || true; }
}

# ─── .env must never be tracked ──────────────────────────────────────────────
#
# Templates are legitimate and must be spared: `.env.example`, `.env.template`,
# `.env.sample`, and the compound form `.env.production.template`. Their
# contents are still scanned for real values by the pattern pass, so sparing the
# filename costs nothing.
ENV_TEMPLATE_SUFFIX='\.(example|template|sample)$'

check_env_files() {
  local files="$1" bad
  bad=$(printf '%s\n' "$files" \
        | grep -E '(^|/)\.env($|\.)' \
        | grep -vE "$ENV_TEMPLATE_SUFFIX" || true)
  if [ -n "$bad" ]; then
    printf '%s\n' "${RED}✖ environment file tracked or staged${NC}" >&2
    printf '%s\n' "$bad" | sed 's/^/    /' >&2
    return 1
  fi
  return 0
}

# ─── Entry point ─────────────────────────────────────────────────────────────
MODE="${1:---staged}"
BLOB_FILE="$TMPDIR_SCAN/blob"

self_test

case "$MODE" in
  --self-test)
    exit 0 ;;

  --staged)
    FILES=$(git diff --cached --name-only --diff-filter=ACM || true)
    [ -z "$FILES" ] && { printf '%s\n' "${GREEN}✓ nothing staged${NC}"; exit 0; }
    check_env_files "$FILES" || die "unstage it:  git restore --staged <file>"
    git diff --cached -U0 | added_lines_only > "$BLOB_FILE" || die "git diff failed"
    LABEL="staged additions" ;;

  --range)
    RANGE="${2:?usage: --range <base>..<head>}"
    FILES=$(git diff --name-only --diff-filter=ACM "$RANGE" || true)
    [ -n "$FILES" ] && { check_env_files "$FILES" || die "an environment file is committed in $RANGE"; }
    git diff -U0 "$RANGE" | added_lines_only > "$BLOB_FILE" || die "git diff failed for range $RANGE"
    LABEL="additions in $RANGE" ;;

  --tree)
    FILES=$(git ls-files)
    check_env_files "$FILES" || die "an environment file is tracked"
    : > "$BLOB_FILE"
    # Skip binary files rather than concatenating them. A single NUL byte from
    # an icon or font would otherwise poison the whole blob (see grep_into_hits).
    # `grep -Iq . <file>` exits 1 for binary input, which is the cheapest
    # portable binary test available.
    skipped=0
    excluded=0
    while IFS= read -r -d '' f; do
      [ -f "$f" ] || continue
      if printf '%s' "$f" | grep -qE -e "$EXCLUDE_PATHS"; then
        excluded=$((excluded + 1))
        continue
      fi
      if ! grep -Iq . "$f" 2>/dev/null; then
        skipped=$((skipped + 1))
        continue
      fi
      printf '\n==== %s\n' "$f" >> "$BLOB_FILE"
      cat "$f" >> "$BLOB_FILE" 2>/dev/null || true
    done < <(git ls-files -z)
    [ "$skipped" -gt 0 ] && printf '%s(skipped %s binary file(s))%s\n' "$DIM" "$skipped" "$NC"
    if [ "$excluded" -gt 0 ]; then
      printf '%s(excluded %s vendored file(s); a tracked cache should be untracked)%s\n' \
        "$YELLOW" "$excluded" "$NC"
    fi
    LABEL="all tracked files" ;;

  *) die "unknown mode: $MODE  (--staged | --range A..B | --tree | --self-test)" ;;
esac

if [ ! -s "$BLOB_FILE" ]; then
  printf '%s\n' "${GREEN}✓ no content to scan in ${LABEL}${NC}"
  exit 0
fi

printf '%s→ scanning %s (%s bytes)%s\n' "$DIM" "$LABEL" "$(wc -c < "$BLOB_FILE" | tr -d ' ')" "$NC"

if scan_file "$BLOB_FILE" "$LABEL"; then
  printf '%s\n' "${GREEN}✓ no secrets detected in ${LABEL}${NC}"
  exit 0
fi

cat >&2 <<'GUIDE'

Blocked. If this is a real credential:
  1. Remove it from the file; read it from an environment variable instead.
  2. Rotate the key. Assume anything written to disk is already compromised.

If this is a placeholder or a format assertion, add a NARROW pattern to the
ALLOW array in scripts/scan-secrets.sh. Do not widen an existing one.

Do not use --no-verify. The CI workflow scans the push as well, and it is the
check that actually protects the repository.
GUIDE
exit 1
