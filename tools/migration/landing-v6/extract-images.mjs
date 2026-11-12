// Takes the images embedded in the prototype as data: URIs out of it: writes each distinct image once
// (img-NN-<sha256 prefix>.<ext>) and a copy of the prototype where each URI is replaced by IMG(<file name>),
// which is what convert-css.mjs and convert-markup.mjs read. The seven photos were then saved as WebP at the same
// pixel size under src/Nabd.Web/wwwroot/img/landing/ (names in convert-markup.mjs, credits in CREDITS.md there).
//
// usage: node tools/migration/landing-v6/extract-images.mjs <prototype.html> <image-folder> <stripped.html>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [, , input, imageDir, output] = process.argv;
if (!input || !imageDir || !output) { console.error('usage: extract-images.mjs <prototype.html> <image-folder> <stripped.html>'); process.exit(2); }
fs.mkdirSync(imageDir, { recursive: true });
const seen = new Map();
const text = fs.readFileSync(input, 'utf8').replace(/data:image\/(jpeg|png|webp|svg\+xml);base64,([A-Za-z0-9+/=]+)/g, (m, type, b64) => {
  const bytes = Buffer.from(b64, 'base64');
  const sha = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  if (!seen.has(sha)) {
    const name = `img-${String(seen.size + 1).padStart(2, '0')}-${sha}.${type === 'jpeg' ? 'jpg' : type.replace('+xml', '')}`;
    fs.writeFileSync(path.join(imageDir, name), bytes);
    seen.set(sha, name);
  }
  return `IMG(${seen.get(sha)})`;
});
fs.writeFileSync(output, text);
console.log(`images: ${seen.size}; stripped page: ${text.length} characters`);
