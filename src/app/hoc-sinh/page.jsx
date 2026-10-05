import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import Icon from '@/components/Icon';
import { EmptyState, ScorePill, Badge } from '@/components/ui';
import { ToastOnMount } from '@/components/client-ui';
import { fmtDate, fmtDuration, fmtScore } from '@/lib/utils';
import { countByType } from '@/components/cards';

export const metadata = { title: 'Tổng quan' };

export default async function StudentHome({ searchParams }) {
  searchParams = await searchParams;
  const user = await requireUser();
  const [exams, attempts] = await Promise.all([
    db.exam.findMany({ where: { status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' }, include: { sections: { include: { _count: { select: { questions: true } } } } } }),
    db.examAttempt.findMany({ where: { userId: user.id }, orderBy: { startedAt: 'desc' }, include: { exam: true, result: true } }),
  ]);
  const done = attempts.filter((a) => a.result);
  const inProgress = attempts.find((a) => a.status === 'IN_PROGRESS' && a.deadlineAt > new Date());
  const doneIds = new Set(done.map((a) => a.examId));
  const fresh = exams.filter((e) => !doneIds.has(e.id));
  const avg = done.length ? done.reduce((n, a) => n + a.result.score, 0) / done.length : 0;
  const recent = done.slice(0, 6);
  const first = user.fullName.split(' ').slice(-1)[0];

  return (
    <>
      {searchParams?.welcome && <ToastOnMount message="Tạo tài khoản thành công. Chào mừng bạn!" />}
      <div className="welcome mb-6">
        <div>
          <h1>Xin chào, {first}! 👋</h1>
          <p>{inProgress ? `Bạn đang làm dở “${inProgress.exam.title}”.` : done.length ? 'Tiếp tục luyện đề để cải thiện điểm số của bạn.' : 'Hãy bắt đầu bằng một đề luyện thi đầu tiên.'}</p>
        </div>
        {inProgress ? (
          <Link href={`/lam-bai/${inProgress.id}`} className="btn btn-lg btn-accent">Tiếp tục làm bài <Icon name="right" size={18} /></Link>
        ) : (
          <Link href="/hoc-sinh/luyen-thi" className="btn btn-lg btn-accent">Tiếp tục luyện thi <Icon name="right" size={18} /></Link>
        )}
      </div>

      <div className="grid c4 mb-6">
        <div className="card stat-card"><span className="ic"><Icon name="clipboard" /></span><div><b>{exams.length}</b><span>Đề hiện có</span></div></div>
        <div className="card stat-card"><span className="ic amber"><Icon name="zap" /></span><div><b>{fresh.length}</b><span>Đề mới chưa làm</span></div></div>
        <div className="card stat-card"><span className="ic green"><Icon name="check" /></span><div><b>{done.length}</b><span>Lượt đã làm</span></div></div>
        <div className="card stat-card"><span className="ic"><Icon name="award" /></span><div><b>{done.length ? fmtScore(avg) : '—'}</b><span>Điểm trung bình</span></div></div>
      </div>

      <div className="grid split">
        <section className="card" aria-labelledby="new-h">
          <div className="card-head"><h3 id="new-h">Đề mới dành cho bạn</h3><Link href="/hoc-sinh/luyen-thi" className="small">Xem tất cả</Link></div>
          {fresh.length ? fresh.slice(0, 4).map((e) => {
            const c = countByType(e);
            return (
              <div key={e.id} className="list-row">
                <div className="grow">
                  <div className="cell-title">{e.title}</div>
                  <div className="cell-sub">Khối {e.grade} · {e.durationMinutes} phút · {c.mc + c.tf + c.sa} câu</div>
                </div>
                <Link href={`/hoc-sinh/luyen-thi/${e.id}`} className="btn btn-sm btn-primary">Làm bài</Link>
              </div>
            );
          }) : <EmptyState icon="check" title="Bạn đã làm hết các đề hiện có">Giáo viên sẽ cập nhật đề mới sớm. Bạn có thể làm lại đề cũ để luyện tập.</EmptyState>}
        </section>

        <section className="card" aria-labelledby="rec-h">
          <div className="card-head"><h3 id="rec-h">Điểm gần đây</h3><Link href="/hoc-sinh/ket-qua" className="small">Tất cả</Link></div>
          {recent.length ? (
            <>
              <div className="card-pad" style={{ paddingBottom: 8 }}>
                <div className="chart" role="img" aria-label="Biểu đồ điểm các lần làm bài gần đây">
                  {[...recent].reverse().map((a) => (
                    <div key={a.id} className="col"><b>{fmtScore(a.result.score)}</b><i style={{ height: `${Math.max(3, a.result.score * 10)}%` }} /><span>{fmtDate(a.submittedAt).slice(0, 5)}</span></div>
                  ))}
                </div>
              </div>
              {recent.slice(0, 3).map((a) => (
                <Link key={a.id} href={`/hoc-sinh/ket-qua/${a.id}`} className="list-row" style={{ color: 'inherit' }}>
                  <div className="grow"><div className="cell-title">{a.exam.title}</div><div className="cell-sub">{fmtDate(a.submittedAt)} · {fmtDuration(a.result.durationSec)}</div></div>
                  <ScorePill score={a.result.score} />
                </Link>
              ))}
            </>
          ) : <EmptyState icon="chart" title="Chưa có kết quả">Làm một đề luyện thi để xem điểm của bạn ở đây.</EmptyState>}
        </section>
      </div>
    </>
  );
}
