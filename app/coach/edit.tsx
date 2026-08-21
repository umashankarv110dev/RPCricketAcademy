import React, { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../../src/context/AuthContext";

type IconName = keyof typeof Ionicons.glyphMap;

export default function CoachProfileEdit() {
  const db = SQLite.useSQLiteContext();
  const { coach } = useAuth();

  const [name, setName] = useState(coach?.name ?? "");
  const [mobile, setMobile] = useState(coach?.mobile ?? "");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");

  useEffect(() => {
    setName(coach?.name ?? "");
    setMobile(coach?.mobile ?? "");
  }, [coach?.name, coach?.mobile]);

  const initials = useMemo(() => {
    const value = name.trim();
    if (!value) return "C";

    return value
      .split(/\s+/)
      .slice(0, 2)
      .map((item) => item.charAt(0).toUpperCase())
      .join("");
  }, [name]);

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function validate() {
    setEmailError("");
    setMobileError("");

    if (!name.trim()) {
      Alert.alert("Required", "Please enter coach name.");
      return false;
    }

    if (name.trim().length < 2) {
      Alert.alert(
        "Invalid Name",
        "Coach name must contain at least 2 characters."
      );
      return false;
    }

    if (mobile && mobile.length !== 10) {
      setMobileError("Enter a valid 10 digit mobile number.");
      return false;
    }

    if (email && !isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      return false;
    }

    if (!coach?.id) {
      Alert.alert(
        "Coach Not Found",
        "Unable to identify the logged-in coach."
      );
      return false;
    }

    return true;
  }

  async function handleSave() {
  if (!validate()) return;

  if (!coach) {
    Alert.alert(
      "Coach Not Found",
      "Unable to identify the logged-in coach."
    );
    return;
  }

  try {
    setSaving(true);

    await db.runAsync(
      `
      UPDATE coaches
      SET
        name = ?,
        mobile = ?,
        email = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      name.trim(),
      mobile.trim(),
      email.trim() || null,
      coach.id
    );

    Alert.alert(
      "Profile Updated",
      "Your coach profile has been updated successfully.",
      [
        {
          text: "Done",
          onPress: () => router.back(),
        },
      ]
    );
  } catch (error) {
    console.error("Coach profile update error:", error);

    Alert.alert(
      "Update Failed",
      "Unable to update coach profile. Please try again."
    );
  } finally {
    setSaving(false);
  }
}

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
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
            <Text style={styles.eyebrow}>RPCA ACADEMY</Text>
            <Text style={styles.headerTitle}>Edit Coach Profile</Text>
            <Text style={styles.headerSubtitle}>
              Update your personal information
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="create-outline"
              size={23}
              color={Colors.primary}
            />
          </View>
        </View>

        <View style={styles.progressArea}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>PROFILE INFORMATION</Text>
            <Text style={styles.progressValue}>LIVE</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[Colors.primaryDark, Colors.primary]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>

          <View style={styles.profileCopy}>
            <Text style={styles.profileName}>
              {name.trim() || "Coach"}
            </Text>

            <Text style={styles.profileRole}>
              Cricket Coach • RPCA
            </Text>

            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active Coach</Text>
            </View>
          </View>

          <View style={styles.editBadge}>
            <Ionicons
              name="pencil-outline"
              size={16}
              color={Colors.primary}
            />
          </View>
        </View>

        <View style={styles.infoBanner}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={Colors.primary}
            />
          </View>

          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>
              Keep your profile up to date
            </Text>
            <Text style={styles.infoText}>
              These details are used for your academy account and
              communication.
            </Text>
          </View>
        </View>

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
            value={name}
            onChangeText={setName}
            placeholder="Enter coach full name"
            icon="person-outline"
          />

          <Input
            label="Mobile Number"
            value={mobile}
            onChangeText={(value) =>
              setMobile(value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="10 digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            icon="call-outline"
            error={mobileError}
          />

          <Input
            label="Email Address"
            value={email}
            onChangeText={(value) => {
              setEmail(value.trim());
              setEmailError(
                value && !isValidEmail(value)
                  ? "Enter a valid email address."
                  : ""
              );
            }}
            placeholder="coach@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
            error={emailError}
          />
        </View>

        <SectionHeader
          number="02"
          icon="baseball-outline"
          title="Coaching Profile"
          subtitle="Your RPCA role and access"
        />

        <View style={styles.formCard}>
          <ReadonlyRow
            icon="shield-checkmark-outline"
            label="Role"
            value="Cricket Coach"
          />

          <ReadonlyRow
            icon="business-outline"
            label="Academy"
            value="Reflex Pro Cricket Academy"
          />

          <ReadonlyRow
            icon="key-outline"
            label="Access Level"
            value="Coach"
            last
          />
        </View>

        <SectionHeader
          number="03"
          icon="lock-closed-outline"
          title="Account Security"
          subtitle="Password and security settings"
        />

        <TouchableOpacity
          style={styles.securityCard}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert(
              "Change Password",
              "Password management will be connected in the next authentication step."
            );
          }}
        >
          <View style={styles.securityIcon}>
            <Ionicons
              name="key-outline"
              size={20}
              color={Colors.primary}
            />
          </View>

          <View style={styles.securityCopy}>
            <Text style={styles.securityTitle}>
              Change Password
            </Text>
            <Text style={styles.securityText}>
              Update your RPCA account password
            </Text>
          </View>

          <View style={styles.chevronButton}>
            <Ionicons
              name="chevron-forward"
              size={17}
              color={Colors.primary}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.updateButton,
            saving && styles.updateButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.primaryDark, Colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.updateGradient}
          >
            <View style={styles.updateIcon}>
              <Ionicons
                name={saving ? "sync-outline" : "save-outline"}
                size={21}
                color={Colors.white}
              />
            </View>

            <View style={styles.updateCopy}>
              <Text style={styles.updateTitle}>
                {saving ? "Updating Profile..." : "Update Profile"}
              </Text>
              <Text style={styles.updateSubtitle}>
                {saving
                  ? "Saving changes to RPCA"
                  : "Save your latest coach information"}
              </Text>
            </View>

            {!saving && (
              <Ionicons
                name="arrow-forward"
                size={20}
                color={Colors.white}
              />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          <Ionicons name="lock-closed-outline" size={10} /> Your coach
          information is stored securely in RPCA records.
        </Text>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
        colors={[Colors.primaryDark, Colors.primary]}
        style={styles.sectionNumber}
      >
        <Text style={styles.sectionNumberText}>{number}</Text>
      </LinearGradient>

      <View style={styles.sectionIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={Colors.primary}
        />
      </View>

      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  required = false,
  error,
  multiline = false,
  keyboardType,
  maxLength,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: IconName;
  required?: boolean;
  error?: string;
  multiline?: boolean;
  keyboardType?: any;
  maxLength?: number;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          multiline && styles.inputWrapperMultiline,
          error && styles.inputWrapperError,
        ]}
      >
        <View
          style={[
            styles.inputIcon,
            multiline && styles.inputIconMultiline,
          ]}
        >
          <Ionicons
            name={icon}
            size={17}
            color={error ? Colors.danger : Colors.primary}
          />
        </View>

        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          multiline={multiline}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize ?? "sentences"}
        />

        {value && !error && !multiline ? (
          <Ionicons
            name="checkmark-circle"
            size={17}
            color={Colors.success}
            style={styles.validIcon}
          />
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons
            name="alert-circle-outline"
            size={12}
            color={Colors.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ReadonlyRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: IconName;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.readonlyRow,
        !last && styles.readonlyBorder,
      ]}
    >
      <View style={styles.readonlyIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={Colors.primary}
        />
      </View>

      <View style={styles.readonlyCopy}>
        <Text style={styles.readonlyLabel}>{label}</Text>
        <Text style={styles.readonlyValue}>{value}</Text>
      </View>

      <Ionicons
        name="lock-closed-outline"
        size={14}
        color={Colors.textLight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    paddingTop: Platform.OS === "ios" ? 58 : 42,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
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

  eyebrow: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 3,
  },

  headerTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 10,
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

  progressArea: {
    marginTop: 17,
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  progressLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  progressValue: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: "900",
  },

  progressTrack: {
    height: 5,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },

  progressFill: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
    backgroundColor: Colors.white,
  },

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  profileCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },

  avatar: {
    width: 67,
    height: 67,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: Colors.white,
    fontSize: 23,
    fontWeight: "900",
  },

  profileCopy: {
    flex: 1,
    marginLeft: 12,
  },

  profileName: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "900",
  },

  profileRole: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
  },

  activeBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 6,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 5,
  },

  activeText: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: "900",
  },

  editBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 17,
    padding: 12,
    marginBottom: 5,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  infoCopy: {
    flex: 1,
    marginLeft: 10,
  },

  infoTitle: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "900",
  },

  infoText: {
    color: Colors.textSecondary,
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 11,
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
    fontSize: 9,
    fontWeight: "900",
  },

  sectionIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
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

  formCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 19,
    padding: 15,
    marginBottom: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
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
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
  },

  inputWrapperMultiline: {
    alignItems: "flex-start",
    minHeight: 92,
  },

  inputWrapperError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },

  inputIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  inputIconMultiline: {
    marginTop: 9,
  },

  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 10,
    color: Colors.text,
    fontSize: 13,
  },

  multilineInput: {
    minHeight: 84,
    textAlignVertical: "top",
    paddingTop: 12,
  },

  validIcon: {
    marginRight: 4,
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

  readonlyRow: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
  },

  readonlyBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  readonlyIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  readonlyCopy: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  readonlyLabel: {
    color: Colors.textSecondary,
    fontSize: 8,
    fontWeight: "700",
  },

  readonlyValue: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 3,
  },

  securityCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  securityIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  securityCopy: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  securityTitle: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "900",
  },

  securityText: {
    color: Colors.textSecondary,
    fontSize: 8,
    marginTop: 3,
  },

  chevronButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  updateButton: {
    borderRadius: 17,
    overflow: "hidden",
    marginTop: 22,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
  },

  updateButtonDisabled: {
    opacity: 0.65,
  },

  updateGradient: {
    minHeight: 67,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  updateIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  updateCopy: {
    flex: 1,
    marginLeft: 10,
  },

  updateTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "900",
  },

  updateSubtitle: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 8,
    marginTop: 3,
  },

  footerText: {
    color: Colors.textSecondary,
    fontSize: 8,
    textAlign: "center",
    marginTop: 12,
  },

  bottomSpace: {
    height: 25,
  },
});
