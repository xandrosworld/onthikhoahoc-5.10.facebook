import { notFound } from 'next/navigation';
import { loadAttemptReview, finalizeAttempt } from '@/lib/attempts';
import { db } from '@/lib/db';
import ResultView from '@/components/ResultView';
import { Breadcrumb } from '@/components/ui';
import { ConfirmButton } from '@/components/client-ui';
import { deleteAttemptAction } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Chi tiết lượt thi' };

export default async function AdminAttempt({ params }) {
  const a = await db.examAttempt.findUnique({ where: { id: params.id } });
  if (!a) notFound();
  if (a.status === 'IN_PROGRESS' && a.deadlineAt.getTime() <= Date.now()) await finalizeAttempt(a.id, { auto: true });
  const data = await loadAttemptReview(params.id);
  if (!data) return (<><Breadcrumb items={[{ label: 'Kết quả thi', href: '/admin/ket-qua' }, { label: 'Chi tiết' }]} /><div className="alert alert-info">Lượt thi này học sinh vẫn đang làm bài, chưa có kết quả.</div></>);
  return (
    <>
      <Breadcrumb items={[{ label: 'Kết quả thi', href: '/admin/ket-qua' }, { label: `${data.attempt.user.fullName} – ${data.attempt.exam.title}` }]} />
      <div className="row between wrap mb-4">
        <span />
        <ConfirmButton action={deleteAttemptAction} fields={{ id: params.id, back: '/admin/ket-qua' }} title="Xóa lượt thi?" message="Kết quả và bài làm của lượt thi này sẽ bị xóa vĩnh viễn." confirmText="Xóa lượt thi" icon="trash" className="btn btn-sm btn-danger-outline">Xóa lượt thi</ConfirmButton>
      </div>
      <ResultView data={data} admin />
    </>
  );
}
