import Link from 'next/link';
import { db } from '@/lib/db';
import { PostCard } from '@/components/cards';
import { EmptyState, Pagination, paginate } from '@/components/ui';
import { CATEGORY_LABEL } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tài liệu & Bài viết' };

export default async function PostsPage({ searchParams }) {
  const cat = CATEGORY_LABEL[searchParams?.loai] ? searchParams.loai : '';
  const q = (searchParams?.q || '').trim();
  const { page, skip, take, pageSize } = paginate(searchParams, 9);
  const where = { status: 'PUBLISHED', ...(cat ? { category: cat } : {}), ...(q ? { OR: [{ title: { contains: q } }, { excerpt: { contains: q } }] } : {}) };
  const [total, posts] = await Promise.all([
    db.post.count({ where }),
    db.post.findMany({ where, orderBy: { publishedAt: 'desc' }, skip, take }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><span aria-current="page">Tài liệu & Bài viết</span></nav>
          <h1>Tài liệu & Bài viết</h1>
          <p>Chuyên đề, bí quyết ôn thi, đề cương và video bài giảng do giáo viên biên soạn. Tải về miễn phí.</p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="row between wrap mb-6">
            <div className="filter-chips mb-0" role="group" aria-label="Lọc theo loại" style={{ marginBottom: 0 }}>
              <Link href={q ? `/bai-viet?q=${encodeURIComponent(q)}` : '/bai-viet'} className={`chip ${!cat ? 'active' : ''}`}>Tất cả</Link>
              {Object.entries(CATEGORY_LABEL).map(([k, l]) => <Link key={k} href={`/bai-viet?loai=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className={`chip ${cat === k ? 'active' : ''}`}>{l}</Link>)}
            </div>
            <form action="/bai-viet" role="search" className="row">
              {cat && <input type="hidden" name="loai" value={cat} />}
              <label htmlFor="q" className="sr-only">Tìm bài viết</label>
              <input id="q" name="q" defaultValue={q} className="input" placeholder="Tìm bài viết…" style={{ width: 240, height: 40 }} />
              <button className="btn">Tìm</button>
            </form>
          </div>
          {posts.length ? (
            <>
              <div className="grid c3">{posts.map((p) => <PostCard key={p.id} p={p} />)}</div>
              <div className="card mt-6"><Pagination page={page} pageCount={pageCount} total={total} basePath="/bai-viet" params={{ loai: cat, q }} pageSize={pageSize} /></div>
            </>
          ) : (
            <div className="card"><EmptyState icon="search" title="Không tìm thấy bài viết" action={<Link href="/bai-viet" className="btn">Xóa bộ lọc</Link>}>Hãy thử từ khóa khác hoặc chọn loại bài viết khác.</EmptyState></div>
          )}
        </div>
      </section>
    </>
  );
}
