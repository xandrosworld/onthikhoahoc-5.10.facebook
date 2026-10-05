import { renderRichInline, renderMarkdown } from '@/lib/markdown';

/** Văn bản đề thi có công thức KaTeX ($...$ / $$...$$). */
export function Rich({ text, className, as: Tag = 'div' }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: renderRichInline(text) }} />;
}

/** Nội dung bài viết (markdown rút gọn + KaTeX). */
export function Prose({ text, className = '' }) {
  return <div className={`prose ${className}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />;
}
