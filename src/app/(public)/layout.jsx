import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import Icon from '@/components/Icon';
import { getUser } from '@/lib/auth';
import { getSettings } from '@/lib/site';
import { logoutAction } from '@/app/actions/auth';

export default async function PublicLayout({ children }) {
  const [user, s] = await Promise.all([getUser(), getSettings()]);
  return (
    <>
      <SiteHeader user={user ? { fullName: user.fullName, role: user.role } : null} siteName={s.siteName} tagline={s.tagline} logoutAction={logoutAction} />
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="brand" style={{ color: '#fff', marginBottom: 16 }}>
                <span className="brand-mark" style={{ background: '#fff', color: '#22308f' }}>π</span>
                <span>{s.siteName}</span>
              </div>
              <p style={{ maxWidth: 320, fontSize: '.95rem' }}>Học Toán bài bản, luyện đề đúng cấu trúc, chấm điểm minh bạch. Đồng hành cùng học sinh THPT trên con đường chinh phục kỳ thi quan trọng.</p>
            </div>
            <div>
              <h4>Khám phá</h4>
              <Link href="/khoa-hoc">Khóa học</Link>
              <Link href="/de-thi">Luyện thi trực tuyến</Link>
              <Link href="/bai-viet">Tài liệu & Bài viết</Link>
              <Link href="/dang-ky-khoa-hoc">Đăng ký khóa học</Link>
            </div>
            <div>
              <h4>Tài khoản</h4>
              <Link href="/dang-nhap">Đăng nhập</Link>
              <Link href="/dang-ky">Tạo tài khoản học sinh</Link>
              <Link href="/hoc-sinh/ket-qua">Kết quả của tôi</Link>
            </div>
            <div>
              <h4>Liên hệ</h4>
              <span style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: '.95rem' }}><Icon name="phone" size={18} />{s.hotline}</span>
              <span style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: '.95rem' }}><Icon name="mail" size={18} />{s.email}</span>
              <span style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: '.95rem' }}><Icon name="pin" size={18} />{s.address}</span>
              <span style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: '.95rem' }}><Icon name="clock" size={18} />{s.openHours}</span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {s.siteName}. Bảo lưu mọi quyền.</span>
            <span>Website chỉ phục vụ học tập môn Toán.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
