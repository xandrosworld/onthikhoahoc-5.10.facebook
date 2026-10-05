import Link from 'next/link';
import Icon from '@/components/Icon';

export const metadata = { title: 'Không có quyền truy cập' };

export default function Forbidden() {
  return (
    <main id="main" className="status-page">
      <div>
        <span className="empty"><span className="icon"><Icon name="lock" size={26} /></span></span>
        <h1 style={{ fontSize: '1.8rem' }}>Không có quyền truy cập</h1>
        <p className="muted" style={{ maxWidth: 440, margin: '0 auto 24px' }}>Tài khoản của bạn không có quyền xem khu vực này. Nếu bạn cho rằng đây là nhầm lẫn, hãy liên hệ trung tâm.</p>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <Link href="/hoc-sinh" className="btn btn-primary">Về trang học sinh</Link>
          <Link href="/" className="btn">Trang chủ</Link>
        </div>
      </div>
    </main>
  );
}
