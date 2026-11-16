// md-fast: a dependency-free Markdown renderer that returns, byte for byte, the HTML that
// marked 18.1.3 (MIT, https://github.com/markedjs/marked) renders with its default options
// (gfm on, breaks off, pedantic off). The algorithm follows marked's lexer, tokenizer and
// renderer (see NOTICE), specialised for those defaults: no extensions, hooks or options,
// precompiled rules, and inline content rendered straight to HTML without inline tokens.

// ---------------------------------------------------------------------------------------
// Block rules (marked's gfm block grammar, compiled)
// ---------------------------------------------------------------------------------------

const TAGS = 'address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul';
const HR_SRC = ' {0,3}((?:-[\\t ]*){3,}|(?:_[ \\t]*){3,}|(?:\\*[ \\t]*){3,})(?:\\n+|$)';
const HEADING_START = ' {0,3}#{1,6}(?:\\s|$)';
const FENCE_START = ' {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)';
const HTML_START = ' {0,3}(?:<\\/?(?:' + TAGS + ')(?: +|\\n|\\/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)';
const TABLE_SRC = ' *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|' + HR_SRC + '|' + HEADING_START + '| {0,3}>|(?: {4}| {0,3}\\t)[^\\n]|' + FENCE_START + '| {0,3}(?:[*+-]|1[.)])[ \\t]|' + HTML_START + ').*(?:\\n|$))*)\\n*|$)';
const paraBody = (list, table) => '([^\\n]+(?:\\n(?!' + HR_SRC + '|' + HEADING_START + '| {0,3}>|' + FENCE_START + '|' + list + '|' + HTML_START + (table ? '|' + table : '') + '|[ \\t]+\\n)[^\\n]+)*)';

const R_NEWLINE = /^(?:[ \t]*(?:\n|$))+/;
const R_CODE = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
const R_FENCES = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}(?:(?=`)\1`*|(?=~)\1~*) *(?=\n|$)|$)/;
const R_HR = new RegExp('^' + HR_SRC);
const R_HEADING = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
const R_BLOCKQUOTE = new RegExp('^( {0,3}> ?(?:(?![ \\t]*(?:\\n|$))' + paraBody(' {0,3}(?:[*+-]|\\d{1,9}[.)])(?:[ \\t]|\\n|$)', '') + '|[^\\n]*)(?:\\n|$))+');
const R_LIST = /^( {0,3}(?:[*+-]|\d{1,9}[.)]))([ \t][^\n]*?)?(?:\n|$)/;
const R_HTML = new RegExp('^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:<\\/\\1>[^\\n]*\\n*|$)|<!--(?:-?>|[\\s\\S]*?(?:-->|$))[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|<\\/?(' + TAGS + ')(?:[ \\t]+|\\n|\\/?>|$)[\\s\\S]*?(?:(?:\\n[ \\t]*)+\\n|$)|<(?!(?:script|pre|style|textarea)(?![a-z0-9-]))([a-z][a-z0-9-]*)(?: +[a-zA-Z:_][\\w.:-]*(?: *= *"[^"\\n]*"| *= *\'[^\'\\n]*\'| *= *[^\\s"\'=<>`]+)?)*? *\\/?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \\t]*)+\\n|$)|<\\/[a-z][a-z0-9-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \\t]*)+\\n|$))', 'i');
const R_DEF = /^ {0,3}\[((?!\s*\])(?:\\[\s\S]|[^\[\]\\\n]|\n(?![ \t]*\n))+)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)((?:"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\\n]|\n(?!\n))*'|\((?:\\[\s\S]|[^()\\])*\))))? *(?:\n+|$)/;
const R_TABLE = new RegExp('^' + TABLE_SRC);
const LH_STOP = ' {0,3}(?:[*+-]|\\d{1,9}[.)]) | {0,3}(?:`{3,}|~{3,})| {0,3}>| {0,3}#{1,6}(?:\\s|$)';
const HR_NOCAP = ' {0,3}(?:(?:-[\\t ]*){3,}|(?:_[ \\t]*){3,}|(?:\\*[ \\t]*){3,})(?:\\n+|$)';
const LH_TAIL ='| {0,3}<[^\\n>]+>\\n| {0,3}\\|?(?:[:\\- ]*\\|)+[\\:\\- ]*\\n';
const R_LHEADING = new RegExp('^(?! {0,3}(?:[*+-]|\\d{1,9}[.)]) |(?: {4}| {0,3}\\t)| {0,3}(?:`{3,}|~{3,})| {0,3}>| {0,3}#{1,6}(?:\\s|$)' + LH_TAIL + ')((?:.|\\n(?!\\s*?\\n|' + LH_STOP + '|' + HR_NOCAP + LH_TAIL + '))+?)\\n {0,3}(=+|-+)[ \\t]*(?:\\n+|$)');
const R_PARAGRAPH = new RegExp('^' + paraBody(' {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]', TABLE_SRC));
const R_TEXT = /^[^\n]+/;

// Rules a list item builds for its own indent (marked caches them per indent, capped at 3).
const indentRules = (make) => [0, 1, 2, 3].map(make);
const R_NEXT_BULLET = indentRules((n) => new RegExp(`^ {0,${n}}(?:[*+-]|\\d{1,9}[.)])((?:[ \t][^\\n]*)?(?:\\n|$))`));
const R_ITEM_HR = indentRules((n) => new RegExp(`^ {0,${n}}((?:-[ \t]*){3,}|(?:_[ \t]*){3,}|(?:\\*[ \t]*){3,})(?:\\n+|$)`));
const R_ITEM_FENCE = indentRules((n) => new RegExp(`^ {0,${n}}(?:\`\`\`|~~~)`));
const R_ITEM_HEADING = indentRules((n) => new RegExp(`^ {0,${n}}#{1,6}(?:\\s|$)`));
const R_ITEM_HTML = indentRules((n) => new RegExp(`^ {0,${n}}(?:</?(?:${TAGS})(?: +|$|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)`, 'i'));
const R_ITEM_BQ = indentRules((n) => new RegExp(`^ {0,${n}}>`));

// ---------------------------------------------------------------------------------------
// Inline rules (marked's gfm inline grammar, compiled)
// ---------------------------------------------------------------------------------------

const PUNCT = '[\\p{P}\\p{S}]';
const PUNCT_NO_TILDE = '(?!~)[\\p{P}\\p{S}]';
const R_ESCAPE = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
const R_CODESPAN = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
const R_BR = /^( {2,}|\\)\n(?!\s*$)[ \t]*/;
const R_PUNCTUATION = /^((?![*_])[\s\p{P}\p{S}])/u;
const R_UNICODE_ALNUM = /[\p{L}\p{N}]/u;
const R_EMSTRONG_L = new RegExp('^(?:\\*+(?:((?!\\*)' + PUNCT_NO_TILDE + ')|([^\\s*]))?)|^_+(?:((?!_)' + PUNCT_NO_TILDE + ')|([^\\s_]))?', 'u');
const R_EMSTRONG_R_AST = /^[^_*]*?__[^_*]*?\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\*)(?!~)[\p{P}\p{S}](\*+)(?=[\s]|$)|(?:[^\s\p{P}\p{S}]|~)(\*+)(?!\*)(?=(?!~)[\s\p{P}\p{S}]|$)|(?!\*)(?!~)[\s\p{P}\p{S}](\*+)(?=(?:[^\s\p{P}\p{S}]|~))|[\s](\*+)(?!\*)(?=(?!~)[\p{P}\p{S}])|(?!\*)(?!~)[\p{P}\p{S}](\*+)(?!\*)(?=(?!~)[\p{P}\p{S}])|(?:[^\s\p{P}\p{S}]|~)(\*+)(?=(?:[^\s\p{P}\p{S}]|~))/gu;
const R_EMSTRONG_R_UND = /^[^_*]*?\*\*[^_*]*?_[^_*]*?(?=\*\*)|[^_]+(?=[^_])|(?!_)[\p{P}\p{S}](_+)(?=[\s]|$)|[^\s\p{P}\p{S}](_+)(?!_)(?=[\s\p{P}\p{S}]|$)|(?!_)[\s\p{P}\p{S}](_+)(?=[^\s\p{P}\p{S}])|[\s](_+)(?!_)(?=[\p{P}\p{S}])|(?!_)[\p{P}\p{S}](_+)(?!_)(?=[\p{P}\p{S}])/gu;
const R_DEL_L = new RegExp('^~~?(?:(' + PUNCT_NO_TILDE + ')|[^\\s~])', 'u');
const R_DEL_R = /^[^~]+(?=[^~])|(?!~)[\p{P}\p{S}](~~?)(?=[\s]|$)|[^\s\p{P}\p{S}](~~?)(?!~)(?=[\s\p{P}\p{S}]|$)|(?!~)[\s\p{P}\p{S}](~~?)(?=[^\s\p{P}\p{S}])|[\s](~~?)(?!~)(?=[\p{P}\p{S}])|(?!~)[\p{P}\p{S}](~~?)(?!~)(?=[\p{P}\p{S}])|[^\s\p{P}\p{S}](~~?)(?=[^\s\p{P}\p{S}])/gu;
const R_AUTOLINK = /^<([a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^\s\x00-\x1f<>]*|[a-zA-Z0-9.!#$%&'*+/=?_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_]))>/;
const R_TAG = /^<!--(?:-?>|[\s\S]*?-->)|^<\/[a-zA-Z][a-zA-Z0-9-]*\s*>|^<[a-zA-Z][a-zA-Z0-9-]*(?:\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?)*?\s*\/?>|^<\?[\s\S]*?\?>|^<![a-zA-Z]+\s[\s\S]*?>|^<!\[CDATA\[[\s\S]*?\]\]>/;
const LABEL = '(?:\\[(?:\\[(?:\\\\[\\s\\S]|[^\\[\\]\\\\])*\\]|\\\\[\\s\\S]|[^\\[\\]\\\\])*\\]|\\\\[\\s\\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\\])|[^\\[\\]\\\\`])*?';
const REF = '(?!\\s*\\])(?:\\\\[\\s\\S]|[^\\[\\]\\\\\\n]|\\n(?![ \\t]*\\n))+';
const R_LINK = new RegExp('^!?\\[(' + LABEL + ')\\]\\([ \\t\\n]*(<(?:\\\\.|[^\\n<>\\\\])+>|[^ \\t\\n\\x00-\\x1f]+|(?=\\)))(?:(?:[ \\t]+(?:\\n[ \\t]*)?|\\n[ \\t]*)("(?:\\\\[\\s\\S]|[^"\\\\])*"|\'(?:\\\\[\\s\\S]|[^\'\\\\])*\'|\\((?:\\\\[\\s\\S]|[^)\\\\])*\\)))?[ \\t\\n]*\\)');
const R_REFLINK = new RegExp('^!?\\[(' + LABEL + ')\\]\\[(' + REF + ')\\]');
const R_NOLINK = new RegExp('^!?\\[(' + REF + ')\\](?:\\[\\])?');
const R_REFLINK_SEARCH = /!?\[((?:[^\[\]\\`]*(?:\[(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\]))){0,999}?[^\[\]\\`]*?)\]\[((?!\s*\])(?:\\[\s\S]|[^\[\]\\]){1,999})\]|!?\[((?!\s*\])(?:\\[\s\S]|[^\[\]\\]){1,999})\](?:\[\])?(?!\()/g;
const R_BLOCK_SKIP = /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)|(?<!`)()(?<b>`+)[^`]+\k<b>(?!`)|<(?! )[^<>]*?>/g;
const R_ANY_PUNCT = /\\([\p{P}\p{S}])/gu;
const R_ANY_PUNCT_OUTSIDE_CODE = /(`+)(?:[^`]|[^`][\s\S]*?[^`])\1(?!`)|`+|\\([\p{P}\p{S}])/gu;
const EMAIL = '[A-Za-z0-9._+-]+@[a-zA-Z0-9-_]+(?:\\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\\w-])';
const R_URL = new RegExp('^(?:mailto:' + EMAIL + '|xmpp:' + EMAIL + '(?:\\/[A-Za-z0-9@.]+)?)|^((?:[hH][tT][tT][pP][sS]?|[fF][tT][pP]):\\/\\/|www\\.)(?:[a-zA-Z0-9\\-]+\\.?)+[^\\s<]*|^[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\\w-])');
const R_BACKPEDAL = /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/;
const EMAIL_CHARS = "[a-zA-Z0-9.!#$%&'*+\\/=?_`{\\|}~-]";
const R_INLINE_TEXT = new RegExp('^(?:[^a-zA-Z0-9](?=(?:mailto|xmpp):)|(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\\n)|(?=' + EMAIL_CHARS + '+@)|[\\s\\S]*?(?:(?=[\\\\<!\\[`*~_]|\\b_|[hH][tT][tT][pP][sS]?|[fF][tT][pP]:\\/\\/|(?<![^\\s*_~(])www\\.|$)|[^ ](?= {2,}\\n)|[^a-zA-Z0-9](?=(?:mailto|xmpp):)|[^a-zA-Z0-9.!#$%&\'*+\\/=?_`{\\|}~-](?=' + EMAIL_CHARS + '+@))))');

// ---------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escChar = (c) => ESC[c];
const R_ESC_TEST = /[&<>"']/;
const R_ESC_ALL = /[&<>"']/g;
const R_ESC_TEST_KEEP = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/;
const R_ESC_KEEP = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g;

/** marked's escape(): `encode` escapes every &, otherwise entity-looking ampersands survive. */
function escapeHtml(s, encode) {
  if (encode) return R_ESC_TEST.test(s) ? s.replace(R_ESC_ALL, escChar) : s;
  return R_ESC_TEST_KEEP.test(s) ? s.replace(R_ESC_KEEP, escChar) : s;
}

const R_NUM_REF = /&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));/;
const R_NUM_REF_OR_AMP = /&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g;
function decodeNumericRefs(s) {
  if (!R_NUM_REF.test(s)) return s;
  return s.replace(R_NUM_REF_OR_AMP, (all, dec, hex) => {
    if (dec === undefined && hex === undefined) return '&amp;';
    const cp = dec === undefined ? Number.parseInt(hex, 16) : Number.parseInt(dec, 10);
    if (cp === 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return '\uFFFD';
    return cp === 38 ? '&amp;' : String.fromCodePoint(cp);
  });
}

function cleanUrl(href) {
  try {
    return encodeURI(href).replace(/%25/g, '%');
  } catch {
    return null;
  }
}

/** Strip trailing `ch` characters. */
function rtrim(s, ch) {
  let n = s.length;
  while (n > 0 && s[n - 1] === ch) n--;
  return s.slice(0, n);
}

/** Drop trailing blank lines unless there are at most one. */
function trimBlankTail(s) {
  const lines = s.split('\n');
  let i = lines.length - 1;
  while (i >= 0 && /^[ \t]*$/.test(lines[i])) i--;
  return lines.length - i <= 2 ? s : lines.slice(0, i + 1).join('\n');
}

function normalizeLabel(s) {
  return s.trim().replace(/\s+/g, ' ').toLowerCase().toUpperCase().toLowerCase();
}

/** Index of the bracket closing an unopened `close`, -1 when balanced, -2 when left open. */
function findClosing(s, open, close) {
  if (s.indexOf(open) === -1 && s.indexOf(close) === -1) return -1;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') i++;
    else if (c === open) depth++;
    else if (c === close && --depth < 0) return i;
  }
  return depth > 0 ? -2 : -1;
}

function expandTabs(s, col = 0) {
  let out = '';
  for (const c of s) {
    if (c === '\t') {
      const n = 4 - (col % 4);
      out += ' '.repeat(n);
      col += n;
    } else {
      out += c;
      col++;
    }
  }
  return out;
}

function splitCells(row, count) {
  const marked = row.replace(/\|/g, (m, at, str) => {
    let escaped = false;
    let p = at;
    while (--p >= 0 && str[p] === '\\') escaped = !escaped;
    return escaped ? '|' : ' |';
  });
  const cells = marked.split(/ \|/);
  if (!cells[0].trim()) cells.shift();
  if (cells.length > 0 && !cells[cells.length - 1].trim()) cells.pop();
  if (count) {
    if (cells.length > count) cells.splice(count);
    else while (cells.length < count) cells.push('');
  }
  for (let i = 0; i < cells.length; i++) cells[i] = cells[i].trim().replace(/\\\|/g, '|');
  return cells;
}

/** The text before the first line feed (all of `s` when it has none). */
function firstLine(s) {
  const i = s.indexOf('\n');
  return i < 0 ? s : s.slice(0, i);
}

const lastCodePoint = (s) => {
  const n = s.length;
  if (n === 0) return '';
  const c = s.charCodeAt(n - 1);
  if (c >= 0xdc00 && c <= 0xdfff && n >= 2) {
    const h = s.charCodeAt(n - 2);
    if (h >= 0xd800 && h <= 0xdbff) return s.slice(n - 2);
  }
  return s[n - 1];
};
const cpLength = (s) => {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) i++;
    }
    n++;
  }
  return n;
};
const firstCpLength = (s) => {
  const c = s.charCodeAt(0);
  if (c >= 0xd800 && c <= 0xdbff && s.length > 1) {
    const d = s.charCodeAt(1);
    if (d >= 0xdc00 && d <= 0xdfff) return 2;
  }
  return 1;
};

// ---------------------------------------------------------------------------------------
// Per-document state (reset by every parse() call; nothing survives between calls)
// ---------------------------------------------------------------------------------------

let links; // reference definitions: label -> {href, title}
let queue; // inline jobs, in the order marked's lexer queues them: {src, tok}
let top; // marked's state.top
let inLink;
let inRawBlock;
let linkEmitted;
let linkParenPossible;

// Token type ids
const T_SPACE = 1, T_CODE = 2, T_HEADING = 3, T_HR = 4, T_BLOCKQUOTE = 5, T_LIST = 6, T_HTML = 7,
  T_DEF = 8, T_TABLE = 9, T_PARAGRAPH = 10, T_TEXT = 11, T_CHECKBOX = 12;

function queueInline(src, tok) {
  queue.push({ src, tok });
}

// ---------------------------------------------------------------------------------------
// Block lexer
// ---------------------------------------------------------------------------------------

function blockTokens(src, tokens, clipped) {
  let m, tok, last;
  while (src) {
    // Gate every rule on the first character it can start with (after up to 3 spaces).
    const c0 = src.charCodeAt(0);
    let j = 0;
    while (j < 3 && src.charCodeAt(j) === 32) j++;
    const c = src.charCodeAt(j);
    // space
    if ((c0 === 10 || c0 === 32 || c0 === 9) && (m = R_NEWLINE.exec(src)) && m[0].length > 0) {
      const raw = m[0];
      src = src.substring(raw.length);
      last = tokens[tokens.length - 1];
      if (raw.length === 1 && last !== undefined) last.raw += '\n';
      else tokens.push({ type: T_SPACE, raw });
      continue;
    }
    // indented code
    if ((c === 32 || c === 9) && (m = R_CODE.exec(src))) {
      const raw = trimBlankTail(m[0]);
      const text = raw.replace(/^(?: {0,3}\t| {1,4})/gm, '');
      src = src.substring(raw.length);
      last = tokens[tokens.length - 1];
      if (last !== undefined && (last.type === T_PARAGRAPH || last.type === T_TEXT)) {
        last.raw += (last.raw.endsWith('\n') ? '' : '\n') + raw;
        last.text += '\n' + text;
        queue[queue.length - 1].src = last.text;
      } else tokens.push({ type: T_CODE, raw, text, lang: undefined });
      continue;
    }
    if ((c === 96 || c === 126) && (tok = fences(src))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if (c === 35 && (tok = heading(src))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if ((c === 45 || c === 95 || c === 42) && (m = R_HR.exec(src))) {
      const raw = rtrim(m[0], '\n');
      src = src.substring(raw.length);
      tokens.push({ type: T_HR, raw });
      continue;
    }
    if (c === 62 && (tok = blockquote(src))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if ((c === 45 || c === 42 || c === 43 || (c >= 48 && c <= 57)) && (tok = list(src))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if (c === 60 && (m = R_HTML.exec(src))) {
      const raw = trimBlankTail(m[0]);
      src = src.substring(raw.length);
      tokens.push({ type: T_HTML, raw, text: raw });
      continue;
    }
    if (c === 91 && (tok = def(src))) {
      src = src.substring(tok.raw.length);
      last = tokens[tokens.length - 1];
      if (last !== undefined && (last.type === T_PARAGRAPH || last.type === T_TEXT)) {
        last.raw += (last.raw.endsWith('\n') ? '' : '\n') + tok.raw;
        last.text += '\n' + tok.raw;
        queue[queue.length - 1].src = last.text;
      } else {
        if (!links[tok.tag]) links[tok.tag] = { href: tok.href, title: tok.title };
        tokens.push(tok);
      }
      continue;
    }
    if (secondLineMayDelimitTable(src) && (tok = table(src))) { src = src.substring(tok.raw.length); tokens.push(tok); continue; }
    if (mayBeSetext(src) && (m = R_LHEADING.exec(src))) {
      const text = m[1].trim();
      tok = { type: T_HEADING, raw: rtrim(m[0], '\n'), depth: m[2].charAt(0) === '=' ? 1 : 2, text };
      queueInline(text, tok);
      src = src.substring(tok.raw.length);
      tokens.push(tok);
      continue;
    }
    if (top && (m = R_PARAGRAPH.exec(src))) {
      const raw = m[0];
      const text = m[1].charAt(m[1].length - 1) === '\n' ? m[1].slice(0, -1) : m[1];
      tok = { type: T_PARAGRAPH, raw, text };
      queueInline(text, tok);
      last = tokens[tokens.length - 1];
      if (clipped && last !== undefined && last.type === T_PARAGRAPH) {
        last.raw += (last.raw.endsWith('\n') ? '' : '\n') + raw;
        last.text += '\n' + text;
        queue.pop();
        queue[queue.length - 1].src = last.text;
      } else tokens.push(tok);
      clipped = false;
      src = src.substring(raw.length);
      continue;
    }
    if ((m = R_TEXT.exec(src))) {
      const raw = m[0];
      src = src.substring(raw.length);
      tok = { type: T_TEXT, raw, text: raw };
      queueInline(raw, tok);
      last = tokens[tokens.length - 1];
      if (last !== undefined && last.type === T_TEXT) {
        last.raw += (last.raw.endsWith('\n') ? '' : '\n') + raw;
        last.text += '\n' + raw;
        queue.pop();
        queue[queue.length - 1].src = last.text;
      } else tokens.push(tok);
      continue;
    }
    if (src) throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
  }
  top = true;
  return tokens;
}

/** A gfm table needs its second line to open (after up to 3 spaces) with |, : or -. */
function secondLineMayDelimitTable(src) {
  let i = src.indexOf('\n');
  if (i < 0) return false;
  i++;
  const end = i + 3;
  while (i < end && src.charCodeAt(i) === 32) i++;
  const c = src.charCodeAt(i);
  return c === 124 || c === 58 || c === 45;
}

/** A setext heading needs, before the first blank line, a line opening (after up to 3 spaces) with = or -. */
function mayBeSetext(src) {
  let i = src.indexOf('\n');
  while (i >= 0) {
    i++;
    let k = i;
    const end = i + 3;
    while (k < end && src.charCodeAt(k) === 32) k++;
    const c = src.charCodeAt(k);
    if (c === 61 || c === 45) return true;
    // stop at a blank line: the heading's text cannot cross one
    let b = i;
    while (src.charCodeAt(b) === 32 || src.charCodeAt(b) === 9) b++;
    if (b >= src.length || src.charCodeAt(b) === 10) return false;
    i = src.indexOf('\n', i);
  }
  return false;
}

function fences(src) {
  const m = R_FENCES.exec(src);
  if (!m) return null;
  const raw = m[0];
  let text = m[3] || '';
  const ind = /^(\s+)(?:```)/.exec(raw);
  if (ind !== null) {
    const pad = ind[1].length;
    text = text.split('\n').map((line) => {
      const lead = /^\s+/.exec(line);
      return lead === null ? line : line.slice(Math.min(lead[0].length, pad));
    }).join('\n');
  }
  const lang = m[2] ? m[2].trim().replace(R_ANY_PUNCT, '$1') : m[2];
  return { type: T_CODE, raw, text, lang };
}

function heading(src) {
  const m = R_HEADING.exec(src);
  if (!m) return null;
  let text = m[2].trim();
  if (text.endsWith('#')) {
    const t = rtrim(text, '#');
    if (!t || /[ \t]$/.test(t)) text = t.trim();
  }
  const tok = { type: T_HEADING, raw: rtrim(m[0], '\n'), depth: m[1].length, text };
  queueInline(text, tok);
  return tok;
}

const R_BQ_START = /^ {0,3}>/;
const R_BQ_STRIP = /^ {0,3}>[ \t]?/gm;

function blockquote(src) {
  const m = R_BLOCKQUOTE.exec(src);
  if (!m) return null;
  let lines = rtrim(m[0], '\n').split('\n');
  let raw = '';
  let text = '';
  const tokens = [];
  while (lines.length > 0) {
    let inQuote = false;
    const cur = [];
    let p;
    for (p = 0; p < lines.length; p++) {
      if (R_BQ_START.test(lines[p])) {
        cur.push(lines[p]);
        inQuote = true;
      } else if (!inQuote) cur.push(lines[p]);
      else break;
    }
    lines = lines.slice(p);
    const chunk = cur.join('\n');
    const inner = chunk
      .replace(/^( {0,3}>)([ \t]+)/gm, (all, mark, ws) => mark + expandTabs(ws, mark.length))
      .replace(/\n {0,3}((?:=+|-+)[ \t]*)(?=\n|$)/g, '\n    $1')
      .replace(R_BQ_STRIP, '');
    raw = raw ? `${raw}\n${chunk}` : chunk;
    text = text ? `${text}\n${inner}` : inner;
    const savedTop = top;
    top = true;
    blockTokens(inner, tokens, true);
    top = savedTop;
    if (lines.length === 0) break;
    const lastTok = tokens[tokens.length - 1];
    const lt = lastTok === undefined ? 0 : lastTok.type;
    if (lt === T_CODE || lt === T_HEADING || lt === T_HR || lt === T_HTML || lt === T_TABLE) break;
    if (lt === T_BLOCKQUOTE) {
      const rest = lines.join('\n');
      const merged = lastTok.raw + '\n' + rest.replace(R_BQ_STRIP, '');
      const fresh = blockquote(merged);
      tokens[tokens.length - 1] = fresh;
      const left = merged.substring(fresh.raw.length).replace(/^\n/, '');
      const leftLines = left ? left.split('\n').length : 0;
      const used = leftLines ? lines.slice(0, -leftLines) : lines;
      if (used.length > 0) raw = `${raw}\n${used.join('\n')}`;
      text = text.substring(0, text.length - lastTok.text.length) + fresh.text;
      lines = lines.slice(used.length);
      if (lines.length > 0 && R_BQ_START.test(lines[0])) continue;
      break;
    } else if (lt === T_LIST) {
      const joined = lastTok.raw + '\n' + lines.join('\n');
      const fresh = list(joined);
      tokens[tokens.length - 1] = fresh;
      const used = fresh.raw.length > lastTok.raw.length ? joined.slice(lastTok.raw.length + 1, fresh.raw.length).split('\n').length : 0;
      if (used > 0) {
        const y = lines.slice(0, used).join('\n');
        raw = `${raw}\n${y}`;
        text = `${text}\n${y}`;
      }
      lines = lines.slice(used);
      continue;
    }
  }
  return { type: T_BLOCKQUOTE, raw, tokens, text };
}

const R_LEAD_WS = /^[ \t]+/;
const R_NON_SPACE = /[^ ]/;
const R_TASK = /^\[[ xX]\][ \t]+\S/;
const R_TASK_STRIP = /^\[[ xX]\][ \t]+/;

function list(src) {
  let m = R_LIST.exec(src);
  if (!m) return null;
  const orig = src;
  let bull = m[1].trim();
  const ordered = bull.length > 1;
  const lst = { type: T_LIST, raw: '', ordered, start: ordered ? +bull.slice(0, -1) : '', loose: false, items: [] };
  bull = ordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;
  const itemRe = new RegExp(`^( {0,3}${bull})((?:[\t ][^\\n]*)?(?:\\n|$))`);
  let endsWithBlank = false;
  while (src) {
    let endEarly = false;
    let content = '';
    if (!(m = itemRe.exec(src)) || R_HR.test(src)) break;
    const start = orig.length - src.length;
    src = src.substring(m[0].length);
    const itemLine = firstLine(m[2]);
    const markLen = m[1].length;
    let line = expandLeading(itemLine, markLen);
    let nextLine = firstLine(src);
    let blank = isBlank(line);
    let indent = 0;
    if (blank) indent = markLen + 1;
    else {
      indent = firstNonSpace(line);
      indent = indent > 4 ? 1 : indent;
      content = line.slice(indent);
      indent += markLen;
    }
    if (blank && /^[ \t]*$/.test(nextLine)) {
      src = src.substring(nextLine.length + 1);
      endEarly = true;
    }
    if (!endEarly) {
      const cap = Math.max(0, Math.min(3, indent - 1));
      while (src) {
        const rawLine = firstLine(src);
        nextLine = rawLine;
        const expanded = expandLeading(nextLine, 0);
        if (endsItem(nextLine, cap, true)) break;
        const lineBlank = isBlank(nextLine);
        if (lineBlank || firstNonSpace(expanded) >= indent) {
          content += '\n' + expanded.slice(indent);
        } else {
          if (blank || tabbedIndent(line) >= 4 || endsItem(line, cap, false)) break;
          const add = /^ {0,3}(?:=+|-+) *$/.test(nextLine) && R_LHEADING.test(`${line}\n${nextLine}`) ? `    ${expanded.replace(/^ {0,3}/, '')}` : nextLine;
          content += '\n' + add;
        }
        blank = lineBlank;
        src = src.substring(rawLine.length + 1);
        line = expanded.slice(indent);
      }
    }
    const raw = orig.slice(start, orig.length - src.length);
    if (!lst.loose) {
      if (endsWithBlank) lst.loose = true;
      else if (/\n[ \t]*\n[ \t]*$/.test(raw)) endsWithBlank = true;
    }
    lst.items.push({ raw, task: R_TASK.test(content), checked: false, text: content, tokens: null });
  }
  const lastItem = lst.items[lst.items.length - 1];
  if (!lastItem) return null;
  lastItem.raw = lastItem.raw.trimEnd();
  lastItem.text = lastItem.text.trimEnd();
  lst.raw = orig.slice(0, orig.length - src.length).trimEnd();
  for (const item of lst.items) {
    top = false;
    item.tokens = blockTokens(item.text, []);
    if (!lst.loose) {
      let loose = false;
      for (const t of item.tokens) if (t.type === T_SPACE && /\n.*\n/.test(t.raw)) { loose = true; break; }
      lst.loose = loose;
    }
  }
  for (const item of lst.items) {
    const first = item.tokens[0];
    if (item.task && first !== undefined && (first.type === T_TEXT || first.type === T_PARAGRAPH)) {
      item.text = item.text.replace(R_TASK_STRIP, '');
      first.raw = first.raw.replace(R_TASK_STRIP, '');
      first.text = first.text.replace(R_TASK_STRIP, '');
      for (let g = queue.length - 1; g >= 0; g--) {
        if (R_TASK.test(queue[g].src)) {
          queue[g].src = queue[g].src.replace(R_TASK_STRIP, '');
          break;
        }
      }
      const box = /\[[ xX]\]/.exec(item.raw);
      if (box) {
        const checked = box[0] !== '[ ]';
        if (lst.loose) first.checkbox = checked ? 2 : 1;
        else item.tokens.unshift({ type: T_CHECKBOX, checked });
      }
    }
  }
  if (lst.loose) {
    for (const item of lst.items) for (const t of item.tokens) if (t.type === T_TEXT) t.type = T_PARAGRAPH;
  }
  return lst;
}

/**
 * Whether `line` opens a block that ends a list item whose content sits at `cap`+1 columns:
 * a fence, ATX heading, HTML block start, hr, and (when `full`) a block quote or a new bullet.
 * Equivalent to marked's per-indent rules, testing a rule only when its first character fits.
 */
function endsItem(line, cap, full) {
  let sp = 0;
  while (sp < line.length && line.charCodeAt(sp) === 32) sp++;
  if (sp > cap) return false;
  const c = line.charCodeAt(sp);
  switch (c) {
    case 96: return line.startsWith('```', sp);
    case 126: return line.startsWith('~~~', sp);
    case 35: return R_ITEM_HEADING[cap].test(line);
    case 60: return R_ITEM_HTML[cap].test(line);
    case 62: return full;
    case 95: return R_ITEM_HR[cap].test(line);
    case 42: case 45: return (full && R_NEXT_BULLET[cap].test(line)) || R_ITEM_HR[cap].test(line);
    case 43: return full && R_NEXT_BULLET[cap].test(line);
    default: return full && c >= 48 && c <= 57 && R_NEXT_BULLET[cap].test(line);
  }
}

/** marked's leading-tab expansion of a line (tabs in its leading blanks become spaces). */
function expandLeading(s, col) {
  let i = 0;
  let tab = false;
  for (; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 9) tab = true;
    else if (c !== 32) break;
  }
  return tab ? expandTabs(s.slice(0, i), col) + s.slice(i) : s;
}

/** Index of the first character that is not a space, or -1. */
function firstNonSpace(s) {
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) !== 32) return i;
  return -1;
}

/** Columns of leading blanks counting a tab as 4 (marked's tab-to-4-spaces search), -1 if all blank. */
function tabbedIndent(s) {
  let col = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 32) col++;
    else if (c === 9) col += 4;
    else return col;
  }
  return -1;
}

/** !s.trim(): every character is JavaScript whitespace. */
function isBlank(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 32 || (c >= 9 && c <= 13)) continue;
    if (c < 0xa0) return false;
    if (c === 0xa0 || c === 0x1680 || (c >= 0x2000 && c <= 0x200a) || c === 0x2028 || c === 0x2029 || c === 0x202f || c === 0x205f || c === 0x3000 || c === 0xfeff) continue;
    return false;
  }
  return true;
}

function def(src) {
  const m = R_DEF.exec(src);
  if (!m) return null;
  if (!m[2].startsWith('<') && findClosing(m[2], '(', ')') !== -1) return null;
  const tag = normalizeLabel(m[1]);
  const href = m[2] ? m[2].replace(/^<(.*)>$/, '$1').replace(R_ANY_PUNCT, '$1') : '';
  const title = m[3] ? m[3].substring(1, m[3].length - 1).replace(R_ANY_PUNCT, '$1') : m[3];
  return { type: T_DEF, tag, raw: rtrim(m[0], '\n'), href, title };
}

function table(src) {
  const m = R_TABLE.exec(src);
  if (!m || !/[:|]/.test(m[2])) return null;
  const header = splitCells(m[1]);
  const aligns = m[2].replace(/^\||\| *$/g, '').split('|');
  const rows = m[3] && m[3].trim() ? m[3].replace(/\n[ \t]*$/, '').split('\n') : [];
  if (header.length !== aligns.length) return null;
  const tok = { type: T_TABLE, raw: rtrim(m[0], '\n'), align: [], header: [], rows: [] };
  for (const a of aligns) {
    if (/^ *-+: *$/.test(a)) tok.align.push('right');
    else if (/^ *:-+: *$/.test(a)) tok.align.push('center');
    else if (/^ *:-+ *$/.test(a)) tok.align.push('left');
    else tok.align.push(null);
  }
  for (let i = 0; i < header.length; i++) {
    const cell = { html: '' };
    queueInline(header[i], cell);
    tok.header.push(cell);
  }
  for (const row of rows) {
    const cells = splitCells(row, header.length).map((text) => {
      const cell = { html: '' };
      queueInline(text, cell);
      return cell;
    });
    tok.rows.push(cells);
  }
  return tok;
}

// ---------------------------------------------------------------------------------------
// Inline lexer: renders HTML (or, with `plain`, the alt text of images) directly
// ---------------------------------------------------------------------------------------

// The inline source being lexed, its emphasis mask (built on first use) and the last possible
// closer position of each delimiter in it (-2: not looked up yet).
let curSrc = '';
let curMask = null;
let curAst = -2, curUnd = -2, curDel = -2;

function getMask() {
  if (curMask === null) curMask = maskSource(curSrc);
  return curMask;
}

/** Start of the last run of `ch` (code `code`) in s whose preceding character is not [ \t\n\r\f]. */
function lastRunStart(s, ch, code) {
  let k = s.lastIndexOf(ch);
  while (k > 0) {
    let r = k;
    while (r > 0 && s.charCodeAt(r - 1) === code) r--;
    if (r === 0) return -1;
    const b = s.charCodeAt(r - 1);
    if (b !== 32 && b !== 9 && b !== 10 && b !== 13 && b !== 12) return r;
    k = s.lastIndexOf(ch, r - 1);
  }
  return -1;
}

function lastCloser(code) {
  const t = getMask();
  if (code === 42) return curAst === -2 ? (curAst = lastRunStart(t, '*', 42)) : curAst;
  if (code === 95) return curUnd === -2 ? (curUnd = lastRunStart(t, '_', 95)) : curUnd;
  return curDel === -2 ? (curDel = lastRunStart(t, '~', 126)) : curDel;
}

function linkInText(s) {
  if (!s.includes('[')) return false;
  for (const m of s.matchAll(R_BLOCK_SKIP)) {
    if (R_LINK.test(m[0]) && s.charAt(m.index - 1) !== '!') return true;
  }
  for (const m of s.matchAll(R_REFLINK_SEARCH)) {
    const t = m[0];
    const b = t.lastIndexOf('[');
    if (!(t.charAt(0) === '!' || !Object.hasOwn(links, normalizeLabel(t.slice(b + 1, -1)))) && !(b > 1 && linkInText(t.slice(1, b - 1)))) return true;
  }
  return false;
}

function maskRefs(r) {
  const o = r.lastIndexOf('[');
  if (!Object.hasOwn(links, normalizeLabel(r.slice(o + 1, -1)))) return r;
  if (o > 1 && r.charAt(0) !== '!') {
    const inner = r.slice(1, o - 1);
    if (linkInText(inner)) return '[' + inner.replace(R_REFLINK_SEARCH, maskRefs) + '][' + 'a'.repeat(r.length - o - 2) + ']';
  }
  return '[' + 'a'.repeat(r.length - 2) + ']';
}

function maskSource(src) {
  let t = src;
  const hasBracket = src.includes('[');
  const hasTick = src.includes('`');
  if (hasBracket) t = t.replace(R_REFLINK_SEARCH, maskRefs);
  // Each pass below only rewrites text holding its trigger characters.
  if (hasTick || t.includes('\\')) t = t.replace(R_ANY_PUNCT_OUTSIDE_CODE, (all, ticks, esc) => esc ? '+'.repeat(all.length) : ticks ? ticks + all.slice(ticks.length, -ticks.length).replace(/`/g, '+') + ticks : all);
  if (hasBracket || hasTick || t.includes('<')) t = t.replace(R_BLOCK_SKIP, (all) => '[' + 'a'.repeat(all.length - 2) + ']');
  return t;
}

/** Lex inline `src` (marked's inlineTokens) and return its HTML, or its plain text when `plain`. */
function inline(src, plain) {
  const savedParen = linkParenPossible;
  linkParenPossible = savedParen && src.includes(')');
  const sSrc = curSrc, sMask = curMask, sAst = curAst, sUnd = curUnd, sDel = curDel;
  curSrc = src;
  curMask = null;
  curAst = curUnd = curDel = -2;
  const out = lexInline(src, plain);
  curSrc = sSrc;
  curMask = sMask;
  curAst = sAst;
  curUnd = sUnd;
  curDel = sDel;
  linkParenPossible = savedParen;
  return out;
}

function lexInline(e, plain) {
  let out = '';
  let text = null; // pending text run (merged as marked merges adjacent text tokens)
  let textEsc = false;
  let keepPrev = false;
  let prevChar = '';
  let m, r;
  const flush = () => {
    if (text !== null) {
      out += plain || textEsc ? text : escapeHtml(text, false);
      text = null;
    }
  };
  while (e) {
    if (!keepPrev) prevChar = '';
    keepPrev = false;
    const c = e.charCodeAt(0);
    // escape
    if (c === 92 && (m = R_ESCAPE.exec(e))) {
      flush();
      out += plain ? m[1] : escapeHtml(m[1], false);
      e = e.substring(m[0].length);
      continue;
    }
    // tag
    if (c === 60 && (m = R_TAG.exec(e))) {
      const raw = m[0];
      if (!inLink && /^<a /i.test(raw)) inLink = true;
      else if (inLink && /^<\/a>/i.test(raw)) inLink = false;
      if (!inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(raw)) inRawBlock = true;
      else if (inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(raw)) inRawBlock = false;
      flush();
      out += raw;
      e = e.substring(raw.length);
      continue;
    }
    // link
    if ((c === 91 || (c === 33 && e.charCodeAt(1) === 91)) && (r = link(e, plain)) !== null) {
      flush();
      out += r.html;
      e = e.substring(r.raw.length);
      continue;
    }
    // reflink / nolink
    if ((c === 91 || (c === 33 && e.charCodeAt(1) === 91)) && (r = reflink(e, plain)) !== null) {
      e = e.substring(r.raw.length);
      if (r.html === null) {
        if (text === null) { text = r.raw; textEsc = false; } else text += r.raw;
      } else {
        flush();
        out += r.html;
      }
      continue;
    }
    // em / strong
    if ((c === 42 || c === 95) && (r = emStrong(e, prevChar, plain)) !== null) {
      flush();
      out += r.html;
      e = e.substring(r.raw.length);
      continue;
    }
    // code span
    if (c === 96 && (m = R_CODESPAN.exec(e))) {
      let t = m[2].replace(/\n/g, ' ');
      if (/[^ ]/.test(t) && t.startsWith(' ') && t.endsWith(' ')) t = t.substring(1, t.length - 1);
      flush();
      out += plain ? t : '<code>' + escapeHtml(t, true) + '</code>';
      e = e.substring(m[0].length);
      continue;
    }
    // br
    if ((c === 32 || c === 92) && (m = R_BR.exec(e))) {
      flush();
      if (!plain) out += '<br>';
      e = e.substring(m[0].length);
      continue;
    }
    // del
    if (c === 126 && (r = del(e, prevChar, plain)) !== null) {
      flush();
      out += r.html;
      e = e.substring(r.raw.length);
      continue;
    }
    // autolink
    if (c === 60 && (m = R_AUTOLINK.exec(e))) {
      const t = m[1];
      const href = m[2] === '@' ? 'mailto:' + t : t;
      flush();
      out += plain ? t : autolinkHtml(href, t);
      e = e.substring(m[0].length);
      continue;
    }
    // url (gfm)
    if (!inLink && URL_START[c] === 1 && (m = R_URL.exec(e))) {
      let raw, href;
      if (m[2] === '@') {
        raw = m[0];
        href = 'mailto:' + raw;
      } else {
        let prev;
        raw = m[0];
        do {
          prev = raw;
          const b = R_BACKPEDAL.exec(raw);
          raw = b ? b[0] : '';
        } while (prev !== raw);
        href = m[1] === 'www.' ? 'http://' + raw : raw;
      }
      flush();
      out += plain ? raw : autolinkHtml(href, raw);
      e = e.substring(raw.length);
      continue;
    }
    // text
    {
      const raw = R_INLINE_TEXT.exec(e)[0];
      const len = raw.length;
      e = e.substring(len);
      if (raw.charCodeAt(len - 1) !== 95) prevChar = raw[len - 1];
      keepPrev = true;
      const t = inRawBlock || raw.indexOf('&#') < 0 ? raw : decodeNumericRefs(raw);
      if (text === null) { text = t; textEsc = inRawBlock; } else text += t;
    }
  }
  flush();
  return out;
}

// First characters a gfm url / email autolink can start with: [A-Za-z0-9._+-].
const URL_START = new Uint8Array(128);
for (const ch of 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._+-') URL_START[ch.charCodeAt(0)] = 1;

function autolinkHtml(href, text) {
  const t = escapeHtml(text, true);
  const h = cleanUrl(href);
  if (h === null) return t;
  return '<a href="' + escapeHtml(h, true) + '">' + t + '</a>';
}

/** marked's "link in label" guard: a tag or autolink in the label that runs past it. */
function labelBreaks(e, label, offset) {
  if (!label.includes('<')) return false;
  for (let s = 0; s < label.length; s++) {
    const c = label[s];
    if (c === '\\') { s++; continue; }
    if (c === '`') {
      const cm = R_CODESPAN.exec(label.slice(s));
      if (cm) { s += cm[0].length - 1; continue; }
    }
    if (c !== '<') continue;
    const rest = e.slice(offset + s);
    const o = R_TAG.exec(rest) || R_AUTOLINK.exec(rest);
    if (o) {
      if (o[0].length > label.length - s) return true;
      s += o[0].length - 1;
    }
  }
  return false;
}

/** Build a link/image from a match (marked's outputLink); null when the link must not form. */
function outputLink(label, raw, href, title, plain) {
  const text = label.replace(/\\([\[\]])/g, '$1');
  const isImage = raw.charAt(0) === '!';
  const savedInLink = inLink, savedEmitted = linkEmitted, savedRaw = inRawBlock;
  inLink = true;
  linkEmitted = false;
  const inner = inline(text, plain || isImage);
  const emitted = linkEmitted;
  linkEmitted = savedEmitted;
  inLink = savedInLink;
  if (!isImage) {
    if (emitted) {
      inRawBlock = savedRaw;
      return null;
    }
    linkEmitted = true;
  }
  let html;
  if (plain) html = inner;
  else if (isImage) {
    const h = cleanUrl(href);
    if (h === null) html = escapeHtml(inner, false);
    else {
      html = `<img src="${escapeHtml(h, false)}" alt="${escapeHtml(inner, false)}"`;
      if (title) html += ` title="${escapeHtml(title, false)}"`;
      html += '>';
    }
  } else {
    const h = cleanUrl(href);
    if (h === null) html = inner;
    else {
      html = '<a href="' + escapeHtml(h, false) + '"';
      if (title) html += ' title="' + escapeHtml(title, false) + '"';
      html += '>' + inner + '</a>';
    }
  }
  return { raw, html };
}

function link(e, plain) {
  if (linkParenPossible === false) return null;
  const m = R_LINK.exec(e);
  if (!m) return null;
  let raw = m[0];
  let href = m[2];
  let title = m[3];
  const offset = raw.charAt(0) === '!' ? 2 : 1;
  if (labelBreaks(e, m[1], offset)) return null;
  const trimmed = href.trim();
  if (trimmed.startsWith('<')) {
    if (!trimmed.endsWith('>')) return null;
    const l = rtrim(trimmed.slice(0, -1), '\\');
    if ((trimmed.length - l.length) % 2 === 0) return null;
  } else {
    const l = findClosing(href, '(', ')');
    if (l === -2) return null;
    if (l > -1) {
      const len = (raw.indexOf('!') === 0 ? 5 : 4) + m[1].length + l;
      href = href.substring(0, l);
      raw = raw.substring(0, len).trim();
      title = '';
    }
  }
  const r = rtrim(raw.slice(0, -1), '\\');
  if ((raw.length - r.length) % 2 === 0) return null;
  title = title ? title.slice(1, -1) : '';
  href = href.trim();
  if (href.startsWith('<')) href = href.slice(1, -1);
  return outputLink(m[1], raw, href && href.replace(R_ANY_PUNCT, '$1'), (title && title.replace(R_ANY_PUNCT, '$1')) || null, plain);
}

/** Returns null (no match), {raw, html:null} for a bare text bracket, or {raw, html}. */
function reflink(e, plain) {
  const m = R_REFLINK.exec(e) || R_NOLINK.exec(e);
  if (!m) return null;
  if (labelBreaks(e, m[1], m[0].charAt(0) === '!' ? 2 : 1)) return null;
  const ref = links[normalizeLabel(m[2] || m[1])];
  if (!ref) return { raw: m[0].charAt(0), html: null };
  return outputLink(m[1], m[0], ref.href, ref.title || null, plain);
}

function emStrong(e, prevChar, plain) {
  let s = R_EMSTRONG_L.exec(e);
  if (!s || (!s[1] && !s[2] && !s[3] && !s[4])) return null;
  let t = getMask();
  const ch = s[0][0];
  const sameAsPrev = prevChar === ch;
  const i = t.length - e.length;
  let l = i;
  while (l > 0 && t[l - 1] === ch) l--;
  const p = lastCodePoint(t.slice(Math.max(0, l - 2), l));
  const pPunct = p === '*' || p === '_' || !!R_PUNCTUATION.exec(p);
  if (l < i) prevChar = p;
  const u = l < i ? pPunct : !!R_PUNCTUATION.exec(prevChar);
  if (s[4] && R_UNICODE_ALNUM.test(prevChar)) return null;
  const d = s[1] || s[3] || '';
  if (d && prevChar && !u) return null;
  const k = cpLength(s[0]) - 1;
  let m = k;
  let f = 0;
  const y = i - l + k;
  const R = !!p.trim() && (!!d || (ch === '*' && !pPunct));
  if (ch !== '*' && ch !== '_') return null;
  const A = ch === '*' ? R_EMSTRONG_R_AST : R_EMSTRONG_R_UND;
  const v = lastCloser(ch === '*' ? 42 : 95);
  const Q = t.length - e.length + k;
  if (v < Q) return null;
  t = t.slice(-1 * e.length + k);
  const ee = v - Q;
  A.lastIndex = 0;
  while ((s = A.exec(t)) !== null && !(s.index > ee)) {
    const g = s[1] || s[2] || s[3] || s[4] || s[5] || s[6];
    if (!g) continue;
    let b = cpLength(g);
    if (s[3] || s[4]) { m += b; continue; }
    else if (s[5] || s[6] || R) {
      if (sameAsPrev && (s[5] || s[6])) break;
      if (y % 3 && !((y + b) % 3)) { f += b; continue; }
    }
    m -= b;
    if (m > 0) continue;
    b = Math.min(b, b + m + f);
    const te = firstCpLength(s[0]);
    const raw = e.slice(0, k + s.index + te + b);
    if (Math.min(k, b) % 2) {
      const inner = inline(raw.slice(1, -1), plain);
      return { raw, html: plain ? inner : '<em>' + inner + '</em>' };
    }
    const inner = inline(raw.slice(2, -2), plain);
    return { raw, html: plain ? inner : '<strong>' + inner + '</strong>' };
  }
  return null;
}

function del(e, prevChar, plain) {
  let s = R_DEL_L.exec(e);
  if (!s) return null;
  if (s[1] && prevChar && !R_PUNCTUATION.exec(prevChar)) return null;
  let t = getMask();
  const o = cpLength(s[0]) - 1;
  let p = o;
  const u = lastCloser(126);
  const d = t.length - e.length + o;
  if (u < d) return null;
  t = t.slice(-1 * e.length + o);
  const k = u - d;
  R_DEL_R.lastIndex = 0;
  while ((s = R_DEL_R.exec(t)) !== null && !(s.index > k)) {
    const g = s[1] || s[2] || s[3] || s[4] || s[5] || s[6];
    if (!g) continue;
    let l = cpLength(g);
    if (l !== o) continue;
    if (s[3] || s[4]) { p += l; continue; }
    p -= l;
    if (p > 0) continue;
    l = Math.min(l, l + p);
    const te = firstCpLength(s[0]);
    const raw = e.slice(0, o + s.index + te + l);
    const inner = inline(raw.slice(o, -o), plain);
    return { raw, html: plain ? inner : '<del>' + inner + '</del>' };
  }
  return null;
}

// ---------------------------------------------------------------------------------------
// Block renderer
// ---------------------------------------------------------------------------------------

const CHECKBOX_ON = '<input checked="" disabled="" type="checkbox"> ';
const CHECKBOX_OFF = '<input disabled="" type="checkbox"> ';

function render(tokens) {
  let out = '';
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    switch (t.type) {
      case T_SPACE:
      case T_DEF:
        break;
      case T_HR:
        out += '<hr>\n';
        break;
      case T_HEADING:
        out += `<h${t.depth}>${t.html}</h${t.depth}>\n`;
        break;
      case T_CODE: {
        const lang = t.lang ? /^\S*/.exec(t.lang)[0] : '';
        const body = t.text ? escapeHtml(t.text.replace(/\n$/, '') + '\n', true) : '';
        out += lang ? '<pre><code class="language-' + escapeHtml(lang, false) + '">' + body + '</code></pre>\n' : '<pre><code>' + body + '</code></pre>\n';
        break;
      }
      case T_TABLE: {
        let row = '';
        for (let c = 0; c < t.header.length; c++) row += cell(t.header[c].html, 'th', t.align[c]);
        let body = '';
        for (const r of t.rows) {
          let cells = '';
          for (let c = 0; c < r.length; c++) cells += cell(r[c].html, 'td', t.align[c]);
          body += '<tr>\n' + cells + '</tr>\n';
        }
        out += '<table>\n<thead>\n<tr>\n' + row + '</tr>\n</thead>\n' + (body ? '<tbody>' + body + '</tbody>' : '') + '</table>\n';
        break;
      }
      case T_BLOCKQUOTE:
        out += '<blockquote>\n' + render(t.tokens) + '</blockquote>\n';
        break;
      case T_LIST: {
        const tag = t.ordered ? 'ol' : 'ul';
        out += '<' + tag + (t.ordered && t.start !== 1 ? ' start="' + t.start + '"' : '') + '>\n';
        for (const item of t.items) out += '<li>' + render(item.tokens) + '</li>\n';
        out += '</' + tag + '>\n';
        break;
      }
      case T_CHECKBOX:
        out += t.checked ? CHECKBOX_ON : CHECKBOX_OFF;
        break;
      case T_HTML:
        out += t.text;
        break;
      case T_PARAGRAPH:
        out += '<p>' + (t.checkbox ? (t.checkbox === 2 ? CHECKBOX_ON : CHECKBOX_OFF) : '') + t.html + '</p>\n';
        break;
      case T_TEXT:
        out += (t.checkbox ? (t.checkbox === 2 ? CHECKBOX_ON : CHECKBOX_OFF) : '') + t.html;
        break;
    }
  }
  return out;
}

function cell(html, tag, align) {
  return (align ? `<${tag} align="${align}">` : `<${tag}>`) + html + `</${tag}>\n`;
}

// ---------------------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------------------

/** The HTML marked 18.1.3 renders for `markdown` with its default options. */
export function parse(markdown) {
  links = Object.create(null);
  queue = [];
  top = true;
  inLink = false;
  inRawBlock = false;
  linkEmitted = false;
  linkParenPossible = true;
  const tokens = blockTokens(markdown.replace(/\r\n|\r/g, '\n'), [], false);
  for (let i = 0; i < queue.length; i++) {
    const job = queue[i];
    inRawBlock = false;
    job.tok.html = inline(job.src, false);
  }
  queue = null;
  links = null;
  return render(tokens);
}
