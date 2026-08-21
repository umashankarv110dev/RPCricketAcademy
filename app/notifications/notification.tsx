import { Colors } from "@/src/theme/colors";
import React from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";


export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Notifications
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          📢 Practice Schedule Updated
        </Text>

        <Text style={styles.cardText}>
          Tomorrow's practice session will start
          at 6:00 AM.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    paddingTop: 65,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.text,
    marginBottom: 20,
  },

  card: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text,
  },

  cardText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
});