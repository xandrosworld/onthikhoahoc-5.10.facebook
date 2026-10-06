import Link from 'next/link';
import { db } from '@/lib/db';
import Icon from '@/components/Icon';
import { PageTitle, EmptyState, ScorePill, StatusBadge } from '@/components/ui';
import { fmtDateTime, fmtDuration } from '@/lib/utils';

export const metadata = { title: 'Tổng quan quản trị' };

export default async function AdminHome() {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [students, exams, attempts, newRegs, posts, recent, regs, avg] = await Promise.all([
    db.user.count({ where: { role: 'STUDENT' } }),
    db.exam.count(),
    db.examAttempt.count({ where: { result: { isNot: null } } }),
    db.courseRegistration.count({ where: { status: 'NEW' } }),
    db.post.count(),
    db.examAttempt.findMany({ where: { result: { isNot: null } }, orderBy: { submittedAt: 'desc' }, take: 6, include: { user: true, exam: true, result: true } }),
    db.courseRegistration.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { course: true } }),
    db.examResult.aggregate({ _avg: { score: true } }),
  ]);
  const stats = [
    ['users', 'Tổng học sinh', students, ''],
    ['edit', 'Tổng đề thi', exams, 'amber'],
    ['chart', 'Tổng lượt thi', attempts, 'green'],
    ['clipboard', 'Đăng ký mới', newRegs, 'amber'],
    ['file', 'Bài viết', posts, ''],
    ['award', 'Điểm TB toàn hệ thống / 10', avg._avg.score ? (Math.round(avg._avg.score * 100) / 100).toLocaleString('vi-VN') : '—', 'green'],
  ];
  return (
    <>
      <PageTitle title="Tổng quan" desc="Tình hình hoạt động của trung tâm.">
        <Link href="/admin/de-thi/moi" className="btn btn-primary"><Icon name="plus" size={18} />Tạo đề thi</Link>
        <Link href="/admin/bai-viet/moi" className="btn"><Icon name="plus" size={18} />Viết bài</Link>
      </PageTitle>
      <div className="grid c3 mb-6 dashboard-stats">
        {stats.map(([ic, l, v, c]) => <div key={l} className="card stat-card"><span className={`ic ${c}`}><Icon name={ic} /></span><div><b>{v}</b><span>{l}</span></div></div>)}
      </div>
      <div className="grid split dashboard-panels">
        <section className="card">
          <div className="card-head"><h3>Kết quả thi gần đây</h3><Link href="/admin/ket-qua" className="small">Xem tất cả</Link></div>
          {recent.length ? (
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Học sinh</th><th>Đề</th><th className="num">Điểm</th><th>Thời gian</th></tr></thead>
              <tbody>{recent.map((a) => (
                <tr key={a.id}>
                  <td><Link href={`/admin/ket-qua/${a.id}`} className="cell-title">{a.user.fullName}</Link><div className="cell-sub">{fmtDateTime(a.submittedAt)}</div></td>
                  <td>{a.exam.title}</td><td className="num"><ScorePill score={a.result.score} rawScore={a.result.rawScore} maxScore={a.result.maxScore} /></td><td>{fmtDuration(a.result.durationSec)}</td>
                </tr>))}</tbody>
            </table></div>
          ) : <EmptyState icon="chart" title="Chưa có lượt thi nào">Kết quả sẽ hiển thị khi học sinh nộp bài.</EmptyState>}
        </section>
        <section className="card">
          <div className="card-head"><h3>Đăng ký khóa học mới</h3><Link href="/admin/dang-ky" className="small">Xem tất cả</Link></div>
          {regs.length ? regs.map((r) => (
            <div key={r.id} className="list-row">
              <div className="grow"><div className="cell-title">{r.fullName}</div><div className="cell-sub">{r.course?.title || '—'} · {r.phone}</div></div>
              <StatusBadge status={r.status} />
            </div>
          )) : <EmptyState icon="clipboard" title="Chưa có đăng ký" />}
        </section>
      </div>
    </>
  );
}
