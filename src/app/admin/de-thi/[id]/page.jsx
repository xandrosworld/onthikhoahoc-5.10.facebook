import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { examInclude } from '@/lib/attempts';
import { Breadcrumb } from '@/components/ui';
import ExamBuilder from '../ExamBuilder';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Soạn đề thi' };

function toState(exam) {
  const sections = { MULTIPLE_CHOICE: [], TRUE_FALSE: [], SHORT_ANSWER: [] };
  const sectionSettings = {};
  for (const s of exam.sections) {
    sectionSettings[s.type] = { pointsPerQuestion: s.pointsPerQuestion, tfScoring: s.tfScoring };
    for (const q of s.questions) {
      const base = { id: q.id, content: q.content, explanation: q.explanation, points: q.points };
      if (s.type === 'MULTIPLE_CHOICE') {
        sections.MULTIPLE_CHOICE.push({ ...base, options: ['A', 'B', 'C', 'D'].map((l) => { const o = q.options.find((x) => x.label === l); return { content: o?.content || '', isCorrect: !!o?.isCorrect }; }) });
      } else if (s.type === 'TRUE_FALSE') {
        sections.TRUE_FALSE.push({ ...base, statements: ['a', 'b', 'c', 'd'].map((l) => { const o = q.statements.find((x) => x.label === l); return { content: o?.content || '', isTrue: !!o?.isTrue }; }) });
      } else {
        const sorted = [...q.shortAnswers].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
        sections.SHORT_ANSWER.push({ ...base, answers: sorted.length ? sorted.map((a) => a.answer) : [''] });
      }
    }
  }
  return { id: exam.id, template: exam.template, sectionSettings, title: exam.title, description: exam.description, grade: exam.grade, durationMinutes: exam.durationMinutes, shuffleQuestions: exam.shuffleQuestions, status: exam.status, sections };
}

export default async function EditExam({ params }) {
  params = await params;
  const exam = await db.exam.findUnique({ where: { id: params.id }, include: examInclude });
  if (!exam) notFound();
  const attempts = await db.examAttempt.count({ where: { examId: exam.id } });
  return (
    <>
      <Breadcrumb items={[{ label: 'Đề thi', href: '/admin/de-thi' }, { label: exam.title }]} />
      <ExamBuilder key={exam.updatedAt.getTime()} initial={toState(exam)} attemptCount={attempts} />
    </>
  );
}
