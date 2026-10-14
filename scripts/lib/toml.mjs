// parses the small TOML subset the generated files use: comments, [tables], bare or quoted keys,
// quoted strings, numbers, booleans, arrays and inline tables; anything else is reported as an error
export function parseToml(text) {
  const root = {};
  let table = root;
  const headers = new Set();
  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    const where = `line ${i + 1}`;
    if (!line || line.startsWith("#")) return;
    const header = /^\[([A-Za-z0-9_.-]+)\]$/.exec(line);
    if (header) {
      if (headers.has(header[1])) throw new Error(`${where}: [${header[1]}] appears twice`);
      headers.add(header[1]);
      table = header[1].split(".").reduce((node, key) => {
        if (!Object.hasOwn(node, key)) node[key] = {};
        if (typeof node[key] !== "object") throw new Error(`${where}: ${key} is already a value`);
        return node[key];
      }, root);
      return;
    }
    const cursor = { text: line, at: 0, where };
    const key = readKey(cursor);
    skipSpace(cursor);
    if (cursor.text[cursor.at] !== "=") throw new Error(`${where}: expected key = value`);
    cursor.at += 1;
    if (Object.hasOwn(table, key)) throw new Error(`${where}: ${key} is set twice`);
    table[key] = readValue(cursor);
    skipSpace(cursor);
    if (cursor.at !== line.length) throw new Error(`${where}: unexpected text after the value: ${line.slice(cursor.at)}`);
  });
  return root;
}

function skipSpace(c) {
  while (c.text[c.at] === " " || c.text[c.at] === "\t") c.at += 1;
}

function readString(c) {
  const match = /^"([^"\\]|\\.)*"/.exec(c.text.slice(c.at));
  if (!match) throw new Error(`${c.where}: an unterminated string`);
  c.at += match[0].length;
  return JSON.parse(match[0]);
}

function readKey(c) {
  skipSpace(c);
  if (c.text[c.at] === "\"") return readString(c);
  const match = /^[A-Za-z0-9_-]+/.exec(c.text.slice(c.at));
  if (!match) throw new Error(`${c.where}: expected key = value`);
  c.at += match[0].length;
  return match[0];
}

// a list of items between an opening and a closing bracket, separated by commas; a trailing comma
// is allowed in arrays only, as in TOML itself
function readList(c, close, item, trailing) {
  c.at += 1;
  skipSpace(c);
  if (c.text[c.at] === close) { c.at += 1; return; }
  for (;;) {
    item();
    skipSpace(c);
    const ch = c.text[c.at];
    if (ch === close) { c.at += 1; return; }
    if (ch !== ",") throw new Error(`${c.where}: expected a comma or ${close}`);
    c.at += 1;
    skipSpace(c);
    if (trailing && c.text[c.at] === close) { c.at += 1; return; }
  }
}

function readValue(c) {
  skipSpace(c);
  const rest = c.text.slice(c.at);
  if (rest.startsWith("\"")) return readString(c);
  if (rest.startsWith("[")) {
    const out = [];
    readList(c, "]", () => out.push(readValue(c)), true);
    return out;
  }
  if (rest.startsWith("{")) {
    const out = {};
    readList(c, "}", () => {
      const key = readKey(c);
      skipSpace(c);
      if (c.text[c.at] !== "=") throw new Error(`${c.where}: expected = after ${key}`);
      c.at += 1;
      if (Object.hasOwn(out, key)) throw new Error(`${c.where}: ${key} is set twice`);
      out[key] = readValue(c);
    }, false);
    return out;
  }
  const scalar = /^(-?\d+(\.\d+)?|true|false)(?=[\s,\]}]|$)/.exec(rest);
  if (!scalar) throw new Error(`${c.where}: unsupported value ${rest}`);
  c.at += scalar[0].length;
  return scalar[1] === "true" ? true : scalar[1] === "false" ? false : Number(scalar[1]);
}
