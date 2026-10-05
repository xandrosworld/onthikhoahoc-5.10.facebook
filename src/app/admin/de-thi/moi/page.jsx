import { Breadcrumb } from '@/components/ui';
import ExamBuilder from '../ExamBuilder';

export const metadata = { title: 'Tạo đề thi' };

const empty = { id: null, title: '', description: '', grade: '12', durationMinutes: 90, shuffleQuestions: true, status: 'DRAFT', sections: { MULTIPLE_CHOICE: [], TRUE_FALSE: [], SHORT_ANSWER: [] } };

export default function NewExam() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Đề thi', href: '/admin/de-thi' }, { label: 'Tạo mới' }]} />
      <ExamBuilder initial={empty} attemptCount={0} />
    </>
  );
}
