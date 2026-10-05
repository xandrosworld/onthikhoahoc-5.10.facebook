import Link from 'next/link';
import Icon from './Icon';
import { REG_STATUS } from '@/lib/utils';

export function Badge({ tone = 'neutral', children, dot }) {
  return <span className={`badge badge-${tone}`}>{dot && <i className="dot" />}{children}</span>;
}

export function StatusBadge({ status }) {
  const m = { PUBLISHED: ['success', 'Đã công bố'], DRAFT: ['neutral', 'Bản nháp'], ACTIVE: ['success', 'Hoạt động'], LOCKED: ['danger', 'Đã khóa'], IN_PROGRESS: ['warning', 'Đang làm'], SUBMITTED: ['success', 'Đã nộp'], EXPIRED: ['info', 'Hết giờ tự nộp'] }[status];
  if (m) return <Badge tone={m[0]} dot>{m[1]}</Badge>;
  const r = REG_STATUS[status];
  return r ? <Badge tone={r.tone} dot>{r.label}</Badge> : <Badge>{status}</Badge>;
}

export function EmptyState({ icon = 'file', title, children, action }) {
  return (
    <div className="empty">
      <span className="icon"><Icon name={icon} size={26} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function PageTitle({ title, desc, children }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {children && <div className="row wrap">{children}</div>}
    </div>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i}>
          {it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
          {i < items.length - 1 && <span aria-hidden="true"> /</span>}
        </span>
      ))}
    </nav>
  );
}

/** Phân trang bằng query string (?page=). */
export function Pagination({ page, pageCount, total, basePath, params = {}, pageSize }) {
  if (total === 0) return null;
  const href = (p) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    if (p > 1) q.set('page', String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const nums = [];
  for (let i = 1; i <= pageCount; i++) if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) nums.push(i);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav className="pagination" aria-label="Phân trang">
      <span className="small muted">Hiển thị {from}–{to} / {total}</span>
      {pageCount > 1 && (
        <div className="pages">
          <Link className={`page-btn ${page <= 1 ? 'disabled' : ''}`} href={href(page - 1)} aria-label="Trang trước"><Icon name="left" size={16} /></Link>
          {nums.map((n, i) => (
            <span key={n} style={{ display: 'contents' }}>
              {i > 0 && n - nums[i - 1] > 1 && <span className="page-btn disabled">…</span>}
              <Link className={`page-btn ${n === page ? 'active' : ''}`} href={href(n)} aria-current={n === page ? 'page' : undefined}>{n}</Link>
            </span>
          ))}
          <Link className={`page-btn ${page >= pageCount ? 'disabled' : ''}`} href={href(page + 1)} aria-label="Trang sau"><Icon name="right" size={16} /></Link>
        </div>
      )}
    </nav>
  );
}

export function paginate(searchParams, pageSize = 10) {
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
  return { page, skip: (page - 1) * pageSize, take: pageSize, pageSize };
}

export function ScorePill({ score }) {
  const tone = score >= 8 ? 'success' : score >= 5 ? 'warning' : 'danger';
  return <span className={`score-pill ${tone}`}>{(Math.round(score * 100) / 100).toLocaleString('vi-VN')}</span>;
}

export function SkeletonCards({ n = 3 }) {
  return (
    <div className="grid c3">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card card-pad">
          <div className="skeleton sk-block mb-4" />
          <div className="skeleton sk-line" style={{ width: '70%' }} />
          <div className="skeleton sk-line" />
          <div className="skeleton sk-line" style={{ width: '50%' }} />
        </div>
      ))}
    </div>
  );
}
