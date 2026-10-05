import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { EmptyState, Badge, ScorePill } from '@/components/ui';
import { PageTitle } from '@/components/ui';
import Icon from '@/components/Icon';
import { countByType } from '@/components/cards';
import { fmtDate } from '@/lib/utils';

export const metadata = { title: 'Luyện thi' };

export default async function PracticeList({ searchParams }) {
  searchParams = await searchParams;
  const user = await requireUser('/hoc-sinh/luyen-thi');
  const grade = searchParams?.khoi || '';
  const [exams, attempts] = await Promise.all([
    db.exam.findMany({ where: { status: 'PUBLISHED', ...(grade ? { grade } : {}) }, orderBy: { createdAt: 'desc' }, include: { sections: { include: { _count: { select: { questions: true } } } } } }),
    db.examAttempt.findMany({ where: { userId: user.id }, include: { result: true }, orderBy: { startedAt: 'desc' } }),
  ]);
  const byExam = new Map();
  for (const a of attempts) {
    const r = byExam.get(a.examId) || { count: 0, best: null, last: null, running: null };
    if (a.result) { r.count++; r.best = Math.max(r.best ?? 0, a.result.score); r.last = r.last || a; }
    if (a.status === 'IN_PROGRESS' && a.deadlineAt > new Date()) r.running = a;
    byExam.set(a.examId, r);
  }
  const chips = [['', 'Tất cả'], ['10', 'Khối 10'], ['11', 'Khối 11'], ['12', 'Khối 12']];
  return (
    <>
      <PageTitle title="Luyện thi" desc="Chọn một đề và bắt đầu làm bài có tính giờ." />
      <div className="filter-chips" role="group" aria-label="Lọc theo khối">
        {chips.map(([v, l]) => <Link key={v} href={v ? `/hoc-sinh/luyen-thi?khoi=${v}` : '/hoc-sinh/luyen-thi'} className={`chip ${grade === v ? 'active' : ''}`}>{l}</Link>)}
      </div>
      {exams.length ? (
        <div className="grid c3">
          {exams.map((e) => {
            const c = countByType(e);
            const st = byExam.get(e.id);
            return (
              <article key={e.id} className="card card-hover exam-card">
                <div className="row between">
                  <Badge tone="primary">Khối {e.grade}</Badge>
                  {st?.running ? <Badge tone="warning" dot>Đang làm dở</Badge> : st?.count ? <Badge tone="success" dot>Đã làm {st.count} lần</Badge> : <Badge tone="info">Mới</Badge>}
                </div>
                <h3><Link href={`/hoc-sinh/luyen-thi/${e.id}`} style={{ color: 'inherit' }}>{e.title}</Link></h3>
                <p>{e.description}</p>
                <div className="parts"><Badge>{c.mc} trắc nghiệm</Badge><Badge>{c.tf} đúng/sai</Badge><Badge>{c.sa} trả lời ngắn</Badge></div>
                <div className="row between small muted mb-4"><span className="row" style={{ gap: 6 }}><Icon name="clock" size={15} />{e.durationMinutes} phút</span>{st?.best != null && <span>Cao nhất: <ScorePill score={st.best} /></span>}</div>
                <Link href={`/hoc-sinh/luyen-thi/${e.id}`} className="btn btn-primary btn-block">{st?.running ? 'Tiếp tục làm bài' : st?.count ? 'Làm lại' : 'Xem đề & bắt đầu'}</Link>
              </article>
            );
          })}
        </div>
      ) : <div className="card"><EmptyState icon="clipboard" title="Chưa có đề thi">Hiện chưa có đề phù hợp. Vui lòng quay lại sau.</EmptyState></div>}
    </>
  );
}
