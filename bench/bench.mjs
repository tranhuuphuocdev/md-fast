// CPU-time benchmark: renders the whole practice set N times with a parser module and reports
// user+system CPU per pass. Usage: node bench/bench.mjs <module.js> [passes] [kitDir]
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const mod = await import(pathToFileURL(resolve(process.argv[2])).href);
const passes = +(process.argv[3] ?? 5);
const kit = process.argv[4] ?? '../markdown-render-speed-02-kit';
const cases = JSON.parse(readFileSync(`${kit}/practice/input/cases.json`, 'utf8'));
const cpu = () => { const u = process.cpuUsage(); return (u.user + u.system) / 1000; };
const times = [];
let sink = 0;
for (let p = 0; p < passes; p++) {
  const t0 = cpu();
  for (const c of cases) sink += mod.parse(c.markdown).length;
  times.push(cpu() - t0);
}
const fmt = (x) => x.toFixed(1) + 'ms';
console.log(`${process.argv[2]}: first ${fmt(times[0])}, best ${fmt(Math.min(...times))}, median ${fmt(times.slice().sort((a, b) => a - b)[times.length >> 1])} (sink ${sink})`);
