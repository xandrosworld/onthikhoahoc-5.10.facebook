'use client';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { forgotPasswordAction } from '@/app/actions/auth';
import { SubmitButton, Field } from '@/components/client-ui';
import Icon from '@/components/Icon';

export default function Page() {
  const [state, action] = useFormState(forgotPasswordAction, null);
  if (state?.sent) {
    return (
      <div>
        <h1>Kiểm tra email của bạn</h1>
        <p className="muted">Nếu <b>{state.email}</b> đã được đăng ký, chúng tôi đã tạo liên kết đặt lại mật khẩu (hiệu lực 1 giờ).</p>
        {state.link && (
          <div className="alert alert-warning"><Icon name="info" size={18} /><div><b>Chế độ demo:</b> website chưa cấu hình gửi email nên liên kết được hiển thị trực tiếp.<br /><Link href={state.link}><b>Đặt lại mật khẩu →</b></Link></div></div>
        )}
        <Link href="/dang-nhap" className="btn btn-block mt-4">Quay lại đăng nhập</Link>
      </div>
    );
  }
  return (
    <form action={action} noValidate>
      <h1>Quên mật khẩu</h1>
      <p className="muted mb-6">Nhập email đã đăng ký, chúng tôi sẽ tạo liên kết đặt lại mật khẩu cho bạn.</p>
      <Field id="email" label="Email" required error={state?.error}>
        <input id="email" name="email" type="email" className="input" defaultValue={state?.values?.email || ''} required autoComplete="email" aria-invalid={!!state?.error} />
      </Field>
      <SubmitButton className="btn btn-primary btn-lg btn-block">Gửi liên kết</SubmitButton>
      <p className="auth-foot"><Link href="/dang-nhap">← Quay lại đăng nhập</Link></p>
    </form>
  );
}
