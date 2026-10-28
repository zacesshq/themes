// every measurement the checks, the tables and the website data share, so a number in the
// README is always the number CI enforced
import { DEFICIENCIES, contrast, distance, luminance, oklab, ratio, simulate } from "./colour.mjs";
import { SELECTION_NEIGHBOURS, SELECTION_TEXT, TEXT_SURFACES, UI_TEXT, UI_NON_TEXT, styleOf, terminalText } from "./palette.mjs";

// tone is the cube root of relative luminance: the OKLab lightness of the grey with the same
// luminance, which is all a viewer with no colour vision has to go on
export const tone = (hex) => Math.cbrt(luminance(hex));

// Windows Terminal has no selected text setting: it draws selected text black or white, white
// when the selection's OKLab lightness is under 0.5 (ColorFix::GetLightness in AtlasEngine.cpp)
export const windowsSelectionText = (selection) => (oklab(selection)[0] < 0.5 ? "#ffffff" : "#000000");

// the smallest OKLab distance between two colours in normal vision and under each simulated
// colour vision deficiency
const SIMULATIONS = DEFICIENCIES.filter((d) => d !== "achromatopsia");
export const leastDistance = (a, b) => Math.min(distance(a, b), ...SIMULATIONS.map((d) => distance(simulate(a, d), simulate(b, d))));

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
    // the background only selection keeps each character's own colour, so the plain text keeps
    // the text floor over it and the syntax colours the selection floor
    const selectionFloor = token === "foreground" ? r.textContrast : r.selectionContrast;
    contrastRows.push(row(theme, `syntax.${token}`, colour, "selection", u.selection, selectionFloor));
  }
  for (const item of SELECTION_TEXT) contrastRows.push(row(theme, `selectionText.${item}`, u[item], "selection", u.selection, r.selectionContrast));
  for (const [item, surfaces] of UI_TEXT) {
    for (const surface of surfaces) contrastRows.push(row(theme, `ui.${item}`, u[item], surface, u[surface], r.textContrast));
  }
  for (const [item, surface] of UI_NON_TEXT) contrastRows.push(row(theme, `ui.${item}`, u[item], surface, u[surface], r.nonTextContrast));
  const term = terminalText(theme);
  contrastRows.push(row(theme, "terminal.foreground", term.foreground, "background", u.background, r.textContrast));
  // Zed's terminal draws the editor's background only selection under the terminal text
  contrastRows.push(row(theme, "terminal.foreground", term.foreground, "selection", u.selection, r.textContrast));
  contrastRows.push(row(theme, "terminal.cursor", term.cursor, "background", u.background, r.nonTextContrast));
  contrastRows.push(row(theme, "windowsTerminal.selectionText", windowsSelectionText(u.selectionStrong), "selectionStrong", u.selectionStrong, r.textContrast));

  // each selection colour stays apart from the fills it could be mistaken for
  const selectionRows = ["selection", "selectionStrong"].flatMap((item) => SELECTION_NEIGHBOURS.map((on) => {
    const value = leastDistance(u[item], u[on]);
    return { theme: theme.id, item, colour: u[item], on, background: u[on], distance: value, floor: r.selectionDistance, pass: value >= r.selectionDistance };
  }));

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
  // the surfaces drawn over the background and held to the text floor, which is what the third
  // column of the summary reports; the selection has a column of its own
  const OVERLAYS = ["listSelection", "lineHighlight", "diffAddedBackground", "diffRemovedBackground"];
  const textRows = contrastRows.filter((x) => x.item.startsWith("syntax.") && OVERLAYS.includes(x.on));
  const selectionTextRows = contrastRows.filter((x) => x.item.startsWith("syntax.") && x.item !== "syntax.foreground" && x.on === "selection");
  const lowest = (rows) => rows.reduce((m, x) => (x.ratio < m.ratio ? x : m));
  return {
    contrastRows,
    terminalRows,
    terminalTextRows,
    pairRows,
    selectionRows,
    lowestOnBackground: lowest(syntaxOnBackground),
    lowestText: lowest(textRows),
    lowestOnSelection: lowest(selectionTextRows),
  };
}

export const measureAll = (palette) => palette.themes.map((t) => ({ theme: t, ...measureTheme(palette, t) }));
