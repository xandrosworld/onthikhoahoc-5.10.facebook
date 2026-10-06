import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeUpload } from '@/lib/uploads';

export const runtime = 'nodejs';

const RULES = {
  IMAGE: { max: 5 * 1024 * 1024, mimes: { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }, label: 'Ảnh (JPG, PNG, WEBP, GIF) tối đa 5MB' },
  PDF: { max: 20 * 1024 * 1024, mimes: { 'application/pdf': '.pdf' }, label: 'PDF tối đa 20MB' },
  VIDEO: { max: 80 * 1024 * 1024, mimes: { 'video/mp4': '.mp4', 'video/webm': '.webm' }, label: 'Video MP4/WEBM tối đa 80MB' },
};

export async function POST(req) {
  const user = await apiUser();
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 });
  let form;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: 'Dữ liệu tải lên không hợp lệ.' }, { status: 400 }); }
  const file = form.get('file');
  const kind = String(form.get('kind') || '');
  const rule = RULES[kind];
  if (!rule || !file || typeof file === 'string') return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  const ext = rule.mimes[file.type];
  if (!ext) return NextResponse.json({ error: `Định dạng không được hỗ trợ. ${rule.label}.` }, { status: 415 });
  if (file.size > rule.max) return NextResponse.json({ error: `Tệp quá lớn. ${rule.label}.` }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  // kiểm tra chữ ký tệp cơ bản
  const head = buf.subarray(0, 12).toString('latin1');
  const okSig = kind === 'PDF' ? head.startsWith('%PDF') : kind === 'IMAGE' ? /^(\xFF\xD8\xFF|\x89PNG|GIF8|RIFF)/.test(head) : kind === 'VIDEO' ? (head.includes('ftyp') || buf[0] === 0x1a) : true;
  if (!okSig) return NextResponse.json({ error: 'Nội dung tệp không khớp định dạng.' }, { status: 415 });
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  await writeUpload(filename, buf);
  await db.media.create({ data: { filename, original: String(file.name).slice(0, 200), mime: file.type, size: file.size, kind } });
  return NextResponse.json({ url: `/api/files/${filename}`, name: file.name, size: file.size });
}
