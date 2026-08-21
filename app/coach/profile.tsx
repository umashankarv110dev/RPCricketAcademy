import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { Colors } from "../../src/theme/colors";
import { useAuth } from "../../src/context/AuthContext";

export default function CoachProfile() {
  const { coach } = useAuth();

  const coachName = coach?.name ?? "Coach";
  const coachMobile = coach?.mobile ?? "Not available";
  const coachEmail = "Not available";

  const initials = coachName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join("");

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
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
            <Text style={styles.eyebrow}>RPCA ACADEMY</Text>
            <Text style={styles.headerTitle}>Coach Profile</Text>
            <Text style={styles.headerSubtitle}>
              Coach information & academy details
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
                router.push(
                    "/coach/edit"
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarShadow}>
            <LinearGradient
              colors={[Colors.primaryDark, Colors.primary]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {initials || "C"}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text
                style={styles.profileName}
                numberOfLines={1}
              >
                {coachName}
              </Text>

              <View style={styles.verifiedBadge}>
                <Ionicons
                  name="checkmark"
                  size={11}
                  color={Colors.white}
                />
              </View>
            </View>

            <Text style={styles.profileRole}>
              Cricket Coach
            </Text>

            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active Coach</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickStats}>
          <QuickStat
            icon="people-outline"
            value="Players"
            label="Assigned"
          />

          <View style={styles.statDivider} />

          <QuickStat
            icon="calendar-outline"
            value="Attendance"
            label="Manage"
          />

          <View style={styles.statDivider} />

          <QuickStat
            icon="shield-checkmark-outline"
            value="RPCA"
            label="Academy"
          />
        </View>

        <SectionHeader
          number="01"
          icon="person-outline"
          title="Personal Information"
          subtitle="Your basic contact details"
        />

        <View style={styles.card}>
          <InfoRow
            icon="person-outline"
            label="Full Name"
            value={coachName}
          />

          <InfoRow
            icon="call-outline"
            label="Mobile Number"
            value={coachMobile}
          />

          <InfoRow
            icon="mail-outline"
            label="Email Address"
            value={coachEmail}
            last
          />
        </View>

        <SectionHeader
          number="02"
          icon="baseball-outline"
          title="Coaching Profile"
          subtitle="Your role at RPCA"
        />

        <View style={styles.card}>
          <InfoRow
            icon="shield-checkmark-outline"
            label="Role"
            value="Cricket Coach"
          />

          <InfoRow
            icon="trophy-outline"
            label="Academy"
            value="Reflex Pro Cricket Academy"
          />

          <InfoRow
            icon="calendar-outline"
            label="Status"
            value="Active"
            valueType="success"
            last
          />
        </View>

        <SectionHeader
          number="03"
          icon="business-outline"
          title="Academy Information"
          subtitle="RPCA academy details"
        />

        <View style={styles.card}>
          <InfoRow
            icon="business-outline"
            label="Academy Name"
            value="Reflex Pro Cricket Academy"
          />

          <InfoRow
            icon="location-outline"
            label="Academy Code"
            value="RPCA"
          />

          <InfoRow
            icon="shield-outline"
            label="Access"
            value="Coach"
            last
          />
        </View>

        <View style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <Ionicons
              name="create-outline"
              size={20}
              color={Colors.primary}
            />
          </View>

          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>
              Keep your profile updated
            </Text>
            <Text style={styles.actionSubtitle}>
              Update your personal and coaching information when required.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionArrow}
            onPress={() => {
              // Edit Coach Profile — next step.
            }}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          RPCA • Reflex Pro Cricket Academy
        </Text>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

function SectionHeader({
  number,
  icon,
  title,
  subtitle,
}: {
  number: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={styles.sectionNumber}
      >
        <Text style={styles.sectionNumberText}>
          {number}
        </Text>
      </LinearGradient>

      <View style={styles.sectionIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={Colors.primary}
        />
      </View>

      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueType,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueType?: "success";
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && styles.infoRowBorder,
      ]}
    >
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={Colors.primary}
        />
      </View>

      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>
        <Text
          style={[
            styles.infoValue,
            valueType === "success" && styles.successValue,
          ]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>

      {valueType === "success" ? (
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            Active
          </Text>
        </View>
      ) : (
        <Ionicons
          name="chevron-forward"
          size={15}
          color={Colors.textLight}
        />
      )}
    </View>
  );
}

function QuickStat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.quickStat}>
      <View style={styles.quickStatIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={Colors.primary}
        />
      </View>

      <Text style={styles.quickStatValue}>
        {value}
      </Text>

      <Text style={styles.quickStatLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    paddingTop: Platform.OS === "ios" ? 58 : 42,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
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

  eyebrow: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 3,
  },

  headerTitle: {
    color: Colors.white,
    fontSize: 23,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 10,
    marginTop: 3,
  },

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  profileCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 21,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },

  avatarShadow: {
    borderRadius: 19,
    elevation: 3,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: Colors.white,
    fontSize: 25,
    fontWeight: "900",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 13,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileName: {
    flexShrink: 1,
    color: Colors.text,
    fontSize: 18,
    fontWeight: "900",
  },

  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  profileRole: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },

  activeBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 7,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 5,
  },

  activeText: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: "900",
  },

  quickStats: {
    minHeight: 82,
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  quickStat: {
    flex: 1,
    alignItems: "center",
  },

  quickStatIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },

  quickStatValue: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: "900",
  },

  quickStatLabel: {
    color: Colors.textSecondary,
    fontSize: 7,
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 11,
  },

  sectionNumber: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  sectionNumberText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "900",
  },

  sectionIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  sectionCopy: {
    flex: 1,
  },

  sectionTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 8,
    marginTop: 2,
  },

  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 19,
    paddingHorizontal: 15,
    overflow: "hidden",
  },

  infoRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  infoCopy: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 8,
    fontWeight: "700",
    marginBottom: 3,
  },

  infoValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "800",
  },

  successValue: {
    color: Colors.primary,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 5,
  },

  statusText: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: "900",
  },

  actionCard: {
    marginTop: 22,
    padding: 13,
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  actionCopy: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  actionTitle: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "900",
  },

  actionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },

  actionArrow: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  footerText: {
    textAlign: "center",
    color: Colors.textLight,
    fontSize: 8,
    fontWeight: "700",
    marginTop: 20,
  },

  bottomSpace: {
    height: 25,
  },
});
