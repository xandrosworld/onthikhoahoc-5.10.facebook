import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  boot,
  api,
  Link,
  go,
  pathNow,
  setCatalog,
  asset,
  href,
} from "./runtime";
import Footer from "./Footer";
import Home from "../../src/app/(public)/page";
import SiteHeader from "../../src/components/SiteHeader";
import ExamBuilder from "../../src/app/admin/de-thi/ExamBuilder";
import ExamRunner from "../../src/app/lam-bai/[attemptId]/ExamRunner";
import ResultView from "../../src/components/ResultView";
import { ToastProvider, useToast } from "../../src/components/client-ui";
import {
  CourseCard,
  ExamCard,
  PostCard,
  countByType,
} from "../../src/components/cards";
import { Prose, Rich } from "../../src/components/Rich";
import MathField from "../../src/components/MathField";
import VideoPlayer from "../../src/components/VideoPlayer";
import UploadField from "../../src/components/UploadField";
import Icon from "../../src/components/Icon";
import {
  fmtDateTime,
  fmtScore,
  REG_STATUS,
  CATEGORY_LABEL,
} from "../../src/lib/utils";
import { DEFAULT_POINTS } from "../../src/lib/exam-config";
import "./style.css";

const names = {
  exams: "Đề thi",
  courses: "Khóa học",
  posts: "Bài viết & Tài liệu",
  registrations: "Đăng ký khóa học",
  students: "Học sinh",
  attempts: "Kết quả thi",
  settings: "Thiết lập",
};
const urls = {
  exams: "de-thi",
  courses: "khoa-hoc",
  posts: "bai-viet",
  registrations: "dang-ky",
  students: "hoc-sinh",
  attempts: "ket-qua",
  settings: "thiet-lap",
};
const types = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"];
const blankExam = () => ({
  title: "",
  description: "",
  template: "FULL",
  grade: "12",
  durationMinutes: 90,
  shuffleQuestions: true,
  status: "DRAFT",
  sections: Object.fromEntries(types.map((t) => [t, []])),
  sectionSettings: Object.fromEntries(
    types.map((t) => [
      t,
      { pointsPerQuestion: DEFAULT_POINTS[t], tfScoring: "TIERED" },
    ]),
  ),
});
const safeUrl = (u) =>
  /^https?:\/\//i.test(u || "") || /^\/(?!\/)/.test(u || "") ? u : "#";
function ErrorBox({ error }) {
  return error ? (
    <div className="sc-error" role="alert">
      {error}
    </div>
  ) : null;
}
function Empty({ children = "Chưa có nội dung. Giáo viên sẽ cập nhật sớm." }) {
  return <div className="card sc-empty">{children}</div>;
}
function Loading() {
  return (
    <div className="sc-page" role="status">
      Đang tải…
    </div>
  );
}
function useData(endpoint) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setData(null);
    api(endpoint)
      .then((x) => {
        if (active) setData(x);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [endpoint]);
  return { data, error, setData };
}
async function logout() {
  await api("auth/logout", {});
  location.assign(href("/"));
}
function Field({ label, children }) {
  return (
    <div className="field">
      <label>
        {label}
        {children}
      </label>
    </div>
  );
}
function Shell({ admin, children }) {
  const links = admin
    ? Object.keys(names).map((k) => ({
        label: names[k],
        to: "/admin/" + urls[k],
        icon:
          k === "exams"
            ? "clipboard"
            : k === "students"
              ? "users"
              : k === "settings"
                ? "settings"
                : "book",
      }))
    : [
        { label: "Tổng quan", to: "/hoc-sinh", icon: "home" },
        { label: "Luyện thi", to: "/hoc-sinh/luyen-thi", icon: "clipboard" },
        { label: "Kết quả thi", to: "/hoc-sinh/ket-qua", icon: "chart" },
        { label: "Tài khoản", to: "/hoc-sinh/tai-khoan", icon: "user" },
      ];
  const [open, setOpen] = useState(false);
  return (
    <div className={`app app-${admin ? "admin" : "student"}`}>
      {open && (
        <button
          className="app-menu-backdrop"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${admin ? "admin" : ""} ${open ? "open" : ""}`}
      >
        <Link href="/" className="brand">
          <img className="sc-brand-logo" src={boot.assets + "images/sonclass-logo.png"} alt="" />
          <span>
            {boot.settings.siteName}
            <small>{admin ? "Quản trị" : "Học sinh"}</small>
          </span>
        </Link>
        <nav className="side-nav">
          {admin && (
            <Link className="side-link" href="/admin">
              <Icon name="home" />
              Tổng quan
            </Link>
          )}
          {links.map((l) => (
            <Link
              key={l.to}
              href={l.to}
              className="side-link"
              aria-current={
                pathNow().split("?")[0] === l.to ? "page" : undefined
              }
              onClick={() => setOpen(false)}
            >
              <Icon name={l.icon} size={19} />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-user">
            <span className="avatar">{boot.user.fullName.slice(0, 1)}</span>
            <div>
              <b>{boot.user.fullName}</b>
              <span>{boot.user.email}</span>
            </div>
          </div>
          <button className="btn btn-block" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </aside>
      <div className="app-main">
        <div className="app-topbar">
          <button
            className="btn btn-icon app-menu-toggle"
            aria-label="Mở menu"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <b>{admin ? "Không gian quản trị" : "Không gian học tập"}</b>
          <span className="spacer" />
          <Link href="/">Xem website</Link>
        </div>
        <main id="main" className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}
function Auth({ register }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="sc-page">
      <form
        className="card card-pad sc-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const login = await api(
              register ? "auth/register" : "auth/login",
              Object.fromEntries(new FormData(e.currentTarget)),
            );
            const next =
              new URLSearchParams(location.search).get("next") ||
              (/^\/(admin|hoc-sinh|lam-bai)(\/|$)/.test(pathNow())
                ? pathNow()
                : "");
            location.assign(
              next?.startsWith("/") && !next.startsWith("//")
                ? href(next)
                : href(login.role === "ADMIN" ? "/admin" : "/hoc-sinh"),
            );
          } catch (e) {
            setError(e.message);
            setBusy(false);
          }
        }}
      >
        <h1>{register ? "Tạo tài khoản học sinh" : "Đăng nhập"}</h1>
        <ErrorBox error={error} />
        {register && (
          <>
            <Field label="Họ và tên">
              <input
                name="fullName"
                className="input"
                required
                autoComplete="name"
              />
            </Field>
            <Field label="Khối lớp">
              <select name="grade" className="select">
                <option>10</option>
                <option>11</option>
                <option>12</option>
              </select>
            </Field>
            <Field label="Điện thoại">
              <input name="phone" className="input" autoComplete="tel" />
            </Field>
          </>
        )}
        <Field label={register ? "Email" : "Email hoặc tên đăng nhập"}>
          <input
            name="email"
            type={register ? "email" : "text"}
            className="input"
            required
            autoComplete="username"
          />
        </Field>
        <Field label="Mật khẩu">
          <input
            name="password"
            type="password"
            className="input"
            required
            minLength={register ? 8 : undefined}
            autoComplete={register ? "new-password" : "current-password"}
          />
        </Field>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Đang xử lý…" : register ? "Đăng ký" : "Đăng nhập"}
        </button>
        <p className="mt-4">
          <Link href={register ? "/dang-nhap" : "/dang-ky"}>
            {register
              ? "Đã có tài khoản? Đăng nhập"
              : "Chưa có tài khoản? Đăng ký"}
          </Link>{" "}
          · <a href={boot.resetUrl}>Quên mật khẩu</a>
        </p>
      </form>
    </div>
  );
}
function Catalog({ kind, catalog }) {
  const [search, setSearch] = useState(""),
    [grade, setGrade] = useState("");
  const items = catalog[kind].filter(
    (x) =>
      (!grade || x.grade === grade) &&
      (x.title || "").toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="sc-page">
      <h1>{names[kind]}</h1>
      <div className="sc-controls">
        <input
          aria-label="Tìm kiếm"
          className="input"
          placeholder="Tìm theo tên…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {kind !== "posts" && (
          <select
            aria-label="Khối lớp"
            className="select"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            <option value="">Tất cả khối lớp</option>
            {["10", "11", "12"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        )}
      </div>
      {items.length ? (
        <div className="grid c3">
          {items.map((x) =>
            kind === "exams" ? (
              <ExamCard key={x.id} e={x} counts={countByType(x)} />
            ) : kind === "courses" ? (
              <CourseCard key={x.id} c={x} />
            ) : (
              <PostCard key={x.id} p={x} />
            ),
          )}
        </div>
      ) : (
        <Empty />
      )}
    </div>
  );
}
function Detail({ kind, item }) {
  if (!item) return <Empty>Không tìm thấy nội dung.</Empty>;
  return (
    <article className="sc-page sc-details">
      <Link href={kind === "courses" ? "/khoa-hoc" : "/bai-viet"}>
        ← {names[kind]}
      </Link>
      <h1>{item.title}</h1>
      <p className="lead">{item.summary || item.excerpt}</p>
      {item.coverUrl && <img src={safeUrl(item.coverUrl)} alt={item.title} />}
      <VideoPlayer url={item.videoUrl} />
      <Prose text={item.description || item.content} />
      {kind === "courses" && (
        <>
          <div className="sc-alert">
            <p>
              <b>Đối tượng:</b> {item.audience}
            </p>
            <p>
              <b>Thời lượng:</b> {item.duration}
            </p>
            <p>
              <b>Lịch học:</b> {item.schedule}
            </p>
            <p>
              <b>Học phí:</b> {item.tuition || "Liên hệ tư vấn"}
            </p>
          </div>
          {item.syllabus && (
            <>
              <h2>Nội dung khóa học</h2>
              <Prose text={item.syllabus} />
            </>
          )}
          <h2>{item.teacherName}</h2>
          <p>{item.teacherBio}</p>
          <Link
            className="btn btn-primary"
            href={"/dang-ky-khoa-hoc?khoa=" + item.id}
          >
            Đăng ký khóa học
          </Link>
        </>
      )}
      {item.pdfUrl && (
        <p>
          <a
            className="btn"
            href={safeUrl(item.pdfUrl)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Mở tài liệu PDF
          </a>
        </p>
      )}
    </article>
  );
}
function Registration({ catalog }) {
  const query = new URLSearchParams(pathNow().split("?")[1] || location.search),
    selected = catalog.courses.find(
      (c) => c.id === query.get("khoa") || c.slug === query.get("khoa"),
    );
  const [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <div className="sc-page">
      <form
        className="card card-pad sc-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api(
              "registrations",
              Object.fromEntries(new FormData(e.currentTarget)),
            );
            setDone(true);
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1>Đăng ký học</h1>
        {done ? (
          <div className="alert alert-success" role="status">
            Đã nhận thông tin. Giáo viên sẽ liên hệ tư vấn cho bạn.
          </div>
        ) : (
          <>
            <ErrorBox error={error} />
            {[
              ["fullName", "Họ và tên"],
              ["phone", "Số điện thoại"],
              ["email", "Email"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  name={key}
                  type={key === "email" ? "email" : "text"}
                  className="input"
                  required
                  defaultValue={boot.user?.[key] || ""}
                />
              </Field>
            ))}
            <Field label="Lớp hiện tại">
              <select name="currentGrade" className="select">
                {["10", "11", "12"].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>
            <Field label="Khóa học">
              <select
                name="courseId"
                defaultValue={selected?.id || ""}
                className="select"
              >
                <option value="">Cần tư vấn thêm</option>
                {catalog.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ghi chú">
              <textarea name="note" className="textarea" />
            </Field>
            <button disabled={busy} className="btn btn-primary">
              {busy ? "Đang gửi…" : "Gửi đăng ký"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
function ExamIntro({ exam }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (!exam) return <Empty>Đề thi chưa được công bố.</Empty>;
  return (
    <div className="card card-pad">
      <h1>{exam.title}</h1>
      <p>{exam.description}</p>
      <p>
        Khối {exam.grade} · {exam.durationMinutes} phút
      </p>
      <p>
        Tổng điểm: {exam.sections.reduce((a, s) => a + s.maxPoints, 0)} · Số
        câu: {exam.sections.reduce((a, s) => a + s._count.questions, 0)}
      </p>
      <div className="sc-alert">
        Thời gian được tính từ khi bắt đầu. Đáp án tự động lưu trong quá trình
        làm; khi hết giờ hệ thống chấm các đáp án đã lưu.
      </div>
      <ErrorBox error={error} />
      <button
        disabled={busy}
        className="btn btn-primary"
        onClick={async () => {
          setBusy(true);
          try {
            const r = await api("attempts/start", { examId: exam.id });
            go("/lam-bai/" + r.id);
          } catch (e) {
            setError(e.message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Đang mở đề…" : "Bắt đầu / Tiếp tục làm bài"}
      </button>
    </div>
  );
}
function Attempt({ id, result = false, admin = false }) {
  const { data, error } = useData("attempts/" + id);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  if (data.status === "IN_PROGRESS")
    return result ? (
      <>
        <p>Bài làm đang diễn ra.</p>
        {!admin && (
          <Link href={"/lam-bai/" + id} className="btn btn-primary">
            Tiếp tục làm bài
          </Link>
        )}
      </>
    ) : (
      <ExamRunner {...data} />
    );
  return <><ResultView data={data} admin={admin} />{admin && <EssayGrading data={data} />}</>;
}
function EssayGrading({data}) {
  const questions = data.sections.filter(s => s.type === 'ESSAY').flatMap(s => s.questions);
  const [marks, setMarks] = useState(() => Object.fromEntries(questions.map(q => [q.id, {points: data.graded.manualGrades?.[q.id]?.points ?? '', feedback: data.graded.manualGrades?.[q.id]?.feedback || ''}])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!questions.length) return null;
  return <form className="card card-pad mt-6" onSubmit={async e => {
    e.preventDefault(); setSaving(true); setError('');
    const submitted = Object.fromEntries(Object.entries(marks).filter(([,m]) => m.points !== ''));
    try { await api('admin/attempts/'+data.attempt.id+'/grade', {marks: submitted, revision: data.graded.gradingRevision || 0}); go(pathNow()); }
    catch(e) { setError(e.message); } finally {setSaving(false);}
  }}>
    <h2>Chấm phần tự luận</h2><p>Để trống điểm câu chưa chấm. Điểm đã lưu sẽ cập nhật vào kết quả của học sinh.</p>
    <ErrorBox error={error} />
    {questions.map((q,i) => <div className="card card-pad mb-4" key={q.id}>
      <h3>Câu tự luận {i+1}</h3><Rich text={q.content} /><h4>Bài làm học sinh</h4><Rich text={data.answers[q.id+'|'] || '*(chưa trả lời)*'} />
      <div className="field"><label htmlFor={'mark-'+q.id}>Điểm (0 – {data.perQuestion[q.id].maxPoints})</label><input id={'mark-'+q.id} className="input" type="number" min="0" max={data.perQuestion[q.id].maxPoints} step="any" value={marks[q.id].points} onChange={e=>setMarks({...marks,[q.id]:{...marks[q.id],points:e.target.value}})} /></div>
      <div className="field"><label htmlFor={'feedback-'+q.id}>Nhận xét</label><textarea id={'feedback-'+q.id} className="textarea" maxLength={3000} value={marks[q.id].feedback} onChange={e=>setMarks({...marks,[q.id]:{...marks[q.id],feedback:e.target.value}})} /></div>
    </div>)}
    <button className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu điểm tự luận'}</button>
  </form>;
}
function AttemptList({ admin = false }) {
  const { data, error } = useData(admin ? "admin/attempts" : "attempts");
  return (
    <>
      <h1>Kết quả thi</h1>
      <ErrorBox error={error} />
      {data?.length ? (
        <div className="card sc-scroll">
          <table className="sc-table">
            <thead>
              <tr>
                <th>Đề thi</th>
                {admin && <th>Học sinh</th>}
                <th>Bắt đầu</th>
                <th>Điểm</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  {admin && <td>{a.fullName}</td>}
                  <td>{fmtDateTime(a.startedAt)}</td>
                  <td>
                    {a.result
                      ? `${a.result.pending ? "Chờ chấm · " : ""}${fmtScore(a.result.rawScore)} / ${fmtScore(a.result.maxScore)} (${fmtScore(a.result.score)}/10)`
                      : "Đang làm"}
                  </td>
                  <td>
                    <Link
                      href={
                        a.status === "IN_PROGRESS" && !admin
                          ? "/lam-bai/" + a.id
                          : (admin ? "/admin/ket-qua/" : "/hoc-sinh/ket-qua/") +
                            a.id
                      }
                    >
                      {a.status === "IN_PROGRESS"
                        ? admin
                          ? "Đang làm"
                          : "Tiếp tục"
                        : "Xem kết quả"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : data ? (
        <Empty>Chưa có lượt làm bài.</Empty>
      ) : (
        <Loading />
      )}
    </>
  );
}
function Profile() {
  const { push } = useToast();
  const [error, setError] = useState("");
  return (
    <form
      className="card card-pad sc-form"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const r = await api(
            "me",
            Object.fromEntries(new FormData(e.currentTarget)),
          );
          boot.user = r;
          push("Đã lưu hồ sơ.");
        } catch (e) {
          setError(e.message);
        }
      }}
    >
      <h1>Tài khoản</h1>
      <p>{boot.user.email}</p>
      <ErrorBox error={error} />
      {[
        ["fullName", "Họ và tên"],
        ["phone", "Điện thoại"],
        ["grade", "Khối lớp"],
        ["school", "Trường học"],
      ].map(([k, l]) => (
        <Field key={k} label={l}>
          <input
            className="input"
            name={k}
            defaultValue={boot.user[k] || ""}
            required={k === "fullName"}
          />
        </Field>
      ))}
      <button className="btn btn-primary">Lưu thông tin</button>
      <p className="mt-4">
        <a href={boot.resetUrl}>Đặt lại mật khẩu qua email</a>
      </p>
    </form>
  );
}
function AdminList({ kind }) {
  const { data, error, setData } = useData("admin/" + kind);
  const { push } = useToast();
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  return (
    <>
      <div className="page-title">
        <h1>{names[kind]}</h1>
        {["courses", "posts", "exams"].includes(kind) && (
          <Link
            className="btn btn-primary"
            href={"/admin/" + urls[kind] + "/moi"}
          >
            Thêm mới
          </Link>
        )}
      </div>
      {(kind === "students" || kind === "registrations") && <div className="card card-pad mb-4">
        <h3>Đưa học sinh vào danh sách</h3>
        <p>Phiếu đăng ký khóa học dùng để tiếp nhận và theo dõi tư vấn. Chọn “Đã ghi danh” chỉ cập nhật trạng thái phiếu, chưa tạo tài khoản học sinh.</p>
        <ol><li>Gửi học sinh đường dẫn <a href={href('/dang-ky')} target="_blank" rel="noopener noreferrer">sonclass.com/dang-ky</a>.</li><li>Học sinh điền thông tin và tự đặt mật khẩu để tạo tài khoản.</li><li>Tải lại mục Học sinh để thấy tài khoản mới; học sinh có thể đăng nhập, luyện thi và xem kết quả.</li></ol>
        <p className="small muted">Nếu đã có tài khoản, học sinh chỉ cần đăng nhập, không đăng ký lại.</p>
      </div>}
      <ErrorBox error={error || actionError} />
      <div className="sc-controls">
        <input
          className="input"
          placeholder="Tìm kiếm…"
          aria-label="Tìm kiếm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {kind === "registrations" && data?.length > 0 && (
          <button
            className="btn"
            onClick={() => {
              const esc = (v) =>
                '"' +
                String(v ?? "")
                  .replace(/^[=+@-]/, "'$&")
                  .replaceAll('"', '""') +
                '"';
              const rows = [
                [
                  "Họ tên",
                  "Điện thoại",
                  "Email",
                  "Lớp",
                  "Ghi chú",
                  "Trạng thái",
                ],
                ...data.map((r) => [
                  r.fullName,
                  r.phone,
                  r.email,
                  r.currentGrade,
                  r.note,
                  r.status,
                ]),
              ];
              const blob = new Blob(
                ["\ufeff" + rows.map((r) => r.map(esc).join(",")).join("\r\n")],
                { type: "text/csv;charset=utf-8" },
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "dang-ky-sonclass.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Xuất CSV
          </button>
        )}
      </div>
      {!data ? (
        <Loading />
      ) : !data.length ? (
        <Empty>{kind === "students" ? "Chưa có học sinh tạo tài khoản. Gửi đường dẫn đăng ký theo hướng dẫn phía trên." : undefined}</Empty>
      ) : (
        <div className="card sc-scroll">
          <table className="sc-table">
            <thead>
              <tr>
                <th>
                  {kind === "students" || kind === "registrations"
                    ? "Họ tên"
                    : "Tiêu đề"}
                </th>
                <th>Thông tin</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter((x) =>
                  JSON.stringify(x)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((x) => (
                  <tr key={x.id}>
                    <td>{x.title || x.fullName}</td>
                    <td>
                      {kind === "students" || kind === "registrations" ? (
                        <>
                          {x.email}
                          <br />
                          {x.phone} · Lớp {x.grade || x.currentGrade}
                          {x.note && <p>{x.note}</p>}
                        </>
                      ) : (
                        <>
                          Khối {x.grade || "—"}
                          <br />
                          {fmtDateTime(x.updatedAt)}
                        </>
                      )}
                    </td>
                    <td>
                      {kind === "registrations" ? (
                        <select
                          className="select"
                          aria-label={"Trạng thái " + x.fullName}
                          value={x.status}
                          onChange={async (e) => {
                            const status = e.target.value;
                            try {
                              await api("admin/registrations/" + x.id, {
                                status,
                              });
                              setData(
                                data.map((r) =>
                                  r.id === x.id ? { ...r, status } : r,
                                ),
                              );
                              push("Đã cập nhật.");
                            } catch (e) {
                              setActionError(e.message);
                            }
                          }}
                        >
                          {Object.entries(REG_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      ) : kind === "students" ? (
                        x.locked ? (
                          "Đã khóa"
                        ) : (
                          "Hoạt động"
                        )
                      ) : x.status === "PUBLISHED" ? (
                        "Đã công bố"
                      ) : x.status === "ARCHIVED" ? (
                        "Đã lưu trữ"
                      ) : (
                        "Bản nháp"
                      )}
                    </td>
                    <td>
                      {kind === "students" ? (
                        <button
                          className="btn btn-sm"
                          onClick={async () => {
                            try {
                              await api("admin/students/" + x.id, {
                                locked: !x.locked,
                              });
                              setData(
                                data.map((r) =>
                                  r.id === x.id
                                    ? { ...r, locked: !r.locked }
                                    : r,
                                ),
                              );
                            } catch (e) {
                              setActionError(e.message);
                            }
                          }}
                        >
                          {x.locked ? "Mở khóa" : "Khóa"}
                        </button>
                      ) : (
                        kind !== "registrations" && (
                          <div className="row">
                            <Link
                              className="btn btn-sm"
                              href={"/admin/" + urls[kind] + "/" + x.id}
                            >
                              Sửa
                            </Link>
                            {x.status !== "ARCHIVED" && (
                              <button
                                className="btn btn-sm"
                                onClick={async () => {
                                  if (!confirm("Ẩn và lưu trữ nội dung này?"))
                                    return;
                                  try {
                                    await api(
                                      "admin/" + kind + "/" + x.id,
                                      undefined,
                                      "DELETE",
                                    );
                                    setData(
                                      data.map((r) =>
                                        r.id === x.id
                                          ? { ...r, status: "ARCHIVED" }
                                          : r,
                                      ),
                                    );
                                  } catch (e) {
                                    setActionError(e.message);
                                  }
                                }}
                              >
                                Lưu trữ
                              </button>
                            )}
                            {x.status === "ARCHIVED" && (
                              <button
                                className="btn btn-sm"
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      "Xóa vĩnh viễn nội dung đã lưu trữ? Không thể khôi phục.",
                                    )
                                  )
                                    return;
                                  try {
                                    await api(
                                      "admin/" + kind + "/" + x.id + "/purge",
                                      undefined,
                                      "DELETE",
                                    );
                                    setData(data.filter((r) => r.id !== x.id));
                                  } catch (e) {
                                    setActionError(e.message);
                                  }
                                }}
                              >
                                Xóa vĩnh viễn
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
function ContentEditor({ kind, id }) {
  const [data, setData] = useState(
      id === "moi"
        ? {
            title: "",
            slug: "",
            status: "DRAFT",
            grade: "12",
            category: "TAI_LIEU",
            theme: "indigo",
          }
        : null,
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false);
  const { push } = useToast();
  useEffect(() => {
    if (id !== "moi")
      api("admin/" + kind + "/" + id)
        .then(setData)
        .catch((e) => setError(e.message));
  }, [id, kind]);
  if (!data) return error ? <ErrorBox error={error} /> : <Loading />;
  const field = (key, label, multi = false) => (
    <Field key={key} label={label}>
      {multi ? (
        <textarea
          className="textarea"
          value={data[key] || ""}
          onChange={(e) => setData({ ...data, [key]: e.target.value })}
        />
      ) : (
        <input
          className="input"
          value={data[key] || ""}
          onChange={(e) => setData({ ...data, [key]: e.target.value })}
        />
      )}
    </Field>
  );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const payload = { ...data };
          if (!payload.slug) delete payload.slug;
          const r = await api("admin/" + kind, payload);
          push("Đã lưu nội dung.");
          go("/admin/" + urls[kind] + "/" + r.id, true);
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="page-title">
        <h1>
          {id === "moi" ? "Thêm" : "Sửa"}{" "}
          {kind === "courses" ? "khóa học" : "bài viết"}
        </h1>
        <Link className="btn" href={"/admin/" + urls[kind]}>
          Quay lại
        </Link>
      </div>
      <ErrorBox error={error} />
      <div className="sc-editor-layout">
        <div className="card card-pad">
          {field("title", "Tiêu đề")}
          {field("slug", "Đường dẫn (để trống để tạo từ tiêu đề)")}
          {field(
            kind === "courses" ? "summary" : "excerpt",
            "Mô tả ngắn",
            true,
          )}
          <MathField
            id="content-editor"
            label={
              kind === "courses" ? "Giới thiệu khóa học" : "Nội dung bài viết"
            }
            rows={12}
            value={data[kind === "courses" ? "description" : "content"] || ""}
            onChange={(v) =>
              setData({
                ...data,
                [kind === "courses" ? "description" : "content"]: v,
              })
            }
            onUploadStateChange={(_, v) => setUploading(v)}
          />
          <p className="field-hint">
            Hỗ trợ Markdown: ## tiêu đề, **in đậm**, danh sách và công thức
            LaTeX.
          </p>
          {kind === "courses" && (
            <>
              {field("audience", "Đối tượng học")}
              {field("duration", "Thời lượng")}
              {field("schedule", "Lịch học")}
              {field("tuition", "Học phí")}
              {field("syllabus", "Nội dung / chuyên đề", true)}
              {field("teacherName", "Giáo viên")}
              {field("teacherBio", "Giới thiệu giáo viên", true)}
            </>
          )}
          <h3>Xem trước nội dung</h3>
          <Prose text={data.description || data.content || ""} />
        </div>
        <aside className="stack">
          <div className="card card-pad">
            <Field label="Trạng thái">
              <select
                className="select"
                value={data.status === "ARCHIVED" ? "DRAFT" : data.status}
                onChange={(e) => setData({ ...data, status: e.target.value })}
              >
                <option value="DRAFT">Bản nháp</option>
                <option value="PUBLISHED">Công bố</option>
              </select>
            </Field>
            {kind === "courses" ? (
              <>
                <Field label="Khối lớp">
                  <select
                    className="select"
                    value={data.grade}
                    onChange={(e) =>
                      setData({ ...data, grade: e.target.value })
                    }
                  >
                    {["10", "11", "12"].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </Field>
                <label>
                  <input
                    type="checkbox"
                    checked={!!data.featured}
                    onChange={(e) =>
                      setData({ ...data, featured: e.target.checked })
                    }
                  />{" "}
                  Khóa học nổi bật
                </label>
              </>
            ) : (
              <Field label="Chuyên mục">
                <select
                  className="select"
                  value={data.category}
                  onChange={(e) =>
                    setData({ ...data, category: e.target.value })
                  }
                >
                  {Object.entries(CATEGORY_LABEL).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
          <div className="card card-pad">
            <MediaInput
              value={data.coverUrl || ""}
              label="Ảnh bìa"
              accept="image/*"
              onChange={(v) => setData({ ...data, coverUrl: v })}
              onBusy={setUploading}
            />
            {field("videoUrl", "Link video YouTube/Vimeo hoặc MP4")}
            {kind === "posts" && (
              <MediaInput
                label="Tài liệu PDF"
                accept="application/pdf"
                value={data.pdfUrl || ""}
                onChange={(v) => setData({ ...data, pdfUrl: v })}
                onBusy={setUploading}
              />
            )}
          </div>
          <button disabled={busy || uploading} className="btn btn-primary">
            {busy ? "Đang lưu…" : uploading ? "Đang tải tệp…" : "Lưu nội dung"}
          </button>
        </aside>
      </div>
    </form>
  );
}
function MediaInput({ label, value, onChange, accept, onBusy }) {
  const [error, setError] = useState("");
  return (
    <Field label={label}>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
      />
      <input
        type="file"
        accept={accept}
        onChange={async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          onBusy(true);
          try {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch("/api/upload", {
              method: "POST",
              body: form,
            });
            const r = await res.json();
            if (!res.ok) throw new Error(r.message || "Không tải được tệp.");
            onChange(r.url);
            setError("");
          } catch (e) {
            setError(e.message);
          } finally {
            onBusy(false);
          }
        }}
      />
      <span className="field-hint">Giới hạn hosting hiện tại: 2 MB/tệp.</span>
      <ErrorBox error={error} />
    </Field>
  );
}
function ExamEditor({ id }) {
  const { data, error } = useData(
    "admin/exams" + (id === "moi" ? "" : "/" + id),
  );
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const initial =
    id === "moi"
      ? blankExam()
      : { ...data, status: data.status === "ARCHIVED" ? "DRAFT" : data.status };
  return (
    <ExamBuilder allowEssay initial={initial} attemptCount={data.attemptCount || 0} />
  );
}
function Settings() {
  const { data, error } = useData("admin/settings");
  const [err, setErr] = useState(""),
    [busy, setBusy] = useState(false);
  const { push } = useToast();
  if (!data) return error ? <ErrorBox error={error} /> : <Loading />;
  const labels = {
    siteName: "Tên trung tâm",
    tagline: "Dòng giới thiệu",
    hotline: "Điện thoại",
    email: "Email",
    address: "Địa chỉ",
    openHours: "Giờ hoạt động",
    facebook: "Facebook",
    zalo: "Zalo",
  };
  return (
    <form
      className="card card-pad sc-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const values = Object.fromEntries(new FormData(e.currentTarget));
          await api("admin/settings", values);
          boot.settings = values;
          push("Đã lưu thiết lập.");
        } catch (e) {
          setErr(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1>Thiết lập website</h1>
      <ErrorBox error={err} />
      {Object.entries(labels).map(([k, l]) => (
        <Field key={k} label={l}>
          <input
            className="input"
            name={k}
            defaultValue={data.settings[k] || ""}
            required={k === "siteName"}
          />
        </Field>
      ))}
      <button className="btn btn-primary" disabled={busy}>
        Lưu thiết lập
      </button>
    </form>
  );
}
function AdminDashboard() {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all(
      [
        "exams",
        "courses",
        "posts",
        "students",
        "registrations",
        "attempts",
      ].map((k) => api("admin/" + k)),
    )
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <h1>Tổng quan</h1>
      <ErrorBox error={error} />
      {data ? (
        <div className="grid c3">
          {[
            "exams",
            "courses",
            "posts",
            "students",
            "registrations",
            "attempts",
          ].map((k, i) => (
            <Link key={k} className="card card-pad" href={"/admin/" + urls[k]}>
              <h2>{data[i].length}</h2>
              <p>{names[k]}</p>
            </Link>
          ))}
        </div>
      ) : (
        <Loading />
      )}
      <div className="sc-alert">
        Tạo khóa học, bài viết và đề thi trong menu bên trái. Đề chỉ hiển thị
        cho học sinh sau khi được công bố.
      </div>
    </>
  );
}
function StudentDashboard({ catalog }) {
  return (
    <>
      <h1>Chào {boot.user.fullName}</h1>
      <p>Chọn một đề thi để bắt đầu luyện tập.</p>
      <Catalog kind="exams" catalog={catalog} />
    </>
  );
}
function Page({ catalog }) {
  const route = pathNow().split("?")[0],
    parts = route.split("/").filter(Boolean);
  if (route === "/") return <HomeView />;
  if (route === "/dang-nhap" || route === "/dang-ky")
    return <Auth register={route === "/dang-ky"} />;
  if (route === "/quen-mat-khau")
    return (
      <div className="sc-page">
        <h1>Khôi phục tài khoản</h1>
        <a className="btn btn-primary" href={boot.resetUrl}>
          Gửi email đặt lại mật khẩu
        </a>
      </div>
    );
  if (route === "/dang-ky-khoa-hoc") return <Registration catalog={catalog} />;
  if (parts[0] === "khoa-hoc" || parts[0] === "bai-viet") {
    const kind = parts[0] === "khoa-hoc" ? "courses" : "posts";
    return parts[1] ? (
      <Detail
        kind={kind}
        item={catalog[kind].find(
          (c) => c.slug === decodeURIComponent(parts[1]) || c.id === parts[1],
        )}
      />
    ) : (
      <Catalog kind={kind} catalog={catalog} />
    );
  }
  if (route === "/de-thi") return <Catalog kind="exams" catalog={catalog} />;
  if (["admin", "hoc-sinh", "lam-bai"].includes(parts[0])) {
    if (!boot.user) return <Auth />;
    if (parts[0] === "admin" && boot.user.role !== "ADMIN")
      return <Empty>Bạn không có quyền quản trị.</Empty>;
    if (parts[0] === "lam-bai") return <Attempt id={parts[1]} />;
    if (parts[0] === "admin") {
      const kind = Object.keys(urls).find((k) => urls[k] === parts[1]);
      let content;
      if (!parts[1]) content = <AdminDashboard />;
      else if (kind === "settings") content = <Settings />;
      else if (kind === "attempts")
        content = parts[2] ? (
          <Attempt id={parts[2]} result admin />
        ) : (
          <AttemptList admin />
        );
      else if (kind === "exams" && parts[2])
        content = <ExamEditor id={parts[2]} />;
      else if (["courses", "posts"].includes(kind) && parts[2])
        content = <ContentEditor kind={kind} id={parts[2]} />;
      else if (kind) content = <AdminList kind={kind} />;
      else content = <Empty>Không tìm thấy trang.</Empty>;
      return <Shell admin>{content}</Shell>;
    }
    return (
      <Shell>
        {parts[1] === "tai-khoan" ? (
          <Profile />
        ) : parts[1] === "ket-qua" ? (
          parts[2] ? (
            <Attempt id={parts[2]} result />
          ) : (
            <AttemptList />
          )
        ) : parts[1] === "luyen-thi" ? (
          parts[2] ? (
            <ExamIntro exam={catalog.exams.find((e) => e.id === parts[2])} />
          ) : (
            <Catalog kind="exams" catalog={catalog} />
          )
        ) : (
          <StudentDashboard catalog={catalog} />
        )}
      </Shell>
    );
  }
  return (
    <div className="sc-page">
      <h1>Không tìm thấy trang</h1>
      <Link href="/">Về trang chủ</Link>
    </div>
  );
}
function HomeView() {
  const [view, setView] = useState(null);
  useEffect(() => {
    let active = true;
    Home().then((v) => {
      if (active) setView(v);
    });
    return () => {
      active = false;
    };
  }, []);
  return view || <Loading />;
}
class Boundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="sc-page">
        <h1>Không thể hiển thị trang</h1>
        <button className="btn" onClick={() => location.reload()}>
          Tải lại
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const [tick, setTick] = useState(0),
    [catalog, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    const change = () => setTick((t) => t + 1);
    window.addEventListener("popstate", change);
    window.addEventListener("sc:navigate", change);
    return () => {
      window.removeEventListener("popstate", change);
      window.removeEventListener("sc:navigate", change);
    };
  }, []);
  useEffect(() => {
    let active = true;
    api("catalog")
      .then((d) => {
        if (active) {
          setCatalog(d);
          setData(d);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [tick]);
  const route = pathNow().split("?")[0],
    privatePage = /^\/(admin|hoc-sinh|lam-bai)(\/|$)/.test(route) && boot.user;
  return (
    <ToastProvider>
      <div className={!privatePage ? "public-site" : undefined}>
      {boot.preview && (
        <div className="sc-preview-notice">
          Bản kiểm thử riêng cho quản trị viên — chưa thay website đang chạy
        </div>
      )}
      {!privatePage && (
        <SiteHeader
          user={boot.user}
          logoUrl={boot.assets + "images/sonclass-logo.png"}
          siteName={boot.settings.siteName}
          tagline={boot.settings.tagline}
          onLogout={logout}
        />
      )}
      <Boundary key={tick}>
        {error ? (
          <ErrorBox error={error} />
        ) : catalog ? (
          <Page key={tick} catalog={catalog} />
        ) : (
          <Loading />
        )}
      </Boundary>
      {!privatePage && (
        <Footer s={boot.settings} />
      )}
      </div>
    </ToastProvider>
  );
}
createRoot(document.getElementById("root")).render(<App />);
