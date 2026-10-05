import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import LoginForm from './LoginForm';

export const metadata = { title: 'Đăng nhập' };
export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }) {
  searchParams = await searchParams;
  const user = await getUser();
  if (user) redirect(user.role === 'ADMIN' ? '/admin' : '/hoc-sinh');
  return <LoginForm next={searchParams?.next} />;
}
