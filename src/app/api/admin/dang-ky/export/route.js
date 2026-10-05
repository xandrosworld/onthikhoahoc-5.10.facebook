import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { REG_STATUS } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export async function GET(req) {
  const user = await apiUser();
  if (!user || user.role !== 'ADMIN') return new Response('Forbidden', { status: 403 });
  const sp = new URL(req.url).searchParams;
  const q = (sp.get('q') || '').trim();
  const where = {
    ...(sp.get('khoa') ? { courseId: sp.get('khoa') } : {}),
    ...(REG_STATUS[sp.get('tt')] ? { status: sp.get('tt') } : {}),
    ...(q ? { OR: [{ fullName: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }] } : {}),
  };
  const rows = await db.courseRegistration.findMany({ where, orderBy: { createdAt: 'desc' }, include: { course: true } });
  const lines = [['Họ tên', 'Số điện thoại', 'Email', 'Khóa học', 'Lớp', 'Ghi chú', 'Trạng thái', 'Ngày đăng ký'].map(csv).join(',')];
  for (const r of rows) lines.push([r.fullName, r.phone, r.email, r.course?.title, r.currentGrade, r.note, REG_STATUS[r.status]?.label, r.createdAt.toISOString()].map(csv).join(','));
  return new Response('\ufeff' + lines.join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="dang-ky-khoa-hoc.csv"' } });
}
