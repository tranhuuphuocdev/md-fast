#!/bin/sh
# Median total CPU (ms) of N fresh `node main.ts` runs on the practice set: sh bench/quick.sh [N] [botDir]
n=${1:-7}; bot=${2:-.}
out=$(mktemp -d)
for i in $(seq "$n"); do
  MAKEFUN_INPUT_DIR=../markdown-render-speed-02-kit/practice/input MAKEFUN_OUTPUT_DIR=$out /usr/bin/time -p node "$bot/main.ts" 2>&1 | awk '/^user/{u=$2}/^sys/{s=$2}END{print (u+s)*1000}'
done | sort -n | awk '{a[NR]=$1} END {print "median " a[int((NR+1)/2)] " ms  (min " a[1] ", max " a[NR] ")"}'
