import React, { useCallback, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import * as SQLite from "expo-sqlite";

import { Colors } from "../../src/theme/colors";

import {
  getPlayerById,
  getPlayerCricket,
  getPlayerParent,
  Player,
  PlayerCricket,
  PlayerParent,
  deactivatePlayer,
} from "../../src/database/repositories/playerRepository";

export default function PlayerDetails() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const db = SQLite.useSQLiteContext();

  const [player, setPlayer] =
    useState<Player | null>(null);

  const [cricket, setCricket] =
    useState<PlayerCricket | null>(null);

  const [parent, setParent] =
    useState<PlayerParent | null>(null);

  const [loading, setLoading] =
    useState(true);

  const loadPlayer = useCallback(async () => {
    try {
      setLoading(true);

      const playerId = Number(id);

      const [
        playerData,
        cricketData,
        parentData,
      ] = await Promise.all([
        getPlayerById(db, playerId),
        getPlayerCricket(db, playerId),
        getPlayerParent(db, playerId),
      ]);

      setPlayer(playerData);
      setCricket(cricketData);
      setParent(parentData);
    } catch (error) {
      console.error(
        "Player details loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      loadPlayer();
    }, [loadPlayer])
  );

  async function handleDeactivate() {
    if (!player) {
      return;
    }

    Alert.alert(
      "Deactivate Player",
      `Are you sure you want to deactivate ${player.full_name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await deactivatePlayer(
                db,
                player.id
              );

              await loadPlayer();

              Alert.alert(
                "Updated",
                "Player has been deactivated."
              );
            } catch (error) {
              console.error(error);

              Alert.alert(
                "Error",
                "Unable to update player."
              );
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />
      </View>
    );
  }

  if (!player) {
    return (
      <View style={styles.loader}>
        <Text style={styles.notFound}>
          Player not found.
        </Text>

        <TouchableOpacity
          style={styles.backAction}
          onPress={() => router.back()}
        >
          <Text style={styles.backActionText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
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
          <Text style={styles.headerTitle}>Player Details</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            router.push({
              pathname: "/players/edit",
              params: {
                id: player.id.toString(),
              },
            })
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name="create-outline"
            size={21}
            color={Colors.white}
          />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <LinearGradient
              colors={[Colors.primaryDark, Colors.primary]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {player.full_name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>

            <View style={styles.profileIdentity}>
              <Text style={styles.playerName}>{player.full_name}</Text>
              <View style={styles.codeRow}>
                <Ionicons
                  name="card-outline"
                  size={12}
                  color={Colors.textSecondary}
                />
                <Text style={styles.playerCode}>{player.player_code}</Text>
              </View>
            </View>

            <View
              style={[
                styles.status,
                player.status === "active"
                  ? styles.activeStatus
                  : styles.inactiveStatus,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  player.status === "active"
                    ? styles.activeDot
                    : styles.inactiveDot,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  player.status === "active"
                    ? styles.activeStatusText
                    : styles.inactiveStatusText,
                ]}
              >
                {player.status}
              </Text>
            </View>
          </View>

          <View style={styles.profileDivider} />

          <View style={styles.quickFacts}>
            <QuickFact
              icon="calendar-outline"
              label="Joined"
              value={player.joining_date || "—"}
            />
            <QuickFact
              icon="baseball-outline"
              label="Role"
              value={cricket?.playing_role || "—"}
            />
            <QuickFact
              icon="shirt-outline"
              label="Jersey"
              value={cricket?.jersey_number || "—"}
            />
          </View>
        </View>

        <InfoSection
          icon="person-outline"
          title="Personal Information"
        >
          <InfoRow
            label="Date of Birth"
            value={player.date_of_birth}
          />

          <InfoRow
            label="Gender"
            value={player.gender}
          />

          <InfoRow
            label="Blood Group"
            value={player.blood_group}
          />

          <InfoRow
            label="Mobile"
            value={player.mobile}
          />

          <InfoRow
            label="Email"
            value={player.email}
          />

          <InfoRow
            label="Address"
            value={player.address}
          />

          <InfoRow
            label="City"
            value={player.city}
          />
        </InfoSection>

        <InfoSection
          icon="baseball-outline"
          title="Cricket Information"
        >
          <InfoRow
            label="Jersey Number"
            value={cricket?.jersey_number}
          />

          <InfoRow
            label="Playing Role"
            value={cricket?.playing_role}
          />

          <InfoRow
            label="Batting Style"
            value={cricket?.batting_style}
          />

          <InfoRow
            label="Bowling Style"
            value={cricket?.bowling_style}
          />

          <InfoRow
            label="Skill Level"
            value={cricket?.skill_level}
          />
        </InfoSection>

        <InfoSection
          icon="people-outline"
          title="Parent Information"
        >
          <InfoRow
            label="Father Name"
            value={parent?.father_name}
          />

          <InfoRow
            label="Mother Name"
            value={parent?.mother_name}
          />

          <InfoRow
            label="Parent Mobile"
            value={parent?.parent_mobile}
          />

          <InfoRow
            label="Parent Email"
            value={parent?.parent_email}
          />

          <InfoRow
            label="Emergency Contact"
            value={parent?.emergency_contact}
          />

          <InfoRow
            label="Address"
            value={parent?.address}
          />
        </InfoSection>

        <InfoSection
          icon="business-outline"
          title="Academy Information"
        >
          <InfoRow
            label="Joining Date"
            value={player.joining_date}
          />

          <InfoRow
            label="Status"
            value={player.status}
          />
        </InfoSection>

        {player.status === "active" && (
          <TouchableOpacity
            style={styles.deactivateButton}
            onPress={handleDeactivate}
          >
            <Ionicons
              name="person-remove-outline"
              size={20}
              color={Colors.danger}
            />

            <Text style={styles.deactivateText}>
              Deactivate Player
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

function QuickFact({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.quickFact}>
      <View style={styles.quickFactIcon}>
        <Ionicons name={icon} size={15} color={Colors.primary} />
      </View>
      <Text style={styles.quickFactLabel}>{label}</Text>
      <Text style={styles.quickFactValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function InfoSection({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons
            name={icon}
            size={18}
            color={Colors.primary}
          />
        </View>

        <Text style={styles.sectionTitle}>
          {title}
        </Text>
      </View>

      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) {
    return null;
  }

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

  notFound: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "800",
  },

  backAction: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 15,
  },

  backActionText: {
    color: Colors.white,
    fontWeight: "800",
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

  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "900",
  },

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 21,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: Colors.white,
    fontSize: 25,
    fontWeight: "900",
  },

  profileIdentity: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  playerName: {
    color: Colors.text,
    fontSize: 19,
    fontWeight: "900",
  },

  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  playerCode: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
    marginLeft: 4,
  },

  status: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  activeStatus: {
    backgroundColor: Colors.successLight,
  },

  inactiveStatus: {
    backgroundColor: Colors.dangerLight,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  activeDot: {
    backgroundColor: Colors.success,
  },

  inactiveDot: {
    backgroundColor: Colors.danger,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
    textTransform: "capitalize",
  },

  activeStatusText: {
    color: Colors.success,
  },

  inactiveStatusText: {
    color: Colors.danger,
  },

  profileDivider: {
    height: 1,
    backgroundColor: Colors.background,
    marginVertical: 14,
  },

  quickFacts: {
    flexDirection: "row",
    gap: 7,
  },

  quickFact: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 9,
  },

  quickFactIcon: {
    width: 27,
    height: 27,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  quickFactLabel: {
    color: Colors.textSecondary,
    fontSize: 7,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  quickFactValue: {
    color: Colors.text,
    fontSize: 9,
    fontWeight: "900",
    marginTop: 3,
  },

  section: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginTop: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  sectionIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  sectionTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "900",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },

  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
    flex: 0.85,
  },

  infoValue: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
    flex: 1.35,
    lineHeight: 16,
  },

  deactivateButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 18,
  },

  deactivateText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 8,
  },

  bottomSpace: {
    height: 30,
  },
});
