import type * as SQLite from "expo-sqlite";

import {
  CREATE_TABLES,
  DATABASE_VERSION,
} from "./schema";

export async function migrateDatabase(
  db: SQLite.SQLiteDatabase
) {
  try {
    await db.execAsync(`
      PRAGMA foreign_keys = ON;
    `);

    const result = await db.getFirstAsync<{
      user_version: number;
    }>("PRAGMA user_version;");

    const currentVersion =
      result?.user_version ?? 0;

    console.log(
      `RPCA Database Version: ${currentVersion}`
    );

    /*
     * VERSION 1
     *
     * Fresh database creation.
     */
    if (currentVersion === 0) {
      console.log(
        "Creating fresh RPCA database..."
      );

      await createAllTables(db);

      await db.execAsync(`
        PRAGMA user_version = 1;
      `);

      console.log(
        "RPCA database version 1 created."
      );
    }

    /*
     * VERSION 2
     *
     * Development database repair.
     *
     * The previous version of RPCA had an older
     * players table structure. Because we are still
     * developing and don't have production data,
     * recreate the database using the latest schema.
     */
    if (currentVersion < 2) {
      console.log(
        "Running RPCA database migration v2..."
      );

      await resetDatabase(db);

      await createAllTables(db);

      await db.execAsync(`
        PRAGMA user_version = ${DATABASE_VERSION};
      `);

      console.log(
        "RPCA database migration v2 completed."
      );
    }

    /*
     * Verify the players table.
     */
    const columns = await db.getAllAsync<{
      name: string;
    }>("PRAGMA table_info(players);");

    console.log(
      "RPCA players columns:",
      columns.map((column) => column.name)
    );

  } catch (error) {
    console.error(
      "RPCA migration error:",
      error
    );

    throw error;
  }
}


/**
 * Create all RPCA tables.
 */
async function createAllTables(
  db: SQLite.SQLiteDatabase
) {
  await db.execAsync(`
    ${CREATE_TABLES.coaches}

    ${CREATE_TABLES.batches}

    ${CREATE_TABLES.players}

    ${CREATE_TABLES.player_cricket}

    ${CREATE_TABLES.player_parents}

    ${CREATE_TABLES.attendance}

    ${CREATE_TABLES.fees}

    ${CREATE_TABLES.fee_payments}

    ${CREATE_TABLES.equipment}

    ${CREATE_TABLES.equipment_transactions}

    ${CREATE_TABLES.academy_settings}
  `);
}


/**
 * Reset development database.
 *
 * IMPORTANT:
 * This deletes existing local RPCA data.
 *
 * We are doing this only because this is still
 * development and the old schema is incompatible.
 */
async function resetDatabase(
  db: SQLite.SQLiteDatabase
) {
  console.log(
    "Resetting RPCA development database..."
  );

  await db.execAsync(`
    PRAGMA foreign_keys = OFF;

    DROP TABLE IF EXISTS equipment_transactions;
    DROP TABLE IF EXISTS equipment;

    DROP TABLE IF EXISTS fee_payments;
    DROP TABLE IF EXISTS fees;

    DROP TABLE IF EXISTS attendance;

    DROP TABLE IF EXISTS player_parents;
    DROP TABLE IF EXISTS player_cricket;

    DROP TABLE IF EXISTS players;

    DROP TABLE IF EXISTS batches;
    DROP TABLE IF EXISTS coaches;

    DROP TABLE IF EXISTS academy_settings;

    PRAGMA foreign_keys = ON;
  `);

  console.log(
    "Old RPCA tables removed."
  );
}