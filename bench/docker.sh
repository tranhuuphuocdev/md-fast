#!/bin/sh
# CPU time in a 1-CPU container, as the grader measures it (cgroup v2 usage_usec around node main.ts).
# Usage: sh bench/docker.sh <botDir> [runs] [image]   (needs the kit's practice input beside this repo)
bot=$(cd "$1" && pwd); runs=${2:-5}; img=${3:-de170b39439e}
kit=$(cd "$(dirname "$0")/../../markdown-render-speed-02-kit" && pwd)
for i in $(seq "$runs"); do
  docker run --rm --cpus=1 --memory=1g --network=none -v "$bot:/bot:ro" -v "$kit/practice/input:/input:ro" --tmpfs /output "$img" \
    sh -c 'a=$(sed -n "s/usage_usec //p" /sys/fs/cgroup/cpu.stat); node /bot/main.ts || echo CRASH >&2; b=$(sed -n "s/usage_usec //p" /sys/fs/cgroup/cpu.stat); echo $(( (b - a) / 1000 ))'
done | sort -n | tr '\n' ' '
echo
