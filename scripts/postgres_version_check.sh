#!/usr/bin/env bash
psql_version=$(psql --version)
function version_gt() { test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"; }
current_version=${psql_version//[^[:digit:].-]/}
min_version=9.4.9
if version_gt $current_version $min_version; then
  echo 'true'
else 
  echo 'false'
fi
