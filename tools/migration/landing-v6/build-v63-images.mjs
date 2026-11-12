// Builds the images added by the V6.3 refinement of the landing (src/Nabd.Web/wwwroot/img/landing/v63/), from
//   - screenshots of a real session of the ER room, taken with capture-er-session.js (see its header):
//       laptop-chat-tall.png  1280x864 at scale 2, __STOP='chat' (the room's 800 px below the 64 px app bar)
//       m-briefing.png, m-talk.png, m-workup.png, m-report.png  390x844 at scale 2, __STOP=<moment>
//   - photos the application already ships, with their licences in wwwroot/img/CREDITS.txt.
// Crops are fixed here so that the result can be rebuilt and reviewed. Credits: img/landing/v63/CREDITS.md.
// Needs the sharp package (npm install -g sharp); not a dependency of the application.
//
// usage: node tools/migration/landing-v6/build-v63-images.mjs <folder with the screenshots>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const shots = path.resolve(process.argv[2] || '.work/v63');
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch { sharp = require(path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'sharp')); }
const img = path.join(REPO, 'src', 'Nabd.Web', 'wwwroot', 'img');
const out = path.join(img, 'landing', 'v63');
fs.mkdirSync(out, { recursive: true });

const JOBS = [
  // The laptop screen: the room at 1280x800 mid-session, without the application's top bar.
  { name: 'showcase-er-room.webp', from: path.join(shots, 'laptop-chat-tall.png'), crop: [0, 128, 2560, 1600], resize: [1280, 800] },
  // The four steps of «كيف تعمل نبض؟», 4:3, from the phone captures (2x pixels).
  { name: 'step-1-briefing.webp', from: path.join(shots, 'm-briefing.png'), crop: [26, 150, 728, 546], resize: [640, 480] },
  { name: 'step-2-talk.webp', from: path.join(shots, 'm-talk.png'), crop: [0, 880, 780, 585], resize: [640, 480] },
  { name: 'step-3-workup.webp', from: path.join(shots, 'm-workup.png'), crop: [0, 745, 780, 585], resize: [640, 480] },
  { name: 'step-4-report.webp', from: path.join(shots, 'm-report.png'), crop: [0, 150, 760, 570], resize: [640, 480] },
  // Partnership section: Jordan University of Science and Technology, Irbid (CC0, uploaded by its photographer),
  // 16:10. The Jordan University Hospital photo used first was dropped: its Commons page shows it was copied from
  // the hospital's website, so its CC BY-SA tag rests on the uploader's word only.
  { name: 'campus-just.webp', from: path.join(img, 'v9', 'aud-uni.jpg'), crop: [0, 20, 640, 400] },
  // «لماذا صممنا نبض؟»: three licensed photos, 16:10.
  { name: 'why-critical-cases.webp', from: path.join(img, 'nc', 'sepsis.jpg'), cover: [640, 400] },
  { name: 'why-safe-practice.webp', from: path.join(img, 'v9', 'solution2.jpg'), cover: [640, 400] },
  { name: 'why-feedback.webp', from: path.join(img, 'or', 'checklist.jpg'), cover: [640, 400] },
];

for (const j of JOBS) {
  let p = sharp(j.from);
  if (j.crop) p = p.extract({ left: j.crop[0], top: j.crop[1], width: j.crop[2], height: j.crop[3] });
  if (j.resize) p = p.resize(j.resize[0], j.resize[1], { fit: 'fill' });
  if (j.cover) p = p.resize(j.cover[0], j.cover[1], { fit: 'cover', position: 'attention' });
  const info = await p.webp({ quality: 82, effort: 6 }).toFile(path.join(out, j.name));
  console.log(`${j.name.padEnd(42)} ${info.width}x${info.height} ${info.size} bytes`);
}
