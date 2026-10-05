import { requireUser } from '@/lib/auth';
import { PageTitle } from '@/components/ui';
import AccountForms from './AccountForms';

export const metadata = { title: 'Tài khoản' };

export default async function AccountPage() {
  const user = await requireUser('/hoc-sinh/tai-khoan');
  return (
    <>
      <PageTitle title="Tài khoản" desc="Quản lý thông tin cá nhân và mật khẩu." />
      <AccountForms user={{ email: user.email, fullName: user.fullName, phone: user.phone, grade: user.profile?.grade, school: user.profile?.school }} />
    </>
  );
}
