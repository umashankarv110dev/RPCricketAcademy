import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import {
  router,
  useFocusEffect,
} from "expo-router";

import * as SQLite from "expo-sqlite";

import { Colors } from "../../src/theme/colors";

import {
  FeeStatus,
  PlayerFee,
  FeeSummary,
  getFeeSummary,
  getMonthlyFees,
  createOrUpdateFee,
  recordPayment,
  initializeMonthlyFees,
} from "../../src/database/repositories/feeRepository";

function getCurrentMonth() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatMonth(month: string) {
  const [year, monthNumber] =
    month.split("-");

  const date = new Date(
    Number(year),
    Number(monthNumber) - 1,
    1
  );

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function changeMonth(
  month: string,
  amount: number
) {
  const [year, monthNumber] =
    month.split("-");

  const date = new Date(
    Number(year),
    Number(monthNumber) - 1 + amount,
    1
  );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function today() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

export default function FeesScreen() {
  const db = SQLite.useSQLiteContext();

  const [month, setMonth] =
    useState(getCurrentMonth());

  const [fees, setFees] =
    useState<PlayerFee[]>([]);

  const [summary, setSummary] =
    useState<FeeSummary>({
      total_fee: 0,
      total_collected: 0,
      total_pending: 0,
      paid_players: 0,
      partial_players: 0,
      pending_players: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [paymentFee, setPaymentFee] =
    useState<PlayerFee | null>(null);

  const [feeModalVisible, setFeeModalVisible] =
    useState(false);

  const [paymentModalVisible, setPaymentModalVisible] =
    useState(false);

  const [feeAmount, setFeeAmount] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentMode, setPaymentMode] =
    useState("Cash");

  const [transactionReference, setTransactionReference] =
    useState("");

  const [selectedPlayer, setSelectedPlayer] =
    useState<PlayerFee | null>(null);

  const [saving, setSaving] =
    useState(false);

  const loadFees = useCallback(
    async () => {
      try {
        setLoading(true);

        await initializeMonthlyFees(
          db,
          month,
          0
        );

        const [
          feeData,
          summaryData,
        ] = await Promise.all([
          getMonthlyFees(db, month),
          getFeeSummary(db, month),
        ]);

        setFees(feeData);
        setSummary(summaryData);
      } catch (error) {
        console.error(
          "Fees loading error:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to load fees."
        );
      } finally {
        setLoading(false);
      }
    },
    [db, month]
  );

  useFocusEffect(
    useCallback(() => {
      loadFees();
    }, [loadFees])
  );

  function openFeeModal(
    player: PlayerFee
  ) {
    setSelectedPlayer(player);

    setFeeAmount(
      player.amount > 0
        ? String(player.amount)
        : ""
    );

    setDueDate(
      player.due_date ?? ""
    );

    setFeeModalVisible(true);
  }

  function openPaymentModal(
    player: PlayerFee
  ) {
    if (player.pending_amount <= 0) {
      Alert.alert(
        "Already Paid",
        "There is no pending amount for this player."
      );

      return;
    }

    setPaymentFee(player);

    setPaymentAmount(
      String(player.pending_amount)
    );

    setPaymentMode("Cash");
    setTransactionReference("");

    setPaymentModalVisible(true);
  }

  async function handleSaveFee() {
    if (!selectedPlayer) {
      return;
    }

    const amount =
      Number(feeAmount);

    if (!amount || amount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid fee amount."
      );

      return;
    }

    try {
      setSaving(true);

      await createOrUpdateFee(db, {
        playerId:
          selectedPlayer.player_id,
        feeMonth: month,
        amount,
        dueDate:
          dueDate || undefined,
      });

      setFeeModalVisible(false);

      await loadFees();

      Alert.alert(
        "Fee Saved",
        "Monthly fee has been saved."
      );
    } catch (error) {
      console.error(
        "Save fee error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to save fee."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePayment() {
    if (!paymentFee) {
      return;
    }

    const amount =
      Number(paymentAmount);

    if (!amount || amount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid payment amount."
      );

      return;
    }

    if (
      amount >
      paymentFee.pending_amount
    ) {
      Alert.alert(
        "Invalid Payment",
        "Payment cannot be greater than pending amount."
      );

      return;
    }

    try {
      setSaving(true);

      await recordPayment(db, {
        feeId: paymentFee.id,
        playerId:
          paymentFee.player_id,
        amount,
        paymentDate: today(),
        paymentMode,
        transactionReference:
          transactionReference ||
          undefined,
      });

      setPaymentModalVisible(false);

      await loadFees();

      Alert.alert(
        "Payment Recorded",
        `₹${amount.toLocaleString(
          "en-IN"
        )} payment has been recorded.`
      );
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      Alert.alert(
        "Payment Error",
        error instanceof Error
          ? error.message
          : "Unable to record payment."
      );
    } finally {
      setSaving(false);
    }
  }

  const collectionPercentage =
    useMemo(() => {
      if (!summary.total_fee) {
        return 0;
      }

      return Math.round(
        (summary.total_collected /
          summary.total_fee) *
          100
      );
    }, [summary]);

  return (
  <View style={styles.container}>
    {loading ? (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading fees...
        </Text>
      </View>
    ) : (
      <FlatList
        data={fees}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <LinearGradient
              colors={[Colors.primaryDark, Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <View style={styles.headerTop}>
                <View style={styles.headerCopy}>
                  <Text style={styles.headerEyebrow}>
                    RPCA ACADEMY
                  </Text>

                  <Text style={styles.title}>
                    Fee Management
                  </Text>

                  <Text style={styles.subtitle}>
                    Track collections, pending dues & payments
                  </Text>
                </View>

                <View style={styles.headerIcon}>
                  <Ionicons
                    name="wallet-outline"
                    size={25}
                    color={Colors.primary}
                  />
                </View>
              </View>

              <View style={styles.headerInsight}>
                <View style={styles.insightIcon}>
                  <Ionicons
                    name="trending-up-outline"
                    size={17}
                    color={Colors.primary}
                  />
                </View>

                <View style={styles.insightCopy}>
                  <Text style={styles.insightLabel}>
                    COLLECTION THIS MONTH
                  </Text>

                  <Text style={styles.insightValue}>
                    {collectionPercentage}% collected
                  </Text>
                </View>

                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />

                  <Text style={styles.liveText}>
                    LIVE
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* MONTH SELECTOR */}
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() =>
                  setMonth(changeMonth(month, -1))
                }
              >
                <Ionicons
                  name="chevron-back"
                  size={21}
                  color={Colors.text}
                />
              </TouchableOpacity>

              <View style={styles.monthCenter}>
                <Text style={styles.monthLabel}>
                  Fee Month
                </Text>

                <Text style={styles.monthText}>
                  {formatMonth(month)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() =>
                  setMonth(changeMonth(month, 1))
                }
              >
                <Ionicons
                  name="chevron-forward"
                  size={21}
                  color={Colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* SUMMARY */}
            <View style={styles.summaryGrid}>
              <MoneyCard
                label="Total Fee"
                value={summary.total_fee}
                icon="receipt-outline"
              />

              <MoneyCard
                label="Collected"
                value={summary.total_collected}
                icon="checkmark-circle-outline"
              />

              <MoneyCard
                label="Pending"
                value={summary.total_pending}
                icon="alert-circle-outline"
              />

              <MoneyCard
                label="Collection"
                value={collectionPercentage}
                suffix="%"
                icon="trending-up-outline"
              />
            </View>

            {/* PAYMENT STATUS */}
            <View style={styles.playerSummary}>
              <Text style={styles.summaryTitle}>
                Payment Status
              </Text>

              <View style={styles.statusSummaryRow}>
                <StatusCount
                  label="Paid"
                  value={summary.paid_players}
                  type="paid"
                />

                <StatusCount
                  label="Partial"
                  value={summary.partial_players}
                  type="partial"
                />

                <StatusCount
                  label="Pending"
                  value={summary.pending_players}
                  type="pending"
                />
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <FeeCard
            fee={item}
            onSetFee={() => openFeeModal(item)}
            onPayment={() => openPaymentModal(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="wallet-outline"
                size={40}
                color={Colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No Fee Records
            </Text>

            <Text style={styles.emptyText}>
              Set monthly fees for players
              to start tracking payments.
            </Text>
          </View>
        }
      />
    )}

    {/* MODALS MUST NOT BE INSIDE FlatList */}
    <FeeModal
      visible={feeModalVisible}
      player={selectedPlayer}
      amount={feeAmount}
      setAmount={setFeeAmount}
      dueDate={dueDate}
      setDueDate={setDueDate}
      saving={saving}
      onClose={() => setFeeModalVisible(false)}
      onSave={handleSaveFee}
    />

    <PaymentModal
      visible={paymentModalVisible}
      player={paymentFee}
      amount={paymentAmount}
      setAmount={setPaymentAmount}
      paymentMode={paymentMode}
      setPaymentMode={setPaymentMode}
      transactionReference={transactionReference}
      setTransactionReference={setTransactionReference}
      saving={saving}
      onClose={() => setPaymentModalVisible(false)}
      onSave={handlePayment}
    />
  </View>
);
}

function FeeCard({
  fee,
  onSetFee,
  onPayment,
}: {
  fee: PlayerFee;
  onSetFee: () => void;
  onPayment: () => void;
}) {
  return (
    <View style={styles.feeCard}>
      <TouchableOpacity
        style={styles.playerTop}
        onPress={() =>
          router.push(
            `/fees/details?id=${fee.id}`
          )
        }
      >
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

        <FeeStatusBadge
          status={fee.status}
        />
      </TouchableOpacity>

      <View style={styles.amountRow}>
        <AmountItem
          label="Fee"
          value={fee.amount}
        />

        <AmountItem
          label="Paid"
          value={fee.paid_amount}
          positive
        />

        <AmountItem
          label="Pending"
          value={fee.pending_amount}
          negative={
            fee.pending_amount > 0
          }
        />
      </View>

      <View style={styles.feeActions}>
        <TouchableOpacity
          style={styles.setFeeButton}
          onPress={onSetFee}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={Colors.primary}
          />

          <Text style={styles.setFeeText}>
            Set Fee
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentButton,
            fee.pending_amount <= 0 &&
              styles.paymentDisabled,
          ]}
          onPress={onPayment}
          disabled={
            fee.pending_amount <= 0
          }
        >
          <Ionicons
            name="cash-outline"
            size={16}
            color={Colors.white}
          />

          <Text style={styles.paymentText}>
            Record Payment
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeeStatusBadge({
  status,
}: {
  status: FeeStatus;
}) {
  const config = {
    paid: {
      label: "Paid",
      background:
        Colors.successLight,
      text: Colors.success,
    },

    partial: {
      label: "Partial",
      background:
        Colors.primaryLight,
      text: Colors.primary,
    },

    pending: {
      label: "Pending",
      background:
        Colors.dangerLight,
      text: Colors.danger,
    },
  };

  const item = config[status];

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            item.background,
        },
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          {
            color: item.text,
          },
        ]}
      >
        {item.label}
      </Text>
    </View>
  );
}

function AmountItem({
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
    <View style={styles.amountItem}>
      <Text style={styles.amountLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.amountValue,
          positive &&
            styles.amountPositive,
          negative &&
            styles.amountNegative,
        ]}
      >
        ₹{value.toLocaleString("en-IN")}
      </Text>
    </View>
  );
}

function MoneyCard({
  label,
  value,
  suffix = "",
  icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.moneyCard}>
      <Ionicons
        name={icon}
        size={18}
        color={Colors.primary}
      />

      <Text style={styles.moneyValue}>
        {suffix
          ? `${value}${suffix}`
          : `₹${value.toLocaleString(
              "en-IN"
            )}`}
      </Text>

      <Text style={styles.moneyLabel}>
        {label}
      </Text>
    </View>
  );
}

function StatusCount({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type: "paid" | "partial" | "pending";
}) {
  return (
    <View style={styles.statusCount}>
      <View
        style={[
          styles.statusDot,
          type === "paid" &&
            styles.paidDot,
          type === "partial" &&
            styles.partialDot,
          type === "pending" &&
            styles.pendingDot,
        ]}
      />

      <Text style={styles.statusCountValue}>
        {value}
      </Text>

      <Text style={styles.statusCountLabel}>
        {label}
      </Text>
    </View>
  );
}

function FeeModal({
  visible,
  player,
  amount,
  setAmount,
  dueDate,
  setDueDate,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  player: PlayerFee | null;
  amount: string;
  setAmount: (value: string) => void;
  dueDate: string;
  setDueDate: (value: string) => void;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                Set Monthly Fee
              </Text>

              <Text style={styles.modalSubtitle}>
                {player?.full_name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
            >
              <Ionicons
                name="close-circle"
                size={28}
                color={Colors.textLight}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>
            Fee Amount
          </Text>

          <TextInput
            style={styles.modalInput}
            value={amount}
            onChangeText={(value) =>
              setAmount(
                value.replace(
                  /[^0-9.]/g,
                  ""
                )
              )
            }
            placeholder="e.g. 2500"
            placeholderTextColor={
              Colors.textLight
            }
            keyboardType="decimal-pad"
          />

          <Text style={styles.inputLabel}>
            Due Date
          </Text>

          <TextInput
            style={styles.modalInput}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={
              Colors.textLight
            }
          />

          <TouchableOpacity
            style={styles.modalSave}
            onPress={onSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator
                color={Colors.white}
              />
            ) : (
              <>
                <Ionicons
                  name="save-outline"
                  size={19}
                  color={Colors.white}
                />

                <Text style={styles.modalSaveText}>
                  Save Fee
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PaymentModal({
  visible,
  player,
  amount,
  setAmount,
  paymentMode,
  setPaymentMode,
  transactionReference,
  setTransactionReference,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  player: PlayerFee | null;
  amount: string;
  setAmount: (value: string) => void;
  paymentMode: string;
  setPaymentMode: (value: string) => void;
  transactionReference: string;
  setTransactionReference: (
    value: string
  ) => void;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Record Payment
                </Text>

                <Text style={styles.modalSubtitle}>
                  {player?.full_name}
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.pendingBox}>
              <Text style={styles.pendingLabel}>
                Pending Amount
              </Text>

              <Text style={styles.pendingValue}>
                ₹
                {player?.pending_amount.toLocaleString(
                  "en-IN"
                )}
              </Text>
            </View>

            <Text style={styles.inputLabel}>
              Payment Amount
            </Text>

            <TextInput
              style={styles.modalInput}
              value={amount}
              onChangeText={(value) =>
                setAmount(
                  value.replace(
                    /[^0-9.]/g,
                    ""
                  )
                )
              }
              placeholder="Enter amount"
              placeholderTextColor={
                Colors.textLight
              }
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>
              Payment Mode
            </Text>

            <View style={styles.paymentModes}>
              {[
                "Cash",
                "UPI",
                "Bank Transfer",
                "Cheque",
              ].map((mode) => {
                const selected =
                  paymentMode === mode;

                return (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.paymentMode,
                      selected &&
                        styles.paymentModeSelected,
                    ]}
                    onPress={() =>
                      setPaymentMode(mode)
                    }
                  >
                    <Text
                      style={[
                        styles.paymentModeText,
                        selected &&
                          styles.paymentModeTextSelected,
                      ]}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>
              Transaction Reference
            </Text>

            <TextInput
              style={styles.modalInput}
              value={transactionReference}
              onChangeText={
                setTransactionReference
              }
              placeholder="Optional"
              placeholderTextColor={
                Colors.textLight
              }
            />

            <TouchableOpacity
              style={styles.modalSave}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  color={Colors.white}
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={19}
                    color={Colors.white}
                  />

                  <Text
                    style={styles.modalSaveText}
                  >
                    Record Payment
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* =========================
     HEADER
  ========================= */

  header: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  headerCopy: {
    flex: 1,
    paddingRight: 14,
  },

  headerEyebrow: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 3,
  },

  title: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  subtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    marginTop: 4,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },

  headerInsight: {
    marginTop: 18,
    padding: 10,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    flexDirection: "row",
    alignItems: "center",
  },

  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  insightCopy: {
    flex: 1,
    marginLeft: 9,
  },

  insightLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  insightValue: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#6EE7B7",
    marginRight: 4,
  },

  liveText: {
    color: Colors.white,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  /* =========================
     MONTH
  ========================= */

  monthSelector: {
    height: 70,
    marginTop: 14,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },

  monthArrow: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  monthCenter: {
    alignItems: "center",
    flex: 1,
  },

  monthLabel: {
    color: Colors.textSecondary,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  monthText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },

  /* =========================
     FINANCIAL SUMMARY
  ========================= */

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 11,
  },

  moneyCard: {
    width: "48%",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 13,
    minHeight: 92,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },

  moneyValue: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 7,
  },

  moneyLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
  },

  /* =========================
     STATUS SUMMARY
  ========================= */

  playerSummary: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 13,
    marginBottom: 12,
  },

  summaryTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 11,
  },

  statusSummaryRow: {
    flexDirection: "row",
  },

  statusCount: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },

  paidDot: {
    backgroundColor: Colors.success,
  },

  partialDot: {
    backgroundColor: Colors.primary,
  },

  pendingDot: {
    backgroundColor: Colors.danger,
  },

  statusCountValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginRight: 4,
  },

  statusCountLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: "600",
  },

  /* =========================
     LIST
  ========================= */

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 10,
  },

  /* =========================
     FEE CARD
  ========================= */

  feeCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },

  playerTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },

  playerInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  playerName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "900",
  },

  playerCode: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  amountRow: {
    flexDirection: "row",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },

  amountItem: {
    flex: 1,
  },

  amountLabel: {
    color: Colors.textSecondary,
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  amountValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },

  amountPositive: {
    color: Colors.success,
  },

  amountNegative: {
    color: Colors.danger,
  },

  feeActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  setFeeButton: {
    flex: 1,
    height: 43,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  setFeeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 5,
  },

  paymentButton: {
    flex: 1.4,
    height: 43,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },

  paymentDisabled: {
    opacity: 0.38,
  },

  paymentText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 5,
  },

  /* =========================
     EMPTY
  ========================= */

  empty: {
    alignItems: "center",
    paddingTop: 65,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 29,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  emptyTitle: {
    color: Colors.text,
    fontSize: 19,
    fontWeight: "900",
  },

  emptyText: {
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 7,
  },

  /* =========================
     MODALS
  ========================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    padding: 20,
    maxHeight: "88%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 19,
  },

  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },

  inputLabel: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 7,
    marginTop: 10,
  },

  modalInput: {
    height: 51,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 13,
    paddingHorizontal: 14,
    color: Colors.text,
    fontSize: 14,
  },

  modalSave: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },

  modalSaveText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 7,
  },

  pendingBox: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginBottom: 3,
  },

  pendingLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },

  pendingValue: {
    color: Colors.danger,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 3,
  },

  paymentModes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  paymentMode: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },

  paymentModeSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  paymentModeText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  paymentModeTextSelected: {
    color: Colors.white,
  },
});