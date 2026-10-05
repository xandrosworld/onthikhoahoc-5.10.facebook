// Các hàm tiện ích dùng chung (server + client)

export const SECTION_TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'];
export const SECTION_META = {
  MULTIPLE_CHOICE: { roman: 'I', title: 'Phần I', name: 'Trắc nghiệm nhiều phương án', hint: 'Chọn một đáp án đúng nhất.' },
  TRUE_FALSE: { roman: 'II', title: 'Phần II', name: 'Trắc nghiệm đúng / sai', hint: 'Chọn Đúng hoặc Sai cho từng mệnh đề.' },
  SHORT_ANSWER: { roman: 'III', title: 'Phần III', name: 'Trả lời ngắn', hint: 'Nhập đáp án (số hoặc biểu thức ngắn).' },
};

export const CATEGORY_LABEL = {
  TAI_LIEU: 'Tài liệu',
  KINH_NGHIEM: 'Kinh nghiệm ôn thi',
  THONG_BAO: 'Thông báo',
  VIDEO: 'Video bài giảng',
};

export const REG_STATUS = {
  NEW: { label: 'Mới', tone: 'info' },
  CONTACTED: { label: 'Đã liên hệ', tone: 'warning' },
  ENROLLED: { label: 'Đã ghi danh', tone: 'success' },
  CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
};

export function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'muc';
}

const dtf = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
const dtft = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
export const fmtDate = (d) => (d ? dtf.format(new Date(d)) : '—');
export const fmtDateTime = (d) => (d ? dtft.format(new Date(d)) : '—');

export function fmtDuration(sec) {
  sec = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h} giờ ${m} phút`;
  if (m > 0) return `${m} phút ${String(s).padStart(2, '0')} giây`;
  return `${s} giây`;
}

export function fmtScore(n) {
  return (Math.round(n * 100) / 100).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function scoreTone(score) {
  if (score >= 8) return 'success';
  if (score >= 5) return 'warning';
  return 'danger';
}

export function parseJSON(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function cx(...a) {
  return a.filter(Boolean).join(' ');
}

export function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] || '?').toUpperCase();
}

export function youtubeEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return `https://www.youtube-nocookie.com/embed/${u.pathname.split('/')[2]}`;
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return `https://player.vimeo.com/video/${id}`;
    }
  } catch {}
  return null;
}

/** Văn bản dạng:  "Tên chuyên đề\n- mục 1\n- mục 2\n\nChuyên đề 2 ..." ⇄ JSON [{title, items}] */
export function parseSyllabusText(text) {
  const mods = [];
  let cur = null;
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line) { cur = null; continue; }
    if (/^[-•*]\s+/.test(line)) {
      if (!cur) { cur = { title: 'Nội dung', items: [] }; mods.push(cur); }
      cur.items.push(line.replace(/^[-•*]\s+/, ''));
    } else {
      cur = { title: line, items: [] };
      mods.push(cur);
    }
  }
  return mods;
}

export function syllabusToText(json) {
  return parseJSON(json, []).map((m) => [m.title, ...(m.items || []).map((i) => `- ${i}`)].join('\n')).join('\n\n');
}
