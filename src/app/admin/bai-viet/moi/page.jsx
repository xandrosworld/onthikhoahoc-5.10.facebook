import { PageTitle, Breadcrumb } from '@/components/ui';
import PostForm from '../PostForm';

export const metadata = { title: 'Viết bài mới' };

export default function NewPost() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Bài viết', href: '/admin/bai-viet' }, { label: 'Viết mới' }]} />
      <PageTitle title="Viết bài mới" />
      <PostForm post={null} />
    </>
  );
}
