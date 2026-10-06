import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { finalizeAttempt } from '@/lib/attempts';

export const runtime = 'nodejs';
const GRACE_MS = 15000; // cho phép đồng bộ muộn một chút khi hết giờ

export async function POST(req, { params }) {
  params = await params;
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });
  const attempt = await db.examAttempt.findUnique({ where: { id: params.id }, include: { orders: { select: { questionId: true } } } });
  if (!attempt || attempt.userId !== user.id) return NextResponse.json({ error: 'Không tìm thấy lượt thi.' }, { status: 404 });
  if (attempt.status !== 'IN_PROGRESS') return NextResponse.json({ error: 'Bài đã được nộp.', submitted: true }, { status: 409 });
  if (Date.now() > attempt.deadlineAt.getTime() + GRACE_MS) {
    await finalizeAttempt(attempt.id, { auto: true });
    return NextResponse.json({ error: 'Đã hết giờ làm bài.', expired: true }, { status: 409 });
  }
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 }); }
  const entries = Object.entries(body?.answers || {});
  const valid = new Set(attempt.orders.map((o) => o.questionId));
  const ops = [];
  for (const [key, raw] of entries.slice(0, 400)) {
    const [qid, sub = ''] = key.split('|');
    if (!valid.has(qid)) continue;
    const value = String(raw ?? '').slice(0, 200);
    const where = { attemptId_questionId_sub: { attemptId: attempt.id, questionId: qid, sub } };
    ops.push({ qid, sub, value, where });
  }
  if (ops.length) await db.$transaction(async tx => {
    const current = await tx.examAttempt.findUnique({ where: { id: attempt.id } });
    if (current.status !== 'IN_PROGRESS') return;
    for (const { qid, sub, value, where } of ops) {
      if (value === '') await tx.studentAnswer.deleteMany({ where: { attemptId: attempt.id, questionId: qid, sub } });
      else await tx.studentAnswer.upsert({ where, create: { attemptId: attempt.id, questionId: qid, sub, value }, update: { value } });
    }
  });
  return NextResponse.json({ ok: true, saved: ops.length, serverTime: Date.now() });
}
