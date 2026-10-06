import { SECTION_TYPES } from './utils.js';
import { questionPoints } from './exam-config.js';

/** Trọng số điểm mỗi phần theo cấu trúc đề THPT (3 / 4 / 3 trên thang 10). Chuẩn hoá theo các phần thực sự có câu hỏi. */
export const SECTION_WEIGHT = { MULTIPLE_CHOICE: 3, TRUE_FALSE: 4, SHORT_ANSWER: 3 };
/** Phần II: số ý đúng trong một câu (4 ý) → tỉ lệ điểm của câu. */
const TF_TIER = [0, 0.1, 0.25, 0.5, 1];

export function normalizeShort(s) {
  return String(s ?? '')
    .normalize('NFC')
    .replace(/\$/g, '')
    .replace(/[\s\u00a0]+/g, '')
    .replace(/,/g, '.')
    .replace(/^\+/, '')
    .toLowerCase();
}

function asNumber(n) {
  if (!/^-?\d+(\.\d+)?$/.test(n)) return null;
  return Number(n);
}

export function shortMatches(input, accepted) {
  const a = normalizeShort(input);
  if (!a) return false;
  const an = asNumber(a);
  return accepted.some((x) => {
    const b = normalizeShort(x);
    if (b === a) return true;
    const bn = asNumber(b);
    return an !== null && bn !== null && Math.abs(an - bn) < 1e-9;
  });
}

/** Fisher–Yates với crypto random */
export function shuffle(arr) {
  const a = [...arr];
  const rnd = (n) => {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] % n;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Chấm bài.
 * sections: [{ type, questions: [{id, options, statements, shortAnswers}] }]
 * answers: Map-like object { "questionId|sub": value }
 */
export function gradeAttempt(sections, answers, durationSec = 0) {
  const get = (qid, sub = '') => answers[`${qid}|${sub}`];
  const perQuestion = {};
  const breakdown = [];

  let score = 0, correct = 0, wrong = 0, unanswered = 0, totalUnits = 0;

  for (const type of SECTION_TYPES) {
    const s = sections.find((x) => x.type === type);
    const qs = s?.questions || [];
    const b = { type, questions: qs.length, units: 0, correct: 0, wrong: 0, unanswered: 0, fraction: 0, points: 0, maxPoints: 0 };
    let frac = 0;
    for (const q of qs) {
      const before = frac;
      const maxPoints = questionPoints(sections, s, q);
      if (type === 'MULTIPLE_CHOICE') {
        const right = q.options.find((o) => o.isCorrect)?.label;
        const v = get(q.id);
        b.units += 1;
        if (!v) { b.unanswered++; perQuestion[q.id] = { status: 'blank' }; }
        else if (v === right) { b.correct++; frac += 1; perQuestion[q.id] = { status: 'correct' }; }
        else { b.wrong++; perQuestion[q.id] = { status: 'wrong' }; }
      } else if (type === 'TRUE_FALSE') {
        let k = 0, n = q.statements.length;
        const subs = {};
        let any = false;
        for (const st of q.statements) {
          const v = get(q.id, st.label);
          b.units += 1;
          if (!v) { b.unanswered++; subs[st.label] = 'blank'; continue; }
          any = true;
          if ((v === 'T') === st.isTrue) { b.correct++; k++; subs[st.label] = 'correct'; }
          else { b.wrong++; subs[st.label] = 'wrong'; }
        }
        frac += n === 4 && s.tfScoring !== 'EQUAL' ? TF_TIER[k] : n ? k / n : 0;
        perQuestion[q.id] = { status: !any ? 'blank' : k === n ? 'correct' : k === 0 ? 'wrong' : 'partial', subs, k, n };
      } else {
        const accepted = q.shortAnswers.map((a) => a.answer);
        const v = get(q.id);
        b.units += 1;
        if (!v || !String(v).trim()) { b.unanswered++; perQuestion[q.id] = { status: 'blank' }; }
        else if (shortMatches(v, accepted)) { b.correct++; frac += 1; perQuestion[q.id] = { status: 'correct' }; }
        else { b.wrong++; perQuestion[q.id] = { status: 'wrong' }; }
      }
      perQuestion[q.id].maxPoints = maxPoints;
      perQuestion[q.id].points = (frac - before) * maxPoints;
      b.maxPoints += maxPoints;
      b.points += perQuestion[q.id].points;
    }
    if (qs.length) {
      b.fraction = b.maxPoints ? b.points / b.maxPoints : 0;
      score += b.points;
    }
    correct += b.correct; wrong += b.wrong; unanswered += b.unanswered; totalUnits += b.units;
    breakdown.push(b);
  }

  const maxScore = breakdown.reduce((sum, b) => sum + b.maxPoints, 0);
  return {
    score: maxScore ? Math.round(score / maxScore * 1000) / 100 : 0,
    rawScore: Math.round(score * 10000) / 10000,
    maxScore: Math.round(maxScore * 10000) / 10000,
    totalUnits, correct, wrong, unanswered,
    durationSec, breakdown, perQuestion,
  };
}
