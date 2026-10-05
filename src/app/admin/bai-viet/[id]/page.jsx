import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PageTitle, Breadcrumb } from '@/components/ui';
import PostForm from '../PostForm';

export const metadata = { title: 'Sửa bài viết' };

export default async function EditPost({ params }) {
  const p = await db.post.findUnique({ where: { id: params.id } });
  if (!p) notFound();
  return (
    <>
      <Breadcrumb items={[{ label: 'Bài viết', href: '/admin/bai-viet' }, { label: p.title }]} />
      <PageTitle title="Sửa bài viết" />
      <PostForm post={p} />
    </>
  );
}
