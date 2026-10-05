import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

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
