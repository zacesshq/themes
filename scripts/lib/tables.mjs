// the markdown tables build.mjs writes into README.md and ACCESSIBILITY.md
import { measureAll } from "./measure.mjs";
import { ANSI_NAMES, UI_NON_TEXT, UI_TEXT, styleOf } from "./palette.mjs";

// one decimal place, floored, so a printed 7.0:1 is never really 6.96:1
const floor1 = (n) => Math.floor(n * 10) / 10;
const r1 = (n) => `${floor1(n).toFixed(1)}:1`;
const floor3 = (n) => (Math.floor(n * 1000) / 1000).toFixed(3);

export function contrastTables(palette) {
  const all = measureAll(palette);
  const summary = [
    "| Theme | Text on background | Lowest syntax colour on background | Lowest syntax colour over the selection, current line or a diff |",
    "| --- | --- | --- | --- |",
    ...all.map(({ theme, contrastRows, lowestOnBackground, lowestText }) => {
      const text = contrastRows.find((x) => x.item === "syntax.foreground" && x.on === "background");
      const name = (x) => x.item.replace("syntax.", "");
      return `| ${theme.name} | \`${theme.ui.foreground}\` on \`${theme.ui.background}\`, ${r1(text.ratio)} | ${r1(lowestOnBackground.ratio)} (${name(lowestOnBackground)}) | ${r1(lowestText.ratio)} (${name(lowestText)} on ${lowestText.on}) |`;
    }),
  ].join("\n");

  const tokens = Object.keys(palette.themes[0].syntax);
  const detail = [
    "Each cell gives the colour, its contrast on the background and its lowest contrast over the selection, the current line or a diff background.",
    "",
    `| Token | Style | ${all.map(({ theme }) => theme.name).join(" | ")} |`,
    `| --- | --- | ${all.map(() => "---").join(" | ")} |`,
    ...tokens.map((token) => {
      const style = token === "foreground" ? "" : styleOf(palette, token).join(", ");
      const cells = all.map(({ contrastRows }) => {
        const rows = contrastRows.filter((x) => x.item === `syntax.${token}`);
        const bg = rows.find((x) => x.on === "background");
        const overlays = ["selection", "lineHighlight", "diffAddedBackground", "diffRemovedBackground"];
        const low = Math.min(...rows.filter((x) => overlays.includes(x.on)).map((x) => x.ratio));
        return `\`${bg.colour}\` ${r1(bg.ratio)}, ${r1(low)}`;
      });
      return `| ${token} | ${style || "regular"} | ${cells.join(" | ")} |`;
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

  return { summary, detail, terminal, ui, vision };
}
