import Link from 'next/link';
import Icon from '@/components/Icon';
import { Rich } from '@/components/Rich';
import { Badge } from '@/components/ui';
import { SECTION_META, fmtDateTime, fmtDuration, fmtScore, scoreTone } from '@/lib/utils';
import { formatPoints } from '@/lib/exam-config';

const STATUS_BADGE = {
  correct: <Badge tone="success" dot>Đúng</Badge>,
  wrong: <Badge tone="danger" dot>Sai</Badge>,
  partial: <Badge tone="warning" dot>Đúng một phần</Badge>,
  blank: <Badge tone="neutral" dot>Chưa trả lời</Badge>,
};

export default function ResultView({ data, admin = false }) {
  const { attempt, sections, answers, graded, perQuestion } = data;
  const r = attempt.result;
  const breakdown = JSON.parse(r.breakdown);
  const tone = scoreTone(r.score);
  const ring = { success: 'var(--success-600)', warning: 'var(--accent-500)', danger: 'var(--danger-600)' }[tone];
  return (
    <>
      <div className="card card-pad mb-6">
        <div className="result-hero">
          <div className="score-ring" style={{ '--p': r.score * 10, '--ring': ring }} role="img" aria-label={`Điểm ${formatPoints(r.rawScore ?? r.score)} trên ${formatPoints(r.maxScore)}`}>
            <div><b>{formatPoints(r.rawScore ?? r.score)}</b><span>/ {formatPoints(r.maxScore)} điểm</span></div>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div className="row wrap mb-2">
              <Badge tone={attempt.autoSubmitted ? 'info' : 'success'} dot>{attempt.autoSubmitted ? 'Hết giờ — hệ thống tự nộp' : 'Đã nộp bài'}</Badge>
              <span className="small muted">{fmtDateTime(attempt.submittedAt)}</span>
            </div>
            <h2 style={{ marginBottom: 4 }}>{attempt.exam.title}</h2>
            <p className="small muted">Quy đổi thang 10: <b>{fmtScore(r.score)} / 10</b></p>
            <p className="muted">Học sinh: <b style={{ color: 'var(--n-900)' }}>{attempt.user.fullName}</b></p>
            <div className="result-stats">
              <div><b>{r.totalUnits}</b><span>Tổng số câu / ý</span></div>
              <div><b style={{ color: 'var(--success-600)' }}>{r.correct}</b><span>Đúng</span></div>
              <div><b style={{ color: 'var(--danger-600)' }}>{r.wrong}</b><span>Sai</span></div>
              <div><b style={{ color: 'var(--n-500)' }}>{r.unanswered}</b><span>Chưa trả lời</span></div>
              <div><b>{fmtDuration(r.durationSec)}</b><span>Thời gian làm bài</span></div>
              <div><b>{attempt.exam.durationMinutes} phút</b><span>Thời gian quy định</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-head"><h3>Kết quả theo từng phần</h3></div>
        <div className="card-pad stack" style={{ gap: 22 }}>
          {breakdown.filter((b) => b.questions > 0).map((b) => {
            const m = SECTION_META[b.type];
            const pct = b.units ? (b.correct / b.units) * 100 : 0;
            return (
              <div key={b.type}>
                <div className="row between mb-2 wrap">
                  <div><b>{m.title}</b> <span className="muted">– {m.name}</span></div>
                  <div><b>{b.correct}/{b.units}</b> <span className="muted small">{b.type === 'TRUE_FALSE' ? 'ý đúng' : 'câu đúng'}</span> · <b style={{ color: 'var(--primary-700)' }}>{fmtScore(b.points)}/{fmtScore(b.maxPoints)} điểm</b></div>
                </div>
                <div className={`bar ${pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger'}`}><i style={{ width: `${pct}%` }} /></div>
                <div className="xs muted mt-2">{b.correct} đúng · {b.wrong} sai · {b.unanswered} chưa trả lời</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Xem lại bài làm & đáp án</h3><span className="small muted">Thứ tự câu hỏi theo lượt thi của bạn</span></div>
        {sections.map((s) => {
          const m = SECTION_META[s.type];
          return (
            <section key={s.type} aria-label={m.title}>
              <div style={{ background: 'var(--primary-50)', padding: '10px 24px', fontWeight: 700, color: 'var(--primary-900)' }}>{m.title} – {m.name}</div>
              {s.questions.map((q, i) => {
                const pq = perQuestion[q.id] || { status: 'blank' };
                const mine = (sub = '') => answers[`${q.id}|${sub}`];
                return (
                  <div key={q.id} className="review-q">
                    <div className="row between mb-2 wrap"><b style={{ color: 'var(--primary-800)' }}>Câu {i + 1} · {formatPoints(pq.points)} / {formatPoints(pq.maxPoints)} điểm</b>{STATUS_BADGE[pq.status]}</div>
                    <Rich text={q.content} className="mb-4" />
                    {s.type === 'MULTIPLE_CHOICE' && q.options.map((o) => {
                      const isMine = mine() === o.label;
                      return (
                        <div key={o.label} className={`review-opt ${o.isCorrect ? 'correct' : isMine ? 'wrong' : ''}`}>
                          <b>{o.label}</b><Rich as="span" text={o.content} />
                          <span className="spacer" />
                          {o.isCorrect && <span className="xs" style={{ color: 'var(--success-700)', fontWeight: 600, whiteSpace: 'nowrap' }}>Đáp án đúng</span>}
                          {isMine && !o.isCorrect && <span className="xs" style={{ color: 'var(--danger-700)', fontWeight: 600, whiteSpace: 'nowrap' }}>Bạn chọn</span>}
                          {isMine && o.isCorrect && <span className="xs" style={{ color: 'var(--success-700)', fontWeight: 600, whiteSpace: 'nowrap' }}>· Bạn chọn</span>}
                        </div>
                      );
                    })}
                    {s.type === 'TRUE_FALSE' && q.statements.map((st) => {
                      const v = mine(st.label);
                      const st2 = pq.subs?.[st.label] || 'blank';
                      return (
                        <div key={st.label} className={`review-opt ${st2 === 'correct' ? 'correct' : st2 === 'wrong' ? 'wrong' : ''}`}>
                          <b>{st.label}</b><Rich as="span" text={st.content} />
                          <span className="spacer" />
                          <span className="xs" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                            Đáp án: <b>{st.isTrue ? 'Đúng' : 'Sai'}</b><br />Bạn chọn: <b>{v ? (v === 'T' ? 'Đúng' : 'Sai') : '—'}</b>
                          </span>
                        </div>
                      );
                    })}
                    {s.type === 'SHORT_ANSWER' && (
                      <div className={`review-opt ${pq.status === 'correct' ? 'correct' : pq.status === 'wrong' ? 'wrong' : ''}`} style={{ display: 'block' }}>
                        <div>Bạn trả lời: <b>{mine() || '—'}</b></div>
                        <div>Đáp án đúng: <b>{q.shortAnswers.filter((a) => a.isPrimary).map((a) => a.answer).join(', ') || q.shortAnswers[0]?.answer}</b>
                          {q.shortAnswers.filter((a) => !a.isPrimary).length > 0 && <span className="muted small"> (chấp nhận thêm: {q.shortAnswers.filter((a) => !a.isPrimary).map((a) => a.answer).join(', ')})</span>}
                        </div>
                      </div>
                    )}
                    {q.explanation && <div className="explain"><b>Lời giải: </b><Rich as="span" text={q.explanation} /></div>}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </>
  );
}
