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
  RefreshControl,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  useFocusEffect,
} from "expo-router";

import * as SQLite from "expo-sqlite";

import {
  LinearGradient,
} from "expo-linear-gradient";

import { Colors } from "../../src/theme/colors";

import {
  AttendanceStatus,
  DailyAttendancePlayer,
  MonthlyAttendance,
  getDailyAttendance,
  getMonthlyAttendance,
  saveAttendance,
} from "../../src/database/repositories/attendanceRepository";


type Mode =
  | "daily"
  | "monthly";


/* =========================================================
   DATE HELPERS
========================================================= */

function formatDate(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatDisplayDate(
  date: Date
) {
  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function getMonthName(
  date: Date
) {
  return date.toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  );
}


function isToday(
  date: Date
) {
  return (
    formatDate(date) ===
    formatDate(new Date())
  );
}


/* =========================================================
   STATUS
========================================================= */

function getStatusLabel(
  status: AttendanceStatus | null
) {
  switch (status) {
    case "present":
      return "Present";

    case "absent":
      return "Absent";

    case "half_day":
      return "Half Day";

    default:
      return "Not Marked";
  }
}


/* =========================================================
   MAIN SCREEN
========================================================= */

export default function AttendanceScreen() {
  const db =
    SQLite.useSQLiteContext();

  const [mode, setMode] =
    useState<Mode>("daily");

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [dailyPlayers, setDailyPlayers] =
    useState<
      DailyAttendancePlayer[]
    >([]);

  const [monthlyPlayers, setMonthlyPlayers] =
    useState<
      MonthlyAttendance[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [savingPlayerId, setSavingPlayerId] =
    useState<number | null>(null);


  /* =====================================================
     DAILY
  ===================================================== */

  const loadDaily =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const date =
            formatDate(
              selectedDate
            );

          const data =
            await getDailyAttendance(
              db,
              date
            );

          setDailyPlayers(data);

        } catch (error) {
          console.error(
            "Daily attendance loading error:",
            error
          );

          Alert.alert(
            "Unable to Load",
            "We couldn't load today's attendance."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        db,
        selectedDate,
      ]
    );


  /* =====================================================
     MONTHLY
  ===================================================== */

  const loadMonthly =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const data =
            await getMonthlyAttendance(
              db,
              selectedDate.getFullYear(),
              selectedDate.getMonth() + 1
            );

          setMonthlyPlayers(data);

        } catch (error) {
          console.error(
            "Monthly attendance loading error:",
            error
          );

          Alert.alert(
            "Unable to Load",
            "We couldn't load monthly attendance."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        db,
        selectedDate,
      ]
    );


  /* =====================================================
     SCREEN REFRESH
  ===================================================== */

  useFocusEffect(
    useCallback(() => {
      if (mode === "daily") {
        loadDaily();
      } else {
        loadMonthly();
      }
    }, [
      mode,
      loadDaily,
      loadMonthly,
    ])
  );


  /* =====================================================
     PULL REFRESH
  ===================================================== */

  async function handleRefresh() {
    setRefreshing(true);

    if (mode === "daily") {
      await loadDaily();
    } else {
      await loadMonthly();
    }

    setRefreshing(false);
  }


  /* =====================================================
     SAVE ATTENDANCE
  ===================================================== */

  async function handleStatusChange(
    playerId: number,
    status: AttendanceStatus
  ) {
    try {
      setSavingPlayerId(
        playerId
      );

      await saveAttendance(
        db,
        playerId,
        formatDate(
          selectedDate
        ),
        status
      );

      setDailyPlayers(
        (previous) =>
          previous.map(
            (player) =>
              player.id === playerId
                ? {
                    ...player,
                    status,
                  }
                : player
          )
      );

    } catch (error) {
      console.error(
        "Attendance save error:",
        error
      );

      Alert.alert(
        "Save Failed",
        "Unable to save attendance. Please try again."
      );
    } finally {
      setSavingPlayerId(null);
    }
  }


  /* =====================================================
     DATE / MONTH NAVIGATION
  ===================================================== */

  function changeDate(
    days: number
  ) {
    const next =
      new Date(
        selectedDate
      );

    next.setDate(
      next.getDate() + days
    );

    setSelectedDate(next);
  }


  function changeMonth(
    months: number
  ) {
    const next =
      new Date(
        selectedDate
      );

    next.setMonth(
      next.getMonth() + months
    );

    setSelectedDate(next);
  }


  /* =====================================================
     DAILY SUMMARY
  ===================================================== */

  const dailySummary =
    useMemo(() => {
      const present =
        dailyPlayers.filter(
          (item) =>
            item.status ===
            "present"
        ).length;

      const absent =
        dailyPlayers.filter(
          (item) =>
            item.status ===
            "absent"
        ).length;

      const halfDay =
        dailyPlayers.filter(
          (item) =>
            item.status ===
            "half_day"
        ).length;

      const notMarked =
        dailyPlayers.length -
        present -
        absent -
        halfDay;

      const total =
        dailyPlayers.length;

      const attendancePercentage =
        total > 0
          ? Math.round(
              (
                (
                  present +
                  halfDay * 0.5
                ) /
                total
              ) *
                100
            )
          : 0;

      return {
        present,
        absent,
        halfDay,
        notMarked,
        total,
        attendancePercentage,
      };
    }, [
      dailyPlayers,
    ]);


  /* =====================================================
     HEADER
  ===================================================== */

  const Header = (
    <>

      <LinearGradient
        colors={[
          Colors.primaryDark,
          Colors.primary,
        ]}
        style={styles.header}
      >

        <View
          style={styles.headerTop}
        >

          <View
            style={styles.headerInfo}
          >

            <Text
              style={styles.headerEyebrow}
            >
              RPCA ACADEMY
            </Text>

            <Text
              style={styles.headerTitle}
            >
              Attendance
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Track and manage player attendance
            </Text>

          </View>


          <View
            style={styles.headerIcon}
          >

            <Ionicons
              name="calendar"
              size={24}
              color={Colors.primary}
            />

          </View>

        </View>


        {/* HEADER STATUS */}

        <View
          style={styles.headerStatus}
        >

          <View
            style={styles.headerStatusIcon}
          >

            <Ionicons
              name={
                mode === "daily"
                  ? "today"
                  : "calendar"
              }
              size={17}
              color={Colors.primary}
            />

          </View>


          <View
            style={styles.headerStatusInfo}
          >

            <Text
              style={styles.headerStatusLabel}
            >
              {mode === "daily"
                ? "Daily Attendance"
                : "Monthly Overview"}
            </Text>

            <Text
              style={styles.headerStatusValue}
            >
              {mode === "daily"
                ? formatDisplayDate(
                    selectedDate
                  )
                : getMonthName(
                    selectedDate
                  )}
            </Text>

          </View>


          <View
            style={styles.liveBadge}
          >

            <View
              style={styles.liveDot}
            />

            <Text
              style={styles.liveText}
            >
              LIVE
            </Text>

          </View>

        </View>

      </LinearGradient>


      {/* MODE SWITCH */}

      <View
        style={styles.modeContainer}
      >

        <ModeButton
          icon="today-outline"
          label="Daily"
          active={
            mode === "daily"
          }
          onPress={() =>
            setMode("daily")
          }
        />

        <ModeButton
          icon="calendar-outline"
          label="Monthly"
          active={
            mode === "monthly"
          }
          onPress={() =>
            setMode("monthly")
          }
        />

      </View>

    </>
  );


  /* =====================================================
     DAILY HEADER
  ===================================================== */

  const DailyHeader = (
    <>

      <View
        style={styles.dateSelector}
      >

        <TouchableOpacity
          style={styles.dateArrow}
          activeOpacity={0.7}
          onPress={() =>
            changeDate(-1)
          }
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={Colors.text}
          />
        </TouchableOpacity>


        <View
          style={styles.dateCenter}
        >

          <View
            style={styles.dateLabelRow}
          >

            <Ionicons
              name="calendar-outline"
              size={12}
              color={Colors.primary}
            />

            <Text
              style={styles.dateLabel}
            >
              Attendance Date
            </Text>

          </View>


          <Text
            style={styles.dateText}
          >
            {formatDisplayDate(
              selectedDate
            )}
          </Text>


          {isToday(
            selectedDate
          ) && (
            <View
              style={styles.todayBadge}
            >

              <View
                style={styles.todayDot}
              />

              <Text
                style={
                  styles.todayText
                }
              >
                TODAY
              </Text>

            </View>
          )}

        </View>


        <TouchableOpacity
          style={styles.dateArrow}
          activeOpacity={0.7}
          onPress={() =>
            changeDate(1)
          }
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.text}
          />
        </TouchableOpacity>

      </View>


      {/* SUMMARY */}

      <View
        style={styles.summaryGrid}
      >

        <SummaryCard
          label="Present"
          value={
            dailySummary.present
          }
          icon="checkmark-circle"
          type="present"
        />

        <SummaryCard
          label="Absent"
          value={
            dailySummary.absent
          }
          icon="close-circle"
          type="absent"
        />

        <SummaryCard
          label="Half Day"
          value={
            dailySummary.halfDay
          }
          icon="time"
          type="half"
        />

        <SummaryCard
          label="Pending"
          value={
            dailySummary.notMarked
          }
          icon="help-circle"
          type="pending"
        />

      </View>


      {/* ATTENDANCE RATE */}

      {dailyPlayers.length > 0 && (
        <View
          style={styles.rateCard}
        >

          <View
            style={styles.rateLeft}
          >

            <View
              style={styles.rateIcon}
            >

              <Ionicons
                name="analytics-outline"
                size={19}
                color={Colors.primary}
              />

            </View>

            <View>

              <Text
                style={styles.rateTitle}
              >
                Attendance Rate
              </Text>

              <Text
                style={styles.rateSubtitle}
              >
                Present + 50% of half day
              </Text>

            </View>

          </View>


          <Text
            style={styles.rateValue}
          >
            {
              dailySummary.attendancePercentage
            }%
          </Text>

        </View>
      )}

    </>
  );


  /* =====================================================
     MONTHLY HEADER
  ===================================================== */

  const MonthlyHeader = (
    <>

      <View
        style={styles.dateSelector}
      >

        <TouchableOpacity
          style={styles.dateArrow}
          activeOpacity={0.7}
          onPress={() =>
            changeMonth(-1)
          }
        >

          <Ionicons
            name="chevron-back"
            size={20}
            color={Colors.text}
          />

        </TouchableOpacity>


        <View
          style={styles.dateCenter}
        >

          <View
            style={styles.dateLabelRow}
          >

            <Ionicons
              name="calendar-outline"
              size={12}
              color={Colors.primary}
            />

            <Text
              style={styles.dateLabel}
            >
              Attendance Month
            </Text>

          </View>


          <Text
            style={styles.dateText}
          >
            {getMonthName(
              selectedDate
            )}
          </Text>

        </View>


        <TouchableOpacity
          style={styles.dateArrow}
          activeOpacity={0.7}
          onPress={() =>
            changeMonth(1)
          }
        >

          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.text}
          />

        </TouchableOpacity>

      </View>


      <View
        style={styles.monthInfo}
      >

        <Ionicons
          name="information-circle-outline"
          size={16}
          color={Colors.primary}
        />

        <Text
          style={styles.monthInfoText}
        >
          Player-wise attendance summary for{" "}
          {getMonthName(
            selectedDate
          )}
        </Text>

      </View>

    </>
  );


  return (
    <View
      style={styles.container}
    >

      {mode === "daily" ? (
        <FlatList
          data={dailyPlayers}
          keyExtractor={(item) =>
            item.id.toString()
          }
          showsVerticalScrollIndicator={
            false
          }

          ListHeaderComponent={
            <>
              {Header}
              {DailyHeader}
            </>
          }

          contentContainerStyle={
            styles.listContent
          }

          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={
                handleRefresh
              }
              tintColor={
                Colors.primary
              }
            />
          }

          renderItem={({
            item,
          }) => (
            <DailyPlayerCard
              player={item}
              saving={
                savingPlayerId ===
                item.id
              }
              onStatusChange={
                handleStatusChange
              }
            />
          )}

          ListEmptyComponent={
            loading ? (
              <LoadingView />
            ) : (
              <EmptyView
                title="No Players"
                text="Add active players before marking attendance."
              />
            )
          }
        />

      ) : (

        <FlatList
          data={monthlyPlayers}
          keyExtractor={(item) =>
            item.player_id.toString()
          }
          showsVerticalScrollIndicator={
            false
          }

          ListHeaderComponent={
            <>
              {Header}
              {MonthlyHeader}
            </>
          }

          contentContainerStyle={
            styles.listContent
          }

          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={
                handleRefresh
              }
              tintColor={
                Colors.primary
              }
            />
          }

          renderItem={({
            item,
          }) => (
            <MonthlyPlayerCard
              player={item}
            />
          )}

          ListEmptyComponent={
            loading ? (
              <LoadingView />
            ) : (
              <EmptyView
                title="No Players"
                text="Add active players to view monthly attendance."
              />
            )
          }
        />

      )}

    </View>
  );
}


/* =========================================================
   MODE BUTTON
========================================================= */

function ModeButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.modeButton,
        active &&
          styles.modeButtonActive,
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >

      <Ionicons
        name={icon}
        size={16}
        color={
          active
            ? Colors.white
            : Colors.textSecondary
        }
      />

      <Text
        style={[
          styles.modeText,
          active &&
            styles.modeTextActive,
        ]}
      >
        {label}
      </Text>

    </TouchableOpacity>
  );
}


/* =========================================================
   DAILY PLAYER CARD
========================================================= */

function DailyPlayerCard({
  player,
  saving,
  onStatusChange,
}: {
  player: DailyAttendancePlayer;
  saving: boolean;
  onStatusChange: (
    playerId: number,
    status: AttendanceStatus
  ) => void;
}) {
  const initials =
    player.full_name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join("");


  return (
    <View
      style={[
        styles.playerCard,

        player.status ===
          "present" &&
          styles.playerCardPresent,

        player.status ===
          "absent" &&
          styles.playerCardAbsent,

        player.status ===
          "half_day" &&
          styles.playerCardHalf,
      ]}
    >

      {/* PLAYER */}

      <View
        style={styles.playerTop}
      >

        <View
          style={[
            styles.avatar,
            player.status ===
              "present" &&
              styles.avatarPresent,
            player.status ===
              "absent" &&
              styles.avatarAbsent,
            player.status ===
              "half_day" &&
              styles.avatarHalf,
          ]}
        >

          <Text
            style={[
              styles.avatarText,
              player.status ===
                "present" &&
                styles.avatarTextPresent,
              player.status ===
                "absent" &&
                styles.avatarTextAbsent,
              player.status ===
                "half_day" &&
                styles.avatarTextHalf,
            ]}
          >
            {initials || "P"}
          </Text>

        </View>


        <View
          style={styles.playerInfo}
        >

          <Text
            style={styles.playerName}
            numberOfLines={1}
          >
            {player.full_name}
          </Text>


          <View
            style={styles.playerMeta}
          >

            <View
              style={styles.codeBadge}
            >

              <Ionicons
                name="person-outline"
                size={9}
                color={Colors.primary}
              />

              <Text
                style={styles.playerCode}
              >
                {player.player_code}
              </Text>

            </View>


            {player.mobile && (
              <>
                <Text
                  style={styles.metaDot}
                >
                  •
                </Text>

                <Ionicons
                  name="call-outline"
                  size={10}
                  color={
                    Colors.textSecondary
                  }
                />

                <Text
                  style={styles.mobileText}
                >
                  {player.mobile}
                </Text>
              </>
            )}

          </View>

        </View>


        {saving ? (
          <View
            style={styles.savingBox}
          >

            <ActivityIndicator
              size="small"
              color={Colors.primary}
            />

          </View>
        ) : (
          <StatusBadge
            status={
              player.status
            }
          />
        )}

      </View>


      {/* DIVIDER */}

      <View
        style={styles.cardDivider}
      />


      {/* ACTION LABEL */}

      <Text
        style={styles.markLabel}
      >
        Mark attendance
      </Text>


      {/* BUTTONS */}

      <View
        style={styles.statusRow}
      >

        <AttendanceButton
          label="Present"
          icon="checkmark"
          selected={
            player.status ===
            "present"
          }
          type="present"
          disabled={saving}
          onPress={() =>
            onStatusChange(
              player.id,
              "present"
            )
          }
        />


        <AttendanceButton
          label="Absent"
          icon="close"
          selected={
            player.status ===
            "absent"
          }
          type="absent"
          disabled={saving}
          onPress={() =>
            onStatusChange(
              player.id,
              "absent"
            )
          }
        />


        <AttendanceButton
          label="Half Day"
          icon="time-outline"
          selected={
            player.status ===
            "half_day"
          }
          type="half"
          disabled={saving}
          onPress={() =>
            onStatusChange(
              player.id,
              "half_day"
            )
          }
        />

      </View>


      <View
        style={styles.currentStatusRow}
      >

        <Ionicons
          name={
            player.status ===
            "present"
              ? "checkmark-circle"
              : player.status ===
                "absent"
                ? "close-circle"
                : player.status ===
                  "half_day"
                  ? "time"
                  : "help-circle"
          }
          size={13}
          color={
            player.status ===
            "present"
              ? Colors.success
              : player.status ===
                "absent"
                ? Colors.danger
                : Colors.primary
          }
        />

        <Text
          style={styles.currentStatus}
        >
          Current status:{" "}
          <Text
            style={
              styles.currentStatusBold
            }
          >
            {getStatusLabel(
              player.status
            )}
          </Text>
        </Text>

      </View>

    </View>
  );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: AttendanceStatus | null;
}) {
  const isPresent =
    status === "present";

  const isAbsent =
    status === "absent";

  const isHalf =
    status === "half_day";


  return (
    <View
      style={[
        styles.statusBadge,

        isPresent &&
          styles.statusBadgePresent,

        isAbsent &&
          styles.statusBadgeAbsent,

        isHalf &&
          styles.statusBadgeHalf,

        !status &&
          styles.statusBadgePending,
      ]}
    >

      <View
        style={[
          styles.statusDot,

          isPresent &&
            styles.statusDotPresent,

          isAbsent &&
            styles.statusDotAbsent,

          isHalf &&
            styles.statusDotHalf,

          !status &&
            styles.statusDotPending,
        ]}
      />

      <Text
        style={[
          styles.statusBadgeText,

          isPresent &&
            styles.statusBadgeTextPresent,

          isAbsent &&
            styles.statusBadgeTextAbsent,

          isHalf &&
            styles.statusBadgeTextHalf,

          !status &&
            styles.statusBadgeTextPending,
        ]}
      >
        {getStatusLabel(status)}
      </Text>

    </View>
  );
}


/* =========================================================
   ATTENDANCE BUTTON
========================================================= */

function AttendanceButton({
  label,
  icon,
  selected,
  type,
  disabled,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;

  type:
    | "present"
    | "absent"
    | "half";

  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.attendanceButton,

        selected &&
          type === "present" &&
          styles.presentSelected,

        selected &&
          type === "absent" &&
          styles.absentSelected,

        selected &&
          type === "half" &&
          styles.halfSelected,

        disabled &&
          styles.disabledButton,
      ]}
      disabled={disabled}
      activeOpacity={0.75}
      onPress={onPress}
    >

      <Ionicons
        name={icon}
        size={15}
        color={
          selected
            ? Colors.white
            : type === "present"
              ? Colors.success
              : type === "absent"
                ? Colors.danger
                : Colors.primary
        }
      />

      <Text
        style={[
          styles.attendanceButtonText,

          selected &&
            styles.selectedButtonText,
        ]}
      >
        {label}
      </Text>

    </TouchableOpacity>
  );
}


/* =========================================================
   MONTHLY PLAYER CARD
========================================================= */

function MonthlyPlayerCard({
  player,
}: {
  player: MonthlyAttendance;
}) {
  const percentage =
    Math.max(
      0,
      Math.min(
        Number(
          player.attendance_percentage
        ),
        100
      )
    );


  const initials =
    player.full_name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join("");


  const performance =
    percentage >= 80
      ? "Excellent"
      : percentage >= 60
        ? "Average"
        : "Needs Attention";


  return (
    <View
      style={styles.monthlyCard}
    >

      {/* TOP */}

      <View
        style={styles.playerTop}
      >

        <View
          style={styles.avatar}
        >

          <Text
            style={styles.avatarText}
          >
            {initials || "P"}
          </Text>

        </View>


        <View
          style={styles.playerInfo}
        >

          <Text
            style={styles.playerName}
            numberOfLines={1}
          >
            {player.full_name}
          </Text>


          <View
            style={styles.monthPlayerMeta}
          >

            <Ionicons
              name="person-outline"
              size={10}
              color={Colors.primary}
            />

            <Text
              style={styles.playerCode}
            >
              {player.player_code}
            </Text>

          </View>

        </View>


        {/* PERCENTAGE */}

        <View
          style={[
            styles.percentageBox,

            percentage >= 80 &&
              styles.percentageExcellent,

            percentage >= 60 &&
              percentage < 80 &&
              styles.percentageAverage,

            percentage < 60 &&
              styles.percentagePoor,
          ]}
        >

          <Text
            style={[
              styles.percentage,

              percentage >= 80 &&
                styles.percentageExcellentText,

              percentage >= 60 &&
                percentage < 80 &&
                styles.percentageAverageText,

              percentage < 60 &&
                styles.percentagePoorText,
            ]}
          >
            {percentage}%
          </Text>

          <Text
            style={styles.percentageLabel}
          >
            Attendance
          </Text>

        </View>

      </View>


      {/* PERFORMANCE */}

      <View
        style={styles.performanceRow}
      >

        <View
          style={styles.performanceLeft}
        >

          <Ionicons
            name={
              percentage >= 80
                ? "trending-up"
                : percentage >= 60
                  ? "remove-outline"
                  : "warning-outline"
            }
            size={13}
            color={
              percentage >= 80
                ? Colors.success
                : percentage >= 60
                  ? Colors.primary
                  : Colors.danger
            }
          />

          <Text
            style={[
              styles.performanceText,

              percentage >= 80 &&
                styles.performanceExcellent,

              percentage >= 60 &&
                percentage < 80 &&
                styles.performanceAverage,

              percentage < 60 &&
                styles.performancePoor,
            ]}
          >
            {performance}
          </Text>

        </View>

        <Text
          style={styles.markedText}
        >
          {player.total_marked} days marked
        </Text>

      </View>


      {/* STATS */}

      <View
        style={styles.monthStats}
      >

        <MonthStat
          value={
            player.present_days
          }
          label="Present"
          type="present"
        />

        <MonthStat
          value={
            player.absent_days
          }
          label="Absent"
          type="absent"
        />

        <MonthStat
          value={
            player.half_days
          }
          label="Half Day"
          type="half"
        />

        <MonthStat
          value={
            player.total_marked
          }
          label="Marked"
          type="pending"
        />

      </View>


      {/* PROGRESS */}

      <View
        style={styles.progressHeader}
      >

        <Text
          style={styles.progressLabel}
        >
          Monthly attendance
        </Text>

        <Text
          style={styles.progressPercent}
        >
          {percentage}%
        </Text>

      </View>


      <View
        style={styles.progressBackground}
      >

        <View
          style={[
            styles.progressFill,

            percentage >= 80 &&
              styles.progressExcellent,

            percentage >= 60 &&
              percentage < 80 &&
              styles.progressAverage,

            percentage < 60 &&
              styles.progressPoor,

            {
              width: `${percentage}%`,
            },
          ]}
        />

      </View>

    </View>
  );
}


/* =========================================================
   MONTH STAT
========================================================= */

function MonthStat({
  value,
  label,
  type,
}: {
  value: number;
  label: string;

  type:
    | "present"
    | "absent"
    | "half"
    | "pending";
}) {
  return (
    <View
      style={styles.monthStat}
    >

      <Text
        style={[
          styles.monthStatValue,

          type === "present" &&
            styles.presentText,

          type === "absent" &&
            styles.absentText,

          type === "half" &&
            styles.halfText,
        ]}
      >
        {value}
      </Text>

      <Text
        style={styles.monthStatLabel}
      >
        {label}
      </Text>

    </View>
  );
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  icon,
  type,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;

  type:
    | "present"
    | "absent"
    | "half"
    | "pending";
}) {
  const isPresent =
    type === "present";

  const isAbsent =
    type === "absent";

  const isHalf =
    type === "half";


  return (
    <View
      style={[
        styles.summaryCard,

        isPresent &&
          styles.summaryCardPresent,

        isAbsent &&
          styles.summaryCardAbsent,

        isHalf &&
          styles.summaryCardHalf,

        type === "pending" &&
          styles.summaryCardPending,
      ]}
    >

      <View
        style={[
          styles.summaryIcon,

          isPresent &&
            styles.summaryIconPresent,

          isAbsent &&
            styles.summaryIconAbsent,

          isHalf &&
            styles.summaryIconHalf,

          type === "pending" &&
            styles.summaryIconPending,
        ]}
      >

        <Ionicons
          name={icon}
          size={16}
          color={
            isPresent
              ? Colors.success
              : isAbsent
                ? Colors.danger
                : Colors.primary
          }
        />

      </View>


      <Text
        style={styles.summaryValue}
      >
        {value}
      </Text>

      <Text
        style={styles.summaryLabel}
      >
        {label}
      </Text>

    </View>
  );
}


/* =========================================================
   LOADING
========================================================= */

function LoadingView() {
  return (
    <View
      style={styles.loading}
    >

      <View
        style={styles.loadingIcon}
      >

        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

      </View>

      <Text
        style={styles.loadingTitle}
      >
        Loading Attendance
      </Text>

      <Text
        style={styles.loadingText}
      >
        Fetching the latest academy records...
      </Text>

    </View>
  );
}


/* =========================================================
   EMPTY
========================================================= */

function EmptyView({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <View
      style={styles.empty}
    >

      <View
        style={styles.emptyIcon}
      >

        <Ionicons
          name="people-outline"
          size={38}
          color={Colors.primary}
        />

      </View>


      <Text
        style={styles.emptyTitle}
      >
        {title}
      </Text>


      <Text
        style={styles.emptyText}
      >
        {text}
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

    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 35,
    },


    /* =====================================================
       HEADER
    ===================================================== */

    header: {
      marginHorizontal: -20,

      marginTop: -18,

      paddingHorizontal: 20,

      paddingTop: 47,

      paddingBottom: 22,

      borderBottomLeftRadius: 28,

      borderBottomRightRadius: 28,

      overflow: "hidden",
    },

    headerTop: {
      flexDirection: "row",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",
    },

    headerInfo: {
      flex: 1,

      paddingRight: 14,
    },

    headerEyebrow: {
      color:
        "rgba(255,255,255,0.68)",

      fontSize: 9,

      fontWeight: "900",

      letterSpacing: 1.4,
    },

    headerTitle: {
      color: Colors.white,

      fontSize: 29,

      fontWeight: "900",

      marginTop: 2,
    },

    headerSubtitle: {
      color:
        "rgba(255,255,255,0.82)",

      fontSize: 11,

      marginTop: 3,
    },

    headerIcon: {
      width: 46,

      height: 46,

      borderRadius: 14,

      backgroundColor:
        Colors.white,

      alignItems: "center",

      justifyContent:
        "center",

      elevation: 3,

      shadowColor: "#000",

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.12,

      shadowRadius: 4,
    },


    /* HEADER STATUS */

    headerStatus: {
      marginTop: 18,

      padding: 11,

      borderRadius: 15,

      backgroundColor:
        "rgba(255,255,255,0.14)",

      borderWidth: 1,

      borderColor:
        "rgba(255,255,255,0.22)",

      flexDirection: "row",

      alignItems: "center",
    },

    headerStatusIcon: {
      width: 34,

      height: 34,

      borderRadius: 11,

      backgroundColor:
        Colors.white,

      alignItems: "center",

      justifyContent:
        "center",
    },

    headerStatusInfo: {
      flex: 1,

      marginLeft: 9,
    },

    headerStatusLabel: {
      color:
        "rgba(255,255,255,0.70)",

      fontSize: 8,

      fontWeight: "700",
    },

    headerStatusValue: {
      color: Colors.white,

      fontSize: 11,

      fontWeight: "800",

      marginTop: 2,
    },

    liveBadge: {
      flexDirection: "row",

      alignItems: "center",

      backgroundColor:
        "rgba(255,255,255,0.18)",

      paddingHorizontal: 8,

      paddingVertical: 5,

      borderRadius: 8,
    },

    liveDot: {
      width: 5,

      height: 5,

      borderRadius: 3,

      backgroundColor:
        "#6EE7B7",

      marginRight: 4,
    },

    liveText: {
      color: Colors.white,

      fontSize: 7,

      fontWeight: "900",

      letterSpacing: 0.5,
    },


    /* =====================================================
       MODE
    ===================================================== */

    modeContainer: {
      marginTop: 15,

      backgroundColor:
        Colors.white,

      borderRadius: 16,

      padding: 4,

      borderWidth: 1,

      borderColor:
        Colors.border,

      flexDirection: "row",
    },

    modeButton: {
      flex: 1,

      height: 43,

      borderRadius: 12,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",
    },

    modeButtonActive: {
      backgroundColor:
        Colors.primary,

      elevation: 2,

      shadowColor: "#000",

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.12,

      shadowRadius: 4,
    },

    modeText: {
      color:
        Colors.textSecondary,

      fontSize: 11,

      fontWeight: "800",

      marginLeft: 6,
    },

    modeTextActive: {
      color: Colors.white,
    },


    /* =====================================================
       DATE
    ===================================================== */

    dateSelector: {
      marginTop: 13,

      backgroundColor:
        Colors.white,

      borderWidth: 1,

      borderColor:
        Colors.border,

      borderRadius: 17,

      minHeight: 76,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      paddingHorizontal: 10,
    },

    dateArrow: {
      width: 43,

      height: 43,

      borderRadius: 13,

      backgroundColor:
        Colors.background,

      alignItems: "center",

      justifyContent:
        "center",
    },

    dateCenter: {
      alignItems: "center",

      flex: 1,
    },

    dateLabelRow: {
      flexDirection: "row",

      alignItems: "center",
    },

    dateLabel: {
      color:
        Colors.textSecondary,

      fontSize: 8,

      fontWeight: "700",

      marginLeft: 4,

      textTransform:
        "uppercase",

      letterSpacing: 0.4,
    },

    dateText: {
      color: Colors.text,

      fontSize: 14,

      fontWeight: "900",

      marginTop: 4,
    },

    todayBadge: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 3,

      backgroundColor:
        Colors.successLight,

      paddingHorizontal: 6,

      paddingVertical: 2,

      borderRadius: 5,
    },

    todayDot: {
      width: 4,

      height: 4,

      borderRadius: 2,

      backgroundColor:
        Colors.success,

      marginRight: 3,
    },

    todayText: {
      color:
        Colors.success,

      fontSize: 6,

      fontWeight: "900",

      letterSpacing: 0.5,
    },


    /* =====================================================
       SUMMARY
    ===================================================== */

    summaryGrid: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      marginTop: 11,

      marginBottom: 10,
    },

    summaryCard: {
      width: "23.5%",

      backgroundColor:
        Colors.white,

      borderRadius: 14,

      paddingVertical: 10,

      alignItems: "center",

      borderWidth: 1,

      borderColor:
        Colors.border,
    },

    summaryCardPresent: {
      borderColor:
        "rgba(34,197,94,0.18)",
    },

    summaryCardAbsent: {
      borderColor:
        "rgba(239,68,68,0.18)",
    },

    summaryCardHalf: {
      borderColor:
        "rgba(37,99,235,0.18)",
    },

    summaryCardPending: {
      borderColor:
        "rgba(107,114,128,0.18)",
    },

    summaryIcon: {
      width: 28,

      height: 28,

      borderRadius: 9,

      alignItems: "center",

      justifyContent:
        "center",

      backgroundColor:
        Colors.background,
    },

    summaryIconPresent: {
      backgroundColor:
        Colors.successLight,
    },

    summaryIconAbsent: {
      backgroundColor:
        Colors.dangerLight,
    },

    summaryIconHalf: {
      backgroundColor:
        Colors.primaryLight,
    },

    summaryIconPending: {
      backgroundColor:
        Colors.background,
    },

    summaryValue: {
      color: Colors.text,

      fontSize: 17,

      fontWeight: "900",

      marginTop: 4,
    },

    summaryLabel: {
      color:
        Colors.textSecondary,

      fontSize: 7,

      fontWeight: "700",

      marginTop: 1,
    },


    /* =====================================================
       RATE
    ===================================================== */

    rateCard: {
      backgroundColor:
        Colors.white,

      borderWidth: 1,

      borderColor:
        Colors.border,

      borderRadius: 15,

      padding: 12,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      marginBottom: 12,
    },

    rateLeft: {
      flexDirection: "row",

      alignItems: "center",
    },

    rateIcon: {
      width: 35,

      height: 35,

      borderRadius: 11,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",

      justifyContent:
        "center",

      marginRight: 9,
    },

    rateTitle: {
      color: Colors.text,

      fontSize: 10,

      fontWeight: "800",
    },

    rateSubtitle: {
      color:
        Colors.textSecondary,

      fontSize: 7,

      marginTop: 2,
    },

    rateValue: {
      color: Colors.primary,

      fontSize: 21,

      fontWeight: "900",
    },


    /* =====================================================
       PLAYER CARD
    ===================================================== */

    playerCard: {
      backgroundColor:
        Colors.white,

      borderWidth: 1,

      borderColor:
        Colors.border,

      borderRadius: 18,

      padding: 14,

      marginBottom: 10,

      elevation: 1,

      shadowColor: "#000",

      shadowOffset: {
        width: 0,
        height: 1,
      },

      shadowOpacity: 0.04,

      shadowRadius: 3,
    },

    playerCardPresent: {
      borderColor:
        "rgba(34,197,94,0.20)",
    },

    playerCardAbsent: {
      borderColor:
        "rgba(239,68,68,0.20)",
    },

    playerCardHalf: {
      borderColor:
        "rgba(37,99,235,0.20)",
    },

    playerTop: {
      flexDirection: "row",

      alignItems: "center",
    },

    avatar: {
      width: 48,

      height: 48,

      borderRadius: 15,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",

      justifyContent:
        "center",
    },

    avatarPresent: {
      backgroundColor:
        Colors.successLight,
    },

    avatarAbsent: {
      backgroundColor:
        Colors.dangerLight,
    },

    avatarHalf: {
      backgroundColor:
        Colors.primaryLight,
    },

    avatarText: {
      color: Colors.primary,

      fontSize: 18,

      fontWeight: "900",
    },

    avatarTextPresent: {
      color:
        Colors.success,
    },

    avatarTextAbsent: {
      color:
        Colors.danger,
    },

    avatarTextHalf: {
      color:
        Colors.primary,
    },

    playerInfo: {
      flex: 1,

      marginLeft: 11,

      marginRight: 7,
    },

    playerName: {
      color: Colors.text,

      fontSize: 14,

      fontWeight: "900",
    },

    playerMeta: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 5,
    },

    codeBadge: {
      flexDirection: "row",

      alignItems: "center",

      backgroundColor:
        Colors.background,

      paddingHorizontal: 5,

      paddingVertical: 3,

      borderRadius: 5,
    },

    playerCode: {
      color:
        Colors.textSecondary,

      fontSize: 8,

      fontWeight: "700",

      marginLeft: 3,
    },

    metaDot: {
      color:
        Colors.textLight,

      fontSize: 9,

      marginHorizontal: 5,
    },

    mobileText: {
      color:
        Colors.textSecondary,

      fontSize: 8,

      marginLeft: 3,
    },

    cardDivider: {
      height: 1,

      backgroundColor:
        Colors.border,

      marginTop: 13,
    },

    markLabel: {
      color:
        Colors.textSecondary,

      fontSize: 8,

      fontWeight: "700",

      marginTop: 11,

      marginBottom: 7,
    },


    /* STATUS BADGE */

    statusBadge: {
      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: 7,

      paddingVertical: 5,

      borderRadius: 8,
    },

    statusBadgePresent: {
      backgroundColor:
        Colors.successLight,
    },

    statusBadgeAbsent: {
      backgroundColor:
        Colors.dangerLight,
    },

    statusBadgeHalf: {
      backgroundColor:
        Colors.primaryLight,
    },

    statusBadgePending: {
      backgroundColor:
        Colors.background,
    },

    statusDot: {
      width: 5,

      height: 5,

      borderRadius: 3,

      marginRight: 4,
    },

    statusDotPresent: {
      backgroundColor:
        Colors.success,
    },

    statusDotAbsent: {
      backgroundColor:
        Colors.danger,
    },

    statusDotHalf: {
      backgroundColor:
        Colors.primary,
    },

    statusDotPending: {
      backgroundColor:
        Colors.textLight,
    },

    statusBadgeText: {
      fontSize: 7,

      fontWeight: "900",
    },

    statusBadgeTextPresent: {
      color:
        Colors.success,
    },

    statusBadgeTextAbsent: {
      color:
        Colors.danger,
    },

    statusBadgeTextHalf: {
      color:
        Colors.primary,
    },

    statusBadgeTextPending: {
      color:
        Colors.textSecondary,
    },

    savingBox: {
      width: 58,

      alignItems: "center",

      justifyContent: "center",
    },


    /* =====================================================
       ATTENDANCE BUTTONS
    ===================================================== */

    statusRow: {
      flexDirection: "row",

      gap: 7,
    },

    attendanceButton: {
      flex: 1,

      minHeight: 41,

      borderRadius: 11,

      borderWidth: 1,

      borderColor:
        Colors.border,

      backgroundColor:
        Colors.background,

      alignItems: "center",

      justifyContent: "center",

      flexDirection: "row",
    },

    attendanceButtonText: {
      color:
        Colors.textSecondary,

      fontSize: 9,

      fontWeight: "800",

      marginLeft: 5,
    },

    selectedButtonText: {
      color: Colors.white,
    },

    presentSelected: {
      backgroundColor:
        Colors.success,

      borderColor:
        Colors.success,
    },

    absentSelected: {
      backgroundColor:
        Colors.danger,

      borderColor:
        Colors.danger,
    },

    halfSelected: {
      backgroundColor:
        Colors.primary,

      borderColor:
        Colors.primary,
    },

    disabledButton: {
      opacity: 0.45,
    },

    currentStatusRow: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 10,
    },

    currentStatus: {
      color:
        Colors.textSecondary,

      fontSize: 8,

      marginLeft: 4,
    },

    currentStatusBold: {
      color: Colors.text,

      fontWeight: "800",
    },


    /* =====================================================
       MONTHLY
    ===================================================== */

    monthInfo: {
      flexDirection: "row",

      alignItems: "center",

      backgroundColor:
        Colors.primaryLight,

      borderRadius: 10,

      paddingHorizontal: 10,

      paddingVertical: 8,

      marginTop: 10,

      marginBottom: 12,
    },

    monthInfoText: {
      flex: 1,

      color:
        Colors.primary,

      fontSize: 8,

      fontWeight: "600",

      marginLeft: 6,
    },

    monthlyCard: {
      backgroundColor:
        Colors.white,

      borderWidth: 1,

      borderColor:
        Colors.border,

      borderRadius: 18,

      padding: 14,

      marginBottom: 10,

      elevation: 1,

      shadowColor: "#000",

      shadowOffset: {
        width: 0,
        height: 1,
      },

      shadowOpacity: 0.04,

      shadowRadius: 3,
    },

    monthPlayerMeta: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 4,
    },

    percentageBox: {
      alignItems: "center",

      justifyContent: "center",

      minWidth: 62,

      paddingVertical: 6,

      paddingHorizontal: 7,

      borderRadius: 11,
    },

    percentageExcellent: {
      backgroundColor:
        Colors.successLight,
    },

    percentageAverage: {
      backgroundColor:
        Colors.primaryLight,
    },

    percentagePoor: {
      backgroundColor:
        Colors.dangerLight,
    },

    percentage: {
      fontSize: 18,

      fontWeight: "900",
    },

    percentageExcellentText: {
      color:
        Colors.success,
    },

    percentageAverageText: {
      color:
        Colors.primary,
    },

    percentagePoorText: {
      color:
        Colors.danger,
    },

    percentageLabel: {
      color:
        Colors.textSecondary,

      fontSize: 6,

      fontWeight: "700",

      marginTop: 1,
    },

    performanceRow: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      marginTop: 12,
    },

    performanceLeft: {
      flexDirection: "row",

      alignItems: "center",
    },

    performanceText: {
      fontSize: 8,

      fontWeight: "800",

      marginLeft: 4,
    },

    performanceExcellent: {
      color:
        Colors.success,
    },

    performanceAverage: {
      color:
        Colors.primary,
    },

    performancePoor: {
      color:
        Colors.danger,
    },

    markedText: {
      color:
        Colors.textSecondary,

      fontSize: 8,
    },

    monthStats: {
      flexDirection: "row",

      marginTop: 13,

      paddingTop: 12,

      borderTopWidth: 1,

      borderTopColor:
        Colors.background,
    },

    monthStat: {
      flex: 1,

      alignItems: "center",
    },

    monthStatValue: {
      color: Colors.text,

      fontSize: 16,

      fontWeight: "900",
    },

    monthStatLabel: {
      color:
        Colors.textSecondary,

      fontSize: 7,

      fontWeight: "600",

      marginTop: 2,
    },

    presentText: {
      color:
        Colors.success,
    },

    absentText: {
      color:
        Colors.danger,
    },

    halfText: {
      color:
        Colors.primary,
    },

    progressHeader: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      alignItems: "center",

      marginTop: 12,

      marginBottom: 5,
    },

    progressLabel: {
      color:
        Colors.textSecondary,

      fontSize: 7,

      fontWeight: "600",
    },

    progressPercent: {
      color:
        Colors.text,

      fontSize: 8,

      fontWeight: "900",
    },

    progressBackground: {
      height: 7,

      borderRadius: 5,

      backgroundColor:
        Colors.background,

      overflow: "hidden",
    },

    progressFill: {
      height: "100%",

      borderRadius: 5,

      backgroundColor:
        Colors.primary,
    },

    progressExcellent: {
      backgroundColor:
        Colors.success,
    },

    progressAverage: {
      backgroundColor:
        Colors.primary,
    },

    progressPoor: {
      backgroundColor:
        Colors.danger,
    },


    /* =====================================================
       LOADING
    ===================================================== */

    loading: {
      alignItems: "center",

      justifyContent:
        "center",

      paddingTop: 70,

      paddingBottom: 40,
    },

    loadingIcon: {
      width: 65,

      height: 65,

      borderRadius: 22,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",

      justifyContent:
        "center",
    },

    loadingTitle: {
      color: Colors.text,

      fontSize: 14,

      fontWeight: "800",

      marginTop: 13,
    },

    loadingText: {
      color:
        Colors.textSecondary,

      fontSize: 9,

      marginTop: 4,
    },


    /* =====================================================
       EMPTY
    ===================================================== */

    empty: {
      alignItems: "center",

      justifyContent:
        "center",

      paddingTop: 65,

      paddingHorizontal: 28,
    },

    emptyIcon: {
      width: 88,

      height: 88,

      borderRadius: 29,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",

      justifyContent:
        "center",

      marginBottom: 17,
    },

    emptyTitle: {
      color: Colors.text,

      fontSize: 19,

      fontWeight: "900",
    },

    emptyText: {
      color:
        Colors.textSecondary,

      fontSize: 11,

      lineHeight: 18,

      textAlign: "center",

      marginTop: 6,
    },

  });