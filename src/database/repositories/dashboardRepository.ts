import type * as SQLite from "expo-sqlite";

export type DashboardStats = {
  totalPlayers: number;

  presentToday: number;
  absentToday: number;
  halfDayToday: number;
  notMarkedToday: number;

  attendancePercentage: number;

  pendingFees: number;
  feesCollectedThisMonth: number;

  totalEquipment: number;
  availableEquipment: number;
  issuedEquipment: number;
  damagedEquipment: number;
};

function getLocalDate(): string {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMonth(): string {
  return getLocalDate().slice(0, 7);
}

export async function getDashboardStats(
  db: SQLite.SQLiteDatabase
): Promise<DashboardStats> {
  const today = getLocalDate();
  const currentMonth = getCurrentMonth();

  /* =========================
     PLAYERS
  ========================= */

  const playerResult =
    await db.getFirstAsync<{
      total: number;
    }>(
      `
        SELECT
          COUNT(*) AS total
        FROM players
        WHERE status = 'active'
      `
    );

  const totalPlayers = Number(
    playerResult?.total ?? 0
  );

  /* =========================
     TODAY ATTENDANCE
  ========================= */

const attendanceResult =
  await db.getFirstAsync<{
    present: number;
    absent: number;
    half_day: number;
  }>(
    `
      SELECT

        COALESCE(
          SUM(
            CASE
              WHEN LOWER(TRIM(a.status)) = 'present'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS present,

        COALESCE(
          SUM(
            CASE
              WHEN LOWER(TRIM(a.status)) = 'absent'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS absent,

        COALESCE(
          SUM(
            CASE
              WHEN LOWER(
                REPLACE(
                  TRIM(a.status),
                  '-',
                  '_'
                )
              ) IN (
                'half_day',
                'halfday'
              )
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS half_day

      FROM attendance a

      INNER JOIN players p
        ON p.id = a.player_id

      WHERE
        a.attendance_date = ?

        AND p.status = 'active'
    `,
    today
  );

  const presentToday = Number(
    attendanceResult?.present ?? 0
  );

  const absentToday = Number(
    attendanceResult?.absent ?? 0
  );

  const halfDayToday = Number(
    attendanceResult?.half_day ?? 0
  );

  const markedToday =
    presentToday +
    absentToday +
    halfDayToday;

  const notMarkedToday = Math.max(
    totalPlayers - markedToday,
    0
  );

  /* =========================
     ATTENDANCE PERCENTAGE
  ========================= */

  const attendancePercentage =
    totalPlayers > 0
      ? Math.round(
          (
            (
              presentToday +
              halfDayToday * 0.5
            ) /
            totalPlayers
          ) * 100
        )
      : 0;

  /* =========================
     PENDING FEES
  ========================= */

  const pendingFeeResult =
    await db.getFirstAsync<{
      amount: number;
    }>(
      `
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN pending_amount > 0
                THEN pending_amount
                ELSE 0
              END
            ),
            0
          ) AS amount

        FROM fees f

        INNER JOIN players p
          ON p.id = f.player_id

        WHERE p.status = 'active'
      `
    );

  const pendingFees = Number(
    pendingFeeResult?.amount ?? 0
  );

  /* =========================
     FEES COLLECTED THIS MONTH
  ========================= */

  const collectedFeeResult =
    await db.getFirstAsync<{
      amount: number;
    }>(
      `
        SELECT
          COALESCE(
            SUM(amount),
            0
          ) AS amount

        FROM fee_payments

        WHERE substr(
          payment_date,
          1,
          7
        ) = ?
      `,
      currentMonth
    );

  const feesCollectedThisMonth =
    Number(
      collectedFeeResult?.amount ?? 0
    );

  /* =========================
     EQUIPMENT
  ========================= */

  const equipmentResult =
    await db.getFirstAsync<{
      total: number;
      available: number;
      issued: number;
      damaged: number;
    }>(
      `
        SELECT

          COALESCE(
            SUM(total_quantity),
            0
          ) AS total,

          COALESCE(
            SUM(available_quantity),
            0
          ) AS available,

          COALESCE(
            SUM(issued_quantity),
            0
          ) AS issued,

          COALESCE(
            SUM(damaged_quantity),
            0
          ) AS damaged

        FROM equipment
      `
    );

  return {
    totalPlayers,

    presentToday,
    absentToday,
    halfDayToday,
    notMarkedToday,

    attendancePercentage,

    pendingFees,
    feesCollectedThisMonth,

    totalEquipment:
      Number(
        equipmentResult?.total ?? 0
      ),

    availableEquipment:
      Number(
        equipmentResult?.available ?? 0
      ),

    issuedEquipment:
      Number(
        equipmentResult?.issued ?? 0
      ),

    damagedEquipment:
      Number(
        equipmentResult?.damaged ?? 0
      ),
  };
}