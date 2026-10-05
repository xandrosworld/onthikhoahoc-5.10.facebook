import Link from 'next/link';
import Cover from './Cover';
import Icon from './Icon';
import { Badge } from './ui';
import { CATEGORY_LABEL, fmtDate } from '@/lib/utils';

export function CourseCard({ c }) {
  return (
    <article className="card card-hover course-card">
      <Link href={`/khoa-hoc/${c.slug}`} tabIndex={-1} aria-hidden="true"><Cover url={c.coverUrl} theme={c.theme} seed={c.slug} label={c.title} /></Link>
      <div className="body">
        <div className="row between mb-2"><Badge tone="primary">Khối {c.grade}</Badge>{c.featured && <Badge tone="warning">Nổi bật</Badge>}</div>
        <h3><Link href={`/khoa-hoc/${c.slug}`} style={{ color: 'inherit' }}>{c.title}</Link></h3>
        <p>{c.summary}</p>
        <ul className="meta-list">
          <li><Icon name="users" size={16} />{c.audience}</li>
          <li><Icon name="clock" size={16} />{c.duration}</li>
        </ul>
        <div className="foot">
          <Link href={`/khoa-hoc/${c.slug}`} className="btn btn-sm">Xem chi tiết</Link>
          <Link href={`/dang-ky-khoa-hoc?khoa=${c.slug}`} className="btn btn-sm btn-primary">Đăng ký</Link>
        </div>
      </div>
    </article>
  );
}

export function ExamCard({ e, counts }) {
  return (
    <article className="card card-hover exam-card">
      <div className="row between"><Badge tone="primary">Khối {e.grade}</Badge><span className="small muted row" style={{ gap: 6 }}><Icon name="clock" size={15} />{e.durationMinutes} phút</span></div>
      <h3><Link href={`/hoc-sinh/luyen-thi/${e.id}`} style={{ color: 'inherit' }}>{e.title}</Link></h3>
      <p>{e.description}</p>
      <div className="parts">
        <Badge>{counts.mc} câu trắc nghiệm</Badge>
        <Badge>{counts.tf} câu đúng/sai</Badge>
        <Badge>{counts.sa} câu trả lời ngắn</Badge>
      </div>
      <Link href={`/hoc-sinh/luyen-thi/${e.id}`} className="btn btn-primary btn-block">Luyện thi ngay</Link>
    </article>
  );
}

export function PostCard({ p }) {
  return (
    <article className="card card-hover post-card">
      <Link href={`/bai-viet/${p.slug}`} tabIndex={-1} aria-hidden="true"><Cover url={p.coverUrl} theme={p.theme} seed={p.slug} label={p.title} /></Link>
      <div className="body">
        <div className="post-meta">
          <Badge tone={p.category === 'VIDEO' ? 'danger' : p.category === 'TAI_LIEU' ? 'info' : 'primary'}>{CATEGORY_LABEL[p.category]}</Badge>
          <span>{fmtDate(p.publishedAt || p.createdAt)}</span>
          {p.pdfUrl && <span title="Có tệp PDF"><Icon name="file" size={14} /></span>}
          {p.videoUrl && <span title="Có video"><Icon name="play" size={14} /></span>}
        </div>
        <h3><Link href={`/bai-viet/${p.slug}`}>{p.title}</Link></h3>
        <p>{p.excerpt}</p>
      </div>
    </article>
  );
}

export function countByType(exam) {
  const c = { mc: 0, tf: 0, sa: 0 };
  for (const s of exam.sections || []) {
    const n = s._count?.questions ?? s.questions?.length ?? 0;
    if (s.type === 'MULTIPLE_CHOICE') c.mc = n;
    if (s.type === 'TRUE_FALSE') c.tf = n;
    if (s.type === 'SHORT_ANSWER') c.sa = n;
  }
  return c;
}
