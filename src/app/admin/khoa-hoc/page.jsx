import Link from 'next/link';
import { db } from '@/lib/db';
import Icon from '@/components/Icon';
import Cover from '@/components/Cover';
import { PageTitle, EmptyState, StatusBadge, Badge } from '@/components/ui';
import { ConfirmButton, ActionButton, ToastOnMount } from '@/components/client-ui';
import { deleteCourseAction, toggleCourseAction } from '@/app/actions/admin';

export const metadata = { title: 'Quản lý khóa học' };

export default async function AdminCourses({ searchParams }) {
  searchParams = await searchParams;
  const courses = await db.course.findMany({ orderBy: { createdAt: 'asc' }, include: { _count: { select: { registrations: true } } } });
  return (
    <>
      {searchParams?.saved && <ToastOnMount message="Đã lưu khóa học." />}
      <PageTitle title="Khóa học" desc="Tạo và quản lý các khóa học hiển thị trên website.">
        <Link href="/admin/khoa-hoc/moi" className="btn btn-primary"><Icon name="plus" size={18} />Thêm khóa học</Link>
      </PageTitle>
      <div className="card">
        {courses.length ? (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Khóa học</th><th>Khối</th><th>Thời lượng</th><th>Đăng ký</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>{courses.map((c) => (
              <tr key={c.id}>
                <td><div className="row"><div className="thumb"><Cover url={c.coverUrl} theme={c.theme} seed={c.slug} /></div><div><Link href={`/admin/khoa-hoc/${c.id}`} className="cell-title">{c.title}</Link><div className="cell-sub">/{c.slug} {c.featured && <Badge tone="warning">Nổi bật</Badge>}</div></div></div></td>
                <td>Lớp {c.grade}</td><td>{c.duration}</td>
                <td><Link href={`/admin/dang-ky?khoa=${c.id}`}>{c._count.registrations}</Link></td>
                <td><StatusBadge status={c.status} /></td>
                <td><div className="actions">
                  <Link href={`/khoa-hoc/${c.slug}`} className="btn btn-sm btn-icon" aria-label="Xem trên website" target="_blank"><Icon name="external" size={16} /></Link>
                  <ActionButton action={toggleCourseAction} fields={{ id: c.id }}>{c.status === 'PUBLISHED' ? 'Ẩn' : 'Công bố'}</ActionButton>
                  <Link href={`/admin/khoa-hoc/${c.id}`} className="btn btn-sm">Sửa</Link>
                  <ConfirmButton action={deleteCourseAction} fields={{ id: c.id }} title="Xóa khóa học?" message={<>Khóa học <b>{c.title}</b> sẽ bị xóa. Các đăng ký liên quan vẫn được giữ lại. Thao tác này không thể hoàn tác.</>} confirmText="Xóa khóa học" icon="trash" ariaLabel={`Xóa ${c.title}`} className="btn btn-sm btn-icon btn-danger-outline" />
                </div></td>
              </tr>))}</tbody>
          </table></div>
        ) : <EmptyState icon="book" title="Chưa có khóa học" action={<Link href="/admin/khoa-hoc/moi" className="btn btn-primary">Thêm khóa học</Link>}>Tạo khóa học đầu tiên để hiển thị trên website.</EmptyState>}
      </div>
    </>
  );
}
