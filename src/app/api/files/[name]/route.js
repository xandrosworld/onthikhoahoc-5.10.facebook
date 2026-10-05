import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm' };

export async function GET(req, { params }) {
  const name = params.name;
  if (!/^[a-z0-9._-]+$/i.test(name) || name.includes('..')) return new Response('Not found', { status: 404 });
  const file = path.join(path.resolve(process.env.UPLOAD_DIR || './uploads'), name);
  if (!fs.existsSync(file)) return new Response('Not found', { status: 404 });
  const stat = fs.statSync(file);
  const type = MIME[path.extname(name).toLowerCase()] || 'application/octet-stream';
  const download = new URL(req.url).searchParams.get('download');
  const headers = {
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': download ? `attachment; filename="${name}"` : 'inline',
  };
  const range = req.headers.get('range');
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
    if (start >= stat.size || end >= stat.size || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } });
    const stream = fs.createReadStream(file, { start, end });
    return new Response(stream, { status: 206, headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': String(end - start + 1) } });
  }
  return new Response(fs.createReadStream(file), { headers: { ...headers, 'Content-Length': String(stat.size) } });
}
