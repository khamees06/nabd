import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {
  decodePng, encodePng, clampRect, fractionRect, luma709, lumaStats, hueSat, isSkinPixel, skinHueTerciles,
  lumaDifference, pixelDiff, patchLuma,
} from './browser/render-metrics.mjs';

function image(width, height, fill) {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data.set([...fill(x, y), 255], (y * width + x) * 4);
  return { width, height, data };
}

// A hand-built RGB (colour type 2) PNG whose rows use filters 0–4, as browsers and libpng choose per row.
function filteredRgbPng(img) {
  const { width, height } = img;
  const rgb = (x, y) => (x < 0 || y < 0 ? [0, 0, 0] : [...img.data.subarray((y * width + x) * 4, (y * width + x) * 4 + 3)]);
  const rows = [];
  for (let y = 0; y < height; y++) {
    const filter = y % 5;
    const row = [filter];
    for (let x = 0; x < width; x++) {
      const cur = rgb(x, y), left = rgb(x - 1, y), up = rgb(x, y - 1), ul = rgb(x - 1, y - 1);
      for (let c = 0; c < 3; c++) {
        const a = left[c], b = up[c], d = ul[c];
        const p = a + b - d, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - d);
        const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : d][filter];
        row.push((cur[c] - pred) & 0xff);
      }
    }
    rows.push(...row);
  }
  const reference = encodePng(img); // reuse its signature and chunk framing, then swap IHDR and IDAT
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  const chunk = (type, body) => {
    const head = Buffer.alloc(8); head.writeUInt32BE(body.length, 0); head.write(type, 4, 'latin1');
    return Buffer.concat([head, body, Buffer.alloc(4)]); // the decoder does not check CRCs
  };
  return Buffer.concat([reference.subarray(0, 8), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.from(rows))), chunk('IEND', Buffer.alloc(0))]);
}

test('PNG decode: RGBA round trip, RGB with every row filter, and refusals', () => {
  const img = image(7, 6, (x, y) => [(x * 37 + y * 11) & 255, (x * 5 + y * 71) & 255, (x * y * 13 + 200) & 255]);
  const rgba = decodePng(encodePng(img));
  assert.equal(rgba.width, 7);
  assert.equal(rgba.height, 6);
  assert.deepEqual(rgba.data, img.data);
  const rgb = decodePng(filteredRgbPng(img));
  assert.deepEqual(rgb.data, img.data, 'filters None, Sub, Up, Average and Paeth');
  assert.throws(() => decodePng(Buffer.from('not a png at all')), /not a PNG/);
  const sixteenBit = encodePng(img);
  sixteenBit[8 + 8 + 8] = 16; // IHDR bit depth
  assert.throws(() => decodePng(sixteenBit), /unsupported PNG/);
});

test('regions clamp to the image and fractions map onto a box', () => {
  const img = image(10, 8, () => [0, 0, 0]);
  assert.deepEqual(clampRect(img, [-3, 2.4, 12, 9]), [0, 2, 10, 8]);
  assert.deepEqual(fractionRect({ left: 10, top: 20, width: 100, height: 50 }, [0.1, 0.2, 0.5, 1]), [20, 30, 60, 70]);
});

test('luma statistics: Rec. 709 mean, standard deviation and clipped share', () => {
  assert.equal(Number(luma709(255, 255, 255).toFixed(6)), 255);
  assert.equal(Number(luma709(255, 0, 0).toFixed(4)), 54.213);
  // Left half black, right half white: mean 127.5, sd 127.5, half clipped.
  const img = image(4, 2, (x) => (x < 2 ? [0, 0, 0] : [255, 255, 255]));
  assert.deepEqual(lumaStats(img, [0, 0, 4, 2]), { pixels: 8, meanLuma: 127.5, sdLuma: 127.5, clippedPct: 50 });
  assert.deepEqual(lumaStats(img, [0, 0, 2, 2]), { pixels: 4, meanLuma: 0, sdLuma: 0, clippedPct: 0 });
  assert.equal(lumaStats(img, [5, 5, 6, 6]).pixels, 0, 'empty region');
});

test('hue and the skin filter', () => {
  assert.deepEqual(hueSat(255, 0, 0), { hue: 0, sat: 1 });
  assert.equal(Number(hueSat(255, 128, 0).hue.toFixed(2)), 30.12);
  assert.equal(hueSat(120, 120, 120).hue, null);
  assert.equal(Number(hueSat(255, 0, 64).hue.toFixed(1)), 344.9);
  assert.equal(isSkinPixel(224, 172, 140), true, 'lit skin');
  assert.equal(isSkinPixel(96, 60, 46), true, 'shaded skin');
  assert.equal(isSkinPixel(46, 120, 118), false, 'teal pad');
  assert.equal(isSkinPixel(235, 235, 232), false, 'white drape');
  assert.equal(isSkinPixel(255, 250, 248), false, 'clipped');
});

// Skin colour from a hue and a value, saturation fixed: HSV → sRGB bytes.
function skin(hueDeg, value, sat = 0.38) {
  const c = value * sat, h = ((hueDeg % 360) + 360) % 360 / 60, x = c * (1 - Math.abs((h % 2) - 1)), m = value - c;
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h) % 6];
  return [r + m, g + m, b + m].map((v) => Math.round(v * 255));
}

test('skin hue by luma tercile: no spread for one hue, the designed spread for a drifting hue', () => {
  // 30 columns from dark to light; one hue everywhere.
  const flat = image(30, 4, (x) => skin(22, 0.3 + 0.6 * x / 29));
  const a = skinHueTerciles(flat, [0, 0, 30, 4]);
  assert.equal(a.skinPixels, 120);
  assert.equal(a.skinSharePct, 100);
  assert.ok(a.spreadDeg < 1, `spread ${a.spreadDeg}`);
  assert.ok(Math.abs(a.meanHueDeg - 22) < 1);
  assert.deepEqual(a.terciles.map((t) => t.pixels), [40, 40, 40]);
  assert.ok(a.terciles[0].meanLuma < a.terciles[1].meanLuma && a.terciles[1].meanLuma < a.terciles[2].meanLuma);
  // Hue 18° in shade rising to 26° in the light (ACES-like drift): the tercile means differ by about 5.3°.
  const drift = image(30, 4, (x) => skin(18 + 8 * x / 29, 0.3 + 0.6 * x / 29));
  const b = skinHueTerciles(drift, [0, 0, 30, 4]);
  assert.ok(b.spreadDeg > 4.5 && b.spreadDeg < 6.5, `spread ${b.spreadDeg}`);
  // Non-skin pixels are ignored, and a hue just below 0° averages as −3°, not 357°.
  const mixed = image(10, 2, (x) => (x < 5 ? [46, 120, 118] : skin(-3, 0.7)));
  const c = skinHueTerciles(mixed, [0, 0, 10, 2]);
  assert.equal(c.skinPixels, 10);
  assert.ok(Math.abs(c.meanHueDeg + 3) < 1, `mean hue ${c.meanHueDeg}`);
  assert.equal(skinHueTerciles(image(3, 1, () => [0, 128, 128]), [0, 0, 3, 1]).spreadDeg, null);
});

test('luma difference (shimmer) and exact pixel diff', () => {
  const a = image(8, 8, (x, y) => [x * 20, y * 20, 40]);
  const same = lumaDifference(a, a, [0, 0, 8, 8]);
  assert.deepEqual([same.pixels, same.meanAbs, same.max, same.over4Pct], [64, 0, 0, 0]);
  // b is a shifted one column to the left: each pixel differs by one column step of red (20 × 0.2126).
  const b = image(8, 8, (x, y) => [Math.min(7, x + 1) * 20, y * 20, 40]);
  const shift = lumaDifference(a, b, [0, 0, 7, 8]);
  assert.equal(shift.meanAbs, 4.252);
  assert.equal(shift.over4Pct, 100);

  assert.equal(pixelDiff(a, a).differing, 0);
  const c = image(8, 8, (x, y) => (x === 3 && y === 5 ? [x * 20 + 9, y * 20, 40] : [x * 20, y * 20, 40]));
  const d = pixelDiff(a, c);
  assert.deepEqual([d.pixels, d.differing, d.maxChannelDelta, d.meanDeltaOfDiffering], [64, 1, 9, 9]);
  assert.deepEqual(d.differingBox, [3, 5, 4, 6]);
  const masked = pixelDiff(a, c, [0, 0, 8, 8], [[3, 5, 4, 6]]);
  assert.deepEqual([masked.pixels, masked.differing], [63, 0]);
  assert.throws(() => pixelDiff(a, image(4, 4, () => [0, 0, 0])), /differ in size/);
});

test('patch luma centres a square on each screen point and skips missing points', () => {
  const img = image(20, 20, (x) => (x < 10 ? [0, 0, 0] : [200, 200, 200]));
  const out = patchLuma(img, { dark: { x: 4, y: 10 }, light: { x: 15, y: 10 }, offscreen: null }, 2);
  assert.equal(out.dark.meanLuma, 0);
  assert.equal(out.dark.pixels, 25);
  assert.equal(out.light.meanLuma, 200);
  assert.equal(out.offscreen, null);
});
