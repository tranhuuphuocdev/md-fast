// md-fast driver: node /bot/main.ts reads every case from /input/cases.json, renders each one on its
// own with parse() and writes the HTML strings, in order, to /output/html.json.
// MAKEFUN_INPUT_DIR / MAKEFUN_OUTPUT_DIR override the two directories for local runs.
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from './parse.js';

const inputDir: string = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const outputDir: string = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const cases: { id: string; markdown: string }[] = JSON.parse(readFileSync(inputDir + '/cases.json', 'utf8'));
const out: string[] = new Array(cases.length);
for (let i = 0; i < cases.length; i++) out[i] = parse(cases[i].markdown);
writeFileSync(outputDir + '/html.json', JSON.stringify(out));
