#!/usr/bin/env node
// measures the palette and proves every generated file parses; exits non-zero with a table of
// every failure so CI shows exactly which colour or file to fix
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, loadPalette, loadSchema, styleOf } from "./lib/palette.mjs";
import { validate } from "./lib/schema.mjs";
import { measureAll } from "./lib/measure.mjs";
import { parseToml } from "./lib/toml.mjs";
import { checkXml } from "./lib/xml.mjs";

const failures = [];
const fail = (area, item, detail) => failures.push({ area, item, detail });
const palette = loadPalette();

// 1. the palette matches its schema
for (const error of validate(loadSchema(), palette)) fail("schema", "palette/zacess.json", error);
if (failures.length) report();

// 2. the font styles that carry meaning without colour are present
const REQUIRED_STYLES = { keyword: "bold", control: "bold", tag: "bold", comment: "italic", parameter: "italic", invalid: "underline" };
for (const [token, style] of Object.entries(REQUIRED_STYLES)) {
  if (!styleOf(palette, token).includes(style)) fail("style", token, `must be ${style}`);
}

// a misspelt pair would otherwise crash the measurements instead of reporting
for (const { pair } of palette.pairs) {
  for (const token of pair) if (!(token in palette.tokens)) fail("pairs", pair.join(" and "), `${token} is not a token in palette.tokens`);
}
report();

// 3. contrast, terminal colours and the colour vision deficiency pairs
const results = measureAll(palette);
for (const { theme, contrastRows, terminalRows, pairRows } of results) {
  for (const x of contrastRows.filter((r) => !r.pass)) {
    fail("contrast", `${theme.id} ${x.item} on ${x.on}`, `${x.colour} on ${x.background} is ${x.ratio}:1, needs ${x.floor}:1`);
  }
  const dim = theme.terminal.dim ?? [];
  for (const x of terminalRows) {
    const index = Number(x.item.split(".")[1]);
    const floor = dim.includes(index) ? palette.rules.ansiFloor : palette.rules.textContrast;
    if (x.ratio < floor) {
      const what = x.role === "background" ? `${x.text} text on the background shade ${x.colour}` : `${x.colour} on ${x.background}`;
      fail("terminal", `${theme.id} ${x.item}`, `${what} is ${x.ratio}:1, needs ${floor}:1`);
    }
  }
  for (const x of pairRows.filter((r) => !r.pass)) {
    const sims = Object.entries(x.simulated).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(", ");
    fail("pairs", `${theme.id} ${x.a} and ${x.b}`, `tone difference ${x.toneDiff.toFixed(3)} (needs ${palette.rules.toneStep}), OKLab distance ${sims} (needs ${palette.rules.deficiencyDistance})`);
  }
}

// 4. every generated file parses and points at files that exist
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (["node_modules", "build", ".gradle", ".intellijPlatform", ".kotlin"].includes(name)) return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const files = walk(join(ROOT, "editors")).concat(walk(join(ROOT, "palette")), walk(join(ROOT, "previews")));
const rel = (f) => relative(ROOT, f);
const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const name = rel(file);
  try {
    if (file.endsWith(".json")) {
      const data = JSON.parse(text);
      if (name.includes("vscode/themes/")) {
        for (const [k, v] of Object.entries(data.colors)) if (!HEX.test(v)) fail("vscode", name, `${k} is not a colour: ${v}`);
        if (!Array.isArray(data.tokenColors) || !data.tokenColors.length) fail("vscode", name, "tokenColors is empty");
      }
      if (name.endsWith(".theme.json")) {
        const scheme = join(ROOT, "editors/jetbrains/src/main/resources", data.editorScheme);
        if (!existsSync(scheme)) fail("jetbrains", name, `editorScheme ${data.editorScheme} does not exist`);
      }
    } else if (file.endsWith(".toml")) {
      parseToml(text);
    } else if (/\.(xml|icls|itermcolors|svg)$/.test(file)) {
      checkXml(text);
    } else if (file.endsWith(".lua")) {
      checkLua(text);
    } else if (file.endsWith(".css")) {
      checkCss(text);
    } else if (name.startsWith("editors/terminals/ghostty/")) {
      checkLines(text, /^(palette = \d{1,2}=#[0-9a-f]{6}|[a-z-]+ = #[0-9a-f]{6})$/);
    } else if (file.endsWith(".conf")) {
      checkLines(text, /^[a-z_0-9]+ #[0-9a-f]{6}$/);
    }
  } catch (error) {
    fail("parse", name, error.message);
  }
}

const vscode = JSON.parse(readFileSync(join(ROOT, "editors/vscode/package.json"), "utf8"));
for (const t of vscode.contributes.themes) {
  if (!existsSync(join(ROOT, "editors/vscode", t.path))) fail("vscode", "package.json", `${t.path} does not exist`);
}
if (vscode.version !== palette.version) fail("vscode", "package.json", `version ${vscode.version} differs from the palette's ${palette.version}`);
const gradleVersion = /^pluginVersion = (.+)$/m.exec(readFileSync(join(ROOT, "editors/jetbrains/gradle.properties"), "utf8"))?.[1];
if (gradleVersion !== palette.version) fail("jetbrains", "gradle.properties", `pluginVersion ${gradleVersion} differs from the palette's ${palette.version}`);
const rootVersion = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;
if (rootVersion !== palette.version) fail("repo", "package.json", `version ${rootVersion} differs from the palette's ${palette.version}`);
const pluginXml = readFileSync(join(ROOT, "editors/jetbrains/src/main/resources/META-INF/plugin.xml"), "utf8");
for (const [, path] of pluginXml.matchAll(/path="([^"]+)"/g)) {
  if (!existsSync(join(ROOT, "editors/jetbrains/src/main/resources", path))) fail("jetbrains", "plugin.xml", `${path} does not exist`);
}

function checkLines(text, pattern) {
  text.split("\n").forEach((line, i) => {
    if (!line || line.startsWith("#")) return;
    if (!pattern.test(line)) throw new Error(`line ${i + 1} is not a colour setting: ${line}`);
  });
}

function checkLua(text) {
  // the colour files are plain assignments; a parser for all of Lua is not needed to catch a broken line
  let depth = 0;
  text.split("\n").forEach((line, i) => {
    if (!line || line.startsWith("--")) return;
    const ok = /^hl\(0, "[@A-Za-z.]+", \{ .* \}\)$/.test(line)
      || /^vim\.g\.terminal_color_\d{1,2} = "#[0-9a-f]{6}"$/.test(line)
      || /^(vim\.cmd\(".*"\)|if vim\.fn\.exists\("syntax_on"\) == 1 then|  vim\.cmd\("syntax reset"\)|end|vim\.o\.background = "(light|dark)"|vim\.g\.colors_name = "[a-z-]+"|local hl = vim\.api\.nvim_set_hl)$/.test(line);
    if (!ok) throw new Error(`line ${i + 1} is not a recognised statement: ${line}`);
    for (const ch of line) depth += ch === "{" ? 1 : ch === "}" ? -1 : 0;
    if (depth !== 0) throw new Error(`line ${i + 1} has unbalanced braces`);
  });
}

function checkCss(text) {
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, "");
  if (stripped.includes("/*") || stripped.includes("*/")) throw new Error("an unclosed comment");
  let depth = 0;
  for (const ch of stripped) {
    depth += ch === "{" ? 1 : ch === "}" ? -1 : 0;
    if (depth < 0) throw new Error("a closing brace with no opening brace");
  }
  if (depth !== 0) throw new Error("unbalanced braces");
  // a theme must never load anything from elsewhere, which could track whoever installs it
  if (/@import|url\(/i.test(stripped)) throw new Error("an @import or url() that loads an outside resource");
  for (const [, value] of stripped.matchAll(/:\s*(#[0-9a-zA-Z]+)\s*;/g)) {
    if (!/^#[0-9a-f]{6}$/.test(value)) throw new Error(`${value} is not a six digit colour`);
  }
}

function report() {
  if (!failures.length) return;
  const widths = ["area", "item", "detail"].map((k) => Math.max(k.length, ...failures.map((f) => f[k].length)));
  const line = (cells) => `| ${cells.map((c, i) => c.padEnd(widths[i])).join(" | ")} |`;
  console.error(`${failures.length} check(s) failed:\n`);
  console.error(line(["area", "item", "detail"]));
  console.error(line(widths.map((w) => "-".repeat(w))));
  for (const f of failures) console.error(line([f.area, f.item, f.detail]));
  process.exit(1);
}

report();

const lines = results.map(({ theme, lowestOnBackground, lowestText, pairRows }) => {
  const minSim = Math.min(...pairRows.filter((p) => p.sameStyle || p.lightness).flatMap((p) => Object.values(p.simulated)));
  const minTone = Math.min(...pairRows.filter((p) => p.sameStyle || p.lightness).map((p) => p.toneDiff));
  return `${theme.name.padEnd(24)} lowest syntax on background ${lowestOnBackground.ratio.toFixed(2)}:1, over any text surface ${lowestText.ratio.toFixed(2)}:1, closest pair tone ${minTone.toFixed(3)}, OKLab ${minSim.toFixed(3)}`;
});
console.log(lines.join("\n"));
console.log(`all checks passed: ${files.length} generated and source files parse`);
