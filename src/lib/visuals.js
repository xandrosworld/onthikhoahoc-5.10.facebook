export const VISUALS = {
  hero: '/images/hero-study.webp',
  classroom: '/images/classroom-learning.webp',
  foundations: '/images/math-foundations.webp',
  functions: '/images/math-functions.webp',
  calculus: '/images/math-calculus.webp',
  study: '/images/study-desk.webp',
  library: '/images/learning-library.webp',
};

export function courseCover(course) {
  if (course.coverUrl) return course.coverUrl;
  if (/cap-toc|cấp tốc/i.test(`${course.slug} ${course.summary} ${course.description}`)) return VISUALS.study;
  return { 10: VISUALS.foundations, 11: VISUALS.functions, 12: VISUALS.calculus }[course.grade] || VISUALS.library;
}

export function postCover(post) {
  if (post.coverUrl) return post.coverUrl;
  if (post.category === 'THONG_BAO') return VISUALS.classroom;
  if (post.category === 'VIDEO') return VISUALS.functions;
  if (/tích phân|nguyên hàm/i.test(post.title)) return VISUALS.calculus;
  if (/đạo hàm|hàm số/i.test(post.title)) return VISUALS.functions;
  if (post.category === 'KINH_NGHIEM') return VISUALS.study;
  return VISUALS.library;
}
