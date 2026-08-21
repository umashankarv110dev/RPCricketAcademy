import type { SQLiteDatabase } from "expo-sqlite";

export type Batch = {
  id: number;
  name: string;
  age_group: string | null;
  start_time: string | null;
  end_time: string | null;
  days: string | null;
  coach_id: number | null;
  status: string;
};

export async function getBatches(
  db: SQLiteDatabase
): Promise<Batch[]> {
  return await db.getAllAsync<Batch>(`
    SELECT *
    FROM batches
    WHERE status = 'active'
    ORDER BY name COLLATE NOCASE ASC
  `);
}

export async function getBatchById(
  db: SQLiteDatabase,
  batchId: number
): Promise<Batch | null> {
  return await db.getFirstAsync<Batch>(
    `
      SELECT *
      FROM batches
      WHERE id = ?
    `,
    batchId
  );
}

export async function createBatch(
  db: SQLiteDatabase,
  input: {
    name: string;
    age_group?: string;
    start_time?: string;
    end_time?: string;
    days?: string;
  }
) {
  const result = await db.runAsync(
    `
      INSERT INTO batches (
        name,
        age_group,
        start_time,
        end_time,
        days,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'active')
    `,
    input.name,
    input.age_group ?? null,
    input.start_time ?? null,
    input.end_time ?? null,
    input.days ?? null
  );

  return result.lastInsertRowId;
}