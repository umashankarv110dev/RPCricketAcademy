import React, { useEffect } from "react";

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";

import { router } from "expo-router";

import { Colors } from "../src/theme/colors";
import { useAuth } from "../src/context/AuthContext";

export default function Index() {
  const {
    isLoading,
    isLoggedIn,
    onboardingCompleted,
  } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const timer = setTimeout(() => {
      if (isLoggedIn) {
        router.replace("/(tabs)");
      } else if (!onboardingCompleted) {
        router.replace("/onboarding");
      } else {
        router.replace("/auth/login");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    isLoading,
    isLoggedIn,
    onboardingCompleted,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require(  "../assets/images/icon.jpeg" )}
          style={styles.logo}
        />
      </View>

      <Text style={styles.title}>
        Reflex Pro Cricket Academy
      </Text>

      <Text style={styles.subtitle}>
        Train Hard • Play Smart • Excel
      </Text>

      <ActivityIndicator
        size="small"
        color={Colors.primary}
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    borderRadius: 10
  },

  title: {
    color: Colors.text,
    fontSize: 23,
    fontWeight: "700",
    textAlign: "center",
  },

  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },

  loader: {
    marginTop: 32,
  },
});