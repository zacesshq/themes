// the code sample drawn in every preview and on the website, split into tokens so each
// renderer colours exactly the same text; a bare string is drawn in the operator colour
export const SAMPLE = [
  { lang: "TypeScript", tokens: [["comment", "// read the page aloud at the reader's pace"]] },
  {
    lang: "TypeScript",
    tokens: [
      ["keyword", "export"], " ", ["keyword", "function"], " ", ["function", "speak"], "(",
      ["parameter", "page"], ": ", ["type", "Page"], ", ", ["parameter", "rate"], " = ",
      ["number", "1.25"], "): ", ["type", "string"], " {",
    ],
  },
  {
    lang: "TypeScript",
    highlight: true,
    tokens: [
      "  ", ["control", "if"], " (!", ["variable", "page"], ".", ["property", "text"], ") ",
      ["control", "return"], " ", ["string", '""'], ";",
    ],
  },
  {
    lang: "TypeScript",
    tokens: [
      "  ", ["control", "return"], " ", ["variable", "page"], ".", ["property", "text"], ".",
      ["function", "replace"], "(", ["regex", "/\\s+/g"], ", ", ["string", '" "'], ");",
    ],
  },
  { lang: "TypeScript", tokens: ["}"] },
  { lang: "Python", tokens: [] },
  {
    lang: "Python",
    tokens: [
      ["keyword", "def"], " ", ["function", "ratio"], "(", ["parameter", "hi"], ": ", ["type", "float"], ", ",
      ["parameter", "lo"], ": ", ["type", "float"], ") -> ", ["type", "float"], ":",
    ],
  },
  { lang: "Python", tokens: ["    ", ["string", '"""Return the WCAG contrast ratio."""']] },
  {
    lang: "Python",
    tokens: [
      "    ", ["control", "return"], " (", ["variable", "hi"], " + ", ["number", "0.05"], ") / (",
      ["variable", "lo"], " + ", ["number", "0.05"], ")",
    ],
  },
  { lang: "Rust", tokens: [] },
  {
    lang: "Rust",
    tokens: [
      ["keyword", "pub struct"], " ", ["type", "Profile"], " { ", ["property", "name"], ": ",
      ["type", "String"], ", ", ["property", "size"], ": ", ["type", "u8"], " }",
    ],
  },
  {
    lang: "Rust",
    tokens: [
      ["keyword", "let"], " ", ["variable", "floor"], ": ", ["type", "f64"], " = ", ["number", "7.0"], "; ",
      ["comment", "// WCAG AAA"],
    ],
  },
  { lang: "HTML", tokens: [] },
  {
    lang: "HTML",
    tokens: ["<", ["tag", "a"], " ", ["attribute", "href"], "=", ["string", '"/themes/"'], ">Code themes</", ["tag", "a"], ">"],
  },
  { lang: "Diff", tokens: [["added", "+ comments keep 7:1 contrast"]] },
  { lang: "Diff", tokens: [["removed", "- comments faded to grey"]] },
  { lang: "Diff", tokens: [["invalid", "let 7up = 1;"], " ", ["comment", "// invalid: underlined"]] },
];

// every renderer takes [token, text] pairs, so bare punctuation strings are given the operator token here
export const lineTokens = (line) => line.tokens.map((t) => (typeof t === "string" ? ["operator", t] : t));
