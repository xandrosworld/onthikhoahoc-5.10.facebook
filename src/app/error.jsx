'use client';
import Link from 'next/link';

export default function Error({ error, reset }) {
  return (
    <main id="main" className="status-page">
      <div>
        <div className="code" style={{ color: 'var(--danger-50)', textShadow: '0 0 0 #f4c7c3' }}>!</div>
        <h1 style={{ fontSize: '1.8rem' }}>Đã xảy ra lỗi</h1>
        <p className="muted" style={{ maxWidth: 460, margin: '0 auto 24px' }}>Hệ thống gặp sự cố khi xử lý yêu cầu. Dữ liệu của bạn vẫn được giữ nguyên. Hãy thử lại hoặc quay về trang chủ.</p>
        {error?.digest && <p className="xs muted">Mã lỗi: {error.digest}</p>}
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => reset()}>Thử lại</button>
          <Link href="/" className="btn">Về trang chủ</Link>
        </div>
      </div>
    </main>
  );
}
