import assert from "node:assert/strict";
import { Client } from "./http-client.mjs";
const admin = new Client();
await admin.load();
await admin.api("auth/login", { email: "admin", password: "password" });
await admin.load();
assert.equal(admin.boot.user.role, "ADMIN");
const exam = {
  title: "Kiểm thử " + Date.now(),
  template: "FULL",
  grade: "12",
  status: "PUBLISHED",
  durationMinutes: 90,
  shuffleQuestions: false,
  sectionSettings: Object.fromEntries(
    ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"].map((type) => [
      type,
      { pointsPerQuestion: 2, tfScoring: "TIERED" },
    ]),
  ),
  sections: {
    MULTIPLE_CHOICE: [
      {
        content: "$x^2=0$",
        explanation: "Đáp án bí mật",
        options: ["0", "1", "2", "3"].map((content, i) => ({
          content,
          isCorrect: i === 0,
        })),
      },
    ],
    TRUE_FALSE: [
      {
        content: "Đúng sai",
        statements: [true, false, true, false].map((isTrue, i) => ({
          content: String(i),
          isTrue,
        })),
      },
    ],
    SHORT_ANSWER: [{ content: "Một nửa", answers: ["0.5"] }],
  },
};
const saved = await admin.api("admin/exams", exam);
assert.equal((await admin.api("admin/exams/" + saved.id)).attemptCount, 0);
const student = new Client();
await student.load();
await student.api("admin/exams", undefined, 403);
await student.api("attempts", undefined, 401);
await student.api("auth/register", {
  email: `test-${Date.now()}@example.invalid`,
  fullName: "Học sinh kiểm thử",
  password: "LocalTestOnly123!",
});
await student.load();
assert.equal(student.boot.user.role, "STUDENT");
await student.api("admin/exams", undefined, 403);
const cat = await student.api("catalog");
assert.ok(
  !JSON.stringify(cat.exams).match(
    /isCorrect|isTrue|shortAnswers|Đáp án bí mật/,
  ),
);
const attempt = await student.api("attempts/start", { examId: saved.id });
assert.equal(
  (await student.api("attempts/start", { examId: saved.id })).id,
  attempt.id,
);
const running = await student.api("attempts/" + attempt.id);
assert.equal(running.status, "IN_PROGRESS");
assert.ok(
  !JSON.stringify(running).match(/isCorrect|isTrue|shortAnswers|Đáp án bí mật/),
);
await student.api(
  `attempts/${attempt.id}/answers`,
  { answers: { "foreign|": "A" } },
  400,
);
const answers = {
  "MULTIPLE_CHOICE-0|": "A",
  "SHORT_ANSWER-0|": "0,50",
  ...Object.fromEntries(
    [true, false, true, false].map((x, i) => [
      `TRUE_FALSE-0|${"abcd"[i]}`,
      x ? "T" : "F",
    ]),
  ),
};
await student.api(`attempts/${attempt.id}/answers`, { answers });
exam.sections.SHORT_ANSWER[0].answers = ["99"];
await admin.api("admin/exams", { ...exam, id: saved.id });
await student.api(`attempts/${attempt.id}/submit`, {});
const result = await student.api("attempts/" + attempt.id);
assert.equal(result.graded.score, 10);
assert.equal(result.status, "SUBMITTED");
await student.api(`attempts/${attempt.id}/submit`, {});
assert.deepEqual(await student.api("attempts/" + attempt.id), result);
await student.api(`attempts/${attempt.id}/answers`, { answers }, 409);
assert.equal((await admin.api("admin/exams/" + saved.id)).attemptCount, 1);
await admin.api("admin/exams/" + saved.id, undefined, 200, "DELETE");
await admin.api("admin/exams/" + saved.id + "/purge", undefined, 400, "DELETE");
const disposable = await admin.api("admin/posts", {
  title: "Disposable " + Date.now(),
  status: "DRAFT",
});
await admin.api(
  "admin/posts/" + disposable.id + "/purge",
  undefined,
  400,
  "DELETE",
);
await admin.api("admin/posts/" + disposable.id, undefined, 200, "DELETE");
await admin.api(
  "admin/posts/" + disposable.id + "/purge",
  undefined,
  200,
  "DELETE",
);
await admin.api("admin/posts/" + disposable.id, undefined, 404);
const other = new Client();
await other.load();
await other.api("auth/register", {
  email: `other-${Date.now()}@example.invalid`,
  fullName: "Học sinh khác",
  password: "LocalTestOnly123!",
});
await other.load();
await other.api("attempts/" + attempt.id, undefined, 404);
await admin.api(`attempts/${attempt.id}/submit`, {}, 403);
const course = await admin.api("admin/courses", {
  title: "Khóa kiểm thử " + Date.now(),
  status: "PUBLISHED",
  grade: "12",
  description: "$x^2$",
});
await student.api("registrations", {
  fullName: "Học sinh kiểm thử",
  phone: "0900000000",
  email: "test@example.invalid",
  currentGrade: "12",
  courseId: course.id,
});
assert.ok((await admin.api("admin/registrations")).length);
await admin.api("admin/students/" + student.boot.user.id, { locked: true });
await student.api("attempts", undefined, 403);
console.log(
  "HTTP integration passed: roles, registration, exam CRUD, answer secrecy, scoring, immutable snapshot, idempotency, ownership, account locking.",
);
