import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { migrateScoring } from '../scripts/scoring-migration.mjs';

test('scoring migration is additive, repeatable and preserves existing rows', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scoring-migration-'));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, 'old.db')}` } } });
  try {
    for (const table of ['Exam','ExamSection','Question','ExamAttempt','ExamResult']) {
      await db.$executeRawUnsafe(`CREATE TABLE "${table}" (id TEXT PRIMARY KEY, original TEXT)`);
      await db.$executeRawUnsafe(`INSERT INTO "${table}" (id,original) VALUES ('existing','keep me')`);
    }
    assert.equal(await db.$transaction(tx => migrateScoring(tx)), 8);
    assert.equal(await db.$transaction(tx => migrateScoring(tx)), 0);
    const [question] = await db.$queryRawUnsafe('SELECT * FROM Question');
    assert.equal(question.original, 'keep me');
    assert.equal(question.points, null);
    assert.equal(Boolean(question.retired), false);
    const [result] = await db.$queryRawUnsafe('SELECT * FROM ExamResult');
    assert.equal(result.original, 'keep me');
    assert.equal(result.maxScore, 10);
  } finally {
    await db.$disconnect();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
