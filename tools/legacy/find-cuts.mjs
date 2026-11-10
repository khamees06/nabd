// Lists the lines of a legacy script where the file can be cut into syntactically complete fragments.
// A cut before line N is clean when lines [start, N-1] compile on their own; the scan walks forward and
// only keeps cuts whose preceding fragment compiles, so every listed cut is a top-level statement boundary.
//
// Usage: node tools/legacy/find-cuts.mjs <file> [--iife] [--from N] [--to M] [--min 1]
//   --iife        the code sits inside one function wrapper; give --from/--to the first and last line INSIDE the wrapper
//   --min <n>     smallest fragment worth reporting, in lines (default 1)
// Output: one line per clean cut: "<line> <bytes since previous cut> <first 90 chars of the line>".
import fs from 'node:fs';
import vm from 'node:vm';

const argv = process.argv.slice(2);
const opt = (name, d) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : d; };
const iife = argv.includes('--iife');
const file = argv[0];
const lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
const from = Number(opt('from', 1)), to = Number(opt('to', lines.length)), min = Number(opt('min', 1));

const compiles = text => {
  try { new vm.Script(iife ? `(function () {\n'use strict';\n${text}\n})` : text); return true; } catch { return false; }
};

// A fragment that holds only comments and blank lines is not worth a cut: a comment belongs to the code after it.
const hasCode = text => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').trim().length > 0;

let start = from;
for (let n = from + 1; n <= to + 1; n++) {
  // Only try a cut where a new statement or its leading comment can start: not a blank line, not a continuation.
  const line = lines[n - 1] ?? '';
  const startsComment = /^\s*\/[/*]/.test(line);
  if (n <= to && (!line.trim() || (!startsComment && /^\s*[)\]}.,:?&|+\-*/]/.test(line)))) continue;
  const text = lines.slice(start - 1, n - 1).join('\n');
  if (n - start < min || !hasCode(text) || !compiles(text)) continue;
  console.log(`${n <= to ? n : 'END'} ${Buffer.byteLength(text)} ${line.slice(0, 90)}`);
  start = n;
}
