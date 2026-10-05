import Link from 'next/link';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import RegisterForm from './RegisterForm';
import Icon from '@/components/Icon';
import { getSettings } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Đăng ký khóa học' };

export default async function Page({ searchParams }) {
  searchParams = await searchParams;
  const [courses, user, s] = await Promise.all([
    db.course.findMany({ where: { status: 'PUBLISHED' }, orderBy: { createdAt: 'asc' }, select: { id: true, title: true, slug: true } }),
    getUser(),
    getSettings(),
  ]);
  const preselect = courses.find((c) => c.slug === searchParams?.khoa)?.id || '';
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><span aria-current="page">Đăng ký khóa học</span></nav>
          <h1>Đăng ký khóa học</h1>
          <p>Điền thông tin bên dưới, giáo viên sẽ liên hệ tư vấn lớp và lịch học trong vòng 24 giờ làm việc.</p>
        </div>
      </section>
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="detail-layout">
          <div className="card card-pad"><RegisterForm courses={courses} preselect={preselect} user={user ? { fullName: user.fullName, email: user.email, phone: user.phone || '' } : null} /></div>
          <aside className="stack">
            <div className="card card-pad">
              <h3>Quy trình đăng ký</h3>
              <ol className="small muted" style={{ paddingLeft: 18, margin: 0, display: 'grid', gap: 10 }}>
                <li>Gửi thông tin đăng ký trực tuyến.</li>
                <li>Trung tâm gọi điện tư vấn, xếp lớp phù hợp.</li>
                <li>Học sinh đến học thử và hoàn tất ghi danh trực tiếp.</li>
              </ol>
              <p className="small mt-4 mb-0"><Icon name="info" size={14} /> Đăng ký này <b>không thu phí</b> và không có thanh toán trực tuyến.</p>
            </div>
            <div className="card card-pad">
              <h3>Cần hỗ trợ nhanh?</h3>
              <p className="small mb-2 row"><Icon name="phone" size={16} /> {s.hotline}</p>
              <p className="small mb-2 row"><Icon name="mail" size={16} /> {s.email}</p>
              <p className="small mb-0 row"><Icon name="clock" size={16} /> {s.openHours}</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
