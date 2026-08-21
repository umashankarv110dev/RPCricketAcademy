import type * as SQLite from "expo-sqlite";

export type FeeStatus =
  | "paid"
  | "partial"
  | "pending";

export type PlayerFee = {
  id: number;
  player_id: number;
  player_code: string;
  full_name: string;
  fee_month: string;
  amount: number;
  paid_amount: number;
  pending_amount: number;
  status: FeeStatus;
  due_date: string | null;
  remarks: string | null;
};

export type FeePayment = {
  id: number;
  fee_id: number;
  player_id: number;
  amount: number;
  payment_date: string;
  payment_mode: string;
  transaction_reference: string | null;
  remarks: string | null;
};

export type FeeSummary = {
  total_fee: number;
  total_collected: number;
  total_pending: number;
  paid_players: number;
  partial_players: number;
  pending_players: number;
};

export async function getFeeSummary(
  db: SQLite.SQLiteDatabase,
  feeMonth: string
): Promise<FeeSummary> {
  const row =
    await db.getFirstAsync<FeeSummary>(
      `
        SELECT

          COALESCE(
            SUM(amount),
            0
          ) AS total_fee,

          COALESCE(
            SUM(paid_amount),
            0
          ) AS total_collected,

          COALESCE(
            SUM(pending_amount),
            0
          ) AS total_pending,

          COALESCE(
            SUM(
              CASE
                WHEN status = 'paid'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS paid_players,

          COALESCE(
            SUM(
              CASE
                WHEN status = 'partial'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS partial_players,

          COALESCE(
            SUM(
              CASE
                WHEN status = 'pending'
                THEN 1
                ELSE 0
              END
            ),
            0
          ) AS pending_players

        FROM fees

        WHERE fee_month = ?
      `,
      feeMonth
    );

  return {
    total_fee: Number(row?.total_fee ?? 0),
    total_collected: Number(
      row?.total_collected ?? 0
    ),
    total_pending: Number(
      row?.total_pending ?? 0
    ),
    paid_players: Number(
      row?.paid_players ?? 0
    ),
    partial_players: Number(
      row?.partial_players ?? 0
    ),
    pending_players: Number(
      row?.pending_players ?? 0
    ),
  };
}

export async function getMonthlyFees(
  db: SQLite.SQLiteDatabase,
  feeMonth: string
): Promise<PlayerFee[]> {
  return await db.getAllAsync<PlayerFee>(
    `
      SELECT
        f.id,
        f.player_id,
        p.player_code,
        p.full_name,
        f.fee_month,
        f.amount,
        f.paid_amount,
        f.pending_amount,
        f.status,
        f.due_date,
        f.remarks

      FROM fees f

      INNER JOIN players p
        ON p.id = f.player_id

      WHERE f.fee_month = ?

      ORDER BY
        p.full_name COLLATE NOCASE ASC
    `,
    feeMonth
  );
}

export async function getPlayerFee(
  db: SQLite.SQLiteDatabase,
  playerId: number,
  feeMonth: string
): Promise<PlayerFee | null> {
  return await db.getFirstAsync<PlayerFee>(
    `
      SELECT
        f.id,
        f.player_id,
        p.player_code,
        p.full_name,
        f.fee_month,
        f.amount,
        f.paid_amount,
        f.pending_amount,
        f.status,
        f.due_date,
        f.remarks

      FROM fees f

      INNER JOIN players p
        ON p.id = f.player_id

      WHERE
        f.player_id = ?
        AND f.fee_month = ?
    `,
    playerId,
    feeMonth
  );
}

export async function createOrUpdateFee(
  db: SQLite.SQLiteDatabase,
  input: {
    playerId: number;
    feeMonth: string;
    amount: number;
    dueDate?: string;
    remarks?: string;
  }
) {
  const existing =
    await db.getFirstAsync<{
      id: number;
      paid_amount: number;
    }>(
      `
        SELECT
          id,
          paid_amount
        FROM fees
        WHERE
          player_id = ?
          AND fee_month = ?
      `,
      input.playerId,
      input.feeMonth
    );

  const paidAmount =
    Number(existing?.paid_amount ?? 0);

  const pendingAmount = Math.max(
    input.amount - paidAmount,
    0
  );

  const status: FeeStatus =
    pendingAmount === 0
      ? "paid"
      : paidAmount > 0
        ? "partial"
        : "pending";

  if (existing) {
    await db.runAsync(
      `
        UPDATE fees
        SET
          amount = ?,
          pending_amount = ?,
          status = ?,
          due_date = ?,
          remarks = ?,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
      `,
      input.amount,
      pendingAmount,
      status,
      input.dueDate ?? null,
      input.remarks ?? null,
      existing.id
    );

    return existing.id;
  }

  const result = await db.runAsync(
    `
      INSERT INTO fees (
        player_id,
        fee_month,
        amount,
        paid_amount,
        pending_amount,
        status,
        due_date,
        remarks
      )
      VALUES (?, ?, ?, 0, ?, ?, ?, ?)
    `,
    input.playerId,
    input.feeMonth,
    input.amount,
    pendingAmount,
    status,
    input.dueDate ?? null,
    input.remarks ?? null
  );

  return result.lastInsertRowId;
}

export async function recordPayment(
  db: SQLite.SQLiteDatabase,
  input: {
    feeId: number;
    playerId: number;
    amount: number;
    paymentDate: string;
    paymentMode: string;
    transactionReference?: string;
    remarks?: string;
  }
) {
  await db.withTransactionAsync(
    async () => {
      const fee =
        await db.getFirstAsync<{
          amount: number;
          paid_amount: number;
        }>(
          `
            SELECT
              amount,
              paid_amount
            FROM fees
            WHERE id = ?
          `,
          input.feeId
        );

      if (!fee) {
        throw new Error(
          "Fee record not found."
        );
      }

      const currentPaid =
        Number(fee.paid_amount);

      const paymentAmount =
        Number(input.amount);

      if (paymentAmount <= 0) {
        throw new Error(
          "Payment amount must be greater than zero."
        );
      }

      const pendingBefore =
        Number(fee.amount) -
        currentPaid;

      if (paymentAmount > pendingBefore) {
        throw new Error(
          "Payment cannot be greater than pending amount."
        );
      }

      const newPaid =
        currentPaid + paymentAmount;

      const newPending = Math.max(
        Number(fee.amount) - newPaid,
        0
      );

      const status: FeeStatus =
        newPending === 0
          ? "paid"
          : "partial";

      await db.runAsync(
        `
          INSERT INTO fee_payments (
            fee_id,
            player_id,
            amount,
            payment_date,
            payment_mode,
            transaction_reference,
            remarks
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        input.feeId,
        input.playerId,
        paymentAmount,
        input.paymentDate,
        input.paymentMode,
        input.transactionReference ??
          null,
        input.remarks ?? null
      );

      await db.runAsync(
        `
          UPDATE fees
          SET
            paid_amount = ?,
            pending_amount = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = ?
        `,
        newPaid,
        newPending,
        status,
        input.feeId
      );
    }
  );
}

export async function getPaymentHistory(
  db: SQLite.SQLiteDatabase,
  feeId: number
): Promise<FeePayment[]> {
  return await db.getAllAsync<FeePayment>(
    `
      SELECT *
      FROM fee_payments
      WHERE fee_id = ?
      ORDER BY payment_date DESC, id DESC
    `,
    feeId
  );
}

export async function getPlayerFeeHistory(
  db: SQLite.SQLiteDatabase,
  playerId: number
): Promise<PlayerFee[]> {
  return await db.getAllAsync<PlayerFee>(
    `
      SELECT
        f.id,
        f.player_id,
        p.player_code,
        p.full_name,
        f.fee_month,
        f.amount,
        f.paid_amount,
        f.pending_amount,
        f.status,
        f.due_date,
        f.remarks

      FROM fees f

      INNER JOIN players p
        ON p.id = f.player_id

      WHERE f.player_id = ?

      ORDER BY f.fee_month DESC
    `,
    playerId
  );
}

export async function initializeMonthlyFees(
  db: SQLite.SQLiteDatabase,
  feeMonth: string,
  defaultAmount: number = 0
) {
  const players =
    await db.getAllAsync<{
      id: number;
    }>(
      `
        SELECT id
        FROM players
        WHERE status = 'active'
      `
    );

  await db.withTransactionAsync(
    async () => {
      for (const player of players) {
        await db.runAsync(
          `
            INSERT OR IGNORE INTO fees (
              player_id,
              fee_month,
              amount,
              paid_amount,
              pending_amount,
              status
            )
            VALUES (?, ?, ?, 0, ?, 'pending')
          `,
          player.id,
          feeMonth,
          defaultAmount,
          defaultAmount
        );
      }
    }
  );
}

export async function getFeeById(
  db: SQLite.SQLiteDatabase,
  feeId: number
): Promise<PlayerFee | null> {
  return await db.getFirstAsync<PlayerFee>(
    `
      SELECT
        f.id,
        f.player_id,
        p.player_code,
        p.full_name,
        f.fee_month,
        f.amount,
        f.paid_amount,
        f.pending_amount,
        f.status,
        f.due_date,
        f.remarks
      FROM fees f
      INNER JOIN players p
        ON p.id = f.player_id
      WHERE f.id = ?
    `,
    feeId
  );
}

export async function getPaymentWithFeeDetails(
  db: SQLite.SQLiteDatabase,
  paymentId: number
) {
  return await db.getFirstAsync<{
    payment_id: number;
    fee_id: number;
    player_id: number;

    player_code: string;
    full_name: string;

    fee_month: string;
    fee_amount: number;
    paid_amount: number;
    pending_amount: number;

    payment_amount: number;
    payment_date: string;
    payment_mode: string;
    transaction_reference: string | null;
    payment_remarks: string | null;

    due_date: string | null;
  }>(
    `
      SELECT
        fp.id AS payment_id,
        fp.fee_id,
        fp.player_id,

        p.player_code,
        p.full_name,

        f.fee_month,
        f.amount AS fee_amount,
        f.paid_amount,
        f.pending_amount,

        fp.amount AS payment_amount,
        fp.payment_date,
        fp.payment_mode,
        fp.transaction_reference,
        fp.remarks AS payment_remarks,

        f.due_date

      FROM fee_payments fp

      INNER JOIN fees f
        ON f.id = fp.fee_id

      INNER JOIN players p
        ON p.id = fp.player_id

      WHERE fp.id = ?
    `,
    paymentId
  );
}