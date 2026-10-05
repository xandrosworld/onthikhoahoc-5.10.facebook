import Link from 'next/link';
import { db } from '@/lib/db';
import Icon from '@/components/Icon';
import { PageTitle, EmptyState, StatusBadge, Pagination, paginate } from '@/components/ui';
import { ActionButton } from '@/components/client-ui';
import { toggleStudentAction } from '@/app/actions/admin';
import { fmtDate } from '@/lib/utils';

export const metadata = { title: 'Quản lý học sinh' };

export default async function AdminStudents({ searchParams }) {
  const q = (searchParams?.q || '').trim();
  const st = ['ACTIVE', 'LOCKED'].includes(searchParams?.tt) ? searchParams.tt : '';
  const where = { role: 'STUDENT', ...(st ? { status: st } : {}), ...(q ? { OR: [{ fullName: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : {}) };
  const { page, skip, take, pageSize } = paginate(searchParams, 10);
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { _count: { select: { attempts: true } } } }),
  ]);
  return (
    <>
      <PageTitle title="Học sinh" desc="Danh sách tài khoản học sinh tự đăng ký trên website." />
      <div className="card">
        <form className="toolbar" role="search">
          <input name="q" defaultValue={q} className="input search" placeholder="Tìm theo tên, email, SĐT…" aria-label="Tìm học sinh" />
          <select name="tt" defaultValue={st} className="select" aria-label="Trạng thái"><option value="">Mọi trạng thái</option><option value="ACTIVE">Hoạt động</option><option value="LOCKED">Đã khóa</option></select>
          <button className="btn btn-sm" style={{ height: 38 }}>Lọc</button>
        </form>
        {rows.length ? (
          <>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Ngày đăng ký</th><th className="num">Lượt thi</th><th>Trạng thái</th><th /></tr></thead>
              <tbody>{rows.map((u) => (
                <tr key={u.id}>
                  <td><Link href={`/admin/hoc-sinh/${u.id}`} className="cell-title">{u.fullName}</Link></td>
                  <td>{u.email}</td><td>{u.phone || '—'}</td><td className="small">{fmtDate(u.createdAt)}</td>
                  <td className="num">{u._count.attempts}</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td><div className="actions"><Link href={`/admin/hoc-sinh/${u.id}`} className="btn btn-sm">Chi tiết</Link><ActionButton action={toggleStudentAction} fields={{ id: u.id }}>{u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}</ActionButton></div></td>
                </tr>))}</tbody>
            </table></div>
            <Pagination page={page} pageCount={Math.ceil(total / pageSize)} total={total} basePath="/admin/hoc-sinh" params={{ q, tt: st }} pageSize={pageSize} />
          </>
        ) : <EmptyState icon="users" title="Không có học sinh">{q || st ? 'Thử thay đổi bộ lọc.' : 'Học sinh đăng ký tài khoản sẽ hiển thị ở đây.'}</EmptyState>}
      </div>
    </>
  );
}
