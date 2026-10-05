import Link from 'next/link';
import { db } from '@/lib/db';
import Icon from '@/components/Icon';
import Cover from '@/components/Cover';
import { PageTitle, EmptyState, StatusBadge, Badge, Pagination, paginate } from '@/components/ui';
import { ConfirmButton, ActionButton, ToastOnMount } from '@/components/client-ui';
import { deletePostAction, togglePostAction } from '@/app/actions/admin';
import { CATEGORY_LABEL, fmtDate } from '@/lib/utils';

export const metadata = { title: 'Quản lý bài viết' };

export default async function AdminPosts({ searchParams }) {
  searchParams = await searchParams;
  const q = (searchParams?.q || '').trim();
  const cat = CATEGORY_LABEL[searchParams?.loai] ? searchParams.loai : '';
  const where = { ...(q ? { title: { contains: q } } : {}), ...(cat ? { category: cat } : {}) };
  const { page, skip, take, pageSize } = paginate(searchParams, 10);
  const [total, posts] = await Promise.all([db.post.count({ where }), db.post.findMany({ where, orderBy: { updatedAt: 'desc' }, skip, take })]);
  return (
    <>
      {searchParams?.saved && <ToastOnMount message="Đã lưu bài viết." />}
      <PageTitle title="Bài viết" desc="Đăng bài viết, tài liệu PDF và video bài giảng.">
        <Link href="/admin/bai-viet/moi" className="btn btn-primary"><Icon name="plus" size={18} />Viết bài mới</Link>
      </PageTitle>
      <div className="card">
        <form className="toolbar" role="search">
          <input name="q" defaultValue={q} className="input search" placeholder="Tìm bài viết…" aria-label="Tìm bài viết" />
          <select name="loai" defaultValue={cat} className="select" aria-label="Loại bài"><option value="">Tất cả loại</option>{Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <button className="btn btn-sm" style={{ height: 38 }}>Lọc</button>
        </form>
        {posts.length ? (
          <>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Bài viết</th><th>Loại</th><th>Đính kèm</th><th>Ngày đăng</th><th>Trạng thái</th><th /></tr></thead>
              <tbody>{posts.map((p) => (
                <tr key={p.id}>
                  <td><div className="row"><div className="thumb"><Cover url={p.coverUrl} theme={p.theme} seed={p.slug} /></div><div><Link href={`/admin/bai-viet/${p.id}`} className="cell-title">{p.title}</Link><div className="cell-sub">/{p.slug}</div></div></div></td>
                  <td><Badge tone="primary">{CATEGORY_LABEL[p.category]}</Badge></td>
                  <td><div className="row" style={{ gap: 6 }}>{p.pdfUrl && <Badge tone="danger">PDF</Badge>}{p.videoUrl && <Badge tone="info">Video</Badge>}{!p.pdfUrl && !p.videoUrl && <span className="muted">—</span>}</div></td>
                  <td className="small">{fmtDate(p.publishedAt || p.createdAt)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td><div className="actions">
                    {p.status === 'PUBLISHED' && <Link href={`/bai-viet/${p.slug}`} target="_blank" className="btn btn-sm btn-icon" aria-label="Xem trên website"><Icon name="external" size={16} /></Link>}
                    <ActionButton action={togglePostAction} fields={{ id: p.id }}>{p.status === 'PUBLISHED' ? 'Hủy đăng' : 'Đăng bài'}</ActionButton>
                    <Link href={`/admin/bai-viet/${p.id}`} className="btn btn-sm">Sửa</Link>
                    <ConfirmButton action={deletePostAction} fields={{ id: p.id }} title="Xóa bài viết?" message={<>Bài <b>{p.title}</b> sẽ bị xóa vĩnh viễn.</>} confirmText="Xóa bài" icon="trash" ariaLabel={`Xóa ${p.title}`} className="btn btn-sm btn-icon btn-danger-outline" />
                  </div></td>
                </tr>))}</tbody>
            </table></div>
            <Pagination page={page} pageCount={Math.ceil(total / pageSize)} total={total} basePath="/admin/bai-viet" params={{ q, loai: cat }} pageSize={pageSize} />
          </>
        ) : <EmptyState icon="file" title="Chưa có bài viết" action={<Link href="/admin/bai-viet/moi" className="btn btn-primary">Viết bài đầu tiên</Link>}>Đăng tài liệu, bí quyết ôn thi hoặc video bài giảng.</EmptyState>}
      </div>
    </>
  );
}
