// a binary property list writer for the NSKeyedArchiver colour archives a Terminal.app profile
// carries; only the value kinds those archives use are written, so the build needs no dependency
const te = new TextEncoder();

export class UID { constructor(n) { this.n = n; } }

function flatten(root) {
  const objects = [];
  const add = (v) => {
    const i = objects.length;
    objects.push(v);
    if (Array.isArray(v)) v.forEach(add);
    else if (v && typeof v === "object" && !(v instanceof Uint8Array) && !(v instanceof UID)) {
      Object.keys(v).forEach(add);
      Object.values(v).forEach(add);
    }
    return i;
  };
  add(root);
  return objects;
}

const intBytes = (n, size) => {
  const out = new Uint8Array(size);
  for (let i = size - 1; i >= 0; i -= 1) { out[i] = n & 255; n = Math.floor(n / 256); }
  return out;
};
const lengthHeader = (marker, length) => {
  if (length < 15) return [marker | length];
  return [marker | 15, 0x10, ...intBytes(length, 1)];
};

export function bplist(root) {
  const objects = flatten(root);
  const index = (v) => objects.indexOf(v);
  const refSize = objects.length < 256 ? 1 : 2;
  const ref = (v) => [...intBytes(index(v), refSize)];
  const encode = (v) => {
    if (v === null) return [0x00];
    if (v === true) return [0x09];
    if (v === false) return [0x08];
    if (typeof v === "number") {
      if (Number.isInteger(v) && v >= 0 && v < 2 ** 32) return [0x12, ...intBytes(v, 4)];
      const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, v); return [0x23, ...b];
    }
    if (v instanceof UID) return [0x80, v.n];
    if (typeof v === "string") { const b = te.encode(v); return [...lengthHeader(0x50, b.length), ...b]; }
    if (v instanceof Uint8Array) return [...lengthHeader(0x40, v.length), ...v];
    if (Array.isArray(v)) return [...lengthHeader(0xa0, v.length), ...v.flatMap(ref)];
    const keys = Object.keys(v);
    return [...lengthHeader(0xd0, keys.length), ...keys.flatMap(ref), ...keys.flatMap((k) => ref(v[k]))];
  };
  const body = [];
  const offsets = [];
  let position = 8;
  for (const o of objects) {
    offsets.push(position);
    const bytes = encode(o);
    body.push(...bytes);
    position += bytes.length;
  }
  const offsetSize = position < 256 ? 1 : position < 65536 ? 2 : 4;
  const table = offsets.flatMap((o) => [...intBytes(o, offsetSize)]);
  const trailer = [0, 0, 0, 0, 0, 0, offsetSize, refSize, ...intBytes(objects.length, 8), ...intBytes(0, 8), ...intBytes(position, 8)];
  return new Uint8Array([...te.encode("bplist00"), ...body, ...table, ...trailer]);
}
