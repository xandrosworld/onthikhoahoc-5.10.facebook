import Link from 'next/link';
import { db } from '@/lib/db';
import { CourseCard } from '@/components/cards';
import { EmptyState } from '@/components/ui';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Khóa học Toán 10, 11, 12 & luyện thi THPT' };

export default async function CoursesPage({ searchParams }) {
  const grade = searchParams?.khoi || '';
  const courses = await db.course.findMany({
    where: { status: 'PUBLISHED', ...(grade ? { grade } : {}) },
    orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
  });
  const chips = [['', 'Tất cả'], ['10', 'Khối 10'], ['11', 'Khối 11'], ['12', 'Khối 12']];
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><span aria-current="page">Khóa học</span></nav>
          <h1>Khóa học Toán</h1>
          <p>Từ củng cố nền tảng đến luyện đề thi tốt nghiệp THPT — lớp nhỏ, lộ trình rõ ràng, giáo viên theo sát từng học sinh.</p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="filter-chips" role="group" aria-label="Lọc theo khối">
            {chips.map(([v, l]) => <Link key={v} href={v ? `/khoa-hoc?khoi=${v}` : '/khoa-hoc'} className={`chip ${grade === v ? 'active' : ''}`} aria-current={grade === v ? 'true' : undefined}>{l}</Link>)}
          </div>
          {courses.length ? (
            <div className="grid c3">{courses.map((c) => <CourseCard key={c.id} c={c} />)}</div>
          ) : (
            <div className="card"><EmptyState icon="book" title="Chưa có khóa học phù hợp" action={<Link href="/khoa-hoc" className="btn">Xem tất cả khóa học</Link>}>Hiện chưa có khóa học nào cho bộ lọc này. Bạn vui lòng chọn khối khác.</EmptyState></div>
          )}
          <div className="card card-pad mt-8 row between wrap" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)' }}>
            <div><h3 className="mb-0">Chưa chắc chọn khóa nào?</h3><p className="muted mb-0">Để lại thông tin, giáo viên sẽ tư vấn lớp và lịch học phù hợp với trình độ của em.</p></div>
            <Link href="/dang-ky-khoa-hoc" className="btn btn-primary">Nhận tư vấn <Icon name="right" size={16} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
