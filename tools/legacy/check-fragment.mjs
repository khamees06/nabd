// Checks that a line range of a legacy script is a syntactically complete unit, so it can become
// a source fragment of a client bundle. The fragment is compiled with V8 (node:vm), never run.
//
// Usage: node tools/legacy/check-fragment.mjs <file> <fromLine> <toLine> [--iife]
//   --iife   the file's code sits inside one function wrapper (er.js, resp.js, ui.js, motion.js, terms.js);
//            the fragment is compiled inside a function body, as it is in the bundle.
// Several ranges can be checked in one call: <file> 10-80 81-200 201-340 [--iife]
// Exit code 0 when every range compiles, 1 otherwise.
import fs from 'node:fs';
import vm from 'node:vm';

const args = process.argv.slice(2);
const iife = args.includes('--iife');
const rest = args.filter(a => a !== '--iife');
const file = rest.shift();
if (!file || !rest.length) {
  console.error('usage: node check-fragment.mjs <file> <from> <to> [--iife]   or   <file> 10-80 81-200 ... [--iife]');
  process.exit(2);
}
const lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
const ranges = rest.length === 2 && !rest[0].includes('-') ? [[+rest[0], +rest[1]]] : rest.map(r => r.split('-').map(Number));

let bad = 0;
for (const [from, to] of ranges) {
  const text = lines.slice(from - 1, to).join('\n');
  const source = iife ? `(function () {\n'use strict';\n${text}\n})` : text;
  try {
    new vm.Script(source, { filename: `${file}:${from}-${to}` });
    console.log(`ok   ${from}-${to}  (${to - from + 1} lines, ${Buffer.byteLength(text)} bytes)`);
  } catch (e) {
    bad++;
    console.log(`BAD  ${from}-${to}  ${e.message}`);
  }
}
process.exit(bad ? 1 : 0);
