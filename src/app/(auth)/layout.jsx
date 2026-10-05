import Link from 'next/link';
import { getSettings } from '@/lib/site';

export default async function AuthLayout({ children }) {
  const s = await getSettings();
  return (
    <div className="auth-layout">
      <aside className="auth-side">
        <Link href="/" className="brand"><span className="brand-mark" style={{ background: '#fff', color: '#22308f' }}>π</span><span>{s.siteName}</span></Link>
        <div>
          <h2>Luyện Toán mỗi ngày,<br />tiến bộ mỗi tuần.</h2>
          <blockquote>“Làm đề có tính giờ giúp em quen áp lực phòng thi. Xem lại từng câu sai là cách em tiến bộ nhanh nhất.”</blockquote>
          <p style={{ marginTop: 12 }}>— Học sinh lớp 12, khóa Luyện thi THPT</p>
        </div>
        <span className="small">© {new Date().getFullYear()} {s.siteName}</span>
      </aside>
      <main id="main" className="auth-main"><div className="auth-box">{children}</div></main>
    </div>
  );
}
