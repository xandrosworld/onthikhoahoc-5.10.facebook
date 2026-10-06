'use server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, destroySession, requireUser } from '@/lib/auth';

const phoneRe = /^(\+84|0)\d{9,10}$/;
const clean = (v) => String(v ?? '').trim();
const safeNext = (n, fallback) => (n && n.startsWith('/') && !n.startsWith('//') ? n : fallback);

function fieldErrors(zerr) {
  const out = {};
  for (const i of zerr.issues) if (!out[i.path[0]]) out[i.path[0]] = i.message;
  return out;
}

const attempts = globalThis.__loginAttempts || (globalThis.__loginAttempts = new Map());
function throttled(key) {
  const now = Date.now();
  const a = (attempts.get(key) || []).filter((t) => now - t < 10 * 60 * 1000);
  attempts.set(key, a);
  return a.length >= 8;
}

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự).').max(80),
    email: z.string().trim().toLowerCase().email('Email không hợp lệ. Ví dụ: ten@gmail.com'),
    phone: z.string().trim().regex(phoneRe, 'Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0).'),
    password: z.string().min(8, 'Mật khẩu cần tối thiểu 8 ký tự.').regex(/[A-Za-z]/, 'Mật khẩu cần có ít nhất một chữ cái.').regex(/\d/, 'Mật khẩu cần có ít nhất một chữ số.'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Mật khẩu xác nhận không khớp.' });

export async function registerAction(_prev, fd) {
  const raw = Object.fromEntries(['fullName', 'email', 'phone', 'password', 'confirm'].map((k) => [k, clean(fd.get(k)) || (k.includes('assword') || k === 'confirm' ? String(fd.get(k) ?? '') : '')]));
  raw.password = String(fd.get('password') ?? '');
  raw.confirm = String(fd.get('confirm') ?? '');
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { fullName: raw.fullName, email: raw.email, phone: raw.phone } };
  const d = parsed.data;
  const exists = await db.user.findUnique({ where: { email: d.email } });
  if (exists) return { errors: { email: 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.' }, values: { fullName: d.fullName, email: d.email, phone: d.phone } };
  const user = await db.user.create({
    data: { fullName: d.fullName, email: d.email, phone: d.phone, passwordHash: await bcrypt.hash(d.password, 10), role: 'STUDENT', profile: { create: {} } },
  });
  await createSession(user);
  redirect('/hoc-sinh?welcome=1');
}

export async function loginAction(_prev, fd) {
  const email = clean(fd.get('email')).toLowerCase();
  const password = String(fd.get('password') ?? '');
  const next = clean(fd.get('next'));
  if (!email || !password) return { error: 'Vui lòng nhập email và mật khẩu.', values: { email } };
  if (throttled(email)) return { error: 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút.', values: { email } };
  const user = await db.user.findUnique({ where: { email } });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) {
    attempts.get(email)?.push(Date.now()) ?? attempts.set(email, [Date.now()]);
    return { error: 'Email hoặc mật khẩu không đúng.', values: { email } };
  }
  if (user.status !== 'ACTIVE') return { error: 'Tài khoản đã bị khóa. Vui lòng liên hệ trung tâm.', values: { email } };
  await createSession(user);
  if (user.role === 'ADMIN') redirect(safeNext(next, '/admin'));
  redirect(next && !next.startsWith('/admin') ? safeNext(next, '/hoc-sinh') : '/hoc-sinh');
}

export async function logoutAction() {
  await destroySession();
  redirect('/');
}

export async function forgotPasswordAction(_prev, fd) {
  const email = clean(fd.get('email')).toLowerCase();
  if (!z.string().email().safeParse(email).success) return { error: 'Email không hợp lệ.', values: { email } };
  const user = await db.user.findUnique({ where: { email } });
  let link = null;
  if (user && user.status === 'ACTIVE') {
    const token = crypto.randomBytes(24).toString('hex');
    await db.passwordReset.create({ data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    // Chưa cấu hình máy chủ email: hiển thị liên kết trực tiếp (chế độ demo). Khi có SMTP, gửi liên kết này qua email thay vì hiển thị.
    if (process.env.SMTP_HOST) {
      link = null;
    } else {
      link = `/dat-lai-mat-khau/${token}`;
    }
  }
  return { sent: true, link, email };
}

export async function resetPasswordAction(_prev, fd) {
  const token = clean(fd.get('token'));
  const password = String(fd.get('password') ?? '');
  const confirm = String(fd.get('confirm') ?? '');
  const errors = {};
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = 'Mật khẩu cần tối thiểu 8 ký tự, gồm chữ và số.';
  if (password !== confirm) errors.confirm = 'Mật khẩu xác nhận không khớp.';
  if (Object.keys(errors).length) return { errors };
  const rec = await db.passwordReset.findUnique({ where: { token } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) return { error: 'Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại.' };
  const passwordHash = await bcrypt.hash(password, 10);
  await db.$transaction(async tx => {
    await tx.user.update({ where: { id: rec.userId }, data: { passwordHash } });
    await tx.passwordReset.update({ where: { id: rec.id }, data: { usedAt: new Date() } });
  });
  return { done: true };
}

export async function updateProfileAction(_prev, fd) {
  const user = await requireUser('/hoc-sinh/tai-khoan');
  const fullName = clean(fd.get('fullName'));
  const phone = clean(fd.get('phone'));
  const errors = {};
  if (fullName.length < 2) errors.fullName = 'Vui lòng nhập họ và tên.';
  if (!phoneRe.test(phone)) errors.phone = 'Số điện thoại không hợp lệ.';
  if (Object.keys(errors).length) return { errors };
  await db.user.update({
    where: { id: user.id },
    data: {
      fullName, phone,
      profile: { upsert: { create: { grade: clean(fd.get('grade')) || null, school: clean(fd.get('school')) || null }, update: { grade: clean(fd.get('grade')) || null, school: clean(fd.get('school')) || null } } },
    },
  });
  revalidatePath('/hoc-sinh', 'layout');
  return { ok: 'Đã lưu thông tin tài khoản.' };
}

export async function changePasswordAction(_prev, fd) {
  const user = await requireUser('/hoc-sinh/tai-khoan');
  const cur = String(fd.get('current') ?? '');
  const password = String(fd.get('password') ?? '');
  const confirm = String(fd.get('confirm') ?? '');
  const errors = {};
  if (!(await bcrypt.compare(cur, user.passwordHash))) errors.current = 'Mật khẩu hiện tại không đúng.';
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = 'Mật khẩu mới cần tối thiểu 8 ký tự, gồm chữ và số.';
  if (password !== confirm) errors.confirm = 'Mật khẩu xác nhận không khớp.';
  if (Object.keys(errors).length) return { errors };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  return { ok: 'Đã đổi mật khẩu thành công.' };
}
