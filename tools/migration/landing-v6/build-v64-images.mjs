// Builds the images added by the V6.4 refinement of the landing (src/Nabd.Web/wwwroot/img/landing/v64/):
//   - laptop.svg, drawn by build-laptop.mjs (run that script, not this one, to change it);
//   - showcase-respiratory-chat.webp, the laptop's screen: a real session of the ER room (asthma case), taken
//     with capture-er-session.js at 1024x704 and scale 2, __STOP='chat' (the room's 640 px below the 64 px app
//     bar). 1024 px is the narrowest width at which the room keeps the monitor beside the conversation, so the
//     text is as large as it can be on the small screen of the drawing.
// Credits: img/landing/v64/CREDITS.md. Needs the sharp package (npm install -g sharp); not a dependency of the
// application.
//
// usage: node tools/migration/landing-v6/build-v64-images.mjs <folder with laptop-chat-1024.png>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const shots = path.resolve(process.argv[2] || '.work/v64');
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch { sharp = require(path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'sharp')); }
const out = path.join(REPO, 'src', 'Nabd.Web', 'wwwroot', 'img', 'landing', 'v64');
fs.mkdirSync(out, { recursive: true });

const JOBS = [
  // The laptop screen, 16:10, without the application's top bar (128 px at scale 2).
  { name: 'showcase-respiratory-chat.webp', from: path.join(shots, 'laptop-chat-1024.png'), crop: [0, 128, 2048, 1280], resize: [1600, 1000] },
];

for (const j of JOBS) {
  let p = sharp(j.from);
  if (j.crop) p = p.extract({ left: j.crop[0], top: j.crop[1], width: j.crop[2], height: j.crop[3] });
  if (j.resize) p = p.resize(j.resize[0], j.resize[1], { fit: 'fill', kernel: 'lanczos3' });
  const info = await p.webp({ quality: 84, effort: 6 }).toFile(path.join(out, j.name));
  console.log(`${j.name.padEnd(42)} ${info.width}x${info.height} ${info.size} bytes`);
}
