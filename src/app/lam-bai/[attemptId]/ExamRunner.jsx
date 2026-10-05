'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Rich } from '@/components/Rich';
import { Modal, useToast } from '@/components/client-ui';
import Icon from '@/components/Icon';
import { SECTION_META } from '@/lib/utils';

const pad = (n) => String(n).padStart(2, '0');
const fmtClock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

export default function ExamRunner({ attemptId, title, studentName, sections, initialAnswers, deadline, serverNow }) {
  const router = useRouter();
  const { push } = useToast();

  // Danh sách phẳng, giữ nguyên thứ tự đã lưu của lượt thi (đã hoán đổi trong từng phần ở server).
  const items = useMemo(() => {
    const out = [];
    sections.forEach((s) => s.questions.forEach((q, i) => out.push({ ...q, type: s.type, no: i + 1, total: s.questions.length })));
    return out;
  }, [sections]);

  const [answers, setAnswers] = useState(initialAnswers);
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(() => serverNow);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState('saved');
  const [online, setOnline] = useState(true);

  const answersRef = useRef(initialAnswers);
  const dirty = useRef(new Set());
  const timer = useRef(null);
  const offset = useRef(serverNow - Date.now());
  const submittingRef = useRef(false);
  const storeKey = `attempt-answers:${attemptId}`;
  const idxKey = `attempt-index:${attemptId}`;

  /* ---------- Lưu đáp án ---------- */
  const flush = useCallback(async () => {
    if (!dirty.current.size) return true;
    const keys = [...dirty.current];
    const payload = {};
    keys.forEach((k) => { payload[k] = answersRef.current[k] ?? ''; });
    setSaveState('saving');
    try {
      const res = await fetch(`/api/attempts/${attemptId}/answers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: payload }), keepalive: true });
      if (res.status === 409) { setSaveState('saved'); return true; }
      if (!res.ok) throw new Error('save failed');
      keys.forEach((k) => { if ((answersRef.current[k] ?? '') === payload[k]) dirty.current.delete(k); });
      setSaveState(dirty.current.size ? 'saving' : 'saved');
      if (dirty.current.size) schedule();
      return true;
    } catch {
      setSaveState('error');
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const schedule = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), 600);
  }, [flush]);

  const setAnswer = useCallback((key, value) => {
    const next = { ...answersRef.current };
    if (value === '' || value == null) delete next[key]; else next[key] = value;
    answersRef.current = next;
    setAnswers(next);
    dirty.current.add(key);
    setSaveState('saving');
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch {}
    schedule();
  }, [schedule, storeKey]);

  /* ---------- Khôi phục khi mount ---------- */
  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem(storeKey) || 'null');
      if (local && typeof local === 'object') {
        const merged = { ...initialAnswers };
        let changed = false;
        for (const [k, v] of Object.entries(local)) if (merged[k] !== v) { merged[k] = v; dirty.current.add(k); changed = true; }
        for (const k of Object.keys(initialAnswers)) if (!(k in local) && changed) { /* giữ bản server */ }
        if (changed) { answersRef.current = merged; setAnswers(merged); flush(); }
      }
      const i = parseInt(sessionStorage.getItem(idxKey) || '0', 10);
      if (i > 0 && i < items.length) setIdx(i);
    } catch {}
    setOnline(navigator.onLine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { try { sessionStorage.setItem(idxKey, String(idx)); } catch {} window.scrollTo({ top: 0 }); }, [idx, idxKey]);

  /* ---------- Nộp bài ---------- */
  const doSubmit = useCallback(async (auto = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setConfirmOpen(false);
    setSheetOpen(false);
    clearTimeout(timer.current);
    for (let attempt = 0; attempt < (auto ? 20 : 3); attempt++) {
      await flush();
      try {
        const res = await fetch(`/api/attempts/${attemptId}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ auto }) });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.redirect) {
          try { localStorage.removeItem(storeKey); sessionStorage.removeItem(idxKey); } catch {}
          router.replace(data.redirect);
          return;
        }
        if (res.status === 401) { push('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại — bài làm của bạn đã được lưu.', 'error'); break; }
      } catch {}
      await new Promise((r) => setTimeout(r, 2500));
    }
    submittingRef.current = false;
    setSubmitting(false);
    push('Chưa nộp được bài. Vui lòng kiểm tra kết nối mạng và thử lại.', 'error');
  }, [attemptId, flush, idxKey, push, router, storeKey]);

  /* ---------- Đồng hồ ---------- */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset.current), 250);
    return () => clearInterval(t);
  }, []);
  const remaining = deadline - now;
  useEffect(() => {
    if (remaining <= 0 && !submittingRef.current) doSubmit(true);
  }, [remaining, doSubmit]);

  /* ---------- Sự kiện hệ thống ---------- */
  useEffect(() => {
    const on = () => { setOnline(true); flush(); };
    const off = () => setOnline(false);
    const vis = () => { if (document.visibilityState === 'hidden') flush(); };
    const unload = (e) => { if (dirty.current.size && !submittingRef.current) { flush(); e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('beforeunload', unload);
    return () => {
      window.removeEventListener('online', on); window.removeEventListener('offline', off);
      document.removeEventListener('visibilitychange', vis); window.removeEventListener('beforeunload', unload);
    };
  }, [flush]);

  useEffect(() => {
    const onKey = (e) => {
      if (confirmOpen || sheetOpen) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(items.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length, confirmOpen, sheetOpen]);

  /* ---------- Trạng thái từng câu ---------- */
  const statusOf = useCallback((q) => {
    if (q.type === 'TRUE_FALSE') {
      const n = q.statements.filter((s) => answers[`${q.id}|${s.label}`]).length;
      return n === 0 ? 'none' : n === q.statements.length ? 'done' : 'partial';
    }
    return answers[`${q.id}|`] ? 'done' : 'none';
  }, [answers]);

  const statuses = items.map(statusOf);
  const doneCount = statuses.filter((s) => s === 'done').length;
  const unanswered = items.length - doneCount;
  const q = items[idx];
  const meta = SECTION_META[q.type];
  const timerClass = remaining <= 60000 ? 'danger' : remaining <= 300000 ? 'warn' : '';

  const renderNavigator = (onPick) => {
    let offsetIdx = 0;
    return (
      <>
        {sections.map((s) => {
          const start = offsetIdx;
          offsetIdx += s.questions.length;
          const m = SECTION_META[s.type];
          return (
            <div key={s.type} className="nav-sec">
              <h4>{m.title} · {m.name}</h4>
              <div className="nav-grid">
                {s.questions.map((_, i) => {
                  const g = start + i;
                  const st = statuses[g];
                  return (
                    <button key={g} type="button" className={`nav-btn ${g === idx ? 'current' : st === 'done' ? 'done' : st === 'partial' ? 'partial' : ''}`} onClick={() => { setIdx(g); onPick?.(); }} aria-label={`${m.title}, câu ${i + 1}${st === 'done' ? ', đã trả lời' : st === 'partial' ? ', trả lời một phần' : ', chưa trả lời'}`} aria-current={g === idx ? 'true' : undefined}>{i + 1}</button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="legend"><span><i className="done" />Đã trả lời</span><span><i />Chưa làm</span><span><i className="current" />Đang xem</span></div>
      </>
    );
  };

  return (
    <div className="exam-shell">
      {!online && <div className="offline-bar" role="alert"><Icon name="wifioff" size={16} /> Mất kết nối mạng. Bài làm vẫn được lưu trên thiết bị và sẽ đồng bộ khi có mạng trở lại.</div>}
      <header className="exam-header">
        <div className="inner">
          <div className="exam-title" style={{ flex: 1 }}>{title}<small>Thí sinh: {studentName}</small></div>
          <div className="progress-mini" aria-label={`Đã trả lời ${doneCount} trên ${items.length} câu`}>
            <small><span>Tiến độ</span><b>{doneCount}/{items.length}</b></small>
            <div className="bar"><i style={{ width: `${(doneCount / items.length) * 100}%` }} /></div>
          </div>
          <div className={`timer ${timerClass}`} role="timer" aria-label="Thời gian còn lại"><Icon name="clock" size={20} /><span>{fmtClock(remaining)}</span></div>
          <button className="btn btn-primary" onClick={() => setConfirmOpen(true)} disabled={submitting}>{submitting ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.4)', width: 16, height: 16, borderWidth: 2 }} /> : <Icon name="check" size={18} />}<span className="t">Nộp bài</span></button>
        </div>
      </header>

      <div className="exam-body">
        <main id="main" className="card q-card" aria-live="polite">
          <div className="q-sec">{meta.title} · {meta.name}</div>
          <div className="q-title">Câu {q.no} <span className="muted" style={{ fontWeight: 500 }}>/ {q.total}</span></div>
          <Rich className="q-content" text={q.content} />

          {q.type === 'MULTIPLE_CHOICE' && (
            <div role="radiogroup" aria-label={`Đáp án câu ${q.no}`}>
              {q.options.map((o) => {
                const sel = answers[`${q.id}|`] === o.label;
                return (
                  <button key={o.label} type="button" role="radio" aria-checked={sel} className={`choice ${sel ? 'selected' : ''}`} onClick={() => setAnswer(`${q.id}|`, sel ? '' : o.label)}>
                    <b>{o.label}</b><Rich as="span" text={o.content} />
                  </button>
                );
              })}
              <p className="xs muted mb-0">Nhấn lại đáp án đã chọn để bỏ chọn.</p>
            </div>
          )}

          {q.type === 'TRUE_FALSE' && (
            <div>
              {q.statements.map((s) => {
                const v = answers[`${q.id}|${s.label}`];
                return (
                  <div key={s.label} className="tf-row">
                    <span className="lbl">{s.label})</span>
                    <Rich className="txt" text={s.content} />
                    <div className="tf-btns" role="group" aria-label={`Mệnh đề ${s.label}`}>
                      <button type="button" className="t" aria-pressed={v === 'T'} onClick={() => setAnswer(`${q.id}|${s.label}`, v === 'T' ? '' : 'T')}>Đúng</button>
                      <button type="button" className="f" aria-pressed={v === 'F'} onClick={() => setAnswer(`${q.id}|${s.label}`, v === 'F' ? '' : 'F')}>Sai</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {q.type === 'SHORT_ANSWER' && (
            <div>
              <label htmlFor="short" className="label" style={{ display: 'block', marginBottom: 8 }}>Đáp án của bạn</label>
              <input id="short" className="input short-input" value={answers[`${q.id}|`] || ''} onChange={(e) => setAnswer(`${q.id}|`, e.target.value)} placeholder="Nhập đáp án…" autoComplete="off" autoCapitalize="off" spellCheck={false} inputMode="text" />
              <p className="field-hint mt-2">Nhập số hoặc biểu thức ngắn. Dùng dấu “,” hoặc “.” cho số thập phân, ví dụ 2,5.</p>
            </div>
          )}

          <div className="q-nav">
            <button className="btn" onClick={() => setIdx(idx - 1)} disabled={idx === 0}><Icon name="left" size={18} />Câu trước</button>
            <span className="save-state" aria-live="polite">
              {saveState === 'saving' && <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />Đang lưu…</>}
              {saveState === 'saved' && <><Icon name="check" size={14} />Đã lưu tự động</>}
              {saveState === 'error' && <span style={{ color: 'var(--danger-600)' }}>Chưa lưu được — sẽ thử lại</span>}
            </span>
            {idx < items.length - 1 ? <button className="btn btn-primary" onClick={() => setIdx(idx + 1)}>Câu sau<Icon name="right" size={18} /></button> : <button className="btn btn-primary" onClick={() => setConfirmOpen(true)}>Nộp bài</button>}
          </div>
        </main>

        <aside className="card navigator" aria-label="Danh sách câu hỏi">
          <div className="row between mb-4"><b>Danh sách câu</b><span className="save-state">{saveState === 'saved' ? <><Icon name="check" size={14} />Đã lưu</> : saveState === 'saving' ? 'Đang lưu…' : <span style={{ color: 'var(--danger-600)' }}>Chưa lưu</span>}</span></div>
          {renderNavigator()}
          <button className="btn btn-primary btn-block mt-6" onClick={() => setConfirmOpen(true)} disabled={submitting}>Nộp bài</button>
        </aside>
      </div>

      <div className="mobile-bar">
        <button className="btn" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} aria-label="Câu trước"><Icon name="left" size={18} /></button>
        <button className="btn" style={{ flex: 2 }} onClick={() => setSheetOpen(true)}><Icon name="grid" size={18} />Câu {idx + 1}/{items.length}</button>
        <button className="btn btn-primary" onClick={() => (idx < items.length - 1 ? setIdx(idx + 1) : setConfirmOpen(true))} aria-label={idx < items.length - 1 ? 'Câu sau' : 'Nộp bài'}>{idx < items.length - 1 ? <Icon name="right" size={18} /> : 'Nộp'}</button>
      </div>

      {sheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Danh sách câu hỏi">
            <div className="sheet-handle" />
            <div className="row between mb-4"><b>Danh sách câu · {doneCount}/{items.length} đã làm</b><button className="btn btn-sm btn-ghost" onClick={() => setSheetOpen(false)}>Đóng</button></div>
            {renderNavigator(() => setSheetOpen(false))}
            <button className="btn btn-primary btn-block mt-4" onClick={() => { setSheetOpen(false); setConfirmOpen(true); }}>Nộp bài</button>
          </div>
        </>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Nộp bài?"
        icon={unanswered ? 'alert' : 'check'}
        tone={unanswered ? '' : 'info'}
        footer={<><button className="btn" onClick={() => setConfirmOpen(false)}>Tiếp tục làm bài</button><button className="btn btn-primary" data-autofocus onClick={() => doSubmit(false)}>Nộp bài ngay</button></>}
      >
        {unanswered > 0 ? (
          <p><b>Bạn còn {unanswered} câu chưa trả lời.</b> Bạn có chắc chắn muốn nộp bài?{statuses.includes('partial') && ' (Có câu đúng/sai mới trả lời một phần.)'}</p>
        ) : (
          <p>Bạn đã trả lời tất cả các câu. Bạn có chắc chắn muốn nộp bài?</p>
        )}
        <p className="small">Còn lại <b>{fmtClock(remaining)}</b>. Sau khi nộp, bạn không thể sửa bài làm.</p>
      </Modal>

      {submitting && (
        <div className="modal-backdrop" role="alert" aria-busy="true"><div className="modal" style={{ maxWidth: 360, padding: 32, textAlign: 'center' }}><span className="spinner" style={{ margin: '0 auto 16px' }} /><b>{remaining <= 0 ? 'Đã hết giờ — đang nộp bài…' : 'Đang nộp bài và chấm điểm…'}</b></div></div>
      )}
    </div>
  );
}
