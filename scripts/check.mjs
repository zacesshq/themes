#!/usr/bin/env node
// measures the palette and proves every generated file parses; exits non-zero with a table of
// every failure so CI shows exactly which colour or file to fix
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, VSCODE_FALLBACK_KEYS, VSCODE_NON_TEXT_PAIRS, VSCODE_TEXT_PAIRS, XCODE_KEYS, XCODE_SYNTAX_KEYS, loadPalette, loadSchema, styleOf } from "./lib/palette.mjs";
import { validate } from "./lib/schema.mjs";
import { measureAll } from "./lib/measure.mjs";
import { contrast, ratio } from "./lib/colour.mjs";
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
for (const { theme, contrastRows, terminalRows, terminalTextRows, pairRows } of results) {
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
  for (const x of terminalTextRows.filter((r) => !r.pass)) {
    const sims = Object.entries(x.simulated).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(", ");
    fail("terminal", `${theme.id} ansi.${x.index} and the default text`, `${x.colour} and ${x.foreground}: tone difference ${x.toneDiff.toFixed(3)} (needs ${palette.rules.toneStep}) or OKLab distance ${sims} (each needs ${palette.rules.deficiencyDistance})`);
  }
  for (const x of pairRows.filter((r) => !r.pass)) {
    const sims = Object.entries(x.simulated).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(", ");
    fail("pairs", `${theme.id} ${x.a} and ${x.b}`, `tone difference ${x.toneDiff.toFixed(3)} (needs ${palette.rules.toneStep}), OKLab distance ${sims} (needs ${palette.rules.deficiencyDistance})`);
  }
}

// 4. every border, outline and divider the VS Code themes draw keeps the non-text floor on each
// surface it can sit on, so a calmer border can never fade below WCAG 1.4.11
const BORDER_KEY = /(border|outline|separator)/i;
// the current line border repeats the line highlight on purpose, so the line is marked by its
// background alone and no boundary is drawn
const NOT_A_BOUNDARY = new Set(["editor.lineHighlightBorder"]);
for (const theme of palette.themes) {
  const file = `editors/vscode/themes/zacess-${theme.id}-color-theme.json`;
  if (!existsSync(join(ROOT, file))) continue;
  const { colors } = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  for (const [key, value] of Object.entries(colors)) {
    if (!BORDER_KEY.test(key) || NOT_A_BOUNDARY.has(key) || !/^#[0-9a-f]{6}$/i.test(value)) continue;
    for (const surface of ["background", "surface", "surfaceAlt"]) {
      const measured = contrast(value, theme.ui[surface]);
      if (measured < palette.rules.nonTextContrast) {
        fail("non-text", `${theme.id} ${key} on ${surface}`, `${value} on ${theme.ui[surface]} is ${ratio(value, theme.ui[surface])}:1, needs ${palette.rules.nonTextContrast}:1`);
      }
    }
  }
}

// the keys VS Code would otherwise fill from its defaults are all set; the text and marks on
// them keep their floors; a high contrast base makes a missing key far worse, so it is named
for (const theme of palette.themes) {
  const file = `editors/vscode/themes/zacess-${theme.id}-color-theme.json`;
  if (!existsSync(join(ROOT, file))) continue;
  const { colors } = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  const highContrast = theme.vscodeUiTheme.startsWith("hc");
  for (const key of VSCODE_FALLBACK_KEYS) {
    if (!(key in colors)) {
      fail("vscode", `${theme.id} ${key}`, highContrast ? `unset on the ${theme.vscodeUiTheme} base, which would fall back to the built in high contrast colour` : "unset, so it would fall back to a VS Code default");
    }
  }
  const pairs = [...VSCODE_TEXT_PAIRS.map((p) => [...p, palette.rules.textContrast]), ...VSCODE_NON_TEXT_PAIRS.map((p) => [...p, palette.rules.nonTextContrast])];
  for (const [fg, bg, floor] of pairs) {
    const a = colors[fg];
    const b = colors[bg];
    if (!a || !b) {
      fail("vscode", `${theme.id} ${fg} on ${bg}`, "one of the two keys is unset");
      continue;
    }
    if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) continue;
    if (contrast(a, b) < floor) fail("vscode", `${theme.id} ${fg} on ${bg}`, `${a} on ${b} is ${ratio(a, b)}:1, needs ${floor}:1`);
  }
}

// 5. every generated file parses and points at files that exist
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
    } else if (file.endsWith(".sublime-color-scheme")) {
      checkSublime(JSON.parse(text), name);
    } else if (file.endsWith(".toml")) {
      const data = parseToml(text);
      if (name.startsWith("editors/helix/")) checkHelix(data, name);
    } else if (file.endsWith(".el")) {
      checkElisp(text, name);
    } else if (file.endsWith(".epf")) {
      checkEclipse(text, name);
    } else if (file.endsWith(".xccolortheme")) {
      checkXcode(text, name);
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

// every theme has its file in each editor that keeps one file per theme
for (const theme of palette.themes) {
  for (const path of [
    `editors/sublime/${theme.name}.sublime-color-scheme`,
    `editors/helix/themes/zacess_${theme.id.replace(/-/g, "_")}.toml`,
    `editors/emacs/zacess-${theme.id}-theme.el`,
    `editors/eclipse/${theme.name}.epf`,
    `editors/xcode/${theme.name}.xccolortheme`,
  ]) {
    if (!existsSync(join(ROOT, path))) fail("files", path, `missing for ${theme.name}`);
  }
}

// the theme a per-theme file belongs to, found from its file name
function themeOf(name) {
  const base = name.split("/").pop();
  const theme = palette.themes.find((t) => [
    `${t.name}.sublime-color-scheme`,
    `zacess_${t.id.replace(/-/g, "_")}.toml`,
    `zacess-${t.id}-theme.el`,
    `${t.name}.epf`,
    `${t.name}.xccolortheme`,
  ].includes(base));
  if (!theme) throw new Error("matches no theme in the palette");
  return theme;
}

// every colour a theme may use, so a generated file can never carry a colour the checks did not measure
function coloursOf(theme) {
  const t = theme.terminal;
  return new Set([...Object.values(theme.ui), ...Object.values(theme.syntax), ...t.ansi, t.foreground, t.cursor].filter(Boolean).map((c) => c.toLowerCase()));
}

function checkSublime(data, name) {
  const colours = coloursOf(themeOf(name));
  const vars = data.variables ?? {};
  for (const [k, v] of Object.entries(vars)) {
    if (!colours.has(String(v).toLowerCase())) throw new Error(`variable ${k} is ${v}, which is not a palette colour`);
  }
  const resolve = (where, value) => {
    const ref = /^var\(([a-z_]+)\)$/.exec(value);
    if (!ref) throw new Error(`${where} is ${value}, not a var() of a palette colour`);
    if (!Object.hasOwn(vars, ref[1])) throw new Error(`${where} refers to ${ref[1]}, which is not a variable`);
  };
  for (const [k, v] of Object.entries(data.globals ?? {})) {
    if (/_options$|_width$/.test(k)) continue;
    resolve(`globals.${k}`, v);
  }
  if (!Array.isArray(data.rules) || !data.rules.length) throw new Error("rules is empty");
  for (const rule of data.rules) {
    if (typeof rule.scope !== "string" || !rule.scope) throw new Error(`rule ${rule.name} has no scope`);
    resolve(`rule ${rule.name}`, rule.foreground);
    for (const style of (rule.font_style ?? "").split(" ").filter(Boolean)) {
      if (!["bold", "italic", "underline"].includes(style)) throw new Error(`rule ${rule.name} has an unknown font style ${style}`);
    }
  }
}

function checkHelix(data, name) {
  const colours = coloursOf(themeOf(name));
  const { palette: named, ...styles } = data;
  if (!named) throw new Error("no [palette] table");
  for (const [k, v] of Object.entries(named)) {
    if (!colours.has(String(v).toLowerCase())) throw new Error(`palette.${k} is ${v}, which is not a palette colour`);
  }
  const known = (where, ref) => {
    if (!Object.hasOwn(named, ref)) throw new Error(`${where} refers to ${ref}, which is not in [palette]`);
  };
  const MODIFIERS = ["bold", "dim", "italic", "slow_blink", "rapid_blink", "reversed", "hidden", "crossed_out"];
  const UNDERLINES = ["line", "curl", "dashed", "dotted", "double_line"];
  for (const [scope, style] of Object.entries(styles)) {
    if (typeof style === "string") { known(scope, style); continue; }
    for (const [k, v] of Object.entries(style)) {
      if (k === "fg" || k === "bg") known(`${scope}.${k}`, v);
      else if (k === "modifiers") {
        for (const m of v) if (!MODIFIERS.includes(m)) throw new Error(`${scope} has an unknown modifier ${m}`);
      } else if (k === "underline") {
        if (v.color) known(`${scope}.underline.color`, v.color);
        if (v.style && !UNDERLINES.includes(v.style)) throw new Error(`${scope} has an unknown underline style ${v.style}`);
      } else throw new Error(`${scope} has an unknown key ${k}`);
    }
  }
}

function checkElisp(text, name) {
  const theme = themeOf(name);
  const colours = coloursOf(theme);
  // a reader for all of Emacs Lisp is not needed: brackets are counted outside strings and
  // comments, which catches a broken face spec before Emacs refuses to load the theme
  let depth = 0;
  let line = 1;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "\n") line += 1;
    else if (ch === ";") { while (i < text.length && text[i] !== "\n") i += 1; line += 1; }
    else if (ch === "\"") {
      for (i += 1; i < text.length && text[i] !== "\""; i += 1) {
        if (text[i] === "\\") i += 1;
        else if (text[i] === "\n") line += 1;
      }
      if (i >= text.length) throw new Error("an unterminated string");
    } else if (ch === "(") depth += 1;
    else if (ch === ")") {
      depth -= 1;
      if (depth < 0) throw new Error(`line ${line} closes a bracket that was never opened`);
    }
  }
  if (depth !== 0) throw new Error(`${depth} bracket(s) left open`);
  const id = `zacess-${theme.id}`;
  if (!text.includes(`(deftheme ${id}\n`)) throw new Error(`no (deftheme ${id})`);
  if (!text.includes(`(provide-theme '${id})`)) throw new Error(`no (provide-theme '${id})`);
  if (!text.includes(";;;###autoload\n")) throw new Error("no autoload cookie for custom-theme-load-path");
  for (const [, hex] of text.matchAll(/"(#[0-9a-zA-Z]+)"/g)) {
    if (!/^#[0-9a-f]{6}$/.test(hex)) throw new Error(`${hex} is not a six digit colour`);
    if (!colours.has(hex)) throw new Error(`${hex} is not a palette colour`);
  }
}

function checkEclipse(text, name) {
  // the preference nodes the Eclipse files write to (the Terminal view's included) and the text
  // styles an annotation accepts
  const NODES = ["org.eclipse.jdt.ui", "org.eclipse.ui.editors", "org.eclipse.ui.workbench", "org.eclipse.terminal.control"];
  const STYLES = ["NONE", "SQUIGGLES", "PROBLEM_UNDERLINE", "BOX", "DASHED_BOX", "UNDERLINE", "IBEAM"];
  const colours = coloursOf(themeOf(name));
  const values = new Map();
  let version = false;
  text.split("\n").forEach((line, i) => {
    if (!line || line.startsWith("#")) return;
    // an export root line makes the import clear every preference under it first
    if (line.startsWith("!") || line.startsWith("\\!")) throw new Error(`line ${i + 1} is an export root, which would clear the user's preferences on import`);
    if (line === "file_export_version=3.0") { version = true; return; }
    const m = /^\/instance\/([a-z.]+)\/([A-Za-z0-9_.]+)=(.+)$/.exec(line);
    if (!m) throw new Error(`line ${i + 1} is not an instance preference: ${line}`);
    const [, node, key, value] = m;
    if (!NODES.includes(node)) throw new Error(`line ${i + 1} writes to ${node}, which is not an editor colour node`);
    if (values.has(`${node}/${key}`)) throw new Error(`${node}/${key} is set twice`);
    values.set(`${node}/${key}`, value);
    const rgb = /^(\d{1,3}),(\d{1,3}),(\d{1,3})$/.exec(value);
    if (rgb) {
      if (rgb.slice(1).some((v) => Number(v) > 255)) throw new Error(`${key} has a channel above 255`);
      const hex = `#${rgb.slice(1).map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;
      if (!colours.has(hex)) throw new Error(`${key} is ${value} (${hex}), which is not a palette colour`);
    } else if (key.endsWith("TextStyle")) {
      if (!STYLES.includes(value)) throw new Error(`${key} has an unknown text style ${value}`);
    } else if (value !== "true" && value !== "false") {
      throw new Error(`${key} is ${value}, which is neither a colour, a text style nor a boolean`);
    }
  });
  if (!version) throw new Error("no file_export_version=3.0 line, so Eclipse would read it as a legacy file");
  // Eclipse ignores these colours and draws the operating system's while their SystemDefault flag is on
  for (const key of values.keys()) {
    if (!/(AbstractTextEditor\.Color\.(Background|Foreground|SelectionBackground|SelectionForeground)|hyperlinkColor|sourceHoverBackgroundColor)$/.test(key)) continue;
    if (values.get(`${key}.SystemDefault`) !== "false") throw new Error(`${key} is set without ${key.split("/")[1]}.SystemDefault=false`);
  }
}

function checkXcode(text, name) {
  checkXml(text);
  const colours = coloursOf(themeOf(name));
  // the two syntax dictionaries are the only nested ones, so they are lifted out before the
  // top level entries are read
  const nested = {};
  const top = text.replace(/\t<key>(DVTSourceTextSyntax(?:Colors|Fonts))<\/key>\n\t<dict>\n([\s\S]*?)\t<\/dict>\n/g, (_, key, inner) => {
    nested[key] = inner;
    return `\t<key>${key}</key>\n\t<dict/>\n`;
  });
  const entries = (body) => {
    const out = new Map();
    for (const [, key, type, value] of body.matchAll(/<key>([^<]+)<\/key>\s*<(string|integer|real|dict)(?:\/>|>([^<]*)<\/\2>)/g)) {
      if (out.has(key)) throw new Error(`${key} is set twice`);
      out.set(key, { type, value });
    }
    return out;
  };
  const colour = (key, value) => {
    const m = /^([\d.]+) ([\d.]+) ([\d.]+) 1$/.exec(value);
    if (!m) throw new Error(`${key} is ${value}, not an opaque "r g b 1" colour`);
    const channels = m.slice(1).map(Number);
    if (channels.some((v) => v > 1)) throw new Error(`${key} has a channel above 1`);
    const hex = `#${channels.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
    if (!colours.has(hex)) throw new Error(`${key} is ${value} (${hex}), which is not a palette colour`);
  };
  // the SF Mono cuts Xcode registers and the system fonts its own themes use for documentation
  const font = (key, value) => {
    if (!/^(SFMono-(Regular|Bold|RegularItalic|BoldItalic)|\.AppleSystemUIFont(Italic|Bold)?) - \d+\.0$/.test(value)) throw new Error(`${key} has an unknown font ${value}`);
  };
  const values = entries(top);
  for (const key of XCODE_KEYS) if (!values.has(key)) throw new Error(`${key} is missing`);
  for (const [key, { value }] of values) {
    if (!XCODE_KEYS.includes(key)) throw new Error(`${key} is not a key in Xcode's own themes`);
    if (key.endsWith("Font")) font(key, value);
    else if (key === "DVTFontAndColorVersion") { if (value !== "1") throw new Error(`${key} is ${value}, not 1`); }
    else if (key === "DVTLineSpacing") { if (!(Number(value) >= 1)) throw new Error(`${key} is ${value}`); }
    else if (!key.startsWith("DVTSourceTextSyntax")) colour(key, value);
  }
  for (const [dict, check] of [["DVTSourceTextSyntaxColors", colour], ["DVTSourceTextSyntaxFonts", font]]) {
    const syntax = entries(nested[dict] ?? "");
    for (const key of XCODE_SYNTAX_KEYS) if (!syntax.has(key)) throw new Error(`${dict} has no ${key}`);
    for (const [key, { value }] of syntax) {
      if (!XCODE_SYNTAX_KEYS.includes(key)) throw new Error(`${dict} has ${key}, which is not a syntax type in Xcode's own themes`);
      check(`${dict} ${key}`, value);
    }
  }
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
