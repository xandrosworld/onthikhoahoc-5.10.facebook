/** Locate dollar-delimited math, including empty formulas created by the toolbar. */
export function mathRangeAt(value, start, end = start) {
  const re = /((?<!\\)\$\$[\s\S]*?(?<!\\)\$\$)|(?<![\\$])\$(?:\\.|[^$\n])*?(?<!\\)\$(?!\$)/g;
  for (const match of value.matchAll(re)) {
    const width = match[1] ? 2 : 1;
    const from = match.index + width;
    const to = match.index + match[0].length - width;
    if (start >= from && end <= to) return { from, to, end: to + width };
  }
  return null;
}

export function insertMath(value, start, end, snippet, wrap) {
  const selected = value.slice(start, end);
  let text = selected ? snippet.replace('‸', selected) : snippet;
  let cursor = text.indexOf('‸');
  text = text.replace('‸', '');
  if (!mathRangeAt(value, start, end)) {
    const delimiter = wrap === 'block' ? '$$' : '$';
    text = delimiter + text + delimiter;
    if (cursor >= 0) cursor += delimiter.length;
  }
  return {
    value: value.slice(0, start) + text + value.slice(end),
    cursor: start + (cursor >= 0 ? cursor : text.length),
  };
}
