import assert from "node:assert/strict";
import { Client } from "./http-client.mjs";
const admin = new Client();
await admin.load();
await admin.api("auth/login", { email: "admin", password: "password" });
await admin.load();
const exam = {
  title: "Deadline " + Date.now(),
  template: "MC",
  grade: "12",
  status: "PUBLISHED",
  durationMinutes: 1,
  shuffleQuestions: false,
  sectionSettings: {
    MULTIPLE_CHOICE: { pointsPerQuestion: 2, tfScoring: "TIERED" },
  },
  sections: {
    MULTIPLE_CHOICE: [
      {
        content: "0 + 0",
        options: ["0", "1", "2", "3"].map((content, i) => ({
          content,
          isCorrect: i === 0,
        })),
      },
    ],
  },
};
const saved = await admin.api("admin/exams", exam);
const attempt = await admin.api("attempts/start", { examId: saved.id });
await admin.api(`attempts/${attempt.id}/answers`, {
  answers: { "MULTIPLE_CHOICE-0|": "A" },
});
console.log("Waiting for the server deadline.");
await new Promise((resolve) => setTimeout(resolve, 61000));
await admin.api(
  `attempts/${attempt.id}/answers`,
  { answers: { "MULTIPLE_CHOICE-0|": "B" } },
  409,
);
const result = await admin.api("attempts/" + attempt.id);
assert.equal(result.status, "EXPIRED");
assert.equal(result.graded.score, 10);
assert.equal(result.answers["MULTIPLE_CHOICE-0|"], "A");
assert.equal(result.graded.durationSec, 60);
console.log(
  "Deadline test passed: server expiry grades saved answers and rejects late changes.",
);
