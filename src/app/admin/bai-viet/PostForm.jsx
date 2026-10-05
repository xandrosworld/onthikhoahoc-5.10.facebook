'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { savePostAction } from '@/app/actions/admin';
import { SubmitButton, Field, useToast } from '@/components/client-ui';
import UploadField from '@/components/UploadField';
import Icon from '@/components/Icon';
import { THEME_KEYS } from '@/components/Cover';
import { Prose } from '@/components/Rich';
import { CATEGORY_LABEL } from '@/lib/utils';

const TOOLS = [
  ['H2', '## ‸', 'Tiêu đề lớn'],
  ['H3', '### ‸', 'Tiêu đề nhỏ'],
  ['B', '**‸**', 'In đậm'],
  ['I', '*‸*', 'In nghiêng'],
  ['• Danh sách', '- ‸', 'Danh sách'],
  ['1. Số', '1. ‸', 'Danh sách đánh số'],
  ['❝ Trích', '> ‸', 'Trích dẫn / lưu ý'],
  ['Link', '[‸](https://)', 'Chèn liên kết'],
  ['$x$', '$‸$', 'Công thức trong dòng'],
  ['$$ $$', '\n$$\n‸\n$$\n', 'Công thức riêng dòng'],
  ['a⁄b', '$\\dfrac{‸}{}$', 'Phân số'],
  ['√', '$\\sqrt{‸}$', 'Căn'],
  ['∫', '$\\int_{a}^{b} ‸ \\, dx$', 'Tích phân'],
];

export default function PostForm({ post }) {
  const [state, action] = useFormState(savePostAction, null);
  const { push } = useToast();
  const e = state?.errors || {};
  const v = (k) => state?.values?.[k] ?? post?.[k] ?? '';
  const [content, setContent] = useState(v('content'));
  const [tab, setTab] = useState('edit');
  const [uploading, setUploading] = useState(false);
  const ta = useRef(null);
  const imgInput = useRef(null);

  function insert(tpl) {
    const el = ta.current; if (!el) return;
    const s = el.selectionStart, en = el.selectionEnd;
    const sel = content.slice(s, en);
    let t = tpl.includes('‸') ? tpl.replace('‸', sel) : tpl;
    const off = tpl.includes('‸') ? tpl.indexOf('‸') + (sel ? sel.length : 0) : t.length;
    const next = content.slice(0, s) + t + content.slice(en);
    setContent(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + off, s + off); });
  }

  async function addImage(file) {
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append('file', file); fd.append('kind', 'IMAGE');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      insert(`\n![${file.name.replace(/\.[^.]+$/, '')}](${data.url})\n`);
      push('Đã chèn hình ảnh.');
    } catch (err) { push(err.message || 'Tải ảnh thất bại.', 'error'); }
    setUploading(false);
    if (imgInput.current) imgInput.current.value = '';
  }

  return (
    <form action={action} noValidate>
      <input type="hidden" name="id" value={post?.id || ''} />
      {Object.keys(e).length > 0 && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} />Vui lòng kiểm tra lại các trường được đánh dấu.</div>}
      <div className="grid split">
        <div className="stack">
          <div className="card card-pad">
            <Field id="title" label="Tiêu đề" required error={e.title}><input id="title" name="title" className="input" style={{ fontSize: '1.1rem', fontWeight: 600 }} defaultValue={v('title')} aria-invalid={!!e.title} /></Field>
            <Field id="excerpt" label="Tóm tắt" hint="Hiển thị ở danh sách bài viết. Bỏ trống để tự lấy từ nội dung."><textarea id="excerpt" name="excerpt" className="textarea" style={{ minHeight: 64 }} defaultValue={v('excerpt')} maxLength={300} /></Field>
            <div className="field" style={{ marginBottom: 0 }}>
              <div className="row between mb-2"><label htmlFor="content">Nội dung <span className="req">*</span></label>
                <div className="tabs" style={{ margin: 0, border: 0 }} role="tablist">
                  <button type="button" role="tab" aria-selected={tab === 'edit'} className={`tab ${tab === 'edit' ? 'active' : ''}`} onClick={() => setTab('edit')}>Soạn thảo</button>
                  <button type="button" role="tab" aria-selected={tab === 'preview'} className={`tab ${tab === 'preview' ? 'active' : ''}`} onClick={() => setTab('preview')}>Xem trước</button>
                </div>
              </div>
              <div style={{ display: tab === 'edit' ? 'block' : 'none' }}>
                <div className="editor-toolbar" role="toolbar" aria-label="Định dạng">
                  {TOOLS.map(([l, t, title]) => <button key={title} type="button" title={title} aria-label={title} onClick={() => insert(t)}>{l}</button>)}
                  <span className="sep" />
                  <button type="button" onClick={() => imgInput.current?.click()} disabled={uploading}><Icon name="image" size={16} /> {uploading ? 'Đang tải…' : 'Chèn ảnh'}</button>
                  <input ref={imgInput} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={(ev) => addImage(ev.target.files?.[0])} />
                </div>
                <textarea ref={ta} id="content" name="content" className="textarea editor-area" value={content} onChange={(ev) => setContent(ev.target.value)} aria-invalid={!!e.content} spellCheck={false} />
              </div>
              {tab === 'preview' && <div className="preview-pane"><input type="hidden" name="content" value={content} />{content.trim() ? <Prose text={content} /> : <p className="muted">Chưa có nội dung.</p>}</div>}
              {e.content && <div className="field-error mt-2" role="alert">{e.content}</div>}
              <div className="field-hint mt-2">Hỗ trợ Markdown cơ bản và công thức: <code>$x^2$</code> (trong dòng), <code>$$ … $$</code> (riêng dòng).</div>
            </div>
          </div>
        </div>
        <div className="stack">
          <div className="card card-pad">
            <Field id="status" label="Trạng thái"><select id="status" name="status" className="select" defaultValue={v('status') || 'PUBLISHED'}><option value="PUBLISHED">Đăng công khai</option><option value="DRAFT">Bản nháp</option></select></Field>
            <Field id="category" label="Loại bài"><select id="category" name="category" className="select" defaultValue={v('category') || 'TAI_LIEU'}>{Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <UploadField kind="IMAGE" name="coverUrl" label="Ảnh đại diện" defaultUrl={v('coverUrl')} accept="image/jpeg,image/png,image/webp" hint="Tối đa 5MB. Bỏ trống để dùng ảnh mặc định." />
            <Field id="theme" label="Màu ảnh mặc định"><select id="theme" name="theme" className="select" defaultValue={v('theme') || 'indigo'}>{THEME_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}</select></Field>
          </div>
          <div className="card card-pad">
            <h4>Tài liệu PDF</h4>
            <UploadField kind="PDF" name="pdfUrl" nameLabel="pdfName" label="Tệp PDF đính kèm" defaultUrl={v('pdfUrl')} defaultName={v('pdfName')} accept="application/pdf" hint="Tối đa 20MB. Người đọc có thể xem trực tiếp hoặc tải về." />
          </div>
          <div className="card card-pad">
            <h4>Video</h4>
            <Field id="videoUrl" label="Liên kết video (YouTube / Vimeo) hoặc tệp đã tải lên" error={e.videoUrl}>
              <VideoField defaultValue={v('videoUrl')} error={!!e.videoUrl} />
            </Field>
          </div>
        </div>
      </div>
      <div className="sticky-save"><SubmitButton><Icon name="save" size={18} />Lưu bài viết</SubmitButton><Link href="/admin/bai-viet" className="btn">Hủy</Link></div>
    </form>
  );
}

function VideoField({ defaultValue, error }) {
  const [url, setUrl] = useState(defaultValue || '');
  return (
    <>
      <input id="videoUrl" name="videoUrl" className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" aria-invalid={error} />
      <UploadField kind="VIDEO" name="_videoFile" label="Hoặc tải video lên (MP4/WEBM, tối đa 80MB)" accept="video/mp4,video/webm" onUploaded={(d) => setUrl(d ? d.url : '')} hint="Khuyến nghị dùng YouTube (không liệt kê) để video tải nhanh và tiết kiệm dung lượng hosting." />
    </>
  );
}
