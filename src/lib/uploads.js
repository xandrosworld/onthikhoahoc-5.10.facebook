import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getStore } from '@netlify/blobs';

const sharedUploads = () => process.env.NETLIFY_PERSISTENCE === '1' && process.env.DEMO_BUILD !== '1';
const uploadStore = () => getStore({ name: 'onthikhoahoc-uploads-v1', consistency: 'strong' });

export async function writeUpload(filename, bytes) {
  if (sharedUploads()) {
    const saved = await uploadStore().set(filename, new Blob([bytes]));
    if (!saved.modified || !saved.etag) throw new Error('Không thể lưu tệp. Vui lòng thử lại.');
  }
  const directory = uploadDirectory();
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, filename), bytes);
}

export async function findUpload(filename) {
  const file = path.join(uploadDirectory(), filename);
  if (fs.existsSync(file)) return file;
  if (sharedUploads()) {
    const data = await uploadStore().get(filename, { type: 'arrayBuffer' });
    if (data) { fs.writeFileSync(file, Buffer.from(data)); return file; }
  }
  return null;
}

export function uploadDirectory() {
  if (process.env.NETLIFY_DEMO !== '1' || process.env.DEMO_BUILD === '1') {
    return path.resolve(process.env.UPLOAD_DIR || './uploads');
  }
  const directory = path.join(os.tmpdir(), 'onthikhoahoc-uploads');
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    const bundled = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(bundled)) fs.cpSync(bundled, directory, { recursive: true });
  }
  return directory;
}
