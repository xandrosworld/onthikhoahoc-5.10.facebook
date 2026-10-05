import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const demoDatabase = path.resolve('prisma/demo.db');
if (fs.existsSync(demoDatabase)) fs.unlinkSync(demoDatabase);
fs.closeSync(fs.openSync(demoDatabase, 'w'));

const env = {
  ...process.env,
  DATABASE_URL: 'file:./demo.db',
  UPLOAD_DIR: path.resolve('uploads'),
  DEMO_BUILD: '1',
  NEXT_TELEMETRY_DISABLED: '1',
};

function run(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

run('node_modules/prisma/build/index.js', ['generate']);
run('node_modules/prisma/build/index.js', ['db', 'push', '--skip-generate']);
run('prisma/seed.mjs');
run('node_modules/next/dist/bin/next', ['build']);
