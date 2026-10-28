// the markdown tables build.mjs writes into README.md and ACCESSIBILITY.md
import { contrast } from "./colour.mjs";
import { measureAll } from "./measure.mjs";
import { ANSI_NAMES, UI_NON_TEXT, UI_TEXT, styleOf } from "./palette.mjs";

// one decimal place, floored, so a printed 7.0:1 is never really 6.96:1
const floor1 = (n) => Math.floor(n * 10) / 10;
const r1 = (n) => `${floor1(n).toFixed(1)}:1`;
const floor3 = (n) => (Math.floor(n * 1000) / 1000).toFixed(3);

export function contrastTables(palette) {
  const all = measureAll(palette);
  // the surfaces a lowest ratio was measured on, named as a reader sees them
  const SURFACE_NAMES = {
    listSelection: "a selected row",
    lineHighlight: "the current line",
    diffAddedBackground: "an added line",
    diffRemovedBackground: "a removed line",
    findMatch: "a find match",
    background: "the background",
  };
  const name = (x) => x.item.replace("syntax.", "");
  const find = (rows, item, on) => rows.find((x) => x.item === item && (!on || x.on === on));
  const summary = [
    "| Theme | Text on background | Lowest syntax colour on background | Lowest syntax colour over the current line, a diff or a selected row | Selection |",
    "| --- | --- | --- | --- | --- |",
    ...all.map(({ theme, contrastRows, lowestOnBackground, lowestText, lowestOnSelection }) => {
      const u = theme.ui;
      const text = find(contrastRows, "syntax.foreground", "background");
      const strong = find(contrastRows, "ui.selectionForeground");
      const selection = `\`${u.selectionForeground}\` on \`${u.selectionStrong}\`, ${r1(strong.ratio)}; background only \`${u.selection}\`, syntax ${r1(lowestOnSelection.ratio)} (${name(lowestOnSelection)})`;
      return `| ${theme.name} | \`${u.foreground}\` on \`${u.background}\`, ${r1(text.ratio)} | ${r1(lowestOnBackground.ratio)} (${name(lowestOnBackground)}) | ${r1(lowestText.ratio)} (${name(lowestText)} on ${SURFACE_NAMES[lowestText.on]}) | ${selection} |`;
    }),
  ].join("\n");

  const tokens = Object.keys(palette.themes[0].syntax);
  const detail = [
    "Each cell gives the colour, its contrast on the background, its lowest contrast over the current line, a diff background or a selected row and its contrast over the background only selection.",
    "",
    `| Token | Style | ${all.map(({ theme }) => theme.name).join(" | ")} |`,
    `| --- | --- | ${all.map(() => "---").join(" | ")} |`,
    ...tokens.map((token) => {
      const style = token === "foreground" ? "" : styleOf(palette, token).join(", ");
      const cells = all.map(({ contrastRows }) => {
        const rows = contrastRows.filter((x) => x.item === `syntax.${token}`);
        const bg = rows.find((x) => x.on === "background");
        const overlays = ["listSelection", "lineHighlight", "diffAddedBackground", "diffRemovedBackground"];
        const low = Math.min(...rows.filter((x) => overlays.includes(x.on)).map((x) => x.ratio));
        const selected = rows.find((x) => x.on === "selection");
        return `\`${bg.colour}\` ${r1(bg.ratio)}, ${r1(low)}, ${r1(selected.ratio)}`;
      });
      return `| ${token} | ${style || "regular"} | ${cells.join(" | ")} |`;
    }),
  ].join("\n");

  // the selection in each kind of editor, with the floors the checks hold it to
  const r = palette.rules;
  const selectionRow = (label, floor, cell) => `| ${label} | ${floor} | ${all.map(cell).join(" | ")} |`;
  const selection = [
    `| Measure | Floor | ${all.map(({ theme }) => theme.name).join(" | ")} |`,
    `| --- | --- | ${all.map(() => "---").join(" | ")} |`,
    selectionRow("Selected text on the selection block", `${r.textContrast}:1`, ({ theme, contrastRows }) =>
      `\`${theme.ui.selectionForeground}\` on \`${theme.ui.selectionStrong}\`, ${r1(find(contrastRows, "ui.selectionForeground").ratio)}`),
    selectionRow("The block on the background", `${r.nonTextContrast}:1`, ({ contrastRows }) => r1(find(contrastRows, "ui.selectionStrong").ratio)),
    selectionRow("Windows Terminal's own black or white text on the block", `${r.textContrast}:1`, ({ contrastRows }) => {
      const x = find(contrastRows, "windowsTerminal.selectionText");
      return `\`${x.colour}\` ${r1(x.ratio)}`;
    }),
    selectionRow("Background only selection on the background", "none, explained below", ({ theme }) =>
      `\`${theme.ui.selection}\` ${r1(contrast(theme.ui.selection, theme.ui.background))}`),
    selectionRow("Lowest syntax colour over it", `${r.selectionContrast}:1`, ({ lowestOnSelection }) => `${r1(lowestOnSelection.ratio)} (${name(lowestOnSelection)})`),
    selectionRow("Plain text over it", `${r.textContrast}:1`, ({ contrastRows }) => r1(find(contrastRows, "syntax.foreground", "selection").ratio)),
    selectionRow("Muted text and links over it", `${r.selectionContrast}:1`, ({ contrastRows }) =>
      r1(Math.min(...contrastRows.filter((x) => x.item.startsWith("selectionText.")).map((x) => x.ratio)))),
    selectionRow("Closest fill, least OKLab distance in normal vision and the three simulations", `${r.selectionDistance}`, ({ selectionRows }) => {
      const x = selectionRows.reduce((m, y) => (y.distance < m.distance ? y : m));
      return `${floor3(x.distance)} (${x.item === "selection" ? "background only selection" : "selection block"} and ${SURFACE_NAMES[x.on]})`;
    }),
  ].join("\n");

  const terminal = [
    `| Colour | ${all.map(({ theme }) => theme.name).join(" | ")} |`,
    `| --- | ${all.map(() => "---").join(" | ")} |`,
    ...ANSI_NAMES.map((name, i) => {
      const cells = all.map(({ terminalRows }) => {
        const t = terminalRows[i];
        return t.role === "background"
          ? `\`${t.colour}\` background shade, text on it ${r1(t.ratio)}`
          : `\`${t.colour}\` ${r1(t.ratio)}`;
      });
      return `| ${i} ${name} | ${cells.join(" | ")} |`;
    }),
  ].join("\n");

  const uiItems = [...UI_TEXT.map(([item]) => item), ...[...new Set(UI_NON_TEXT.map(([item]) => item))]];
  const ui = [
    "Each cell gives the colour and its lowest contrast on the surfaces it is drawn on.",
    "",
    `| Interface colour | Floor | ${all.map(({ theme }) => theme.name).join(" | ")} |`,
    `| --- | --- | ${all.map(() => "---").join(" | ")} |`,
    ...uiItems.map((item) => {
      const cells = all.map(({ contrastRows }) => {
        const rows = contrastRows.filter((x) => x.item === `ui.${item}`);
        return `\`${rows[0].colour}\` ${r1(Math.min(...rows.map((x) => x.ratio)))}`;
      });
      const floor = all[0].contrastRows.find((x) => x.item === `ui.${item}`).floor;
      return `| ${item} | ${floor}:1 | ${cells.join(" | ")} |`;
    }),
  ].join("\n");

  const kinds = ["protanopia", "deuteranopia", "tritanopia"];
  const vision = [
    `| Measure | Floor | ${all.map(({ theme }) => theme.name).join(" | ")} |`,
    `| --- | --- | ${all.map(() => "---").join(" | ")} |`,
    (() => {
      const cells = all.map(({ pairRows }) => {
        const p = pairRows.filter((x) => x.sameStyle || x.lightness).reduce((m, x) => (x.toneDiff < m.toneDiff ? x : m));
        return `${floor3(p.toneDiff)} (${p.a} and ${p.b})`;
      });
      return `| Closest tone | ${palette.rules.toneStep} | ${cells.join(" | ")} |`;
    })(),
    ...kinds.map((kind) => {
      const cells = all.map(({ pairRows }) => {
        const p = pairRows.filter((x) => x.sameStyle || x.lightness).reduce((m, x) => (x.simulated[kind] < m.simulated[kind] ? x : m));
        return `${floor3(p.simulated[kind])} (${p.a} and ${p.b})`;
      });
      return `| Closest OKLab distance, ${kind} | ${palette.rules.deficiencyDistance} | ${cells.join(" | ")} |`;
    }),
  ].join("\n");

  return { summary, detail, selection, terminal, ui, vision };
}
