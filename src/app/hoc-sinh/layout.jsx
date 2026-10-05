import AppShell from '@/components/AppShell';
import { requireUser } from '@/lib/auth';
import { getSettings } from '@/lib/site';
import { logoutAction } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

const LINKS = [
  { href: '/hoc-sinh', label: 'Tổng quan', icon: 'home', exact: true },
  { href: '/hoc-sinh/luyen-thi', label: 'Luyện thi', icon: 'clipboard' },
  { href: '/hoc-sinh/ket-qua', label: 'Kết quả của tôi', icon: 'chart' },
  { href: '/hoc-sinh/tai-khoan', label: 'Tài khoản', icon: 'user' },
  { label: 'Website' },
  { href: '/', label: 'Quay lại website', icon: 'external', external: true },
];

export default async function StudentLayout({ children }) {
  const user = await requireUser();
  const s = await getSettings();
  return <AppShell variant="student" links={LINKS} user={{ fullName: user.fullName, email: user.email }} siteName={s.siteName} logoutAction={logoutAction}>{children}</AppShell>;
}
