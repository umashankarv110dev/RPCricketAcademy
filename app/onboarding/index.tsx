import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { Colors } from "../../src/theme/colors";
import { Spacing } from "../../src/theme/spacing";
import { useAuth } from "../../src/context/AuthContext";

const { width } = Dimensions.get("window");

const onboardingData = [
  {
    icon: "🏏",
    title: "Welcome to RPCA",
    description:
      "Manage your cricket academy, players and daily activities from one professional app.",
  },
  {
    icon: "👥",
    title: "Manage Players",
    description:
      "Maintain complete player profiles including personal, cricket and parent information.",
  },
  {
    icon: "📋",
    title: "Attendance & Fees",
    description:
      "Track daily attendance, monthly performance and player fee payments easily.",
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { completeOnboarding } = useAuth();

  const current = onboardingData[currentIndex];

  async function handleNext() {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    await completeOnboarding();

    router.replace("/auth/login");
  }

  async function handleSkip() {
    await completeOnboarding();

    router.replace("/auth/login");
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          Colors.primaryDark,
          Colors.primary,
        ]}
        style={styles.topSection}
      >
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>
            Skip
          </Text>
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <Text style={styles.icon}>
            {current.icon}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.bottomSection}>
        <View style={styles.indicators}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex &&
                  styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        <Text style={styles.title}>
          {current.title}
        </Text>

        <Text style={styles.description}>
          {current.description}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex ===
            onboardingData.length - 1
              ? "Get Started"
              : "Continue"}
          </Text>
        </TouchableOpacity>

        {currentIndex > 0 && (
          <TouchableOpacity
            onPress={() =>
              setCurrentIndex(currentIndex - 1)
            }
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              Back
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  topSection: {
    height: "52%",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  skipButton: {
    position: "absolute",
    right: 24,
    top: 55,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  skipText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },

  iconCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    fontSize: 76,
  },

  bottomSection: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    alignItems: "center",
  },

  indicators: {
    flexDirection: "row",
    marginBottom: 26,
  },

  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },

  activeIndicator: {
    width: 28,
    backgroundColor: Colors.primary,
  },

  title: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },

  description: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 14,
    maxWidth: width - 60,
  },

  button: {
    width: "100%",
    height: 54,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },

  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },

  backButton: {
    marginTop: 14,
    padding: 8,
  },

  backText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});