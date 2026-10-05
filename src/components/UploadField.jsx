'use client';
import { useRef, useState } from 'react';
import Icon from '@/components/Icon';

/** Ô tải tệp lên (ảnh/PDF/video). Giá trị URL được đưa vào input hidden `name`. */
export default function UploadField({ kind, name, nameLabel, defaultUrl = '', defaultName = '', label, hint, accept, onUploaded, maxSize, onBusyChange }) {
  const [url, setUrl] = useState(defaultUrl || '');
  const [fname, setFname] = useState(defaultName || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const input = useRef(null);

  async function upload(file) {
    if (!file) return;
    if (busy) return;
    if (maxSize && file.size > maxSize) { setErr(`Tệp tối đa ${Math.round(maxSize / 1024 / 1024)}MB.`); return; }
    setErr(''); setBusy(true);
    onBusyChange?.(true);
    const fd = new FormData();
    fd.append('file', file); fd.append('kind', kind);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Tải lên thất bại.');
      setUrl(data.url); setFname(data.name);
      onUploaded?.(data);
    } catch (e) { setErr(e.message); }
    setBusy(false);
    onBusyChange?.(false);
    if (input.current) input.current.value = '';
  }

  return (
    <div className="field">
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={url} />
      {nameLabel && <input type="hidden" name={nameLabel} value={fname} />}
      {url ? (
        <div className="row card" style={{ padding: 10, boxShadow: 'none' }}>
          {kind === 'IMAGE' && <div className="thumb"><img src={url} alt="" /></div>}
          {kind !== 'IMAGE' && <span className="avatar" style={{ borderRadius: 8 }}><Icon name={kind === 'PDF' ? 'file' : 'play'} size={18} /></span>}
          <div style={{ flex: 1, minWidth: 0 }}><div className="cell-title small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fname || url}</div><a className="xs" href={url} target="_blank" rel="noreferrer">Xem tệp</a></div>
          <button type="button" className="btn btn-sm" onClick={() => input.current?.click()} disabled={busy}>Thay</button>
          <button type="button" className="btn btn-sm btn-danger-outline" disabled={busy} onClick={() => { setUrl(''); setFname(''); onUploaded?.(null); }}>Xóa</button>
        </div>
      ) : (
        <div className="dropzone" role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files?.[0]); }}>
          {busy ? <><span className="spinner" /> Đang tải lên…</> : <><Icon name="upload" size={22} /><div>Nhấn để chọn tệp hoặc kéo thả vào đây</div></>}
        </div>
      )}
      <input ref={input} type="file" accept={accept} hidden onChange={(e) => upload(e.target.files?.[0])} />
      {hint && !err && <div className="field-hint">{hint}</div>}
      {err && <div className="field-error" role="alert">{err}</div>}
    </div>
  );
}
