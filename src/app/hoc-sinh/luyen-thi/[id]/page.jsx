import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { Badge, Breadcrumb, ScorePill } from '@/components/ui';
import { SubmitButton } from '@/components/client-ui';
import Icon from '@/components/Icon';
import { startExamAction } from '@/app/actions/exam';
import { SECTION_META, fmtDate, fmtDuration } from '@/lib/utils';

export const metadata = { title: 'Chi tiết đề thi' };

export default async function ExamIntro({ params, searchParams }) {
  const user = await requireUser(`/hoc-sinh/luyen-thi/${params.id}`);
  const exam = await db.exam.findFirst({
    where: { id: params.id, status: 'PUBLISHED' },
    include: { sections: { orderBy: { order: 'asc' }, include: { _count: { select: { questions: true } } } } },
  });
  if (!exam) notFound();
  const attempts = await db.examAttempt.findMany({ where: { userId: user.id, examId: exam.id }, include: { result: true }, orderBy: { startedAt: 'desc' }, take: 5 });
  const running = attempts.find((a) => a.status === 'IN_PROGRESS' && a.deadlineAt > new Date());
  const total = exam.sections.reduce((n, s) => n + s._count.questions, 0);
  return (
    <>
      <Breadcrumb items={[{ label: 'Luyện thi', href: '/hoc-sinh/luyen-thi' }, { label: exam.title }]} />
      <div className="grid split" style={{ gap: 24 }}>
        <div className="card card-pad">
          <Badge tone="primary">Khối {exam.grade}</Badge>
          <h1 style={{ fontSize: '1.8rem', marginTop: 12 }}>{exam.title}</h1>
          <p className="muted">{exam.description}</p>
          {searchParams?.loi && <div className="alert alert-error" role="alert"><Icon name="alert" size={18} />{searchParams.loi}</div>}

          <h3 className="mt-6">Cấu trúc đề</h3>
          <div className="stack" style={{ gap: 10 }}>
            {exam.sections.map((s) => {
              const m = SECTION_META[s.type];
              return (
                <div key={s.id} className="row card" style={{ padding: '14px 18px', boxShadow: 'none' }}>
                  <span className="avatar" style={{ borderRadius: 8, width: 40, height: 40 }}>{m.roman}</span>
                  <div className="grow" style={{ flex: 1 }}><b>{m.title} – {m.name}</b><div className="small muted">{m.hint}</div></div>
                  <Badge tone={s._count.questions ? 'primary' : 'neutral'}>{s._count.questions} câu</Badge>
                </div>
              );
            })}
          </div>

          <h3 className="mt-6">Lưu ý khi làm bài</h3>
          <ul className="muted" style={{ paddingLeft: 20, display: 'grid', gap: 6 }}>
            <li>Thời gian làm bài <b>{exam.durationMinutes} phút</b>. Đồng hồ bắt đầu chạy ngay khi bạn bấm “Bắt đầu làm bài”.</li>
            <li>Hết giờ hệ thống <b>tự động nộp bài</b> và chấm điểm.</li>
            <li>Bài làm được lưu tự động, tải lại trang không bị mất. Thứ tự câu hỏi{exam.shuffleQuestions ? ' được hoán đổi ngẫu nhiên trong từng phần' : ' được giữ cố định'}.</li>
            <li>Có thể dùng bảng danh sách câu để chuyển nhanh giữa các câu hỏi.</li>
          </ul>
        </div>

        <aside className="stack">
          <div className="card card-pad">
            <ul className="info-list">
              <li><span>Thời gian</span><span>{exam.durationMinutes} phút</span></li>
              <li><span>Tổng số câu</span><span>{total}</span></li>
              <li><span>Hoán đổi câu hỏi</span><span>{exam.shuffleQuestions ? 'Bật' : 'Tắt'}</span></li>
            </ul>
            <form action={startExamAction} className="mt-4">
              <input type="hidden" name="examId" value={exam.id} />
              <SubmitButton className="btn btn-primary btn-lg btn-block" pendingText="Đang chuẩn bị đề…">{running ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài'}</SubmitButton>
            </form>
            {running && <p className="small muted mt-4 mb-0">Bạn có một lượt làm dở. Thời gian vẫn đang đếm ngược.</p>}
          </div>
          <div className="card">
            <div className="card-head"><h3>Lịch sử làm bài</h3></div>
            {attempts.filter((a) => a.result).length ? attempts.filter((a) => a.result).map((a) => (
              <Link key={a.id} href={`/hoc-sinh/ket-qua/${a.id}`} className="list-row" style={{ color: 'inherit' }}>
                <div className="grow"><div className="cell-title">{fmtDate(a.submittedAt)}</div><div className="cell-sub">{fmtDuration(a.result.durationSec)}</div></div>
                <ScorePill score={a.result.score} />
              </Link>
            )) : <p className="muted small card-pad mb-0">Bạn chưa làm đề này lần nào.</p>}
          </div>
        </aside>
      </div>
    </>
  );
}
