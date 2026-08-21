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
  getPaymentWithFeeDetails,
} from "../../src/database/repositories/feeRepository";

import {
  generateFeeReceiptPdf,
  shareFeeReceiptPdf,
} from "../../src/utils/feeReceiptPdf";
import { LinearGradient } from "expo-linear-gradient";

function formatDate(date: string) {
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default function FeeReceiptScreen() {
  const db = SQLite.useSQLiteContext();

  const { paymentId } =
    useLocalSearchParams<{
      paymentId: string;
    }>();

  const [receipt, setReceipt] =
    useState<Awaited<
      ReturnType<
        typeof getPaymentWithFeeDetails
      >
    > | null>(null);

  const [loading, setLoading] =
    useState(true);

    const [generating, setGenerating] =
    useState(false);

    const [pdfUri, setPdfUri] =
    useState<string | null>(null);

  const loadReceipt = useCallback(
    async () => {
      try {
        setLoading(true);

        const id = Number(paymentId);

        if (!id) {
          Alert.alert(
            "Error",
            "Invalid payment."
          );

          router.back();
          return;
        }

        const data =
          await getPaymentWithFeeDetails(
            db,
            id
          );

        if (!data) {
          Alert.alert(
            "Not Found",
            "Payment receipt was not found."
          );

          router.back();
          return;
        }

        setReceipt(data);
      } catch (error) {
        console.error(
          "Receipt loading error:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to load receipt."
        );
      } finally {
        setLoading(false);
      }
    },
    [db, paymentId]
  );

  useFocusEffect(
    useCallback(() => {
      loadReceipt();
    }, [loadReceipt])
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Preparing receipt...
        </Text>
      </View>
    );
  }

  if (!receipt) {
    return null;
  }

  const receiptNumber =
    `RPCA-${String(
      receipt.payment_id
    ).padStart(6, "0")}`;

    async function handleGeneratePdf() {
    if (!receipt) {
        return;
    }

    try {
        setGenerating(true);

        const receiptNumber =
        `RPCA-${String(
            receipt.payment_id
        ).padStart(6, "0")}`;

        const uri =
        await generateFeeReceiptPdf({
            receiptNumber,

            academyName:
            "Reflex Pro Cricket Academy",

            academyShortName:
            "RPCA",

            playerName:
            receipt.full_name,

            playerCode:
            receipt.player_code,

            feeMonth:
            receipt.fee_month,

            receiptDate:
            formatDate(
                receipt.payment_date
            ),

            monthlyFee:
            receipt.fee_amount,

            amountPaid:
            receipt.payment_amount,

            pendingAmount:
            receipt.pending_amount,

            paymentMode:
            receipt.payment_mode,

            transactionReference:
            receipt.transaction_reference,
        });

        setPdfUri(uri);

        Alert.alert(
        "PDF Created",
        "Your RPCA fee receipt PDF has been generated."
        );
    } catch (error) {
        console.error(
        "PDF generation error:",
        error
        );

        Alert.alert(
        "PDF Error",
        "Unable to generate receipt PDF."
        );
    } finally {
        setGenerating(false);
    }
    }

    async function handleSharePdf() {
    if (!pdfUri) {
        await handleGeneratePdf();
        return;
    }

  try {
    await shareFeeReceiptPdf(
      pdfUri
    );
  } catch (error) {
    console.error(
      "PDF sharing error:",
      error
    );

    Alert.alert(
      "Share Error",
      "Unable to share receipt."
    );
  }
}

  return (
    <View style={styles.container}>
      {/* HEADER */}
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
          <Text style={styles.headerTitle}>Fee Receipt</Text>
          <Text style={styles.headerSubtitle}>Payment confirmation</Text>
        </View>  
      </LinearGradient>
      

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        {/* RECEIPT */}

        <View style={styles.receipt}>
          {/* ACADEMY */}

          <View style={styles.academy}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>
                RPCA
              </Text>
            </View>

            <Text style={styles.academyName}>
              REFLEX PRO CRICKET ACADEMY
            </Text>

            <Text style={styles.academySubtitle}>
              Professional Cricket Training
            </Text>
          </View>

          <View style={styles.receiptTitleBox}>
            <Text style={styles.receiptTitle}>
              FEE RECEIPT
            </Text>

            <Text style={styles.receiptNumber}>
              {receiptNumber}
            </Text>
          </View>

          {/* DATE */}

          <View style={styles.infoRow}>
            <InfoItem
              label="Receipt Date"
              value={formatDate(
                receipt.payment_date
              )}
            />

            <InfoItem
              label="Fee Month"
              value={receipt.fee_month}
            />
          </View>

          {/* PLAYER */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              PLAYER INFORMATION
            </Text>

            <ReceiptRow
              label="Player Name"
              value={receipt.full_name}
            />

            <ReceiptRow
              label="Player Code"
              value={receipt.player_code}
            />
          </View>

          {/* PAYMENT */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              PAYMENT INFORMATION
            </Text>

            <ReceiptRow
              label="Monthly Fee"
              value={`₹${receipt.fee_amount.toLocaleString(
                "en-IN"
              )}`}
            />

            <ReceiptRow
              label="Amount Paid"
              value={`₹${receipt.payment_amount.toLocaleString(
                "en-IN"
              )}`}
              strong
            />

            <ReceiptRow
              label="Payment Mode"
              value={receipt.payment_mode}
            />

            {receipt.transaction_reference && (
              <ReceiptRow
                label="Reference"
                value={
                  receipt.transaction_reference
                }
              />
            )}
          </View>

          {/* BALANCE */}

          <View style={styles.balanceBox}>
            <View>
              <Text style={styles.balanceLabel}>
                Remaining Balance
              </Text>

              <Text style={styles.balanceValue}>
                ₹
                {receipt.pending_amount.toLocaleString(
                  "en-IN"
                )}
              </Text>
            </View>

            <View style={styles.paidIcon}>
              <Ionicons
                name="checkmark"
                size={24}
                color={Colors.white}
              />
            </View>
          </View>

          {/* FOOTER */}

          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={Colors.success}
            />

            <Text style={styles.footerText}>
              Payment successfully recorded
            </Text>
          </View>

          <View style={styles.thankYou}>
            <Text style={styles.thankYouText}>
              Thank you for choosing RPCA
            </Text>
          </View>
        </View>

        {/* ACTIONS */}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleGeneratePdf}
            disabled={generating}
            >
            {generating ? (
                <ActivityIndicator
                size="small"
                color={Colors.primary}
                />
            ) : (
                <>
                <Ionicons
                    name="document-text-outline"
                    size={19}
                    color={Colors.primary}
                />

                <Text style={styles.downloadText}>
                    PDF Receipt
                </Text>
                </>
            )}
            </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleSharePdf}
            disabled={generating}
            >
            <Ionicons
                name="share-social-outline"
                size={19}
                color={Colors.white}
            />

            <Text style={styles.shareText}>
                Share Receipt
            </Text>
            
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function ReceiptRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.receiptValue,
          strong &&
            styles.receiptValueStrong,
        ]}
      >
        {value}
      </Text>
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

  receipt: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  academy: {
    alignItems: "center",
    paddingBottom: 18,
  },

  logo: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  logoText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "900",
  },

  academyName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  academySubtitle: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },

  receiptTitleBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    alignItems: "center",
  },

  receiptTitle: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
  },

  receiptNumber: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },

  infoRow: {
    flexDirection: "row",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },

  infoItem: {
    flex: 1,
  },

  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
  },

  infoValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  section: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },

  sectionTitle: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginBottom: 9,
  },

  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  receiptLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
  },

  receiptValue: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "600",
    maxWidth: "58%",
    textAlign: "right",
  },

  receiptValueStrong: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: "900",
  },

  balanceBox: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  balanceLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
  },

  balanceValue: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 3,
  },

  paidIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  footerText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 6,
  },

  thankYou: {
    alignItems: "center",
    marginTop: 14,
  },

  thankYouText: {
    color: Colors.textLight,
    fontSize: 10,
    fontStyle: "italic",
  },

  actions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 15,
  },

  downloadButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  downloadText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },

  shareButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  shareText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },

  bottomSpace: {
    height: 30,
  },
});