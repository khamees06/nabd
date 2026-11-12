// Cuts the V6.2 landing prototype's markup into the pieces that become Razor partial views, with the same
// class renaming as convert-css.mjs ("hero" -> "nl-hero") and the embedded images replaced by the files
// under wwwroot/img/landing/. The output is a starting point: the partials were then integrated by hand
// (IDs the legacy client needs, the existing sign-in flow, honest wording) — see docs/ui-integration-map.md.
//
// usage: node tools/migration/landing-v6/convert-markup.mjs <stripped-prototype.html> <out-folder>
//   <stripped-prototype.html> = the prototype with each data:image URI replaced by IMG(<extracted file name>)
import fs from 'node:fs';
import path from 'node:path';

const [, , input, outDir] = process.argv;
const html = fs.readFileSync(input, 'utf8');
const IMAGES = {
  'img-01-4a13ae8e89f8.jpg': ['hero-clinical-team.webp', 790, 349],
  'img-02-4bfed48dfaf5.jpg': ['specialty-emergency.webp', 519, 336],
  'img-03-060bba4958aa.jpg': ['specialty-cardiology.webp', 516, 336],
  'img-04-b97e474d3ada.jpg': ['specialty-respiratory.webp', 522, 336],
  'img-05-2fbb2c0479ef.jpg': ['specialty-critical-care.webp', 519, 336],
  'img-06-7d651ce08819.jpg': ['institutions-campus.webp', 335, 220],
  'img-07-63823e8d08dc.jpg': ['cta-stethoscope.webp', 426, 103],
};
const rename = s => s
  .replace(/class="([^"]*)"/g, (m, v) => `class="${v.split(/\s+/).filter(Boolean).map(c => 'nl-' + c).join(' ')}"`)
  .replace(/<img([^>]*?)src="IMG\(([^)]+)\)"/g, (m, attrs, f) => { const [name, w, h] = IMAGES[f]; return `<img${attrs}src="img/landing/${name}" width="${w}" height="${h}"`; })
  .replace(/url\(IMG\(([^)]+)\)\)/g, (m, f) => `url(img/landing/${IMAGES[f][0]})`)
  .replace(/viewbox=/g, 'viewBox=');
const cut = (from, to) => { const a = html.indexOf(from); const b = html.indexOf(to, a); if (a < 0 || b < 0) throw new Error('marker not found: ' + from); return html.slice(a, b + to.length); };
const pieces = {
  'header.html': cut('<a class="skip-link"', '</header>'),
  'hero.html': cut('<section aria-labelledby="heroTitle"', '</section>'),
  'value-strip.html': cut('<section aria-label="ملامح المنصة"', '</section>'),
  'overview.html': html.slice(html.indexOf('<section aria-label="مجالات وتجربة المحاكاة"'), html.indexOf('<section aria-labelledby="methodTitle"')),
  'method.html': cut('<section aria-labelledby="methodTitle"', '</section>'),
  'about.html': cut('<section aria-labelledby="aboutTitle"', '</section>'),
  'institutions.html': cut('<section aria-label="نبض والمؤسسات التعليمية', '</div></div></div></section>'),
  'final-cta.html': cut('<section aria-label="ابدأ مع نبض"', '</section>'),
  'footer.html': cut('<footer class="site-footer"', '</footer>'),
  'modal.html': cut('<div aria-hidden="true" class="modal-backdrop"', '</section>\n</div>'),
};
fs.mkdirSync(outDir, { recursive: true });
for (const [name, text] of Object.entries(pieces)) {
  fs.writeFileSync(path.join(outDir, name), rename(text));
  console.log(name.padEnd(18), text.length, 'chars', (text.match(/@/g) || []).length, '@');
}
