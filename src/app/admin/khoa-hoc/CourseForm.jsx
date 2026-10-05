'use client';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { saveCourseAction } from '@/app/actions/admin';
import { SubmitButton, Field, Switch } from '@/components/client-ui';
import UploadField from '@/components/UploadField';
import Icon from '@/components/Icon';
import { THEME_KEYS } from '@/components/Cover';

const THEME_NAMES = { indigo: 'Chàm', navy: 'Xanh navy', teal: 'Xanh ngọc', amber: 'Hổ phách', plum: 'Tím', slate: 'Xám' };

export default function CourseForm({ course }) {
  const [state, action] = useFormState(saveCourseAction, null);
  const e = state?.errors || {};
  const v = (k) => state?.values?.[k] ?? course?.[k] ?? '';
  const featured = state?.values ? state.values.featured === 'on' : course?.featured ?? false;
  return (
    <form action={action} noValidate>
      <input type="hidden" name="id" value={course?.id || ''} />
      {Object.keys(e).length > 0 && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} />Vui lòng kiểm tra lại các trường được đánh dấu.</div>}
      <div className="grid split">
        <div className="card card-pad">
          <Field id="title" label="Tên khóa học" required error={e.title}><input id="title" name="title" className="input" defaultValue={v('title')} aria-invalid={!!e.title} /></Field>
          <Field id="summary" label="Mô tả ngắn" required error={e.summary} hint="Hiển thị trên thẻ khóa học."><textarea id="summary" name="summary" className="textarea" style={{ minHeight: 72 }} defaultValue={v('summary')} aria-invalid={!!e.summary} /></Field>
          <Field id="description" label="Giới thiệu chi tiết" hint="Hỗ trợ Markdown: ## tiêu đề, **đậm**, - danh sách và công thức $x^2$."><textarea id="description" name="description" className="textarea" style={{ minHeight: 160 }} defaultValue={v('description')} /></Field>
          <Field id="audience" label="Đối tượng" required error={e.audience}><input id="audience" name="audience" className="input" defaultValue={v('audience')} aria-invalid={!!e.audience} /></Field>
          <Field id="syllabus" label="Nội dung / chuyên đề" hint="Mỗi chuyên đề một dòng tiêu đề, các mục con bắt đầu bằng “- ”. Cách nhau bằng một dòng trống.">
            <textarea id="syllabus" name="syllabus" className="textarea" style={{ minHeight: 220, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '.9rem' }} defaultValue={v('syllabus')} placeholder={'Chuyên đề 1: Hàm số\n- Tính đơn điệu\n- Cực trị\n\nChuyên đề 2: ...'} />
          </Field>
          <div className="form-grid">
            <Field id="teacherName" label="Giáo viên phụ trách"><input id="teacherName" name="teacherName" className="input" defaultValue={v('teacherName')} /></Field>
            <div />
            <div className="full"><Field id="teacherBio" label="Giới thiệu giáo viên"><textarea id="teacherBio" name="teacherBio" className="textarea" style={{ minHeight: 72 }} defaultValue={v('teacherBio')} /></Field></div>
          </div>
        </div>
        <div className="stack">
          <div className="card card-pad">
            <Field id="status" label="Trạng thái"><select id="status" name="status" className="select" defaultValue={v('status') || 'PUBLISHED'}><option value="PUBLISHED">Công bố</option><option value="DRAFT">Bản nháp (ẩn)</option></select></Field>
            <Switch name="featured" defaultChecked={featured} label="Khóa học nổi bật (hiện trang chủ)" />
          </div>
          <div className="card card-pad">
            <UploadField kind="IMAGE" name="coverUrl" label="Ảnh cover" defaultUrl={v('coverUrl')} accept="image/jpeg,image/png,image/webp" hint="Tỉ lệ 16:9, tối đa 5MB. Bỏ trống để dùng ảnh mặc định." />
            <Field id="theme" label="Màu ảnh mặc định"><select id="theme" name="theme" className="select" defaultValue={v('theme') || 'indigo'}>{THEME_KEYS.map((k) => <option key={k} value={k}>{THEME_NAMES[k]}</option>)}</select></Field>
          </div>
          <div className="card card-pad">
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Field id="grade" label="Khối"><select id="grade" name="grade" className="select" defaultValue={v('grade') || '12'}><option>10</option><option>11</option><option>12</option></select></Field>
              <Field id="duration" label="Thời lượng" required error={e.duration}><input id="duration" name="duration" className="input" defaultValue={v('duration')} placeholder="24 buổi · 3 tháng" aria-invalid={!!e.duration} /></Field>
            </div>
            <Field id="schedule" label="Lịch học" required error={e.schedule}><input id="schedule" name="schedule" className="input" defaultValue={v('schedule')} placeholder="Thứ 3, 5 · 18:00–20:00" aria-invalid={!!e.schedule} /></Field>
            <Field id="tuition" label="Học phí (hiển thị)"><input id="tuition" name="tuition" className="input" defaultValue={v('tuition')} placeholder="Liên hệ để biết thêm" /></Field>
          </div>
        </div>
      </div>
      <div className="sticky-save"><SubmitButton><Icon name="save" size={18} />Lưu khóa học</SubmitButton><Link href="/admin/khoa-hoc" className="btn">Hủy</Link></div>
    </form>
  );
}
