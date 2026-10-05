import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import RegisterPageForm from './RegisterPageForm';

export const metadata = { title: 'Tạo tài khoản' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getUser();
  if (user) redirect(user.role === 'ADMIN' ? '/admin' : '/hoc-sinh');
  return <RegisterPageForm />;
}
