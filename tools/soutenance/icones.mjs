// Rend des icônes Lucide (SVG, licence ISC) en PNG transparents colorés pour le diaporama.
// Usage : node tools/soutenance/icones.mjs <dossier-svg-lucide> <dossier-sortie> nom:RRGGBB [nom:RRGGBB ...]
import { createRequire } from "module";
import fs from "fs";
import path from "path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const [src, out, ...items] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const nav = await chromium.launch();
const page = await nav.newPage({ viewport: { width: 256, height: 256 }, deviceScaleFactor: 1 });
for (const it of items) {
  const [nom, coul] = it.split(":");
  const cible = path.join(out, `${nom}_${coul}.png`);
  if (fs.existsSync(cible)) continue;
  let svg = fs.readFileSync(path.join(src, nom + ".svg"), "utf8");
  svg = svg.replace(/width="24"/, 'width="256"').replace(/height="24"/, 'height="256"')
           .replace(/stroke="currentColor"/, `stroke="#${coul}"`).replace(/stroke-width="2"/, 'stroke-width="1.6"');
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.locator("svg").screenshot({ path: cible, omitBackground: true });
}
await nav.close();
console.log("icônes OK");
