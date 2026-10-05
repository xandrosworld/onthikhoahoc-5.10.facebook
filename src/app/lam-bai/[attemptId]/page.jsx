import { redirect, notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { loadAttemptForTaking, finalizeAttempt } from '@/lib/attempts';
import ExamRunner from './ExamRunner';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Làm bài thi', robots: { index: false } };

export default async function TakeExam({ params }) {
  params = await params;
  const user = await requireUser(`/lam-bai/${params.attemptId}`);
  const data = await loadAttemptForTaking(params.attemptId);
  if (!data || data.attempt.userId !== user.id) notFound();
  const { attempt, sections, answers } = data;
  if (attempt.status !== 'IN_PROGRESS') redirect(`/hoc-sinh/ket-qua/${attempt.id}`);
  if (attempt.deadlineAt.getTime() <= Date.now()) {
    await finalizeAttempt(attempt.id, { auto: true });
    redirect(`/hoc-sinh/ket-qua/${attempt.id}?hethan=1`);
  }
  return (
    <ExamRunner
      attemptId={attempt.id}
      title={attempt.exam.title}
      studentName={user.fullName}
      sections={sections}
      initialAnswers={answers}
      deadline={attempt.deadlineAt.getTime()}
      serverNow={Date.now()}
    />
  );
}
