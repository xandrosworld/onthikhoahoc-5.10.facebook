export const EXAM_TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'];
export const EXAM_TEMPLATES = [
  { id: 'MC', name: 'Mẫu 1', description: 'Trắc nghiệm A, B, C, D', types: EXAM_TYPES.slice(0, 1) },
  { id: 'MC_TF', name: 'Mẫu 2', description: 'A, B, C, D + Đúng / Sai', types: EXAM_TYPES.slice(0, 2) },
  { id: 'FULL', name: 'Mẫu 3', description: 'A, B, C, D + Đúng / Sai + Trả lời ngắn', types: EXAM_TYPES },
];
export const DEFAULT_POINTS = { MULTIPLE_CHOICE: 0.25, TRUE_FALSE: 1, SHORT_ANSWER: 0.5 };
export const SECTION_WEIGHT = { MULTIPLE_CHOICE: 3, TRUE_FALSE: 4, SHORT_ANSWER: 3 };
export const templateTypes = template => (EXAM_TEMPLATES.find(t => t.id === template) || EXAM_TEMPLATES[2]).types;
export const validPoints = value => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 100;
export const formatPoints = value => Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 4 });

/** Null scores preserve the old 3/4/3 allocation until the teacher changes them. */
export function questionPoints(sections, section, question) {
  if (validPoints(question.points)) return Number(question.points);
  if (validPoints(section.pointsPerQuestion)) return Number(section.pointsPerQuestion);
  const weight = sections.reduce((sum, s) => sum + (s.questions.length ? SECTION_WEIGHT[s.type] : 0), 0);
  return weight && section.questions.length ? 10 * SECTION_WEIGHT[section.type] / weight / section.questions.length : 0;
}

export function examPointSummary(sections) {
  return sections.map(section => ({ type: section.type, maxPoints: section.questions.reduce((sum, q) => sum + questionPoints(sections, section, q), 0) }));
}

export function validateExamConfig(payload) {
  if (!EXAM_TEMPLATES.some(t => t.id === payload.template)) return 'Vui lòng chọn mẫu đề hợp lệ.';
  for (const type of templateTypes(payload.template)) {
    const config = payload.sectionSettings?.[type];
    if (!config || (config.pointsPerQuestion != null && !validPoints(config.pointsPerQuestion))) return 'Điểm mỗi câu phải lớn hơn 0 và không quá 100.';
    if (!['TIERED', 'EQUAL'].includes(config.tfScoring)) return 'Cách chấm Đúng / Sai không hợp lệ.';
    for (const q of payload.sections?.[type] || []) {
      if (q.points != null && !validPoints(q.points)) return 'Điểm riêng của câu hỏi phải lớn hơn 0 và không quá 100.';
    }
  }
  return null;
}
