import { Link } from './runtime';
import Icon from '../../src/components/Icon';
export default function Footer({s}) { return (
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="brand" style={{ marginBottom: 16 }}>
                <span className="brand-mark">π</span>
                <span>{s.siteName}</span>
              </div>
              <p style={{ maxWidth: 320, fontSize: '.95rem' }}>Học Toán bài bản, luyện đề đúng cấu trúc, chấm điểm minh bạch. Đồng hành cùng học sinh THPT trên con đường chinh phục kỳ thi quan trọng.</p>
            </div>
            <div>
              <h3 className="footer-title">Khám phá</h3>
              <Link href="/khoa-hoc">Khóa học</Link>
              <Link href="/de-thi">Luyện thi trực tuyến</Link>
              <Link href="/bai-viet">Tài liệu & Bài viết</Link>
              <Link href="/dang-ky-khoa-hoc">Đăng ký khóa học</Link>
            </div>
            <div>
              <h3 className="footer-title">Tài khoản</h3>
              <Link href="/dang-nhap">Đăng nhập</Link>
              <Link href="/dang-ky">Tạo tài khoản học sinh</Link>
              <Link href="/hoc-sinh/ket-qua">Kết quả của tôi</Link>
            </div>
            <div>
              <h3 className="footer-title">Liên hệ</h3>
              {!s.hotline && !s.email && !s.address && <Link href="/dang-ky-khoa-hoc">Gửi yêu cầu tư vấn</Link>}
              {s.hotline && (<span style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: '.95rem' }}><Icon name="phone" size={18} />{s.hotline}</span>)}
              {s.email && (<span style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: '.95rem' }}><Icon name="mail" size={18} />{s.email}</span>)}
              {s.address && (<span style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: '.95rem' }}><Icon name="pin" size={18} />{s.address}</span>)}
              {s.openHours && (<span style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: '.95rem' }}><Icon name="clock" size={18} />{s.openHours}</span>)}
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {s.siteName}. Bảo lưu mọi quyền.</span>
            <span>Website chỉ phục vụ học tập môn Toán.</span>
          </div>
        </div>
      </footer>
); }
