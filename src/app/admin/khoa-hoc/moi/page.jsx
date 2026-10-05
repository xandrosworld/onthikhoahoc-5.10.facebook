import { PageTitle, Breadcrumb } from '@/components/ui';
import CourseForm from '../CourseForm';

export const metadata = { title: 'Thêm khóa học' };

export default function NewCourse() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Khóa học', href: '/admin/khoa-hoc' }, { label: 'Thêm mới' }]} />
      <PageTitle title="Thêm khóa học" />
      <CourseForm course={null} />
    </>
  );
}
