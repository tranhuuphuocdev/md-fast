// Reference module for benchmarking: marked itself, loaded from the kit (never committed here).
import { marked } from '../../markdown-render-speed-02-kit/baselines/vendor/marked/marked.esm.js';
export const parse = (md) => marked.parse(md);
