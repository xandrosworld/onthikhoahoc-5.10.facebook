'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MathField from '@/components/MathField';
import { Rich } from '@/components/Rich';
import { Modal, Switch, useToast } from '@/components/client-ui';
import Icon from '@/components/Icon';
import { saveExamAction } from '@/app/actions/admin';
import { SECTION_META } from '@/lib/utils';

const TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'];
const uid = () => Math.random().toString(36).slice(2, 10);
const strip = (s) => String(s || '').replace(/\$+/g, '').replace(/\\[a-zA-Z]+/g, ' ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();

const blank = {
  MULTIPLE_CHOICE: () => ({ k: uid(), content: '', explanation: '', options: [0, 1, 2, 3].map(() => ({ content: '', isCorrect: false })) }),
  TRUE_FALSE: () => ({ k: uid(), content: '', explanation: '', statements: [0, 1, 2, 3].map(() => ({ content: '', isTrue: false })) }),
  SHORT_ANSWER: () => ({ k: uid(), content: '', explanation: '', answers: [''] }),
};

function withKeys(state) {
  const s = JSON.parse(JSON.stringify(state));
  for (const t of TYPES) s.sections[t] = (s.sections[t] || []).map((q) => ({ ...q, k: uid() }));
  return s;
}

function issueOf(type, q) {
  if (!strip(q.content)) return 'Thiếu nội dung';
  if (type === 'MULTIPLE_CHOICE') {
    if (q.options.some((o) => !o.content.trim())) return 'Thiếu phương án';
    if (q.options.filter((o) => o.isCorrect).length !== 1) return 'Chưa chọn đáp án đúng';
  }
  if (type === 'TRUE_FALSE' && q.statements.some((s) => !s.content.trim())) return 'Thiếu mệnh đề';
  if (type === 'SHORT_ANSWER' && !q.answers.some((a) => a.trim())) return 'Thiếu đáp án';
  return null;
}

function QuestionPreview({ type, q, no }) {
  return (
    <div>
      <div className="q-title">Câu {no}</div>
      <Rich className="q-content" text={q.content || '*(chưa có nội dung)*'} />
      {type === 'MULTIPLE_CHOICE' && q.options.map((o, i) => (
        <div key={i} className={`choice ${o.isCorrect ? 'selected' : ''}`} style={{ cursor: 'default' }}><b>{'ABCD'[i]}</b><Rich as="span" text={o.content || '…'} /></div>
      ))}
      {type === 'TRUE_FALSE' && q.statements.map((s, i) => (
        <div key={i} className="tf-row"><span className="lbl">{'abcd'[i]})</span><Rich className="txt" text={s.content || '…'} /><span className={`badge ${s.isTrue ? 'badge-success' : 'badge-danger'}`}>Đáp án: {s.isTrue ? 'Đúng' : 'Sai'}</span></div>
      ))}
      {type === 'SHORT_ANSWER' && <div><div className="input short-input" style={{ display: 'flex', alignItems: 'center', color: 'var(--n-400)' }}>Ô nhập đáp án của học sinh…</div><p className="small mt-2">Đáp án đúng: <b>{q.answers.filter((a) => a.trim()).join('  |  ') || '—'}</b></p></div>}
      {q.explanation && <div className="explain"><b>Lời giải: </b><Rich as="span" text={q.explanation} /></div>}
    </div>
  );
}

export default function ExamBuilder({ initial, attemptCount }) {
  const router = useRouter();
  const { push } = useToast();
  const [exam, setExam] = useState(() => withKeys(initial));
  const [open, setOpen] = useState({});
  const [previewQ, setPreviewQ] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageUploads, setImageUploads] = useState(() => new Set());
  const trackImageUpload = useCallback((id, busy) => setImageUploads(previous => {
    if (previous.has(id) === busy) return previous;
    const next = new Set(previous);
    if (busy) next.add(id); else next.delete(id);
    return next;
  }), []);
  const hasImageUploads = imageUploads.size > 0;
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [draftBanner, setDraftBanner] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [fullPreview, setFullPreview] = useState(false);
  const draftKey = `exam-draft:${initial.id || 'new'}`;
  const first = useRef(true);

  const update = useCallback((fn) => { setExam((e) => { const c = { ...e, sections: { ...e.sections } }; fn(c); return c; }); setDirty(true); }, []);
  const setMeta = (k, v) => update((e) => { e[k] = v; });
  const setQ = (type, i, patch) => update((e) => { e.sections[type] = e.sections[type].map((q, j) => (j === i ? { ...q, ...patch } : q)); });

  /* Bản nháp tự động (localStorage) */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.exam && JSON.stringify(strip0(d.exam)) !== JSON.stringify(strip0(withKeys(initial)))) setDraftBanner(d);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function strip0(e) { const c = JSON.parse(JSON.stringify(e)); for (const t of TYPES) c.sections[t] = c.sections[t].map(({ k, ...r }) => r); return c; }
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { try { localStorage.setItem(draftKey, JSON.stringify({ exam, savedAt: Date.now() })); } catch {} }, 800);
    return () => clearTimeout(t);
  }, [exam, draftKey]);
  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const counts = useMemo(() => Object.fromEntries(TYPES.map((t) => [t, exam.sections[t].length])), [exam]);
  const issues = useMemo(() => TYPES.reduce((n, t) => n + exam.sections[t].filter((q) => issueOf(t, q)).length, 0), [exam]);
  const total = counts.MULTIPLE_CHOICE + counts.TRUE_FALSE + counts.SHORT_ANSWER;

  function addQuestion(type) {
    const q = blank[type]();
    update((e) => { e.sections[type] = [...e.sections[type], q]; });
    setOpen((o) => ({ ...o, [q.k]: true }));
    setTimeout(() => document.getElementById(`q-${q.k}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }
  function move(type, i, d) {
    update((e) => { const a = [...e.sections[type]]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; e.sections[type] = a; });
  }
  function duplicate(type, i) {
    const src = exam.sections[type][i];
    const copy = { ...JSON.parse(JSON.stringify(src)), id: undefined, k: uid() };
    update((e) => { const a = [...e.sections[type]]; a.splice(i + 1, 0, copy); e.sections[type] = a; });
    setOpen((o) => ({ ...o, [copy.k]: true }));
    push('Đã nhân bản câu hỏi.', 'info');
  }
  function remove() {
    const { type, i } = deleting;
    update((e) => { e.sections[type] = e.sections[type].filter((_, j) => j !== i); });
    setDeleting(null);
  }

  async function save(publishOverride) {
    if (hasImageUploads) { setError('Chờ ảnh tải lên xong trước khi lưu đề thi.'); return; }
    setError('');
    setSaving(true);
    const status = publishOverride === true ? 'PUBLISHED' : publishOverride === false ? 'DRAFT' : exam.status;
    const payload = { ...exam, status, sections: Object.fromEntries(TYPES.map((t) => [t, exam.sections[t].map(({ k, ...q }) => q)])) };
    try {
      const res = await saveExamAction(payload);
      if (res?.error) { setError(res.error); window.scrollTo({ top: 0, behavior: 'smooth' }); setSaving(false); return; }
      try { localStorage.removeItem(draftKey); } catch {}
      setDirty(false);
      push(status === 'PUBLISHED' ? 'Đã lưu và công bố đề thi.' : 'Đã lưu đề thi.');
      if (!initial.id) router.replace(`/admin/de-thi/${res.id}`);
      else router.refresh();
    } catch {
      setError('Không thể lưu đề thi. Vui lòng thử lại.');
    }
    setSaving(false);
  }

  const toggle = (k) => { if (!hasImageUploads) setOpen((o) => ({ ...o, [k]: !o[k] })); };

  return (
    <>
      <div className="page-title">
        <div><h1>{initial.id ? 'Sửa đề thi' : 'Tạo đề thi mới'}</h1><p>Soạn đề trực tiếp theo 3 phần cố định. Gõ công thức bằng LaTeX trong dấu <code>$ … $</code>.</p></div>
        <div className="row wrap">
          <button className="btn" onClick={() => setFullPreview(true)} disabled={!total || hasImageUploads}><Icon name="eye" size={18} />Xem thử đề</button>
          <button className="btn" onClick={() => save()} disabled={saving || hasImageUploads}><Icon name="save" size={18} />{saving ? 'Đang lưu…' : hasImageUploads ? 'Đang tải ảnh…' : 'Lưu'}</button>
          <button className="btn btn-primary" onClick={() => save(true)} disabled={saving || hasImageUploads}>Lưu & công bố</button>
        </div>
      </div>

      {draftBanner && (
        <div className="alert alert-warning" role="alert"><Icon name="info" size={18} /><div style={{ flex: 1 }}>Có bản nháp chưa lưu từ {new Date(draftBanner.savedAt).toLocaleString('vi-VN')}. Bạn muốn khôi phục?</div>
          <button className="btn btn-sm" onClick={() => { setExam(draftBanner.exam); setDirty(true); setDraftBanner(null); }}>Khôi phục</button>
          <button className="btn btn-sm btn-ghost" onClick={() => { try { localStorage.removeItem(draftKey); } catch {} setDraftBanner(null); }}>Bỏ qua</button></div>
      )}
      {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} />{error}</div>}
      {attemptCount > 0 && <div className="alert alert-info"><Icon name="info" size={18} />Đề này đã có <b>{attemptCount} lượt thi</b>. Kết quả cũ được giữ nguyên; xóa một câu hỏi sẽ xóa bài làm của câu đó trong các lượt thi cũ.</div>}

      <div className="builder-grid">
        <div>
          {TYPES.map((type) => {
            const m = SECTION_META[type];
            const qs = exam.sections[type];
            return (
              <section key={type} className="card b-section" aria-labelledby={`sec-${type}`}>
                <div className="b-section-head">
                  <div><h3 id={`sec-${type}`}>{m.title} – {m.name}</h3><span className="small muted">{m.hint} · {qs.length} câu</span></div>
                  <button className="btn btn-primary btn-sm" onClick={() => addQuestion(type)}><Icon name="plus" size={16} />Thêm câu hỏi</button>
                </div>
                {qs.length === 0 && (
                  <div className="empty" style={{ padding: '36px 24px' }}>
                    <p style={{ marginBottom: 14 }}>Chưa có câu hỏi nào trong {m.title.toLowerCase()}.</p>
                    <button className="btn" onClick={() => addQuestion(type)}><Icon name="plus" size={16} />Thêm câu hỏi đầu tiên</button>
                  </div>
                )}
                {qs.map((q, i) => {
                  const iss = issueOf(type, q);
                  const isOpen = !!open[q.k];
                  return (
                    <div key={q.k} id={`q-${q.k}`} className={`b-q ${isOpen ? 'open' : ''}`}>
                      <div className="b-q-head" onClick={() => toggle(q.k)}>
                        <button type="button" className="btn btn-icon btn-ghost" aria-expanded={isOpen} aria-label={isOpen ? 'Thu gọn' : 'Mở rộng'} onClick={(e) => { e.stopPropagation(); toggle(q.k); }}><Icon name={isOpen ? 'down' : 'right'} size={18} /></button>
                        <span className="no">Câu {i + 1}</span>
                        <span className="prev">{strip(q.content) || <em className="muted">(chưa có nội dung)</em>}</span>
                        {iss ? <span className="badge badge-warning">{iss}</span> : <span className="badge badge-success">Hợp lệ</span>}
                        <div className="row" style={{ gap: 2 }} onClick={(e) => e.stopPropagation()}>
                          <button className="btn btn-icon btn-ghost" aria-label="Chuyển lên" onClick={() => move(type, i, -1)} disabled={i === 0}><Icon name="up" size={16} /></button>
                          <button className="btn btn-icon btn-ghost" aria-label="Chuyển xuống" onClick={() => move(type, i, 1)} disabled={i === qs.length - 1}><Icon name="down" size={16} /></button>
                          <button className="btn btn-icon btn-ghost" aria-label="Nhân bản câu hỏi" onClick={() => duplicate(type, i)}><Icon name="copy" size={16} /></button>
                          <button className="btn btn-icon btn-ghost" aria-label="Xóa câu hỏi" style={{ color: 'var(--danger-600)' }} onClick={() => setDeleting({ type, i })}><Icon name="trash" size={16} /></button>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="b-q-body">
                          <div className="row between mt-4 mb-2"><span className="small muted">Soạn nội dung câu hỏi</span>
                            <div className="seg" style={{ height: 32 }}><button type="button" className={!previewQ[q.k] ? 'on-t' : ''} style={!previewQ[q.k] ? { background: 'var(--primary-600)' } : {}} onClick={() => setPreviewQ((p) => ({ ...p, [q.k]: false }))}>Soạn</button><button type="button" className={previewQ[q.k] ? 'on-t' : ''} style={previewQ[q.k] ? { background: 'var(--primary-600)' } : {}} onClick={() => setPreviewQ((p) => ({ ...p, [q.k]: true }))}>Xem trước</button></div>
                          </div>
                          {previewQ[q.k] ? (
                            <div className="card card-pad" style={{ boxShadow: 'none', background: 'var(--n-25)' }}><QuestionPreview type={type} q={q} no={i + 1} /></div>
                          ) : (
                            <>
                              <div className="field"><MathField id={`c-${q.k}`} label="Nội dung câu hỏi" value={q.content} onChange={(v) => setQ(type, i, { content: v })} onUploadStateChange={trackImageUpload} rows={3} placeholder="Ví dụ: Cho hàm số $f(x)=x^3-3x+2$. Giá trị cực đại của hàm số là" /></div>

                              {type === 'MULTIPLE_CHOICE' && (
                                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                                  <legend className="label" style={{ marginBottom: 8 }}>Các phương án (chọn một đáp án đúng)</legend>
                                  {q.options.map((o, k) => (
                                    <div key={k} className="opt-edit">
                                      <span className="badge-l">{'ABCD'[k]}.</span>
                                      <div className="grow"><MathField id={`o-${q.k}-${k}`} label={`Phương án ${'ABCD'[k]}`} hideLabel multiline={false} compact value={o.content} onChange={(v) => setQ(type, i, { options: q.options.map((x, j) => (j === k ? { ...x, content: v } : x)) })} onUploadStateChange={trackImageUpload} placeholder={`Nội dung phương án ${'ABCD'[k]}`} /></div>
                                      <label className="radio-correct"><input type="radio" name={`correct-${q.k}`} checked={o.isCorrect} onChange={() => setQ(type, i, { options: q.options.map((x, j) => ({ ...x, isCorrect: j === k })) })} />Đáp án đúng</label>
                                    </div>
                                  ))}
                                </fieldset>
                              )}

                              {type === 'TRUE_FALSE' && (
                                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                                  <legend className="label" style={{ marginBottom: 8 }}>Các mệnh đề và đáp án Đúng / Sai</legend>
                                  {q.statements.map((s, k) => (
                                    <div key={k} className="opt-edit">
                                      <span className="badge-l">{'abcd'[k]})</span>
                                      <div className="grow"><MathField id={`s-${q.k}-${k}`} label={`Mệnh đề ${'abcd'[k]}`} hideLabel multiline={false} compact value={s.content} onChange={(v) => setQ(type, i, { statements: q.statements.map((x, j) => (j === k ? { ...x, content: v } : x)) })} onUploadStateChange={trackImageUpload} placeholder={`Nội dung mệnh đề ${'abcd'[k]}`} /></div>
                                      <div className="seg" role="group" aria-label={`Đáp án mệnh đề ${'abcd'[k]}`}>
                                        <button type="button" className={s.isTrue ? 'on-t' : ''} aria-pressed={s.isTrue} onClick={() => setQ(type, i, { statements: q.statements.map((x, j) => (j === k ? { ...x, isTrue: true } : x)) })}>Đúng</button>
                                        <button type="button" className={!s.isTrue ? 'on-f' : ''} aria-pressed={!s.isTrue} onClick={() => setQ(type, i, { statements: q.statements.map((x, j) => (j === k ? { ...x, isTrue: false } : x)) })}>Sai</button>
                                      </div>
                                    </div>
                                  ))}
                                </fieldset>
                              )}

                              {type === 'SHORT_ANSWER' && (
                                <div>
                                  <div className="field"><label className="label" htmlFor={`a0-${q.k}`}>Đáp án đúng</label>
                                    <input id={`a0-${q.k}`} className="input" value={q.answers[0] || ''} onChange={(e) => setQ(type, i, { answers: q.answers.map((a, j) => (j === 0 ? e.target.value : a)) })} placeholder="Ví dụ: 4  hoặc  -1/2" />
                                  </div>
                                  <div className="field">
                                    <span className="label">Đáp án tương đương (không bắt buộc)</span>
                                    {q.answers.slice(1).map((a, j) => (
                                      <div key={j} className="row mb-2">
                                        <input aria-label={`Đáp án tương đương ${j + 1}`} className="input" value={a} onChange={(e) => setQ(type, i, { answers: q.answers.map((x, n) => (n === j + 1 ? e.target.value : x)) })} placeholder="Ví dụ: 0,5  hoặc  1/2" />
                                        <button type="button" className="btn btn-icon" aria-label="Xóa đáp án" onClick={() => setQ(type, i, { answers: q.answers.filter((_, n) => n !== j + 1) })}><Icon name="x" size={16} /></button>
                                      </div>
                                    ))}
                                    <div><button type="button" className="btn btn-sm" onClick={() => setQ(type, i, { answers: [...q.answers, ''] })}><Icon name="plus" size={14} />Thêm đáp án tương đương</button></div>
                                    <div className="field-hint">Hệ thống bỏ qua khoảng trắng thừa và coi dấu “,” như dấu “.” (2,5 = 2.5). Các số tương đương (2.50 = 2.5) cũng được chấp nhận.</div>
                                  </div>
                                </div>
                              )}

                              <div className="field" style={{ marginTop: 8, marginBottom: 0 }}>
                                <MathField id={`e-${q.k}`} label="Lời giải / giải thích (không bắt buộc, hiển thị sau khi nộp)" value={q.explanation} onChange={(v) => setQ(type, i, { explanation: v })} onUploadStateChange={trackImageUpload} rows={2} compact />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {qs.length > 0 && <div style={{ padding: '4px 20px 20px' }}><button className="btn btn-sm" onClick={() => addQuestion(type)}><Icon name="plus" size={16} />Thêm câu hỏi</button></div>}
              </section>
            );
          })}
        </div>

        <aside className="b-aside stack">
          <div className="card card-pad">
            <h3>Thông tin đề</h3>
            <div className="field"><label htmlFor="ex-title">Tên đề <span className="req">*</span></label><input id="ex-title" className="input" value={exam.title} onChange={(e) => setMeta('title', e.target.value)} placeholder="Đề luyện thi Toán 12 – Số 01" /></div>
            <div className="field"><label htmlFor="ex-desc">Mô tả</label><textarea id="ex-desc" className="textarea" style={{ minHeight: 76 }} value={exam.description} onChange={(e) => setMeta('description', e.target.value)} /></div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              <div className="field"><label htmlFor="ex-grade">Khối / lớp</label><select id="ex-grade" className="select" value={exam.grade} onChange={(e) => setMeta('grade', e.target.value)}><option>10</option><option>11</option><option>12</option></select></div>
              <div className="field"><label htmlFor="ex-dur">Thời gian (phút)</label><input id="ex-dur" type="number" min={1} max={300} className="input" value={exam.durationMinutes} onChange={(e) => setMeta('durationMinutes', e.target.value === '' ? '' : Number(e.target.value))} /></div>
            </div>
            <div className="field"><label htmlFor="ex-status">Trạng thái</label><select id="ex-status" className="select" value={exam.status} onChange={(e) => setMeta('status', e.target.value)}><option value="DRAFT">Bản nháp (học sinh chưa thấy)</option><option value="PUBLISHED">Đã công bố</option></select></div>
            <Switch checked={exam.shuffleQuestions} onChange={(e) => setMeta('shuffleQuestions', e.target.checked)} label="Hoán đổi thứ tự câu hỏi" />
            <p className="field-hint mt-2">Chỉ hoán đổi trong từng phần; không trộn câu giữa các phần. Mỗi lượt thi có một thứ tự riêng.</p>
          </div>
          <div className="card card-pad">
            <h4>Tổng quan</h4>
            <ul className="info-list">
              {TYPES.map((t) => <li key={t}><span>{SECTION_META[t].title}</span><span>{counts[t]} câu</span></li>)}
              <li><span>Tổng cộng</span><span>{total} câu</span></li>
              <li><span>Câu chưa hợp lệ</span><span style={{ color: issues ? 'var(--danger-600)' : 'var(--success-600)' }}>{issues}</span></li>
            </ul>
            <p className="field-hint mt-2">Thang điểm 10: Phần I 3đ · Phần II 4đ (chấm theo số ý đúng: 1 ý 0,1 · 2 ý 0,25 · 3 ý 0,5 · 4 ý 1) · Phần III 3đ. Phần bỏ trống sẽ được chia lại điểm.</p>
          </div>
          <div className="card card-pad small">
            <h4>Gõ công thức</h4>
            <p className="muted">Dùng thanh công cụ phía trên ô nhập, hoặc gõ LaTeX trực tiếp:</p>
            <ul className="muted" style={{ paddingLeft: 18, margin: 0, display: 'grid', gap: 4 }}>
              <li><code>$\dfrac{'{a}{b}'}$</code> phân số</li>
              <li><code>$\sqrt{'{x}'}$</code> căn · <code>$x^2$</code> mũ</li>
              <li><code>$\int_0^1 f(x)dx$</code> tích phân</li>
              <li><code>$\lim_{'{x \\to 0}'}$</code> giới hạn</li>
            </ul>
          </div>
          <div className="row"><Link href="/admin/de-thi" className="btn">Thoát</Link>{dirty && <span className="small muted">Có thay đổi chưa lưu</span>}</div>
        </aside>
      </div>

      <div className="sticky-save">
        <button className="btn" onClick={() => save()} disabled={saving || hasImageUploads}><Icon name="save" size={18} />{saving ? 'Đang lưu…' : hasImageUploads ? 'Đang tải ảnh…' : 'Lưu đề thi'}</button>
        <button className="btn btn-primary" onClick={() => save(true)} disabled={saving || hasImageUploads}>Lưu & công bố</button>
        {exam.status === 'PUBLISHED' && <button className="btn btn-ghost" onClick={() => save(false)} disabled={saving || hasImageUploads}>Lưu & hủy công bố</button>}
        <span className="spacer" />
        <span className="small muted">{dirty ? 'Chưa lưu · bản nháp được giữ tự động trên trình duyệt' : 'Đã lưu'}</span>
      </div>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Xóa câu hỏi?" tone="danger" icon="trash"
        footer={<><button className="btn" onClick={() => setDeleting(null)}>Hủy</button><button className="btn btn-danger" data-autofocus onClick={remove}>Xóa câu hỏi</button></>}>
        Câu hỏi sẽ bị xóa khỏi đề khi bạn bấm Lưu.
      </Modal>

      <Modal open={fullPreview} onClose={() => setFullPreview(false)} wide title={`Xem thử: ${exam.title || 'Đề thi'}`}
        footer={<button className="btn btn-primary" onClick={() => setFullPreview(false)}>Đóng</button>}>
        {TYPES.filter((t) => exam.sections[t].length).map((t) => (
          <div key={t}>
            <div style={{ background: 'var(--primary-50)', padding: '8px 14px', fontWeight: 700, borderRadius: 6, margin: '12px 0' }}>{SECTION_META[t].title} – {SECTION_META[t].name}</div>
            {exam.sections[t].map((q, i) => <div key={q.k} className="review-q" style={{ padding: '16px 4px' }}><QuestionPreview type={t} q={q} no={i + 1} /></div>)}
          </div>
        ))}
      </Modal>
    </>
  );
}
