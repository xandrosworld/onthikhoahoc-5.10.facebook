'use client';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { resetPasswordAction } from '@/app/actions/auth';
import { SubmitButton, PasswordInput } from '@/components/client-ui';
import Icon from '@/components/Icon';

export default function ResetForm({ token }) {
  const [state, action] = useFormState(resetPasswordAction, null);
  if (state?.done) {
    return (
      <div className="success-box">
        <span className="ic"><Icon name="check" size={32} /></span>
        <h1>Đã đặt lại mật khẩu</h1>
        <p className="muted">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
        <Link href="/dang-nhap" className="btn btn-primary btn-lg btn-block">Đăng nhập</Link>
      </div>
    );
  }
  const e = state?.errors || {};
  return (
    <form action={action} noValidate>
      <h1>Đặt lại mật khẩu</h1>
      <p className="muted mb-6">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      {state?.error && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} />{state.error} <Link href="/quen-mat-khau">Yêu cầu lại</Link></div>}
      <input type="hidden" name="token" value={token} />
      <PasswordInput id="password" name="password" label="Mật khẩu mới" autoComplete="new-password" error={e.password} />
      <PasswordInput id="confirm" name="confirm" label="Xác nhận mật khẩu" autoComplete="new-password" error={e.confirm} />
      <SubmitButton className="btn btn-primary btn-lg btn-block">Lưu mật khẩu mới</SubmitButton>
    </form>
  );
}
