import katex from 'katex';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderMath(tex, display = false) {
  try {
    return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html', trust: false });
  } catch {
    return `<code>${esc(tex)}</code>`;
  }
}

/** Tách văn bản thành các đoạn text / math: $...$ (inline), $$...$$ (block). */
export function splitMath(text) {
  const src = String(text ?? '');
  const out = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0, m;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ t: 'text', v: src.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: 'block', v: m[1] });
    else out.push({ t: 'inline', v: m[2] });
    last = re.lastIndex;
  }
  if (last < src.length) out.push({ t: 'text', v: src.slice(last) });
  return out;
}

/** Văn bản thường (đề thi) + công thức → HTML an toàn. Xuống dòng được giữ nguyên. */
export function renderRichInline(text) {
  return splitMath(text)
    .map((p) => (p.t === 'text' ? esc(p.v).replace(/\n/g, '<br/>') : p.t === 'block' ? `<div class="math-block">${renderMath(p.v, true)}</div>` : renderMath(p.v, false)))
    .join('');
}

const safeUrl = (u) => (/^(https?:\/\/|\/|mailto:)/i.test(u) ? u : '#');
const safeImg = (u) => (/^(https?:\/\/|\/api\/files\/|\/)/i.test(u) ? u : '');

function inline(s, tokens) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => {
    const u = safeImg(url.replace(/&amp;/g, '&'));
    return u ? `<img src="${u}" alt="${alt}" loading="lazy"/>` : '';
  });
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) => {
    const u = safeUrl(url.replace(/&amp;/g, '&'));
    return `<a href="${u}" target="_blank" rel="noopener noreferrer">${txt}</a>`;
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  t = t.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[Number(i)]);
  return t;
}

/** Markdown rút gọn + KaTeX → HTML. Mọi HTML thô đều bị escape. */
export function renderMarkdown(md) {
  const tokens = [];
  let src = String(md ?? '').replace(/\r\n/g, '\n');
  src = src.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (_, b, i) => {
    tokens.push(b !== undefined ? `<div class="katex-display-wrap">${renderMath(b, true)}</div>` : renderMath(i, false));
    return `\u0000${tokens.length - 1}\u0000`;
  });
  const lines = src.split('\n');
  const html = [];
  let list = null, para = [];
  const flushPara = () => { if (para.length) { html.push(`<p>${inline(para.join('<br/>'.replace('<br/>', '\n')).replace(/\n/g, '<br/>'), tokens)}</p>`); para = []; } };
  const flushList = () => { if (list) { html.push(`<${list.t}>${list.items.map((x) => `<li>${inline(x, tokens)}</li>`).join('')}</${list.t}>`); list = null; } };
  for (const line of lines) {
    let m;
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { flushPara(); flushList(); const n = m[1].length + 1; html.push(`<h${n}>${inline(m[2], tokens)}</h${n}>`); continue; }
    if ((m = line.match(/^>\s?(.*)$/))) { flushPara(); flushList(); html.push(`<blockquote>${inline(m[1], tokens)}</blockquote>`); continue; }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { flushPara(); if (!list || list.t !== 'ul') { flushList(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { flushPara(); if (!list || list.t !== 'ol') { flushList(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    if (/^---+$/.test(line.trim())) { flushPara(); flushList(); html.push('<hr/>'); continue; }
    flushList();
    para.push(line);
  }
  flushPara(); flushList();
  return html.join('\n');
}
