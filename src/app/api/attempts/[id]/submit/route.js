import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { finalizeAttempt } from '@/lib/attempts';

export const runtime = 'nodejs';

export async function POST(req, { params }) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });
  const attempt = await db.examAttempt.findUnique({ where: { id: params.id } });
  if (!attempt || attempt.userId !== user.id) return NextResponse.json({ error: 'Không tìm thấy lượt thi.' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const expired = Date.now() >= attempt.deadlineAt.getTime();
  // Chỉ coi là "tự nộp" khi thực sự đã hết giờ (do server quyết định)
  await finalizeAttempt(attempt.id, { auto: expired && !!body?.auto });
  return NextResponse.json({ ok: true, redirect: `/hoc-sinh/ket-qua/${attempt.id}${expired ? '?hethan=1' : '?moi=1'}` });
}
