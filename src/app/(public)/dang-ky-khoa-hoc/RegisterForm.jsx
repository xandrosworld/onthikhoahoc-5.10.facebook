'use client';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { registerCourseAction } from '@/app/actions/public';
import { SubmitButton, Field } from '@/components/client-ui';
import Icon from '@/components/Icon';
import { GRADES } from '@/lib/constants';

export default function RegisterForm({ courses, preselect, user }) {
  const [state, action] = useFormState(registerCourseAction, null);
  if (state?.ok) {
    return (
      <div className="success-box" role="status">
        <span className="ic"><Icon name="check" size={32} strokeWidth={2.2} /></span>
        <h2>Đã nhận đăng ký!</h2>
        <p className="muted">Cảm ơn <b>{state.name}</b>. Trung tâm đã ghi nhận đăng ký{state.course ? <> khóa <b>{state.course}</b></> : ''} và sẽ liên hệ với em trong vòng 24 giờ làm việc.</p>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <Link href="/khoa-hoc" className="btn">Xem khóa học khác</Link>
          <Link href="/de-thi" className="btn btn-primary">Luyện thi ngay</Link>
        </div>
      </div>
    );
  }
  const v = state?.values || {};
  const e = state?.errors || {};
  return (
    <form action={action} noValidate>
      <h2 style={{ fontSize: '1.4rem' }}>Thông tin đăng ký</h2>
      <p className="muted small">Các trường có dấu <span style={{ color: 'var(--danger-600)' }}>*</span> là bắt buộc.</p>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true" />
      <div className="form-grid">
        <Field id="fullName" label="Họ và tên" required error={e.fullName}>
          <input id="fullName" name="fullName" className="input" defaultValue={v.fullName ?? user?.fullName ?? ''} autoComplete="name" placeholder="Nguyễn Văn An" aria-invalid={!!e.fullName} required />
        </Field>
        <Field id="phone" label="Số điện thoại" required error={e.phone}>
          <input id="phone" name="phone" type="tel" inputMode="tel" className="input" defaultValue={v.phone ?? user?.phone ?? ''} autoComplete="tel" placeholder="0901 234 567" aria-invalid={!!e.phone} required />
        </Field>
        <Field id="email" label="Email" required error={e.email}>
          <input id="email" name="email" type="email" className="input" defaultValue={v.email ?? user?.email ?? ''} autoComplete="email" placeholder="ten@gmail.com" aria-invalid={!!e.email} required />
        </Field>
        <Field id="currentGrade" label="Lớp hiện tại" required error={e.currentGrade}>
          <select id="currentGrade" name="currentGrade" className="select" defaultValue={v.currentGrade ?? ''} aria-invalid={!!e.currentGrade} required>
            <option value="" disabled>Chọn lớp</option>
            {GRADES.map((g) => <option key={g} value={g}>{/^\d+$/.test(g) ? `Lớp ${g}` : g}</option>)}
          </select>
        </Field>
        <div className="full">
          <Field id="courseId" label="Khóa học muốn đăng ký" required error={e.courseId}>
            <select id="courseId" name="courseId" className="select" defaultValue={v.courseId ?? preselect} aria-invalid={!!e.courseId} required>
              <option value="" disabled>Chọn khóa học</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </Field>
        </div>
        <div className="full">
          <Field id="note" label="Ghi chú" error={e.note} hint="Ví dụ: mục tiêu điểm số, thời gian rảnh, điểm yếu muốn cải thiện…">
            <textarea id="note" name="note" className="textarea" defaultValue={v.note ?? ''} maxLength={1000} />
          </Field>
        </div>
      </div>
      <SubmitButton className="btn btn-primary btn-lg" pendingText="Đang gửi…">Gửi đăng ký</SubmitButton>
    </form>
  );
}
