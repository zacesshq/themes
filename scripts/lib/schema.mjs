// a small JSON Schema validator covering only the keywords palette/schema.json uses, so the
// checks need no dependency; an unsupported keyword fails loudly rather than passing silently

const SUPPORTED = new Set([
  "$schema", "$id", "$defs", "$ref", "title", "description", "type", "required", "properties",
  "additionalProperties", "items", "minItems", "maxItems", "enum", "pattern", "minimum", "maximum",
]);

function typeOf(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

export function validate(root, value) {
  const errors = [];
  const resolve = (ref) => {
    if (!ref.startsWith("#/")) throw new Error(`unsupported $ref ${ref}`);
    return ref.slice(2).split("/").reduce((node, key) => node[key], root);
  };
  const walk = (schema, v, path) => {
    for (const key of Object.keys(schema)) {
      if (!SUPPORTED.has(key)) throw new Error(`schema keyword ${key} is not supported by scripts/lib/schema.mjs`);
    }
    if (schema.$ref) return walk(resolve(schema.$ref), v, path);
    if (schema.type) {
      const actual = typeOf(v);
      const ok = actual === schema.type || (schema.type === "number" && actual === "integer");
      if (!ok) return errors.push(`${path}: expected ${schema.type}, found ${actual}`);
    }
    if (schema.enum && !schema.enum.includes(v)) errors.push(`${path}: ${JSON.stringify(v)} is not one of ${schema.enum.join(", ")}`);
    if (schema.pattern && typeof v === "string" && !new RegExp(schema.pattern).test(v)) errors.push(`${path}: ${v} does not match ${schema.pattern}`);
    if (schema.minimum !== undefined && typeof v === "number" && v < schema.minimum) errors.push(`${path}: ${v} is below ${schema.minimum}`);
    if (schema.maximum !== undefined && typeof v === "number" && v > schema.maximum) errors.push(`${path}: ${v} is above ${schema.maximum}`);
    if (Array.isArray(v)) {
      if (schema.minItems !== undefined && v.length < schema.minItems) errors.push(`${path}: needs at least ${schema.minItems} items`);
      if (schema.maxItems !== undefined && v.length > schema.maxItems) errors.push(`${path}: allows at most ${schema.maxItems} items`);
      if (schema.items) v.forEach((item, i) => walk(schema.items, item, `${path}[${i}]`));
    }
    if (typeOf(v) === "object") {
      for (const key of schema.required ?? []) if (!(key in v)) errors.push(`${path}: missing ${key}`);
      for (const [key, item] of Object.entries(v)) {
        if (schema.properties && key in schema.properties) walk(schema.properties[key], item, `${path}.${key}`);
        else if (schema.additionalProperties === false) errors.push(`${path}: unexpected key ${key}`);
        else if (typeof schema.additionalProperties === "object") walk(schema.additionalProperties, item, `${path}.${key}`);
      }
    }
  };
  walk(root, value, "palette");
  return errors;
}
