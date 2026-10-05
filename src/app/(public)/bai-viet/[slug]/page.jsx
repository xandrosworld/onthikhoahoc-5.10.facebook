import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import Cover from '@/components/Cover';
import Icon from '@/components/Icon';
import { Badge } from '@/components/ui';
import { Prose } from '@/components/Rich';
import { PostCard } from '@/components/cards';
import { CATEGORY_LABEL, fmtDate, youtubeEmbed } from '@/lib/utils';
import PdfViewer from './PdfViewer';
import { postCover } from '@/lib/visuals';

export const dynamic = 'force-dynamic';

async function getPost(slug) {
  return db.post.findFirst({ where: { slug, status: 'PUBLISHED' } });
}

export async function generateMetadata({ params }) {
  params = await params;
  const p = await getPost(params.slug);
  return { title: p?.title || 'Bài viết', description: p?.excerpt };
}

export default async function PostDetail({ params }) {
  params = await params;
  const p = await getPost(params.slug);
  if (!p) notFound();
  const related = await db.post.findMany({ where: { status: 'PUBLISHED', id: { not: p.id } }, orderBy: { publishedAt: 'desc' }, take: 3 });
  const embed = youtubeEmbed(p.videoUrl);
  const isFileVideo = p.videoUrl && !embed && /(\.mp4|\.webm|\/api\/files\/)/i.test(p.videoUrl);
  return (
    <>
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 860 }}>
          <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><Link href="/bai-viet">Tài liệu & Bài viết</Link></nav>
          <div className="row mb-4"><Badge tone="primary">{CATEGORY_LABEL[p.category]}</Badge><span className="small muted">{fmtDate(p.publishedAt || p.createdAt)}</span></div>
          <h1>{p.title}</h1>
          {p.excerpt && <p>{p.excerpt}</p>}
        </div>
      </section>
      <article className="container" style={{ maxWidth: 860, paddingTop: 40 }}>
        <div className="card mb-6" style={{ overflow: 'hidden' }}><Cover url={postCover(p)} theme={p.theme} seed={p.slug} label={p.title} /></div>

        {embed && <div className="video-frame"><iframe src={embed} title={p.title} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" /></div>}
        {isFileVideo && <div className="video-frame"><video src={p.videoUrl} controls preload="metadata" /></div>}
        {p.videoUrl && !embed && !isFileVideo && (
          <p><a className="btn" href={p.videoUrl} target="_blank" rel="noopener noreferrer"><Icon name="play" size={16} /> Xem video</a></p>
        )}

        <Prose text={p.content} />

        {p.pdfUrl && (
          <>
            <div className="pdf-card">
              <span className="ic">PDF</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cell-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.pdfName || 'Tài liệu đính kèm.pdf'}</div>
                <div className="small muted">Tài liệu PDF đính kèm</div>
              </div>
              <a className="btn btn-sm" href={p.pdfUrl} target="_blank" rel="noopener noreferrer"><Icon name="external" size={16} /> Mở</a>
              <a className="btn btn-sm btn-primary" href={`${p.pdfUrl}${p.pdfUrl.includes('?') ? '&' : '?'}download=1`}><Icon name="download" size={16} /> Tải về</a>
            </div>
            <PdfViewer url={p.pdfUrl} />
          </>
        )}
      </article>

      {related.length > 0 && (
        <div className="container" style={{ paddingTop: 64 }}>
          <h2>Bài viết khác</h2>
          <div className="grid c3 mt-4">{related.map((r) => <PostCard key={r.id} p={r} />)}</div>
        </div>
      )}
    </>
  );
}
