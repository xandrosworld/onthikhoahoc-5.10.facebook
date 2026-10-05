import Link from 'next/link';
import { db } from '@/lib/db';
import Icon from '@/components/Icon';
import { PageTitle, EmptyState, StatusBadge, Pagination, paginate } from '@/components/ui';
import { ConfirmButton } from '@/components/client-ui';
import { deleteRegistrationAction, setRegistrationStatusAction } from '@/app/actions/admin';
import { fmtDateTime, REG_STATUS } from '@/lib/utils';

export const metadata = { title: 'Đăng ký khóa học' };

export default async function AdminRegistrations({ searchParams }) {
  const q = (searchParams?.q || '').trim();
  const khoa = searchParams?.khoa || '';
  const st = REG_STATUS[searchParams?.tt] ? searchParams.tt : '';
  const { page, skip, take, pageSize } = paginate(searchParams, 10);
  const where = {
    ...(khoa ? { courseId: khoa } : {}), ...(st ? { status: st } : {}),
    ...(q ? { OR: [{ fullName: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }] } : {}),
  };
  const [total, rows, courses] = await Promise.all([
    db.courseRegistration.count({ where }),
    db.courseRegistration.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { course: true } }),
    db.course.findMany({ select: { id: true, title: true }, orderBy: { createdAt: 'asc' } }),
  ]);
  const exportQs = new URLSearchParams({ ...(q && { q }), ...(khoa && { khoa }), ...(st && { tt: st }) }).toString();
  return (
    <>
      <PageTitle title="Đăng ký khóa học" desc="Danh sách học sinh đã gửi đăng ký trên website.">
        <a href={`/api/admin/dang-ky/export?${exportQs}`} className="btn"><Icon name="download" size={18} />Xuất CSV</a>
      </PageTitle>
      <div className="card">
        <form className="toolbar" role="search">
          <input name="q" defaultValue={q} className="input search" placeholder="Tìm theo tên, SĐT, email…" aria-label="Tìm kiếm" />
          <select name="khoa" defaultValue={khoa} className="select" aria-label="Lọc theo khóa học"><option value="">Tất cả khóa học</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
          <select name="tt" defaultValue={st} className="select" aria-label="Lọc theo trạng thái"><option value="">Mọi trạng thái</option>{Object.entries(REG_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          <button className="btn btn-primary btn-sm" style={{ height: 38 }}>Lọc</button>
          {(q || khoa || st) && <Link href="/admin/dang-ky" className="btn btn-ghost btn-sm">Xóa lọc</Link>}
        </form>
        {rows.length ? (
          <>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Họ tên</th><th>Liên hệ</th><th>Khóa đăng ký</th><th>Lớp</th><th>Ghi chú</th><th>Ngày đăng ký</th><th>Trạng thái</th><th /></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id}>
                  <td><div className="cell-title">{r.fullName}</div></td>
                  <td><div>{r.phone}</div><div className="cell-sub">{r.email}</div></td>
                  <td>{r.course?.title || <span className="muted">Đã xóa</span>}</td>
                  <td>{/^\d+$/.test(r.currentGrade) ? `Lớp ${r.currentGrade}` : r.currentGrade}</td>
                  <td style={{ maxWidth: 220 }}><span className="small muted">{r.note || '—'}</span></td>
                  <td className="small">{fmtDateTime(r.createdAt)}</td>
                  <td>
                    <form action={setRegistrationStatusAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <label className="sr-only" htmlFor={`st-${r.id}`}>Trạng thái</label>
                      <select id={`st-${r.id}`} name="status" defaultValue={r.status} className="select" style={{ height: 34, fontSize: '.85rem', minWidth: 130 }} onChange={undefined}>
                        {Object.entries(REG_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <button className="btn btn-sm btn-ghost" style={{ marginLeft: 4 }} aria-label="Cập nhật trạng thái"><Icon name="check" size={16} /></button>
                    </form>
                  </td>
                  <td><div className="actions"><ConfirmButton action={deleteRegistrationAction} fields={{ id: r.id }} title="Xóa đăng ký?" message={<>Xóa đăng ký của <b>{r.fullName}</b>?</>} confirmText="Xóa" icon="trash" ariaLabel="Xóa đăng ký" className="btn btn-sm btn-icon btn-danger-outline" /></div></td>
                </tr>))}</tbody>
            </table></div>
            <Pagination page={page} pageCount={Math.ceil(total / pageSize)} total={total} basePath="/admin/dang-ky" params={{ q, khoa, tt: st }} pageSize={pageSize} />
          </>
        ) : <EmptyState icon="clipboard" title="Không có đăng ký nào">{q || khoa || st ? 'Thử thay đổi bộ lọc.' : 'Các đăng ký từ website sẽ xuất hiện ở đây.'}</EmptyState>}
      </div>
    </>
  );
}
