import Link from 'next/link';
import { db } from '@/lib/db';
import Icon from '@/components/Icon';
import { PageTitle, EmptyState, StatusBadge, Badge, Pagination, paginate } from '@/components/ui';
import { ConfirmButton, ActionButton, ToastOnMount } from '@/components/client-ui';
import { deleteExamAction, toggleExamAction, duplicateExamAction } from '@/app/actions/admin';
import { countByType } from '@/components/cards';
import { fmtDate } from '@/lib/utils';

export const metadata = { title: 'Quản lý đề thi' };

export default async function AdminExams({ searchParams }) {
  searchParams = await searchParams;
  const q = (searchParams?.q || '').trim();
  const where = q ? { title: { contains: q } } : {};
  const { page, skip, take, pageSize } = paginate(searchParams, 10);
  const [total, exams] = await Promise.all([
    db.exam.count({ where }),
    db.exam.findMany({ where, orderBy: { updatedAt: 'desc' }, skip, take, include: { sections: { include: { _count: { select: { questions: { where: { retired: false } } } } } }, _count: { select: { attempts: true } } } }),
  ]);
  return (
    <>
      {searchParams?.saved && <ToastOnMount message="Đã lưu đề thi." />}
      <PageTitle title="Đề thi" desc="Chọn mẫu đề, soạn câu hỏi và thiết lập điểm từng phần.">
        <Link href="/admin/de-thi/moi" className="btn btn-primary"><Icon name="plus" size={18} />Tạo đề thi</Link>
      </PageTitle>
      <div className="card">
        <form className="toolbar" role="search"><input name="q" defaultValue={q} className="input search" placeholder="Tìm đề thi…" aria-label="Tìm đề thi" /><button className="btn btn-sm" style={{ height: 38 }}>Tìm</button></form>
        {exams.length ? (
          <>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Đề thi</th><th>Khối</th><th>Thời gian</th><th>Số câu (I · II · III)</th><th>Lượt thi</th><th>Trạng thái</th><th /></tr></thead>
              <tbody>{exams.map((e) => {
                const c = countByType(e);
                return (
                  <tr key={e.id}>
                    <td><Link href={`/admin/de-thi/${e.id}`} className="cell-title">{e.title}</Link><div className="cell-sub">Cập nhật {fmtDate(e.updatedAt)} {e.shuffleQuestions && <Badge tone="info"><Icon name="shuffle" size={12} />Hoán đổi</Badge>}</div></td>
                    <td>Lớp {e.grade}</td><td>{e.durationMinutes} phút</td>
                    <td>{c.mc} · {c.tf} · {c.sa}</td>
                    <td>{e._count.attempts}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td><div className="actions">
                      <Link href={`/admin/de-thi/${e.id}`} className="btn btn-sm">Sửa</Link>
                      <ActionButton action={toggleExamAction} fields={{ id: e.id }}>{e.status === 'PUBLISHED' ? 'Hủy công bố' : 'Công bố'}</ActionButton>
                      <ActionButton action={duplicateExamAction} fields={{ id: e.id }} className="btn btn-sm btn-icon" pendingText="…"><Icon name="copy" size={16} /></ActionButton>
                      <ConfirmButton action={deleteExamAction} fields={{ id: e.id }} title="Xóa đề thi?" message={<>Đề <b>{e.title}</b> cùng toàn bộ câu hỏi{e._count.attempts ? <> và <b>{e._count.attempts} lượt thi</b></> : ''} sẽ bị xóa vĩnh viễn.</>} confirmText="Xóa đề" icon="trash" ariaLabel={`Xóa ${e.title}`} className="btn btn-sm btn-icon btn-danger-outline" />
                    </div></td>
                  </tr>
                );
              })}</tbody>
            </table></div>
            <Pagination page={page} pageCount={Math.ceil(total / pageSize)} total={total} basePath="/admin/de-thi" params={{ q }} pageSize={pageSize} />
          </>
        ) : <EmptyState icon="edit" title="Chưa có đề thi" action={<Link href="/admin/de-thi/moi" className="btn btn-primary">Tạo đề thi đầu tiên</Link>}>Soạn đề trực tiếp bằng trình tạo đề — không cần tải file Word.</EmptyState>}
      </div>
    </>
  );
}
