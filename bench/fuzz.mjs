// Differential tests against marked itself (from the kit, never committed here):
//  1. every case of extra instances drawn with the kit's generator (node bench/fuzz.mjs sets <dir>...)
//  2. random mutations of practice cases: line splices, cross-case mixes and inserted markdown
//     punctuation (node bench/fuzz.mjs mutate [iterations] [seed])
import { readFileSync } from 'node:fs';
import { marked } from '../../markdown-render-speed-02-kit/baselines/vendor/marked/marked.esm.js';
import { parse } from '../parse.js';

const kit = '../markdown-render-speed-02-kit';
const ref = (md) => { try { return marked.parse(md); } catch (e) { return 'THROW'; } };
const mine = (md) => { try { return parse(md); } catch (e) { return 'THROW ' + e.message; } };
let fails = 0;
function compare(md, label) {
  const want = ref(md);
  const got = mine(md);
  if (want === got) return true;
  fails++;
  if (fails <= 8) {
    let d = 0;
    while (d < got.length && got[d] === want[d]) d++;
    console.log(`--- ${label} differs at ${d}`);
    console.log('md:  ', JSON.stringify(md.length < 600 ? md : md.slice(0, 600)));
    console.log('want:', JSON.stringify(want.slice(Math.max(0, d - 80), d + 80)));
    console.log('got: ', JSON.stringify(got.slice(Math.max(0, d - 80), d + 80)));
  }
  return false;
}

const mode = process.argv[2] ?? 'mutate';
if (mode === 'sets') {
  let n = 0;
  for (const dir of process.argv.slice(3)) {
    const cases = JSON.parse(readFileSync(`${dir}/out/input/cases.json`, 'utf8'));
    const exp = JSON.parse(readFileSync(`${dir}/out/reference/expected.json`, 'utf8')).cases;
    for (let i = 0; i < cases.length; i++) {
      n++;
      const got = mine(cases[i].markdown);
      if (got !== exp[i].html) { fails++; if (fails <= 5) compare(cases[i].markdown, dir + ' ' + cases[i].id); }
    }
  }
  console.log(`sets: ${n - fails}/${n} identical`);
} else {
  const iters = +(process.argv[3] ?? 20000);
  let seed = +(process.argv[4] ?? 1);
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x80000000; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const cases = JSON.parse(readFileSync(`${kit}/practice/input/cases.json`, 'utf8')).map((c) => c.markdown);
  const spec = cases.slice(0, 680);
  const docLines = cases.slice(680).flatMap((d) => d.split('\n'));
  const bits = ['*', '_', '**', '__', '~', '~~', '`', '``', '[', ']', '(', ')', '<', '>', '!', '\\', '&', '#', '-', '+', '|', ':', ' ', '  ', '\t', '\n', '\n\n', '1.', '> ', '- ', '* ', '    ', '```', 'http://x.y', 'www.a.b', 'a@b.cd', '&amp;', '&#35;', '<a href="x">', '</a>', '<pre>', '</pre>', '[x]', '[ ]', '[a]: /u', '[a]', '"', "'", '=', '---', '===', ' ', 'é', '😀', '.', ',', ';', '?', '%', '@'];
  for (let it = 0; it < iters; it++) {
    let md;
    const r = rnd();
    if (r < 0.3) {
      md = pick(spec);
    } else if (r < 0.6) {
      const n = 1 + Math.floor(rnd() * 12);
      const start = Math.floor(rnd() * docLines.length);
      md = docLines.slice(start, start + n).join('\n') + (rnd() < 0.5 ? '\n' : '');
    } else {
      md = pick(spec) + (rnd() < 0.5 ? '\n' : '') + pick(spec);
    }
    const muts = Math.floor(rnd() * 5);
    for (let k = 0; k < muts; k++) {
      const at = Math.floor(rnd() * (md.length + 1));
      if (rnd() < 0.75) md = md.slice(0, at) + pick(bits) + md.slice(at);
      else md = md.slice(0, at) + md.slice(at + 1 + Math.floor(rnd() * 3));
    }
    compare(md, 'mutation ' + it);
  }
  console.log(`mutate: ${iters - fails}/${iters} identical`);
}
process.exit(fails ? 1 : 0);
