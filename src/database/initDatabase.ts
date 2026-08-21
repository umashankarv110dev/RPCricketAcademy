import type * as SQLite from "expo-sqlite";

import { migrateDatabase } from "./migrations";

export async function initializeDatabase(
  db: SQLite.SQLiteDatabase
) {
  try {
    await migrateDatabase(db);

    console.log(
      "RPCA database initialized successfully."
    );
  } catch (error) {
    console.error(
      "RPCA database initialization error:",
      error
    );

    throw error;
  }
}