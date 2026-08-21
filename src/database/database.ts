import * as SQLite from "expo-sqlite";

export const DATABASE_NAME = "rpca.db";

let database: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  if (!database) {
    database =
      await SQLite.openDatabaseAsync(
        DATABASE_NAME
      );
  }

  return database;
}

export async function closeDatabase() {
  if (database) {
    await database.closeAsync();

    database = null;
  }
}