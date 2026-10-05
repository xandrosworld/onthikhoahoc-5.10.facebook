'use server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';

const phoneRe = /^(\+84|0)\d{9,10}$/;

const schema = z.object({
  fullName: z.string().trim().min(2, 'Vui lòng nhập họ và tên.').max(80),
  phone: z.string().trim().regex(phoneRe, 'Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0).'),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ.'),
  courseId: z.string().min(1, 'Vui lòng chọn khóa học.'),
  currentGrade: z.string().min(1, 'Vui lòng chọn lớp hiện tại.'),
  note: z.string().trim().max(1000, 'Ghi chú tối đa 1000 ký tự.').optional(),
});

export async function registerCourseAction(_prev, fd) {
  const values = Object.fromEntries(['fullName', 'phone', 'email', 'courseId', 'currentGrade', 'note'].map((k) => [k, String(fd.get(k) ?? '')]));
  // honeypot chống spam
  if (fd.get('website')) return { ok: true, name: values.fullName };
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const errors = {};
    for (const i of parsed.error.issues) if (!errors[i.path[0]]) errors[i.path[0]] = i.message;
    return { errors, values };
  }
  const d = parsed.data;
  const course = await db.course.findFirst({ where: { id: d.courseId, status: 'PUBLISHED' } });
  if (!course) return { errors: { courseId: 'Khóa học không còn khả dụng.' }, values };
  const user = await getUser();
  const dup = await db.courseRegistration.findFirst({
    where: { courseId: d.courseId, phone: d.phone, createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) } },
  });
  if (!dup) {
    await db.courseRegistration.create({
      data: { courseId: d.courseId, userId: user?.id ?? null, fullName: d.fullName, phone: d.phone, email: d.email, currentGrade: d.currentGrade, note: d.note || null },
    });
  }
  return { ok: true, name: d.fullName, course: course.title };
}
