import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PageTitle, Breadcrumb } from '@/components/ui';
import { syllabusToText } from '@/lib/utils';
import CourseForm from '../CourseForm';

export const metadata = { title: 'Sửa khóa học' };

export default async function EditCourse({ params }) {
  params = await params;
  const c = await db.course.findUnique({ where: { id: params.id } });
  if (!c) notFound();
  return (
    <>
      <Breadcrumb items={[{ label: 'Khóa học', href: '/admin/khoa-hoc' }, { label: c.title }]} />
      <PageTitle title="Sửa khóa học" />
      <CourseForm course={{ ...c, syllabus: syllabusToText(c.syllabus) }} />
    </>
  );
}
