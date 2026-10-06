// Additive migration for existing SQLite databases, including the shared demo.
// Call inside a transaction; existing questions retain their original scores.
export async function migrateScoring(db) {
  const additions = [
    ['Exam', 'template', "TEXT NOT NULL DEFAULT 'FULL'"],
    ['ExamSection', 'pointsPerQuestion', 'REAL'],
    ['ExamSection', 'tfScoring', "TEXT NOT NULL DEFAULT 'TIERED'"],
    ['Question', 'points', 'REAL'],
    ['Question', 'retired', 'BOOLEAN NOT NULL DEFAULT false'],
    ['ExamAttempt', 'snapshot', 'TEXT'],
    ['ExamResult', 'rawScore', 'REAL'],
    ['ExamResult', 'maxScore', 'REAL NOT NULL DEFAULT 10'],
  ];
  let changed = 0;
  for (const [table, column, definition] of additions) {
    const columns = await db.$queryRawUnsafe(`PRAGMA table_info("${table}")`);
    if (!columns.length) throw new Error(`Missing table ${table}; migration stopped.`);
    if (!columns.some(c => c.name === column)) {
      await db.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
      changed++;
    }
  }
  return changed;
}
