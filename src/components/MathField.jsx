'use client';
import { useEffect, useRef, useState } from 'react';
import { Rich } from './Rich';
import Icon from './Icon';

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
export default function MathField({ id, label, value, onChange, multiline = true, rows = 3, placeholder, compact = false, toolbar = true, hideLabel = false, allowImages = true, onUploadStateChange }) {
  const ref = useRef(null);
  const imageInput = useRef(null);
  const current = useRef({ value, onChange, onUploadStateChange });
  current.current = { value, onChange, onUploadStateChange };
  const mounted = useRef(true);
  const uploadLock = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [focused, setFocused] = useState(false);
  const [showTools, setShowTools] = useState(!compact);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; current.current.onUploadStateChange?.(id, false); };
  }, [id]);

  async function uploadImage(file) {
    if (!file || uploadLock.current) return;
    setImageError('');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { setImageError('Chọn ảnh JPG, PNG, WEBP hoặc GIF.'); return; }
    if (file.size > 4 * 1024 * 1024) { setImageError('Ảnh tối đa 4MB.'); return; }
    const start = ref.current?.selectionStart ?? current.current.value.length;
    const end = ref.current?.selectionEnd ?? start;
    const original = current.current.value;
    uploadLock.current = true;
    setUploading(true);
    current.current.onUploadStateChange?.(id, true);
    try {
      const data = new FormData(); data.append('file', file); data.append('kind', 'IMAGE');
      const response = await fetch('/api/upload', { method: 'POST', body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || 'Không tải được ảnh. Vui lòng thử lại.');
      if (!mounted.current) return;
      const latest = current.current.value;
      // If typing continued during upload, append instead of replacing that text.
      let from = latest === original ? start : latest.length;
      let to = latest === original ? end : latest.length;
      const enclosingMath = [...latest.matchAll(/\$\$[\s\S]*?\$\$|\$[^$\n]*?\$/g)].find(match => from > match.index && from < match.index + match[0].length);
      if (enclosingMath) from = to = enclosingMath.index + enclosingMath[0].length;
      const before = latest.slice(0, from);
      const separator = multiline ? '\n' : ' ';
      const snippet = `${before && !/\s$/.test(before) ? separator : ''}![Hình minh họa](${result.url})${separator}`;
      const next = before + snippet + latest.slice(to);
      current.current.onChange(next);
      requestAnimationFrame(() => { if (mounted.current && ref.current) { ref.current.focus(); ref.current.setSelectionRange(from + snippet.length, from + snippet.length); } });
    } catch (error) { if (mounted.current) setImageError(error.message); }
    finally {
      uploadLock.current = false;
      current.current.onUploadStateChange?.(id, false);
      if (mounted.current) setUploading(false);
      if (imageInput.current) imageInput.current.value = '';
    }
  }

  const images = [...String(value || '').matchAll(/!\[([^\]\n]*)\]\(([^)\s]+)\)/g)];
  const showPreview = Boolean(value && (/\$|\\|\n/.test(value) || images.length));

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
    <div className="math-field">
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
        onPaste={(e) => { if (!allowImages) return; const file = [...e.clipboardData.items].find(item => item.kind === 'file' && item.type.startsWith('image/'))?.getAsFile(); if (file) { e.preventDefault(); uploadImage(file); } }}
        onDragOver={(e) => { if (allowImages && e.dataTransfer.types.includes('Files')) e.preventDefault(); }}
        onDrop={(e) => { if (!allowImages || !e.dataTransfer.files.length) return; e.preventDefault(); uploadImage(e.dataTransfer.files[0]); }}
        spellCheck={false}
      />
      {allowImages && <div className="math-attachments">
        <button type="button" className="btn btn-sm" disabled={uploading} onMouseDown={e => e.preventDefault()} onClick={() => imageInput.current?.click()}>{uploading ? <span className="spinner" /> : <Icon name="image" size={16} />}{uploading ? 'Đang tải ảnh…' : 'Chèn ảnh'}</button>
        {!compact && <span className="field-hint">Ảnh tối đa 4MB. Có thể dán hoặc kéo thả ảnh vào ô nhập.</span>}
        {images.map((image, i) => <button key={`${image.index}-${i}`} type="button" className="btn btn-sm btn-ghost" aria-label={`Xóa ảnh ${i + 1}`} onClick={() => onChange(value.slice(0, image.index) + value.slice(image.index + image[0].length))}><Icon name="x" size={14} />Ảnh {i + 1}</button>)}
        <input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-label={`Ảnh cho ${label || 'nội dung'}`} hidden onChange={e => uploadImage(e.target.files?.[0])} />
      </div>}
      {imageError && <div className="field-error" role="alert">{imageError}</div>}
      {showPreview && <div className="math-preview" aria-label="Xem trước"><Rich text={value} /></div>}
      {value && !/\$/.test(value) && !value.includes('\\') && compact === false && <div className="field-hint mt-2">Mẹo: đặt công thức trong dấu $ … $, ví dụ <code>$x^2+1$</code>.</div>}
    </div>
  );
}
