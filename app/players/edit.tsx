import React, { useCallback, useState } from "react";

import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import * as SQLite from "expo-sqlite";

import { Colors } from "../../src/theme/colors";

import {
  getPlayerById,
  getPlayerCricket,
  getPlayerParent,
  updatePlayer,
  PlayerCricket,
  PlayerParent,
} from "../../src/database/repositories/playerRepository";

export default function EditPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = SQLite.useSQLiteContext();

  // IMPORTANT: ALL HOOKS MUST STAY ABOVE ANY CONDITIONAL RETURN.
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [joiningDate, setJoiningDate] = useState("");

  const [jerseyNumber, setJerseyNumber] = useState("");
  const [playingRole, setPlayingRole] = useState("");
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [parentAddress, setParentAddress] = useState("");

  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [joiningDateValue, setJoiningDateValue] = useState<Date>(new Date());
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showJoiningPicker, setShowJoiningPicker] = useState(false);

  const [dobError, setDobError] = useState("");
  const [joiningDateError, setJoiningDateError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [parentEmailError, setParentEmailError] = useState("");
  const [emergencyError, setEmergencyError] = useState("");

  function parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;

    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(date: Date) {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function isValidDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  const loadPlayer = useCallback(async () => {
    try {
      setLoading(true);

      const playerId = Number(id);

      if (!playerId) {
        Alert.alert("Error", "Invalid player.");
        router.back();
        return;
      }

      const [player, cricket, parent] = await Promise.all([
        getPlayerById(db, playerId),
        getPlayerCricket(db, playerId),
        getPlayerParent(db, playerId),
      ]);

      if (!player) {
        Alert.alert(
          "Player Not Found",
          "The selected player does not exist."
        );
        router.back();
        return;
      }

      const playerDob = player.date_of_birth ?? "";
      const playerJoiningDate = player.joining_date ?? "";

      setFullName(player.full_name ?? "");
      setDob(playerDob);
      setGender(player.gender ?? "");
      setBloodGroup(player.blood_group ?? "");
      setMobile(player.mobile ?? "");
      setEmail(player.email ?? "");
      setAddress(player.address ?? "");
      setCity(player.city ?? "");
      setJoiningDate(playerJoiningDate);

      const parsedDob = parseDate(playerDob);
      const parsedJoining = parseDate(playerJoiningDate);

      setDobDate(parsedDob);
      setJoiningDateValue(parsedJoining ?? new Date());

      const cricketData: PlayerCricket | null = cricket;
      setJerseyNumber(cricketData?.jersey_number ?? "");
      setPlayingRole(cricketData?.playing_role ?? "");
      setBattingStyle(cricketData?.batting_style ?? "");
      setBowlingStyle(cricketData?.bowling_style ?? "");
      setSkillLevel(cricketData?.skill_level ?? "");

      const parentData: PlayerParent | null = parent;
      setFatherName(parentData?.father_name ?? "");
      setMotherName(parentData?.mother_name ?? "");
      setParentMobile(parentData?.parent_mobile ?? "");
      setParentEmail(parentData?.parent_email ?? "");
      setEmergencyContact(parentData?.emergency_contact ?? "");
      setParentAddress(parentData?.address ?? "");
    } catch (error) {
      console.error("Edit player loading error:", error);

      Alert.alert(
        "Error",
        "Unable to load player details."
      );
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      loadPlayer();
    }, [loadPlayer])
  );

  function handleDobChange(date: Date) {
    setDobDate(date);
    setDob(formatDate(date));
    setDobError("");
    setShowDobPicker(false);
  }

  function handleJoiningDateChange(date: Date) {
    setJoiningDateValue(date);
    setJoiningDate(formatDate(date));
    setJoiningDateError("");
    setShowJoiningPicker(false);
  }

  function validate() {
    setDobError("");
    setJoiningDateError("");
    setEmailError("");
    setParentEmailError("");
    setEmergencyError("");

    if (!fullName.trim()) {
      Alert.alert("Required", "Please enter player name.");
      return false;
    }

    if (fullName.trim().length < 2) {
      Alert.alert(
        "Invalid Name",
        "Player name must contain at least 2 characters."
      );
      return false;
    }

    if (mobile && mobile.replace(/\D/g, "").length !== 10) {
      Alert.alert(
        "Invalid Mobile",
        "Player mobile number must contain 10 digits."
      );
      return false;
    }

    if (parentMobile && parentMobile.replace(/\D/g, "").length !== 10) {
      Alert.alert(
        "Invalid Mobile",
        "Parent mobile number must contain 10 digits."
      );
      return false;
    }

    if (
      emergencyContact &&
      emergencyContact.replace(/\D/g, "").length !== 10
    ) {
      setEmergencyError("Enter a valid 10 digit emergency contact.");
      return false;
    }

    if (email && !isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      return false;
    }

    if (parentEmail && !isValidEmail(parentEmail)) {
      setParentEmailError("Enter a valid parent email address.");
      return false;
    }

    if (dob && !isValidDate(dob)) {
      setDobError("Use a valid date in YYYY-MM-DD format.");
      return false;
    }

    if (dobDate && dobDate > new Date()) {
      setDobError("Date of birth cannot be in the future.");
      return false;
    }

    if (!joiningDate || !isValidDate(joiningDate)) {
      setJoiningDateError("Select a valid joining date.");
      return false;
    }

    if (new Date(joiningDate) > new Date()) {
      setJoiningDateError("Joining date cannot be in the future.");
      return false;
    }

    if (dobDate && joiningDateValue < dobDate) {
      setJoiningDateError(
        "Joining date cannot be earlier than date of birth."
      );
      return false;
    }

    return true;
  }

  async function handleSave() {
    if (!validate()) return;

    try {
      setSaving(true);

      await updatePlayer(db, Number(id), {
        full_name: fullName.trim(),
        date_of_birth: dob || undefined,
        gender: gender || undefined,
        blood_group: bloodGroup || undefined,
        mobile: mobile || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        joining_date: joiningDate || undefined,

        cricket: {
          jersey_number: jerseyNumber || undefined,
          playing_role: playingRole || undefined,
          batting_style: battingStyle || undefined,
          bowling_style: bowlingStyle || undefined,
          skill_level: skillLevel || undefined,
        },

        parent: {
          father_name: fatherName.trim() || undefined,
          mother_name: motherName.trim() || undefined,
          parent_mobile: parentMobile || undefined,
          parent_email: parentEmail.trim() || undefined,
          emergency_contact: emergencyContact || undefined,
          address: parentAddress.trim() || undefined,
        },
      });

      Alert.alert(
        "Player Updated Successfully",
        `${fullName.trim()}'s profile has been updated.`,
        [
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Update player error:", error);

      Alert.alert(
        "Unable to Update",
        "Something went wrong while updating the player. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  const formProgress = [
    fullName.trim(),
    gender,
    jerseyNumber,
    playingRole,
    fatherName.trim(),
    parentMobile,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <View style={styles.loader}>
        <View style={styles.loaderIcon}>
          <Ionicons
            name="create-outline"
            size={28}
            color={Colors.primary}
          />
        </View>

        <ActivityIndicator
          size="small"
          color={Colors.primary}
          style={{ marginTop: 16 }}
        />

        <Text style={styles.loadingTitle}>
          Loading Player Profile
        </Text>

        <Text style={styles.loadingText}>
          Preparing player information...
        </Text>
      </View>
    );
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
            <Text style={styles.headerEyebrow}>
              RPCA ACADEMY
            </Text>

            <Text style={styles.headerTitle}>
              Edit Player
            </Text>

            <Text style={styles.headerSubtitle}>
              Update the complete player profile
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
          <View style={styles.progressTextRow}>
            <Text style={styles.progressLabel}>
              PROFILE COMPLETION
            </Text>

            <Text style={styles.progressValue}>
              {Math.round((formProgress / 6) * 100)}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    (formProgress / 6) * 100
                  )}%`,
                },
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons
              name="create-outline"
              size={20}
              color={Colors.primary}
            />
          </View>

          <View style={styles.introCopy}>
            <Text style={styles.introTitle}>
              Player Profile Editor
            </Text>

            <Text style={styles.introText}>
              Review and update personal, cricket, parent and academy
              information. Changes will be saved to the RPCA player record.
            </Text>
          </View>
        </View>

        <SectionTitle
          number="01"
          icon="person-outline"
          title="Personal Information"
          subtitle="Basic player details"
        />

        <View style={styles.formCard}>
          <Input
            label="Full Name"
            required
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter player full name"
            icon="person-outline"
          />

          <DateField
            label="Date of Birth"
            value={dobDate}
            placeholder="Select date of birth"
            onPress={() => setShowDobPicker(true)}
            error={dobError}
          />

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Text style={styles.label}>Gender</Text>

              <OptionRow
                compact
                options={["Male", "Female"]}
                value={gender}
                onChange={setGender}
              />
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>Blood Group</Text>

              <OptionRow
                compact
                options={[
                  "A+",
                  "A-",
                  "B+",
                  "B-",
                  "O+",
                  "O-",
                  "AB+",
                  "AB-",
                ]}
                value={bloodGroup}
                onChange={setBloodGroup}
              />
            </View>
          </View>

          <Input
            label="Player Mobile"
            value={mobile}
            onChangeText={(value) =>
              setMobile(value.replace(/\D/g, ""))
            }
            placeholder="10 digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            icon="call-outline"
          />

          <Input
            label="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setEmailError(
                value && !isValidEmail(value)
                  ? "Enter a valid email address."
                  : ""
              );
            }}
            placeholder="player@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
            icon="mail-outline"
          />

          <Input
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Player residential address"
            multiline
            icon="location-outline"
          />

          <Input
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="City"
            icon="business-outline"
          />
        </View>

        <SectionTitle
          number="02"
          icon="baseball-outline"
          title="Cricket Profile"
          subtitle="Playing information & skill"
        />

        <View style={styles.formCard}>
          <Input
            label="Jersey Number"
            value={jerseyNumber}
            onChangeText={setJerseyNumber}
            placeholder="e.g. 18"
            keyboardType="number-pad"
            icon="shirt-outline"
          />

          <ChoiceField
            label="Playing Role"
            options={[
              "Batsman",
              "Bowler",
              "All Rounder",
              "Wicket Keeper",
            ]}
            value={playingRole}
            onChange={setPlayingRole}
          />

          <ChoiceField
            label="Batting Style"
            options={["Right Hand", "Left Hand"]}
            value={battingStyle}
            onChange={setBattingStyle}
          />

          <ChoiceField
            label="Bowling Style"
            options={[
              "Right Arm Fast",
              "Right Arm Medium",
              "Left Arm Fast",
              "Left Arm Spin",
              "Right Arm Spin",
              "None",
            ]}
            value={bowlingStyle}
            onChange={setBowlingStyle}
          />

          <ChoiceField
            label="Skill Level"
            options={[
              "Beginner",
              "Intermediate",
              "Advanced",
            ]}
            value={skillLevel}
            onChange={setSkillLevel}
          />
        </View>

        <SectionTitle
          number="03"
          icon="people-outline"
          title="Parent Information"
          subtitle="Guardian & emergency details"
        />

        <View style={styles.formCard}>
          <View style={styles.parentHighlight}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={Colors.primary}
            />

            <Text style={styles.parentHighlightText}>
              Keep parent contact information updated so RPCA can communicate
              academy updates and emergencies.
            </Text>
          </View>

          <Input
            label="Father Name"
            value={fatherName}
            onChangeText={setFatherName}
            placeholder="Father's name"
            icon="man-outline"
          />

          <Input
            label="Mother Name"
            value={motherName}
            onChangeText={setMotherName}
            placeholder="Mother's name"
            icon="woman-outline"
          />

          <Input
            label="Parent Mobile"
            value={parentMobile}
            onChangeText={(value) =>
              setParentMobile(value.replace(/\D/g, ""))
            }
            placeholder="10 digit parent mobile"
            keyboardType="phone-pad"
            maxLength={10}
            icon="call-outline"
          />

          <Input
            label="Parent Email"
            value={parentEmail}
            onChangeText={(value) => {
              setParentEmail(value);
              setParentEmailError(
                value && !isValidEmail(value)
                  ? "Enter a valid parent email address."
                  : ""
              );
            }}
            placeholder="parent@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={parentEmailError}
            icon="mail-outline"
          />

          <Input
            label="Emergency Contact"
            value={emergencyContact}
            onChangeText={(value) =>
              setEmergencyContact(
                value.replace(/\D/g, "").slice(0, 10)
              )
            }
            placeholder="10 digit emergency contact"
            keyboardType="phone-pad"
            maxLength={10}
            error={emergencyError}
            icon="alert-circle-outline"
          />

          <Input
            label="Parent Address"
            value={parentAddress}
            onChangeText={setParentAddress}
            placeholder="Parent residential address"
            multiline
            icon="location-outline"
          />
        </View>

        <SectionTitle
          number="04"
          icon="business-outline"
          title="Academy Information"
          subtitle="RPCA registration details"
        />

        <View style={styles.formCard}>
          <DateField
            label="Joining Date"
            value={joiningDateValue}
            placeholder="Select academy joining date"
            onPress={() => setShowJoiningPicker(true)}
            error={joiningDateError}
          />

          <View style={styles.joiningNote}>
            <Ionicons
              name="calendar-clear-outline"
              size={16}
              color={Colors.primary}
            />

            <Text style={styles.joiningNoteText}>
              Update the academy joining date if the player's registration
              details have changed.
            </Text>
          </View>
        </View>

        {showDobPicker && (
          <PickerCard
            title="Date of Birth"
            subtitle="Select player's birth date"
            onClose={() => setShowDobPicker(false)}
          >
            <DateTimePicker
              value={dobDate ?? new Date(2010, 0, 1)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={(_, date) => {
                if (Platform.OS === "android") {
                  setShowDobPicker(false);
                }

                if (date) {
                  handleDobChange(date);
                }
              }}
            />
          </PickerCard>
        )}

        {showJoiningPicker && (
          <PickerCard
            title="Joining Date"
            subtitle="Select academy joining date"
            onClose={() => setShowJoiningPicker(false)}
          >
            <DateTimePicker
              value={joiningDateValue}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              minimumDate={dobDate ?? undefined}
              onChange={(_, date) => {
                if (Platform.OS === "android") {
                  setShowJoiningPicker(false);
                }

                if (date) {
                  handleJoiningDateChange(date);
                }
              }}
            />
          </PickerCard>
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.primaryDark, Colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveGradient}
          >
            <View style={styles.saveIcon}>
              <Ionicons
                name={
                  saving
                    ? "sync-outline"
                    : "checkmark-circle-outline"
                }
                size={21}
                color={Colors.white}
              />
            </View>

            <View style={styles.saveCopy}>
              <Text style={styles.saveButtonText}>
                {saving
                  ? "Updating Player..."
                  : "Update Player"}
              </Text>

              <Text style={styles.saveSubText}>
                {saving
                  ? "Saving changes to RPCA records"
                  : "Save updated player information"}
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

        <Text style={styles.secureText}>
          <Ionicons
            name="lock-closed-outline"
            size={10}
          />{" "}
          Player information is stored securely in RPCA academy records.
        </Text>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionTitle({
  number,
  icon,
  title,
  subtitle,
}: {
  number: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionTitle}>
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
        <Text style={styles.sectionText}>{title}</Text>
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
  multiline = false,
  keyboardType,
  maxLength,
  autoCapitalize,
  error,
  icon,
  required = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: any;
  maxLength?: number;
  autoCapitalize?: any;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  required?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      </View>

      <View
        style={[
          styles.inputWrapper,
          multiline && styles.inputWrapperMultiline,
          error && styles.inputWrapperError,
        ]}
      >
        {icon ? (
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
        ) : null}

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

function DateField({
  label,
  value,
  placeholder,
  onPress,
  error,
}: {
  label: string;
  value: Date | null;
  placeholder: string;
  onPress: () => void;
  error?: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.dateField,
          error && styles.dateFieldError,
        ]}
        activeOpacity={0.78}
        onPress={onPress}
      >
        <View style={styles.dateFieldIcon}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={Colors.primary}
          />
        </View>

        <View style={styles.dateFieldText}>
          <Text
            style={[
              styles.dateValue,
              !value && styles.datePlaceholder,
            ]}
          >
            {value
              ? value.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : placeholder}
          </Text>

          {value ? (
            <Text style={styles.dateIso}>
              {value.getFullYear()}-
              {String(value.getMonth() + 1).padStart(2, "0")}-
              {String(value.getDate()).padStart(2, "0")}
            </Text>
          ) : (
            <Text style={styles.dateHint}>Tap to select date</Text>
          )}
        </View>

        <View style={styles.dateArrow}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.textLight}
          />
        </View>
      </TouchableOpacity>

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

function ChoiceField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.choiceField}>
      <Text style={styles.label}>{label}</Text>

      <OptionRow
        options={options}
        value={value}
        onChange={onChange}
      />
    </View>
  );
}

function OptionRow({
  options,
  value,
  onChange,
  compact = false,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.options,
        compact && styles.optionsCompact,
      ]}
    >
      {options.map((option) => {
        const selected = value === option;

        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.option,
              compact && styles.optionCompact,
              selected && styles.selectedOption,
            ]}
            onPress={() => onChange(option)}
            activeOpacity={0.8}
          >
            {selected ? (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={Colors.white}
              />
            ) : null}

            <Text
              style={[
                styles.optionText,
                selected && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PickerCard({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.pickerCard}>
      <View style={styles.pickerHeader}>
        <View style={styles.pickerHeaderIcon}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={Colors.primary}
          />
        </View>

        <View style={styles.pickerCopy}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <Text style={styles.pickerSubtitle}>{subtitle}</Text>
        </View>

        <TouchableOpacity
          style={styles.pickerClose}
          onPress={onClose}
        >
          <Ionicons
            name="close"
            size={18}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
  },

  loaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 16,
  },

  loadingText: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 6,
    textAlign: "center",
  },

  /* =========================
     HEADER
  ========================= */

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

  backButton: {
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
    marginLeft: 12,
  },

  headerEyebrow: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 3,
  },

  headerTitle: {
    color: Colors.white,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.3,
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

  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontSize: 9,
    fontWeight: "900",
  },

  progressTrack: {
    height: 5,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: Colors.white,
  },

  /* =========================
     CONTENT
  ========================= */

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  introCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 17,
    padding: 13,
    marginBottom: 20,
  },

  introIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  introCopy: {
    flex: 1,
    marginLeft: 11,
  },

  introTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "900",
  },

  introText: {
    color: Colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 3,
  },

  /* =========================
     SECTION
  ========================= */

  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
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

  sectionText: {
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
    marginBottom: 21,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },

  /* =========================
     INPUT
  ========================= */

  inputGroup: {
    marginBottom: 14,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  label: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.1,
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

  /* =========================
     TWO COLUMN
  ========================= */

  twoColumn: {
    flexDirection: "row",
    gap: 10,
  },

  column: {
    flex: 1,
  },

  /* =========================
     DATE
  ========================= */

  dateField: {
    minHeight: 59,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  dateFieldError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },

  dateFieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  dateFieldText: {
    flex: 1,
    marginLeft: 10,
  },

  dateValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "900",
  },

  datePlaceholder: {
    color: Colors.textLight,
    fontWeight: "600",
  },

  dateIso: {
    color: Colors.textSecondary,
    fontSize: 8,
    marginTop: 3,
  },

  dateHint: {
    color: Colors.textSecondary,
    fontSize: 8,
    marginTop: 3,
  },

  dateArrow: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  /* =========================
     OPTIONS
  ========================= */

  choiceField: {
    marginBottom: 8,
  },

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 9,
  },

  optionsCompact: {
    gap: 5,
    marginBottom: 5,
  },

  option: {
    minHeight: 38,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  optionCompact: {
    minHeight: 34,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  selectedOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },

  optionText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
  },

  selectedOptionText: {
    color: Colors.white,
    fontWeight: "900",
  },

  /* =========================
     PARENT / ACADEMY
  ========================= */

  parentHighlight: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 10,
    marginBottom: 13,
  },

  parentHighlightText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 8,
    lineHeight: 14,
    marginLeft: 7,
  },

  joiningNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 11,
    padding: 9,
    marginTop: 1,
  },

  joiningNoteText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 8,
    lineHeight: 13,
    marginLeft: 7,
  },

  /* =========================
     PICKER
  ========================= */

  pickerCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 13,
    marginBottom: 14,
  },

  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  pickerHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  pickerCopy: {
    flex: 1,
    marginLeft: 9,
  },

  pickerTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "900",
  },

  pickerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 8,
    marginTop: 2,
  },

  pickerClose: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  /* =========================
     SAVE
  ========================= */

  saveButton: {
    borderRadius: 17,
    overflow: "hidden",
    marginTop: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveGradient: {
    minHeight: 67,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  saveIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  saveCopy: {
    flex: 1,
    marginLeft: 10,
  },

  saveButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "900",
  },

  saveSubText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 8,
    marginTop: 3,
  },

  secureText: {
    color: Colors.textSecondary,
    fontSize: 8,
    textAlign: "center",
    marginTop: 12,
  },

  bottomSpace: {
    height: 25,
  },
});
