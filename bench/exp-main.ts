// local experiment only: V8 flags from argv
import { readFileSync, writeFileSync } from 'node:fs';
import { setFlagsFromString } from 'node:v8';
for (const f of process.argv.slice(2)) setFlagsFromString(f);
const { parse } = await import('../parse.js');
const cases = JSON.parse(readFileSync(process.env.MAKEFUN_INPUT_DIR + '/cases.json', 'utf8'));
const out = new Array(cases.length);
for (let i = 0; i < cases.length; i++) out[i] = parse(cases[i].markdown);
writeFileSync(process.env.MAKEFUN_OUTPUT_DIR + '/html.json', JSON.stringify(out));
