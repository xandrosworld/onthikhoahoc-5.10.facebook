'use server';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { slugify, parseSyllabusText } from '@/lib/utils';
import { DEFAULT_SETTINGS } from '@/lib/site';
import { validVideoUrl } from '@/lib/video';
import { templateTypes, validateExamConfig } from '@/lib/exam-config';
import { examInclude } from '@/lib/attempts';

const S = (v) => String(v ?? '').trim();
const okUrl = (u) => !u || /^(https?:\/\/|\/api\/files\/)/i.test(u);

async function uniqueSlug(model, base, ignoreId) {
  let slug = slugify(base), n = 1;
  for (;;) {
    const hit = await db[model].findUnique({ where: { slug } });
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${slugify(base)}-${++n}`;
  }
}

/* ============ KHÓA HỌC ============ */
export async function saveCourseAction(_prev, fd) {
  await requireAdmin();
  const id = S(fd.get('id'));
  const d = {
    title: S(fd.get('title')), summary: S(fd.get('summary')), description: S(fd.get('description')),
    audience: S(fd.get('audience')), grade: S(fd.get('grade')) || '12', duration: S(fd.get('duration')), schedule: S(fd.get('schedule')),
    tuition: S(fd.get('tuition')) || null, coverUrl: S(fd.get('coverUrl')) || null, theme: S(fd.get('theme')) || 'indigo',
    videoUrl: S(fd.get('videoUrl')) || null,
    teacherName: S(fd.get('teacherName')), teacherBio: S(fd.get('teacherBio')),
    featured: fd.get('featured') === 'on', status: S(fd.get('status')) === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
    syllabus: JSON.stringify(parseSyllabusText(S(fd.get('syllabus')))),
  };
  const errors = {};
  if (d.title.length < 3) errors.title = 'Vui lòng nhập tên khóa học.';
  if (!d.summary) errors.summary = 'Vui lòng nhập mô tả ngắn.';
  if (!d.audience) errors.audience = 'Vui lòng nhập đối tượng.';
  if (!d.duration) errors.duration = 'Vui lòng nhập thời lượng.';
  if (!d.schedule) errors.schedule = 'Vui lòng nhập lịch học.';
  if (!okUrl(d.coverUrl)) errors.coverUrl = 'Đường dẫn ảnh không hợp lệ.';
  if (!validVideoUrl(d.videoUrl)) errors.videoUrl = 'Dùng liên kết YouTube, Vimeo, video MP4/WEBM hoặc tệp video đã tải lên.';
  if (Object.keys(errors).length) return { errors, values: Object.fromEntries(fd.entries()) };
  if (id) await db.course.update({ where: { id }, data: d });
  else await db.course.create({ data: { ...d, slug: await uniqueSlug('course', d.title) } });
  revalidatePath('/khoa-hoc'); revalidatePath('/');
  redirect('/admin/khoa-hoc?saved=1');
}

export async function deleteCourseAction(fd) {
  await requireAdmin();
  await db.course.delete({ where: { id: S(fd.get('id')) } });
  revalidatePath('/admin/khoa-hoc'); revalidatePath('/khoa-hoc');
}

export async function toggleCourseAction(fd) {
  await requireAdmin();
  const c = await db.course.findUnique({ where: { id: S(fd.get('id')) } });
  if (c) await db.course.update({ where: { id: c.id }, data: { status: c.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' } });
  revalidatePath('/admin/khoa-hoc'); revalidatePath('/khoa-hoc');
}

/* ============ ĐĂNG KÝ KHÓA HỌC ============ */
export async function setRegistrationStatusAction(fd) {
  await requireAdmin();
  const status = S(fd.get('status'));
  if (!['NEW', 'CONTACTED', 'ENROLLED', 'CANCELLED'].includes(status)) return;
  await db.courseRegistration.update({ where: { id: S(fd.get('id')) }, data: { status } });
  revalidatePath('/admin/dang-ky');
}
export async function deleteRegistrationAction(fd) {
  await requireAdmin();
  await db.courseRegistration.delete({ where: { id: S(fd.get('id')) } });
  revalidatePath('/admin/dang-ky');
}

/* ============ BÀI VIẾT ============ */
export async function savePostAction(_prev, fd) {
  await requireAdmin();
  const id = S(fd.get('id'));
  const status = S(fd.get('status')) === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
  const d = {
    title: S(fd.get('title')), excerpt: S(fd.get('excerpt')), content: String(fd.get('content') ?? ''),
    category: S(fd.get('category')) || 'TAI_LIEU', coverUrl: S(fd.get('coverUrl')) || null, theme: S(fd.get('theme')) || 'indigo',
    videoUrl: S(fd.get('videoUrl')) || null, pdfUrl: S(fd.get('pdfUrl')) || null, pdfName: S(fd.get('pdfName')) || null, status,
  };
  const errors = {};
  if (d.title.length < 3) errors.title = 'Vui lòng nhập tiêu đề.';
  if (!d.content.trim()) errors.content = 'Vui lòng nhập nội dung bài viết.';
  if (!okUrl(d.videoUrl)) errors.videoUrl = 'Liên kết video phải bắt đầu bằng http:// hoặc https://';
  if (!okUrl(d.coverUrl)) errors.coverUrl = 'Đường dẫn ảnh không hợp lệ.';
  if (Object.keys(errors).length) return { errors, values: Object.fromEntries(fd.entries()) };
  if (!d.excerpt) d.excerpt = d.content.replace(/[#>*`$\[\]()!_-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
  if (id) {
    const old = await db.post.findUnique({ where: { id } });
    await db.post.update({ where: { id }, data: { ...d, publishedAt: status === 'PUBLISHED' ? old?.publishedAt || new Date() : old?.publishedAt } });
  } else {
    await db.post.create({ data: { ...d, slug: await uniqueSlug('post', d.title), publishedAt: status === 'PUBLISHED' ? new Date() : null } });
  }
  revalidatePath('/bai-viet'); revalidatePath('/');
  redirect('/admin/bai-viet?saved=1');
}
export async function deletePostAction(fd) {
  await requireAdmin();
  await db.post.delete({ where: { id: S(fd.get('id')) } });
  revalidatePath('/admin/bai-viet'); revalidatePath('/bai-viet');
}
export async function togglePostAction(fd) {
  await requireAdmin();
  const p = await db.post.findUnique({ where: { id: S(fd.get('id')) } });
  if (p) {
    const publish = p.status !== 'PUBLISHED';
    await db.post.update({ where: { id: p.id }, data: { status: publish ? 'PUBLISHED' : 'DRAFT', publishedAt: publish ? p.publishedAt || new Date() : p.publishedAt } });
  }
  revalidatePath('/admin/bai-viet'); revalidatePath('/bai-viet');
}

/* ============ ĐỀ THI ============ */
const TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'];
const TITLES = { MULTIPLE_CHOICE: 'Phần I. Trắc nghiệm nhiều phương án', TRUE_FALSE: 'Phần II. Trắc nghiệm đúng sai', SHORT_ANSWER: 'Phần III. Trả lời ngắn' };

function validateExam(p) {
  const configError = validateExamConfig(p);
  if (configError) return configError;
  if (!S(p.title)) return 'Vui lòng nhập tên đề thi.';
  const dur = Number(p.durationMinutes);
  if (!Number.isInteger(dur) || dur < 1 || dur > 300) return 'Thời gian làm bài phải từ 1 đến 300 phút.';
  if (p.status === 'PUBLISHED') {
    const total = TYPES.reduce((n, t) => n + (p.sections?.[t]?.length || 0), 0);
    if (!total) return 'Đề thi cần ít nhất một câu hỏi trước khi công bố.';
    for (const t of templateTypes(p.template)) {
      const qs = p.sections?.[t] || [];
      for (let i = 0; i < qs.length; i++) {
        const q = qs[i], where = `${TITLES[t].split('.')[0]}, câu ${i + 1}`;
        if (!S(q.content)) return `${where}: chưa nhập nội dung câu hỏi.`;
        if (t === 'MULTIPLE_CHOICE') {
          if (!q.options || q.options.length !== 4 || q.options.some((o) => !S(o.content))) return `${where}: cần nhập đủ 4 phương án A, B, C, D.`;
          if (q.options.filter((o) => o.isCorrect).length !== 1) return `${where}: hãy chọn đúng một đáp án đúng.`;
        }
        if (t === 'TRUE_FALSE') {
          if (!q.statements || q.statements.length < 2 || q.statements.some((s) => !S(s.content))) return `${where}: cần nhập các mệnh đề a, b, c, d.`;
        }
        if (t === 'SHORT_ANSWER') {
          if (!q.answers || !q.answers.some((a) => S(a))) return `${where}: chưa nhập đáp án đúng.`;
        }
      }
    }
  }
  return null;
}

/** Lưu toàn bộ đề (thông tin + 3 phần câu hỏi). Giữ nguyên id câu hỏi cũ để không mất lịch sử bài làm. */
export async function saveExamAction(payload) {
  await requireAdmin();
  const enabled = templateTypes(payload.template);
  payload = { ...payload, sections: Object.fromEntries(TYPES.map(t => [t, enabled.includes(t) ? payload.sections?.[t] || [] : []])) };
  const err = validateExam(payload);
  if (err) return { error: err };
  const meta = {
    template: payload.template,
    title: S(payload.title), description: S(payload.description), grade: S(payload.grade) || '12',
    durationMinutes: Number(payload.durationMinutes), shuffleQuestions: !!payload.shuffleQuestions,
    status: payload.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
  };
  const examId = await db.$transaction(async (tx) => {
    let exam;
    if (payload.id) {
      // Freeze older attempts before any edits, including question removal.
      const old = await tx.exam.findUnique({ where: { id: payload.id }, include: examInclude });
      if (!old) throw new Error('Không tìm thấy đề thi.');
      await tx.examAttempt.updateMany({ where: { examId: payload.id, snapshot: null }, data: { snapshot: JSON.stringify({ title: old.title, durationMinutes: old.durationMinutes, sections: old.sections }) } });
    }
    if (payload.id) exam = await tx.exam.update({ where: { id: payload.id }, data: meta });
    else exam = await tx.exam.create({ data: meta });
    for (let si = 0; si < TYPES.length; si++) {
      const type = TYPES[si];
      let section = await tx.examSection.findUnique({ where: { examId_type: { examId: exam.id, type } } });
      if (!section) section = await tx.examSection.create({ data: { examId: exam.id, type, order: si, title: TITLES[type] } });
      const settings = enabled.includes(type) ? payload.sectionSettings?.[type] : null;
      if (settings) await tx.examSection.update({ where: { id: section.id }, data: { pointsPerQuestion: settings.pointsPerQuestion == null ? null : Number(settings.pointsPerQuestion), tfScoring: settings.tfScoring } });
      const incoming = payload.sections?.[type] || [];
      const keepIds = incoming.map((q) => q.id).filter(Boolean);
      await tx.question.updateMany({ where: { sectionId: section.id, id: { notIn: keepIds } }, data: { retired: true } });
      for (let i = 0; i < incoming.length; i++) {
        const q = incoming[i];
        const base = { content: S(q.content), explanation: S(q.explanation), order: i, retired: false, points: q.points == null ? null : Number(q.points) };
        let qid = q.id;
        const exists = qid ? await tx.question.findFirst({ where: { id: qid, sectionId: section.id } }) : null;
        if (exists) {
          await tx.question.update({ where: { id: qid }, data: base });
          await tx.questionOption.deleteMany({ where: { questionId: qid } });
          await tx.trueFalseStatement.deleteMany({ where: { questionId: qid } });
          await tx.shortAnswer.deleteMany({ where: { questionId: qid } });
        } else {
          qid = (await tx.question.create({ data: { ...base, sectionId: section.id } })).id;
        }
        if (type === 'MULTIPLE_CHOICE') {
          await tx.questionOption.createMany({ data: (q.options || []).slice(0, 4).map((o, k) => ({ questionId: qid, label: 'ABCD'[k], content: S(o.content), isCorrect: !!o.isCorrect })) });
        } else if (type === 'TRUE_FALSE') {
          await tx.trueFalseStatement.createMany({ data: (q.statements || []).slice(0, 4).map((s, k) => ({ questionId: qid, label: 'abcd'[k], content: S(s.content), isTrue: !!s.isTrue })) });
        } else {
          const answers = (q.answers || []).map(S).filter(Boolean);
          await tx.shortAnswer.createMany({ data: answers.map((a, k) => ({ questionId: qid, answer: a, isPrimary: k === 0 })) });
        }
      }
    }
    return exam.id;
  }, { timeout: 30000, maxWait: 10000 });
  revalidatePath('/admin/de-thi'); revalidatePath('/de-thi'); revalidatePath('/hoc-sinh/luyen-thi'); revalidatePath('/');
  return { ok: true, id: examId };
}

export async function deleteExamAction(fd) {
  await requireAdmin();
  await db.exam.delete({ where: { id: S(fd.get('id')) } });
  revalidatePath('/admin/de-thi'); revalidatePath('/de-thi');
}

export async function toggleExamAction(fd) {
  await requireAdmin();
  const e = await db.exam.findUnique({ where: { id: S(fd.get('id')) }, include: { sections: { include: { _count: { select: { questions: { where: { retired: false } } } } } } } });
  if (!e) return;
  if (e.status !== 'PUBLISHED' && e.sections.reduce((n, s) => n + s._count.questions, 0) === 0) return;
  await db.exam.update({ where: { id: e.id }, data: { status: e.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' } });
  revalidatePath('/admin/de-thi'); revalidatePath('/de-thi'); revalidatePath('/hoc-sinh/luyen-thi');
}

export async function duplicateExamAction(fd) {
  await requireAdmin();
  const src = await db.exam.findUnique({
    where: { id: S(fd.get('id')) },
    include: examInclude,
  });
  if (!src) return;
  const copy = await db.exam.create({ data: { title: `${src.title} (Bản sao)`, template: src.template, description: src.description, grade: src.grade, durationMinutes: src.durationMinutes, shuffleQuestions: src.shuffleQuestions, status: 'DRAFT' } });
  for (const s of src.sections) {
    const sec = await db.examSection.create({ data: { examId: copy.id, type: s.type, order: s.order, title: s.title, pointsPerQuestion: s.pointsPerQuestion, tfScoring: s.tfScoring } });
    for (const q of s.questions) {
      await db.question.create({
        data: {
          sectionId: sec.id, order: q.order, content: q.content, explanation: q.explanation, points: q.points,
          options: { create: q.options.map((o) => ({ label: o.label, content: o.content, isCorrect: o.isCorrect })) },
          statements: { create: q.statements.map((o) => ({ label: o.label, content: o.content, isTrue: o.isTrue })) },
          shortAnswers: { create: q.shortAnswers.map((o) => ({ answer: o.answer, isPrimary: o.isPrimary })) },
        },
      });
    }
  }
  revalidatePath('/admin/de-thi');
  redirect(`/admin/de-thi/${copy.id}`);
}

/* ============ HỌC SINH / KẾT QUẢ ============ */
export async function toggleStudentAction(fd) {
  await requireAdmin();
  const u = await db.user.findUnique({ where: { id: S(fd.get('id')) } });
  if (u && u.role === 'STUDENT') await db.user.update({ where: { id: u.id }, data: { status: u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' } });
  revalidatePath('/admin/hoc-sinh'); revalidatePath(`/admin/hoc-sinh/${S(fd.get('id'))}`);
}
export async function deleteStudentAction(fd) {
  await requireAdmin();
  const u = await db.user.findUnique({ where: { id: S(fd.get('id')) } });
  if (u && u.role === 'STUDENT') await db.user.delete({ where: { id: u.id } });
  redirect('/admin/hoc-sinh');
}
export async function deleteAttemptAction(fd) {
  await requireAdmin();
  await db.examAttempt.delete({ where: { id: S(fd.get('id')) } });
  revalidatePath('/admin/ket-qua');
  if (fd.get('back')) redirect(S(fd.get('back')));
}

/* ============ THIẾT LẬP ============ */
export async function saveSettingsAction(_prev, fd) {
  await requireAdmin();
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const value = S(fd.get(key));
    await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  revalidatePath('/', 'layout');
  return { ok: 'Đã lưu thiết lập.' };
}

export async function changeAdminPasswordAction(_prev, fd) {
  const admin = await requireAdmin();
  const cur = String(fd.get('current') ?? ''), pw = String(fd.get('password') ?? ''), cf = String(fd.get('confirm') ?? '');
  const errors = {};
  if (!(await bcrypt.compare(cur, admin.passwordHash))) errors.current = 'Mật khẩu hiện tại không đúng.';
  if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) errors.password = 'Mật khẩu mới cần tối thiểu 8 ký tự, gồm chữ và số.';
  if (pw !== cf) errors.confirm = 'Mật khẩu xác nhận không khớp.';
  if (Object.keys(errors).length) return { errors };
  await db.user.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(pw, 10) } });
  return { ok: 'Đã đổi mật khẩu.' };
}
