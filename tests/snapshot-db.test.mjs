import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createSnapshotDatabase } from '../src/lib/snapshot-db.js';

class MemoryStore {
  data = null;
  version = 0;
  fail = false;
  conflicts = 0;
  async getWithMetadata(_key, options) {
    if (!this.data) return null;
    const etag = String(this.version);
    return { etag, data: options.etag === etag ? null : this.data.slice().buffer };
  }
  async set(_key, blob, options) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (this.fail) throw new Error('Storage unavailable');
    if ((options.onlyIfNew && this.data) || (options.onlyIfMatch && options.onlyIfMatch !== String(this.version))) {
      this.conflicts++;
      return { modified: false };
    }
    this.data = bytes;
    return { modified: true, etag: String(++this.version) };
  }
}

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'onthikhoahoc-storage-test-'));
  const seedPath = path.join(directory, 'seed.db');
  const seed = new PrismaClient({ datasources: { db: { url: `file:${seedPath}` } } });
  await seed.$executeRawUnsafe('CREATE TABLE Setting (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)');
  await seed.$disconnect();
  const store = new MemoryStore();
  const clients = [];
  const instance = () => {
    const db = createSnapshotDatabase({ getStore: () => store, seedPath, databasePath: path.join(directory, `instance-${clients.length}.db`) });
    clients.push(db);
    return db;
  };
  t.after(async () => {
    await Promise.all(clients.map(db => db.$disconnect()));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return { store, instance };
}

test('saved data is shared by another instance and survives a fresh instance', async t => {
  const { instance } = await fixture(t);
  const first = instance();
  await first.setting.create({ data: { key: 'exam', value: 'with image' } });
  const second = instance();
  assert.equal((await second.setting.findUnique({ where: { key: 'exam' } })).value, 'with image');
  await second.setting.update({ where: { key: 'exam' }, data: { value: 'edited' } });
  assert.equal((await first.setting.findUnique({ where: { key: 'exam' } })).value, 'edited');
  const fresh = instance();
  assert.equal((await fresh.setting.findUnique({ where: { key: 'exam' } })).value, 'edited');
});

test('competing writes retry without dropping either instance changes', async t => {
  const { store, instance } = await fixture(t);
  const first = instance(), second = instance();
  await first.setting.count();
  await second.setting.count();
  await Promise.all([
    first.setting.create({ data: { key: 'exam-a', value: 'A' } }),
    second.setting.create({ data: { key: 'exam-b', value: 'B' } }),
  ]);
  assert.equal(await first.setting.count(), 2);
  assert.ok(store.conflicts > 0, 'The test must exercise a stale snapshot conflict');
});

test('transaction rollback and failed storage writes are not reported as saves', async t => {
  const { store, instance } = await fixture(t);
  const first = instance();
  await assert.rejects(first.$transaction(async tx => {
    await tx.setting.create({ data: { key: 'discarded', value: 'draft' } });
    throw new Error('Rollback');
  }), /Rollback/);
  assert.equal(await first.setting.count(), 0);
  store.fail = true;
  await assert.rejects(first.setting.create({ data: { key: 'not-saved', value: 'draft' } }), /Storage unavailable/);
  store.fail = false;
  assert.equal(await first.setting.count(), 0);
  await first.$transaction(async tx => {
    await tx.setting.create({ data: { key: 'published', value: 'yes' } });
    await tx.setting.create({ data: { key: 'questions', value: '3' } });
  });
  assert.equal(await instance().setting.count(), 2);
});
