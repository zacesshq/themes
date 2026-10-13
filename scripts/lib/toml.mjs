// parses the small TOML subset the generated files use: comments, [tables], quoted strings,
// numbers, booleans and arrays of strings; anything else is reported as an error
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
        node[key] ??= {};
        if (typeof node[key] !== "object") throw new Error(`${where}: ${key} is already a value`);
        return node[key];
      }, root);
      return;
    }
    const pair = /^([A-Za-z0-9_-]+)\s*=\s*(.+)$/.exec(line);
    if (!pair) throw new Error(`${where}: expected key = value`);
    const [, key, value] = pair;
    if (key in table) throw new Error(`${where}: ${key} is set twice`);
    table[key] = parseValue(value, where);
  });
  return root;
}

function parseValue(value, where) {
  if (/^"([^"\\]|\\.)*"$/.test(value)) return JSON.parse(value);
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value === "true" || value === "false") return value === "true";
  if (/^\[.*\]$/.test(value)) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    const items = inner.match(/"([^"\\]|\\.)*"/g) ?? [];
    if (items.join(",").replace(/\s/g, "") !== inner.replace(/\s/g, "").replace(/,$/, "")) throw new Error(`${where}: only arrays of strings are supported`);
    return items.map((s) => JSON.parse(s));
  }
  throw new Error(`${where}: unsupported value ${value}`);
}
