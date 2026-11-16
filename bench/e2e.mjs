// End-to-end CPU benchmark, the way the grader times an entry: a fresh `node main.ts` process per
// run, CPU time (user + system) read from the child's rusage. Compares this repo with the kit's
// marked baseline and a do-nothing control, and prints net times (minus the control).
// Usage: node bench/e2e.mjs [runs] [kitDir]
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const runs = +(process.argv[2] ?? 7);
const kit = resolve(process.argv[3] ?? '../markdown-render-speed-02-kit');
const work = mkdtempSync(join(tmpdir(), 'mdfast-e2e-'));
const nullBot = join(work, 'null');
mkdirSync(nullBot);
writeFileSync(join(nullBot, 'main.ts'), '// control: starts node and exits\n');
const bots = { control: nullBot, marked: join(kit, 'baselines'), 'md-fast': resolve('.') };

function cpuOf(bot) {
  const out = mkdtempSync(join(work, 'out-'));
  // /usr/bin/time reports the child's user and system seconds on stderr (-p: POSIX format).
  const r = spawnSync('/usr/bin/time', ['-p', process.execPath, join(bot, 'main.ts')], {
    env: { ...process.env, MAKEFUN_INPUT_DIR: join(kit, 'practice/input'), MAKEFUN_OUTPUT_DIR: out },
    encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error(r.stderr);
  const sec = (k) => +r.stderr.match(new RegExp('^' + k + ' ([\\d.]+)', 'm'))[1];
  return (sec('user') + sec('sys')) * 1000;
}

const results = {};
for (let i = 0; i < runs; i++) for (const [name, bot] of Object.entries(bots)) (results[name] ??= []).push(cpuOf(bot));
const median = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
const ctl = median(results.control);
for (const [name, t] of Object.entries(results)) {
  console.log(`${name.padEnd(8)} median ${median(t).toFixed(0).padStart(5)} ms   net ${(median(t) - ctl).toFixed(0).padStart(5)} ms   runs ${t.map((x) => x.toFixed(0)).join(' ')}`);
}
const speedup = (median(results.marked) - ctl) / (median(results['md-fast']) - ctl);
console.log(`speedup over marked (net CPU): ${speedup.toFixed(2)}x`);
