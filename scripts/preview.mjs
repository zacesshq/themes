#!/usr/bin/env node
// draws previews/<theme>.svg as real SVG text in each theme's colours and writes
// previews/themes.json, the data the website's themes page is built from; PNG copies for the
// VS Code Marketplace, which refuses SVG images, are drawn with rsvg-convert when it is installed
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { ROOT, REPO, loadPalette, styleOf } from "./lib/palette.mjs";
import { measureAll } from "./lib/measure.mjs";
import { SAMPLE, lineTokens } from "./lib/sample.mjs";

const palette = loadPalette();
const results = measureAll(palette);
const out = join(ROOT, "previews");
mkdirSync(out, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const FONT = "'Atkinson Hyperlegible Mono', 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace";
const W = 720;
const LINE = 26;
const TOP = 64;
const GUTTER = 56;

function svg(theme) {
  const u = theme.ui;
  const s = theme.syntax;
  const height = TOP + SAMPLE.length * LINE + 24;
  const label = `${theme.name} code theme preview: TypeScript, Python, Rust, HTML and diff lines in ${theme.syntax.foreground} on ${u.background}. Keywords are bold, comments and parameters italic and invalid code underlined.`;
  const lines = [];
  SAMPLE.forEach((line, i) => {
    const y = TOP + i * LINE;
    if (line.highlight) lines.push(`  <rect x="0" y="${y - 18}" width="${W}" height="${LINE}" fill="${u.lineHighlight}"/>`);
    const numberColour = line.highlight ? u.lineNumberActive : u.lineNumber;
    lines.push(`  <text x="${GUTTER - 16}" y="${y}" fill="${numberColour}" text-anchor="end">${i + 1}</text>`);
    const spans = lineTokens(line).map(([token, text]) => {
      const style = styleOf(palette, token);
      const attrs = [`fill="${s[token]}"`];
      if (style.includes("bold")) attrs.push('font-weight="700"');
      if (style.includes("italic")) attrs.push('font-style="italic"');
      if (style.includes("underline")) attrs.push('text-decoration="underline"');
      return `<tspan ${attrs.join(" ")}>${esc(text)}</tspan>`;
    });
    if (spans.length) lines.push(`  <text x="${GUTTER}" y="${y}" xml:space="preserve">${spans.join("")}</text>`);
  });
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-label="${esc(label)}">`,
    `  <title>${esc(label)}</title>`,
    `  <rect width="${W}" height="${height}" fill="${u.background}"/>`,
    `  <rect width="${W}" height="40" fill="${u.surfaceAlt}"/>`,
    `  <rect y="40" width="${W}" height="1" fill="${u.border}"/>`,
    `  <g font-family="${esc(FONT)}" font-size="15">`,
    `  <text x="20" y="26" fill="${u.foreground}" font-weight="700">${esc(theme.name)}</text>`,
    ...lines,
    "  </g>",
    "</svg>",
    "",
  ].join("\n");
}

const pngTool = spawnSync("rsvg-convert", ["--version"], { encoding: "utf8" });
const canPng = pngTool.status === 0;

for (const theme of palette.themes) {
  const file = join(out, `zacess-${theme.id}.svg`);
  writeFileSync(file, svg(theme));
  if (canPng) {
    const png = join(out, `zacess-${theme.id}.png`);
    const run = spawnSync("rsvg-convert", ["--zoom", "2", "--output", png, file], { encoding: "utf8" });
    if (run.status !== 0) throw new Error(`rsvg-convert failed for ${file}: ${run.stderr}`);
  }
}

const data = {
  generatedFrom: "palette/zacess.json",
  repository: REPO,
  version: palette.version,
  rules: palette.rules,
  styles: Object.fromEntries(Object.entries(palette.tokens).map(([k, v]) => [k, v.style])),
  sample: SAMPLE.map((line) => ({ lang: line.lang, highlight: Boolean(line.highlight), tokens: lineTokens(line) })),
  themes: results.map(({ theme, contrastRows, pairRows, lowestOnBackground, lowestText }) => {
    const ratioOf = (token, on) => contrastRows.find((x) => x.item === `syntax.${token}` && x.on === on).ratio;
    const shared = pairRows.filter((p) => p.sameStyle || p.lightness);
    return {
      id: theme.id,
      name: theme.name,
      appearance: theme.appearance,
      readerProfile: theme.readerProfile,
      description: theme.description,
      ui: theme.ui,
      syntax: theme.syntax,
      ratios: Object.keys(theme.syntax).map((token) => ({
        token,
        colour: theme.syntax[token],
        style: token === "foreground" ? [] : styleOf(palette, token),
        background: ratioOf(token, "background"),
        selection: ratioOf(token, "selection"),
        lineHighlight: ratioOf(token, "lineHighlight"),
      })),
      lowest: {
        background: { token: lowestOnBackground.item.replace("syntax.", ""), ratio: lowestOnBackground.ratio },
        anySurface: { token: lowestText.item.replace("syntax.", ""), on: lowestText.on, ratio: lowestText.ratio },
      },
      pairs: {
        closestTone: Math.floor(Math.min(...shared.map((p) => p.toneDiff)) * 1000) / 1000,
        closestSimulated: Math.floor(Math.min(...shared.flatMap((p) => Object.values(p.simulated))) * 1000) / 1000,
      },
    };
  }),
};
writeFileSync(join(out, "themes.json"), `${JSON.stringify(data, null, 2)}\n`);
console.log(`wrote ${palette.themes.length} SVG previews${canPng ? ", their PNG copies" : ""} and previews/themes.json`);
