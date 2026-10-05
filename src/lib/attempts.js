import { db } from './db';
import { gradeAttempt, shuffle } from './grading';
import { SECTION_TYPES } from './utils';

export const examInclude = {
  sections: {
    orderBy: { order: 'asc' },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: { orderBy: { label: 'asc' } },
          statements: { orderBy: { label: 'asc' } },
          shortAnswers: true,
        },
      },
    },
  },
};

/** Bắt đầu (hoặc tiếp tục) lượt thi. Mỗi lượt có thứ tự câu hỏi riêng, lưu trong DB. */
export async function startAttempt(userId, examId) {
  const exam = await db.exam.findUnique({ where: { id: examId }, include: examInclude });
  if (!exam || exam.status !== 'PUBLISHED') throw new Error('Đề thi không tồn tại hoặc chưa được công bố.');
  const total = exam.sections.reduce((n, s) => n + s.questions.length, 0);
  if (total === 0) throw new Error('Đề thi chưa có câu hỏi.');

  const existing = await db.examAttempt.findFirst({
    where: { userId, examId, status: 'IN_PROGRESS' },
    orderBy: { startedAt: 'desc' },
  });
  if (existing) {
    if (existing.deadlineAt.getTime() > Date.now()) return existing;
    await finalizeAttempt(existing.id, { auto: true });
  }

  const now = new Date();
  const attempt = await db.examAttempt.create({
    data: { examId, userId, startedAt: now, deadlineAt: new Date(now.getTime() + exam.durationMinutes * 60000) },
  });
  const rows = [];
  for (const s of exam.sections) {
    // Chỉ hoán đổi TRONG từng phần — không bao giờ trộn giữa các phần.
    const ids = s.questions.map((q) => q.id);
    const ordered = exam.shuffleQuestions ? shuffle(ids) : ids;
    ordered.forEach((questionId, i) => rows.push({ attemptId: attempt.id, sectionType: s.type, questionId, position: i }));
  }
  await db.attemptQuestionOrder.createMany({ data: rows });
  return attempt;
}

/** Dữ liệu để dựng giao diện làm bài (KHÔNG chứa đáp án đúng). */
export async function loadAttemptForTaking(attemptId) {
  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: { include: examInclude }, orders: true, answers: true, user: true },
  });
  if (!attempt) return null;
  const qMap = new Map();
  for (const s of attempt.exam.sections) for (const q of s.questions) qMap.set(q.id, q);
  const sections = SECTION_TYPES.map((type) => {
    const orders = attempt.orders.filter((o) => o.sectionType === type).sort((a, b) => a.position - b.position);
    const questions = orders
      .map((o) => qMap.get(o.questionId))
      .filter(Boolean)
      .map((q) => ({
        id: q.id,
        content: q.content,
        options: q.options.map((o) => ({ label: o.label, content: o.content })),
        statements: q.statements.map((s) => ({ label: s.label, content: s.content })),
      }));
    return { type, questions };
  }).filter((s) => s.questions.length);
  const answers = {};
  for (const a of attempt.answers) answers[`${a.questionId}|${a.sub}`] = a.value;
  return { attempt, sections, answers };
}

/** Nộp bài + chấm điểm + lưu kết quả. Idempotent. */
export async function finalizeAttempt(attemptId, { auto = false } = {}) {
  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: { include: examInclude }, answers: true, orders: true, result: true },
  });
  if (!attempt) throw new Error('Không tìm thấy lượt thi.');
  if (attempt.status !== 'IN_PROGRESS' && attempt.result) return attempt.result;

  const now = Date.now();
  const end = Math.min(now, attempt.deadlineAt.getTime());
  const durationSec = Math.max(0, Math.round((end - attempt.startedAt.getTime()) / 1000));
  const answers = {};
  for (const a of attempt.answers) answers[`${a.questionId}|${a.sub}`] = a.value;
  const g = gradeAttempt(attempt.exam.sections, answers, durationSec);
  const { perQuestion, ...summary } = g;

  return db.$transaction(async (tx) => {
    const fresh = await tx.examAttempt.findUnique({ where: { id: attemptId }, include: { result: true } });
    if (fresh.result) return fresh.result;
    await tx.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: auto ? 'EXPIRED' : 'SUBMITTED',
        submittedAt: new Date(end),
        autoSubmitted: auto,
      },
    });
    return tx.examResult.create({
      data: {
        attemptId,
        score: summary.score,
        totalUnits: summary.totalUnits,
        correct: summary.correct,
        wrong: summary.wrong,
        unanswered: summary.unanswered,
        durationSec,
        breakdown: JSON.stringify(summary.breakdown),
      },
    });
  });
}

/** Dữ liệu trang kết quả chi tiết (có đáp án đúng để học sinh xem lại). */
export async function loadAttemptReview(attemptId) {
  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: { include: examInclude }, orders: true, answers: true, result: true, user: true },
  });
  if (!attempt || !attempt.result) return null;
  const answers = {};
  for (const a of attempt.answers) answers[`${a.questionId}|${a.sub}`] = a.value;
  const g = gradeAttempt(attempt.exam.sections, answers, attempt.result.durationSec);
  const qMap = new Map();
  for (const s of attempt.exam.sections) for (const q of s.questions) qMap.set(q.id, q);
  const sections = SECTION_TYPES.map((type) => {
    const orders = attempt.orders.filter((o) => o.sectionType === type).sort((a, b) => a.position - b.position);
    return { type, questions: orders.map((o) => qMap.get(o.questionId)).filter(Boolean) };
  }).filter((s) => s.questions.length);
  return { attempt, sections, answers, graded: g, perQuestion: g.perQuestion };
}
