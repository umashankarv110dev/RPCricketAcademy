import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { Colors } from "../../src/theme/colors";
import { useAuth } from "../../src/context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (mobile.length !== 10) {
      Alert.alert(
        "Invalid Mobile",
        "Please enter a valid 10 digit mobile number."
      );

      return;
    }

    if (!password) {
      Alert.alert(
        "Password Required",
        "Please enter your password."
      );

      return;
    }

    try {
      setLoading(true);

      const success = await login(
        mobile,
        password
      );

      if (!success) {
        Alert.alert(
          "Login Failed",
          "Invalid mobile number or password."
        );

        return;
      }

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Login error:", error);

      Alert.alert(
        "Error",
        "Something went wrong while logging in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[
            Colors.primaryDark,
            Colors.primary,
          ]}
          style={styles.header}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logo}>
              RPCA
            </Text>
          </View>

          <Text style={styles.academyName}>
            Reflex Pro Cricket Academy
          </Text>

          <Text style={styles.headerSubtitle}>
            Coach Management Portal
          </Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={styles.welcome}>
            Welcome Coach 👋
          </Text>

          <Text style={styles.subtitle}>
            Login to manage your academy
          </Text>

          <Text style={styles.label}>
            Mobile Number
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="call-outline"
              size={20}
              color={Colors.textSecondary}
            />

            <TextInput
              style={styles.input}
              placeholder="Enter mobile number"
              placeholderTextColor={
                Colors.textLight
              }
              value={mobile}
              onChangeText={(value) =>
                setMobile(
                  value.replace(/[^0-9]/g, "")
                )
              }
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <Text style={styles.label}>
            Password
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={Colors.textSecondary}
            />

            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={
                Colors.textLight
              }
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >
              <Ionicons
                name={
                  showPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={21}
                color={
                  Colors.textSecondary
                }
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgot}
            onPress={() =>
              Alert.alert(
                "Coming Soon",
                "Password recovery will be added later."
              )
            }
          >
            <Text style={styles.forgotText}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.loginButton,
              loading &&
                styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.loginText}>
                Logging in...
              </Text>
            ) : (
              <>
                <Text style={styles.loginText}>
                  Login
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={Colors.white}
                />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>
              Demo Coach Login
            </Text>

            <Text style={styles.demoText}>
              Mobile: 9876543210
            </Text>

            <Text style={styles.demoText}>
              Password: 123456
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scroll: {
    flexGrow: 1,
  },

  header: {
    minHeight: 330,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    padding: 24,
  },

  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor:
      "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  logo: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: "800",
  },

  academyName: {
    color: Colors.white,
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 8,
  },

  formContainer: {
    padding: 24,
  },

  welcome: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: "800",
  },

  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 26,
  },

  label: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 14,
  },

  inputContainer: {
    height: 54,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  input: {
    flex: 1,
    height: "100%",
    marginLeft: 10,
    color: Colors.text,
    fontSize: 15,
  },

  forgot: {
    alignSelf: "flex-end",
    marginTop: 12,
  },

  forgotText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },

  loginButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 28,
  },

  loginButtonDisabled: {
    opacity: 0.6,
  },

  loginText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },

  demoBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
  },

  demoTitle: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },

  demoText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
});