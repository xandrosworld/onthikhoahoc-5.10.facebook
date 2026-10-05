import { db } from './db';

export const DEFAULT_SETTINGS = {
  siteName: 'Toán Tư Duy',
  tagline: 'Trung tâm Toán học',
  hotline: '0901 234 567',
  email: 'lienhe@toantuduy.vn',
  address: '25 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh',
  openHours: 'Thứ 2 – Chủ nhật: 8:00 – 20:30',
  facebook: '',
  zalo: '',
};

export async function getSettings() {
  try {
    const rows = await db.setting.findMany();
    const s = { ...DEFAULT_SETTINGS };
    for (const r of rows) s[r.key] = r.value;
    return s;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export { GRADES } from './constants';
