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
  FeePayment,
  PlayerFee,
  getFeeById,
  getPaymentHistory,
} from "../../src/database/repositories/feeRepository";
import { LinearGradient } from "expo-linear-gradient";

export default function FeeDetailsScreen() {
  const db = SQLite.useSQLiteContext();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [fee, setFee] =
    useState<PlayerFee | null>(null);

  const [payments, setPayments] =
    useState<FeePayment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadDetails = useCallback(
    async () => {
      try {
        setLoading(true);

        const feeId = Number(id);

        if (!feeId) {
          Alert.alert(
            "Error",
            "Invalid fee record."
          );
          router.back();
          return;
        }

        const feeData =
          await getFeeById(
            db,
            feeId
          );

        if (!feeData) {
          Alert.alert(
            "Not Found",
            "Fee record was not found."
          );

          router.back();
          return;
        }

        const paymentData =
          await getPaymentHistory(
            db,
            feeId
          );

        setFee(feeData);
        setPayments(paymentData);
      } catch (error) {
        console.error(
          "Fee details error:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to load fee details."
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
          Loading fee details...
        </Text>
      </View>
    );
  }

  if (!fee) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={Colors.white}
          />
        </TouchableOpacity>

        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>RPCA • PLAYER PROFILE</Text>
          <Text style={styles.headerTitle}>Fee Details</Text>
          <Text style={styles.headerSubtitle}>{fee.fee_month}</Text>
        </View>  
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        {/* PLAYER */}
        <View style={styles.playerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {fee.full_name
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              {fee.full_name}
            </Text>

            <Text style={styles.playerCode}>
              {fee.player_code}
            </Text>
          </View>
        </View>

        {/* STATUS */}
        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>
            Payment Status
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                fee.status === "paid" &&
                  styles.paidBadge,
                fee.status === "partial" &&
                  styles.partialBadge,
                fee.status === "pending" &&
                  styles.pendingBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  fee.status === "paid" &&
                    styles.paidText,
                  fee.status === "partial" &&
                    styles.partialText,
                  fee.status === "pending" &&
                    styles.pendingText,
                ]}
              >
                {fee.status
                  .charAt(0)
                  .toUpperCase() +
                  fee.status.slice(1)}
              </Text>
            </View>

            <Text style={styles.monthText}>
              {fee.fee_month}
            </Text>
          </View>
        </View>

        {/* AMOUNTS */}
        <View style={styles.amountCard}>
          <Text style={styles.sectionTitle}>
            Fee Summary
          </Text>

          <AmountRow
            label="Monthly Fee"
            value={fee.amount}
          />

          <AmountRow
            label="Paid Amount"
            value={fee.paid_amount}
            positive
          />

          <AmountRow
            label="Pending Amount"
            value={fee.pending_amount}
            negative={
              fee.pending_amount > 0
            }
          />

          {fee.due_date && (
            <View style={styles.dueDateRow}>
              <Text style={styles.dueLabel}>
                Due Date
              </Text>

              <Text style={styles.dueValue}>
                {fee.due_date}
              </Text>
            </View>
          )}
        </View>

        {/* PAYMENT HISTORY */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>
            Payment History
          </Text>

          <Text style={styles.paymentCount}>
            {payments.length} payment
            {payments.length !== 1
              ? "s"
              : ""}
          </Text>
        </View>

        {payments.length === 0 ? (
          <View style={styles.noPayment}>
            <Ionicons
              name="receipt-outline"
              size={35}
              color={Colors.primary}
            />

            <Text
              style={styles.noPaymentTitle}
            >
              No Payments Yet
            </Text>

            <Text
              style={styles.noPaymentText}
            >
              Payment history will appear
              here after a payment is recorded.
            </Text>
          </View>
        ) : (
          payments.map((payment) => (
            <PaymentCard
                key={payment.id}
                payment={payment}
                onReceipt={() =>
                    router.push(
                    `/fees/receipt?paymentId=${payment.id}`
                    )
                }
                />
          ))
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

function AmountRow({
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
    <View style={styles.amountRow}>
      <Text style={styles.amountLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.amountValue,
          positive &&
            styles.positiveValue,
          negative &&
            styles.negativeValue,
        ]}
      >
        ₹{value.toLocaleString("en-IN")}
      </Text>
    </View>
  );
}

function PaymentCard({
  payment,
  onReceipt,
}: {
  payment: FeePayment;
  onReceipt: () => void;
}) {
  return (
  <TouchableOpacity
    style={styles.paymentCard}
    onPress={onReceipt}
    activeOpacity={0.75}
  >
    <View style={styles.paymentIcon}>
      <Ionicons
        name="checkmark-circle"
        size={22}
        color={Colors.success}
      />
    </View>

    <View style={styles.paymentInfo}>
      <Text style={styles.paymentAmount}>
        ₹
        {payment.amount.toLocaleString(
          "en-IN"
        )}
      </Text>

      <Text style={styles.paymentDate}>
        {payment.payment_date}
      </Text>

      <Text style={styles.paymentMode}>
        {payment.payment_mode}
      </Text>

      {payment.transaction_reference && (
        <Text style={styles.reference}>
          Ref: {payment.transaction_reference}
        </Text>
      )}
    </View>

    <Ionicons
      name="chevron-forward"
      size={18}
      color={Colors.textLight}
    />
  </TouchableOpacity>
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
    minHeight: 102,
    paddingTop: 43,
    paddingHorizontal: 18,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

    headerButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerCopy: {
    flex: 1,
    marginHorizontal: 12,
  },

  headerEyebrow: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: Colors.white,
    fontSize: 11,
    marginTop: 3,
  },

  content: {
    padding: 20,
  },

  playerCard: {
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 17,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: "800",
  },

  playerInfo: {
    marginLeft: 13,
    flex: 1,
  },

  playerName: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "800",
  },

  playerCode: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 5,
  },

  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },

  sectionTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "800",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },

  statusBadge: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 12,
  },

  paidBadge: {
    backgroundColor: Colors.successLight,
  },

  partialBadge: {
    backgroundColor: Colors.primaryLight,
  },

  pendingBadge: {
    backgroundColor: Colors.dangerLight,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },

  paidText: {
    color: Colors.success,
  },

  partialText: {
    color: Colors.primary,
  },

  pendingText: {
    color: Colors.danger,
  },

  monthText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },

  amountCard: {
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 18,
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },

  amountLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },

  amountValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "800",
  },

  positiveValue: {
    color: Colors.success,
  },

  negativeValue: {
    color: Colors.danger,
  },

  dueDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 13,
  },

  dueLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },

  dueValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "700",
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  paymentCount: {
    color: Colors.textSecondary,
    fontSize: 10,
  },

  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },

  paymentInfo: {
    flex: 1,
    marginLeft: 11,
  },

  paymentAmount: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "800",
  },

  paymentDate: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  paymentMode: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },

  reference: {
    color: Colors.textLight,
    fontSize: 9,
    marginTop: 3,
  },

  receivedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },

  receivedText: {
    color: Colors.success,
    fontSize: 9,
    fontWeight: "700",
  },

  noPayment: {
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    padding: 30,
  },

  noPaymentTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
  },

  noPaymentText: {
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 5,
  },

  bottomSpace: {
    height: 30,
  },
});