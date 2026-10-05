import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { EmptyState, PageTitle, Pagination, paginate, ScorePill, StatusBadge } from '@/components/ui';
import { fmtDateTime, fmtDuration } from '@/lib/utils';

export const metadata = { title: 'Kết quả của tôi' };

export default async function MyResults({ searchParams }) {
  const user = await requireUser('/hoc-sinh/ket-qua');
  const { page, skip, take, pageSize } = paginate(searchParams, 10);
  const where = { userId: user.id, result: { isNot: null } };
  const [total, rows] = await Promise.all([
    db.examAttempt.count({ where }),
    db.examAttempt.findMany({ where, orderBy: { submittedAt: 'desc' }, skip, take, include: { exam: true, result: true } }),
  ]);
  return (
    <>
      <PageTitle title="Kết quả của tôi" desc="Lịch sử các lần làm bài và điểm số." />
      <div className="card">
        {rows.length ? (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Đề thi</th><th>Ngày làm</th><th className="num">Điểm</th><th>Thời gian</th><th>Trạng thái</th><th /></tr></thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id}>
                      <td><div className="cell-title">{a.exam.title}</div><div className="cell-sub">{a.result.correct}/{a.result.totalUnits} câu/ý đúng</div></td>
                      <td>{fmtDateTime(a.submittedAt)}</td>
                      <td className="num"><ScorePill score={a.result.score} /></td>
                      <td>{fmtDuration(a.result.durationSec)}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td><div className="actions"><Link className="btn btn-sm" href={`/hoc-sinh/ket-qua/${a.id}`}>Xem chi tiết</Link></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageCount={Math.ceil(total / pageSize)} total={total} basePath="/hoc-sinh/ket-qua" pageSize={pageSize} />
          </>
        ) : <EmptyState icon="chart" title="Bạn chưa làm đề nào" action={<Link href="/hoc-sinh/luyen-thi" className="btn btn-primary">Bắt đầu luyện thi</Link>}>Kết quả sẽ xuất hiện ở đây ngay sau khi bạn nộp bài.</EmptyState>}
      </div>
    </>
  );
}
