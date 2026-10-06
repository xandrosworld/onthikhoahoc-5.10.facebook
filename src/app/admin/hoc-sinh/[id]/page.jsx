import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PageTitle, Breadcrumb, EmptyState, StatusBadge, ScorePill } from '@/components/ui';
import { ConfirmButton, ActionButton } from '@/components/client-ui';
import { toggleStudentAction, deleteStudentAction } from '@/app/actions/admin';
import { fmtDate, fmtDateTime, fmtDuration, fmtScore, initials } from '@/lib/utils';

export const metadata = { title: 'Chi tiết học sinh' };

export default async function StudentDetail({ params }) {
  params = await params;
  const u = await db.user.findFirst({ where: { id: params.id, role: 'STUDENT' }, include: { profile: true, attempts: { orderBy: { startedAt: 'desc' }, include: { exam: true, result: true } }, registrations: { include: { course: true }, orderBy: { createdAt: 'desc' } } } });
  if (!u) notFound();
  const done = u.attempts.filter((a) => a.result);
  const avg = done.length ? done.reduce((n, a) => n + a.result.score, 0) / done.length : null;
  const best = done.length ? Math.max(...done.map((a) => a.result.score)) : null;
  return (
    <>
      <Breadcrumb items={[{ label: 'Học sinh', href: '/admin/hoc-sinh' }, { label: u.fullName }]} />
      <PageTitle title={u.fullName} desc={u.email}>
        <ActionButton action={toggleStudentAction} fields={{ id: u.id }} className="btn">{u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}</ActionButton>
        <ConfirmButton action={deleteStudentAction} fields={{ id: u.id }} title="Xóa học sinh?" message={<>Tài khoản <b>{u.fullName}</b> cùng toàn bộ lịch sử làm bài sẽ bị xóa vĩnh viễn.</>} confirmText="Xóa tài khoản" icon="trash" className="btn btn-danger-outline">Xóa</ConfirmButton>
      </PageTitle>
      <div className="grid split-side">
        <div className="stack">
          <div className="card card-pad">
            <div className="row mb-4"><span className="avatar" style={{ width: 52, height: 52, fontSize: '1.2rem' }}>{initials(u.fullName)}</span><div><b>{u.fullName}</b><div><StatusBadge status={u.status} /></div></div></div>
            <ul className="info-list">
              <li><span>Email</span><span>{u.email}</span></li>
              <li><span>Điện thoại</span><span>{u.phone || '—'}</span></li>
              <li><span>Lớp</span><span>{u.profile?.grade || '—'}</span></li>
              <li><span>Trường</span><span>{u.profile?.school || '—'}</span></li>
              <li><span>Ngày đăng ký</span><span>{fmtDate(u.createdAt)}</span></li>
            </ul>
          </div>
          <div className="grid c2" style={{ gap: 12 }}>
            <div className="card card-pad" style={{ padding: 16 }}><div className="small muted">Lượt thi</div><b style={{ fontSize: '1.5rem' }}>{done.length}</b></div>
            <div className="card card-pad" style={{ padding: 16 }}><div className="small muted">Điểm TB / 10</div><b style={{ fontSize: '1.5rem' }}>{avg != null ? fmtScore(avg) : '—'}</b></div>
            <div className="card card-pad" style={{ padding: 16 }}><div className="small muted">Điểm cao nhất / 10</div><b style={{ fontSize: '1.5rem' }}>{best != null ? fmtScore(best) : '—'}</b></div>
            <div className="card card-pad" style={{ padding: 16 }}><div className="small muted">Đăng ký khóa</div><b style={{ fontSize: '1.5rem' }}>{u.registrations.length}</b></div>
          </div>
          {u.registrations.length > 0 && (
            <div className="card card-pad"><h4>Khóa học đã đăng ký</h4>{u.registrations.map((r) => <div key={r.id} className="small" style={{ padding: '6px 0' }}>{r.course?.title || '—'} · <StatusBadge status={r.status} /></div>)}</div>
          )}
        </div>
        <div className="card">
          <div className="card-head"><h3>Lịch sử làm đề</h3></div>
          {u.attempts.length ? (
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Đề thi</th><th>Ngày làm</th><th className="num">Điểm</th><th>Thời gian</th><th /></tr></thead>
              <tbody>{u.attempts.map((a) => (
                <tr key={a.id}>
                  <td className="cell-title">{a.exam.title}</td><td className="small">{fmtDateTime(a.startedAt)}</td>
                  <td className="num">{a.result ? <ScorePill score={a.result.score} rawScore={a.result.rawScore} maxScore={a.result.maxScore} /> : <StatusBadge status={a.status} />}</td>
                  <td>{a.result ? fmtDuration(a.result.durationSec) : '—'}</td>
                  <td>{a.result && <Link href={`/admin/ket-qua/${a.id}`} className="btn btn-sm">Chi tiết</Link>}</td>
                </tr>))}</tbody>
            </table></div>
          ) : <EmptyState icon="clipboard" title="Chưa làm đề nào" />}
        </div>
      </div>
    </>
  );
}
