import ResetForm from './ResetForm';

export const metadata = { title: 'Đặt lại mật khẩu' };

export default async function Page({ params }) {
  params = await params;
  return <ResetForm token={params.token} />;
}
