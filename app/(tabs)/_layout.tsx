import React from "react";

import { Tabs } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../src/theme/colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          Colors.primary,

        tabBarInactiveTintColor:
          Colors.textLight,

        tabBarStyle: {
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="home-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="players"
        options={{
          title: "Players",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="people-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="calendar-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="fees"
        options={{
          title: "Fees",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="wallet-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="menu-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}