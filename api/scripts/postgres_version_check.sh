#!/usr/bin/env bash

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine="Linux";;
    Darwin*)    machine="Mac";;
    CYGWIN*)    machine="Cygwin";;
    MINGW*)     machine="MinGw";;
    *)          machine="UNKNOWN:${unameOut}"
esac

if [ "$machine" == "Mac" ]; then
  brew install coreutils
fi
 
psql_version=$(psql --version)
function version_gt() { test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"; }
current_version=${psql_version//[^[:digit:].-]/}
min_version=9.4.9
if version_gt $current_version $min_version; then
  echo 'true'
else 
  echo 'false'
fi
