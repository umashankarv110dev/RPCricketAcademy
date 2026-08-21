import type * as SQLite from "expo-sqlite";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "half_day";

export type DailyAttendancePlayer = {
  id: number;
  player_code: string;
  full_name: string;
  mobile: string | null;
  status: AttendanceStatus | null;
};

export type MonthlyAttendance = {
  player_id: number;
  player_code: string;
  full_name: string;
  present_days: number;
  absent_days: number;
  half_days: number;
  total_marked: number;
  attendance_percentage: number;
};

export async function getDailyAttendance(
  db: SQLite.SQLiteDatabase,
  date: string
): Promise<DailyAttendancePlayer[]> {
  return await db.getAllAsync<DailyAttendancePlayer>(
    `
      SELECT
        p.id,
        p.player_code,
        p.full_name,
        p.mobile,
        a.status
      FROM players p
      LEFT JOIN attendance a
        ON a.player_id = p.id
        AND a.attendance_date = ?
      WHERE p.status = 'active'
      ORDER BY p.full_name COLLATE NOCASE ASC
    `,
    date
  );
}

export async function saveAttendance(
  db: SQLite.SQLiteDatabase,
  playerId: number,
  date: string,
  status: AttendanceStatus,
  markedBy?: number | null,
  remarks?: string | null
) {
  await db.runAsync(
    `
      INSERT INTO attendance (
        player_id,
        attendance_date,
        status,
        marked_by,
        remarks
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(player_id, attendance_date)
      DO UPDATE SET
        status = excluded.status,
        marked_by = excluded.marked_by,
        remarks = excluded.remarks,
        updated_at = CURRENT_TIMESTAMP
    `,
    playerId,
    date,
    status,
    markedBy ?? null,
    remarks ?? null
  );
}

export async function saveBulkAttendance(
  db: SQLite.SQLiteDatabase,
  date: string,
  attendance: {
    playerId: number;
    status: AttendanceStatus;
  }[],
  markedBy?: number | null
) {
  await db.withTransactionAsync(async () => {
    for (const item of attendance) {
      await db.runAsync(
        `
          INSERT INTO attendance (
            player_id,
            attendance_date,
            status,
            marked_by
          )
          VALUES (?, ?, ?, ?)
          ON CONFLICT(player_id, attendance_date)
          DO UPDATE SET
            status = excluded.status,
            marked_by = excluded.marked_by,
            updated_at = CURRENT_TIMESTAMP
        `,
        item.playerId,
        date,
        item.status,
        markedBy ?? null
      );
    }
  });
}

export async function getMonthlyAttendance(
  db: SQLite.SQLiteDatabase,
  year: number,
  month: number
): Promise<MonthlyAttendance[]> {
  const monthString = String(month).padStart(
    2,
    "0"
  );

  const rows =
    await db.getAllAsync<MonthlyAttendance>(
      `
        SELECT
          p.id AS player_id,
          p.player_code,
          p.full_name,

          COALESCE(
            SUM(
              CASE
                WHEN a.status = 'present'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS present_days,

          COALESCE(
            SUM(
              CASE
                WHEN a.status = 'absent'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS absent_days,

          COALESCE(
            SUM(
              CASE
                WHEN a.status = 'half_day'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS half_days,

          COUNT(a.id) AS total_marked

        FROM players p

        LEFT JOIN attendance a
          ON a.player_id = p.id
          AND strftime('%Y', a.attendance_date) = ?
          AND strftime('%m', a.attendance_date) = ?

        WHERE p.status = 'active'

        GROUP BY
          p.id,
          p.player_code,
          p.full_name

        ORDER BY
          p.full_name COLLATE NOCASE ASC
      `,
      String(year),
      monthString
    );

  return rows.map((row) => {
    const total =
      Number(row.present_days) +
      Number(row.absent_days) +
      Number(row.half_days);

    const effectivePresent =
      Number(row.present_days) +
      Number(row.half_days) * 0.5;

    const percentage =
      total > 0
        ? (effectivePresent / total) * 100
        : 0;

    return {
      ...row,
      present_days: Number(row.present_days),
      absent_days: Number(row.absent_days),
      half_days: Number(row.half_days),
      total_marked: total,
      attendance_percentage:
        Math.round(percentage * 10) / 10,
    };
  });
}

export async function getPlayerMonthlyAttendance(
  db: SQLite.SQLiteDatabase,
  playerId: number,
  year: number,
  month: number
) {
  const monthString = String(month).padStart(
    2,
    "0"
  );

  return await db.getAllAsync<{
    attendance_date: string;
    status: AttendanceStatus;
    remarks: string | null;
  }>(
    `
      SELECT
        attendance_date,
        status,
        remarks
      FROM attendance
      WHERE player_id = ?
        AND strftime('%Y', attendance_date) = ?
        AND strftime('%m', attendance_date) = ?
      ORDER BY attendance_date ASC
    `,
    playerId,
    String(year),
    monthString
  );
}