// Correctness check: render every practice case with ../parse.js and compare to marked's expected HTML.
// Usage: node bench/check.mjs [kitDir] [-v]
import { readFileSync } from 'node:fs';
import { parse } from '../parse.js';

const kit = process.argv.find((a, i) => i > 1 && !a.startsWith('-')) ?? '../markdown-render-speed-02-kit';
const verbose = process.argv.includes('-v');
const cases = JSON.parse(readFileSync(`${kit}/practice/input/cases.json`, 'utf8'));
const expected = JSON.parse(readFileSync(`${kit}/practice/reference/expected.json`, 'utf8')).cases.map((c) => c.html);
let bad = 0;
for (let i = 0; i < cases.length; i++) {
  let got;
  try { got = parse(cases[i].markdown); } catch (e) { got = 'THROW ' + e.stack; }
  const want = expected[i];
  if (got === want) continue;
  bad++;
  if (bad <= (verbose ? 1000 : 15)) {
    let d = 0;
    while (d < got.length && got[d] === want[d]) d++;
    const from = Math.max(0, d - 60);
    console.log(`--- ${cases[i].id} differs at ${d}`);
    if (cases[i].markdown.length < 400) console.log('md:  ', JSON.stringify(cases[i].markdown));
    console.log('want:', JSON.stringify(want.slice(from, d + 80)));
    console.log('got: ', JSON.stringify(got.slice(from, d + 80)));
  }
}
console.log(`${cases.length - bad}/${cases.length} identical`);
process.exit(bad ? 1 : 0);
