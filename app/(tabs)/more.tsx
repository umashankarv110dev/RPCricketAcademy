import React from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

import { router } from "expo-router";

import { Colors } from "../../src/theme/colors";

import { useAuth } from "../../src/context/AuthContext";


type MenuItem = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  color: string;
};


export default function More() {
  const { coach, logout } = useAuth();


  /* =====================================================
     MENU DATA
  ===================================================== */

  const managementItems: MenuItem[] = [
    {
      title: "Players",
      subtitle: "Manage academy players",
      icon: "people-outline",
      route: "/players",
      color: Colors.primary,
    },

    {
      title: "Batches",
      subtitle: "Manage training batches",
      icon: "grid-outline",
      // route: "/batches",
      color: Colors.primary,
    },

    {
      title: "Attendance",
      subtitle: "Daily & monthly attendance",
      icon: "calendar-outline",
      route: "/attendance",
      color: Colors.primary,
    },

    {
      title: "Fees",
      subtitle: "Fees & payment records",
      icon: "wallet-outline",
      route: "/fees",
      color: Colors.primary,
    },

    {
      title: "Equipment",
      subtitle: "Manage cricket equipment",
      icon: "baseball-outline",
      route: "/equipment/equipment",
      color: Colors.primary,
    },

    {
      title: "Reports",
      subtitle: "Academy performance reports",
      icon: "bar-chart-outline",
      // route: "/reports",
      color: Colors.primary,
    },
  ];


  const academyItems: MenuItem[] = [
    {
      title: "Academy Profile",
      subtitle: "Academy information",
      icon: "business-outline",
      route: "/academy",
      color: Colors.primary,
    },

    {
      title: "Notifications",
      subtitle: "Announcements & alerts",
      icon: "notifications-outline",
      route: "/notifications/notification",
      color: Colors.primary,
    },

    {
      title: "Settings",
      subtitle: "App preferences",
      icon: "settings-outline",
      // route: "/settings",
      color: Colors.primary,
    },

    {
      title: "About RPCA",
      subtitle: "About Reflex Pro Cricket Academy",
      icon: "information-circle-outline",
      // route: "/about",
      color: Colors.primary,
    },
  ];


  /* =====================================================
     NAVIGATION
  ===================================================== */

  function handleNavigation(
    route?: string
  ) {
    if (!route) return;

    router.push(route as any);
  }


  /* =====================================================
     LOGOUT
  ===================================================== */

  function handleLogout() {
  Alert.alert(
    "Logout",
    "Are you sure you want to logout?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },

      {
        text: "Logout",
        style: "destructive",

        onPress: async () => {
          try {
            /*
             * Clear AuthContext + AsyncStorage.
             */
            await logout();

            /*
             * Now go to login.
             */
            router.replace("/auth/login");
          } catch (error) {
            console.error(
              "RPCA logout error:",
              error
            );

            Alert.alert(
              "Logout Failed",
              "Unable to logout. Please try again."
            );
          }
        },
      },
    ]
  );
}


  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark,]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >

          <View
            style={styles.headerTop}
          >

            <View
              style={styles.headerInfo}
            >

              <Text
                style={styles.eyebrow}
              >
                RPCA ACADEMY
              </Text>

              <Text
                style={styles.headerTitle}
              >
                More
              </Text>

              <Text
                style={styles.headerSubtitle}
              >
                Academy management & settings
              </Text>

            </View>


            <View
              style={styles.headerIcon}
            >

              <Ionicons
                name="apps-outline"
                size={25}
                color={Colors.primary}
              />

            </View>

          </View>


          {/* COACH PROFILE */}

          <TouchableOpacity
            style={styles.profileCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                "/coach/profile"
              )
            }
            // onPress={() => {
            //   Alert.alert(
            //     "Coach Profile",
            //     "Coach profile management will be available soon."
            //   );
            // }}
          >

            <View
              style={styles.profileAvatar}
            >

              <Text
                style={styles.profileInitial}
              >
                {(
                  coach?.name ??
                  "Coach"
                )
                  .charAt(0)
                  .toUpperCase()}
              </Text>

            </View>


            <View
              style={styles.profileInfo}
            >

              <Text
                style={styles.profileName}
                numberOfLines={1}
              >
                {coach?.name ??
                  "Coach"}
              </Text>

              <Text
                style={styles.profileRole}
              >
                Cricket Coach
              </Text>

            </View>


            <View
              style={styles.profileArrow}
            >

              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.white}
              />

            </View>

          </TouchableOpacity>

        </LinearGradient>


        {/* =================================================
            QUICK OVERVIEW
        ================================================= */}

        <View
          style={styles.quickCard}
        >

          <View
            style={styles.quickHeader}
          >

            <View>

              <Text
                style={styles.quickTitle}
              >
                Academy Management
              </Text>

              <Text
                style={styles.quickSubtitle}
              >
                Everything you need in one place
              </Text>

            </View>


            <View
              style={styles.quickIcon}
            >

              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={Colors.primary}
              />

            </View>

          </View>

        </View>


        {/* =================================================
            MANAGEMENT
        ================================================= */}

        <SectionTitle
          title="Management"
          subtitle="Manage your academy operations"
        />


        <View
          style={styles.menuGrid}
        >

          {managementItems.map(
            (item) => (
              <MenuCard
                key={item.title}
                item={item}
                onPress={() =>
                  handleNavigation(
                    item.route
                  )
                }
              />
            )
          )}

        </View>


        {/* =================================================
            ACADEMY
        ================================================= */}

        <SectionTitle
          title="Academy"
          subtitle="Academy information & preferences"
        />


        <View
          style={styles.listCard}
        >

          {academyItems.map(
            (item, index) => (
              <React.Fragment
                key={item.title}
              >

                <MenuRow
                  item={item}
                  onPress={() =>
                    handleNavigation(
                      item.route
                    )
                  }
                />

                {index <
                  academyItems.length -
                    1 && (
                  <View
                    style={
                      styles.separator
                    }
                  />
                )}

              </React.Fragment>
            )
          )}

        </View>


        {/* =================================================
            SUPPORT
        ================================================= */}

        <SectionTitle
          title="Support"
          subtitle="Need help?"
        />


        <View
          style={styles.supportCard}
        >

          <SupportRow
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help with RPCA"
            onPress={() =>
              Alert.alert(
                "Help & Support",
                "Support section will be available here."
              )
            }
          />


          <View
            style={styles.separator}
          />


          <SupportRow
            icon="chatbubble-ellipses-outline"
            title="Contact Academy"
            subtitle="Contact RPCA administration"
            onPress={() =>
              Alert.alert(
                "Contact Academy",
                "Academy contact details will be available here."
              )
            }
          />

        </View>


        {/* =================================================
            LOGOUT
        ================================================= */}

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.75}
          onPress={
            handleLogout
          }
        >

          <View
            style={styles.logoutIcon}
          >

            <Ionicons
              name="log-out-outline"
              size={20}
              color={Colors.danger}
            />

          </View>


          <View
            style={styles.logoutInfo}
          >

            <Text
              style={styles.logoutTitle}
            >
              Logout
            </Text>

            <Text
              style={styles.logoutSubtitle}
            >
              Sign out from this device
            </Text>

          </View>


          <Ionicons
            name="chevron-forward"
            size={17}
            color={Colors.danger}
          />

        </TouchableOpacity>


        {/* =================================================
            FOOTER
        ================================================= */}

        <View
          style={styles.footer}
        >

          <View
            style={styles.footerLogo}
          >

            <Ionicons
              name="baseball"
              size={15}
              color={Colors.primary}
            />

          </View>

          <Text
            style={styles.footerTitle}
          >
            RPCA
          </Text>

          <Text
            style={styles.footerText}
          >
            Reflex Pro Cricket Academy
          </Text>

          <Text
            style={styles.version}
          >
            RPCA Coach App • v1.0.0
          </Text>

        </View>

      </ScrollView>

    </View>
  );
}


/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={styles.sectionHeader}
    >

      <Text
        style={styles.sectionTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.sectionSubtitle}
      >
        {subtitle}
      </Text>

    </View>
  );
}


/* =========================================================
   MENU CARD
========================================================= */

function MenuCard({
  item,
  onPress,
}: {
  item: MenuItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuCard}
      activeOpacity={0.75}
      onPress={onPress}
    >

      <View
        style={styles.menuCardTop}
      >

        <View
          style={styles.menuIcon}
        >

          <Ionicons
            name={item.icon}
            size={21}
            color={item.color}
          />

        </View>


        <View
          style={styles.menuArrow}
        >

          <Ionicons
            name="chevron-forward"
            size={14}
            color={
              Colors.textLight
            }
          />

        </View>

      </View>


      <Text
        style={styles.menuTitle}
        numberOfLines={1}
      >
        {item.title}
      </Text>

      <Text
        style={styles.menuSubtitle}
        numberOfLines={2}
      >
        {item.subtitle}
      </Text>

    </TouchableOpacity>
  );
}


/* =========================================================
   MENU ROW
========================================================= */

function MenuRow({
  item,
  onPress,
}: {
  item: MenuItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      activeOpacity={0.75}
      onPress={onPress}
    >

      <View
        style={styles.rowIcon}
      >

        <Ionicons
          name={item.icon}
          size={19}
          color={item.color}
        />

      </View>


      <View
        style={styles.rowInfo}
      >

        <Text
          style={styles.rowTitle}
        >
          {item.title}
        </Text>

        <Text
          style={styles.rowSubtitle}
        >
          {item.subtitle}
        </Text>

      </View>


      <Ionicons
        name="chevron-forward"
        size={17}
        color={Colors.textLight}
      />

    </TouchableOpacity>
  );
}


/* =========================================================
   SUPPORT ROW
========================================================= */

function SupportRow({
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
      style={styles.menuRow}
      activeOpacity={0.75}
      onPress={onPress}
    >

      <View
        style={styles.supportIcon}
      >

        <Ionicons
          name={icon}
          size={19}
          color={Colors.primary}
        />

      </View>


      <View
        style={styles.rowInfo}
      >

        <Text
          style={styles.rowTitle}
        >
          {title}
        </Text>

        <Text
          style={styles.rowSubtitle}
        >
          {subtitle}
        </Text>

      </View>


      <Ionicons
        name="chevron-forward"
        size={17}
        color={Colors.textLight}
      />

    </TouchableOpacity>
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
      paddingBottom: 35,
    },


    /* =====================================================
       HEADER
    ===================================================== */

    header: {
      marginHorizontal: -20,
      paddingHorizontal: 20,
      paddingTop: 48,
      paddingBottom: 20,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      overflow: "hidden",
    },

    headerTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },

    headerInfo: {
      flex: 1,
      paddingRight: 14,
    },

    eyebrow: {
      color: "rgba(255,255,255,0.65)",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.5,
    },

    headerTitle: {
      color: Colors.white,
      fontSize: 29,
      fontWeight: "900",
      marginTop: 2,
    },

    headerSubtitle: {
      color: "rgba(255,255,255,0.78)",
      fontSize: 10,
      marginTop: 3,
    },

    headerIcon: {
      width: 47,
      height: 47,
      borderRadius: 15,
      backgroundColor: Colors.white,
      alignItems: "center",
      justifyContent: "center",

      elevation: 3,

      shadowColor: "#000",

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.14,

      shadowRadius: 4,
    },


    /* =====================================================
       PROFILE
    ===================================================== */

    profileCard: {
      marginTop: 18,

      padding: 11,

      borderRadius: 16,

      backgroundColor:
        "rgba(255,255,255,0.14)",

      borderWidth: 1,

      borderColor:
        "rgba(255,255,255,0.20)",

      flexDirection: "row",

      alignItems: "center",
    },

    profileAvatar: {
      width: 42,

      height: 42,

      borderRadius: 14,

      backgroundColor:
        Colors.white,

      alignItems: "center",

      justifyContent:
        "center",
    },

    profileInitial: {
      color: Colors.primary,

      fontSize: 17,

      fontWeight: "900",
    },

    profileInfo: {
      flex: 1,

      marginLeft: 10,
    },

    profileName: {
      color: Colors.white,

      fontSize: 13,

      fontWeight: "900",
    },

    profileRole: {
      color:
        "rgba(255,255,255,0.68)",

      fontSize: 8,

      marginTop: 2,
    },

    profileArrow: {
      width: 28,

      height: 28,

      borderRadius: 9,

      backgroundColor:
        "rgba(255,255,255,0.12)",

      alignItems: "center",

      justifyContent:
        "center",
    },


    /* =====================================================
       QUICK
    ===================================================== */

    quickCard: {
      marginTop: 14,

      backgroundColor:
        Colors.white,

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        Colors.border,

      padding: 13,
    },

    quickHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",
    },

    quickTitle: {
      color: Colors.text,

      fontSize: 13,

      fontWeight: "900",
    },

    quickSubtitle: {
      color:
        Colors.textSecondary,

      fontSize: 8,

      marginTop: 3,
    },

    quickIcon: {
      width: 36,

      height: 36,

      borderRadius: 11,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",

      justifyContent:
        "center",
    },


    /* =====================================================
       SECTIONS
    ===================================================== */

    sectionHeader: {
      marginTop: 23,

      marginBottom: 10,
    },

    sectionTitle: {
      color: Colors.text,

      fontSize: 17,

      fontWeight: "900",
    },

    sectionSubtitle: {
      color:
        Colors.textSecondary,

      fontSize: 9,

      marginTop: 3,
    },


    /* =====================================================
       MANAGEMENT GRID
    ===================================================== */

    menuGrid: {
      flexDirection: "row",

      flexWrap: "wrap",

      justifyContent:
        "space-between",

      gap: 9,
    },

    menuCard: {
      width: "48.3%",

      backgroundColor:
        Colors.white,

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        Colors.border,

      padding: 13,

      minHeight: 116,

      elevation: 1,

      shadowColor: "#000",

      shadowOffset: {
        width: 0,
        height: 1,
      },

      shadowOpacity: 0.04,

      shadowRadius: 3,
    },

    menuCardTop: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      marginBottom: 13,
    },

    menuIcon: {
      width: 40,

      height: 40,

      borderRadius: 12,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",

      justifyContent:
        "center",
    },

    menuArrow: {
      width: 25,

      height: 25,

      borderRadius: 8,

      backgroundColor:
        Colors.background,

      alignItems: "center",

      justifyContent:
        "center",
    },

    menuTitle: {
      color: Colors.text,

      fontSize: 12,

      fontWeight: "900",
    },

    menuSubtitle: {
      color:
        Colors.textSecondary,

      fontSize: 8,

      lineHeight: 13,

      marginTop: 3,
    },


    /* =====================================================
       LIST
    ===================================================== */

    listCard: {
      backgroundColor:
        Colors.white,

      borderRadius: 17,

      borderWidth: 1,

      borderColor:
        Colors.border,

      overflow: "hidden",
    },

    menuRow: {
      minHeight: 65,

      paddingHorizontal: 13,

      flexDirection: "row",

      alignItems: "center",
    },

    rowIcon: {
      width: 38,

      height: 38,

      borderRadius: 11,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",

      justifyContent:
        "center",
    },

    rowInfo: {
      flex: 1,

      marginLeft: 11,

      marginRight: 8,
    },

    rowTitle: {
      color: Colors.text,

      fontSize: 11,

      fontWeight: "800",
    },

    rowSubtitle: {
      color:
        Colors.textSecondary,

      fontSize: 8,

      marginTop: 3,
    },

    separator: {
      height: 1,

      backgroundColor:
        Colors.border,

      marginLeft: 62,
    },


    /* =====================================================
       SUPPORT
    ===================================================== */

    supportCard: {
      backgroundColor:
        Colors.white,

      borderRadius: 17,

      borderWidth: 1,

      borderColor:
        Colors.border,

      overflow: "hidden",
    },

    supportIcon: {
      width: 38,

      height: 38,

      borderRadius: 11,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",

      justifyContent:
        "center",
    },


    /* =====================================================
       LOGOUT
    ===================================================== */

    logoutButton: {
      marginTop: 18,

      minHeight: 67,

      backgroundColor:
        Colors.dangerLight,

      borderRadius: 17,

      borderWidth: 1,

      borderColor:
        "rgba(239,68,68,0.15)",

      paddingHorizontal: 13,

      flexDirection: "row",

      alignItems: "center",
    },

    logoutIcon: {
      width: 39,

      height: 39,

      borderRadius: 12,

      backgroundColor:
        Colors.white,

      alignItems: "center",

      justifyContent:
        "center",
    },

    logoutInfo: {
      flex: 1,

      marginLeft: 11,
    },

    logoutTitle: {
      color:
        Colors.danger,

      fontSize: 12,

      fontWeight: "900",
    },

    logoutSubtitle: {
      color:
        Colors.textSecondary,

      fontSize: 8,

      marginTop: 3,
    },


    /* =====================================================
       FOOTER
    ===================================================== */

    footer: {
      alignItems: "center",

      marginTop: 27,

      paddingBottom: 10,
    },

    footerLogo: {
      width: 32,

      height: 32,

      borderRadius: 10,

      backgroundColor:
        Colors.primaryLight,

      alignItems: "center",

      justifyContent:
        "center",

      marginBottom: 6,
    },

    footerTitle: {
      color: Colors.primary,

      fontSize: 12,

      fontWeight: "900",

      letterSpacing: 1,
    },

    footerText: {
      color:
        Colors.textSecondary,

      fontSize: 8,

      marginTop: 2,
    },

    version: {
      color:
        Colors.textLight,

      fontSize: 7,

      marginTop: 7,
    },

  });