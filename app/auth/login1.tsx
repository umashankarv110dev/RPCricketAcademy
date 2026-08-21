import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Keyboard,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SQLite from "expo-sqlite";
import { Colors } from "../../src/theme/colors";
import { useAuth } from "../../src/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const db = SQLite.useSQLiteContext();
  const scrollRef = useRef<ScrollView>(null);
  const passwordRef = useRef<TextInput>(null);

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function validateFields() {
    setMobileError("");
    setPasswordError("");
    if (!/^\d{10}$/.test(mobile)) {
      setMobileError("Enter a valid 10 digit mobile number.");
      return false;
    }
    if (!password) {
      setPasswordError("Password is required.");
      return false;
    }
    return true;
  }

  async function handleLogin() {
    Keyboard.dismiss();
    if (!validateFields()) return;

    try {
      setLoading(true);

      // First verify that this mobile is actually registered.
      const registeredCoach = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM coaches WHERE mobile = ? LIMIT 1`,
        mobile
      );

      if (!registeredCoach) {
        Alert.alert(
          "Account Not Registered",
          "This mobile number is not registered as an RPCA coach. Please contact the academy administrator."
        );
        return;
      }

      // AuthContext remains responsible for password/session verification.
      const success = await login(mobile, password);

      if (!success) {
        Alert.alert(
          "Login Failed",
          "Incorrect mobile number or password."
        );
        return;
      }

      router.replace("/(tabs)");
    } catch (error) {
      console.error("RPCA login error:", error);
      Alert.alert(
        "Login Error",
        "Unable to complete login right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleMobileChange(value: string) {
    setMobile(value.replace(/\D/g, "").slice(0, 10));
    if (mobileError) setMobileError("");
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (passwordError) setPasswordError("");
  }

  function focusPassword() {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 170, animated: true });
    }, 80);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      >
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.logoCircle}>
            <Image source={require(  "../../assets/images/icon.jpeg" )} style={styles.logo}/>
          </View>
          {/* <View style={styles.brandBadge}>
            <Ionicons name="baseball-outline" size={13} color={Colors.white} />
            <Text style={styles.brandBadgeText}>COACH PORTAL</Text>
          </View> */}
          <Text style={styles.academyName}>Reflex Pro Cricket Academy</Text>
          <Text style={styles.headerSubtitle}>
            Professional Coach Management Portal
          </Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.welcomeRow}>
            <View style={styles.welcomeCopy}>
              <Text style={styles.welcome}>Welcome Coach</Text>
              <Text style={styles.wave}>👋</Text>
            </View>
            <View style={styles.secureBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color={Colors.primary} />
              <Text style={styles.secureText}>Secure Login</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Sign in with your registered RPCA coach account.
          </Text>

          {/* <View style={styles.sectionLabelRow}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionLabel}>ACCOUNT LOGIN</Text>
          </View> */}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={[styles.inputContainer, mobileError && styles.inputContainerError]}>
              <View style={styles.inputIcon}>
                <Ionicons name="call-outline" size={18} color={mobileError ? Colors.danger : Colors.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter registered mobile"
                placeholderTextColor={Colors.textLight}
                value={mobile}
                onChangeText={handleMobileChange}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="next"
                textContentType="telephoneNumber"
                autoComplete="tel"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              {mobile.length === 10 && !mobileError ? (
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              ) : null}
            </View>
            {mobileError ? <ErrorMessage text={mobileError} /> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputContainer, passwordError && styles.inputContainerError]}>
              <View style={styles.inputIcon}>
                <Ionicons name="lock-closed-outline" size={18} color={passwordError ? Colors.danger : Colors.primary} />
              </View>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                textContentType="password"
                autoComplete="password"
                onFocus={focusPassword}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(v => !v)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <ErrorMessage text={passwordError} /> : null}
          </View>

          <TouchableOpacity
            style={styles.forgot}
            onPress={() =>
              Alert.alert(
                "Forgot Password",
                "Please contact the RPCA academy administrator to reset your coach password."
              )
            }
          >
            <Ionicons name="help-circle-outline" size={15} color={Colors.primary} />
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primaryDark, Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginGradient}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={styles.loginText}>Verifying Account...</Text>
                </>
              ) : (
                <>
                  <View style={styles.loginIcon}>
                    <Ionicons name="log-in-outline" size={20} color={Colors.white} />
                  </View>
                  <Text style={styles.loginText}>Login to RPCA</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push("/coach/register")}
            activeOpacity={0.7}
          >
            <Text style={styles.registerLinkText}>
              New Coach?{" "}
            </Text>

            <Text style={styles.registerLinkAction}>
              Register Coach
            </Text>
          </TouchableOpacity>

          <View style={styles.registeredCard}>
            <View style={styles.registeredIcon}>
              <Ionicons name="shield-checkmark-outline" size={19} color={Colors.primary} />
            </View>
            <View style={styles.registeredCopy}>
              <Text style={styles.registeredTitle}>Registered Coaches Only</Text>
              <Text style={styles.registeredText}>
                Login is available only for coaches registered by the RPCA academy.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Ionicons name="lock-closed-outline" size={11} color={Colors.textLight} />
            <Text style={styles.footerText}>RPCA secure coach authentication</Text>
          </View>
        </View>
        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle-outline" size={12} color={Colors.danger} />
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 25 },
  header: {
    minHeight: 250, alignItems: "center", justifyContent: "center",
    borderBottomLeftRadius: 38, borderBottomRightRadius: 38,
    paddingHorizontal: 24, paddingTop: Platform.OS === "ios" ? 54 : 38, paddingBottom: 35,
  },
  logoCircle: {
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  logo: {
    width: 110,
    height: 110,
    resizeMode: "contain",
    borderRadius: 10
  },
  brandBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10,
  },
  brandBadgeText: { color: Colors.white, fontSize: 7, fontWeight: "900", letterSpacing: 1.2, marginLeft: 5 },
  academyName: { color: Colors.white, fontSize: 22, fontWeight: "900", textAlign: "center" },
  headerSubtitle: { color: "rgba(255,255,255,0.72)", fontSize: 10, fontWeight: "600", marginTop: 6, textAlign: "center" },
  formContainer: {
    marginTop: 10, marginHorizontal: 18, backgroundColor: Colors.white,
    borderRadius: 24, borderWidth: 1, borderColor: Colors.border, padding: 20,
    elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  welcomeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  welcomeCopy: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  welcome: { color: Colors.text, fontSize: 23, fontWeight: "900" },
  wave: { fontSize: 19, marginLeft: 6 },
  secureBadge: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.primaryLight,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6, marginLeft: 8,
  },
  secureText: { color: Colors.primary, fontSize: 7, fontWeight: "900", marginLeft: 4 },
  subtitle: { color: Colors.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 6, marginBottom: 21 },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sectionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary, marginRight: 6 },
  sectionLabel: { color: Colors.textSecondary, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  fieldGroup: { marginBottom: 14 },
  label: { color: Colors.text, fontSize: 10, fontWeight: "900", marginBottom: 7 },
  inputContainer: {
    minHeight: 55, backgroundColor: Colors.background, borderWidth: 1,
    borderColor: Colors.border, borderRadius: 14, flexDirection: "row",
    alignItems: "center", paddingHorizontal: 9,
  },
  inputContainerError: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
  inputIcon: {
    width: 36, height: 36, borderRadius: 11, backgroundColor: Colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  input: { flex: 1, minHeight: 53, color: Colors.text, fontSize: 13, marginLeft: 9, paddingVertical: 0 },
  eyeButton: { width: 38, height: 40, alignItems: "center", justifyContent: "center" },
  errorRow: { flexDirection: "row", alignItems: "center", marginTop: 5, paddingHorizontal: 2 },
  errorText: { color: Colors.danger, fontSize: 9, fontWeight: "600", marginLeft: 4, flex: 1 },
  forgot: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", marginTop: 1, marginBottom: 4 },
  forgotText: { color: Colors.primary, fontWeight: "800", fontSize: 10, marginLeft: 4 },
  loginButton: {
    borderRadius: 16, overflow: "hidden", marginTop: 17, elevation: 3,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 5,
  },
  loginButtonDisabled: { opacity: 0.65 },
  loginGradient: { minHeight: 57, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  loginIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center", marginRight: 8,
  },
  loginText: { color: Colors.white, fontSize: 13, fontWeight: "900", flex: 1, textAlign: "center" },
  registeredCard: {
    marginTop: 16, padding: 12, backgroundColor: Colors.primaryLight,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 15,
    flexDirection: "row", alignItems: "center",
  },
  registeredIcon: {
    width: 39, height: 39, borderRadius: 12, backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
  },
  registeredCopy: { flex: 1, marginLeft: 9 },
  registeredTitle: { color: Colors.primaryDark, fontSize: 10, fontWeight: "900" },
  registeredText: { color: Colors.textSecondary, fontSize: 8, lineHeight: 12, marginTop: 3 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 15 },
  footerText: { color: Colors.textLight, fontSize: 8, marginLeft: 4, fontWeight: "600" },
  bottomSpace: { height: 20 },
registerLink: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginTop: 16,
},

registerLinkText: {
  color: Colors.textSecondary,
  fontSize: 10,
  fontWeight: "600",
},

registerLinkAction: {
  color: Colors.primary,
  fontSize: 10,
  fontWeight: "900",
},

});
