import Link from 'next/link';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { ExamCard, countByType } from '@/components/cards';
import { EmptyState } from '@/components/ui';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Luyện thi trực tuyến' };

export default async function PublicExams({ searchParams }) {
  const grade = searchParams?.khoi || '';
  const user = await getUser();
  const exams = await db.exam.findMany({
    where: { status: 'PUBLISHED', ...(grade ? { grade } : {}) },
    orderBy: { createdAt: 'desc' },
    include: { sections: { include: { _count: { select: { questions: true } } } } },
  });
  const chips = [['', 'Tất cả'], ['10', 'Khối 10'], ['11', 'Khối 11'], ['12', 'Khối 12']];
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><span aria-current="page">Luyện thi</span></nav>
          <h1>Luyện thi trực tuyến</h1>
          <p>Đề thi theo cấu trúc mới gồm ba phần. Làm bài có tính giờ, nộp bài là có điểm ngay, xem lại đáp án từng câu.</p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          {!user && (
            <div className="alert alert-info"><Icon name="info" size={18} /><div>Bạn cần <Link href="/dang-nhap?next=/hoc-sinh/luyen-thi"><b>đăng nhập</b></Link> hoặc <Link href="/dang-ky"><b>tạo tài khoản miễn phí</b></Link> để làm bài và lưu kết quả.</div></div>
          )}
          <div className="grid c3 mb-6" style={{ gap: 16 }}>
            {[['MC', 'Phần I', 'Trắc nghiệm nhiều phương án'], ['TF', 'Phần II', 'Trắc nghiệm đúng / sai'], ['SA', 'Phần III', 'Trả lời ngắn']].map(([k, a, b]) => (
              <div key={k} className="card card-pad row" style={{ padding: 16 }}><span className="avatar" style={{ width: 40, height: 40, borderRadius: 8 }}>{a.split(' ')[1]}</span><div><b>{a}</b><div className="small muted">{b}</div></div></div>
            ))}
          </div>
          <div className="filter-chips" role="group" aria-label="Lọc theo khối">
            {chips.map(([v, l]) => <Link key={v} href={v ? `/de-thi?khoi=${v}` : '/de-thi'} className={`chip ${grade === v ? 'active' : ''}`}>{l}</Link>)}
          </div>
          {exams.length ? (
            <div className="grid c3">{exams.map((e) => <ExamCard key={e.id} e={e} counts={countByType(e)} />)}</div>
          ) : (
            <div className="card"><EmptyState icon="clipboard" title="Chưa có đề thi" action={<Link href="/de-thi" className="btn">Xem tất cả</Link>}>Chưa có đề thi nào cho khối này.</EmptyState></div>
          )}
        </div>
      </section>
    </>
  );
}
