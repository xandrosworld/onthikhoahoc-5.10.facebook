'use client';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { registerAction } from '@/app/actions/auth';
import { SubmitButton, PasswordInput, Field } from '@/components/client-ui';

function strength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Za-z]/.test(p) && /\d/.test(p)) s++;
  if (p.length >= 12) s++;
  if (/[^A-Za-z0-9]/.test(p) && /[A-Z]/.test(p)) s++;
  return s;
}

export default function RegisterPageForm() {
  const [state, action] = useFormState(registerAction, null);
  const [pw, setPw] = useState('');
  const e = state?.errors || {};
  const v = state?.values || {};
  const st = pw ? strength(pw) : 0;
  return (
    <form action={action} noValidate>
      <h1>Tạo tài khoản học sinh</h1>
      <p className="muted mb-6">Miễn phí. Dùng để làm đề luyện thi và lưu lại kết quả của bạn.</p>
      <Field id="fullName" label="Họ và tên" required error={e.fullName}>
        <input id="fullName" name="fullName" className="input" defaultValue={v.fullName || ''} autoComplete="name" required aria-invalid={!!e.fullName} />
      </Field>
      <Field id="email" label="Email (dùng để đăng nhập)" required error={e.email}>
        <input id="email" name="email" type="email" className="input" defaultValue={v.email || ''} autoComplete="email" required aria-invalid={!!e.email} />
      </Field>
      <Field id="phone" label="Số điện thoại" required error={e.phone}>
        <input id="phone" name="phone" type="tel" inputMode="tel" className="input" defaultValue={v.phone || ''} autoComplete="tel" required aria-invalid={!!e.phone} />
      </Field>
      <PasswordInput id="password" name="password" label="Mật khẩu" autoComplete="new-password" error={e.password} onChange={(ev) => setPw(ev.target.value)} />
      {pw && (
        <div style={{ marginTop: -10, marginBottom: 18 }} aria-live="polite">
          <div className="strength">{[1, 2, 3, 4].map((i) => <i key={i} className={i <= st ? `on${st}` : ''} />)}</div>
          <span className="field-hint">Độ mạnh: {['Rất yếu', 'Yếu', 'Khá', 'Tốt', 'Rất tốt'][st]}. Tối thiểu 8 ký tự, gồm chữ và số.</span>
        </div>
      )}
      <PasswordInput id="confirm" name="confirm" label="Xác nhận mật khẩu" autoComplete="new-password" error={e.confirm} />
      <SubmitButton className="btn btn-primary btn-lg btn-block" pendingText="Đang tạo tài khoản…">Tạo tài khoản</SubmitButton>
      <p className="auth-foot">Đã có tài khoản? <Link href="/dang-nhap"><b>Đăng nhập</b></Link></p>
    </form>
  );
}
