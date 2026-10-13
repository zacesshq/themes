#!/usr/bin/env node
// rebuilds every generated file and the previews, then fails if git sees any difference, which
// proves the committed files are exactly what the palette produces
import { spawnSync } from "node:child_process";
import { ROOT } from "./lib/palette.mjs";

const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
run(process.execPath, ["scripts/build.mjs"]);
run(process.execPath, ["scripts/preview.mjs"]);

// PNG copies depend on the fonts installed where they are drawn, so only the SVGs are compared
const pathspec = [".", ":(exclude)previews/*.png"];
const diff = spawnSync("git", ["diff", "--exit-code", "--stat", "--", ...pathspec], { cwd: ROOT, stdio: "inherit" });
const untracked = spawnSync("git", ["ls-files", "--others", "--exclude-standard", "--", ...pathspec], { cwd: ROOT, encoding: "utf8" });
if (untracked.stdout.trim()) {
  console.error(`generated files that are not committed:\n${untracked.stdout}`);
  process.exit(1);
}
if (diff.status !== 0) {
  console.error("the committed files differ from what the palette produces: run npm run build and npm run preview, then commit the result");
  process.exit(1);
}
console.log("every generated file matches the palette");
