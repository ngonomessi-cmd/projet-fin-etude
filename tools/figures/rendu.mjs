// Rend chaque figure HTML de tools/figures/build en PNG haute résolution (docs/figures).
// Usage : node tools/figures/rendu.mjs [nom1 nom2 ...]
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ici = path.dirname(fileURLToPath(import.meta.url));
const build = path.join(ici, "build");
const sortie = path.join(ici, "..", "..", "docs", "figures");
fs.mkdirSync(sortie, { recursive: true });
const noms = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(build).filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, ""));

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ deviceScaleFactor: 3, viewport: { width: 2400, height: 1400 } });
for (const nom of noms) {
  await page.goto("file://" + path.join(build, nom + ".html"));
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#fig").screenshot({ path: path.join(sortie, nom + ".png") });
  console.log("✓", nom);
}
await navigateur.close();
