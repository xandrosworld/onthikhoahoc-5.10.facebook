'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { startAttempt } from '@/lib/attempts';

export async function startExamAction(fd) {
  const user = await requireUser('/hoc-sinh/luyen-thi');
  const examId = String(fd.get('examId') || '');
  let attempt;
  try {
    attempt = await startAttempt(user.id, examId);
  } catch (e) {
    redirect(`/hoc-sinh/luyen-thi/${examId}?loi=${encodeURIComponent(e.message)}`);
  }
  redirect(`/lam-bai/${attempt.id}`);
}
