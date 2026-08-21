import type * as SQLite from "expo-sqlite";

export type Equipment = {
  id: number;
  name: string;
  category: string | null;
  brand: string | null;
  equipment_type: string | null;

  total_quantity: number;
  available_quantity: number;
  issued_quantity: number;
  damaged_quantity: number;

  purchase_price: number;
  purchase_date: string | null;

  condition: string | null;
  location: string | null;
  remarks: string | null;
};

export type EquipmentTransaction = {
  id: number;
  equipment_id: number;
  player_id: number | null;

  transaction_type: string;
  quantity: number;
  transaction_date: string;

  condition: string | null;
  remarks: string | null;

  equipment_name: string;
  player_name: string | null;
};

export type EquipmentSummary = {
  total_items: number;
  available_items: number;
  issued_items: number;
  damaged_items: number;
};

export async function getEquipmentSummary(
  db: SQLite.SQLiteDatabase
): Promise<EquipmentSummary> {
  const row =
    await db.getFirstAsync<EquipmentSummary>(
      `
        SELECT
          COALESCE(
            SUM(total_quantity),
            0
          ) AS total_items,

          COALESCE(
            SUM(available_quantity),
            0
          ) AS available_items,

          COALESCE(
            SUM(issued_quantity),
            0
          ) AS issued_items,

          COALESCE(
            SUM(damaged_quantity),
            0
          ) AS damaged_items

        FROM equipment
      `
    );

  return {
    total_items: Number(
      row?.total_items ?? 0
    ),

    available_items: Number(
      row?.available_items ?? 0
    ),

    issued_items: Number(
      row?.issued_items ?? 0
    ),

    damaged_items: Number(
      row?.damaged_items ?? 0
    ),
  };
}

export async function getEquipmentList(
  db: SQLite.SQLiteDatabase
): Promise<Equipment[]> {
  return await db.getAllAsync<Equipment>(
    `
      SELECT
        id,
        name,
        category,
        brand,
        equipment_type,

        total_quantity,
        available_quantity,
        issued_quantity,
        damaged_quantity,

        purchase_price,
        purchase_date,

        condition,
        location,
        remarks

      FROM equipment

      ORDER BY
        name COLLATE NOCASE ASC
    `
  );
}

export async function getEquipmentById(
  db: SQLite.SQLiteDatabase,
  equipmentId: number
): Promise<Equipment | null> {
  return await db.getFirstAsync<Equipment>(
    `
      SELECT
        *
      FROM equipment
      WHERE id = ?
    `,
    equipmentId
  );
}

export async function addEquipment(
  db: SQLite.SQLiteDatabase,
  input: {
    name: string;
    category?: string;
    brand?: string;
    equipmentType?: string;

    quantity: number;

    purchasePrice?: number;
    purchaseDate?: string;

    condition?: string;
    location?: string;
    remarks?: string;
  }
) {
  if (
    !input.name.trim()
  ) {
    throw new Error(
      "Equipment name is required."
    );
  }

  if (
    input.quantity <= 0
  ) {
    throw new Error(
      "Quantity must be greater than zero."
    );
  }

  const result =
    await db.runAsync(
      `
        INSERT INTO equipment (
          name,
          category,
          brand,
          equipment_type,

          total_quantity,
          available_quantity,
          issued_quantity,
          damaged_quantity,

          purchase_price,
          purchase_date,

          condition,
          location,
          remarks
        )

        VALUES (
          ?, ?, ?, ?,
          ?, ?, 0, 0,
          ?, ?,
          ?, ?, ?
        )
      `,
      input.name.trim(),
      input.category ?? null,
      input.brand ?? null,
      input.equipmentType ?? null,

      input.quantity,
      input.quantity,

      input.purchasePrice ?? 0,
      input.purchaseDate ?? null,

      input.condition ?? "good",
      input.location ?? null,
      input.remarks ?? null
    );

  return result.lastInsertRowId;
}

export async function issueEquipment(
  db: SQLite.SQLiteDatabase,
  input: {
    equipmentId: number;
    playerId: number;
    quantity: number;
    transactionDate: string;
    remarks?: string;
  }
) {
  if (
    input.quantity <= 0
  ) {
    throw new Error(
      "Quantity must be greater than zero."
    );
  }

  await db.withTransactionAsync(
    async () => {
      const equipment =
        await getEquipmentById(
          db,
          input.equipmentId
        );

      if (!equipment) {
        throw new Error(
          "Equipment not found."
        );
      }

      if (
        equipment.available_quantity <
        input.quantity
      ) {
        throw new Error(
          `Only ${equipment.available_quantity} item(s) available.`
        );
      }

      await db.runAsync(
        `
          UPDATE equipment

          SET
            available_quantity =
              available_quantity - ?,

            issued_quantity =
              issued_quantity + ?,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = ?
        `,
        input.quantity,
        input.quantity,
        input.equipmentId
      );

      await db.runAsync(
        `
          INSERT INTO equipment_transactions (
            equipment_id,
            player_id,
            transaction_type,
            quantity,
            transaction_date,
            condition,
            remarks
          )

          VALUES (
            ?, ?,
            'issue',
            ?, ?, ?,
            ?
          )
        `,
        input.equipmentId,
        input.playerId,
        input.quantity,
        input.transactionDate,
        equipment.condition ?? "good",
        input.remarks ?? null
      );
    }
  );
}

export async function returnEquipment(
  db: SQLite.SQLiteDatabase,
  input: {
    equipmentId: number;
    playerId: number;
    quantity: number;
    transactionDate: string;
    condition?: string;
    remarks?: string;
  }
) {
  if (
    input.quantity <= 0
  ) {
    throw new Error(
      "Quantity must be greater than zero."
    );
  }

  await db.withTransactionAsync(
    async () => {
      const equipment =
        await getEquipmentById(
          db,
          input.equipmentId
        );

      if (!equipment) {
        throw new Error(
          "Equipment not found."
        );
      }

      if (
        equipment.issued_quantity <
        input.quantity
      ) {
        throw new Error(
          "Return quantity cannot exceed issued quantity."
        );
      }

      await db.runAsync(
        `
          UPDATE equipment

          SET
            available_quantity =
              available_quantity + ?,

            issued_quantity =
              issued_quantity - ?,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = ?
        `,
        input.quantity,
        input.quantity,
        input.equipmentId
      );

      await db.runAsync(
        `
          INSERT INTO equipment_transactions (
            equipment_id,
            player_id,
            transaction_type,
            quantity,
            transaction_date,
            condition,
            remarks
          )

          VALUES (
            ?, ?,
            'return',
            ?, ?, ?,
            ?
          )
        `,
        input.equipmentId,
        input.playerId,
        input.quantity,
        input.transactionDate,
        input.condition ?? "good",
        input.remarks ?? null
      );
    }
  );
}

export async function markEquipmentDamaged(
  db: SQLite.SQLiteDatabase,
  input: {
    equipmentId: number;
    quantity: number;
    transactionDate: string;
    playerId?: number;
    remarks?: string;
  }
) {
  if (
    input.quantity <= 0
  ) {
    throw new Error(
      "Quantity must be greater than zero."
    );
  }

  await db.withTransactionAsync(
    async () => {
      const equipment =
        await getEquipmentById(
          db,
          input.equipmentId
        );

      if (!equipment) {
        throw new Error(
          "Equipment not found."
        );
      }

      if (
        equipment.available_quantity <
        input.quantity
      ) {
        throw new Error(
          "Damaged quantity cannot exceed available stock."
        );
      }

      await db.runAsync(
        `
          UPDATE equipment

          SET
            available_quantity =
              available_quantity - ?,

            damaged_quantity =
              damaged_quantity + ?,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = ?
        `,
        input.quantity,
        input.quantity,
        input.equipmentId
      );

      await db.runAsync(
        `
          INSERT INTO equipment_transactions (
            equipment_id,
            player_id,
            transaction_type,
            quantity,
            transaction_date,
            condition,
            remarks
          )

          VALUES (
            ?, ?,
            'damage',
            ?, ?, 'damaged',
            ?
          )
        `,
        input.equipmentId,
        input.playerId ?? null,
        input.quantity,
        input.transactionDate,
        input.remarks ?? null
      );
    }
  );
}

export async function getEquipmentTransactions(
  db: SQLite.SQLiteDatabase,
  equipmentId?: number
): Promise<EquipmentTransaction[]> {
  if (equipmentId) {
    return await db.getAllAsync<EquipmentTransaction>(
      `
        SELECT
          et.*,

          e.name AS equipment_name,

          p.full_name AS player_name

        FROM equipment_transactions et

        INNER JOIN equipment e
          ON e.id = et.equipment_id

        LEFT JOIN players p
          ON p.id = et.player_id

        WHERE et.equipment_id = ?

        ORDER BY
          et.id DESC
      `,
      equipmentId
    );
  }

  return await db.getAllAsync<EquipmentTransaction>(
    `
      SELECT
        et.*,

        e.name AS equipment_name,

        p.full_name AS player_name

      FROM equipment_transactions et

      INNER JOIN equipment e
        ON e.id = et.equipment_id

      LEFT JOIN players p
        ON p.id = et.player_id

      ORDER BY
        et.id DESC
    `
  );
}