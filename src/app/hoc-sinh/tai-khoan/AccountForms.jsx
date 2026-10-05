'use client';
import { useFormState } from 'react-dom';
import { updateProfileAction, changePasswordAction } from '@/app/actions/auth';
import { SubmitButton, Field, PasswordInput } from '@/components/client-ui';
import Icon from '@/components/Icon';
import { GRADES } from '@/lib/constants';

export default function AccountForms({ user }) {
  const [ps, pa] = useFormState(updateProfileAction, null);
  const [cs, ca] = useFormState(changePasswordAction, null);
  const e = ps?.errors || {};
  return (
    <div className="grid split-eq">
      <form action={pa} className="card card-pad" noValidate>
        <h3>Thông tin cá nhân</h3>
        {ps?.ok && <div className="alert alert-success" role="status"><Icon name="check" size={18} />{ps.ok}</div>}
        <Field id="email" label="Email đăng nhập" hint="Không thể thay đổi email."><input id="email" className="input" value={user.email} disabled readOnly /></Field>
        <Field id="fullName" label="Họ và tên" required error={e.fullName}><input id="fullName" name="fullName" className="input" defaultValue={user.fullName} required aria-invalid={!!e.fullName} /></Field>
        <Field id="phone" label="Số điện thoại" required error={e.phone}><input id="phone" name="phone" type="tel" className="input" defaultValue={user.phone || ''} required aria-invalid={!!e.phone} /></Field>
        <Field id="grade" label="Lớp hiện tại">
          <select id="grade" name="grade" className="select" defaultValue={user.grade || ''}><option value="">Chưa chọn</option>{GRADES.map((g) => <option key={g} value={g}>{/^\d+$/.test(g) ? `Lớp ${g}` : g}</option>)}</select>
        </Field>
        <Field id="school" label="Trường"><input id="school" name="school" className="input" defaultValue={user.school || ''} /></Field>
        <SubmitButton>Lưu thay đổi</SubmitButton>
      </form>
      <form action={ca} className="card card-pad" noValidate key={cs?.ok ? 'ok' : 'x'}>
        <h3>Đổi mật khẩu</h3>
        {cs?.ok && <div className="alert alert-success" role="status"><Icon name="check" size={18} />{cs.ok}</div>}
        <PasswordInput id="current" name="current" label="Mật khẩu hiện tại" autoComplete="current-password" error={cs?.errors?.current} />
        <PasswordInput id="password" name="password" label="Mật khẩu mới" autoComplete="new-password" error={cs?.errors?.password} />
        <PasswordInput id="confirm" name="confirm" label="Xác nhận mật khẩu mới" autoComplete="new-password" error={cs?.errors?.confirm} />
        <SubmitButton>Đổi mật khẩu</SubmitButton>
      </form>
    </div>
  );
}
