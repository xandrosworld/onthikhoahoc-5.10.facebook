import ResetForm from './ResetForm';

export const metadata = { title: 'Đặt lại mật khẩu' };

export default function Page({ params }) {
  return <ResetForm token={params.token} />;
}
