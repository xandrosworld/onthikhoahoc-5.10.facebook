import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const g = globalThis;

function createClient() {
  if (process.env.NETLIFY_DEMO === '1' && process.env.DEMO_BUILD !== '1') {
    // Each serverless instance gets a writable copy of the build's demo snapshot.
    const demoPath = path.join(os.tmpdir(), 'onthikhoahoc-demo.db');
    if (!fs.existsSync(demoPath)) {
      fs.copyFileSync(path.join(process.cwd(), 'prisma', 'demo.db'), demoPath);
    }
    return new PrismaClient({ datasources: { db: { url: `file:${demoPath}` } } });
  }
  return new PrismaClient();
}

export const db = g.__prisma || createClient();
g.__prisma = db;
