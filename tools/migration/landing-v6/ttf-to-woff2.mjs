// Packs a TrueType font into WOFF2 with the null transform (tables stored as they are, compressed together
// with Brotli), using only Node's built-in zlib. The glyph outlines and every table are byte-for-byte the
// original's, so the font renders exactly as the .ttf does; only the container changes.
// Spec: W3C WOFF File Format 2.0 (header, table directory with UIntBase128 lengths, one Brotli stream).
//
// usage: node tools/migration/landing-v6/ttf-to-woff2.mjs <in.ttf> <out.woff2>
import fs from 'node:fs';
import zlib from 'node:zlib';

const [, , input, output] = process.argv;
const ttf = fs.readFileSync(input);
const flavor = ttf.readUInt32BE(0);
const numTables = ttf.readUInt16BE(4);
const KNOWN = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];

const tables = [];
for (let i = 0; i < numTables; i++) {
  const at = 12 + 16 * i;
  tables.push({ tag: ttf.toString('latin1', at, at + 4), offset: ttf.readUInt32BE(at + 8), length: ttf.readUInt32BE(at + 12) });
}
tables.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));

const base128 = n => { // UIntBase128: big-endian groups of 7 bits, high bit set on all but the last byte
  const bytes = []; do { bytes.unshift(n & 0x7f); n = Math.floor(n / 128); } while (n > 0);
  return Buffer.from(bytes.map((b, i) => (i < bytes.length - 1 ? b | 0x80 : b)));
};

const dir = [];
for (const t of tables) {
  const index = KNOWN.indexOf(t.tag);
  // Transform version: glyf and loca use 3 for "null transform"; every other table uses 0.
  const version = t.tag === 'glyf' || t.tag === 'loca' ? 3 : 0;
  const flags = Buffer.from([(index >= 0 ? index : 63) | (version << 6)]);
  dir.push(flags);
  if (index < 0) dir.push(Buffer.from(t.tag, 'latin1'));
  dir.push(base128(t.length)); // no transformLength: no table is transformed
}
const directory = Buffer.concat(dir);
const data = Buffer.concat(tables.map(t => ttf.subarray(t.offset, t.offset + t.length)));
const compressed = zlib.brotliCompressSync(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_FONT, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length } });

const pad4 = n => (n + 3) & ~3;
const totalSfntSize = 12 + 16 * numTables + tables.reduce((s, t) => s + pad4(t.length), 0);
const headerSize = 48;
const length = pad4(headerSize + directory.length + compressed.length);
const header = Buffer.alloc(headerSize);
header.write('wOF2', 0, 'latin1');
header.writeUInt32BE(flavor, 4);
header.writeUInt32BE(length, 8);
header.writeUInt16BE(numTables, 12);
header.writeUInt16BE(0, 14);
header.writeUInt32BE(totalSfntSize, 16);
header.writeUInt32BE(compressed.length, 20);
header.writeUInt16BE(1, 24); // major version of the font data: arbitrary, kept at 1.0
header.writeUInt16BE(0, 26);
// metadata and private blocks: none (offsets and lengths stay 0)
const out = Buffer.alloc(length);
header.copy(out, 0);
directory.copy(out, headerSize);
compressed.copy(out, headerSize + directory.length);
fs.writeFileSync(output, out);
console.log(`${input} -> ${output}: ${ttf.length} -> ${out.length} bytes, ${numTables} tables`);
