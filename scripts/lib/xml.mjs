// a well-formedness check for the generated XML: every tag closes in order, attributes are
// quoted and the document has a single root; it does not validate against a schema
export function checkXml(text) {
  const stack = [];
  let roots = 0;
  let i = 0;
  const fail = (message) => {
    const line = text.slice(0, i).split("\n").length;
    throw new Error(`line ${line}: ${message}`);
  };
  while (i < text.length) {
    const lt = text.indexOf("<", i);
    if (lt < 0) {
      if (text.slice(i).trim() && !stack.length) fail("text outside the root element");
      break;
    }
    if (!stack.length && text.slice(i, lt).trim()) fail("text outside the root element");
    const chunk = text.slice(i, lt);
    if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(chunk)) fail("an unescaped ampersand");
    i = lt;
    if (text.startsWith("<!--", i)) {
      const end = text.indexOf("-->", i);
      if (end < 0) fail("an unclosed comment");
      if (text.slice(i + 4, end).includes("--")) fail("a comment containing --");
      i = end + 3;
    } else if (text.startsWith("<![CDATA[", i)) {
      const end = text.indexOf("]]>", i);
      if (end < 0) fail("an unclosed CDATA section");
      i = end + 3;
    } else if (text.startsWith("<?", i)) {
      const end = text.indexOf("?>", i);
      if (end < 0) fail("an unclosed processing instruction");
      i = end + 2;
    } else if (text.startsWith("<!DOCTYPE", i)) {
      const end = text.indexOf(">", i);
      if (end < 0) fail("an unclosed DOCTYPE");
      i = end + 1;
    } else {
      const end = text.indexOf(">", i);
      if (end < 0) fail("an unclosed tag");
      const tag = text.slice(i + 1, end);
      if (tag.startsWith("/")) {
        const name = tag.slice(1).trim();
        const open = stack.pop();
        if (open !== name) fail(`</${name}> closes <${open}>`);
      } else {
        const selfClosing = tag.endsWith("/");
        const body = selfClosing ? tag.slice(0, -1) : tag;
        const m = /^([A-Za-z_][\w.:-]*)((?:\s+[\w.:-]+\s*=\s*("[^"<]*"|'[^'<]*'))*)\s*$/.exec(body);
        if (!m) fail(`a malformed tag <${tag}>`);
        if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(m[2])) fail(`an unescaped ampersand in <${m[1]}>`);
        const names = [...m[2].matchAll(/([\w.:-]+)\s*=/g)].map((x) => x[1]);
        if (new Set(names).size !== names.length) fail(`a repeated attribute in <${m[1]}>`);
        if (!stack.length) roots += 1;
        if (!selfClosing) stack.push(m[1]);
      }
      i = end + 1;
    }
  }
  if (stack.length) fail(`<${stack.at(-1)}> is never closed`);
  if (roots !== 1) fail(`expected one root element, found ${roots}`);
}
