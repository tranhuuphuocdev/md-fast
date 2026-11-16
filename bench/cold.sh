#!/bin/sh
# Median cold (first-pass) parse CPU over N fresh processes: sh bench/cold.sh [module] [N]
mod=${1:-parse.js}; n=${2:-9}
for i in $(seq $n); do node bench/bench.mjs "$mod" 1 | sed -E 's/.*first ([0-9.]+)ms.*/\1/'; done | sort -n | awk '{a[NR]=$1} END {print "cold median " a[int((NR+1)/2)] "ms (min " a[1] ", max " a[NR] ")"}'
