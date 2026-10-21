#!/usr/bin/env node
// raises the OKLab chroma of every non-neutral palette colour to the edge of the sRGB gamut while
// holding its WCAG relative luminance and its OKLab hue fixed, so colours get as deep as the screen
// allows and every contrast ratio in the tables stays exactly where it was
//
// usage: node scripts/saturate.mjs [--dry-run] [--report <file.json>]
//
// running it again is safe: a colour already on the gamut edge has nowhere left to go
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, TEXT_SURFACES } from "./lib/palette.mjs";
import { contrast, fromLinearRgb, linear, linearFromOklab, oklab, parseHex, toHex } from "./lib/colour.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const reportPath = args.includes("--report") ? args[args.indexOf("--report") + 1] : null;

// below this chroma a colour is meant to read as grey; its hue is too unstable to push
const NEUTRAL_CHROMA = 0.02;
const STEP = 0.0005;
// a gain smaller than this is 8-bit rounding noise; ignoring it lets a second run change nothing
const MIN_GAIN = 0.005;

// colours held below the gamut edge because the full push made them too close to a neighbour for
// a colour vision deficiency or tone check; the value is the highest OKLab chroma allowed
const LIMITS = {
  // the full push leaves it 0.038 from the number colour under deuteranopia, below the 0.04 rule
  "yellow-on-black.syntax.string": 0.215,
};

// the ANSI slots that stand for black, white and their bright forms stay neutral by design
const NEUTRAL_ANSI = new Set([0, 7, 8, 15]);
const UI_KEYS = ["link", "error", "warning", "info"];

// the text colour is neutral by design
const NEUTRAL_TOKENS = new Set(["foreground"]);

const lum = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
const chromaOf = (hex) => {
  const [, a, b] = oklab(hex);
  return Math.hypot(a, b);
};
const inGamut = (rgb) => rgb.every((v) => v >= -1e-6 && v <= 1 + 1e-6);

// OKLab lightness is not WCAG luminance, so the lightness that restores the target luminance at a
// given chroma is found by bisection; luminance rises with L when a and b are fixed
function atLuminance(target, a, b) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (lum(linearFromOklab([mid, a, b]).map((v) => Math.max(0, v))) < target) lo = mid;
    else hi = mid;
  }
  return linearFromOklab([(lo + hi) / 2, a, b]);
}

// 8-bit rounding nudges luminance, so the rounded colour and its neighbours within two steps per
// channel are ranked by how close they land to the original luminance, chroma breaking ties
function roundingCandidates(rgb, target) {
  const base = parseHex(fromLinearRgb(rgb));
  const out = [];
  for (let dr = -2; dr <= 2; dr++) {
    for (let dg = -2; dg <= 2; dg++) {
      for (let db = -2; db <= 2; db++) {
        const c = [base[0] + dr, base[1] + dg, base[2] + db];
        if (c.some((v) => v < 0 || v > 255)) continue;
        const hex = toHex(c);
        out.push({ hex, off: Math.abs(lum(linear(hex)) - target), chroma: chromaOf(hex) });
      }
    }
  }
  return out.sort((x, y) => x.off - y.off || y.chroma - x.chroma).map((x) => x.hex);
}

// every ratio the tables report is floored to two places, so a candidate is only accepted when each
// of those floored ratios is identical to the original's
const floored = (x, y) => Math.floor(contrast(x, y) * 100) / 100;
const sameContrast = (from, to, surfaces) => surfaces.every((s) => floored(from, s) === floored(to, s));

export function saturate(hex, surfaces, limit = Infinity) {
  const [, a0, b0] = oklab(hex);
  const start = Math.hypot(a0, b0);
  if (start < NEUTRAL_CHROMA) return hex;
  const hue = Math.atan2(b0, a0);
  const target = lum(linear(hex));
  const steps = [];
  for (let c = start + STEP; c <= Math.min(limit, 0.5); c += STEP) {
    const rgb = atLuminance(target, c * Math.cos(hue), c * Math.sin(hue));
    // chroma only grows from here, so the first step outside sRGB ends the search
    if (!inGamut(rgb)) break;
    steps.push(rgb);
  }
  // walk back from the edge until rounding to hex keeps every floored ratio and adds chroma
  for (let i = steps.length - 1; i >= 0; i--) {
    const out = roundingCandidates(steps[i], target).find((c) => chromaOf(c) >= start + MIN_GAIN && sameContrast(hex, c, surfaces));
    if (out) return out;
  }
  return hex;
}

function surfacesOf(theme) {
  const u = theme.ui;
  return [...new Set([...TEXT_SURFACES.map((s) => u[s]), u.findMatch, u.gutter, u.background])];
}

const file = join(ROOT, "palette", "zacess.json");
const palette = JSON.parse(readFileSync(file, "utf8"));
const changes = [];

for (const theme of palette.themes) {
  const surfaces = surfacesOf(theme);
  const apply = (path, get, set) => {
    const before = get();
    const after = saturate(before, surfaces, LIMITS[`${theme.id}.${path}`]);
    if (after === before) return;
    set(after);
    changes.push({
      theme: theme.id,
      path,
      before,
      after,
      ratio: floored(before, theme.ui.background),
      ratioAfter: floored(after, theme.ui.background),
      chromaBefore: chromaOf(before),
      chromaAfter: chromaOf(after),
    });
  };

  for (const token of Object.keys(theme.syntax)) {
    if (NEUTRAL_TOKENS.has(token)) continue;
    apply(`syntax.${token}`, () => theme.syntax[token], (v) => (theme.syntax[token] = v));
  }
  theme.terminal.ansi.forEach((_, i) => {
    if (NEUTRAL_ANSI.has(i)) return;
    apply(`ansi.${i}`, () => theme.terminal.ansi[i], (v) => (theme.terminal.ansi[i] = v));
  });
  const link = theme.ui.link;
  for (const key of UI_KEYS) apply(`ui.${key}`, () => theme.ui[key], (v) => (theme.ui[key] = v));
  // the accent and focus border share the link colour in most themes, so they follow it to keep
  // one identity colour rather than two near twins
  for (const key of ["accent", "borderActive"]) {
    if (theme.ui[key] === link && theme.ui.link !== link) {
      const before = theme.ui[key];
      theme.ui[key] = theme.ui.link;
      changes.push({ ...changes.find((c) => c.theme === theme.id && c.path === "ui.link"), path: `ui.${key}`, before });
    }
  }
}

for (const c of changes) {
  console.log(`${c.theme.padEnd(20)} ${c.path.padEnd(18)} ${c.before} -> ${c.after}  ${c.ratio}:1 -> ${c.ratioAfter}:1  chroma ${c.chromaBefore.toFixed(3)} -> ${c.chromaAfter.toFixed(3)}`);
}
console.log(`${changes.length} colours ${dryRun ? "would change" : "changed"}`);
if (reportPath) writeFileSync(reportPath, `${JSON.stringify(changes, null, 2)}\n`);
if (!dryRun) writeFileSync(file, `${JSON.stringify(palette, null, 2)}\n`);
