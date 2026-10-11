import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PHP } from "@php-wasm/universal";
import { loadNodeRuntime } from "@php-wasm/node";
import { gradeAttempt } from "../../src/lib/grading.js";
const php = new PHP(
  await loadNodeRuntime("8.3", { emscriptenOptions: { processId: 1 } }),
);
const domain = await fs.readFile("sonclass/includes/domain.php", "utf8");
php.writeFile("/domain.php", domain);
for (const file of [
  "sonclass.php",
  "includes/api.php",
  "includes/domain.php",
  "includes/deployment.php",
]) {
  const source = await fs.readFile("sonclass/" + file, "utf8");
  const lint = await php.run({
    code: `<?php token_get_all(base64_decode('${Buffer.from(source).toString("base64")}'), TOKEN_PARSE); echo 'OK';`,
  });
  assert.equal(lint.text, "OK", file + ": " + lint.errors);
}
const exam = {
  title: "Đề kiểm thử",
  template: "FULL",
  grade: "12",
  status: "PUBLISHED",
  durationMinutes: 90,
  shuffleQuestions: false,
  sectionSettings: {
    MULTIPLE_CHOICE: { pointsPerQuestion: 2, tfScoring: "TIERED" },
    TRUE_FALSE: { pointsPerQuestion: 4, tfScoring: "TIERED" },
    SHORT_ANSWER: { pointsPerQuestion: 3, tfScoring: "TIERED" },
  },
  sections: {
    MULTIPLE_CHOICE: [
      {
        content: "$x^2$",
        explanation: "Bình phương",
        options: "ABCD"
          .split("")
          .map((x, i) => ({ content: x, isCorrect: i === 0 })),
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
    SHORT_ANSWER: [{ content: "Số thập phân", answers: ["0,5"] }],
  },
};
async function call(code) {
  const r = await php.run({
    code: `<?php require_once '/domain.php'; ${code}`,
  });
  assert.equal(r.errors, "");
  return JSON.parse(r.text);
}
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64");
const sections = await call(
  `$e=json_decode(base64_decode('${b64(exam)}'),true); if(sc_validate_exam($e)) throw new Exception(sc_validate_exam($e)); echo json_encode(sc_snapshot($e));`,
);
let cases = 0;
for (const rule of ["TIERED", "EQUAL"])
  for (let k = 0; k <= 4; k++)
    for (const short of ["0,50", "0.5", "", "1/2", "wrong"]) {
      sections[1].tfScoring = rule;
      const answers = {
        "MULTIPLE_CHOICE-0|": k % 2 ? "B" : "A",
        "SHORT_ANSWER-0|": short,
      };
      [true, false, true, false].forEach((v, i) => {
        answers["TRUE_FALSE-0|" + "abcd"[i]] = (i < k ? v : !v) ? "T" : "F";
      });
      const actual = await call(
        `echo json_encode(sc_grade(json_decode(base64_decode('${b64(sections)}'),true),json_decode(base64_decode('${b64(answers)}'),true),60));`,
      );
      const expected = gradeAttempt(sections, answers, 60);
      assert.equal(actual.pending, 0);
      assert.deepEqual(actual.manualGrades, []);
      delete actual.pending; delete actual.manualGrades;
      actual.breakdown.forEach(b => {assert.equal(b.pending, 0); delete b.pending;});
      assert.deepEqual(actual, expected, JSON.stringify({ rule, k, short }));
      cases++;
    }
const publicSections = await call(
  `echo json_encode(sc_public_sections(json_decode(base64_decode('${b64(sections)}'),true)));`,
);
assert.ok(
  !JSON.stringify(publicSections).match(
    /isCorrect|isTrue|shortAnswers|explanation/,
  ),
);
const rejected = await call(
  `try{sc_clean_answers(json_decode(base64_decode('${b64(sections)}'),true),['foreign|'=>'A']);echo 'false';}catch(InvalidArgumentException $e){echo 'true';}`,
);
assert.equal(rejected, true);
const badExam = { ...exam, durationMinutes: 0 };
assert.ok(
  await call(
    `echo json_encode(sc_validate_exam(json_decode(base64_decode('${b64(badExam)}'),true)));`,
  ),
);
console.log(
  `${cases} PHP/JavaScript grading parity cases passed; answer secrecy, input rejection and PHP syntax passed.`,
);
php.exit();
