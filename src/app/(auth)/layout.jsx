import Link from 'next/link';
import Image from 'next/image';
import { getSettings } from '@/lib/site';
import { VISUALS } from '@/lib/visuals';

export default async function AuthLayout({ children }) {
  const s = await getSettings();
  return (
    <div className="auth-layout">
      <aside className="auth-side">
        <Link href="/" className="brand"><span className="brand-mark" style={{ background: '#fff', color: '#22308f' }}>π</span><span>{s.siteName}</span></Link>
        <div>
          <h2>Luyện Toán mỗi ngày,<br />tiến bộ mỗi tuần.</h2>
          <div className="auth-visual"><Image src={VISUALS.classroom} alt="Cùng học và giải bài tập Toán tại lớp" fill sizes="50vw" /></div>
          <p>Làm bài có tính giờ, xem lời giải từng câu và theo dõi sự tiến bộ của em trong một không gian học tập.</p>
        </div>
        <span className="small">© {new Date().getFullYear()} {s.siteName}</span>
      </aside>
      <main id="main" className="auth-main"><div className="auth-box">{children}</div></main>
    </div>
  );
}
