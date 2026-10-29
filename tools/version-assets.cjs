// Stamp every page's links to the shared stylesheet and script with a hash of the file's contents
// (style.css?v=1a2b3c4d). Browsers cache assets for up to 10 minutes on GitHub Pages; without the stamp a
// visitor can get a new page with an old stylesheet. Run after changing assets/style.css or assets/dodeca.js:
//   node tools/version-assets.cjs
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const hash = (file) => crypto.createHash("sha1").update(fs.readFileSync(path.join(root, file))).digest("hex").slice(0, 8);
const assets = { "assets/style.css": hash("assets/style.css"), "assets/dodeca.js": hash("assets/dodeca.js") };

const pages = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "tools") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) pages.push(full);
  }
};
walk(root);

for (const page of pages) {
  let html = fs.readFileSync(page, "utf8");
  const before = html;
  for (const [asset, v] of Object.entries(assets)) {
    const escaped = asset.replace(/[.]/g, "\\.");
    html = html.replace(new RegExp(`"/${escaped}(\\?v=[0-9a-f]+)?"`, "g"), `"/${asset}?v=${v}"`);
  }
  if (html !== before) {
    fs.writeFileSync(page, html);
    console.log("updated", path.relative(root, page));
  }
}
console.log(assets);
