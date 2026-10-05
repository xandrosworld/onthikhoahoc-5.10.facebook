import Link from 'next/link';

export const metadata = { title: 'Không tìm thấy trang' };

export default function NotFound() {
  return (
    <main id="main" className="status-page">
      <div>
        <div className="code">404</div>
        <h1 style={{ fontSize: '1.8rem' }}>Không tìm thấy trang</h1>
        <p className="muted" style={{ maxWidth: 440, margin: '0 auto 24px' }}>Trang bạn tìm không tồn tại, đã bị xóa hoặc chưa được công bố.</p>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <Link href="/" className="btn btn-primary">Về trang chủ</Link>
          <Link href="/de-thi" className="btn">Luyện thi</Link>
        </div>
      </div>
    </main>
  );
}
