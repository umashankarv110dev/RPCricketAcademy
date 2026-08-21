import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  router,
  useFocusEffect,
} from "expo-router";

import * as SQLite from "expo-sqlite";

import { Colors } from "../../src/theme/colors";

import {
  getPlayers,
  searchPlayers,
  Player,
} from "../../src/database/repositories/playerRepository";


type FilterType =
  | "all"
  | "active"
  | "inactive";


export default function Players() {
  const [players, setPlayers] =
    useState<Player[]>([]);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<FilterType>("all");

  const [refreshing, setRefreshing] =
    useState(false);

  const db =
    SQLite.useSQLiteContext();


  /* =====================================================
     LOAD PLAYERS
  ===================================================== */

  const loadPlayers =
    useCallback(async () => {
      try {
        const data =
          search.trim()
            ? await searchPlayers(
                db,
                search.trim()
              )
            : await getPlayers(db);

        setPlayers(data);
      } catch (error) {
        console.error(
          "Players loading error:",
          error
        );
      }
    }, [db, search]);


  /* =====================================================
     REFRESH WHEN SCREEN OPENS
  ===================================================== */

  useFocusEffect(
    useCallback(() => {
      loadPlayers();
    }, [loadPlayers])
  );


  /* =====================================================
     MANUAL REFRESH
  ===================================================== */

  async function handleRefresh() {
    setRefreshing(true);

    await loadPlayers();

    setRefreshing(false);
  }


  /* =====================================================
     FILTER PLAYERS
  ===================================================== */

  const filteredPlayers =
    useMemo(() => {
      if (filter === "all") {
        return players;
      }

      return players.filter(
        (player) =>
          player.status === filter
      );
    }, [players, filter]);


  /* =====================================================
     COUNTS
  ===================================================== */

  const activeCount =
    players.filter(
      (player) =>
        player.status === "active"
    ).length;

  const inactiveCount =
    players.filter(
      (player) =>
        player.status !== "active"
    ).length;


  return (
    <View style={styles.container}>

      <FlatList
        data={filteredPlayers}

        keyExtractor={(item) =>
          item.id.toString()
        }

        showsVerticalScrollIndicator={false}

        keyboardShouldPersistTaps="handled"

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }

        contentContainerStyle={
          filteredPlayers.length === 0
            ? styles.emptyList
            : styles.listContent
        }

        ListHeaderComponent={
          <>

            {/* =================================================
                HEADER
            ================================================= */}

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
                    style={styles.headerLabel}
                  >
                    RPCA ACADEMY
                  </Text>

                  <Text
                    style={styles.headerTitle}
                  >
                    Players
                  </Text>

                  <Text
                    style={styles.headerSubtitle}
                  >
                    Manage your academy roster
                  </Text>

                </View>


                <TouchableOpacity
                  style={
                    styles.addButton
                  }
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push(
                      "/players/add"
                    )
                  }
                >

                  <Ionicons
                    name="add"
                    size={25}
                    color={Colors.primary}
                  />

                </TouchableOpacity>

              </View>


              {/* SUMMARY */}

              <View
                style={styles.summaryCard}
              >

                <View
                  style={
                    styles.summaryIcon
                  }
                >

                  <Ionicons
                    name="people"
                    size={22}
                    color={Colors.primary}
                  />

                </View>


                <View
                  style={styles.summaryInfo}
                >

                  <Text
                    style={styles.summaryValue}
                  >
                    {players.length}
                  </Text>

                  <Text
                    style={styles.summaryLabel}
                  >
                    Total Registered Players
                  </Text>

                </View>


                <View
                  style={styles.summaryDivider}
                />


                <View
                  style={styles.summarySmall}
                >

                  <Text
                    style={
                      styles.summarySmallValue
                    }
                  >
                    {activeCount}
                  </Text>

                  <Text
                    style={
                      styles.summarySmallLabel
                    }
                  >
                    Active
                  </Text>

                </View>

              </View>

            </LinearGradient>


            {/* =================================================
                SEARCH
            ================================================= */}

            <View
              style={styles.searchWrapper}
            >

              <View
                style={styles.searchBox}
              >

                <Ionicons
                  name="search-outline"
                  size={20}
                  color={
                    Colors.textSecondary
                  }
                />


                <TextInput
                  style={
                    styles.searchInput
                  }
                  placeholder="Search player name, code or mobile"
                  placeholderTextColor={
                    Colors.textLight
                  }
                  value={search}
                  onChangeText={
                    setSearch
                  }
                  returnKeyType="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                />


                {search.length > 0 && (
                  <TouchableOpacity
                    onPress={() =>
                      setSearch("")
                    }
                    activeOpacity={0.7}
                  >

                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={
                        Colors.textLight
                      }
                    />

                  </TouchableOpacity>
                )}

              </View>

            </View>


            {/* =================================================
                FILTERS
            ================================================= */}

            <View
              style={styles.filterSection}
            >

              <View>
                <Text
                  style={
                    styles.rosterTitle
                  }
                >
                  Player Roster
                </Text>

                <Text
                  style={
                    styles.rosterSubtitle
                  }
                >
                  {filteredPlayers.length}{" "}
                  {filteredPlayers.length === 1
                    ? "player"
                    : "players"}{" "}
                  found
                </Text>
              </View>

            </View>


            <View
              style={styles.filterRow}
            >

              <FilterButton
                label="All Players"
                count={players.length}
                active={
                  filter === "all"
                }
                onPress={() =>
                  setFilter("all")
                }
              />

              <FilterButton
                label="Active"
                count={activeCount}
                active={
                  filter === "active"
                }
                onPress={() =>
                  setFilter("active")
                }
              />

              <FilterButton
                label="Inactive"
                count={inactiveCount}
                active={
                  filter === "inactive"
                }
                onPress={() =>
                  setFilter("inactive")
                }
              />

            </View>

          </>
        }

        renderItem={({ item }) => (
          <PlayerCard
            player={item}
          />
        )}

        ListEmptyComponent={
          <EmptyState
            search={search}
            filter={filter}
          />
        }
      />

    </View>
  );
}


/* =========================================================
   FILTER BUTTON
========================================================= */

function FilterButton({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        active &&
          styles.filterButtonActive,
      ]}
      activeOpacity={0.75}
      onPress={onPress}
    >

      <Text
        style={[
          styles.filterButtonText,
          active &&
            styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>


      <View
        style={[
          styles.filterCount,
          active &&
            styles.filterCountActive,
        ]}
      >

        <Text
          style={[
            styles.filterCountText,
            active &&
              styles.filterCountTextActive,
          ]}
        >
          {count}
        </Text>

      </View>

    </TouchableOpacity>
  );
}


/* =========================================================
   PLAYER CARD
========================================================= */

function PlayerCard({
  player,
}: {
  player: Player;
}) {
  const isActive =
    player.status === "active";


  const initials =
    player.full_name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0).toUpperCase()
      )
      .join("");


  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() =>
        router.push({
          pathname:
            "/players/details",
          params: {
            id: player.id.toString(),
          },
        })
      }
    >

      {/* AVATAR */}

      <View
        style={[
          styles.avatar,
          !isActive &&
            styles.avatarInactive,
        ]}
      >

        <Text
          style={[
            styles.avatarText,
            !isActive &&
              styles.avatarTextInactive,
          ]}
        >
          {initials || "P"}
        </Text>

      </View>


      {/* PLAYER INFO */}

      <View
        style={styles.playerInfo}
      >

        <View
          style={styles.nameRow}
        >

          <Text
            style={styles.playerName}
            numberOfLines={1}
          >
            {player.full_name}
          </Text>

        </View>


        <View
          style={styles.metaRow}
        >

          <View
            style={styles.codeBadge}
          >

            <Ionicons
              name="person-outline"
              size={10}
              color={
                Colors.primary
              }
            />

            <Text
              style={
                styles.codeText
              }
            >
              {player.player_code}
            </Text>

          </View>


          <View
            style={[
              styles.status,
              isActive
                ? styles.activeStatus
                : styles.inactiveStatus,
            ]}
          >

            <View
              style={[
                styles.statusDot,
                isActive
                  ? styles.activeDot
                  : styles.inactiveDot,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                isActive
                  ? styles.activeStatusText
                  : styles.inactiveStatusText,
              ]}
            >
              {isActive
                ? "Active"
                : "Inactive"}
            </Text>

          </View>

        </View>


        {player.mobile && (
          <View
            style={styles.contactRow}
          >

            <Ionicons
              name="call-outline"
              size={13}
              color={
                Colors.textSecondary
              }
            />

            <Text
              style={
                styles.contactText
              }
            >
              {player.mobile}
            </Text>

          </View>
        )}

      </View>


      {/* ARROW */}

      <View
        style={styles.arrowButton}
      >

        <Ionicons
          name="chevron-forward"
          size={17}
          color={Colors.primary}
        />

      </View>

    </TouchableOpacity>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  search,
  filter,
}: {
  search: string;
  filter: FilterType;
}) {
  const isSearching =
    search.trim().length > 0;

  const title = isSearching
    ? "No Player Found"
    : filter === "active"
      ? "No Active Players"
      : filter === "inactive"
        ? "No Inactive Players"
        : "No Players Yet";

  const description =
    isSearching
      ? `We couldn't find any player matching "${search}".`
      : filter === "all"
        ? "Start building your RPCA player roster by adding your first player."
        : `There are currently no ${filter} players in your academy.`;


  return (
    <View
      style={styles.empty}
    >

      <View
        style={styles.emptyIconOuter}
      >

        <View
          style={styles.emptyIcon}
        >

          <Ionicons
            name={
              isSearching
                ? "search-outline"
                : "people-outline"
            }
            size={38}
            color={Colors.primary}
          />

        </View>

      </View>


      <Text
        style={styles.emptyTitle}
      >
        {title}
      </Text>


      <Text
        style={styles.emptyText}
      >
        {description}
      </Text>


      {!isSearching &&
        filter === "all" && (
          <TouchableOpacity
            style={styles.emptyButton}
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/players/add"
              )
            }
          >

            <Ionicons
              name="add"
              size={19}
              color={Colors.white}
            />

            <Text
              style={
                styles.emptyButtonText
              }
            >
              Add First Player
            </Text>

          </TouchableOpacity>
        )}

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
      paddingBottom: 30,
    },

    emptyList: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingBottom: 30,
    },


    /* =====================================================
       HEADER
    ===================================================== */

    header: {
      marginHorizontal: -20,

      marginTop: -18,

      paddingHorizontal: 20,

      paddingTop: 48,

      paddingBottom: 22,

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

    headerLabel: {
      color:
        "rgba(255,255,255,0.70)",

      fontSize: 9,

      fontWeight: "800",

      letterSpacing: 1.2,
    },

    headerTitle: {
      color: Colors.white,

      fontSize: 30,

      fontWeight: "900",

      marginTop: 2,
    },

    headerSubtitle: {
      color:
        "rgba(255,255,255,0.84)",

      fontSize: 11,

      fontWeight: "500",

      marginTop: 3,
    },

    addButton: {
      width: 45,

      height: 45,

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


    /* =====================================================
       SUMMARY
    ===================================================== */

    summaryCard: {
      marginTop: 19,

      backgroundColor:
        "rgba(255,255,255,0.15)",

      borderWidth: 1,

      borderColor:
        "rgba(255,255,255,0.22)",

      borderRadius: 17,

      padding: 13,

      flexDirection: "row",

      alignItems: "center",
    },

    summaryIcon: {
      width: 42,

      height: 42,

      borderRadius: 13,

      backgroundColor:
        Colors.white,

      alignItems: "center",

      justifyContent:
        "center",
    },

    summaryInfo: {
      flex: 1,

      marginLeft: 11,
    },

    summaryValue: {
      color: Colors.white,

      fontSize: 20,

      fontWeight: "900",
    },

    summaryLabel: {
      color:
        "rgba(255,255,255,0.72)",

      fontSize: 9,

      marginTop: 2,
    },

    summaryDivider: {
      width: 1,

      height: 31,

      backgroundColor:
        "rgba(255,255,255,0.25)",

      marginHorizontal: 13,
    },

    summarySmall: {
      alignItems: "center",

      minWidth: 40,
    },

    summarySmallValue: {
      color: Colors.white,

      fontSize: 16,

      fontWeight: "900",
    },

    summarySmallLabel: {
      color:
        "rgba(255,255,255,0.72)",

      fontSize: 8,

      marginTop: 2,
    },


    /* =====================================================
       SEARCH
    ===================================================== */

    searchWrapper: {
      marginTop: 15,
    },

    searchBox: {
      height: 53,

      backgroundColor:
        Colors.white,

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        Colors.border,

      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: 15,

      elevation: 1,

      shadowColor: "#000",

      shadowOffset: {
        width: 0,
        height: 1,
      },

      shadowOpacity: 0.04,

      shadowRadius: 3,
    },

    searchInput: {
      flex: 1,

      marginLeft: 10,

      color: Colors.text,

      fontSize: 13,
    },


    /* =====================================================
       ROSTER HEADER
    ===================================================== */

    filterSection: {
      flexDirection: "row",

      alignItems: "flex-end",

      justifyContent:
        "space-between",

      marginTop: 22,

      marginBottom: 11,
    },

    rosterTitle: {
      color: Colors.text,

      fontSize: 17,

      fontWeight: "900",
    },

    rosterSubtitle: {
      color:
        Colors.textSecondary,

      fontSize: 9,

      marginTop: 3,
    },


    /* =====================================================
       FILTER
    ===================================================== */

    filterRow: {
      flexDirection: "row",

      marginBottom: 13,
    },

    filterButton: {
      flexDirection: "row",

      alignItems: "center",

      backgroundColor:
        Colors.white,

      borderWidth: 1,

      borderColor:
        Colors.border,

      paddingHorizontal: 11,

      paddingVertical: 7,

      borderRadius: 11,

      marginRight: 7,
    },

    filterButtonActive: {
      backgroundColor:
        Colors.primaryLight,

      borderColor:
        Colors.primaryLight,
    },

    filterButtonText: {
      color:
        Colors.textSecondary,

      fontSize: 10,

      fontWeight: "700",
    },

    filterButtonTextActive: {
      color: Colors.primary,
    },

    filterCount: {
      minWidth: 20,

      height: 18,

      borderRadius: 9,

      backgroundColor:
        Colors.background,

      alignItems: "center",

      justifyContent:
        "center",

      marginLeft: 5,
    },

    filterCountActive: {
      backgroundColor:
        Colors.primary,
    },

    filterCountText: {
      color:
        Colors.textSecondary,

      fontSize: 8,

      fontWeight: "800",
    },

    filterCountTextActive: {
      color: Colors.white,
    },


    /* =====================================================
       PLAYER CARD
    ===================================================== */

    card: {
      backgroundColor:
        Colors.white,

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        Colors.border,

      padding: 13,

      marginBottom: 10,

      flexDirection: "row",

      alignItems: "center",

      elevation: 1,

      shadowColor: "#000",

      shadowOffset: {
        width: 0,
        height: 1,
      },

      shadowOpacity: 0.04,

      shadowRadius: 3,
    },

    avatar: {
      width: 53,

      height: 53,

      borderRadius: 17,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",

      justifyContent:
        "center",

      borderWidth: 1,

      borderColor:
        "rgba(0,0,0,0.03)",
    },

    avatarInactive: {
      backgroundColor:
        Colors.dangerLight,
    },

    avatarText: {
      fontSize: 18,

      fontWeight: "900",

      color:
        Colors.primary,
    },

    avatarTextInactive: {
      color:
        Colors.danger,
    },

    playerInfo: {
      flex: 1,

      marginLeft: 12,

      marginRight: 8,
    },

    nameRow: {
      flexDirection: "row",

      alignItems: "center",
    },

    playerName: {
      flex: 1,

      fontSize: 14,

      fontWeight: "800",

      color: Colors.text,
    },

    metaRow: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 5,
    },

    codeBadge: {
      flexDirection: "row",

      alignItems: "center",

      backgroundColor:
        Colors.background,

      paddingHorizontal: 6,

      paddingVertical: 3,

      borderRadius: 6,
    },

    codeText: {
      color:
        Colors.textSecondary,

      fontSize: 8,

      fontWeight: "700",

      marginLeft: 3,
    },

    status: {
      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: 7,

      paddingVertical: 3,

      borderRadius: 8,

      marginLeft: 6,
    },

    activeStatus: {
      backgroundColor:
        Colors.successLight,
    },

    inactiveStatus: {
      backgroundColor:
        Colors.dangerLight,
    },

    statusDot: {
      width: 5,

      height: 5,

      borderRadius: 3,

      marginRight: 4,
    },

    activeDot: {
      backgroundColor:
        Colors.success,
    },

    inactiveDot: {
      backgroundColor:
        Colors.danger,
    },

    statusText: {
      fontSize: 8,

      fontWeight: "800",
    },

    activeStatusText: {
      color:
        Colors.success,
    },

    inactiveStatusText: {
      color:
        Colors.danger,
    },

    contactRow: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 6,
    },

    contactText: {
      color:
        Colors.textSecondary,

      fontSize: 10,

      marginLeft: 4,
    },

    arrowButton: {
      width: 31,

      height: 31,

      borderRadius: 10,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",

      justifyContent:
        "center",
    },


    /* =====================================================
       EMPTY
    ===================================================== */

    empty: {
      flex: 1,

      alignItems: "center",

      justifyContent: "center",

      paddingHorizontal: 28,

      paddingTop: 80,
    },

    emptyIconOuter: {
      width: 104,

      height: 104,

      borderRadius: 34,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",

      justifyContent:
        "center",

      marginBottom: 18,
    },

    emptyIcon: {
      width: 72,

      height: 72,

      borderRadius: 24,

      backgroundColor:
        Colors.white,

      alignItems: "center",

      justifyContent:
        "center",
    },

    emptyTitle: {
      color: Colors.text,

      fontSize: 20,

      fontWeight: "900",

      textAlign: "center",
    },

    emptyText: {
      color:
        Colors.textSecondary,

      fontSize: 12,

      lineHeight: 19,

      textAlign: "center",

      marginTop: 7,
    },

    emptyButton: {
      height: 47,

      backgroundColor:
        Colors.primary,

      paddingHorizontal: 20,

      borderRadius: 14,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",

      marginTop: 20,
    },

    emptyButtonText: {
      color: Colors.white,

      fontSize: 13,

      fontWeight: "800",

      marginLeft: 6,
    },

  });