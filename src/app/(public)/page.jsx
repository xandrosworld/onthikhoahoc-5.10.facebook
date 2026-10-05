import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import Icon from '@/components/Icon';
import { CourseCard, ExamCard, PostCard, countByType } from '@/components/cards';
import { getSettings } from '@/lib/site';
import { VISUALS } from '@/lib/visuals';

export const dynamic = 'force-dynamic';
export const metadata = { description: 'Học Toán lớp 10, 11, 12 tại lớp và luyện đề trực tuyến. Làm bài có tính giờ, chấm điểm ngay và xem lời giải từng câu.' };

const BENEFITS = [
  ['target', 'Lộ trình rõ ràng', 'Học theo từng chuyên đề, với mục tiêu cụ thể và bài kiểm tra định kỳ.'],
  ['clipboard', 'Luyện đúng cấu trúc', 'Làm quen đủ ba phần: trắc nghiệm, đúng/sai và trả lời ngắn.'],
  ['zap', 'Biết ngay mình cần ôn gì', 'Có điểm sau khi nộp bài, kèm đáp án và lời giải từng câu.'],
  ['users', 'Được hướng dẫn sát sao', 'Lớp học nhỏ để giáo viên có thời gian theo sát từng học sinh.'],
  ['book', 'Tài liệu chọn lọc', 'Chuyên đề, bài tập và video để tiếp tục luyện tập sau giờ học.'],
  ['shield', 'Nhìn thấy sự tiến bộ', 'Xem lại lịch sử bài làm, điểm số và những phần còn cần cải thiện.'],
];
const STEPS = [
  ['Chọn lớp phù hợp', 'Để lại thông tin để được tư vấn lớp học và lịch học.'],
  ['Hiểu bài ngay tại lớp', 'Học theo chuyên đề, luyện tập và được giáo viên chữa bài.'],
  ['Luyện đề theo nhịp của em', 'Làm bài có tính giờ trên điện thoại hoặc máy tính.'],
  ['Ôn đúng phần còn yếu', 'Đối chiếu lời giải, xem kết quả và tiếp tục cải thiện.'],
];

export default async function Home() {
  const [courses, exams, posts, s] = await Promise.all([
    db.course.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }], take: 4 }),
    db.exam.findMany({ where: { status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' }, take: 3, include: { sections: { include: { _count: { select: { questions: true } } } } } }),
    db.post.findMany({ where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, take: 3 }),
    getSettings(),
  ]);
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Học Toán cùng {s.siteName}</span>
            <h1>Học Toán chắc.<span>Tự tin đi thi.</span></h1>
            <p className="lead">Học tại lớp, luyện đề trực tuyến. Hiểu từng lời giải, tiến bộ qua mỗi bài làm.</p>
            <div className="hero-actions">
              <Link href="/de-thi" className="btn btn-lg btn-primary">Luyện thi ngay <Icon name="right" size={18} /></Link>
              <Link href="/dang-ky-khoa-hoc" className="btn btn-lg">Đăng ký học</Link>
            </div>
          </div>
          <div className="hero-photo">
            <Image src={VISUALS.hero} alt="Hai học sinh cùng luyện Toán trong không gian học tập sáng sủa" fill priority fetchPriority="high" sizes="(max-width: 768px) 100vw, 650px" />
          </div>
        </div>
      </section>

      <div className="container">
        <div className="learning-facts" role="list" aria-label="Chương trình học">
          <div role="listitem"><b>10 - 12</b><span>Khối lớp đồng hành</span></div>
          <div role="listitem"><b>3 phần</b><span>Cấu trúc đề luyện thi</span></div>
          <div role="listitem"><b>Lớp nhỏ</b><span>Giáo viên theo sát</span></div>
          <div role="listitem"><b>Có lời giải</b><span>Hiểu bài sau mỗi lượt thi</span></div>
        </div>
      </div>

      <section className="section home-intro" aria-labelledby="intro-h">
        <div className="container intro-grid">
          <figure className="intro-photo">
            <div className="photo-frame"><Image src={VISUALS.classroom} alt="Giáo viên hướng dẫn nhóm học sinh giải bài tập Toán" fill sizes="(max-width: 768px) 100vw, 600px" /></div>
            <figcaption>Học cùng nhau, hiểu từng bước.</figcaption>
          </figure>
          <div className="intro-copy">
            <h2 id="intro-h">Một lớp học nhỏ.<br />Một nền tảng vững.</h2>
            <p>{s.siteName} giúp học sinh hiểu bản chất, làm đúng và làm nhanh. Từng chuyên đề được giảng giải rõ ràng, từng bài tập đều có cơ hội được hỏi và được chữa.</p>
            <p className="muted">Từ giờ học trực tiếp đến bài luyện trực tuyến, em luôn biết mình đang học gì và cần cải thiện ở đâu.</p>
            <Link href="/khoa-hoc" className="text-link">Khám phá các khóa học <Icon name="right" size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section alt" aria-labelledby="courses-h">
        <div className="container">
          <div className="section-row">
            <div className="section-head"><h2 id="courses-h">Một lộ trình cho mỗi mục tiêu.</h2><p>Chọn nền tảng phù hợp, rồi từng bước tiến xa hơn.</p></div>
            <Link href="/khoa-hoc" className="text-link">Tất cả khóa học <Icon name="right" size={18} /></Link>
          </div>
          <div className="grid c4 home-courses">{courses.map(c => <CourseCard key={c.id} c={c} />)}</div>
        </div>
      </section>

      <section className="section home-benefits" aria-labelledby="benefit-h">
        <div className="container">
          <div className="section-head"><span className="eyebrow">Cách chúng mình đồng hành</span><h2 id="benefit-h">Không chỉ có bài giảng.<br />Có cả một cách học rõ ràng.</h2></div>
          <div className="benefit-grid">
            {BENEFITS.map(([icon, title, description]) => <div key={title} className="benefit-item"><div className="benefit-icon"><Icon name={icon} size={24} /></div><div><h3>{title}</h3><p>{description}</p></div></div>)}
          </div>
        </div>
      </section>

      <section className="section alt" aria-labelledby="steps-h">
        <div className="container learning-journey">
          <div className="journey-photo"><Image src={VISUALS.study} alt="Vở bài tập, máy tính và bút chì sẵn sàng cho một buổi luyện Toán" fill sizes="(max-width: 768px) 100vw, 550px" /></div>
          <div>
            <h2 id="steps-h">Từ buổi học đầu tiên<br />đến lần làm bài tự tin.</h2>
            <ol className="journey-steps">{STEPS.map(([title, description]) => <li key={title}><h3>{title}</h3><p>{description}</p></li>)}</ol>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="exams-h">
        <div className="container">
          <div className="section-row"><div className="section-head"><h2 id="exams-h">Thử sức. Biết mình. Tiến bộ.</h2><p>Luyện đề có tính giờ, nhận điểm và lời giải sau khi nộp bài.</p></div><Link href="/de-thi" className="text-link">Tất cả đề thi <Icon name="right" size={18} /></Link></div>
          <div className="grid c3">{exams.map(e => <ExamCard key={e.id} e={e} counts={countByType(e)} />)}</div>
        </div>
      </section>

      <section className="section alt" aria-labelledby="posts-h">
        <div className="container">
          <div className="section-row"><div className="section-head"><h2 id="posts-h">Thêm một góc nhìn, hiểu sâu một bài Toán.</h2><p>Tài liệu, kinh nghiệm và những bài giảng để em học tiếp mỗi ngày.</p></div><Link href="/bai-viet" className="text-link">Tất cả tài liệu <Icon name="right" size={18} /></Link></div>
          <div className="home-posts">{posts.map(p => <PostCard key={p.id} p={p} />)}</div>
        </div>
      </section>

      <section className="section home-cta" aria-labelledby="cta-h">
        <div className="container">
          <div className="home-cta-panel"><div><h2 id="cta-h">Bắt đầu từ một bài Toán.<br />Tiến thêm một bước mỗi ngày.</h2><p>Chọn lớp phù hợp hoặc tạo tài khoản để luyện đề ngay hôm nay.</p><div className="row wrap"><Link href="/dang-ky-khoa-hoc" className="btn btn-lg btn-primary">Đăng ký học <Icon name="right" size={18} /></Link><Link href="/dang-ky" className="btn btn-lg">Tạo tài khoản</Link></div></div><div className="cta-photo"><Image src={VISUALS.library} alt="Sách và tài liệu Toán trong sắc xanh của Toán Tư Duy" fill sizes="(max-width: 768px) 100vw, 450px" /></div></div>
        </div>
      </section>
    </div>
  );
}
