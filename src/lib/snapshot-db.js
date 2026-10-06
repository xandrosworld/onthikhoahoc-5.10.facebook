import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const WRITES = new Set(['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']);

/** Shared SQLite snapshots for the small Netlify demo. Each operation reads the
 * latest version; conditional writes retry against it instead of losing edits.
 * Interactive transactions run and publish as one operation. */
export function createSnapshotDatabase({ getStore, seedPath, databasePath, maxRetries = 6 }) {
  let client;
  let etag;
  let queue = Promise.resolve();

  function serialized(operation) {
    const next = queue.then(operation);
    queue = next.catch(() => {});
    return next;
  }

  async function synchronize(store) {
    let entry = await store.getWithMetadata('database.sqlite', { type: 'arrayBuffer', ...(etag ? { etag } : {}) });
    if (!entry) {
      // Never overwrite an existing store when a new build seeds its snapshot.
      const initialized = await store.set('database.sqlite', new Blob([fs.readFileSync(seedPath)]), { onlyIfNew: true });
      if (initialized.modified && !initialized.etag) throw new Error('Không thể khởi tạo kho lưu trữ.');
      entry = await store.getWithMetadata('database.sqlite', { type: 'arrayBuffer' });
    }
    if (!entry?.etag) throw new Error('Không đọc được kho lưu trữ. Vui lòng thử lại.');
    if (!client || entry.etag !== etag) {
      await client?.$disconnect();
      if (!entry.data) throw new Error('Thiếu dữ liệu đồng bộ.');
      fs.writeFileSync(databasePath, Buffer.from(entry.data));
      client = new PrismaClient({ datasources: { db: { url: `file:${databasePath}` } } });
    }
    etag = entry.etag;
  }

  function run(operation, writes) {
    return serialized(async () => {
      const store = getStore();
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        await synchronize(store);
        try {
          const result = await operation(client);
          if (!writes) return result;
          // Closing connections checkpoints SQLite before taking the snapshot.
          await client.$disconnect();
          const saved = await store.set('database.sqlite', new Blob([fs.readFileSync(databasePath)]), { onlyIfMatch: etag });
          if (saved.modified) {
            if (!saved.etag) throw new Error('Kho lưu trữ chưa xác nhận dữ liệu đã lưu.');
            etag = saved.etag;
            return result;
          }
          // Another instance wrote first. Restore its snapshot and replay.
          etag = undefined;
        } catch (error) {
          // Discard local changes after a failed transaction/storage request.
          etag = undefined;
          throw error;
        }
      }
      throw new Error('Có nhiều thay đổi cùng lúc. Vui lòng nhấn Lưu lại.');
    });
  }

  const models = new Map();
  return new Proxy({}, {
    get(_target, model) {
      if (model === 'then' || typeof model === 'symbol') return undefined;
      if (model === '$disconnect') return () => serialized(() => client?.$disconnect());
      if (model === '$transaction') return (callback, options) => {
        if (typeof callback !== 'function') throw new Error('Shared storage requires an interactive transaction.');
        return run(db => db.$transaction(callback, options), true);
      };
      if (model.startsWith('$')) throw new Error(`Unsupported shared database method: ${model}`);
      if (!models.has(model)) models.set(model, new Proxy({}, {
        get(_model, method) {
          if (method === 'then' || typeof method === 'symbol') return undefined;
          return (...args) => run(db => db[model][method](...args), WRITES.has(method));
        },
      }));
      return models.get(model);
    },
  });
}
