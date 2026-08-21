import React, {
  useCallback,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import * as SQLite from "expo-sqlite";

import { Colors } from "../../src/theme/colors";

import {
  Equipment,
  EquipmentTransaction,
  getEquipmentById,
  getEquipmentTransactions,
} from "../../src/database/repositories/equipmentRepository";

export default function EquipmentDetailsScreen() {
  const db = SQLite.useSQLiteContext();

  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [item, setItem] =
    useState<Equipment | null>(null);

  const [transactions, setTransactions] =
    useState<EquipmentTransaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadDetails = useCallback(
    async () => {
      try {
        setLoading(true);

        const equipmentId =
          Number(id);

        if (!equipmentId) {
          router.back();
          return;
        }

        const [
          equipment,
          history,
        ] = await Promise.all([
          getEquipmentById(
            db,
            equipmentId
          ),
          getEquipmentTransactions(
            db,
            equipmentId
          ),
        ]);

        setItem(equipment);
        setTransactions(history);
      } catch (error) {
        console.error(
          "Equipment details error:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to load equipment details."
        );
      } finally {
        setLoading(false);
      }
    },
    [db, id]
  );

  useFocusEffect(
    useCallback(() => {
      loadDetails();
    }, [loadDetails])
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading equipment...
        </Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.loader}>
        <Text style={styles.loadingText}>
          Equipment not found.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={Colors.text}
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text
            style={styles.headerTitle}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <Text style={styles.headerSubtitle}>
            Equipment details
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="baseball-outline"
              size={35}
              color={Colors.primary}
            />
          </View>

          <Text style={styles.heroName}>
            {item.name}
          </Text>

          <Text style={styles.heroMeta}>
            {item.category ||
              "Cricket Equipment"}
            {item.brand
              ? ` • ${item.brand}`
              : ""}
          </Text>
        </View>

        <View style={styles.stockGrid}>
          <StockCard
            label="Total"
            value={
              item.total_quantity
            }
          />

          <StockCard
            label="Available"
            value={
              item.available_quantity
            }
            positive
          />

          <StockCard
            label="Issued"
            value={
              item.issued_quantity
            }
          />

          <StockCard
            label="Damaged"
            value={
              item.damaged_quantity
            }
            negative={
              item.damaged_quantity >
              0
            }
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Equipment Information
          </Text>

          <InfoRow
            label="Category"
            value={
              item.category ||
              "-"
            }
          />

          <InfoRow
            label="Brand"
            value={
              item.brand ||
              "-"
            }
          />

          <InfoRow
            label="Type"
            value={
              item.equipment_type ||
              "-"
            }
          />

          <InfoRow
            label="Condition"
            value={
              item.condition ||
              "-"
            }
          />

          <InfoRow
            label="Location"
            value={
              item.location ||
              "-"
            }
          />

          <InfoRow
            label="Purchase Price"
            value={`₹${Number(
              item.purchase_price
            ).toLocaleString(
              "en-IN"
            )}`}
          />
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>
            Transaction History
          </Text>

          <Text style={styles.historyCount}>
            {transactions.length} records
          </Text>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="swap-horizontal-outline"
              size={35}
              color={Colors.primary}
            />

            <Text style={styles.emptyText}>
              No transactions yet.
            </Text>
          </View>
        ) : (
          transactions.map(
            (transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={
                  transaction
                }
              />
            )
          )
        )}

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>
    </View>
  );
}

function StockCard({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: number;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <View style={styles.stockCard}>
      <Text style={styles.stockLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.stockValue,
          positive &&
            styles.positive,
          negative &&
            styles.negative,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function TransactionCard({
  transaction,
}: {
  transaction: EquipmentTransaction;
}) {
  const config: Record<
    string,
    {
      icon: keyof typeof Ionicons.glyphMap;
      label: string;
    }
  > = {
    issue: {
      icon: "arrow-up-circle-outline",
      label: "Issued",
    },

    return: {
      icon: "arrow-down-circle-outline",
      label: "Returned",
    },

    damage: {
      icon: "warning-outline",
      label: "Damaged",
    },
  };

  const type =
    config[
      transaction.transaction_type
    ] ?? {
      icon: "swap-horizontal-outline",
      label:
        transaction.transaction_type,
    };

  return (
    <View style={styles.transaction}>
      <View style={styles.transactionIcon}>
        <Ionicons
          name={type.icon}
          size={21}
          color={
            transaction.transaction_type ===
            "damage"
              ? Colors.danger
              : Colors.primary
          }
        />
      </View>

      <View
        style={styles.transactionInfo}
      >
        <Text
          style={styles.transactionTitle}
        >
          {type.label} ×{" "}
          {transaction.quantity}
        </Text>

        <Text
          style={styles.transactionDate}
        >
          {transaction.transaction_date}
        </Text>

        {transaction.player_name && (
          <Text
            style={styles.transactionPlayer}
          >
            Player:{" "}
            {transaction.player_name}
          </Text>
        )}

        {transaction.remarks && (
          <Text
            style={styles.transactionRemarks}
          >
            {transaction.remarks}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },

  loadingText: {
    color: Colors.textSecondary,
    marginTop: 10,
  },

  header: {
    height: 92,
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: Colors.text,
    fontSize: 19,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  content: {
    padding: 20,
  },

  hero: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    padding: 22,
    marginBottom: 12,
  },

  heroIcon: {
    width: 75,
    height: 75,
    borderRadius: 23,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  heroName: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 12,
  },

  heroMeta: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },

  stockGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  stockCard: {
    width: "48%",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
  },

  stockLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
  },

  stockValue: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },

  positive: {
    color: Colors.success,
  },

  negative: {
    color: Colors.danger,
  },

  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 15,
    marginBottom: 18,
  },

  sectionTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "800",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },

  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
  },

  infoValue: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "700",
    maxWidth: "55%",
    textAlign: "right",
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  historyCount: {
    color: Colors.textSecondary,
    fontSize: 10,
  },

  transaction: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 13,
    flexDirection: "row",
    marginBottom: 8,
  },

  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  transactionInfo: {
    flex: 1,
    marginLeft: 11,
  },

  transactionTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "800",
  },

  transactionDate: {
    color: Colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },

  transactionPlayer: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },

  transactionRemarks: {
    color: Colors.textLight,
    fontSize: 9,
    marginTop: 4,
  },

  empty: {
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    padding: 30,
  },

  emptyText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },

  bottomSpace: {
    height: 30,
  },
});