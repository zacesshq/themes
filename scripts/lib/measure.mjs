// every measurement the checks, the tables and the website data share, so a number in the
// README is always the number CI enforced
import { DEFICIENCIES, contrast, distance, luminance, ratio, simulate } from "./colour.mjs";
import { TEXT_SURFACES, UI_TEXT, UI_NON_TEXT, styleOf, terminalText } from "./palette.mjs";

// tone is the cube root of relative luminance: the OKLab lightness of the grey with the same
// luminance, which is all a viewer with no colour vision has to go on
export const tone = (hex) => Math.cbrt(luminance(hex));

const row = (theme, item, colour, on, background, floor) => {
  const value = contrast(colour, background);
  return { theme: theme.id, item, colour, on, background, ratio: ratio(colour, background), floor, pass: value >= floor };
};

export function measureTheme(palette, theme) {
  const r = palette.rules;
  const u = theme.ui;
  const contrastRows = [];
  for (const [token, colour] of Object.entries(theme.syntax)) {
    for (const surface of TEXT_SURFACES) contrastRows.push(row(theme, `syntax.${token}`, colour, surface, u[surface], r.textContrast));
    const floor = token === "foreground" ? r.textContrast : r.findMatchContrast;
    contrastRows.push(row(theme, `syntax.${token}`, colour, "findMatch", u.findMatch, floor));
  }
  for (const [item, surfaces] of UI_TEXT) {
    for (const surface of surfaces) contrastRows.push(row(theme, `ui.${item}`, u[item], surface, u[surface], r.textContrast));
  }
  for (const [item, surface] of UI_NON_TEXT) contrastRows.push(row(theme, `ui.${item}`, u[item], surface, u[surface], r.nonTextContrast));
  const term = terminalText(theme);
  contrastRows.push(row(theme, "terminal.foreground", term.foreground, "background", u.background, r.textContrast));
  contrastRows.push(row(theme, "terminal.foreground", term.foreground, "selection", u.selection, r.textContrast));
  contrastRows.push(row(theme, "terminal.cursor", term.cursor, "background", u.background, r.nonTextContrast));

  const terminalRows = theme.terminal.ansi.map((colour, i) => {
    if (theme.terminal.backgroundRole.includes(i)) {
      // a background role colour sits under text, so the text is measured on it instead
      const measured = row(theme, `ansi.${i}`, term.foreground, `ansi.${i}`, colour, r.textContrast);
      return { ...measured, role: "background", colour, text: term.foreground };
    }
    const measured = row(theme, `ansi.${i}`, colour, "background", u.background, r.textContrast);
    return { ...measured, role: "text" };
  });

  // coloured program output must never blend into normal terminal text: each ANSI colour differs
  // from the default foreground in tone or, under every simulation, in OKLab; the slots that stand
  // for the default text by convention are listed in terminal.textRole and skipped
  const textRole = theme.terminal.textRole ?? [];
  const terminalTextRows = theme.terminal.ansi.flatMap((colour, i) => {
    if (textRole.includes(i) || theme.terminal.backgroundRole.includes(i)) return [];
    const toneDiff = Math.abs(tone(term.foreground) - tone(colour));
    const simulated = Object.fromEntries(
      ["normal", ...DEFICIENCIES.filter((d) => d !== "achromatopsia")].map((d) => [
        d,
        d === "normal" ? distance(term.foreground, colour) : distance(simulate(term.foreground, d), simulate(colour, d)),
      ]),
    );
    const pass = toneDiff >= r.toneStep || Object.values(simulated).every((v) => v >= r.deficiencyDistance);
    return [{ theme: theme.id, index: i, colour, foreground: term.foreground, toneDiff, simulated, pass }];
  });

  const pairRows = palette.pairs.map(({ pair: [a, b], lightness = false }) => {
    const ca = theme.syntax[a];
    const cb = theme.syntax[b];
    const sameStyle = styleOf(palette, a).join() === styleOf(palette, b).join();
    const toneDiff = Math.abs(tone(ca) - tone(cb));
    const simulated = Object.fromEntries(
      DEFICIENCIES.filter((d) => d !== "achromatopsia").map((d) => [d, distance(simulate(ca, d), simulate(cb, d))]),
    );
    const needsColour = sameStyle || lightness;
    const toneOk = !needsColour || toneDiff >= r.toneStep;
    const deficiencyOk = !needsColour || Object.values(simulated).every((v) => v >= r.deficiencyDistance);
    return { theme: theme.id, a, b, sameStyle, lightness, toneDiff, simulated, pass: toneOk && deficiencyOk };
  });

  const syntaxOnBackground = contrastRows.filter((x) => x.item.startsWith("syntax.") && x.on === "background");
  // the surfaces drawn over the background, which is what the second column of the tables reports
  const OVERLAYS = ["selection", "lineHighlight", "diffAddedBackground", "diffRemovedBackground"];
  const textRows = contrastRows.filter((x) => x.item.startsWith("syntax.") && OVERLAYS.includes(x.on));
  const lowest = (rows) => rows.reduce((m, x) => (x.ratio < m.ratio ? x : m));
  return {
    contrastRows,
    terminalRows,
    terminalTextRows,
    pairRows,
    lowestOnBackground: lowest(syntaxOnBackground),
    lowestText: lowest(textRows),
  };
}

export const measureAll = (palette) => palette.themes.map((t) => ({ theme: t, ...measureTheme(palette, t) }));
