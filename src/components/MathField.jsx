'use client';
import { useRef, useState } from 'react';
import { Rich } from './Rich';

const SNIPPETS = [
  ['x²', 'x^{‸}', 'Số mũ'],
  ['xₙ', 'x_{‸}', 'Chỉ số dưới'],
  ['a/b', '\\dfrac{‸}{}', 'Phân số'],
  ['√', '\\sqrt{‸}', 'Căn bậc hai'],
  ['ⁿ√', '\\sqrt[n]{‸}', 'Căn bậc n'],
  ['∫', '\\int_{a}^{b} ‸ \\, dx', 'Tích phân'],
  ['lim', '\\lim_{x \\to ‸}', 'Giới hạn'],
  ['Σ', '\\sum_{i=1}^{n} ‸', 'Tổng'],
  ['ma trận', '\\begin{pmatrix} ‸ & \\\\ & \\end{pmatrix}', 'Ma trận 2×2'],
  ['hệ', '\\begin{cases} ‸ \\\\ \\end{cases}', 'Hệ phương trình'],
  ['≤', '\\le ', 'Nhỏ hơn hoặc bằng'],
  ['≥', '\\ge ', 'Lớn hơn hoặc bằng'],
  ['≠', '\\ne ', 'Khác'],
  ['π', '\\pi ', 'Pi'],
  ['∞', '\\infty ', 'Vô cực'],
  ['∈', '\\in ', 'Thuộc'],
  ['→', '\\to ', 'Mũi tên'],
  ['α', '\\alpha ', 'Alpha'],
  ['Δ', '\\Delta ', 'Delta'],
  ['sin', '\\sin ', 'sin'],
  ['log', '\\log_{‸}', 'Logarit'],
  ["f′", "f'(x)", 'Đạo hàm'],
  ['vec', '\\overrightarrow{‸}', 'Vectơ'],
  ['°', '^\\circ', 'Độ'],
];

/** Ô nhập có thanh công cụ công thức LaTeX + xem trước trực tiếp. */
export default function MathField({ id, label, value, onChange, multiline = true, rows = 3, placeholder, compact = false, toolbar = true, hideLabel = false }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  const [showTools, setShowTools] = useState(!compact);

  function insert(snippet, wrap) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const before = value.slice(0, start);
    const sel = value.slice(start, end);
    const insideMath = ((before.replace(/\$\$/g, '').match(/\$/g) || []).length % 2) === 1;
    let text = snippet;
    const caret = text.indexOf('‸');
    if (caret >= 0 && sel) text = text.replace('‸', sel);
    let cursorOffset = text.indexOf('‸');
    text = text.replace('‸', '');
    if (wrap || !insideMath) {
      if (wrap === 'block') { text = `$$${text}$$`; cursorOffset = cursorOffset >= 0 ? cursorOffset + 2 : -1; }
      else { text = `$${text}$`; cursorOffset = cursorOffset >= 0 ? cursorOffset + 1 : -1; }
    }
    const next = before + text + value.slice(end);
    onChange(next);
    const pos = cursorOffset >= 0 ? start + cursorOffset : start + text.length;
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(pos, pos); });
  }

  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div>
      {label && <label htmlFor={id} className={hideLabel ? 'sr-only' : 'label'} style={{ display: 'block', marginBottom: 6 }}>{label}</label>}
      {toolbar && (showTools || focused) && (
        <div className="math-bar" role="toolbar" aria-label="Chèn công thức">
          <button type="button" onClick={() => insert('‸', 'inline')} title="Công thức trong dòng: $...$"><b>$ $</b></button>
          <button type="button" onClick={() => insert('‸', 'block')} title="Công thức riêng dòng: $$...$$"><b>$$</b></button>
          {SNIPPETS.map(([l, s, t]) => <button key={t} type="button" title={t} aria-label={t} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(s)}>{l}</button>)}
        </div>
      )}
      <Tag
        ref={ref} id={id} className={multiline ? 'textarea' : 'input'} {...(multiline ? { rows } : { type: 'text' })}
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => { setFocused(true); setShowTools(true); }} onBlur={() => setFocused(false)}
        spellCheck={false}
      />
      {value && /\$|\\\\|\n/.test(value) || (value && value.includes('\\')) ? <div className="math-preview" aria-label="Xem trước"><Rich text={value} /></div> : null}
      {value && !/\$/.test(value) && !value.includes('\\') && compact === false && <div className="field-hint mt-2">Mẹo: đặt công thức trong dấu $ … $, ví dụ <code>$x^2+1$</code>.</div>}
    </div>
  );
}
