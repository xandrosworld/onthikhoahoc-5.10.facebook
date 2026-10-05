'use client';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { loginAction } from '@/app/actions/auth';
import { SubmitButton, PasswordInput, Field } from '@/components/client-ui';
import Icon from '@/components/Icon';

export default function LoginForm({ next }) {
  const [state, action] = useFormState(loginAction, null);
  return (
    <form action={action} noValidate>
      <h1>Đăng nhập</h1>
      <p className="muted mb-6">Chào mừng trở lại! Đăng nhập để tiếp tục luyện thi.</p>
      {state?.error && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} />{state.error}</div>}
      <input type="hidden" name="next" value={next || ''} />
      <Field id="email" label="Email" required>
        <input id="email" name="email" type="email" className="input" defaultValue={state?.values?.email || ''} autoComplete="email" required placeholder="ten@gmail.com" aria-invalid={!!state?.error} />
      </Field>
      <PasswordInput id="password" name="password" label="Mật khẩu" autoComplete="current-password" error={null} />
      <div className="row between mb-4" style={{ marginTop: -6 }}><span /><Link href="/quen-mat-khau" className="small">Quên mật khẩu?</Link></div>
      <SubmitButton className="btn btn-primary btn-lg btn-block" pendingText="Đang đăng nhập…">Đăng nhập</SubmitButton>
      <p className="auth-foot">Chưa có tài khoản? <Link href="/dang-ky"><b>Đăng ký ngay</b></Link></p>
      <div className="alert alert-info small" style={{ marginTop: 20 }}><Icon name="info" size={16} /><div><b>Tài khoản demo</b><br />Học sinh: <code>hocsinh@demo.vn</code> / <code>Demo@1234</code><br />Quản trị: <code>admin@demo.vn</code> / <code>Admin@1234</code></div></div>
    </form>
  );
}
