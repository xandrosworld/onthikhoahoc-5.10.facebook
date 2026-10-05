import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { loadAttemptReview, finalizeAttempt } from '@/lib/attempts';
import ResultView from '@/components/ResultView';
import { Breadcrumb } from '@/components/ui';
import { ToastOnMount } from '@/components/client-ui';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kết quả bài thi' };

export default async function ResultPage({ params, searchParams }) {
  params = await params;
  searchParams = await searchParams;
  const user = await requireUser(`/hoc-sinh/ket-qua/${params.id}`);
  const a = await db.examAttempt.findUnique({ where: { id: params.id } });
  if (!a || (a.userId !== user.id && user.role !== 'ADMIN')) notFound();
  if (a.status === 'IN_PROGRESS') {
    if (a.deadlineAt.getTime() <= Date.now()) await finalizeAttempt(a.id, { auto: true });
    else redirect(`/lam-bai/${a.id}`);
  }
  const data = await loadAttemptReview(params.id);
  if (!data) notFound();
  return (
    <>
      {searchParams?.hethan && <ToastOnMount type="info" message="Đã hết giờ. Hệ thống đã tự động nộp bài của bạn." />}
      {searchParams?.moi && <ToastOnMount message="Nộp bài thành công! Điểm của bạn đã được ghi nhận." />}
      <Breadcrumb items={[{ label: 'Kết quả của tôi', href: '/hoc-sinh/ket-qua' }, { label: data.attempt.exam.title }]} />
      <ResultView data={data} />
      <div className="row wrap mt-6">
        <Link href={`/hoc-sinh/luyen-thi/${data.attempt.examId}`} className="btn btn-primary">Làm lại đề này</Link>
        <Link href="/hoc-sinh/luyen-thi" className="btn">Chọn đề khác</Link>
        <Link href="/hoc-sinh/ket-qua" className="btn btn-ghost">Tất cả kết quả</Link>
      </div>
    </>
  );
}
