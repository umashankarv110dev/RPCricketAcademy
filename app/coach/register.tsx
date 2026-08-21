import React, { useMemo, useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SQLite from "expo-sqlite";

import { Colors } from "../../src/theme/colors";

type IconName = keyof typeof Ionicons.glyphMap;

export default function RegisterCoach() {
  const db = SQLite.useSQLiteContext();

  // =========================
  // FORM STATE
  // =========================

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  // =========================
  // ERRORS
  // =========================

  const [nameError, setNameError] =
    useState("");

  const [mobileError, setMobileError] =
    useState("");

  const [emailError, setEmailError] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [confirmPasswordError, setConfirmPasswordError] =
    useState("");

  // =========================
  // PASSWORD STRENGTH
  // =========================

  const passwordStrength = useMemo(() => {
    if (!password) {
      return {
        label: "Enter a password",
        level: 0,
      };
    }

    if (password.length < 6) {
      return {
        label: "Weak password",
        level: 1,
      };
    }

    if (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /\d/.test(password)
    ) {
      return {
        label: "Strong password",
        level: 3,
      };
    }

    return {
      label: "Good password",
      level: 2,
    };
  }, [password]);

  // =========================
  // EMAIL VALIDATION
  // =========================

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value.trim()
    );
  }

  // =========================
  // VALIDATION
  // =========================

  function validate() {
    setNameError("");
    setMobileError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!name.trim()) {
      setNameError(
        "Coach name is required."
      );

      return false;
    }

    if (name.trim().length < 2) {
      setNameError(
        "Coach name must contain at least 2 characters."
      );

      return false;
    }

    if (!/^\d{10}$/.test(mobile)) {
      setMobileError(
        "Enter a valid 10 digit mobile number."
      );

      return false;
    }

    if (
      email.trim() &&
      !isValidEmail(email)
    ) {
      setEmailError(
        "Enter a valid email address."
      );

      return false;
    }

    if (!password) {
      setPasswordError(
        "Password is required."
      );

      return false;
    }

    if (password.length < 6) {
      setPasswordError(
        "Password must contain at least 6 characters."
      );

      return false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(
        "Please confirm your password."
      );

      return false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError(
        "Passwords do not match."
      );

      return false;
    }

    return true;
  }

  // =========================
  // REGISTER COACH
  // =========================

  async function handleRegister() {
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      /*
       * Check duplicate mobile number.
       */
      const existingCoach =
        await db.getFirstAsync<{
          id: number;
        }>(
          `
          SELECT id
          FROM coaches
          WHERE mobile = ?
          LIMIT 1
          `,
          mobile.trim()
        );

      if (existingCoach) {
        setMobileError(
          "This mobile number is already registered."
        );

        Alert.alert(
          "Already Registered",
          "A coach with this mobile number already exists."
        );

        return;
      }

      /*
       * Create coach.
       */
      const result =
        await db.runAsync(
          `
          INSERT INTO coaches (
            name,
            mobile,
            email,
            password
          )
          VALUES (?, ?, ?, ?)
          `,
          name.trim(),
          mobile.trim(),
          email.trim() || null,
          password
        );

      if (!result.lastInsertRowId) {
        throw new Error(
          "Coach registration failed."
        );
      }

      Alert.alert(
        "Coach Registered Successfully",
        `${name.trim()} has been registered successfully.`,
        [
          {
            text: "Go to Login",
            onPress: () => {
              router.replace("/auth/login");
            },
          },
        ]
      );
    } catch (error: unknown) {
      console.error(
        "Coach registration error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      /*
       * SQLite UNIQUE constraint.
       */
      if (
        message
          .toLowerCase()
          .includes("unique")
      ) {
        setMobileError(
          "This mobile number is already registered."
        );

        Alert.alert(
          "Already Registered",
          "A coach with this mobile number already exists."
        );

        return;
      }

      Alert.alert(
        "Registration Failed",
        "Unable to register coach. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // UI
  // =========================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
      keyboardVerticalOffset={20}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* =========================
            HEADER
        ========================= */}

        <LinearGradient
          colors={[
            Colors.primaryDark,
            Colors.primary,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
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
              <Text style={styles.eyebrow}>
                RPCA ACADEMY
              </Text>

              <Text style={styles.headerTitle}>
                Register Coach
              </Text>

              <Text
                style={styles.headerSubtitle}
              >
                Create a new coach account
              </Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons
                name="person-add-outline"
                size={23}
                color={Colors.primary}
              />
            </View>
          </View>

          <View style={styles.headerBadge}>
            <Ionicons
              name="shield-checkmark-outline"
              size={13}
              color={Colors.white}
            />

            <Text
              style={styles.headerBadgeText}
            >
              RPCA COACH ACCOUNT
            </Text>
          </View>
        </LinearGradient>

        {/* =========================
            PROFILE PREVIEW
        ========================= */}

        <View style={styles.profilePreview}>
          <LinearGradient
            colors={[
              Colors.primaryDark,
              Colors.primary,
            ]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {name.trim()
                ? name
                    .trim()
                    .charAt(0)
                    .toUpperCase()
                : "C"}
            </Text>
          </LinearGradient>

          <View style={styles.previewCopy}>
            <Text style={styles.previewTitle}>
              {name.trim() || "New Coach"}
            </Text>

            <Text
              style={styles.previewSubtitle}
            >
              Cricket Coach • Reflex Pro
              Cricket Academy
            </Text>

            <View style={styles.newBadge}>
              <View style={styles.newDot} />

              <Text style={styles.newText}>
                NEW ACCOUNT
              </Text>
            </View>
          </View>
        </View>

        {/* =========================
            PERSONAL INFORMATION
        ========================= */}

        <SectionHeader
          number="01"
          icon="person-outline"
          title="Personal Information"
          subtitle="Basic coach account details"
        />

        <View style={styles.formCard}>
          <Input
            label="Full Name"
            required
            icon="person-outline"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setNameError("");
            }}
            placeholder="Enter coach full name"
            error={nameError}
          />

          <Input
            label="Mobile Number"
            required
            icon="call-outline"
            value={mobile}
            onChangeText={(value) => {
              setMobile(
                value
                  .replace(/\D/g, "")
                  .slice(0, 10)
              );

              setMobileError("");
            }}
            placeholder="10 digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            error={mobileError}
          />

          <Input
            label="Email Address"
            icon="mail-outline"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setEmailError("");
            }}
            placeholder="coach@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />
        </View>

        {/* =========================
            SECURITY
        ========================= */}

        <SectionHeader
          number="02"
          icon="lock-closed-outline"
          title="Account Security"
          subtitle="Create secure login credentials"
        />

        <View style={styles.formCard}>
          <PasswordInput
            label="Password"
            required
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setPasswordError("");
            }}
            placeholder="Create a password"
            visible={showPassword}
            onToggle={() =>
              setShowPassword(
                (value) => !value
              )
            }
            error={passwordError}
          />

          {password ? (
            <View style={styles.strengthContainer}>
              <View
                style={styles.strengthHeader}
              >
                <Text
                  style={styles.strengthLabel}
                >
                  Password strength
                </Text>

                <Text
                  style={styles.strengthValue}
                >
                  {passwordStrength.label}
                </Text>
              </View>

              <View style={styles.strengthBars}>
                {[1, 2, 3].map((bar) => (
                  <View
                    key={bar}
                    style={[
                      styles.strengthBar,
                      passwordStrength.level >=
                        bar &&
                        styles.strengthBarActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <PasswordInput
            label="Confirm Password"
            required
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setConfirmPasswordError("");
            }}
            placeholder="Re-enter password"
            visible={showConfirmPassword}
            onToggle={() =>
              setShowConfirmPassword(
                (value) => !value
              )
            }
            error={
              confirmPasswordError
            }
          />
        </View>

        {/* =========================
            STATUS
        ========================= */}

        <SectionHeader
          number="03"
          icon="checkmark-circle-outline"
          title="Account Status"
          subtitle="New coaches are active by default"
        />

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={Colors.success}
            />
          </View>

          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>
              Active Coach
            </Text>

            <Text style={styles.statusText}>
              The coach can log in immediately
              after registration.
            </Text>
          </View>

          <View style={styles.activePill}>
            <View style={styles.activeDot} />

            <Text style={styles.activeText}>
              ACTIVE
            </Text>
          </View>
        </View>

        {/* =========================
            REGISTER BUTTON
        ========================= */}

        <TouchableOpacity
          style={[
            styles.registerButton,
            saving &&
              styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[
              Colors.primaryDark,
              Colors.primary,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.registerGradient}
          >
            <View style={styles.registerIcon}>
              <Ionicons
                name={
                  saving
                    ? "sync-outline"
                    : "person-add-outline"
                }
                size={20}
                color={Colors.white}
              />
            </View>

            <View style={styles.registerCopy}>
              <Text
                style={styles.registerTitle}
              >
                {saving
                  ? "Registering Coach..."
                  : "Register Coach"}
              </Text>

              <Text
                style={styles.registerSubtitle}
              >
                {saving
                  ? "Saving account to RPCA"
                  : "Create RPCA coach account"}
              </Text>
            </View>

            {!saving ? (
              <Ionicons
                name="arrow-forward"
                size={20}
                color={Colors.white}
              />
            ) : null}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Ionicons
            name="lock-closed-outline"
            size={12}
            color={Colors.textLight}
          />

          <Text
            style={styles.securityNoteText}
          >
            Coach credentials are used for
            RPCA authentication.
          </Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ======================================================
// SECTION HEADER
// ======================================================

function SectionHeader({
  number,
  icon,
  title,
  subtitle,
}: {
  number: string;
  icon: IconName;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <LinearGradient
        colors={[
          Colors.primaryDark,
          Colors.primary,
        ]}
        style={styles.sectionNumber}
      >
        <Text
          style={styles.sectionNumberText}
        >
          {number}
        </Text>
      </LinearGradient>

      <View style={styles.sectionIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={Colors.primary}
        />
      </View>

      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text
          style={styles.sectionSubtitle}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

// ======================================================
// INPUT
// ======================================================

function Input({
  label,
  required = false,
  icon,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  maxLength,
  autoCapitalize,
}: {
  label: string;
  required?: boolean;
  icon: IconName;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  placeholder: string;
  error?: string;
  keyboardType?: any;
  maxLength?: number;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}

        {required ? (
          <Text style={styles.required}>
            {" "}
            *
          </Text>
        ) : null}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          error &&
            styles.inputWrapperError,
        ]}
      >
        <View style={styles.inputIcon}>
          <Ionicons
            name={icon}
            size={17}
            color={
              error
                ? Colors.danger
                : Colors.primary
            }
          />
        </View>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            Colors.textLight
          }
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={
            autoCapitalize ??
            "sentences"
          }
        />

        {value && !error ? (
          <Ionicons
            name="checkmark-circle"
            size={17}
            color={Colors.success}
          />
        ) : null}
      </View>

      {error ? (
        <ErrorMessage text={error} />
      ) : null}
    </View>
  );
}

// ======================================================
// PASSWORD INPUT
// ======================================================

function PasswordInput({
  label,
  required = false,
  value,
  onChangeText,
  placeholder,
  visible,
  onToggle,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
  error?: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}

        {required ? (
          <Text style={styles.required}>
            {" "}
            *
          </Text>
        ) : null}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          error &&
            styles.inputWrapperError,
        ]}
      >
        <View style={styles.inputIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={17}
            color={
              error
                ? Colors.danger
                : Colors.primary
            }
          />
        </View>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            Colors.textLight
          }
          secureTextEntry={!visible}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.eyeButton}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <Ionicons
            name={
              visible
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={20}
            color={
              Colors.textSecondary
            }
          />
        </TouchableOpacity>
      </View>

      {error ? (
        <ErrorMessage text={error} />
      ) : null}
    </View>
  );
}

// ======================================================
// ERROR MESSAGE
// IMPORTANT: Do NOT name this component "Error"
// because it conflicts with JavaScript Error.
// ======================================================

function ErrorMessage({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.errorRow}>
      <Ionicons
        name="alert-circle-outline"
        size={12}
        color={Colors.danger}
      />

      <Text style={styles.errorText}>
        {text}
      </Text>
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  // HEADER

  header: {
    paddingTop:
      Platform.OS === "ios"
        ? 58
        : 40,

    paddingHorizontal: 20,
    paddingBottom: 21,

    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,

    backgroundColor:
      "rgba(255,255,255,0.14)",

    borderWidth: 1,

    borderColor:
      "rgba(255,255,255,0.18)",

    alignItems: "center",
    justifyContent: "center",
  },

  headerCopy: {
    flex: 1,
    marginHorizontal: 12,
  },

  eyebrow: {
    color:
      "rgba(255,255,255,0.62)",

    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  headerTitle: {
    color: Colors.white,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 3,
  },

  headerSubtitle: {
    color:
      "rgba(255,255,255,0.76)",

    fontSize: 9,
    marginTop: 3,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,

    backgroundColor: Colors.white,

    alignItems: "center",
    justifyContent: "center",
  },

  headerBadge: {
    alignSelf: "flex-start",

    flexDirection: "row",
    alignItems: "center",

    backgroundColor:
      "rgba(255,255,255,0.13)",

    borderWidth: 1,

    borderColor:
      "rgba(255,255,255,0.18)",

    borderRadius: 15,

    paddingHorizontal: 9,
    paddingVertical: 5,

    marginTop: 16,
  },

  headerBadgeText: {
    color: Colors.white,

    fontSize: 7,
    fontWeight: "900",

    letterSpacing: 0.9,

    marginLeft: 5,
  },

  // PROFILE PREVIEW

  profilePreview: {
    marginHorizontal: 20,
    marginTop: 14,

    padding: 13,

    borderRadius: 18,

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.border,

    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 60,
    height: 60,

    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: Colors.white,

    fontSize: 23,
    fontWeight: "900",
  },

  previewCopy: {
    flex: 1,
    marginLeft: 11,
  },

  previewTitle: {
    color: Colors.text,

    fontSize: 15,
    fontWeight: "900",
  },

  previewSubtitle: {
    color: Colors.textSecondary,

    fontSize: 8,

    marginTop: 3,
  },

  newBadge: {
    alignSelf: "flex-start",

    flexDirection: "row",
    alignItems: "center",

    backgroundColor:
      Colors.primaryLight,

    borderRadius: 8,

    paddingHorizontal: 7,
    paddingVertical: 4,

    marginTop: 5,
  },

  newDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    backgroundColor:
      Colors.primary,

    marginRight: 4,
  },

  newText: {
    color: Colors.primary,

    fontSize: 7,
    fontWeight: "900",
  },

  // SECTION

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",

    marginHorizontal: 20,

    marginTop: 22,
    marginBottom: 10,
  },

  sectionNumber: {
    width: 29,
    height: 29,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 8,
  },

  sectionNumberText: {
    color: Colors.white,

    fontSize: 8,
    fontWeight: "900",
  },

  sectionIcon: {
    width: 35,
    height: 35,

    borderRadius: 11,

    backgroundColor:
      Colors.primaryLight,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,
  },

  sectionCopy: {
    flex: 1,
  },

  sectionTitle: {
    color: Colors.text,

    fontSize: 15,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: Colors.textSecondary,

    fontSize: 8,

    marginTop: 2,
  },

  // FORM

  formCard: {
    marginHorizontal: 20,

    padding: 15,

    borderRadius: 19,

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.border,
  },

  inputGroup: {
    marginBottom: 14,
  },

  label: {
    color: Colors.text,

    fontSize: 10,
    fontWeight: "900",

    marginBottom: 7,
  },

  required: {
    color: Colors.danger,
  },

  inputWrapper: {
    minHeight: 52,

    backgroundColor:
      Colors.background,

    borderWidth: 1,
    borderColor: Colors.border,

    borderRadius: 13,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 9,
  },

  inputWrapperError: {
    borderColor: Colors.danger,

    backgroundColor:
      Colors.dangerLight,
  },

  inputIcon: {
    width: 35,
    height: 35,

    borderRadius: 10,

    backgroundColor:
      Colors.primaryLight,

    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,

    minHeight: 50,

    color: Colors.text,

    fontSize: 13,

    marginLeft: 9,

    paddingVertical: 0,
  },

  eyeButton: {
    width: 38,
    height: 40,

    alignItems: "center",
    justifyContent: "center",
  },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 5,

    paddingHorizontal: 2,
  },

  errorText: {
    color: Colors.danger,

    fontSize: 9,
    fontWeight: "600",

    marginLeft: 4,

    flex: 1,
  },

  // PASSWORD STRENGTH

  strengthContainer: {
    marginTop: -5,
    marginBottom: 14,
  },

  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",

    marginBottom: 6,
  },

  strengthLabel: {
    color: Colors.textSecondary,

    fontSize: 8,
    fontWeight: "700",
  },

  strengthValue: {
    color: Colors.primary,

    fontSize: 8,
    fontWeight: "900",
  },

  strengthBars: {
    flexDirection: "row",
    gap: 5,
  },

  strengthBar: {
    flex: 1,

    height: 4,

    borderRadius: 4,

    backgroundColor:
      Colors.border,
  },

  strengthBarActive: {
    backgroundColor:
      Colors.primary,
  },

  // STATUS

  statusCard: {
    marginHorizontal: 20,

    padding: 13,

    borderRadius: 18,

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.border,

    flexDirection: "row",
    alignItems: "center",
  },

  statusIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor:
      Colors.primaryLight,

    alignItems: "center",
    justifyContent: "center",
  },

  statusCopy: {
    flex: 1,

    marginLeft: 10,
    marginRight: 7,
  },

  statusTitle: {
    color: Colors.text,

    fontSize: 11,
    fontWeight: "900",
  },

  statusText: {
    color: Colors.textSecondary,

    fontSize: 8,

    lineHeight: 12,

    marginTop: 3,
  },

  activePill: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor:
      Colors.primaryLight,

    borderRadius: 9,

    paddingHorizontal: 7,
    paddingVertical: 6,
  },

  activeDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    backgroundColor:
      Colors.success,

    marginRight: 4,
  },

  activeText: {
    color: Colors.primary,

    fontSize: 7,
    fontWeight: "900",
  },

  // REGISTER

  registerButton: {
    marginHorizontal: 20,
    marginTop: 22,

    borderRadius: 17,

    overflow: "hidden",

    elevation: 3,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.15,

    shadowRadius: 5,
  },

  registerButtonDisabled: {
    opacity: 0.65,
  },

  registerGradient: {
    minHeight: 67,

    paddingHorizontal: 15,

    flexDirection: "row",
    alignItems: "center",
  },

  registerIcon: {
    width: 39,
    height: 39,

    borderRadius: 12,

    backgroundColor:
      "rgba(255,255,255,0.14)",

    alignItems: "center",
    justifyContent: "center",
  },

  registerCopy: {
    flex: 1,

    marginLeft: 10,
  },

  registerTitle: {
    color: Colors.white,

    fontSize: 14,
    fontWeight: "900",
  },

  registerSubtitle: {
    color:
      "rgba(255,255,255,0.68)",

    fontSize: 8,

    marginTop: 3,
  },

  // NOTE

  securityNote: {
    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    marginTop: 11,
  },

  securityNoteText: {
    color: Colors.textLight,

    fontSize: 8,

    marginLeft: 4,
  },

  bottomSpace: {
    height: 25,
  },
});