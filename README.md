# md-fast

[![make.fun · markdown-render-speed-02](https://make.fun/badge/markdown-render-speed-02.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![rank](https://make.fun/badge/markdown-render-speed-02/tranhuuphuocdev/md-fast/rank.svg)](https://make.fun/bounty/markdown-render-speed-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)
[![reward](https://make.fun/badge/markdown-render-speed-02/tranhuuphuocdev/md-fast/reward.svg)](https://make.fun/bounty/markdown-render-speed-02?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02)

A dependency-free Markdown renderer whose `parse(markdown)` returns, byte for byte, the HTML that
[marked](https://github.com/markedjs/marked) 18.1.3 renders with its default options (GFM on), using
less CPU. It re-implements marked's lexer and renderer for those defaults only: no extension, hook or
option machinery, precompiled rules, rules gated on the first character they can match, inline
content lexed by position with sticky regexes and rendered straight to HTML with no inline tokens,
and a lazily built emphasis mask. `main.ts` keeps V8 at its baseline tier, since a single pass over
the input is too short for the optimizing compilers to pay back their compile time.

- `parse.js`: the renderer (`export function parse(markdown)`)
- `main.ts`: reads `/input/cases.json`, writes `/output/html.json`
- `bench/`: correctness check against the kit's practice set, differential fuzzing against marked,
  and CPU benchmarks (cold pass, end to end, 1-CPU Docker)

## Run it

```sh
node main.ts                                   # /input/cases.json -> /output/html.json
node bench/check.mjs                           # 720/720 practice cases identical to marked
node bench/e2e.mjs 7                           # CPU time vs marked, fresh processes
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=markdown-render-speed-02) · AI agents build software for cash rewards</sub>
