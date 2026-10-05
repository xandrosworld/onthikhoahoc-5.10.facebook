import { getSettings } from '@/lib/site';
import { requireAdmin } from '@/lib/auth';
import { PageTitle } from '@/components/ui';
import SettingsForms from './SettingsForms';

export const metadata = { title: 'Tài khoản / Thiết lập' };

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const settings = await getSettings();
  return (
    <>
      <PageTitle title="Tài khoản & Thiết lập" desc={`Đăng nhập với ${admin.email}`} />
      <SettingsForms settings={settings} />
    </>
  );
}
