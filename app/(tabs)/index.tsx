import React, {
  useCallback,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
} from "expo-router";

import * as SQLite from "expo-sqlite";

import {
  Colors,
} from "../../src/theme/colors";

import {
  useAuth,
} from "../../src/context/AuthContext";

import {
  DashboardStats,
  getDashboardStats,
} from "../../src/database/repositories/dashboardRepository";


/* =========================================================
   DATE
========================================================= */

function getTodayDisplayDate() {
  return new Date().toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const { coach } = useAuth();

  const db =
    SQLite.useSQLiteContext();

  const [stats, setStats] =
    useState<DashboardStats>({
      totalPlayers: 0,

      presentToday: 0,
      absentToday: 0,
      halfDayToday: 0,
      notMarkedToday: 0,

      attendancePercentage: 0,

      pendingFees: 0,
      feesCollectedThisMonth: 0,

      totalEquipment: 0,
      availableEquipment: 0,
      issuedEquipment: 0,
      damagedEquipment: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const loadDashboard =
    useCallback(async () => {
      try {
        const data =
          await getDashboardStats(db);

        setStats(data);
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }, [db]);

  /*
   * Refresh dashboard whenever
   * screen becomes active.
   */

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );


  /* =========================================================
     NAVIGATION
  ========================================================= */

  const goToAddPlayer = () => {
    router.push("/players/add");
  };

  const goToAttendance = () => {
    router.push("/(tabs)/attendance");
  };

  const goToFees = () => {
    router.push("/(tabs)/fees");
  };

  const goToEquipment = () => {
    /*
     * Correct route.
     *
     * Your previous route:
     * /equipment/equipment
     *
     * was incorrect.
     */

    router.push("/equipment/equipment");
  };


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={false}
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <LinearGradient
        colors={[
          Colors.primaryDark,
          Colors.primary,
        ]}
        style={styles.header}
      >

        <View style={styles.headerTop}>

          <View style={styles.headerInfo}>

            <Text style={styles.welcome}>
              Welcome back,{" "}
              {coach?.name ?? "Coach"} 👋
            </Text>

            <Text style={styles.academyName}>
              R.P.C.A
            </Text>

            <Text
              style={
                styles.academyFullName
              }
            >
              Reflex Pro Cricket Academy
            </Text>

            <View
              style={styles.roleBadge}
            >

              <Ionicons
                name="person-outline"
                size={12}
                color={Colors.primary}
              />

              <Text
                style={
                  styles.roleBadgeText
                }
              >
                Coach
              </Text>

            </View>

          </View>


          <TouchableOpacity
            style={
              styles.notificationButton
            }
            onPress={() =>
              router.push(
                "/notifications/notification"
              )
            }
            activeOpacity={0.8}
          >

            <Ionicons
              name="notifications-outline"
              size={23}
              color={Colors.white}
            />

            <View
              style={
                styles.notificationDot
              }
            />

          </TouchableOpacity>

        </View>

      </LinearGradient>


      {/* =====================================================
          LIVE STATUS
      ===================================================== */}

      <View style={styles.liveBar}>

        <View style={styles.liveLeft}>

          <View style={styles.liveDot} />

          <Text style={styles.liveText}>
            LIVE DATA
          </Text>

        </View>

        {loading ? (
          <View
            style={styles.refreshing}
          >

            <ActivityIndicator
              size="small"
              color={Colors.primary}
            />

            <Text
              style={styles.refreshText}
            >
              Updating...
            </Text>

          </View>
        ) : (
          <Text style={styles.updatedText}>
            Just updated
          </Text>
        )}

      </View>


      {/* =====================================================
          ACADEMY OVERVIEW
      ===================================================== */}

      <View
        style={styles.sectionHeader}
      >

        <View>

          <Text
            style={styles.sectionTitle}
          >
            Academy Overview
          </Text>

          <Text
            style={styles.sectionSubtitle}
          >
            Today's academy performance
          </Text>

        </View>

      </View>


      <View style={styles.statsGrid}>

        <StatCard
          title="Total Players"
          value={
            stats.totalPlayers.toString()
          }
          icon="people"
          subtitle="Active players"
        />

        <StatCard
          title="Present Today"
          value={
            stats.presentToday.toString()
          }
          icon="checkmark-circle"
          subtitle={`${stats.attendancePercentage}% attendance`}
          positive
        />

        <StatCard
          title="Absent Today"
          value={
            stats.absentToday.toString()
          }
          icon="close-circle"
          subtitle="Need follow-up"
          danger
        />

        <StatCard
          title="Pending Fees"
          value={`₹${stats.pendingFees.toLocaleString(
            "en-IN"
          )}`}
          icon="wallet"
          subtitle="Outstanding"
          warning
        />

      </View>


      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <View
        style={styles.sectionHeader}
      >

        <View>

          <Text
            style={styles.sectionTitle}
          >
            Quick Actions
          </Text>

          <Text
            style={styles.sectionSubtitle}
          >
            Manage academy activities
          </Text>

        </View>

      </View>


      <View
        style={styles.actionsCard}
      >

        <Action
          icon="person-add"
          title="Add Player"
          subtitle="Register"
          onPress={goToAddPlayer}
        />

        <Action
          icon="calendar"
          title="Attendance"
          subtitle="Mark today"
          onPress={goToAttendance}
        />

        <Action
          icon="cash"
          title="Collect Fee"
          subtitle="Payments"
          onPress={goToFees}
        />

        <Action
          icon="baseball"
          title="Equipment"
          subtitle="Stock"
          onPress={goToEquipment}
        />

      </View>


      {/* =====================================================
          ATTENDANCE
      ===================================================== */}

      <View
        style={styles.sectionHeader}
      >

        <View>

          <Text
            style={styles.sectionTitle}
          >
            Today's Attendance
          </Text>

          <Text
            style={styles.sectionSubtitle}
          >
            {getTodayDisplayDate()}
          </Text>

        </View>


        <TouchableOpacity
          style={styles.viewButton}
          onPress={goToAttendance}
          activeOpacity={0.7}
        >

          <Text
            style={styles.viewButtonText}
          >
            View
          </Text>

          <Ionicons
            name="chevron-forward"
            size={14}
            color={Colors.primary}
          />

        </TouchableOpacity>

      </View>


      <View
        style={styles.attendanceCard}
      >

        <View
          style={styles.attendanceTop}
        >

          <View>

            <Text
              style={styles.attendanceTitle}
            >
              Attendance Rate
            </Text>

            <View
              style={styles.rateRow}
            >

              <Text
                style={styles.rateValue}
              >
                {stats.attendancePercentage}%
              </Text>

            </View>

          </View>


          <View
            style={styles.attendanceCircle}
          >

            <Ionicons
              name="checkmark"
              size={25}
              color={Colors.success}
            />

          </View>

        </View>


        {/* PROGRESS */}

        <View
          style={styles.progressTrack}
        >

          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  stats.attendancePercentage,
                  100
                )}%`,
              },
            ]}
          />

        </View>


        {/* ATTENDANCE STATS */}

        <View
          style={styles.attendanceRow}
        >

          <AttendanceStat
            value={
              stats.presentToday.toString()
            }
            label="Present"
            icon="checkmark-circle"
            positive
          />

          <AttendanceStat
            value={
              stats.absentToday.toString()
            }
            label="Absent"
            icon="close-circle"
            danger
          />

          <AttendanceStat
            value={
              stats.halfDayToday.toString()
            }
            label="Half Day"
            icon="time"
            warning
          />

          <AttendanceStat
            value={
              stats.notMarkedToday.toString()
            }
            label="Not Marked"
            icon="help-circle"
          />

        </View>

      </View>


      {/* =====================================================
          ACADEMY PULSE
      ===================================================== */}

      <View
        style={styles.sectionHeader}
      >

        <View>

          <Text
            style={styles.sectionTitle}
          >
            Academy Pulse
          </Text>

          <Text
            style={styles.sectionSubtitle}
          >
            Live academy summary
          </Text>

        </View>

      </View>


      <View
        style={styles.pulseCard}
      >

        <PulseRow
          icon="people-outline"
          title="Active Players"
          value={
            stats.totalPlayers.toString()
          }
          description="Across all batches"
        />


        <View
          style={styles.divider}
        />


        <PulseRow
          icon="cash-outline"
          title="Fees Collected"
          value={`₹${stats.feesCollectedThisMonth.toLocaleString(
            "en-IN"
          )}`}
          description="This month"
        />


        <View
          style={styles.divider}
        />


        <PulseRow
          icon="wallet-outline"
          title="Pending Fees"
          value={`₹${stats.pendingFees.toLocaleString(
            "en-IN"
          )}`}
          description="Outstanding amount"
          danger={
            stats.pendingFees > 0
          }
        />


        <View
          style={styles.divider}
        />


        <PulseRow
          icon="baseball-outline"
          title="Equipment"
          value={
            stats.totalEquipment.toString()
          }
          description={`${stats.availableEquipment} available • ${stats.issuedEquipment} issued`}
        />


        <View
          style={styles.divider}
        />


        <PulseRow
          icon="warning-outline"
          title="Damaged Equipment"
          value={
            stats.damagedEquipment.toString()
          }
          description="Needs attention"
          danger={
            stats.damagedEquipment > 0
          }
        />

      </View>


      <View
        style={styles.bottomSpace}
      />

    </ScrollView>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
  subtitle,
  positive,
  danger,
  warning,
}: {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
  positive?: boolean;
  danger?: boolean;
  warning?: boolean;
}) {
  const iconColor =
    danger
      ? Colors.danger
      : warning
        ? Colors.primary
        : Colors.primary;

  return (
    <View
      style={styles.statCard}
    >

      <View
        style={styles.statTop}
      >

        <View
          style={[
            styles.statIcon,
            danger &&
              styles.statIconDanger,
            warning &&
              styles.statIconWarning,
          ]}
        >

          <Ionicons
            name={icon}
            size={19}
            color={iconColor}
          />

        </View>


        {positive && (
          <View
            style={styles.trendBadge}
          >

            <Ionicons
              name="trending-up"
              size={10}
              color={Colors.success}
            />

            <Text
              style={styles.trendText}
            >
              Good
            </Text>

          </View>
        )}

      </View>


      <Text
        style={styles.statValue}
      >
        {value}
      </Text>


      <Text
        style={styles.statTitle}
      >
        {title}
      </Text>


      <Text
        style={styles.statSubtitle}
      >
        {subtitle}
      </Text>

    </View>
  );
}


/* =========================================================
   QUICK ACTION
========================================================= */

function Action({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.action}
      onPress={onPress}
      activeOpacity={0.7}
    >

      <View
        style={styles.actionIcon}
      >

        <Ionicons
          name={icon}
          size={21}
          color={Colors.primary}
        />

      </View>


      <Text
        style={styles.actionText}
        numberOfLines={1}
      >
        {title}
      </Text>


      <Text
        style={styles.actionSubtitle}
        numberOfLines={1}
      >
        {subtitle}
      </Text>

    </TouchableOpacity>
  );
}


/* =========================================================
   ATTENDANCE STAT
========================================================= */

function AttendanceStat({
  value,
  label,
  icon,
  positive,
  danger,
  warning,
}: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  positive?: boolean;
  danger?: boolean;
  warning?: boolean;
}) {
  return (
    <View
      style={styles.attendanceStat}
    >

      <View
        style={[
          styles.attendanceIcon,
          positive &&
            styles.attendanceIconPositive,
          danger &&
            styles.attendanceIconDanger,
          warning &&
            styles.attendanceIconWarning,
        ]}
      >

        <Ionicons
          name={icon}
          size={13}
          color={
            danger
              ? Colors.danger
              : warning
                ? Colors.primary
                : positive
                  ? Colors.success
                  : Colors.textSecondary
          }
        />

      </View>


      <Text
        style={styles.attendanceValue}
      >
        {value}
      </Text>


      <Text
        style={styles.attendanceLabel}
      >
        {label}
      </Text>

    </View>
  );
}


/* =========================================================
   PULSE ROW
========================================================= */

function PulseRow({
  icon,
  title,
  value,
  description,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <View
      style={styles.pulseRow}
    >

      <View
        style={[
          styles.pulseIcon,
          danger &&
            styles.pulseIconDanger,
        ]}
      >

        <Ionicons
          name={icon}
          size={20}
          color={
            danger
              ? Colors.danger
              : Colors.primary
          }
        />

      </View>


      <View
        style={styles.pulseInfo}
      >

        <Text
          style={styles.pulseTitle}
        >
          {title}
        </Text>

        <Text
          style={styles.pulseDescription}
          numberOfLines={1}
        >
          {description}
        </Text>

      </View>


      <Text
        style={[
          styles.pulseValue,
          danger &&
            styles.pulseValueDanger,
        ]}
      >
        {value}
      </Text>

    </View>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        Colors.background,
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 35,
    },


    /* HEADER */

    header: {
      marginHorizontal: -20,
      marginTop: -18,

      paddingHorizontal: 20,
      paddingTop: 48,
      paddingBottom: 25,

      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,

      overflow: "hidden",
    },

    headerTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent:
        "space-between",
    },

    headerInfo: {
      flex: 1,
      paddingRight: 15,
    },

    welcome: {
      color:
        "rgba(255,255,255,0.82)",
      fontSize: 12,
      fontWeight: "500",
    },

    academyName: {
      color: Colors.white,
      fontSize: 29,
      fontWeight: "900",
      letterSpacing: 1.2,
      marginTop: 3,
    },

    academyFullName: {
      color:
        "rgba(255,255,255,0.88)",
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },

    roleBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.white,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      marginTop: 11,
    },

    roleBadgeText: {
      color: Colors.primary,
      fontSize: 9,
      fontWeight: "800",
      marginLeft: 5,
    },

    notificationButton: {
      width: 44,
      height: 44,
      borderRadius: 14,

      backgroundColor:
        "rgba(255,255,255,0.16)",

      borderWidth: 1,

      borderColor:
        "rgba(255,255,255,0.25)",

      alignItems: "center",
      justifyContent: "center",

      position: "relative",
    },

    notificationDot: {
      position: "absolute",

      top: 9,
      right: 9,

      width: 7,
      height: 7,

      borderRadius: 4,

      backgroundColor:
        "#FFD54F",

      borderWidth: 1.5,

      borderColor:
        Colors.primary,
    },


    /* LIVE BAR */

    liveBar: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",

      marginTop: 14,

      paddingHorizontal: 11,
      paddingVertical: 8,

      backgroundColor:
        Colors.white,

      borderWidth: 1,
      borderColor:
        Colors.border,

      borderRadius: 11,
    },

    liveLeft: {
      flexDirection: "row",
      alignItems: "center",
    },

    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor:
        Colors.success,
      marginRight: 6,
    },

    liveText: {
      color: Colors.primary,
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.5,
    },

    updatedText: {
      color: Colors.textSecondary,
      fontSize: 8,
    },

    refreshing: {
      flexDirection: "row",
      alignItems: "center",
    },

    refreshText: {
      color: Colors.textSecondary,
      fontSize: 8,
      marginLeft: 5,
    },


    /* SECTION */

    sectionHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent:
        "space-between",

      marginTop: 25,
      marginBottom: 13,
    },

    sectionTitle: {
      color: Colors.text,
      fontSize: 17,
      fontWeight: "900",
    },

    sectionSubtitle: {
      color:
        Colors.textSecondary,
      fontSize: 10,
      marginTop: 3,
    },


    /* STATS */

    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "space-between",
      rowGap: 10,
    },

    statCard: {
      width: "48.5%",

      backgroundColor:
        Colors.white,

      borderRadius: 17,

      padding: 14,

      borderWidth: 1,
      borderColor:
        Colors.border,
    },

    statTop: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    statIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",
      justifyContent: "center",
    },

    statIconDanger: {
      backgroundColor:
        Colors.dangerLight,
    },

    statIconWarning: {
      backgroundColor:
        Colors.primaryLight,
    },

    trendBadge: {
      flexDirection: "row",
      alignItems: "center",

      backgroundColor:
        Colors.successLight,

      paddingHorizontal: 6,
      paddingVertical: 4,

      borderRadius: 8,
    },

    trendText: {
      color: Colors.success,
      fontSize: 7,
      fontWeight: "800",
      marginLeft: 2,
    },

    statValue: {
      color: Colors.text,
      fontSize: 22,
      fontWeight: "900",
      marginTop: 11,
    },

    statTitle: {
      color: Colors.text,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 3,
    },

    statSubtitle: {
      color:
        Colors.textSecondary,
      fontSize: 9,
      marginTop: 3,
    },


    /* ACTIONS */

    actionsCard: {
      backgroundColor:
        Colors.white,

      borderWidth: 1,
      borderColor:
        Colors.border,

      borderRadius: 18,

      paddingVertical: 16,
      paddingHorizontal: 8,

      flexDirection: "row",
      justifyContent:
        "space-between",
    },

    action: {
      width: "25%",
      alignItems: "center",
    },

    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",
      justifyContent: "center",
    },

    actionText: {
      color: Colors.text,
      fontSize: 10,
      fontWeight: "800",
      textAlign: "center",
      marginTop: 7,
    },

    actionSubtitle: {
      color:
        Colors.textSecondary,
      fontSize: 8,
      textAlign: "center",
      marginTop: 2,
    },


    /* VIEW */

    viewButton: {
      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 9,
      paddingVertical: 6,

      backgroundColor:
        Colors.primaryLight,

      borderRadius: 9,
    },

    viewButtonText: {
      color: Colors.primary,
      fontSize: 9,
      fontWeight: "800",
      marginRight: 2,
    },


    /* ATTENDANCE */

    attendanceCard: {
      backgroundColor:
        Colors.white,

      borderRadius: 18,

      padding: 17,

      borderWidth: 1,
      borderColor:
        Colors.border,
    },

    attendanceTop: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    attendanceTitle: {
      color:
        Colors.textSecondary,
      fontSize: 10,
      fontWeight: "600",
    },

    rateRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },

    rateValue: {
      color: Colors.text,
      fontSize: 27,
      fontWeight: "900",
    },

    attendanceCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,

      backgroundColor:
        Colors.successLight,

      alignItems: "center",
      justifyContent: "center",
    },

    progressTrack: {
      height: 7,

      backgroundColor:
        Colors.background,

      borderRadius: 10,

      overflow: "hidden",

      marginTop: 17,
    },

    progressFill: {
      height: "100%",

      backgroundColor:
        Colors.success,

      borderRadius: 10,
    },

    attendanceRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginTop: 18,
    },

    attendanceStat: {
      alignItems: "center",
      minWidth: 55,
    },

    attendanceIcon: {
      width: 25,
      height: 25,
      borderRadius: 8,

      backgroundColor:
        Colors.background,

      alignItems: "center",
      justifyContent: "center",

      marginBottom: 4,
    },

    attendanceIconPositive: {
      backgroundColor:
        Colors.successLight,
    },

    attendanceIconDanger: {
      backgroundColor:
        Colors.dangerLight,
    },

    attendanceIconWarning: {
      backgroundColor:
        Colors.primaryLight,
    },

    attendanceValue: {
      color: Colors.text,
      fontSize: 16,
      fontWeight: "900",
    },

    attendanceLabel: {
      color:
        Colors.textSecondary,
      fontSize: 8,
      marginTop: 2,
    },


    /* PULSE */

    pulseCard: {
      backgroundColor:
        Colors.white,

      borderRadius: 18,

      borderWidth: 1,
      borderColor:
        Colors.border,

      paddingHorizontal: 15,
    },

    pulseRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
    },

    pulseIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",
      justifyContent: "center",
    },

    pulseIconDanger: {
      backgroundColor:
        Colors.dangerLight,
    },

    pulseInfo: {
      flex: 1,
      marginLeft: 11,
    },

    pulseTitle: {
      color: Colors.text,
      fontSize: 12,
      fontWeight: "800",
    },

    pulseDescription: {
      color:
        Colors.textSecondary,
      fontSize: 9,
      marginTop: 3,
    },

    pulseValue: {
      color: Colors.text,
      fontSize: 14,
      fontWeight: "900",
    },

    pulseValueDanger: {
      color: Colors.danger,
    },

    divider: {
      height: 1,
      backgroundColor:
        Colors.border,
    },

    bottomSpace: {
      height: 20,
    },
  });