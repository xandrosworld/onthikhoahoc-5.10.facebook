import AppShell from '@/components/AppShell';
import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/site';
import { logoutAction } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

const LINKS = [
  { href: '/admin', label: 'Tổng quan', icon: 'home', exact: true },
  { label: 'Nội dung' },
  { href: '/admin/khoa-hoc', label: 'Khóa học', icon: 'book' },
  { href: '/admin/dang-ky', label: 'Đăng ký khóa học', icon: 'clipboard' },
  { href: '/admin/de-thi', label: 'Đề thi', icon: 'edit' },
  { href: '/admin/bai-viet', label: 'Bài viết', icon: 'file' },
  { label: 'Người học' },
  { href: '/admin/hoc-sinh', label: 'Học sinh', icon: 'users' },
  { href: '/admin/ket-qua', label: 'Kết quả thi', icon: 'chart' },
  { label: 'Hệ thống' },
  { href: '/admin/thiet-lap', label: 'Tài khoản / Thiết lập', icon: 'settings' },
  { href: '/', label: 'Xem website', icon: 'external', external: true },
];

export default async function AdminLayout({ children }) {
  const user = await requireAdmin();
  const s = await getSettings();
  return <AppShell variant="admin" links={LINKS} user={{ fullName: user.fullName, email: user.email }} siteName={s.siteName} logoutAction={logoutAction}>{children}</AppShell>;
}
