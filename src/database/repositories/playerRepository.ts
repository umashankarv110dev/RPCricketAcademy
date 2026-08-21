import type { SQLiteDatabase } from "expo-sqlite";

export type Player = {
  id: number;
  player_code: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  profile_image: string | null;
  joining_date: string | null;
  batch_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type PlayerCricket = {
  jersey_number?: string;
  playing_role?: string;
  batting_style?: string;
  bowling_style?: string;
  skill_level?: string;
};

export type PlayerParent = {
  father_name?: string;
  mother_name?: string;
  parent_mobile?: string;
  parent_email?: string;
  emergency_contact?: string;
  address?: string;
};

export type CreatePlayerInput = {
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  profile_image?: string;
  joining_date?: string;
  batch_id?: number | null;

  cricket?: PlayerCricket;
  parent?: PlayerParent;
};

export async function getPlayers(
  db: SQLiteDatabase
): Promise<Player[]> {
  return await db.getAllAsync<Player>(`
    SELECT *
    FROM players
    ORDER BY full_name COLLATE NOCASE ASC
  `);
}

export async function getActivePlayers(
  db: SQLiteDatabase
): Promise<Player[]> {
  return await db.getAllAsync<Player>(`
    SELECT *
    FROM players
    WHERE status = 'active'
    ORDER BY full_name COLLATE NOCASE ASC
  `);
}

export async function searchPlayers(
  db: SQLiteDatabase,
  search: string
): Promise<Player[]> {
  const value = `%${search.trim()}%`;

  return await db.getAllAsync<Player>(
    `
      SELECT *
      FROM players
      WHERE
        full_name LIKE ?
        OR player_code LIKE ?
        OR mobile LIKE ?
      ORDER BY full_name COLLATE NOCASE ASC
    `,
    value,
    value,
    value
  );
}

export async function getPlayerById(
  db: SQLiteDatabase,
  playerId: number
): Promise<Player | null> {
  return await db.getFirstAsync<Player>(
    `
      SELECT *
      FROM players
      WHERE id = ?
    `,
    playerId
  );
}

export async function getPlayerCricket(
  db: SQLiteDatabase,
  playerId: number
) {
  return await db.getFirstAsync<PlayerCricket>(
    `
      SELECT
        jersey_number,
        playing_role,
        batting_style,
        bowling_style,
        skill_level
      FROM player_cricket
      WHERE player_id = ?
    `,
    playerId
  );
}

export async function getPlayerParent(
  db: SQLiteDatabase,
  playerId: number
) {
  return await db.getFirstAsync<PlayerParent>(
    `
      SELECT
        father_name,
        mother_name,
        parent_mobile,
        parent_email,
        emergency_contact,
        address
      FROM player_parents
      WHERE player_id = ?
    `,
    playerId
  );
}

function generatePlayerCode(): string {
  const timestamp = Date.now().toString().slice(-6);

  return `RPCA-${timestamp}`;
}

export async function createPlayer(
  db: SQLiteDatabase,
  input: CreatePlayerInput
): Promise<number> {
  const playerCode = generatePlayerCode();

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `
        INSERT INTO players (
          player_code,
          full_name,
          date_of_birth,
          gender,
          blood_group,
          mobile,
          email,
          address,
          city,
          profile_image,
          joining_date,
          batch_id,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `,
      playerCode,
      input.full_name.trim(),
      input.date_of_birth ?? null,
      input.gender ?? null,
      input.blood_group ?? null,
      input.mobile ?? null,
      input.email ?? null,
      input.address ?? null,
      input.city ?? null,
      input.profile_image ?? null,
      input.joining_date ?? null,
      input.batch_id ?? null
    );

    const playerId = result.lastInsertRowId;

    if (input.cricket) {
      await db.runAsync(
        `
          INSERT INTO player_cricket (
            player_id,
            jersey_number,
            playing_role,
            batting_style,
            bowling_style,
            skill_level
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        playerId,
        input.cricket.jersey_number ?? null,
        input.cricket.playing_role ?? null,
        input.cricket.batting_style ?? null,
        input.cricket.bowling_style ?? null,
        input.cricket.skill_level ?? null
      );
    }

    if (input.parent) {
      await db.runAsync(
        `
          INSERT INTO player_parents (
            player_id,
            father_name,
            mother_name,
            parent_mobile,
            parent_email,
            emergency_contact,
            address
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        playerId,
        input.parent.father_name ?? null,
        input.parent.mother_name ?? null,
        input.parent.parent_mobile ?? null,
        input.parent.parent_email ?? null,
        input.parent.emergency_contact ?? null,
        input.parent.address ?? null
      );
    }
  });

  const created = await db.getFirstAsync<{ id: number }>(
    `
      SELECT id
      FROM players
      WHERE player_code = ?
    `,
    playerCode
  );

  if (!created) {
    throw new Error("Player was created but could not be found.");
  }

  return created.id;
}

export async function updatePlayer(
  db: SQLiteDatabase,
  playerId: number,
  input: CreatePlayerInput
) {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `
        UPDATE players
        SET
          full_name = ?,
          date_of_birth = ?,
          gender = ?,
          blood_group = ?,
          mobile = ?,
          email = ?,
          address = ?,
          city = ?,
          profile_image = ?,
          joining_date = ?,
          batch_id = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      input.full_name.trim(),
      input.date_of_birth ?? null,
      input.gender ?? null,
      input.blood_group ?? null,
      input.mobile ?? null,
      input.email ?? null,
      input.address ?? null,
      input.city ?? null,
      input.profile_image ?? null,
      input.joining_date ?? null,
      input.batch_id ?? null,
      playerId
    );

    await db.runAsync(
      `
        INSERT INTO player_cricket (
          player_id,
          jersey_number,
          playing_role,
          batting_style,
          bowling_style,
          skill_level
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(player_id)
        DO UPDATE SET
          jersey_number = excluded.jersey_number,
          playing_role = excluded.playing_role,
          batting_style = excluded.batting_style,
          bowling_style = excluded.bowling_style,
          skill_level = excluded.skill_level,
          updated_at = CURRENT_TIMESTAMP
      `,
      playerId,
      input.cricket?.jersey_number ?? null,
      input.cricket?.playing_role ?? null,
      input.cricket?.batting_style ?? null,
      input.cricket?.bowling_style ?? null,
      input.cricket?.skill_level ?? null
    );

    await db.runAsync(
      `
        INSERT INTO player_parents (
          player_id,
          father_name,
          mother_name,
          parent_mobile,
          parent_email,
          emergency_contact,
          address
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(player_id)
        DO UPDATE SET
          father_name = excluded.father_name,
          mother_name = excluded.mother_name,
          parent_mobile = excluded.parent_mobile,
          parent_email = excluded.parent_email,
          emergency_contact = excluded.emergency_contact,
          address = excluded.address,
          updated_at = CURRENT_TIMESTAMP
      `,
      playerId,
      input.parent?.father_name ?? null,
      input.parent?.mother_name ?? null,
      input.parent?.parent_mobile ?? null,
      input.parent?.parent_email ?? null,
      input.parent?.emergency_contact ?? null,
      input.parent?.address ?? null
    );
  });
}

export async function deactivatePlayer(
  db: SQLiteDatabase,
  playerId: number
) {
  await db.runAsync(
    `
      UPDATE players
      SET
        status = 'inactive',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    playerId
  );
}