'use client';
import { useFormState } from 'react-dom';
import { saveSettingsAction, changeAdminPasswordAction } from '@/app/actions/admin';
import { SubmitButton, Field, PasswordInput } from '@/components/client-ui';
import Icon from '@/components/Icon';

export default function SettingsForms({ settings }) {
  const [ss, sa] = useFormState(saveSettingsAction, null);
  const [ps, pa] = useFormState(changeAdminPasswordAction, null);
  const f = (id, label, ph) => <Field id={id} label={label}><input id={id} name={id} className="input" defaultValue={settings[id] || ''} placeholder={ph} /></Field>;
  return (
    <div className="grid split-eq">
      <form action={sa} className="card card-pad">
        <h3>Thông tin trung tâm</h3>
        <p className="muted small">Hiển thị ở đầu trang, chân trang và trang liên hệ.</p>
        {ss?.ok && <div className="alert alert-success" role="status"><Icon name="check" size={18} />{ss.ok}</div>}
        {f('siteName', 'Tên trung tâm')}
        {f('tagline', 'Khẩu hiệu ngắn')}
        {f('hotline', 'Hotline')}
        {f('email', 'Email liên hệ')}
        {f('address', 'Địa chỉ')}
        {f('openHours', 'Giờ làm việc')}
        <SubmitButton>Lưu thiết lập</SubmitButton>
      </form>
      <form action={pa} className="card card-pad" key={ps?.ok ? 'ok' : 'x'}>
        <h3>Đổi mật khẩu quản trị</h3>
        {ps?.ok && <div className="alert alert-success" role="status"><Icon name="check" size={18} />{ps.ok}</div>}
        <PasswordInput id="current" name="current" label="Mật khẩu hiện tại" autoComplete="current-password" error={ps?.errors?.current} />
        <PasswordInput id="password" name="password" label="Mật khẩu mới" autoComplete="new-password" error={ps?.errors?.password} />
        <PasswordInput id="confirm" name="confirm" label="Xác nhận mật khẩu mới" autoComplete="new-password" error={ps?.errors?.confirm} />
        <SubmitButton>Đổi mật khẩu</SubmitButton>
      </form>
    </div>
  );
}
