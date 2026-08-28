/**
 * Copies non-TypeScript assets into the build output.
 *
 * `tsc` only emits what it compiles, so the seals and stamps were left behind
 * in src/. The server fell back to reading them from the source tree, which
 * happens to work on Render because the repo is deployed whole — and would
 * fail silently the moment anything shipped only dist/, printing deeds with
 * blank squares where the seal should be.
 */
const fs = require("fs");
const path = require("path");

const pairs = [["src/assets", "dist/assets"]];

for (const [from, to] of pairs) {
  const src = path.resolve(__dirname, "..", from);
  const dest = path.resolve(__dirname, "..", to);
  if (!fs.existsSync(src)) continue;
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  const count = fs.readdirSync(dest, { recursive: true }).filter((f) => path.extname(String(f))).length;
  console.log(`copied ${count} asset(s): ${from} -> ${to}`);
}
