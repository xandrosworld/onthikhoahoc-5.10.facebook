import Link from 'next/link';
import { db } from '@/lib/db';
import { PageTitle, EmptyState, Pagination, paginate, ScorePill, StatusBadge } from '@/components/ui';
import { fmtDateTime, fmtDuration } from '@/lib/utils';

export const metadata = { title: 'Kết quả thi' };

export default async function AdminResults({ searchParams }) {
  searchParams = await searchParams;
  const q = (searchParams?.q || '').trim();
  const de = searchParams?.de || '';
  const hs = searchParams?.hs || '';
  const where = {
    result: { isNot: null },
    ...(de ? { examId: de } : {}), ...(hs ? { userId: hs } : {}),
    ...(q ? { user: { OR: [{ fullName: { contains: q } }, { email: { contains: q } }] } } : {}),
  };
  const { page, skip, take, pageSize } = paginate(searchParams, 12);
  const [total, rows, exams] = await Promise.all([
    db.examAttempt.count({ where }),
    db.examAttempt.findMany({ where, orderBy: { submittedAt: 'desc' }, skip, take, include: { user: true, exam: true, result: true } }),
    db.exam.findMany({ select: { id: true, title: true }, orderBy: { createdAt: 'desc' } }),
  ]);
  const student = hs ? await db.user.findUnique({ where: { id: hs }, select: { fullName: true } }) : null;
  return (
    <>
      <PageTitle title="Kết quả thi" desc="Toàn bộ lượt làm bài đã nộp của học sinh." />
      <div className="card">
        <form className="toolbar" role="search">
          <input name="q" defaultValue={q} className="input search" placeholder="Tìm học sinh theo tên, email…" aria-label="Tìm học sinh" />
          <select name="de" defaultValue={de} className="select" aria-label="Lọc theo đề"><option value="">Tất cả đề thi</option>{exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select>
          {hs && <input type="hidden" name="hs" value={hs} />}
          <button className="btn btn-sm" style={{ height: 38 }}>Lọc</button>
          {(q || de || hs) && <Link href="/admin/ket-qua" className="btn btn-ghost btn-sm">Xóa lọc</Link>}
        </form>
        {student && <div className="alert alert-info" style={{ margin: 16 }}>Đang lọc theo học sinh: <b>{student.fullName}</b></div>}
        {rows.length ? (
          <>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Học sinh</th><th>Đề thi</th><th className="num">Điểm</th><th>Đúng / tổng</th><th>Thời gian</th><th>Ngày thi</th><th /></tr></thead>
              <tbody>{rows.map((a) => (
                <tr key={a.id}>
                  <td><Link href={`/admin/hoc-sinh/${a.userId}`} className="cell-title">{a.user.fullName}</Link><div className="cell-sub">{a.user.email}</div></td>
                  <td>{a.exam.title}{a.autoSubmitted && <div className="cell-sub">Hết giờ tự nộp</div>}</td>
                  <td className="num"><ScorePill score={a.result.score} rawScore={a.result.rawScore} maxScore={a.result.maxScore} /></td>
                  <td>{a.result.correct}/{a.result.totalUnits}</td>
                  <td>{fmtDuration(a.result.durationSec)}</td>
                  <td className="small">{fmtDateTime(a.submittedAt)}</td>
                  <td><div className="actions"><Link href={`/admin/ket-qua/${a.id}`} className="btn btn-sm">Xem chi tiết</Link></div></td>
                </tr>))}</tbody>
            </table></div>
            <Pagination page={page} pageCount={Math.ceil(total / pageSize)} total={total} basePath="/admin/ket-qua" params={{ q, de, hs }} pageSize={pageSize} />
          </>
        ) : <EmptyState icon="chart" title="Không có kết quả">{q || de || hs ? 'Thử thay đổi bộ lọc.' : 'Kết quả sẽ xuất hiện khi học sinh nộp bài.'}</EmptyState>}
      </div>
    </>
  );
}
