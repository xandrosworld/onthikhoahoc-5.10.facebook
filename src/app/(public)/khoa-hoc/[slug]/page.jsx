import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import Cover from '@/components/Cover';
import Icon from '@/components/Icon';
import { Badge } from '@/components/ui';
import { Prose, Rich } from '@/components/Rich';
import { CourseCard } from '@/components/cards';
import { parseJSON, initials } from '@/lib/utils';
import { courseCover } from '@/lib/visuals';

export const dynamic = 'force-dynamic';

async function getCourse(slug) {
  return db.course.findFirst({ where: { slug, status: 'PUBLISHED' } });
}

export async function generateMetadata({ params }) {
  params = await params;
  const c = await getCourse(params.slug);
  return { title: c ? c.title : 'Khóa học', description: c?.summary };
}

export default async function CourseDetail({ params }) {
  params = await params;
  const c = await getCourse(params.slug);
  if (!c) notFound();
  const syllabus = parseJSON(c.syllabus, []);
  const related = await db.course.findMany({ where: { status: 'PUBLISHED', id: { not: c.id } }, take: 3, orderBy: { createdAt: 'asc' } });
  return (
    <>
      <section className="page-hero" style={{ background: 'var(--primary-900)', color: '#c3ccf5', borderBottom: 0 }}>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb" style={{ color: '#8fa0ff' }}>
            <Link href="/" style={{ color: '#8fa0ff' }}>Trang chủ</Link><span>/</span><Link href="/khoa-hoc" style={{ color: '#8fa0ff' }}>Khóa học</Link><span>/</span><span aria-current="page">{c.title}</span>
          </nav>
          <Badge tone="warning">Khối {c.grade}</Badge>
          <h1 style={{ color: '#fff', marginTop: 12 }}>{c.title}</h1>
          <p style={{ color: '#c3ccf5' }}>{c.summary}</p>
        </div>
      </section>
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="detail-layout">
          <div>
            <div className="card" style={{ overflow: 'hidden' }}><Cover url={courseCover(c)} theme={c.theme} seed={c.slug} label={c.title} /></div>

            <h2 className="mt-8">Giới thiệu khóa học</h2>
            <Prose text={c.description} />

            <h2 className="mt-8">Đối tượng phù hợp</h2>
            <p className="muted" style={{ fontSize: '1.05rem' }}>{c.audience}</p>

            {syllabus.length > 0 && (
              <>
                <h2 className="mt-8">Nội dung & chuyên đề</h2>
                <div className="syllabus">
                  {syllabus.map((m, i) => (
                    <details key={i} open={i === 0}>
                      <summary>{m.title}</summary>
                      <ul>{(m.items || []).map((it, j) => <li key={j}><Rich as="span" text={it} /></li>)}</ul>
                    </details>
                  ))}
                </div>
              </>
            )}

            {c.teacherName && (
              <>
                <h2 className="mt-8">Giáo viên phụ trách</h2>
                <div className="card card-pad teacher">
                  <span className="avatar">{initials(c.teacherName)}</span>
                  <div><h3 className="mb-0">{c.teacherName}</h3><p className="muted mb-0 mt-2">{c.teacherBio}</p></div>
                </div>
              </>
            )}
          </div>

          <aside className="sticky-card">
            <div className="card card-pad">
              <h3>Thông tin khóa học</h3>
              <ul className="info-list">
                <li><span>Khối lớp</span><span>Lớp {c.grade}</span></li>
                <li><span>Thời lượng</span><span>{c.duration}</span></li>
                <li><span>Lịch học</span><span>{c.schedule}</span></li>
                {c.tuition && <li><span>Học phí</span><span>{c.tuition}</span></li>}
                <li><span>Hình thức</span><span>Học trực tiếp tại trung tâm</span></li>
              </ul>
              <Link href={`/dang-ky-khoa-hoc?khoa=${c.slug}`} className="btn btn-primary btn-lg btn-block mt-4">Đăng ký khóa học</Link>
              <p className="small muted center mt-4 mb-0"><Icon name="info" size={14} /> Không thanh toán online. Trung tâm sẽ liên hệ tư vấn sau khi nhận đăng ký.</p>
            </div>
            <div className="card card-pad mt-4">
              <h4>Luyện đề kèm theo khóa học</h4>
              <p className="small muted">Học viên được sử dụng hệ thống đề luyện thi trực tuyến miễn phí.</p>
              <Link href="/de-thi" className="btn btn-block">Xem đề luyện thi</Link>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-8" style={{ paddingTop: 40 }}>
            <h2>Khóa học khác</h2>
            <div className="grid c3 mt-4">{related.map((r) => <CourseCard key={r.id} c={r} />)}</div>
          </section>
        )}
      </div>
    </>
  );
}
