import Link from 'next/link';
import { db } from '@/lib/db';
import Icon from '@/components/Icon';
import { Rich } from '@/components/Rich';
import { CourseCard, ExamCard, PostCard, countByType } from '@/components/cards';
import { getSettings } from '@/lib/site';

export const dynamic = 'force-dynamic';

const BENEFITS = [
  ['target', 'Lộ trình rõ ràng', 'Mỗi khóa học được chia theo chuyên đề, có mục tiêu điểm số cụ thể và bài kiểm tra định kỳ.'],
  ['clipboard', 'Đề thi đúng cấu trúc mới', 'Luyện đề với đủ ba phần: trắc nghiệm, đúng/sai và trả lời ngắn — sát với đề thi THPT.'],
  ['zap', 'Chấm điểm ngay lập tức', 'Nộp bài là có điểm. Xem lại từng câu, từng ý để biết mình sai ở đâu và vì sao.'],
  ['users', 'Lớp nhỏ, học trực tiếp', 'Học offline tại trung tâm, tối đa 18 học sinh/lớp để giáo viên theo sát từng em.'],
  ['book', 'Tài liệu chọn lọc', 'Tuyển tập chuyên đề, bí quyết giải nhanh và video bài giảng do giáo viên biên soạn.'],
  ['shield', 'Theo dõi tiến bộ', 'Lịch sử làm bài và điểm số được lưu lại để học sinh và phụ huynh nhìn thấy sự tiến bộ.'],
];

const STEPS = [
  ['Đăng ký khóa học', 'Để lại thông tin, trung tâm liên hệ tư vấn lớp và lịch học phù hợp.'],
  ['Học trực tiếp tại lớp', 'Học theo chuyên đề cùng giáo viên, làm bài tập và được chữa bài ngay trên lớp.'],
  ['Luyện đề trực tuyến', 'Tạo tài khoản, làm đề có tính giờ mọi lúc mọi nơi trên điện thoại hoặc máy tính.'],
  ['Xem kết quả & cải thiện', 'Xem điểm từng phần, đối chiếu đáp án và ôn lại đúng những phần còn yếu.'],
];

export default async function Home() {
  const [courses, exams, posts, studentCount, attemptCount, s] = await Promise.all([
    db.course.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }], take: 4 }),
    db.exam.findMany({ where: { status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' }, take: 3, include: { sections: { include: { _count: { select: { questions: true } } } } } }),
    db.post.findMany({ where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, take: 3 }),
    db.user.count({ where: { role: 'STUDENT' } }),
    db.examAttempt.count({ where: { status: { not: 'IN_PROGRESS' } } }),
    getSettings(),
  ]);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <span className="eyebrow" style={{ color: '#f6c85f' }}>Trung tâm Toán học · Lớp 10 – 12</span>
            <h1>Học Toán chắc nền tảng, <em>luyện thi</em> đúng trọng tâm.</h1>
            <p className="lead">Khóa học trực tiếp tại trung tâm kết hợp hệ thống luyện đề trực tuyến theo cấu trúc mới của kỳ thi THPT. Làm bài có tính giờ, chấm điểm ngay, xem lại từng câu.</p>
            <div className="cta">
              <Link href="/de-thi" className="btn btn-lg btn-accent">Luyện thi ngay <Icon name="right" size={18} /></Link>
              <Link href="/dang-ky-khoa-hoc" className="btn btn-lg btn-outline-on-dark">Đăng ký khóa học</Link>
            </div>
            <div className="hero-badges">
              <span><Icon name="check" size={18} /> Đề đúng cấu trúc 3 phần</span>
              <span><Icon name="check" size={18} /> Chấm điểm tức thì</span>
              <span><Icon name="check" size={18} /> Lớp tối đa 18 học sinh</span>
            </div>
          </div>
          <div className="hero-card" aria-hidden="true">
            <span className="eyebrow">Phần I · Câu 1</span>
            <h3>Giao diện làm bài trực tuyến</h3>
            <Rich text={'Cho hàm số $f(x)=x^3-3x+2$. Giá trị cực đại của hàm số là'} />
            <div className="opt-demo"><b>A</b><Rich text="$0$" as="span" /></div>
            <div className="opt-demo on"><b>B</b><Rich text="$4$" as="span" /></div>
            <div className="opt-demo"><b>C</b><Rich text="$2$" as="span" /></div>
            <div className="opt-demo"><b>D</b><Rich text="$-1$" as="span" /></div>
            <div className="row between mt-4 small muted"><span>Còn lại <b style={{ color: '#111a4d' }}>00:42:16</b></span><span>12/22 câu</span></div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="stats" role="list">
          <div className="stat" role="listitem"><b>{Math.max(studentCount, 0) + 1180}+</b><span>Học sinh đã đồng hành</span></div>
          <div className="stat" role="listitem"><b>{attemptCount + 5400}+</b><span>Lượt luyện đề trực tuyến</span></div>
          <div className="stat" role="listitem"><b>92%</b><span>Đạt mục tiêu điểm đề ra</span></div>
          <div className="stat" role="listitem"><b>12 năm</b><span>Kinh nghiệm giảng dạy</span></div>
        </div>
      </div>

      <section className="section" aria-labelledby="intro-h">
        <div className="container grid c2" style={{ alignItems: 'center', gap: 56 }}>
          <div>
            <span className="eyebrow">Giới thiệu</span>
            <h2 id="intro-h">Một trung tâm Toán nhỏ, làm việc nghiêm túc.</h2>
            <p className="muted" style={{ fontSize: '1.05rem' }}>{s.siteName} được thành lập với mục tiêu rất đơn giản: giúp học sinh hiểu bản chất, làm đúng và làm nhanh. Chúng tôi không dạy mẹo vặt rời rạc — chúng tôi xây dựng nền tảng để các em tự tin ở mọi dạng bài.</p>
            <p className="muted" style={{ fontSize: '1.05rem' }}>Học sinh học trực tiếp trên lớp, sau đó luyện tập thêm trên hệ thống đề trực tuyến do chính giáo viên biên soạn, bám sát định dạng đề thi tốt nghiệp THPT.</p>
            <div className="row wrap mt-4">
              <Link href="/khoa-hoc" className="btn btn-primary">Xem các khóa học</Link>
              <Link href="/bai-viet" className="btn">Đọc tài liệu</Link>
            </div>
          </div>
          <div className="card card-pad" style={{ background: 'var(--n-25)' }}>
            <span className="eyebrow">Ví dụ nội dung đề luyện</span>
            <Rich text={'Tính tích phân $$I=\\int_0^1 \\frac{x}{\\sqrt{x^2+1}}\\,dx$$'} />
            <Rich text={'Ma trận $A=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$ có định thức bằng $\\det A=-2$.'} />
            <Rich text={'Giới hạn $\\lim_{x\\to 0}\\dfrac{\\sin x}{x}=1$.'} />
          </div>
        </div>
      </section>

      <section className="section alt" aria-labelledby="courses-h">
        <div className="container">
          <div className="section-row">
            <div className="section-head"><span className="eyebrow">Khóa học nổi bật</span><h2 id="courses-h">Chọn khóa học phù hợp với mục tiêu của em</h2></div>
            <Link href="/khoa-hoc" className="btn">Tất cả khóa học <Icon name="right" size={16} /></Link>
          </div>
          <div className="grid c4">{courses.map((c) => <CourseCard key={c.id} c={c} />)}</div>
        </div>
      </section>

      <section className="section" aria-labelledby="benefit-h">
        <div className="container">
          <div className="section-head center"><span className="eyebrow">Lợi ích khi học</span><h2 id="benefit-h">Vì sao học sinh chọn {s.siteName}</h2><p>Mọi thứ được thiết kế để việc học Toán rõ ràng, có hệ thống và đo lường được.</p></div>
          <div className="grid c3">
            {BENEFITS.map(([ic, t, d]) => (
              <div key={t} className="card benefit"><div className="ic"><Icon name={ic} size={22} /></div><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt" aria-labelledby="steps-h">
        <div className="container">
          <div className="section-head"><span className="eyebrow">Quy trình học & luyện thi</span><h2 id="steps-h">Bốn bước từ đăng ký đến kết quả</h2></div>
          <ol className="steps" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {STEPS.map(([t, d]) => <li key={t} className="step"><h3>{t}</h3><p>{d}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="exams-h">
        <div className="container">
          <div className="section-row">
            <div className="section-head"><span className="eyebrow">Đề luyện thi nổi bật</span><h2 id="exams-h">Luyện đề theo cấu trúc mới, có tính giờ</h2></div>
            <Link href="/de-thi" className="btn">Xem tất cả đề <Icon name="right" size={16} /></Link>
          </div>
          <div className="grid c3">{exams.map((e) => <ExamCard key={e.id} e={e} counts={countByType(e)} />)}</div>
        </div>
      </section>

      <section className="section alt" aria-labelledby="posts-h">
        <div className="container">
          <div className="section-row">
            <div className="section-head"><span className="eyebrow">Bài viết & tài liệu mới</span><h2 id="posts-h">Kiến thức và tài liệu từ giáo viên</h2></div>
            <Link href="/bai-viet" className="btn">Xem tất cả <Icon name="right" size={16} /></Link>
          </div>
          <div className="grid c3">{posts.map((p) => <PostCard key={p.id} p={p} />)}</div>
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Sẵn sàng bắt đầu cùng {s.siteName}?</h2>
              <p>Đăng ký khóa học để được tư vấn lớp phù hợp, hoặc tạo tài khoản và làm thử một đề luyện thi ngay hôm nay.</p>
            </div>
            <div className="row wrap">
              <Link href="/dang-ky-khoa-hoc" className="btn btn-lg btn-on-dark">Đăng ký khóa học</Link>
              <Link href="/dang-ky" className="btn btn-lg btn-outline-on-dark">Tạo tài khoản luyện thi</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
